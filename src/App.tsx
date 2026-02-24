import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useGameStore, checkStoredReferralCode } from './stores/gameStore';
import { useCareerStore } from './stores/careerStore';
import { useReferralStore } from './stores/referralStore';
import { useStatDecay } from './hooks/useStatDecay';
import { useCareerTick } from './hooks/useCareerTick';
import { PET_CHAR_IDS } from './types/game';
import TabBar from './components/TabBar/TabBar';

import MainMenuScreen from './screens/MainMenu/MainMenuScreen';
import DailyRoutineMenuScreen from './screens/DailyRoutine/DailyRoutineMenuScreen';
import FoodScreen from './screens/DailyRoutine/FoodScreen/FoodScreen';
import ShowerScreen from './screens/DailyRoutine/ShowerScreen/ShowerScreen';
import FunScreen from './screens/DailyRoutine/FunScreen/FunScreen';
import MiniGamesMenuScreen from './screens/MiniGames/MiniGamesMenuScreen';
import PlatformerGameScreen from './screens/MiniGames/PlatformerGame/PlatformerGameScreen';
import CatchingFromSkyScreen from './screens/MiniGames/CatchingFromSkyGame/CatchingFromSkyScreen';
import CatchingFromAllSidesScreen from './screens/MiniGames/CatchingFromAllSidesGame/CatchingFromAllSidesScreen';
import EducationScreen from './screens/Education/EducationScreen';
import ShopScreen from './screens/Shop/ShopScreen';
import FriendsScreen from './screens/Friends/FriendsScreen';
import BankScreen from './screens/Bank/BankScreen';
import SettingsScreen from './screens/Settings/SettingsScreen';

import './App.css';

const GAME_ROUTES = [
  '/mini-games/platformer',
  '/mini-games/catching-from-sky',
  '/mini-games/catching-from-all-sides',
];

function AppLayout() {
  const location = useLocation();
  const showTabBar = !GAME_ROUTES.some(r => location.pathname.startsWith(r));

  useStatDecay();
  useCareerTick();

  return (
    <div className="app-frame">
      <div className="app-content">
        <Routes>
          <Route path="/" element={<MainMenuScreen />} />
          <Route path="/daily-routine" element={<DailyRoutineMenuScreen />} />
          <Route path="/daily-routine/food" element={<FoodScreen />} />
          <Route path="/daily-routine/shower" element={<ShowerScreen />} />
          <Route path="/daily-routine/fun" element={<FunScreen />} />
          <Route path="/mini-games" element={<MiniGamesMenuScreen />} />
          <Route path="/mini-games/platformer/:level" element={<PlatformerGameScreen />} />
          <Route path="/mini-games/catching-from-sky/:level" element={<CatchingFromSkyScreen />} />
          <Route path="/mini-games/catching-from-all-sides/:level" element={<CatchingFromAllSidesScreen />} />
          <Route path="/education" element={<EducationScreen />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/friends" element={<FriendsScreen />} />
          <Route path="/bank" element={<BankScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </div>
      {showTabBar && <TabBar />}
    </div>
  );
}

function AppInit() {
  const setHasSpecialCode = useGameStore(s => s.setHasSpecialCode);
  const applyOfflineProgress = useCareerStore(s => s.applyOfflineProgress);
  const initialize = useReferralStore(s => s.initialize);
  const hasSpecialCode = useReferralStore(s => s.hasSpecialCode);

  useEffect(() => {
    initialize();
    const storedSpecial = checkStoredReferralCode();
    if (storedSpecial) setHasSpecialCode(true);
    PET_CHAR_IDS.forEach(id => applyOfflineProgress(id));
    document.title = 'Qwrdx';
  }, []);

  useEffect(() => {
    if (hasSpecialCode) setHasSpecialCode(true);
  }, [hasSpecialCode]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
