// types/user.ts

export interface User {
  id: string;
  name: string;
  email: string;
  position?: string;
  zone?: string;
  profilePicUrl?: string;
  stats: {
    totalMatches: number;
    attendanceRate: number;
    punctualityAvg: number;
    attitudeAvg: number;
    mvpVotes: number;
  };
  preferredTheme?: "light" | "dark" | "system";
}
