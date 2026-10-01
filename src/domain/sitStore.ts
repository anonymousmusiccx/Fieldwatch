import { Sighting, Sit, GpsSample } from '../types';

const SITS_STORAGE_KEY = 'fieldwatch_sits_v1';

export class SitStore {
  private sits: Sit[] = [];
  private openSit: Sit | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SITS_STORAGE_KEY);
      if (raw) {
        this.sits = JSON.parse(raw);
      }
    } catch {
      this.sits = [];
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SITS_STORAGE_KEY, JSON.stringify(this.sits));
    } catch {}
  }

  getSits(): Sit[] {
    return this.sits;
  }

  getActiveSit(): Sit | null {
    return this.openSit;
  }

  startSit(name?: string, initialDevices: Sighting[] = []): Sit {
    const sit: Sit = {
      id: `sit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name?.trim() || `Sit #${this.sits.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      openedAt: Date.now(),
      closedAt: null,
      devices: [...initialDevices],
      operatorPath: [],
    };
    this.openSit = sit;
    this.sits.unshift(sit);
    this.persist();
    return sit;
  }

  updateCurrentSit(devices: Sighting[], operatorPath: GpsSample[]) {
    if (!this.openSit) return;
    this.openSit.devices = [...devices];
    this.openSit.operatorPath = [...operatorPath];
    this.persist();
  }

  pauseSit() {
    if (this.openSit) {
      this.openSit.closedAt = Date.now();
      this.openSit = null;
      this.persist();
    }
  }

  renameSit(id: string, name: string) {
    const s = this.sits.find((item) => item.id === id);
    if (s) {
      s.name = name;
      this.persist();
    }
  }

  deleteSit(id: string) {
    if (this.openSit?.id === id) {
      this.openSit = null;
    }
    this.sits = this.sits.filter((s) => s.id !== id);
    this.persist();
  }

  compareSits(
    sitId1: string,
    sitId2: string
  ): {
    appeared: Sighting[];
    departed: Sighting[];
    persisted: { device: Sighting; rssiDelta: number }[];
  } {
    const sit1 = this.sits.find((s) => s.id === sitId1);
    const sit2 = this.sits.find((s) => s.id === sitId2);

    if (!sit1 || !sit2) {
      return { appeared: [], departed: [], persisted: [] };
    }

    const map1 = new Map(sit1.devices.map((d) => [d.key, d]));
    const map2 = new Map(sit2.devices.map((d) => [d.key, d]));

    const appeared: Sighting[] = [];
    const departed: Sighting[] = [];
    const persisted: { device: Sighting; rssiDelta: number }[] = [];

    // Sit 2 (newer) vs Sit 1 (older)
    for (const [key, dev2] of map2.entries()) {
      const dev1 = map1.get(key);
      if (!dev1) {
        appeared.push(dev2);
      } else {
        persisted.push({
          device: dev2,
          rssiDelta: dev2.rssi - dev1.rssi,
        });
      }
    }

    for (const [key, dev1] of map1.entries()) {
      if (!map2.has(key)) {
        departed.push(dev1);
      }
    }

    return { appeared, departed, persisted };
  }
}

export const sitStore = new SitStore();
