import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-text-primary font-sans selection:bg-accent selection:text-black">
            <Navbar />
            <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;
