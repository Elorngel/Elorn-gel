import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Connexion (Supabase Auth) partagée par tout le site : clients et administrateurs utilisent
// le même système, l'admin étant reconnu par sa présence dans la table `admins`.
const AuthContext = createContext(null)

// Les admins se connectent avec un simple nom ("sylvie", "romuald") : on le transforme en
// identifiant interne, sans boîte mail réelle derrière.
export const emailAdmin = (nom) => `${nom.trim().toLowerCase()}@admin.bontin.fr`

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = on ne sait pas encore
  const [client, setClient] = useState(null)
  const [estAdmin, setEstAdmin] = useState(false)
  const [profilCharge, setProfilCharge] = useState(false)

  useEffect(() => {
    // Ancien système de connexion admin (avant le 21/10/2026), devenu inutile.
    try {
      localStorage.removeItem('bontin-admin-auth-v2')
      localStorage.removeItem('elorngel-admin-auth')
    } catch {
      // stockage indisponible : rien à nettoyer
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data } = supabase.auth.onAuthStateChange((_evenement, s) => setSession(s ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id ?? null

  // silencieux : simple mise à jour de la fiche, sans repasser la page en « Chargement… ».
  const chargerProfil = useCallback(async (id, silencieux = false) => {
    if (!id) {
      setClient(null)
      setEstAdmin(false)
      setProfilCharge(true)
      return
    }
    if (!silencieux) setProfilCharge(false)
    const [{ data: fiche }, { data: admin }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).maybeSingle(),
      supabase.from('admins').select('user_id').eq('user_id', id).maybeSingle(),
    ])
    setClient(fiche ?? null)
    setEstAdmin(!!admin)
    setProfilCharge(true)
  }, [])

  // Ne recharger la fiche que si la personne connectée change (pas au renouvellement
  // automatique de la connexion, qui arrive toutes les heures).
  const sessionConnue = session !== undefined
  useEffect(() => {
    if (!sessionConnue) return
    chargerProfil(userId)
  }, [sessionConnue, userId, chargerProfil])

  const connexion = async (email, motDePasse) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse })
    if (error) {
      throw new Error(
        /invalid/i.test(error.message) ? 'Email ou mot de passe incorrect.' : 'Connexion impossible pour le moment.'
      )
    }
  }

  const deconnexion = async () => {
    await supabase.auth.signOut()
  }

  // Crée le compte côté serveur (fonction `creer-compte`), puis connecte le client.
  const creerCompte = async (infos) => {
    const { data, error } = await supabase.functions.invoke('creer-compte', { body: infos })
    if (error) {
      let message = 'Création du compte impossible pour le moment.'
      try {
        const corps = await error.context.json()
        if (corps?.erreur) message = corps.erreur
      } catch {
        // réponse illisible : message générique
      }
      throw new Error(message)
    }
    if (!data?.ok) throw new Error(data?.erreur || 'Création du compte impossible pour le moment.')
    await connexion(infos.email, infos.motDePasse)
  }

  const value = {
    chargement: session === undefined || (!!userId && !profilCharge),
    session,
    user: session?.user ?? null,
    client,
    estAdmin,
    connexion,
    deconnexion,
    creerCompte,
    rechargerProfil: () => chargerProfil(userId, true),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
