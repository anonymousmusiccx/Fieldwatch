import { GpsSample } from '../types';

export class GpsService {
  /**
   * Calculates distance between two GPS coordinates using Haversine formula
   */
  static haversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculates azimuth bearing from point A to point B in degrees (0-360)
   */
  static calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);

    return ((theta * 180) / Math.PI + 360) % 360;
  }

  /**
   * Generates a realistic mock path around a base coordinate
   */
  static generateMockTrack(
    centerLat = 37.7749,
    centerLng = -122.4194,
    points = 15
  ): GpsSample[] {
    const samples: GpsSample[] = [];
    const now = Date.now();
    let curLat = centerLat;
    let curLng = centerLng;

    for (let i = 0; i < points; i++) {
      curLat += (Math.random() - 0.48) * 0.0003;
      curLng += (Math.random() - 0.48) * 0.0003;
      samples.push({
        latitude: curLat,
        longitude: curLng,
        altitudeMeters: 45 + Math.random() * 5,
        accuracyMeters: 4.5,
        timestampMs: now - (points - i) * 8000,
      });
    }
    return samples;
  }
}
