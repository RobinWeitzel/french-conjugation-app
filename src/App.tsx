import { HashRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">French Practice</h1><p className="mt-2 text-slate-500">Loading...</p></div>} />
      </Routes>
    </HashRouter>
  );
}
