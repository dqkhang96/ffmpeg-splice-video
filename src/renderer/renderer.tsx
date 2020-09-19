/**
 * React renderer.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import _ from 'lodash'

// Import the styles here to process them with webpack
import '@public/style.css';
import MetaForm from '@/component/MetaForm';
import storage from 'electron-json-storage'


storage.getMany(["appSetting"], (error, data: any) => {
  const { appSetting } = data
  if (error) throw error;
  let dataStore: any = _.isEmpty(appSetting) ? {
    getTime: 10,
    removeTime: 1,
    maxProgress: 5
  } : appSetting


  ReactDOM.render(
    <div className='app'>
      <MetaForm appSetting={dataStore} />
    </div>,
    document.getElementById('app')
  );
})


