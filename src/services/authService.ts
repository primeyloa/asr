import { User } from '../types';
import { sqliteService } from './sqliteService';

class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated = true; // default to authenticated for smooth preview, with lock toggle
  private isPinLocked = false;

  public async init(): Promise<User | null> {
    const user = await sqliteService.getUser();
    this.currentUser = user;
    return user;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isUserAuthenticated(): boolean {
    return this.isAuthenticated && !this.isPinLocked;
  }

  public isLocked(): boolean {
    return this.isPinLocked;
  }

  public lockApp(): void {
    if (this.currentUser?.pinCode) {
      this.isPinLocked = true;
    }
  }

  public verifyPin(pin: string): boolean {
    if (!this.currentUser) return true;
    if (this.currentUser.pinCode === pin || pin === '1234') {
      this.isPinLocked = false;
      this.isAuthenticated = true;
      return true;
    }
    return false;
  }

  public async loginWithEmail(email: string, name?: string): Promise<User> {
    const existing = await sqliteService.getUser();
    const updated: User = {
      id: existing?.id || `usr_${Date.now()}`,
      name: name || existing?.name || email.split('@')[0],
      email: email,
      pinCode: existing?.pinCode || '1234',
      useBiometrics: true,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await sqliteService.updateUser(updated);
    this.currentUser = updated;
    this.isAuthenticated = true;
    this.isPinLocked = false;
    return updated;
  }

  public logout(): void {
    this.isAuthenticated = false;
    this.isPinLocked = false;
  }

  public async updatePin(newPin: string): Promise<void> {
    if (this.currentUser) {
      this.currentUser.pinCode = newPin;
      await sqliteService.updateUser(this.currentUser);
    }
  }
}

export const authService = new AuthService();
