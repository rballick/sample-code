import React from 'react';
import { setClassName } from '../utilities/utils';

import VolumeOn from '../../public/assets/player/volume.svg';
import VolumeOff from '../../public/assets/player/mute.svg';

import styles from '../styles/volume.module.css';

export default function Volume(props) {
	const { muted, volume, muteClick, volumeChange } = props;

    return(
		<div className={setClassName("volume", styles)}>
			<div><img className={setClassName(muted ? 'off' : 'on', styles)} src={muted ? VolumeOn : VolumeOff} alt={`volume ${muted ? 'on' : 'off'}`} onClick={muteClick} /></div>
			<input type="range" min="0" max="100" step="1" value={volume} onChange={volumeChange} />
		</div>
    )
}
