// Import React
import React from 'react';
import { setClassName } from '../utilities/utils';
import { channels } from '../../shared/constants';

import styles from '../styles/header.module.css';

const { ipcRenderer } = window.require('electron');

export default function Header(props) {
    const { viewType, updateView, listType, disabled, filter, updateFilter, isFormOpen, openForm, isOffline, logo } = props
    const links = [
        <span key="list" className={setClassName('list',styles)} onClick={() => updateView('list') }>edit queue</span>,
        <span key="queue" className={setClassName(['queue', disabled.includes('queue') ? 'disabled' : ''],styles)} onClick={() => updateView('queue') }>view queue</span>,
        <span key="player" className={setClassName(['player', disabled.includes('player') ? 'disabled' : ''],styles)} onClick={() => updateView('player') }>player</span>
    ].filter(link => link.key !== viewType);

    const send = (channel) => {
        ipcRenderer.send(channels[channel]);
    };

    return (
        <header className={setClassName("titlebar")}>
            <div className={setClassName("draggable",styles)}>
                <div className={setClassName("logo", styles)}>
                    <img src={logo} />
                    <div>myTunes </div>
                </div>
                <div className={setClassName("controls",styles)}>
                    <span className={setClassName(["button", "minimize"], styles)} onClick={() => send('WIN_MIN')}>&ndash;</span>
                    <span className={setClassName(["button", "close"], styles)} onClick={() => send('WIN_CLOSE')}>&times;</span>
                </div>
            </div>
            <div className={setClassName('header', styles)}>
                { links[0] }
                <div className={setClassName('middle', styles)}>
                { viewType === 'list' ?
                <input style={{visibility: viewType === 'list' ? 'visible' : 'hidden'}} type="text" placeholder={`filter by ${listType}`} value={filter || ''} onChange={updateFilter} />
                : ( viewType === 'queue' && !isOffline ? <span onClick={openForm}>{ isFormOpen ? 'close form' : 'save queue' }</span> : null)
            }
                </div>
                { links[1] }
            </div>
        </header>
    )
}
