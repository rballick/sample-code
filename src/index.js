import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';import { QueueProvider } from './contexts/QueueContext';
import { SoundProvider } from './contexts/SoundContext';

ReactDOM.render(
    <SoundProvider>
    <QueueProvider>
        <App />
    </QueueProvider>
    </SoundProvider>
    ,document.getElementById('root')
);
