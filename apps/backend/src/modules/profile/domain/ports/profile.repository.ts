import { Profile } from '../profile.aggregate';

export const PROFILE_REPOSITORY = Symbol('ProfileRepository');

export interface ProfileRepository {
  save(profile: Profile): Promise<number>;
  findById(id: number): Promise<Profile | null>;
  findBySessionId(sessionId: string): Promise<Profile | null>;
}
