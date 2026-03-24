import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Home } from './pages/Home';
import { PracticeSetup } from './pages/PracticeSetup';
import { Practice } from './pages/Practice';

export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice-setup" element={<PracticeSetup />} />
          <Route path="/practice" element={<Practice />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
