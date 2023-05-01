import React from 'react';
import { useControls } from '../contexts/ControlsContext';
import { setClassName } from '../utilities/utils';

import Rewind from '../../public/assets/player/rewind.svg';
import Play from '../../public/assets/player/play.svg';
import Pause from '../../public/assets/player/pause.svg';
import Stop from '../../public/assets/player/stop.svg';
import Repeat from '../../public/assets/player/repeat-bold.svg';
import RepeatOne from '../../public/assets/player/repeat-once-bold.svg';
import Shuffle from '../../public/assets/player/shuffle-bold.svg';

import styles from '../styles/controls.module.css';

export default function Controls(props) {
    const { reverseActive, prevClick, playActive, playClick, stopActive, stopClick, shuffleActive, shuffleClick, nextClick, forwardActive, playAction, repeatAction, repeatClick } = useControls();
    return(
        <div className={setClassName(['controls', props.footer ? 'footer' : ''], styles)}>
          <div className={setClassName(['controls__backward', 'rounded'], styles)}>
              <img className={setClassName(['link', reverseActive ? '' : 'inactive'], styles)} src={Rewind} alt="previous" onClick={prevClick} />
          </div>
          <div className={setClassName("controls__main", styles)}>
              <img className={setClassName(['link', repeatAction === 'none' ? 'inactive' : ''], styles)} src={repeatAction === 'one' ? RepeatOne : Repeat} alt="repeat" onClick={repeatClick} />
              <img className={setClassName(['link', playActive ? '' : 'inactive'], styles)} src={playAction ==='play' ? Play : Pause} alt={playAction === 'play' ? 'play' : 'paused' } onClick={ playClick } />
              <img className={setClassName(['link', stopActive ? '' : 'inactive'], styles)} src={Stop} alt="stop" onClick={stopClick} />
              <img className={setClassName(['link', shuffleActive ? '' : 'inactive'], styles)} src={Shuffle} alt="shuffle" onClick={shuffleClick} />
          </div>
          <div className={setClassName(['controls__forward', 'rounded'], styles)}>
              <img className={setClassName(['link', forwardActive ? '' : 'inactive'], styles)} src={Rewind} alt="next" onClick={nextClick} />
          </div>
        </div>
    );
}
