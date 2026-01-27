// src/store/tours.js
import toursService from '@/services/toursService'

export default {
    namespaced: true,
    state() {
        return {
            items: [],
            loading: false
        }
    },
    getters: {
        tours(state) {
            return state.items
        }
    },
    mutations: {
        setTours(state, tours) {
            state.items = tours
        },
        setLoading(state, value) {
            state.loading = value
        }
    },
    actions: {
        fetchTours({ commit }) {
            commit('setLoading', true)
            return toursService.getTours()
                .then(function(tours) {
                    commit('setTours', tours)
                })
                .finally(function() {
                    commit('setLoading', false)
                })
        }
    }
}
