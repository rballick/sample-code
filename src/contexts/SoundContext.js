import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import soundCreator from '../utilities/sound';
const SoundContext = createContext(null);

export function SoundProvider(props) {
    const soundRef = useRef();
    const [ playing, setPlaying ] = useState(false);
    const [ paused, setPaused ] = useState(false);
    const [ muted, setMuted ] = useState(false);
    const [ volume, setVolume ] = useState(50);
    const [ elapsed, setElapsed ] = useState(0);
    const [ duration, setDuration ] = useState(0);
    const [ isFinished, setIsFinished ] = useState(false);
    const [ sound, setSound ] = useState(null);
    const [ error, setError ] = useState(false);
    const stopCreatingSound = useRef(() => {});

    useEffect(() => {
        return () => {
            removeSound();
        }
    }, []);

    useEffect(() => {
        if (error) setError(false);
    }, [ error ]);

    useEffect(() => {
        updateStatus();
    }, [ playing, paused, sound ]);

    useEffect(() => {
        if (soundRef.current) soundRef.current.setVolume(muted ? 0 : volume);
    }, [ volume, muted ]);

    const togglePause = () => setPaused(!paused);
    const toggleMute = () => setMuted(!muted);
    const updateVolume = (value) => setVolume(value);
    const updateElapsed = (value) => setElapsed(value);
    const play = (url) => {
        setIsFinished(false);
        setElapsed(0);
        createSound(url);
        if (url && !playing) setPlaying(true);
    }
    const isPlaying = () => playing;
    const isPaused = () => paused;
    const isMuted = () => muted;
    const stop = () => {
        setPlaying(false);
        removeSound();
    }

	const updateDuration = (audio) => {
		if (!audio?.duration) return;
		if (Math.floor(audio.duration) !== Math.floor(duration)) setDuration(audio.duration);
	}

    const updateStatus = () => {
        if (!sound) return;
        if (playing) {
            if (sound.playState === 0) sound.play();
            if (paused) {
                if (!sound.paused) sound.pause();
            } else {
                if (sound.paused) sound.resume();
            }
        } else {
            if (sound.playState !== 0) sound.stop();
            removeSound();
            setElapsed(0);
            setPaused(false);
        }
    }

    const updatePosition = (position) => {
        sound.setPosition(Math.round(position));
        updateElapsed(position);
    }
	
	const finishPlaying = () => {
		setIsFinished(true);
	}
    
    const onError = (errorCode, description, sound) => {
        setError({ [errorCode]: description });
    }
    const createSound = (url) => {
        removeSound();
        stopCreatingSound.current = soundCreator({
			url,
			volume: muted ? 0 : volume, 
			position: 0,
			whilePlaying: (audio) => setElapsed(audio.position), 
			onLoad: updateDuration,
			onFinish: finishPlaying, 
            onError
        }, sound => {
            setSound(sound);
        });
    }

    const removeSound = () => {
        if (typeof stopCreatingSound.current === 'function') stopCreatingSound.current();
        if (sound) {
            try {
                sound.destruct();
            } catch (e) {
                console.warn(e);
            }
    
            setSound(null);
        }
    }
	let soundNode;

    return (
        <SoundContext.Provider value={{ togglePause, toggleMute, updateVolume, updatePosition, stop, play, isPaused, isMuted, isPlaying, volume, elapsed, isFinished, duration, error }}>
            { soundNode }
            { props.children }
        </SoundContext.Provider>
    )
}

export function useSound() {
    const context = useContext(SoundContext);
    if (!context) throw new Error('Sound Provider Not Being Used');
    return context;
}
