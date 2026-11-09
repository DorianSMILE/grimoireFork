export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  token?: string;
  error?: string;
}

export interface CurrentCombatSessionResponse {
  sessionId?: string | null;
}

export interface RoleAuthority {
  authority: string;
}

export interface CurrentUserResponse {
  id: number;
  username: string;
  roles: RoleAuthority[];
  monnaie: number;
  activeTitle?: string | null;
  unlockedTitles?: string[];
  unlockedVault?: boolean;
  unlockedAlchemy?: boolean;
  unlockedShop?: boolean;
  shopLockMessage?: string;
  huntingClaimable?: number;
  unseenAlchemyCount?: number;
  unseenDungeonsCount?: number;
  availableCharacterSlots?: number;
  claimableSecretRewardsCount?: number;
  activeCombatSessionId?: string | null;
  tutorialCompleted?: boolean;
  tutorialPhase?: string;
}
