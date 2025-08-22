import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import ConfigPanel from '@/components/ConfigPanel';
import PriceTable from '@/components/PriceTable';
import SettingsModal from '@/components/SettingsModal';
import MultiTokenModal from '@/components/MultiTokenModal';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Effect to read dark mode setting from localStorage on initial load
  useEffect(() => {
    const savedMode = localStorage.getItem('MULTI_SCANNER_darkMode') === 'true';
    setIsDarkMode(savedMode);
  }, []);

  // Effect to apply the dark mode class to the body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode', 'uk-dark');
      document.body.classList.remove('uk-light');
    } else {
      document.body.classList.remove('dark-mode', 'uk-dark');
      document.body.classList.add('uk-light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('MULTI_SCANNER_darkMode', newMode);
    // In the original code, this also triggered a reload. We can manage state without a reload in React.
    // toastr.info("UBAH MODE BERHASIL!!");
  };

  return (
    <>
      <Head>
        <title>Crypto Multichecker</title>
        <meta name="description" content="Crypto Arbitrage Price Checker" />
        {/* Favicon and other head elements are in _document.js */}
      </Head>

      <div className="uk-container uk-margin-small-top uk-background-a">
        <Header toggleDarkMode={toggleDarkMode} />
        <ConfigPanel />
        <PriceTable />

        {/* Modals */}
        <SettingsModal />
        <MultiTokenModal />
      </div>
    </>
  );
}
