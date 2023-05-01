import React from 'react';
import { setClassName } from '../utilities/utils';

import styles from '../styles/footer.module.css';
export default function Footer(props) {
    return (
        <div className={setClassName(['footer',props.player ? 'player' : ''], styles)}>
            { props.children }
        </div>
    )
}
