import React from 'react';
import { Controls, Details, Progress, Volume } from '../components';
import { useSound } from '../contexts/SoundContext';
import { setClassName } from '../utilities/utils';

import styles from '../styles/player.module.css';

export default function Player(props) {
    const { track, setUrl } = props;
    const { toggleMute, updateVolume, updatePosition, isMuted, isPlaying, volume, elapsed, duration } = useSound();
    const style = {};

    if (isPlaying()) {
        const { artwork_url, isCached } = track;
        const src = artwork_url ? (`, url("${isCached ? require(`../../public/assets/cache/images/${artwork_url}`) : setUrl(artwork_url)}")`) : '';
        style.backgroundImage = `linear-gradient( rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65))${src}`;
    }

    const progress = (e) => {
		const ratio = (e.pageX - e.target.offsetLeft) / e.target.offsetWidth;
		updatePosition(ratio * duration);
	}

    return (
        <div className={setClassName("player", styles)} style={style}>
            <Details track={track} isPlaying={isPlaying()} />
            <Controls />
            <Volume 
            	muted={isMuted()}
                volume={volume}
                muteClick={toggleMute} 
                volumeChange={(e) => updateVolume(e.target.value)}
            />
            <Progress onClick={progress} elapsed={elapsed} duration={duration} isPlaying={isPlaying()} />
        </div>
    )

}
