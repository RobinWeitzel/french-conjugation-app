import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Home } from './pages/Home';
import { PracticeSetup } from './pages/PracticeSetup';
import { Practice } from './pages/Practice';
import { ListeningSetup } from './pages/ListeningSetup';
import { Listening } from './pages/Listening';

export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice-setup" element={<PracticeSetup />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/listening-setup" element={<ListeningSetup />} />
          <Route path="/listening" element={<Listening />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
