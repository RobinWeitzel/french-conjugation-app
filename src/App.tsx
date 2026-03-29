import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UpdateBanner } from './components/UpdateBanner';
import { Home } from './pages/Home';
import { PracticeSetup } from './pages/PracticeSetup';
import { Practice } from './pages/Practice';
import { ListeningSetup } from './pages/ListeningSetup';
import { Listening } from './pages/Listening';
import { Settings } from './pages/Settings';
import { GrammarIndex } from './pages/GrammarIndex';
import { GrammarSection } from './pages/GrammarSection';
import { Statistics } from './pages/Statistics';

export function App() {
  return (
    <ThemeProvider>
      <UpdateBanner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice-setup" element={<PracticeSetup />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/listening-setup" element={<ListeningSetup />} />
          <Route path="/listening" element={<Listening />} />
          <Route path="/grammar" element={<GrammarIndex />} />
          <Route path="/grammar/:sectionId" element={<GrammarSection />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
