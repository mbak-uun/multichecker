import React from 'react';

const MultiTokenModal = () => {
  return (
    <div id="multiTokenModal" uk-modal="true">
      <div className="uk-modal-dialog uk-modal-body uk-border-rounded">
        <div className="uk-flex uk-flex-middle uk-margin-small-bottom" id="judulmodal">
          <div className="uk-width-expand"></div>
          <div className="uk-text-center uk-width-auto">
            <h4 className="uk-modal-title uk-margin-remove">Import Koin [SNIPER]</h4>
          </div>
          <div className="uk-width-expand uk-text-right">
            <button className="uk-modal-close-default" type="button" uk-close="true"></button>
          </div>
        </div>
        <hr className="uk-margin-remove-top uk-margin-small-bottom" />
        {/* Content will be migrated later */}
        <p>Multi token import form will be here...</p>
        <div className="uk-flex uk-flex-right uk-margin-top">
          <button className="uk-button uk-button-default uk-modal-close" type="button" id="batalimportkoin">Batal</button>
          <button className="uk-button uk-button-primary" type="submit" id="importkoin">Import</button>
        </div>
      </div>
    </div>
  );
};

export default MultiTokenModal;
