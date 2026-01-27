// src/store/index.js
import { createStore } from 'vuex'
import auth from './auth'
import tours from './tours'

export default createStore({
    modules: {
        auth,
        tours
    }
})
