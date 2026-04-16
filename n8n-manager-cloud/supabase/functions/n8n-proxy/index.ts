// supabase/functions/n8n-proxy/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProxyRequest {
  action: 'verify' | 'list' | 'update'
  // For verify: n8nUrl and apiKey are provided directly (not yet stored)
  n8nUrl?: string
  apiKey?: string
  // For list/update: credentials fetched from DB
  workflowId?: string
  payload?: Record<string, unknown>
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate the user via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create user-scoped client to verify JWT and get user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: ProxyRequest = await req.json()

    // Service role client to access Vault and user_connections
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let n8nUrl: string
    let apiKey: string

    if (body.action === 'verify') {
      // During onboarding: credentials provided directly, not yet stored
      if (!body.n8nUrl || !body.apiKey) {
        return new Response(JSON.stringify({ error: 'n8nUrl and apiKey required for verify' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      n8nUrl = body.n8nUrl
      apiKey = body.apiKey
    } else {
      // For list/update: fetch stored credentials
      const { data: conn, error: connError } = await supabaseAdmin
        .from('user_connections')
        .select('n8n_url, api_key_secret')
        .eq('user_id', user.id)
        .single()

      if (connError || !conn) {
        return new Response(JSON.stringify({ error: 'No connection configured' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      n8nUrl = conn.n8n_url

      // Fetch the actual API key from Vault
      const { data: secretData, error: secretError } = await supabaseAdmin.rpc('vault_decrypted_secrets', {
        secret_name: conn.api_key_secret,
      })

      if (secretError || !secretData || secretData.length === 0) {
        return new Response(JSON.stringify({ error: 'Failed to retrieve API key' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      apiKey = secretData[0].decrypted_secret
    }

    // Normalise the base URL
    const baseUrl = n8nUrl.replace(/\/$/, '')
    const workflowsUrl = baseUrl.includes('/api/v1/workflows')
      ? baseUrl
      : `${baseUrl}/api/v1/workflows`

    const n8nHeaders = {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey,
    }

    let n8nResponse: Response

    if (body.action === 'verify' || body.action === 'list') {
      // Fetch first page (verify) or all pages (list)
      const params = new URLSearchParams({ limit: body.action === 'verify' ? '1' : '250' })
      const allWorkflows: unknown[] = []
      let cursor: string | undefined

      do {
        if (cursor) params.set('cursor', cursor)
        const url = `${workflowsUrl}?${params.toString()}`
        n8nResponse = await fetch(url, { method: 'GET', headers: n8nHeaders })

        if (!n8nResponse.ok) {
          const text = await n8nResponse.text()
          return new Response(JSON.stringify({ error: `n8n returned ${n8nResponse.status}: ${text}` }), {
            status: n8nResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const page = await n8nResponse.json()
        if (body.action === 'verify') {
          // Just return success for verify
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        allWorkflows.push(...(page.data ?? []))
        cursor = page.nextCursor
      } while (cursor)

      return new Response(JSON.stringify({ data: allWorkflows }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.action === 'update') {
      if (!body.workflowId || !body.payload) {
        return new Response(JSON.stringify({ error: 'workflowId and payload required for update' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      n8nResponse = await fetch(`${workflowsUrl}/${body.workflowId}`, {
        method: 'PATCH',
        headers: n8nHeaders,
        body: JSON.stringify(body.payload),
      })

      const result = await n8nResponse.json()
      return new Response(JSON.stringify(result), {
        status: n8nResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
