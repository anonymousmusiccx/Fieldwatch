import { FilterState, Fleet, Sighting, WatchTarget } from '../types';

export function filterSightings(
  devices: Sighting[],
  filter: FilterState,
  fleets: Fleet[],
  customNames: Map<string, string>,
  watchlist: WatchTarget[],
  arrivalsSeen: Set<string>
): Sighting[] {
  const fleetMap = new Map(fleets.map((f) => [f.id, f]));
  const watchedKeys = new Set(
    watchlist.filter((w) => w.deviceKey).map((w) => w.deviceKey as string)
  );

  const nameQ = filter.nameQuery.trim().toLowerCase();
  const ouiQ = filter.ouiQuery.trim().toLowerCase();

  return devices.filter((dev) => {
    // 1. Radio Kind toggles
    if (dev.kind === 'WIFI' && !filter.showWifi) return false;
    if (dev.kind === 'BLE' && !filter.showBle) return false;

    // 2. RSSI threshold
    if (dev.rssi < filter.rssiMin) return false;

    // 3. Named / Custom Named / Watched
    const customName = customNames.get(dev.key);
    const hasName = Boolean(dev.name && dev.name.trim().length > 0) || Boolean(customName);

    if (filter.namedOnly && !hasName) return false;
    if (filter.customNamesOnly && !customName) return false;
    if (filter.watchedOnly && !watchedKeys.has(dev.key)) return false;

    // 4. Arrivals filter (unseen since operator marked seen)
    if (filter.arrivalsOnly && arrivalsSeen.has(dev.key)) return false;

    // 5. Fast Pair anonymous filter
    if (filter.hideFastPairAccountKey && dev.serviceUuids.includes('FE2C') && !dev.name) {
      return false;
    }

    // 6. Name query search
    if (nameQ) {
      const matchName = dev.name?.toLowerCase().includes(nameQ);
      const matchCustom = customName?.toLowerCase().includes(nameQ);
      const matchMac = dev.mac.toLowerCase().includes(nameQ);
      const matchVendor = dev.vendor?.toLowerCase().includes(nameQ);
      if (!matchName && !matchCustom && !matchMac && !matchVendor) {
        return false;
      }
    }

    // 7. OUI query search
    if (ouiQ) {
      const matchMac = dev.mac.toLowerCase().replace(/[:.-]/g, '').includes(ouiQ.replace(/[:.-]/g, ''));
      const matchVendor = dev.vendor?.toLowerCase().includes(ouiQ);
      if (!matchMac && !matchVendor) {
        return false;
      }
    }

    // 8. Signature Class filter
    if (filter.useClassFilter && filter.classes.length > 0) {
      const devClasses = new Set<string>();
      for (const fId of dev.fleetIds) {
        const fleet = fleetMap.get(fId);
        if (fleet) devClasses.add(fleet.kind);
      }

      const hasMatchingClass = filter.classes.some((c) => devClasses.has(c));
      if (filter.excludeClasses) {
        if (hasMatchingClass) return false;
      } else {
        if (!hasMatchingClass) return false;
      }
    }

    // 9. Specific Fleet / Signature filter
    if (filter.useFleetFilter && filter.fleetIds.length > 0) {
      const hasMatchingFleet = filter.fleetIds.some((id) => dev.fleetIds.includes(id));
      if (filter.excludeSignatures) {
        if (hasMatchingFleet) return false;
      } else {
        if (!hasMatchingFleet) return false;
      }
    }

    // 10. Included signatures
    if (filter.includeSignatures && filter.includeFleetIds.length > 0) {
      const hasIncluded = filter.includeFleetIds.some((id) => dev.fleetIds.includes(id));
      if (!hasIncluded) return false;
    }

    return true;
  });
}
