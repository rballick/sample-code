import React, { useState, useEffect, useRef } from 'react';
import { Player, List, Queue } from '../containers';
import { Header, SaveForm, Footer } from '../components';
import Controls from '../components/controls.component';
import { useQueue } from '../contexts/QueueContext';
import { useSound } from '../contexts/SoundContext';
import { ControlsProvider } from '../contexts/ControlsContext';
import useApi from '../hooks/useApi';
import usePrevious from '../hooks/usePrevious';
import { setClassName } from '../utilities/utils';
import { channels } from '../../shared/constants';
const { ipcRenderer } = window.require('electron');

import logo from '../../public/assets/icon.png';
import styles from '../styles/app-container.module.css';

function AppContainer () {
	const { togglePause, stop, play, isPaused, isPlaying, isFinished, error } = useSound();
	const { updateQueue, getQueue, toggleShuffle, isShuffled, createPlayQueue, clearPlayQueue, prev, next, getLength, hasNext, hasPrev, removed, toggleRepeat } = useQueue();
	const api = useApi();
	const { setUrl, ping, isOffline, apiCall } = api;
	const [ viewType, setViewType ] = useState('list');
	const [ listType, setListType ] = useState('track');
	const [ isFormOpen, setIsFormOpen ] = useState(false);
	const [ filter, setFilter ] = useState('');
	const [ track, setTrack ] = useState();
    const [ repeat, setRepeat ] = useState(0);
    const [ playlists, setPlaylists ] = useState([]);
    const [ cache, setCache ] = useState(null);
    const prevCache = usePrevious(cache);
    const isLoaded = useRef(false)
	const length = getLength();

    useEffect(() => {
		ping();
        isLoaded.current = true;
        ipcRenderer.on(channels.GET_CACHE, (e, objCache) => {
            setCache(objCache);
        });
        return () => {
            isLoaded.current = false;
            ipcRenderer.removeAllListeners();
        };
    }, [ ]);

    useEffect(() => {
        if (error) {
            hasNext() ? playTrack(next()) : stopTrack();
            ping();
        }
    }, [ error ]);

    useEffect(() => {
        if (repeat) toggleRepeat();
    }, [ repeat ]);

    useEffect(() => {
        if (isPlaying() && removed.includes(track.index)) playTrack(next());
    }, [ removed ])

	useEffect(() => {
		if (length === 0) {
            if (isPlaying()) stopTrack();
            setViewType('list');
        }
	}, [ length ])

	useEffect(() => {
		if (isOffline) {
            setIsFormOpen(false);
        } else {
            getPlaylists();
        }
        changeMode();
	}, [isOffline ])

    useEffect(() => {
		if (isFinished) playTrack(repeat === -1 ? track : next());
	}, [ isFinished ]);

    useEffect(() => {
        if (prevCache === null && getQueue().length) updateQueue(cache.track.filter(item => getQueue().map(item => item.id).includes(item.id))); 
    }, [cache])

    const changeMode = async () => {
        if (isOffline) return ipcRenderer.send(channels.GET_CACHE);
        if (getQueue().length) updateQueue((await apiCall(`track?id=${getQueue().map(item => item.id).join(',')}`)).data);
        setCache(null);
    };

    const getPlaylists = async () => {
        let results = await apiCall('playlist');
        if (isLoaded.current) setPlaylists(results.data);
    }

    const savePlaylist = async (playlistId, name, action) => {
        let id = playlistId;
        let ids = getQueue().map(item => item.id);
        if (id === 0) {
            const results = await(apiCall('playlist', 'post', { name: name }));
            id = results.data[0].id;
            ids = ids.map((id, index) => { return { id, track_order: index + 1}})
        } else {
            const setTrackData = (item) => {
                const { id, date_added, track_order } = item;
                return { id, date_added, track_order }
            }
            let results = { data: [] };
            if (action !== 'replace') {
                results = await apiCall(`playlist/${id}/tracks`);
                const trackIds = results.data.map(item => item.track_id);
                if (action !== 'append') ids = ids.filter(item => !trackIds.includes(item.id));
            }
            ids = [ ...results.data.map(setTrackData), ...ids.map((id, index) => { return { id, track_order: results.data.length + index + 1} }) ];
        }
        await apiCall(`playlist/${id}/track`, 'post', ids);
        if (isLoaded.current) {
            getPlaylists();
            setIsFormOpen(false);
        }
    }

	const playTrack = (track) => {
        if (length === 0 ) return;
        setTrack(track);
        if (!track) return stopTrack();
        play(track.isCached ? require(`../../public/assets/cache/audio/${track.stream_url}`) : setUrl(track.stream_url));
	}

	const stopTrack = () => {
		stop();
		clearPlayQueue();
        setTrack(null);
	}
    
	const updateView = (view) => {
        if (view === 'list' || length) setViewType(view);
        return false;
    }

	const updateFilter = (e) => setFilter(typeof e === 'object' ? e.target.value : e);

	const modules = {
		queue: Queue,
		list: List,
		player: Player
	}
	const Module = modules[viewType];
    const controls = {
        length,
        playing: isPlaying(),
        paused: isPaused(),
        shuffled: isShuffled(),
        hasNext: hasNext(),
        hasPrev: hasPrev(),
        getCurrent: createPlayQueue,
        getNext: next,
        getPrev: prev,
        play: playTrack,
        stop: stopTrack,
        pause: togglePause,
        shuffle: toggleShuffle,
        repeatClick: () => setRepeat(current => current === 1 ? -1 : current + 1),
        repeat
    }

	const props = {
		header: {
			viewType,
			updateView,
			disabled: length ? [] : ['queue','player'],
            isOffline,
            logo
		},
		body: {
			...api,
		}
	}
    if (viewType === 'list') {
		Object.assign(props.header, { listType, filter, updateFilter });
		Object.assign(props.body, { listType, cache, updateType: (type) => setListType(type), filter, updateFilter } )
	}
	if (viewType === 'queue') {
		Object.assign(props.header, { isFormOpen, openForm: () => setIsFormOpen(!isFormOpen) })
	}
	if (viewType === 'player') {
		Object.assign(props.body, { track });
	}
	return (
		<ControlsProvider {...controls} >
		<div className={setClassName("my-tunes",styles)}>
			<Header { ...props.header } />
			{ viewType == 'queue' && <div className={setClassName('form-container', styles)}>
				<div className={setClassName('form', styles)} style={{height: `${isFormOpen ? 95 : 0}px`}}>
					<SaveForm playlists={playlists} onSubmit={savePlaylist} />
				</div>
			</div> }
			<div className={setClassName('main-node', styles)} style={{visibility: 'visible'}}>{ Module && <Module { ...props.body } /> }</div>
			<Footer player={viewType === 'player'}>
				<div>
				{ viewType === 'player' ? 
				<div className={setClassName('logo', styles)}>
					<div>myTunes </div>
					<img src={logo} className={setClassName('logo-img', styles)}  />
				</div> : 
				<Controls footer={true} /> }
				</div>
			    { isOffline && <div className={setClassName('offline', styles)}>Currently offline. <a onClick={ping}>Retry?</a></div>}
			</Footer>
		</div>
		</ControlsProvider>
	);
}

export default AppContainer;