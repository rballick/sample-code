import React, { useEffect, useRef } from 'react';
import { setClassName } from '../utilities/utils';

import styles from '../styles/details.module.css';

export default function Details(props) {
    const { track } = props;
    const titleRef = useRef();
    const artistsRef = useRef();
    const albumRef = useRef();

    useEffect(() => {
        if (track) [titleRef, artistsRef, albumRef].forEach(elem => stopTransition({ target: elem.current.querySelector('span')}));
    }, [ track ]);

    const transition = (e) => {
        if (e.target.tagName === 'SPAN') {
            const span = e.target;
            span.removeEventListener('transitionend', transition);
            const diff = Math.min(0, span.parentElement.offsetWidth - span.offsetWidth);
            if (diff < 0) {
                if (window.getComputedStyle(span, null).getPropertyValue("margin-left") === '0px') {
                    span.style.transitionDuration = `${Math.abs(diff)/40}s`;
                    span.style.marginLeft = `${diff}px`;
                    span.style.transitionDelay = '1s';
                } else {
                    span.style.transitionDuration = '0s';
                    span.style.marginLeft = '0px';
                    span.style.transitionDelay = '0s';
                }
                span.addEventListener('transitionend', transition);
            }
        }
    };
    const stopTransition = (e) => {
        if (e.target.tagName === 'SPAN') {
            const span = e.target;
            span.removeEventListener('transitionend', transition);
            span.style.transitionDuration = '0s';
            span.style.transitionDelay = '0s';
            span.style.marginLeft = '0px';
        }
    }


    if (!track) return (<div className={setClassName('details', styles)}></div>);
    return(
        <div className={setClassName('details', styles)} onMouseOver={transition} onMouseOut={stopTransition}>
            <div ref={titleRef} className={setClassName('title', styles)}><span>{track.title}</span></div>
            <div ref={artistsRef} className={setClassName('artists', styles)}><span>{track.artists}</span></div>
            <div key="album" ref={albumRef} className="album"><span>{track.album} [{track.album_artist}] ({track.album_year})</span></div>
        </div>
    )
}
