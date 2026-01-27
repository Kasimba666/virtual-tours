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
                
                // Удаляем общий startView из данных тура, оставляем только startView для каждой сцены
                if (result.data && result.data.data) {
                    const cleanData = { ...result.data.data }
                    delete cleanData.startView
                    result.data.data = cleanData
                }
                
                return result.data
            })
    },

    createTour(tour) {
        // Удаляем общий startView из данных тура, оставляем только startView для каждой сцены
        const cleanTour = { ...tour }
        if (cleanTour.data) {
            cleanTour.data = { ...cleanTour.data }
            delete cleanTour.data.startView
        }

        return supabase
            .from('tours')
            .insert(cleanTour)
            .select()
            .then(function(result) {
                if (result.error) {
                    throw result.error
                }
                return result.data
            })
    },

    saveTour(tour) {
        // Удаляем общий startView из данных тура, оставляем только startView для каждой сцены
        const cleanData = { ...tour.data }
        delete cleanData.startView

        return supabase
            .from('tours')
            .update({
                name: tour.name,
                data: cleanData
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
