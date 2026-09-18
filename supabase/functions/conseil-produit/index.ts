import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { parseRequest, traiterQuestion } from './conseil.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  // Requête de vérification CORS envoyée par le navigateur avant le POST.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const demande = parseRequest(await req.json().catch(() => null))
    if (!demande) {
      return json({ ok: false, code: 'invalide', message: 'Pose ta question en quelques mots.' })
    }

    // La clé Claude reste ici, côté serveur (secret Supabase ANTHROPIC_API_KEY).
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY manquante (supabase secrets set ANTHROPIC_API_KEY=...)')
      return json({ ok: false, code: 'indisponible', message: 'Le conseil automatique est indisponible pour le moment.' })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const resultat = await traiterQuestion(demande, {
      anthropic: new Anthropic({ apiKey }),
      // Lecture du catalogue : clé publique, comme le site (rien d'autre que ce qu'un visiteur voit).
      lecture: createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!),
      // Journal et compteurs : clé service, fournie automatiquement par Supabase à la fonction.
      admin: createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!),
    })

    return json(resultat)
  } catch (err) {
    console.error('Erreur fonction conseil-produit :', err)
    return json(
      { ok: false, code: 'indisponible', message: 'Le conseil automatique est indisponible pour le moment.' },
      500
    )
  }
})
