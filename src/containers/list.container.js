import React, { useState, useEffect, useRef } from "react";
import { List as ListComponent, Queue as QueueComponent } from '../components';
import { setClassName, isScrollBottom } from "../utilities/utils";
import { useQueue } from "../contexts/QueueContext";

import listStyles from '../styles/list.module.css';
import queueStyles from '../styles/queue.module.css';

export default function List(props) {
    const { cache, updateType, apiCall, filter, updateFilter } = props;
    const { addToQueue, inQueue, removeFromQueue } = useQueue();
    const [ list, setList ] = useState([]);
    const [ reserve, setReserve ] = useState([]);
    const [ multiplier, setMultiplier ] = useState(0);
    const [ listNode, setListNode ] = useState(null);
    const [ listType, setListType ] = useState()
    const isLoaded = useRef(false);
    const isLoading = useRef(false);
    const offlineMode = useRef();
    const limit = 100;

    useEffect(() => {
        isLoaded.current = true;
        return () => {
            isLoaded.current = false;
        }
    }, []);

    useEffect(() => {
        if (listNode) listNode.scrollTo(0,0);
        if (offlineMode.current !== undefined) {
            if (multiplier === 0) {
                getList(0, updateList, filter);
            } else {
                setMultiplier(0);
            }
        }
        offlineMode.current = cache !== null;
    }, [ cache ]);

    useEffect(() => {
        updateFilter('');
        if (multiplier === 0) {
            getList(0, updateList, filter);
        } else {
            setMultiplier(0);
        }
        setList([]);
        setListType(props.listType);
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
    }, [ filter ])

    const getCache = () => {
        const filterData = (item) => {
            if (filter.length === 0) return true;
            return (item.name || item.title).toLowerCase().includes(filter.toLowerCase());
        }
        return cache[props.listType || props.listType].filter(filterData).slice(multiplier * limit,(multiplier + 1) * limit);
    }

    async function getList (offset, callback){
        const params = Array.from(arguments).slice(2);
        if (cache) return callback(getCache(), ...params);
        let url = `${props.listType}?offset=${offset}&limit=${limit}`;
        if (filter.length) url = `${url}&filter=${filter}`;
        let results = await apiCall(url);
        if (results.error) return;
        if (isLoaded.current) callback(results.data, ...params);
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

    const addTracks = async (id) => {
        const getCache = (id) => {
            if (listType === 'track') return cache.track.find(track => track.id === id);
            return cache.track.filter(track => track[`${listType}_ids`].includes(Number(id)));
        }
        if (cache) return addToQueue(getCache(id));
        if (listType === 'track') return addToQueue(list.find(item => item.id === id));
        let results = await apiCall(`${listType}/${id}/tracks`);
        if (results.error) results = { data: getCache(id) };
        if (isLoaded.current) addToQueue(results.data);
    }

    const properties = { 
        ...props,
        onScroll: loadData, 
        onLoad: (node) => setListNode(node)
    }
    if (listType === 'track') {
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
            styles: listStyles,  
            onSelect: addTracks,
        });
    }

    return (
        <>
        <div className={setClassName('menu', listStyles)}>
            { ['album','genre','creative','performer','track','playlist'].sort().map(item => <div key={`menu-${item}`} className={setClassName(listType === item ? 'active' : '', listStyles)} onClick={() => updateType(item)}>{item}</div>)}
        </div>
        {
        (listType === 'track' ?
        <div className={setClassName('queue-wrapper', queueStyles)}>
            <QueueComponent { ...properties } />
        </div>
        :
        <ListComponent { ...properties } />)
        }
        </>
    )
}