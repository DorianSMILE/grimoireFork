import { useLocation } from 'react-router-dom';

export type NavbarPageId =
  | 'grimoire'
  | 'armory'
  | 'dungeon'
  | 'dungeons'
  | 'vault'
  | 'shop'
  | 'alchemy'
  | 'hunting'
  | 'secret'
  | 'dungeon-stats'
  | 'achievements'
  | 'admin'
  | 'shop-admin'
  | 'pve-admin'
  | 'alchemy-admin';

interface NavbarProps {
  activePage?: NavbarPageId;
}

export function resolveNavbarPageFromPath(pathname: string): NavbarPageId {
  const clean = pathname.replace(/\.html$/, '').replace(/^\//, '');
  switch (clean) {
    case '':
    case 'index':
    case 'grimoire':
      return 'grimoire';
    case 'armory':
      return 'armory';
    case 'dungeon':
    case 'dungeons':
      return 'dungeons';
    case 'vault':
      return 'vault';
    case 'shop':
      return 'shop';
    case 'alchemy':
      return 'alchemy';
    case 'hunting':
      return 'hunting';
    case 'secrets':
    case 'secret':
      return 'secret';
    case 'dungeon-stats':
      return 'dungeon-stats';
    case 'achievements':
      return 'achievements';
    case 'shop-admin':
      return 'shop-admin';
    case 'pve-admin':
      return 'pve-admin';
    case 'alchemy-admin':
      return 'alchemy-admin';
    default:
      return 'grimoire';
  }
}

export function Navbar({ activePage }: NavbarProps) {
  const location = useLocation();
  const resolvedPage = activePage ?? resolveNavbarPageFromPath(location.pathname);

  return <app-navbar active-page={resolvedPage}></app-navbar>;
}
