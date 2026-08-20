// Computed shapes for the admin dashboard. These are query results, not stored
// documents, so they're plain interfaces rather than Zod schemas.

export interface AdminTotals {
  users: number;
  newUsers7d: number;
  events: number;
  upcomingEvents: number;
  pollingEvents: number;
  rsvpHeadcount: number;
  rallies: number;
  openRallies: number;
  follows: number;
  pushSubscribers: number;
}

export interface TrafficDay {
  day: string; // YYYY-MM-DD (UTC)
  accounts: number;
  guests: number;
}

export interface TrafficSummary {
  views: number;
  uniqueVisitors: number;
  accountViews: number;
  guestViews: number;
  standaloneViews: number;
}

export interface LocationStat {
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  accounts: number;
  guests: number;
  total: number;
}

export interface PathStat {
  path: string;
  views: number;
  uniques: number;
}

export interface DeviceStat {
  device: string;
  views: number;
}

export interface RecentUser {
  userId: string;
  name: string;
  email: string;
  handle: string | null;
  image: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
}

export interface RecentEvent {
  id: string;
  title: string;
  date: string;
  dateStatus: string;
  isPrivate: boolean;
  createdAt: string | null;
  hostName: string | null;
  headcount: number;
}

export interface RecentRally {
  id: string;
  activity: string;
  authorName: string;
  authorHandle: string | null;
  interested: number;
  status: string;
  visibility: string;
  createdAt: string;
}

// The product thesis, measured: idea → interest → event → locked date → people going.
export interface LoopFunnel {
  rallies: number;
  withInterest: number;
  converted: number;
  pollsCreated: number;
  pollsVotedOn: number;
  pollsLocked: number;
  rsvpsFromRallies: number;
}

export interface AdminDashboard {
  windowDays: number;
  totals: AdminTotals;
  traffic: TrafficDay[];
  trafficSummary: TrafficSummary;
  locations: LocationStat[];
  topPaths: PathStat[];
  devices: DeviceStat[];
  recentUsers: RecentUser[];
  recentEvents: RecentEvent[];
  recentRallies: RecentRally[];
  funnel: LoopFunnel;
  geoAvailable: boolean;
}
