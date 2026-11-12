import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, type NavbarPageId } from './Navbar';

interface AppLayoutProps {
  activePage?: NavbarPageId;
  hideNavbar?: boolean;
  children?: ReactNode;
}

export function AppLayout({ activePage, hideNavbar = false, children }: AppLayoutProps) {
  return (
    <>
      {!hideNavbar && <Navbar activePage={activePage} />}
      {children ?? <Outlet />}
    </>
  );
}
