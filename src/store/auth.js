// src/store/auth.js
import authService from '@/services/authService'

export default {
    namespaced: true,
    state() {
        return {
            user: null
        }
    },
    getters: {
        isAuthenticated(state) {
            return !!state.user
        },
        currentUser(state) {
            return state.user
        }
    },
    mutations: {
        setUser(state, user) {
            state.user = user
        }
    },
    actions: {
        initSession({ commit }) {
            return authService.getSession()
                .then(function(user) {
                    commit('setUser', user)
                })
                .catch(function() {
                    commit('setUser', null)
                })
        },
        login({ commit }, { email, password }) {
            return authService.login(email, password)
                .then(function(user) {
                    commit('setUser', user)
                })
        },
        logout({ commit }) {
            return authService.logout()
                .then(function() {
                    commit('setUser', null)
                })
        }
    }
}
