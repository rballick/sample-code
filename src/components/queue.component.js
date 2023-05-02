import React, { useEffect, useRef } from "react";
import { setClassName } from '../utilities/utils';

export default function Queue(props) {
    const { queue, styles, type, onSelect, onScroll, setUrl, onLoad } = props;
    const queueRef = useRef();

    useEffect(() => {
        if (typeof onLoad === 'function') onLoad(queueRef.current);
    }, [])

    const hideImage = (e) => {
        e.target.style.visibility = 'hidden';
    }

    const setActions = (actions, onSelect) => {
        if (actions) return actions;
        if (onSelect) return [{ ...onSelect }];
        return [];
    }

    const setImageSrc = (item) => {
        const image = item.artwork_url !== undefined ? item.artwork_url : item.composite_url;
        return image ? (item.isCached ? require(`../../public/assets/cache/images/${image}`) : setUrl(image)) : '';
    }

    return(
        <div ref={queueRef} onScroll={onScroll}>
            <div className={setClassName('queue',styles)}>
            { (queue || []).map((item, index) => 
                <div key={`${item.id}-${index}`}>
                    <img src={setImageSrc(item)} onError={hideImage} />
                    <div>
                        <div className={setClassName('title', styles)}>{item.title}</div>
                        <div className={setClassName('artist', styles)}>{item.artists}</div>
                        <div className={setClassName('year', styles)}>{item.year}</div>
                    </div>
                    <div className={setClassName('actions', styles)}>
                        { setActions(item.actions, onSelect, index).map((action, i) => {
                            return <span key={`${type}-${index}-${i}`} onClick={() => action.method(...(action.params || [index]))}>{ action.label }</span>
                        })}
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}