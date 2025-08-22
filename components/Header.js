import React from 'react';
import Link from 'next/link'; // Import the Link component

const Header = ({ toggleDarkMode }) => {
  const handleNotImplemented = (e) => {
    e.preventDefault();
    alert('This feature has not been implemented in the new version yet.');
  };

  return (
    <div className="uk-card uk-card-default uk-margin-small header-card">
      <div className="uk-grid-small uk-flex-middle" uk-grid="true">
        {/* Kiri: Judul */}
        <div className="uk-width-expand@s uk-width-1-1">
          <div className="uk-flex uk-flex-middle uk-flex-wrap">
            <h3 id="judul" className="uk-margin-remove" style={{ fontSize: '18px', lineHeight: '1.2', color: '#000', fontWeight: 'bold' }}>
              MULTICHECKER [GLOBAL] :: <label id="namachain">BSC</label> {/* Placeholder */}
              <img src="https://coopsugar.org/storage/2022/03/new.gif" width="24px" alt="new" />
            </h3>
            <span className="uk-margin-small-left">[ &nbsp;<b>
              <span className="uk-text-danger uk-text-small" id="infoAPP">Loading...</span> {/* Placeholder */}
            </b>&nbsp; ]</span>
          </div>
        </div>

        {/* Kanan: Toolbar icon */}
        <div className="uk-width-auto@s uk-width-1-1">
          <div className="uk-flex uk-flex-middle uk-flex-wrap uk-flex-right@s" style={{ gap: '6px' }}>
            {/* Updated links to use Next.js Link component */}
            <Link href="/multiscanner" passHref><img className="icon" title="MULTI SCANNER" width="22px" src="https://cdn-icons-png.flaticon.com/512/30/30279.png" alt="multi scanner" /></Link>
            <span id="chain-links-container"></span>
            <img className="icon" id="reload" title="RESET PROSES" width="24px" src="https://cdn-icons-png.flaticon.com/512/3580/3580284.png" alt="reload" onClick={() => window.location.reload()} />
            <img className="icon" id="LoadDataBtn" title="LOAD DATA TOKEN" width="24px" src="https://png.pngtree.com/png-clipart/20230815/original/pngtree-database-sync-icon-icon-symbol-data-vector-picture-image_10830033.png" alt="load data" onClick={handleNotImplemented} />
            <img className="icon" id="SettingModal" title="CONFIG SCANNER" width="24px" src="https://cdn-icons-png.flaticon.com/512/1170/1170635.png" alt="settings" onClick={handleNotImplemented} />
            <img className="icon" id="UpdateWalletCEX" title="UPDATE WALLET CEX" width="24px" src="https://images.freeimages.com/fic/images/icons/2770/ios_7_icons/512/wallet.png" alt="update wallet" onClick={handleNotImplemented} />
            <Link href="/modal" passHref><img className="icon" title="MANAJEMEN ASSET" width="24px" src="https://cdn-icons-png.flaticon.com/512/1194/1194711.png" alt="manage asset" /></Link>
            <Link href="/multipair" passHref><img className="icon" title="SETTING DATA" width="24px" src="https://cdn-icons-png.flaticon.com/128/3934/3934107.png" alt="setting data" /></Link>
            <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" rel="noopener noreferrer"><img className="icon" title="BUKA AKSES" width="24px" src="https://cdn-icons-png.flaticon.com/512/9921/9921748.png" alt="open access" /></a>

            <a href="#" className="icon" title="EXPORT KOIN" onClick={handleNotImplemented}>
              <img src="https://cdn-icons-png.flaticon.com/512/157/157921.png" width="24px" alt="export" />
            </a>
            <label htmlFor="uploadJSON" title="IMPORT KOIN" style={{ cursor: 'pointer' }}>
              <img src="https://cdn-icons-png.flaticon.com/512/219/219431.png" width="24px" alt="import" />
            </label>
            <input type="file" id="uploadJSON" accept="application/json" style={{ display: 'none' }} onChange={handleNotImplemented} />
            <img className="icon" id="darkModeToggle" title="Ganti Mode Gelap/Terang" width="24px" src="https://cdn-icons-png.flaticon.com/512/3751/3751403.png" alt="dark mode" onClick={toggleDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
