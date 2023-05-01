import React from 'react';

import { formatMilliseconds, setClassName } from '../utilities/utils';

import styles from '../styles/progress.module.css';

export default function Progress(props) {
    const { onClick, elapsed, duration, isPlaying } = props;
    return(
        <div className={setClassName("progress", styles)}>
            { isPlaying && 
            <>
            <span className={setClassName("player__time-elapsed", styles)}>{ formatMilliseconds(elapsed, 'm', true) }</span>
            <progress value={duration === 0 ? 0 : elapsed / duration} max="1" onClick={onClick}></progress>
            <span className={setClassName("player__time-total", styles)}>{ formatMilliseconds(duration - elapsed, 'm', true) }</span>
            </>
            }
        </div>
    )
}
