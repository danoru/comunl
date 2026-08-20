// ── Event ──────────────────────────────────────────────────────────────────
export {
  EventSchema,
  CreateEventSchema,
  UpdateEventSchema,
  SerializedEventSchema,
  serializeEvent,
  resolveAnonymousGuests,
} from "./event";
export type { Event, CreateEvent, UpdateEvent, SerializedEvent } from "./event";

// ── Item ───────────────────────────────────────────────────────────────────
export {
  ItemTypeSchema,
  ItemSchema,
  CreateItemSchema,
  SerializedItemSchema,
  LEGACY_ITEM_TYPE_MAP,
  resolveItemAttribution,
  serializeItem,
} from "./item";
export type { ItemType, Item, CreateItem, SerializedItem } from "./item";

// ── Guest ──────────────────────────────────────────────────────────────────
export {
  GuestSchema,
  AdditionalGuestSchema,
  SerializedGuestSchema,
  CreateGuestSchema,
  serializeGuest,
} from "./guest";
export type { Guest, AdditionalGuest, SerializedGuest, CreateGuest } from "./guest";

// ── Comment ────────────────────────────────────────────────────────────────
export {
  CommentSchema,
  SerializedCommentSchema,
  CreateCommentSchema,
  serializeComment,
} from "./comment";
export type { Comment, SerializedComment, CreateComment } from "./comment";

// ── Date poll ──────────────────────────────────────────────────────────────
export {
  DatePollOptionSchema,
  DatePollSchema,
  DatePollVoteSchema,
  VoteResponseSchema,
  SerializedDatePollSchema,
  SerializedDatePollVoteSchema,
  CreateDatePollSchema,
  CastVoteSchema,
  serializeDatePoll,
  serializeDatePollVote,
} from "./datePoll";
export type {
  DatePollOption,
  DatePoll,
  DatePollVote,
  VoteResponse,
  SerializedDatePoll,
  SerializedDatePollVote,
  CreateDatePoll,
  CastVote,
} from "./datePoll";

// ── Intent (Rally) ─────────────────────────────────────────────────────────
export {
  InterestedSchema,
  IntentSchema,
  CreateIntentSchema,
  UpdateIntentSchema,
  SerializedIntentSchema,
  serializeIntent,
} from "./intent";
export type { Interested, Intent, CreateIntent, UpdateIntent, SerializedIntent } from "./intent";

// ── Notification ───────────────────────────────────────────────────────────
export {
  NotificationTypeSchema,
  NotificationSchema,
  SerializedNotificationSchema,
  serializeNotification,
} from "./notification";
export type { NotificationType, Notification, SerializedNotification } from "./notification";

// ── Follow ─────────────────────────────────────────────────────────────────
export { FollowSchema, isFriend } from "./follow";
export type { Follow, FollowState } from "./follow";

// ── Push subscription ──────────────────────────────────────────────────────
export { PushSubscriptionSchema, RegisterPushSchema } from "./pushSubscription";
export type { PushSubscription, RegisterPush } from "./pushSubscription";

// ── Page view (analytics) ──────────────────────────────────────────────────
export { PageViewSchema, DeviceSchema, TrackSchema } from "./pageView";
export type { PageView, Device, Track } from "./pageView";

// ── Admin dashboard (computed shapes) ──────────────────────────────────────
export type {
  AdminTotals,
  TrafficDay,
  TrafficSummary,
  LocationStat,
  PathStat,
  DeviceStat,
  RecentUser,
  RecentEvent,
  RecentRally,
  LoopFunnel,
  AdminDashboard,
} from "./admin";

// ── User ───────────────────────────────────────────────────────────────────
export { UserSchema, UpdateUserSchema, SerializedUserSchema, serializeUser } from "./user";
export type { User, UpdateUser, SerializedUser } from "./user";

// ── Tenant ─────────────────────────────────────────────────────────────────
export {
  TenantSchema,
  SiteConfigSchema,
  getSiteConfig,
  isMainSite,
  MAIN_TENANT_ID,
} from "./tenant";
export type { Tenant, SiteConfig } from "./tenant";
