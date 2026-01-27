// src/services/toursService.js
import supabase from './supabaseClient'

export default {
    getTours() {
        return supabase
            .from('tours')
            .select('id, name, data')
            .then(function(result) {
                if (result.error) {
                    throw result.error
                }
                return result.data || []
            })
    },

    getTourById(id) {
        return supabase
            .from('tours')
            .select('id, name, data, owner_id')
            .eq('id', id)
            .single()
            .then(function(result) {
                if (result.error) {
                    throw result.error
                }
                return result.data
            })
    },

    createTour(tour) {
        return supabase
            .from('tours')
            .insert(tour)
            .select()
            .then(function(result) {
                if (result.error) {
                    throw result.error
                }
                return result.data
            })
    },

    saveTour(tour) {
        return supabase
            .from('tours')
            .update({
                name: tour.name,
                data: tour.data
            })
            .eq('id', tour.id)
            .select()
            .then(function(result) {
                if (result.error) {
                    throw result.error
                }
                return result.data
            })
    },

    deleteTour(id) {
        return supabase
            .from('tours')
            .delete()
            .eq('id', id)
            .then(function(result) {
                if (result.error) {
                    throw result.error
                }
                return result.data
            })
    }
}
