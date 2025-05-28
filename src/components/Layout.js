import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import LeftSidebar from './LeftSidebar';
import GMITeamPage from '../pages/GMITeamPage';
import SDLCTeamPage from '../pages/SDLCTeamPage';
import ProductTeamPage from '../pages/ProductTeamPage';
import CExecutivePage from '../pages/CExecutivePage';
import TendorsPage from '../pages/TendorsPage';

function Layout() {
  const [activePage, setActivePage] = useState('gmi-team');

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar activePage={activePage} setActivePage={setActivePage} />
        
        <main className="flex-1 p-4 overflow-y-auto">
          <Routes>
            <Route path="/gmi-team" element={<GMITeamPage />} />
            <Route path="/sdlc-team" element={<SDLCTeamPage />} />
            <Route path="/product-team" element={<ProductTeamPage />} />
            <Route path="/c-executive" element={<CExecutivePage />} />
            <Route path="/tendors" element={<TendorsPage />} />
            <Route path="/" element={<GMITeamPage />} />
          </Routes>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export default Layout;