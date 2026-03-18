import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')!
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n')

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  
  // Calculate window for due tasks (last 5 minutes)
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const fiveMinutesAgoTime = `${String(fiveMinsAgo.getHours()).padStart(2,'0')}:${String(fiveMinsAgo.getMinutes()).padStart(2,'0')}`

  // 1. Get due tasks (scheduled for now)
  const { data: dueTasks } = await supabase
    .from('tasks')
    .select('*, fcm_tokens!inner(token)')
    .eq('done', false)
    .eq('date', todayStr)
    .gte('due_time', fiveMinutesAgoTime)
    .lte('due_time', currentTime)

  // 2. Get reminder tasks (send based on intervalMinutes)
  // For simplicity, we trigger these every 5 minutes if reminder is enabled.
  // In a full implementation, we'd check last_notified_at.
  const { data: reminderTasks } = await supabase
    .from('tasks')
    .select('*, fcm_tokens!inner(token)')
    .eq('done', false)
    .eq('reminder_enabled', true)

  const allTasks = [...(dueTasks || []), ...(reminderTasks || [])]

  // De-duplicate by ID
  const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values())

  // Send FCM notification for each task
  const results = []
  for (const task of uniqueTasks) {
    const token = task.fcm_tokens?.token
    if (!token) continue

    const res = await sendFcmNotification(token, task.title, 
      task.due_time ? `Due at ${task.due_time}` : 'Reminder: Task pending!')
    results.push({ id: task.id, status: res })
  }

  return new Response(JSON.stringify({ sent: uniqueTasks.length, details: results }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function sendFcmNotification(token: string, title: string, body: string) {
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
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              vibrate: [200, 100, 200]
            }
          }
        }
      })
    }
  )
  
  return response.ok ? 'success' : 'error'
}

async function createJwt(clientEmail: string, privateKey: string) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = btoa(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/cloud-platform', // Correct scope for FCM
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }))
  
  // Sign and get access token... 
  // (Re-using the logic from previous implementation as it was more robust for Deno Web Crypto)
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
