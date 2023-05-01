import React, { useState } from "react";
import { setClassName } from "../utilities/utils";

import styles from '../styles/saveForm.module.css';

export default function SaveForm(props) {
    const { playlists, onSubmit } = props;
    const [ playlistId, setPlaylistId ] = useState(0);
    const [ name, setName ] = useState('');
    const [ action, setAction ] = useState('append');
    
    const submit = () => {
        setPlaylistId(0);
        setName('');
        setAction('append');
        if (typeof onSubmit === 'function') onSubmit(playlistId, name, action);
    }
    return (
        <form className={setClassName('save-form', styles)} onSubmit={(e => e.preventDefault())}>
            <div>
                <strong>Playlist: </strong>
                <select value={playlistId} onChange={(e) => setPlaylistId(Number(e.target.value))}>
                    <option value={0}>--Add New--</option>
                    { (playlists || []).map(playlist => <option key={`playlist-${playlist.id}`} value={playlist.id}>{ playlist.name }</option>)}
                </select>
            </div>
            <div>
            { Number(playlistId) === 0 ? 
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist Name" />:
                <>
                { ['append', 'append and remove duplicates', 'replace'].map(value => <label key={value}><input type="radio" checked={action === value} onChange={() => setAction(value)} /> {value}</label>) }
                </>
            }
            </div>
            { (playlistId > 0 || (name.length > 0 && !playlists.map(playlist => playlist.name).includes(name))) && <div className={setClassName('submit', styles)}>
                <button onClick={submit}>Save Playlist</button>
            </div>}
        </form>
    )
}