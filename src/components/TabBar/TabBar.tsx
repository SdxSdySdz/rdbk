import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './TabBar.module.css';

interface TabItem {
  icon: string;
  label: string;
  path: string;
}

const TABS: TabItem[] = [
  { icon: '🏠', label: 'Home', path: '/' },
  { icon: '🍎', label: 'Daily', path: '/daily-routine' },
  { icon: '🎮', label: 'Games', path: '/mini-games' },
  { icon: '📚', label: 'Study', path: '/education' },
  { icon: '🛒', label: 'Shop', path: '/shop' },
  { icon: '👥', label: 'Friends', path: '/friends' },
  { icon: '🏦', label: 'Bank', path: '/bank' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
];

const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className={styles.tabBar} role="navigation" aria-label="Main navigation">
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path ||
          (tab.path !== '/' && location.pathname.startsWith(tab.path));
        return (
          <button
            key={tab.path}
            className={`${styles.tabItem} ${isActive ? styles.active : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.icon}>{tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default TabBar;
