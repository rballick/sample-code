const pendingCalls = [];
let initialized = false;

let soundManager;

if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV !== 'production') {
        ({ soundManager } = require('soundmanager2'));
    } else {
        ({ soundManager } = require('soundmanager2/script/soundmanager2-nodebug'));
    }

    soundManager.onready(() => {
        pendingCalls.slice().forEach(callback => callback());
    });
}

export default function createSound(options, callback) {
    if (typeof options.url !== 'string') return;
    const { id, url, onError, whileLoading, onLoad, whilePlaying, onPause, onResume, onStop, onFinish, onBufferChange } = options;
    let sound;
    delete options.id;
    delete options.url;
    const optionTypes = {
        position: 'number',
        volume: 'number',
        playbackRate: 'number',
        onerror: 'function',
        whileloading: 'function',
        onload: 'function',
        whileplaying: 'function',
        onpause: 'function',
        onresume: 'function',
        onstop: 'function',
        onfinish: 'function',
        onbufferchange: 'function',
        autoLoad: 'boolean',
        loop: 'boolean'
    };
    const defaultOptions = {
        position: 0,
        volume: 100,
        playbackRate: 1,
        onerror: (errorCode, description) => { return typeof onError === 'function' ? onError(errorCode, description, sound) : { errorCode, description, sound } },
        whileloading: () => { return typeof whileLoading === 'function' ? whileLoading(sound) : sound },
        whileplaying: () => { return typeof whilePlaying === 'function' ? whilePlaying(sound) : sound },
        onload: () => { return typeof onLoad === 'function' ? onLoad(sound) : sound },
        onpause: () => { return typeof onPause === 'function' ? onPause(sound) : sound },
        onresume: () => { return typeof onResume === 'function' ? onResume(sound) : sound },
        onstop: () => { return typeof onStop === 'function' ? onStop(sound) : sound },
        onfinish: () => { return typeof onFinish === 'function' ? onFinish(sound) : sound },
        onbufferchange: () => { return typeof onBufferChange === 'function' ? onBufferChange(sound) : sound },
        autoLoad: false,
        loop: false
    };
    
    options = { url, ...defaultOptions, ...Object.keys(options).reduce((opts, key) => {
        const value = typeof options[key] === optionTypes[key] ? options[key] : defaultOptions[key]; 
        return { ...opts, [key]: value }
    }, {}) }

    if (id) options.id = id;

    if (soundManager.ok()) {
        sound = soundManager.createSound(options);
        callback(sound);
        return () => {};
    } else {
        if (!initialized) {
            initialized = true;
            soundManager.beginDelayedInit();
        }

        const call = () => {
            callback(soundManager.createSound(options));
        };

        pendingCalls.push(call);

        sound = pendingCalls.splice(pendingCalls.indexOf(call), 1);
        return () => {
            sound;
        };
    }
}

export const playStatuses = {
    PLAYING: 'PLAYING',
    STOPPED: 'STOPPED',
    PAUSED: 'PAUSED'
};

