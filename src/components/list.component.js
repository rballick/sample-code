import React, { useEffect, useRef } from "react";
import { setClassName } from "../utilities/utils";

export default function List(props) {
    const { list, styles, setUrl, onScroll, onSelect, listType, filter, onLoad } = props;
    const listRef = useRef();

    useEffect(() => {
        if (typeof onLoad === 'function') onLoad(listRef.current);
    }, []);

    const renderData = (item) => {
        if (item.name) return (<div>{item.name}</div>);
        let title = item.title;
        let artist = item.album_artist || item.artist;
        while (`${title}${artist}`.length > 75) {
            if (artist.length === title.length) {
                title = title.slice(0,-1);
                artist = artist.slice(0,1);
            } else if (title.length >= artist.length) {
                title = title.slice(0,-1);
            } else {
                artist = artist.slice(0,-1);
            }
        }
        return (
            <>  
                <div>{ title }{ title.length === item.title.length ? '' : '...'}</div>
                <div>{ artist }{ (item.album_artist || item.artist).length === artist.length ? '' : '...'}</div>
                <div>{ item.year }</div>
            </>
        );

    }

    const setStyle = (item) => {
        const image = item.artwork_url !== undefined ? item.artwork_url : item.composite_url;
        const src = image ? `, url("${setUrl(image)}")` : '';
        return { backgroundImage: `linear-gradient( rgba(0, 0, 0, 0.40), rgba(0, 0, 0, 0.40))${src}` };
    }

    return (
        <div ref={listRef} key={`${listType}-${filter}`} className={setClassName('list-wrapper', styles)} onScroll={onScroll}>
            <div className={setClassName('list',styles)}>
                { list.map(item => 
                    <div key={`${listType}-${item.id}`} id={item.id} onClick={onSelect}>
                        <div className={setClassName('img', styles)} style={setStyle(item)}>
                        { renderData(item) }
                        </div>
                        <div className={setClassName('add', styles)}>Add</div>
                    </div>
                ) }
            </div>
        </div>
    )
}