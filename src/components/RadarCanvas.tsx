import React from 'react';
import { InteractiveRfRadar } from './InteractiveRfRadar';
import { Sighting, Fleet } from '../types';

export interface RadarCanvasProps {
  devices: Sighting[];
  fleets: Fleet[];
  selectedKey?: string | null;
  onSelectDevice?: (device: Sighting) => void;
  onSelectKey?: (key: string) => void;
  nightMode?: boolean;
  demoMode?: boolean;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = (props) => {
  return <InteractiveRfRadar {...props} />;
};

export { InteractiveRfRadar };
