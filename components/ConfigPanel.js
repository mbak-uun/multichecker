import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initialChainData, CONFIG_CEX } from '@/lib/config';

// Helper function to manage localStorage
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};


const ConfigPanel = () => {
  const [selectedCEX, setSelectedCEX] = useLocalStorage('CEX_PILIH', ['GATE', 'BINANCE']);
  const [selectedDEX, setSelectedDEX] = useLocalStorage('DEX_PILIH', ['1inch', 'odos']);
  const [selectedPairs, setSelectedPairs] = useLocalStorage('DEXPAIR_PILIH', ['USDT', 'BNB']);

  const [posisiKiri, setPosisiKiri] = useLocalStorage('posisiKiri', true);
  const [posisiKanan, setPosisiKanan] = useLocalStorage('posisiKanan', true);
  const [strictFilter, setStrictFilter] = useLocalStorage('strictFilter', true);
  const [volCheck, setVolCheck] = useLocalStorage('volCheck', false);
  const [sortOrder, setSortOrder] = useLocalStorage('sortOrder', 'opt_A');
  const [isScanning, setIsScanning] = useState(false);

  const handleCheckboxChange = (setter, value, list) => {
    if (list.includes(value)) {
      setter(list.filter(item => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    console.log("Starting scan...");

    // In a real app, you would get the token list from a source.
    // For now, we'll use a placeholder.
    const mockTokenList = [
        { cex: 'GATE', symbol_in: 'BTC', symbol_out: 'USDT', sc_in: '0x...', sc_out: '0x...' },
        { cex: 'BINANCE', symbol_in: 'ETH', symbol_out: 'USDT', sc_in: '0x...', sc_out: '0x...' },
    ];

    try {
      const response = await axios.post('/api/scan', {
        selectedCEX,
        selectedDEX,
        selectedPairs,
        tokens: mockTokenList, // Pass the tokens to be scanned
      });
      console.log('Backend Response:', response.data);
      alert('Scan finished! Check the console for the response.');
    } catch (error) {
      console.error('Error calling scan API:', error);
      alert('An error occurred during the scan.');
    } finally {
      setIsScanning(false);
    }
  };

  // Dynamically create checkbox groups
  const renderCheckboxGroup = (title, items, selectedItems, setter) => (
    <div className="uk-flex uk-flex-middle" style={{gap: '10px'}}>
      <b><span className="uk-text-secondary">{title}:</span></b>
      {items.map(item => (
        <label key={item}>
          <input
            className="uk-checkbox"
            type="checkbox"
            value={item}
            checked={selectedItems.includes(item)}
            onChange={() => handleCheckboxChange(setter, item, selectedItems)}
          />
          <span className="uk-form-label uk-text-primary" style={{marginLeft: '4px'}}>{item.toUpperCase()}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="uk-card uk-card-default uk-padding-small uk-card-hover" style={{ border: '1px solid', paddingTop: '6px', paddingBottom: '6px' }} id="scanner-config">
      <div className="uk-grid-small uk-flex-middle" uk-grid="true">
        <div className="uk-width-1-1">
          <form id="cryptoForm" className="uk-flex uk-flex-middle uk-flex-wrap" style={{ gap: '12px' }}>

            {renderCheckboxGroup('CEX', Object.keys(CONFIG_CEX), selectedCEX, setSelectedCEX)}
            |
            {renderCheckboxGroup('DEX', initialChainData.DEXS, selectedDEX, setSelectedDEX)}
            |
            {renderCheckboxGroup('PAIR', Object.keys(initialChainData.PAIRDEXS), selectedPairs, setSelectedPairs)}
            |
            <div className="uk-flex uk-flex-middle" style={{gap: '10px'}}>
              <span className="uk-text-secondary uk-text-bolder">SCANNER:</span>
              <label><input className="uk-checkbox posisi-check" type="checkbox" checked={posisiKiri} onChange={() => setPosisiKiri(!posisiKiri)} /> <span className="uk-text-success uk-form-label">KIRI</span></label>
              <label><input className="uk-checkbox posisi-check" type="checkbox" checked={posisiKanan} onChange={() => setPosisiKanan(!posisiKanan)} /> <span className="uk-text-success uk-form-label">KANAN</span></label>
            </div>
            |
             <div className="uk-flex uk-flex-middle" style={{gap: '10px'}}>
              <label><input className="uk-checkbox" id="strictFilter" type="checkbox" checked={strictFilter} onChange={() => setStrictFilter(!strictFilter)} /> <span className="uk-text-primary uk-form-label">WALLET CEX</span></label>
              <label><input className="uk-checkbox vol-check" id="checkVOL" type="checkbox" checked={volCheck} onChange={() => setVolCheck(!volCheck)} /> <span className="uk-text-danger uk-form-label">VOL CHECK</span></label>
            </div>

            <div className="uk-button-group">
              <label className={`uk-button uk-button-small uk-button-default toggle-radio sort-toggle ${sortOrder === 'opt_A' ? 'active' : ''}`} onClick={() => setSortOrder('opt_A')}>
                <input className="uk-hidden" type="radio" name="toggle" value="opt_A" /> A-Z
              </label>
              <label className={`uk-button uk-button-small uk-button-default toggle-radio sort-toggle ${sortOrder === 'opt_B' ? 'active' : ''}`} onClick={() => setSortOrder('opt_B')}>
                <input className="uk-hidden" type="radio" name="toggle" value="opt_B" /> Z-A
              </label>
            </div>
            <div className="uk-button-group">
              <button type="button" id="startSCAN" className="uk-button uk-button-secondary uk-button-small" onClick={handleStartScan} disabled={isScanning}>
                {isScanning ? 'SCANNING...' : 'START'}
              </button>
              <button type="button" id="stopSCAN" className="uk-button uk-button-danger uk-button-small" disabled={!isScanning}>STOP</button>
            </div>
          </form>

          {/* Progress bar can be updated based on isScanning state later */}
          <div id="progress-container" style={{ width: '100%', backgroundColor: '#f3f3f3', borderRadius: '10px', marginTop: '10px' }}>
            <div id="progress-bar" style={{ height: '14px', width: isScanning ? '50%' : '0%', backgroundColor: '#4caf50', borderRadius: '5px', transition: 'width 0.5s ease-in-out' }}>
              <span id="progress-text" style={{ color: 'rgb(7, 102, 8)', fontSize: '11px', textAlign: 'center', lineHeight: '10px', display: 'block', fontWeight: 'bold' }}>{isScanning ? '50%' : '0%'}</span>
            </div>
          </div>
          <div id="progress" style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '5px', color: '#157515' }}>
            {isScanning ? 'Scan in progress...' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
