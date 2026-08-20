import { z } from "zod";

// One-tap follow, no request/approval flow — friends = MUTUAL follow, which is
// the gate `users.profileVisibility: "mutual"` refers to. Main-site only.
export const FollowSchema = z.object({
  tenantId: z.string(),
  followerId: z.string(),
  followeeId: z.string(),
  createdAt: z.coerce.date().default(() => new Date()),
});

export type Follow = z.infer<typeof FollowSchema>;

export interface FollowState {
  following: boolean; // viewer follows target
  followedBy: boolean; // target follows viewer
}

export function isFriend(state: FollowState): boolean {
  return state.following && state.followedBy;
}
