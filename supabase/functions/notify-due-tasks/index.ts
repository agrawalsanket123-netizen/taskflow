import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')!
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n')

serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  async function logToDB(message: string, details: any = {}) {
    await supabase.from('debug_logs').insert({ message, details })
    console.log(message, details)
  }

  await logToDB("V5 Trigger started.");

  // 1. Get all active FCM tokens and their timezones
  const { data: userTokens, error: tokenError } = await supabase
    .from('fcm_tokens')
    .select('user_id, token, timezone')
    .not('token', 'is', null)

  if (tokenError) {
    await logToDB("Error fetching tokens", tokenError);
    return new Response(JSON.stringify({ error: tokenError.message }), { status: 500 });
  }

  await logToDB(`Processing ${userTokens?.length || 0} users.`);

  const notificationsSent = []
  
  for (const ut of userTokens || []) {
    const { user_id, token, timezone = 'UTC' } = ut;
    
    // Calculate local time for this user
    const formatterDate = new Intl.DateTimeFormat('en-CA', { // YYYY-MM-DD
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formatterTime = new Intl.DateTimeFormat('en-GB', { // HH:mm
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const now = new Date();
    const localTodayStr = formatterDate.format(now);
    const localTimeStr = formatterTime.format(now);
    
    const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const localTimeAgoStr = formatterTime.format(twoMinsAgo);

    await logToDB(`User check ${user_id}`, { timezone, localTodayStr, localTimeAgoStr, localTimeStr });

    // 2. Query due tasks for this user in their local time
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user_id)
      .eq('done', false)
      .eq('date', localTodayStr)
      .gte('due_time', localTimeAgoStr)
      .lte('due_time', localTimeStr)

    if (taskError) {
      await logToDB(`Error fetching tasks for ${user_id}`, taskError);
      continue;
    }

    if (tasks && tasks.length > 0) {
      await logToDB(`DUE TASKS FOUND for ${user_id}`, { count: tasks.length, tasks: tasks.map(t => t.title) });
      for (const task of tasks) {
        const result = await sendFcmNotification(token, task.title, `Due at ${task.due_time}`);
        await logToDB(`FCM Result for ${task.id}`, { result });
        notificationsSent.push({ task_id: task.id, user_id, status: result });
      }
    } else {
        await logToDB(`No due tasks for ${user_id} in window.`);
    }
  }

  return new Response(JSON.stringify({ success: true, sent: notificationsSent.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function sendFcmNotification(token: string, title: string, body: string) {
  try {
    const jwt = await createJwt(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
    
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            android: { priority: 'high' },
            webpush: {
              notification: {
                icon: 'https://taskflow-xi-two.vercel.app/icons/icon-192.png',
                badge: 'https://taskflow-xi-two.vercel.app/icons/icon-192.png'
              }
            }
          }
        })
      }
    )
    
    const resText = await response.text();
    if (!response.ok) {
        console.error("FCM Send Error:", resText);
        return `error: ${resText}`;
    }
    
    return 'success'
  } catch (err) {
    console.error("sendFcmNotification Exception:", err);
    return `exception: ${err}`;
  }
}

async function createJwt(clientEmail: string, privateKey: string) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = btoa(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }))
  
  return await fetchAccessToken(header, payload, privateKey)
}

async function fetchAccessToken(header: string, payload: string, privateKey: string) {
  const unsignedToken = `${header}.${payload}`;

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwtToken = `${unsignedToken}.${encodedSignature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
  });

  const data = await response.json();
  return data.access_token;
}
