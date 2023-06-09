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

    const setActions = (actions) => {
        if (actions) return actions;
        return [];
    }

    const setImageSrc = (item) => {
        const image = item.artwork_url !== undefined ? item.artwork_url : item.composite_url;
        return image ? setUrl(image) : '';
    }

    return(
        <div style={{ position:'relative'/*, border: '3px solid red'*/}} ref={queueRef} onScroll={onScroll}>
            { false && <div style={{position: 'absolute', left: '0px', bottom:'0px', width:'100%', height:'30px', border:'2px solid green'}}></div>}
            <div className={setClassName('queue',styles)}>
            { (queue || []).map((item, index) => 
                <div key={`${item.id}-${index}`}>
                    <img src={setImageSrc(item)} onError={hideImage} />
                    <div id={item.id} onClick={onSelect}>
                        <div className={setClassName(['title','img'], styles)}>{item.title}</div>
                        { item.artists &&  <div className={setClassName(['artist','img'], styles)}>{item.artists}</div> }
                        { item.year && <div className={setClassName(['year','img'], styles)}>{item.year}</div> }
                    </div>
                    <div className={setClassName('actions', styles)}>
                        { setActions(item.actions,index).map((action, i) => {
                            return <span key={`${type}-${index}-${i}`} onClick={() => action.method(...(action.params || [index]))}>{ action.label }</span>
                        })}
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}