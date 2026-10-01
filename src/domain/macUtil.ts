export const MacUtil = {
  normalize(raw: string): string {
    const hex = raw.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    if (hex.length < 2) return raw.toUpperCase();
    const parts: string[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      parts.push(hex.substring(i, i + 2));
    }
    return parts.join(':');
  },

  isRandomized(mac: string): boolean {
    const norm = this.normalize(mac);
    const firstOctetHex = norm.split(':')[0];
    if (!firstOctetHex) return false;
    const first = parseInt(firstOctetHex, 16);
    if (isNaN(first)) return false;
    // Local bit is bit 1 (0x02), Multicast bit is bit 0 (0x01)
    return (first & 0x02) !== 0 && (first & 0x01) === 0;
  },

  screenMac(mac: string, demo: boolean): string {
    if (!demo || !mac) return mac;
    const parts = this.normalize(mac).split(':');
    if (parts.length < 4) return mac;
    const keep = parts.length - 3;
    return parts.slice(0, keep).join(':') + ':**:**:**';
  },

  matchesPrefix(mac: string, prefix: string): boolean {
    const m = this.normalize(mac).replace(/:/g, '');
    const p = prefix.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    if (!p) return false;
    return m.startsWith(p);
  },
};
