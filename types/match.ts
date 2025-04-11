// types/match.ts

// Interfaces para los partidos
export interface BaseMatch {
  id: string;
  date: string;
  location: string;
  type: string;
  organizer: string;
  players: {
    confirmed: number;
    total: number;
  };
}

export interface MyMatch extends BaseMatch {
  status: string;
}

export interface OpenMatch extends BaseMatch {
  distance: string;
  level: string;
}

export type Match = MyMatch | OpenMatch;

// Tipos para el mock data
export interface MatchesMockData {
  myMatches: MyMatch[];
  openMatches: OpenMatch[];
}
