import React from 'react';

const SettingsModal = () => {
  return (
    <div id="modal-setting" className="uk-modal-full" uk-modal="true">
      <div className="uk-modal-dialog">
        <button className="uk-modal-close-full uk-close-large" type="button" uk-close="true"></button>
        <div className="uk-modal-header">
          <h2 className="uk-modal-title">:: SETTING MODAL & SCANNER</h2>
        </div>
        <div className="uk-modal-body">
          {/* Content will be migrated later */}
          <p>Settings form will be here...</p>
        </div>
        <div className="uk-modal-footer uk-text-right">
          <button className="uk-button uk-button-default uk-modal-close" type="button">Tutup</button>
          <button type="button" id="save-config" className="uk-button uk-button-primary">SIMPAN</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
