import React, { createContext, useContext, useState, useEffect } from 'react';

const ControlsContext = createContext(null);

export function ControlsProvider(props) {
    const { length, playing, paused, shuffled, hasNext, hasPrev, getCurrent, getNext, getPrev, play, stop, shuffle, pause, repeat, repeatClick } = props;
    const forward = playing && hasNext;
    const reverse = playing && hasPrev;

    const playClick = () => {
        if (playing) return pause();
		play(getCurrent());
    }

    const nextClick = () => {
        if (forward) play(getNext());
    }

    const prevClick = () => {
        if (reverse) play(getPrev());
    }

    const repeatActions = ['one', 'none', 'all'];

    const value = {
        reverseActive: reverse,
        playAction: !playing || paused ? 'play' : 'pause',
        playActive: length > 0,
        stopActive: playing,
        shuffleActive: shuffled,
        forwardActive: forward,                
        isPaused: paused,
        repeatAction: repeatActions[repeat + 1],
        prevClick, 
        playClick,
        stopClick: stop,
        shuffleClick: shuffle,
        nextClick,
        repeatClick
    }

    return (
        <ControlsContext.Provider value={value}>
            { props.children }
        </ControlsContext.Provider>
    )
}

export function useControls() {
    const context = useContext(ControlsContext);
    if (!context) throw new Error('Controls Provider Not Being Used');
    return context;
}
