import React, { useState, useEffect, useRef } from "react";
import { Queue as QueueComponent } from "../components";
import { useQueue } from "../contexts/QueueContext";
import { setClassName, isScrollBottom } from '../utilities/utils';

import styles from '../styles/queue.module.css';

export default function Queue(props) {
    const { isOffline} = props;
    const { removeFromQueue, getQueue, removeDups } = useQueue();
    const [ multiplier, setMultiplier ] = useState(1);
    const [ queueNode, setQueueNode ] = useState();
    const queue = getQueue();

    useEffect(() => {
        if (queueNode) queueNode.scrollTo(0,0);
    }, [ isOffline ] );

    const loadData = (e) => {
        if (isScrollBottom(e.target)) setMultiplier(current => current + 1);
    }

    const ids = (queue || []).map(item => item.id);

    const properties = {
        ...props,
        queue: queue.slice(0, (multiplier*100) + 100).map(item => {
            item.actions = [
                { method: removeFromQueue, label: String.fromCharCode(215)}
            ]
            return item;
        }),
        styles,
        type: "queue",
        onScroll: loadData,
        onLoad: (node) => setQueueNode(node)
    }

    return(
        <div className={setClassName('queue-wrapper', styles)}>
            <QueueComponent { ...properties } />
            <div className={setClassName("remove", styles)}><button style={{visibility: ids.length === [ ...new Set(ids) ].length ? 'hidden' : 'visible'}} onClick={removeDups}>remove duplicates</button></div>
        </div>
    )
}