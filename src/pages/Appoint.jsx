import React, { useEffect } from 'react';
import '../styles/style.css';

function Appoint() {
    useEffect(() => {
        document.title = 'Новости | MeowMeow';
    }, []);

    return (
        <section></section>
    );
}

export default Appoint;