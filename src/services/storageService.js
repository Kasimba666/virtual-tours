// src/services/storageService.js
import supabase from './supabaseClient'

export default {
    uploadPanorama(file, sceneId) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${sceneId}-${Date.now()}.${fileExt}`
        const filePath = `panoramas/${fileName}`

        return supabase.storage
            .from('panoramas')
            .upload(filePath, file)
            .then(function(result) {
                if (result.error) {
                    throw result.error
                }

                return supabase.storage
                    .from('panoramas')
                    .getPublicUrl(filePath)
            })
            .then(function(result) {
                return result.data.publicUrl
            })
            .catch(function(error) {
                console.error(error)
                throw error
            })
    },
    deleteFileByUrl(url) {
        const path = url.split('/storage/v1/object/public/panoramas/')[1]

        return supabase.storage
            .from('panoramas')
            .remove([path])
            .then((result) => {
                if (result.error) throw result.error
                return true
            })
    }

}
