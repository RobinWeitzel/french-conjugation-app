import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { migrateLegacyLocalStorage, migrateLegacyCaches } from './lib/storage';
import { isSyncEnabled } from './lib/remoteStorage';
import { startSync } from './lib/sync';
import './index.css';

migrateLegacyLocalStorage();
void migrateLegacyCaches();
if (isSyncEnabled()) startSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
