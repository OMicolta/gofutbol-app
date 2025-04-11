// types/field.ts

export interface Field {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  zoneId: string;
  availability: { day: string; times: string[] };
  amenities: {
    hasReferee: boolean;
    hasBalls: boolean;
    hasLights: boolean;
    hasParking: boolean;
  };
  price: number;
  photos: string[];
  rating: number;
}
