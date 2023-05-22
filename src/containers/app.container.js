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
import { quickSort } from '../../shared/utils';
const { Promise: nodeID3 } = window.require('node-id3');
const { ipcRenderer } = window.require('electron');

import genreImage from '../../public/assets/genre.jpg'
import albumImage from '../../public/assets/album.jpg'
import artistImage from '../../public/assets/artist.jpg'
import trackImage from '../../public/assets/track.jpg'
import logo from '../../public/assets/icon.png';
import styles from '../styles/app-container.module.css';

function AppContainer () {
	const { togglePause, stop, play, isPaused, isPlaying, isFinished, error } = useSound();
	const { updateQueue, getQueue, toggleShuffle, isShuffled, createPlayQueue, clearPlayQueue, prev, next, getLength, hasNext, hasPrev, removed, toggleRepeat, replaceQueue } = useQueue();
	const api = useApi();
    const files = useRef([]);
    const tagged = useRef({});
	const { setUrl, ping, isOffline, apiCall } = api;
	const [ viewType, setViewType ] = useState('list');
	const [ listType, setListType ] = useState('track');
	const [ isFormOpen, setIsFormOpen ] = useState(false);
	const [ filter, setFilter ] = useState('');
	const [ track, setTrack ] = useState();
    const [ filesUpdated, setFilesUpdated ] = useState(new Date().getTime());
    const [ fileData, setFileData ] = useState({});
    const [ repeat, setRepeat ] = useState(0);
    const [ playlists, setPlaylists ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const prevView = usePrevious(viewType);
    const viewPrev = useRef();
    const isLoaded = useRef(false)
	const length = getLength();
    const tagLength = 500;

    useEffect(() => {
		ping();
        isLoaded.current = true;
        ipcRenderer.on(channels.IMPORT_FILES, (e, results, replace) => {
            if (replace) {
                setFileData({});
                tagged.current = {};
                files.current = [];
                replaceAndPlay([]);
            }
            files.current.push(...results.map(file => {
                const name = file.split('/').pop();
                return { id: file, name, title: name, stream_url: file, isFile: true, artwork_url: trackImage };
            }));
            setFilesUpdated(new Date().getTime());
        } );
        ipcRenderer.on(channels.GET_FILE, (e, filedata) => {
            const blob = new Blob( [ Buffer.from(filedata) ], { type: "audio/mpeg" } );
            play(URL.createObjectURL(blob));
        })
        return () => {
            isLoaded.current = false;
            ipcRenderer.removeAllListeners();
        };
    }, [ ]);

    useEffect(() => {
        setLoading(files.current.length > 0);
        if (files.current.length) getTags();
    }, [ filesUpdated ]);

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
	}, [ length ]);

	useEffect(() => {
		if (isOffline) {
            setIsFormOpen(false);
        } else {
            getPlaylists();
        }
	}, [isOffline ])

    useEffect(() => {
		if (isFinished) playTrack(repeat === -1 ? track : next());
	}, [ isFinished ]);

    useEffect(() => {
        if (viewType !== prevView) viewPrev.current = prevView;
    }, [ viewType ]);

    useEffect(() => {
        const queue = getQueue();
//                updateQueue(current => current.filter(item => !Object.keys(tagged).includes(item.id)));
    }, [ fileData ]);

    const getTags = async () => {
        const readTag = async (file) => {
            let tags;
            try {
                tags = nodeID3.read(file.stream_url);
            } catch (e) {
                tags = {}
            } finally {
                return tags;
            }
        }
        const images = {
            album: albumImage,
            performer: artistImage,
            genre: genreImage
        }
        const setTags = (tags) => {
            return tags.reduce((obj, item, i) => {
                item.album_year = item.year;
                if (item.comment && !isNaN(item.comment.text) && item.comment.text.length === 4) item.album_year = item.comment.text;
                item.artists = item.artist;
                item.album_artist = item.performerInfo || item.artists; 
                if (item.image) {
                    const blob = new Blob( [ item.image.imageBuffer ], { type: "image/jpeg" } );
                    item.artwork_url = URL.createObjectURL(blob);
                }
                const data = { ...files.current[i], ...item}
                tagged.current[item.id] = data;
                if (isOffline) {
                    delete data.name;
                    data.performer = data.artists;
                    if (!obj.track) obj.track = {};
                    obj.track[data.id] = data;
                    const types = ['performer', 'genre', 'album'];
                    for (let t = 0; t < types.length; t++) {
                        const item = data[types[t]];
                        if (!item) continue;
                        if (!obj[types[t]]) obj[types[t]] = {};
                        const ids = item.split(';');
                        for (let i = 0; i < ids.length; i++) {
                            const id = ids[i];
                            if (!obj[types[t]][id]) {
                                obj[types[t]][id] = { id, tracks: [] };
                                Object.assign(obj[types[t]][id], types[t] === 'album' ? { ...data, ...{ title: data.album, year: data.album_year } } : { name: id });
                                if (types[t] !== 'album' || data.artwork_url === trackImage) obj[types[t]][id].artwork_url = images[types[t]];
                            }
                            obj[types[t]][id].tracks.push(data.id);
                        }
                    }
                } else {
                    if (!obj.file) obj.file = {};
                    obj.file[data.id] = data;
                }
                return obj 
            }, { ...fileData })
        }
        const promises = files.current.slice(0,tagLength).map(file => readTag(file));
        Promise.all(promises)
        .then(results => setTags(results))
        .then(results => setFileData(results))
        .then(() => files.current = files.current.slice(tagLength))
        .then(() => setFilesUpdated(new Date().getTime()))
    }

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

    const replaceAndPlay = (replacement, id = '') => {
        playTrack(replaceQueue(replacement, replacement.findIndex(item => item.id === id)));
    }

    const playTrack = (track) => {
        if (tagged.current[track?.id]) track = tagged.current[track.id];
        setTrack(track);
        if (!track) return stopTrack();
        if (track.isFile) return ipcRenderer.send(channels.GET_FILE, track.stream_url);
        play(setUrl(track.stream_url));
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

    const updateType = (type) => {
        setListType(type)
    }

    const maximizePlayer = () => {
        if (length === 0) return;
        if (viewType === 'player') {
            return setViewType(viewPrev.current);
        }
        setViewType('player');
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
        repeat,
        maxAction: maximizePlayer 
    }

    let links = ['album','genre','performer', 'track'];
    if (Object.values(fileData.files || {}).length && !isOffline) links.push('file');
    if (!isOffline) links.push('creative', 'playlist','track');
    links = quickSort(links);

    const disabled = links.filter(item => isOffline && !fileData[item]);
    if (length === 0) disabled.push('queue');
    const props = {
		header: {
			viewType,
			updateView,
            updateType,
			disabled,
            isOffline,
            loading,
            logo,
            queue: getQueue()
		},
		body: {
			...api,
            play: replaceAndPlay
		}
	}

    if (viewType === 'list') {
		Object.assign(props.header, { listType, filter, updateFilter, loading: loading && listType === 'file', viewLink: {queue: ['queue']}, disabled});
		Object.assign(props.body, { isOffline, fileData, listType, updateType, filter, updateFilter, links, disabled } )
	}
	if (viewType === 'queue') {
		Object.assign(props.header, { isFormOpen, openForm: () => setIsFormOpen(!isFormOpen), viewLink: {list: links } })
	}
	if (viewType === 'player') {
		Object.assign(props.body, { track });
	}
	return (
		<ControlsProvider {...controls} >
		<div className={setClassName("my-tunes",styles)}>
			<Header { ...props.header } loading={loading} />
			{ viewType == 'queue' && <div className={setClassName('form-container', styles)}>
				<div className={setClassName('form', styles)} style={{height: `${isFormOpen ? 95 : 0}px`}}>
					<SaveForm playlists={playlists} onSubmit={savePlaylist} />
				</div>
			</div> }
			<div className={setClassName(['main-node', viewType], styles)} style={{visibility: 'visible'}}>{ Module && <Module { ...props.body } /> }</div>
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