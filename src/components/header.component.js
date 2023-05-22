// Import React
import React, { useRef, useEffect } from 'react';
import { setClassName, getRect } from '../utilities/utils';
import { channels } from '../../shared/constants';

import Close from '../../public/assets/close.svg';
import Save from '../../public/assets/save.svg';

import styles from '../styles/header.module.css';

const { ipcRenderer } = window.require('electron');

export default function Header(props) {
    const { viewType, updateView, updateType, listType, filter, updateFilter, isFormOpen, openForm, isOffline, disabled, logo, viewLink, loading } = props;
    const isOpen = useRef(null);
    
    useEffect(() => {
        ipcRenderer.on(channels.IMPORT_FILES, _ => showLinks());
        return () => {
            ipcRenderer.removeAllListeners();
        };
    }, [] );

    useEffect(() => {
        if (isOpen.current) {
            document.body.removeChild(isOpen.current);
            isOpen.current = null;
        }
    }, [ viewType ]);

    const links = {
        file:[
            { label: 'add file', shortcut: 'Shift+Ctl+F', method: () => ipcRenderer.send(channels.IMPORT_FILES)},
            { label: 'add directory', shortcut: 'Shift+Ctl+D', method: () => ipcRenderer.send(channels.IMPORT_FILES, true)},
            { label: 'change directory', shortcut: 'Ctl+D', method: () => ipcRenderer.send(channels.IMPORT_FILES, true, true )}
        ]
    }
    let view;
    if (viewLink) {
        view = Object.keys(viewLink)[0];
        if (viewLink[view].length > 1) {
            links[view] = viewLink[view].map(link => {
                return { type: link, label: `${link} list`, method: () => { updateView(view); updateType(link); } }
            })
        }
    }
    const send = (channel) => {
        ipcRenderer.send(channels[channel]);
    };

    const addLinks = (type, toAppend) => {
        for (let i=0;i<links[type].length;i++) {
            const link = links[type][i];
            const div = document.createElement('div');
            const span = document.createElement('span');
            span.className = styles.link;
            if (disabled.includes(link.type)) span.classList.add(styles.disabled);
            const text = document.createTextNode(link.label);
            div.addEventListener('click', disabled.includes(link.type) ? () => { return false } : link.method);
            span.appendChild(text);
            div.appendChild(span);
            if (link.shortcut) {
                const span = document.createElement('span');
                const text = document.createTextNode(link.shortcut);
                span.appendChild(text);
                div.appendChild(span);
            }
            toAppend.appendChild(div);
        }
    }

    const showLinks = (e, type) => {
        if (e && e.currentTarget.classList.contains('disabled')) return;
        if (isOpen.current) {
            document.body.removeChild(isOpen.current);
            isOpen.current = null;
            if (links[type] && links[type].length > 1) return;
        }
        if (!links[type] || links[type].length === 1) return updateView(type);
        const rect = getRect(e.currentTarget);
        const div = document.createElement('div');
        div.className = styles.linklist;
        Object.assign(div.style, {
            left: `${rect.left}px`,
            top: `${rect.bottom}px`
        });
        addLinks(type, div)
        document.body.appendChild(div);
        isOpen.current = div;
    }

    const hover = (e, type) => {
        if (e.currentTarget.classList.contains('disabled')) return;
        Array.from(document.querySelectorAll(`.${styles.hovered}`)).forEach(item => item.classList.remove(styles.hovered));
        e.currentTarget.classList.add(styles.hovered)
        if ((!links[type] || links[type].length === 1) && isOpen.current) return;
        if (!isOpen.current) return;
        isOpen.current.innerHTML = '';
        const rect = getRect(e.currentTarget);
        Object.assign(isOpen.current.style, { top: `${rect.bottom}px`, left: `${rect.left}px` });
        addLinks(type, isOpen.current);
    }

    const removeHover = (e) => {
        if (!isOpen.current) e.currentTarget.classList.remove(styles.hovered);
    }

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
            { viewType !== 'player' && <div className={setClassName('header', styles)}>
                <div onClick={(e) => showLinks(e, 'file')} onMouseOver={(e) => { hover(e,'file')}} onMouseOut={removeHover}>File</div>
                <div className={setClassName(['link', disabled.includes(view) ? 'disabled' : ''], styles)} onClick={(e) => showLinks(e, view)} onMouseOver={(e) => { hover(e,view)}} onMouseOut={removeHover}>{view}</div>
                { viewType === 'list' ?
                ( loading ?
                    <div className={setClassName('loading', styles)}><span>Loading</span></div>
                    :
                    <input type="text" placeholder={`filter by ${listType}`} value={filter || ''} onChange={updateFilter} />)
                : ( viewType === 'queue' && !isOffline ? <div className={setClassName('save', styles)}><img onClick={openForm} src={ isFormOpen ? Close : Save } /></div> : null)
                }
            </div>}
        </header>
    )
}
