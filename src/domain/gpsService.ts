import { GpsSample } from '../types';

export const GpsService = {
  /**
   * Haversine formula to compute great-circle distance between two points in meters
   */
  distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  },

  /**
   * Format single coordinate component with demo masking support
   */
  formatCoordinate(val: number, isLat: boolean, demo: boolean): string {
    if (demo) {
      const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W';
      const whole = Math.abs(Math.floor(val));
      return `${whole}°**.****' ${dir}`;
    }
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W';
    return `${Math.abs(val).toFixed(5)}° ${dir}`;
  },

  /**
   * Format lat/lon pair
   */
  formatCoords(lat: number, lon: number, demo = false): string {
    return `${this.formatCoordinate(lat, true, demo)}, ${this.formatCoordinate(lon, false, demo)}`;
  },

  /**
   * Calculate total displacement or bounding span in meters across a series of GPS points
   */
  calculatePathSpan(path: GpsSample[]): number {
    if (path.length < 2) return 0;
    let minLat = Infinity,
      maxLat = -Infinity,
      minLon = Infinity,
      maxLon = -Infinity;
    for (const p of path) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lon < minLon) minLon = p.lon;
      if (p.lon > maxLon) maxLon = p.lon;
    }
    return this.distanceMeters(minLat, minLon, maxLat, maxLon);
  },

  /**
   * Compute bearing angle in degrees [0, 360) from point 1 to point 2
   */
  bearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(((lon2 - lon1) * Math.PI) / 180);
    const theta = Math.atan2(y, x);
    return ((theta * 180) / Math.PI + 360) % 360;
  },
};
