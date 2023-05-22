import React, { useState, useEffect, useRef } from "react";
import { List as ListComponent, Queue as QueueComponent } from '../components';
import { setClassName, isScrollBottom } from "../utilities/utils";
import { useQueue } from "../contexts/QueueContext";
import { quickSort, setAlpha } from '../../shared/utils';

import listStyles from '../styles/list.module.css';
import queueStyles from '../styles/queue.module.css';

export default function List(props) {
    const { isOffline, updateType, apiCall, filter, updateFilter, fileData, loading, links, disabled, play } = props;
    const { addToQueue, inQueue, removeFromQueue } = useQueue();
    const [ list, setList ] = useState([]);
    const [ reserve, setReserve ] = useState([]);
    const [ multiplier, setMultiplier ] = useState(0);
    const [ listNode, setListNode ] = useState(null);
    const [ listType, setListType ] = useState();
    const [ files, setFiles ] = useState({});
    const isLoaded = useRef(false);
    const isLoading = useRef(false);
    const limit = 100;

    useEffect(() => {
        isLoaded.current = true;
        return () => {
            isLoaded.current = false;
        }
    }, []);

    useEffect(() => {
        resetList();
    }, [ props.listType ]);

    useEffect(() => {
        multiplierChange();
    }, [ multiplier ]);

    useEffect(() => {
        if (listNode) listNode.scrollTo(0,0);
        if (multiplier === 0) {
            getList(0, updateList, filter);
        } else {
            setMultiplier(0);
        }
    }, [ filter ]);

    useEffect(() => {
        setFiles(Object.keys(fileData).reduce((obj, key) => {
            const files = Object.values(fileData[key]);
            return { ...obj, [key]: quickSort(files, setAlpha, Object.keys(files[0]).includes('title') ? 'title' : 'name') };
        },{}));
    }, [ fileData ]);

    useEffect(() => {
        if (files[listType]) resetList();
    }, [ files ]);

    const resetList = () => {
        updateFilter('');
        if (multiplier === 0) {
            getList(0, updateList, filter);
        } else {
            setMultiplier(0);
        }
        setList([]);
        setListType(props.listType);
    }

    async function getList (offset, callback){
        const params = Array.from(arguments).slice(2);
        if (files[props.listType]) callback(files[props.listType].filter(item => (item.title || item.name || '').toLowerCase().includes(filter.toLowerCase())).slice(offset, offset + limit), ...params);
        if (!isOffline) {
            let url = `${props.listType}?offset=${offset}&limit=${limit}`;
            if (filter.length) url = `${url}&filter=${filter}`;
            let results = await apiCall(url);
            if (results.error) return;
            if (isLoaded.current) callback(results.data, ...params);
        }
    }

    const multiplierChange = () => {
        if (multiplier === -1) return;
        if (multiplier > 0) return getList(multiplier * limit, updateReserve);
        getList(0, updateList, filter);
        setMultiplier(1);
    }

    const updateList = (data, filterValue) => {
        if (!isLoaded.current) return;
        if (filterValue === filter) setList(data);
    }

    const updateReserve = (data) => {
        if (!isLoaded.current) return;
        if (listNode) {
            if (isScrollBottom(listNode)) {
                setList(current => [ ...current, ...data ]);
                return setMultiplier(data.length ? multiplier + 1 : -1);
            } else {
                isLoading.current = false;
            }
        }
        setReserve(data);
        if (data.length === 0) setMultiplier(-1);
    }

    const loadData = (e) => {
        if (isLoading.current || reserve.length === 0) return;
        if (isScrollBottom(e.target)) {
            setList(current => [ ...current, ...reserve ]);
            setMultiplier(current => current + 1);
            isLoading.current = true;
        }
    }

    const onSelect = e => {
        let elem = e.target;
        let replace = false;
        while (elem !== e.currentTarget) {
            replace = replace || elem.classList.contains('img');
            elem = elem.parentElement;
        }
        addTracks(e.currentTarget.id, replace);
    }

    const addTracks = async (id, replace) => {
        const method = replace ? play : addToQueue;
        if (['file','track'].includes(listType)) {
            if (!replace) return method(list.find(item => item.id === id), id);
            if (files[listType]) return method(files[listType], id);
            return;
        }
        if (files[listType]) return method(files[listType].find(item => item.id === id).tracks.map(id => fileData.track[id])); 
        let results = await apiCall(`${listType}/${id}/tracks`);
        if (results.error) return;
        if (isLoaded.current) method(results.data);
    }

    const properties = { 
        ...props,
        onScroll: loadData, 
        onSelect,
        onLoad: (node) => setListNode(node)
    }
    if (['track', 'file'].includes(listType)) {
        const queueIndices = inQueue();
        Object.assign(properties, {
            styles: queueStyles, 
            type: "list", 
            queue: list.map(item => {
                const obj = { ...item };
                obj.actions = [ { label: '+', method: addTracks, params: [item.id] }];
                if (queueIndices[item.id]) {
                    obj.actions.unshift({ label: '-', method: removeFromQueue, params: [queueIndices[item.id]]})
                }
                return obj;
            })
        });
    } else {
        Object.assign(properties, {
            list, 
            styles: listStyles
        });
    }

    return (
        <>
        <div className={setClassName(['menu'], listStyles)}>
            { links.sort().map(item => <div key={`menu-${item}`} className={setClassName([disabled.includes(item) ? 'disabled' : (listType === item ? 'active' : '')], listStyles)} onClick={() => { return disabled.includes(item) ? null : updateType(item) } }>{item}</div>)}
        </div>
        {
        (['file','track'].includes(listType) ?
        <div className={setClassName('queue-wrapper', queueStyles)}>
            <QueueComponent { ...properties } />
            { loading && <div className={setClassName('loading', queueStyles)}><span>Loading</span></div> }
        </div>
        :
        <ListComponent { ...properties } />)
        }
        </>
    )
}