import React, { createContext, useState, useContext, useEffect } from 'react';

const QueueContext = createContext(null);

export function QueueProvider(props) {
    const [ queue, setQueue ] = useState([]);
    const [ indices, setIndices ] = useState([]);
    const [ played, setPlayed ] = useState([]);
    const [ shuffle, setShuffle ] = useState(false);
    const [ repeat, setRepeat ] = useState(false);
    const [ currentIndex, setCurrentIndex ] = useState(0);
    const [ removed, setRemoved ] = useState([]);

    useEffect(() => {
        if (!repeat && played.length) {
            let arrPlayed;
            let arrIndices;
            let cIndex;
            if (shuffle) {
                arrPlayed = [ ...[ ...indices ].reverse(), ...played];
                arrIndices = [];
                cIndex = currentIndex + indices.length;
            } else {
                const arr = Array.from(Array(queue.length).keys());
                const index = played[currentIndex];
                arrPlayed = arr.slice(0, index + 1).reverse();
                arrIndices = arr.slice(index + 1)
                cIndex = 0;
            }
            setPlayed(arrPlayed);
            setIndices(arrIndices);
            setCurrentIndex(cIndex);
        }
    }, [repeat]);

    useEffect(() => {
        if (played.length) createPlayQueue();
    }, [ shuffle ]);

    useEffect(() => {
        if (removed.length) setRemoved([]);
    }, [ removed ]);

    const addToQueue = (toAdd) => {
        if (!toAdd) return;
        if (!Array.isArray(toAdd)) toAdd = [ toAdd ];
        setIndices(current => {
            const indices = [ ...current, ...Array.from(Array(toAdd.length).keys()).map(key => key + queue.length) ];
            if (shuffle) indices.sort(() => Math.random() - 0.5);
            return indices;
        });
        setQueue(current => [ ...current, ...toAdd ]);
    }

    const removeFromQueue = (toRemove) => {
        if (!Array.isArray(toRemove)) toRemove = [ toRemove ];
        const newIndices = {};
        let diff = 0;
        let current = currentIndex;
        const newQueue = queue.filter((item, index) => {
            if (toRemove.includes(index)) {
                diff++;
                const i = played.findIndex(item => item === index);
                if (i > -1 && i < current) current--;
                return false;
            }
            newIndices[index] = index - diff;
            return true;
        });

        setIndices(current => current.reduce((obj, item) => {
            if (newIndices[item]) obj.push(newIndices[item]);
            return obj;
        },[]));
        
        setPlayed(current => current.reduce((obj, index) => {
            if (newIndices[index] !== undefined) obj.push(newIndices[index]);
            return obj;
        }, []));
        setQueue(newQueue);
        setCurrentIndex(current);
        setRemoved(toRemove);
    }

    const updateQueue = (update) => {
        const tracks = update.reduce((obj,item) => {
            return { ...obj, [item.id]: item }
        },{});
        const ids = Object.keys(tracks).map(key => Number(key));
        let offset = 0;
        const indexMap = queue.reduce((obj, item, index) => {
            if (ids.includes(item.id)) {
                obj[index] = index - offset;
            } else {
                offset++;
            }
            return obj;
        }, {});
        setIndices(current => current.reduce((obj, item) => {
            if(indexMap[item] !== undefined) obj.push(indexMap[item]);
            return obj
        },[]));
        offset = 0;
        setPlayed(current => current.reduce((obj, item) => {
            if(indexMap[item] !== undefined) {
                obj.push(indexMap[item]);
            } else {
                offset++;
            }
            return obj
        },[]));
        setCurrentIndex(current => {
            return Math.max(current-offset, 0)
        });
        setQueue(current => current.reduce((obj, item) => {
            if (tracks[item.id]) obj.push(tracks[item.id]);
            return obj;
        }, []));
    }

    const replaceQueue = (replacement, index = 0) => {
        if (replacement.length === 0) {
            setQueue([]);
            setIndices([]);
            setPlayed([]);
            setCurrentIndex([]);
            return null;
        }
        if (index === -1) index = shuffle ? Math.floor(Math.random() * replacement.length) : 0;
        const selected = replacement[index];
        setQueue([ ...replacement ]);
        const indices = Object.keys(replacement).map(i => Number(i));
        if (shuffle) indices.sort(() => Math.random() - 0.5);
        const i = indices.indexOf(index);
        setPlayed(indices.splice(0, i + 1).reverse());
        setIndices([ ...indices ]);
        setCurrentIndex(0);
        return selected;
    }

    const removeDups = () => {
        const ids = [];
        const indexes = queue.reduce((obj, item, index) => {
            if (ids.includes(item.id)) obj.push(index);
            ids.push(item.id);
            return obj;
        }, []);

        removeFromQueue(indexes);
    }


    const getLength = () => {
        return queue.length;
    }

    const isShuffled = () => {
        return shuffle;
    }

    const getQueue = () => {
        return queue;
    }

    const next = () => {
        let index;
        if (currentIndex > 0) {
            index = played[currentIndex - 1];
        } else {
            let playedUpdate = [ ...played ];
            let indicesNew = [ ...indices ];
            index = indicesNew.shift();
            if (repeat && !index) {
                if (shuffle) {
                    const max = Math.min(Math.floor(queue.length / 2), 20);
                    const toAdd = Array.from(Array(queue.length).keys()).sort(() => Math.random() - 0.5);
                    const exclude = played.slice(0, max);
                    indicesNew = [ ...toAdd.filter(item => !exclude.includes(item)), ...exclude];
                } else {
                    playedUpdate = [];
                    indicesNew = Array.from(Array(queue.length).keys());
                }
                index = indicesNew.shift();
            }
            setPlayed([ index, ...playedUpdate ]);
            setIndices(indicesNew);
        }
        setCurrentIndex(Math.max(currentIndex - 1, 0));
        if (index === undefined) return null;
        return { ...queue[index], index, key: new Date().getTime() };
    }

    const prev = () => {
        if (queue.length === 0) return null;
        let newIndex = currentIndex + 1;
        let index = played[newIndex];
        let toAdd = [];
        if (index === undefined) {
            if (!repeat) return null;
            toAdd = Array.from(Array(queue.length).keys()).reverse();
            if (shuffle) {
                const max = Math.min(Math.floor(queue.length / 2), 20);
                if (max === 0) {
                    toAdd = [ 0 ];
                } else {
                    const exclude = played.slice(max*-1);
                    if (exclude.length < max) exclude.push(...indices.slice(0,max - exclude.length));
                    toAdd = toAdd.filter(item => !exclude.includes(item)).sort(() => Math.random() - 0.5);
                }
            }
            index = toAdd[0];
        }
        if (played.length + toAdd.length > 50000) {
            newIndex = newIndex - toAdd.length;
        }
        setPlayed(current => [ ...current.slice(Math.min((currentIndex + toAdd.length) - 50000, 0)), ...toAdd ])
        setCurrentIndex(newIndex);
        return { ...queue[index], index, key: new Date().getTime() };
    }

    const hasNext = () => {
        return (Number(repeat) + currentIndex + indices.length) > 0; 
    }

    const hasPrev = () => {
        return repeat || (currentIndex + 1 < played.length);
    }

    const clearPlayQueue = () => {
        setCurrentIndex(0);
        setIndices([]);
        setPlayed([]);
    }

    const createPlayQueue = () => {
        if (!queue.length) return false;
        let keys = Array.from(Array(queue.length).keys());
        let key;
        if (shuffle) {
            key = played[0];
            keys = keys.slice(played.length).sort(() => Math.random() - 0.5);
        } else if (played.length) {
            key = keys.splice(0, played[0] + 1).reverse();
        }
        if (key === undefined) key = keys.shift();
        if (!Array.isArray(key)) key = [key];
        setIndices(keys);
        setPlayed(key)
        return { ...queue[key[0]], index: key[0], key: new Date().getTime() };
    }

    const inQueue = () => {
        return queue.reduce((obj,item,index) => {
            if (!obj[item.id]) obj[item.id] = [];
            obj[item.id].push(index);
            return obj; 
        }, {} );
    }

    const toggleShuffle = () => setShuffle(current => !current);

    const toggleRepeat = () => setRepeat(current => !current);

    return (
        <QueueContext.Provider value={{ updateQueue, getQueue, toggleShuffle, isShuffled, createPlayQueue, clearPlayQueue, prev, next, getLength, addToQueue, removeFromQueue, removeDups, hasNext, hasPrev, inQueue, removed, toggleRepeat, repeat, queue, replaceQueue }}>
            { props.children }
        </QueueContext.Provider>
    )
}

export function useQueue() {
    const context = useContext(QueueContext);
    if (!context) throw new Error('Queue Provider Not Being Used');
    return context;
}
