import { useState } from 'react';
import axios from 'axios';

export const apiUrl = 'http://localhost:8083/api';

export default function useApi() { 
    const [ isOffline, setIsOffline ] = useState(true);

    const apiCall = async (url, method='get', params, config={}) => {
        method = method.toLowerCase();
        if (!/^https?:/.test(url)) {
            const [ path, querystring ] = url.split('?');
            url = path.split('/').map(item => encodeURIComponent(item)).join('/'); 
            if (querystring) {
                url = `${url}?${querystring.split('&').map(query => {
                    const [key,value] = query.split('=');
                    return `${key}${value === undefined ? '' : `=${encodeURIComponent(value)}`}`
                }).join('&')}`;
            }
        }
        const data = {};
        try {
            if (!url || !['get', 'put', 'post', 'delete'].includes(method)) throw 'Error: 500';
            url = setUrl(url);
            Object.assign(config, { url, method });
            if (params) config.data = params;
            const response = await axios.request(config);
            data.data = response.data;
        } catch (e) {
            if (e.code === 'ERR_NETWORK') setIsOffline(true);
            data.error = e;
        } finally {
            return data;
        }
    }
    
    const ping = async () => {
        try {
            const response = await axios.get(apiUrl);
            setIsOffline(false);
            return response.statusText;
        } catch (e) {
            setIsOffline(e.code === 'ERR_NETWORK');
            return e.code;
        }
    }

    const setUrl = (url) => {
        if (isOffline || /^https?:/.test(url)) return url;
        return `${apiUrl}/${url}`;
    }    

    return { apiCall, ping, setUrl, isOffline, apiUrl, setIsOffline }
}
