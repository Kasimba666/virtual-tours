// src/services/authService.js
import supabase from './supabaseClient'

export default {
    getSession() {
        return supabase.auth.getUser()
            .then(function(result) {
                return result.data.user || null
            })
    },
    login(email, password) {
        return supabase.auth.signInWithPassword({ email, password })
            .then(function(result) {
                return result.data.user
            })
    },
    logout() {
        return supabase.auth.signOut()
    }
}
