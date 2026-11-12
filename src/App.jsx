import { useEffect } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { BookOpen, Heart, Home as HomeIcon, Layers, Search as SearchIcon, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from './lib/store.js';
import { fetchRates } from './lib/api.js';
import { useCardSheet, useMediaQuery } from './lib/hooks.js';
import { Sheet } from './components/Sheet.jsx';
import { CardDetail } from './components/CardDetail.jsx';
import { ConsentBanner } from './components/ConsentBanner.jsx';
import { consentIsCurrent } from './lib/privacy.js';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Sets from './pages/Sets.jsx';
import SetDetail from './pages/SetDetail.jsx';
import Collection from './pages/Collection.jsx';
import Lists from './pages/Lists.jsx';
import Settings from './pages/Settings.jsx';
import Privacy from './pages/Privacy.jsx';

const NAV = [
  { to: '/', label: 'Início', icon: HomeIcon, end: true },
  { to: '/buscar', label: 'Buscar', icon: SearchIcon },
  { to: '/colecoes', label: 'Coleções', icon: Layers },
  { to: '/fichario', label: 'Fichário', icon: BookOpen },
  { to: '/listas', label: 'Listas', icon: Heart },
];

function useTheme() {
  const theme = useStore((s) => s.settings.theme);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = theme;
    const dark = theme === 'dark' || (theme === 'auto' && prefersDark);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', dark ? '#000000' : '#f2f2f7');
    });
  }, [theme, prefersDark]);
  return theme === 'auto' ? (prefersDark ? 'dark' : 'light') : theme;
}

// A cotação automática chama um serviço de terceiro: só roda com consentimento válido.
function useAutoRates() {
  const allowed = useStore((s) => s.settings.autoRates && consentIsCurrent(s.consent) && s.consent.externalRates);
  useEffect(() => {
    if (!allowed) return;
    const { settings, setSettings } = useStore.getState();
    if (settings.ratesUpdated && Date.now() - settings.ratesUpdated < 12 * 3600e3) return;
    fetchRates()
      .then((r) => setSettings({ ...r, ratesUpdated: Date.now() }))
      .catch(() => {});
  }, [allowed]);
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="./icon.svg" alt="" width="32" height="32" />
        <span>Fichário</span>
      </div>
      <nav className="side-nav">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="side-link">
            <Icon size={19} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <NavLink to="/ajustes" className="side-link side-link-bottom">
        <SettingsIcon size={19} strokeWidth={2} />
        Ajustes
      </NavLink>
    </aside>
  );
}

function TabBar() {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tab">
          <Icon size={23} strokeWidth={1.9} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function CardSheetHost() {
  const location = useLocation();
  const cardId = new URLSearchParams(location.search).get('carta');
  const { close } = useCardSheet();
  return (
    <Sheet open={!!cardId} onClose={close} label="Detalhes da carta">
      {cardId && <CardDetail cardId={cardId} onClose={close} />}
    </Sheet>
  );
}

export default function App() {
  const theme = useTheme();
  useAutoRates();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buscar" element={<Search />} />
            <Route path="/colecoes" element={<Sets />} />
            <Route path="/colecoes/:setId" element={<SetDetail />} />
            <Route path="/fichario" element={<Collection />} />
            <Route path="/listas" element={<Lists />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <TabBar />
        <CardSheetHost />
        <ConsentBanner />
        <Toaster
          position="top-center"
          theme={theme}
          richColors
          closeButton={false}
          toastOptions={{ duration: 3500, className: 'toast' }}
          offset="calc(env(safe-area-inset-top) + 12px)"
        />
      </div>
    </MotionConfig>
  );
}
