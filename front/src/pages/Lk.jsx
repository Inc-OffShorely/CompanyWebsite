// src/pages/Lk.jsx
import React, { useEffect } from 'react';
import '../styles/style.css';

function Lk() {
    useEffect(() => {
        document.title = 'Личный кабинет | MeowMeow';
    }, []);

    return (
        <main className="lk-page">

        </main>
    );
}

export default Lk;