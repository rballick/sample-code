import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
const SoundContext = createContext(null);

export function SoundProvider(props) {
    const [ playing, setPlaying ] = useState(false);
    const [ paused, setPaused ] = useState(false);
    const [ muted, setMuted ] = useState(false);
    const [ volume, setVolume ] = useState(.5);
    const [ elapsed, setElapsed ] = useState(0);
    const [ duration, setDuration ] = useState(0);
    const [ isFinished, setIsFinished ] = useState(false);
    const [ error, setError ] = useState(false);
    let sound = useRef();

    useEffect(() => {
        return () => {
            if (playing) stop();
        }
    }, []);

    useEffect(() => {
        if (error) setError(false);
    }, [ error ]);

    useEffect(() => {
        updateStatus();
    }, [ playing, paused ]);

    useEffect(() => {
        if (sound.current) sound.current.volume = muted ? 0 : volume;
    }, [ volume, muted ]);

    useEffect(() => {
        if (isFinished) setIsFinished(false);
    }, [ isFinished ]);

    const togglePause = () => setPaused(!paused);
    const toggleMute = () => setMuted(!muted);
    const updateVolume = (value) => setVolume(value);
    const updateElapsed = (value) => setElapsed(value);
    const play = (url) => {
        let audio
        if (!sound.current) {
            audio = new Audio(url);
            audio.volume = muted ? 0 : volume;
            audio.ontimeupdate = getTime;
            audio.onended = finishPlaying;
        } else {
            audio = sound.current;
            audio.src = url;
        }
        audio.currentTime = 0;
        audio.onloadedmetadata = function() {
            setDuration(audio.duration);
            audio.play();
            sound.current = audio;
        };
        setIsFinished(false);
        setElapsed(0);
        if (url && !playing) setPlaying(true);
    }
    const isPlaying = () => playing;
    const isPaused = () => paused;
    const isMuted = () => muted;
    const stop = () => {
        if (sound.current) {
            sound.current.pause();
            sound.current = null;
        }
        setPlaying(false);
        setPaused(false);
        setElapsed(0);
        setDuration(0);
    }

    const getTime = (e) => {
        updateElapsed(e.currentTarget.currentTime);
    }

    const updateStatus = () => {
        if (!sound.current) return;
        if (playing) {
            if (paused && !sound.current.paused) return sound.current.pause()
            if (!paused && sound.current.paused) return sound.current.play();
        }
        stop();
    }

    const updatePosition = (position) => {
        if (sound.current) sound.current.currentTime = position;
        updateElapsed(position);
    }
	
	const finishPlaying = () => {
		setIsFinished(true);
	}
    
    return (
        <SoundContext.Provider value={{ togglePause, toggleMute, updateVolume, updatePosition, stop, play, isPaused, isMuted, isPlaying, volume, elapsed, isFinished, duration, error }}>
            { props.children }
        </SoundContext.Provider>
    )
}

export function useSound() {
    const context = useContext(SoundContext);
    if (!context) throw new Error('Sound Provider Not Being Used');
    return context;
}
