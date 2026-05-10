import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { migrateLegacyLocalStorage, migrateLegacyCaches } from './lib/storage';
import './index.css';

migrateLegacyLocalStorage();
void migrateLegacyCaches();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
