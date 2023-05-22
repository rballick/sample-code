import React from 'react';

import { setClassName } from '../utilities/utils';
import { formatMilliseconds } from '../../shared/utils';

import styles from '../styles/progress.module.css';

export default function Progress(props) {
    const { onClick, elapsed, duration, isPlaying } = props;
    return(
        <div className={setClassName("progress", styles)}>
            { isPlaying && 
            <>
            <span className={setClassName("player__time-elapsed", styles)}>{ formatMilliseconds(elapsed * 1000, 'm', true) }</span>
            <progress value={duration === 0 ? 0 : elapsed / duration} max="1" onClick={onClick}></progress>
            <span className={setClassName("player__time-total", styles)}>{ formatMilliseconds((duration - elapsed) * 1000, 'm', true) }</span>
            </>
            }
        </div>
    )
}
