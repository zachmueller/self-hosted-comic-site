import { ReactNode } from 'react';
import Header from './Header';
import NavBar from './NavBar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Header />
      <NavBar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
