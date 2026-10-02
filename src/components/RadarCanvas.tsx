import React from 'react';
import { InteractiveRfRadar, InteractiveRfRadarProps } from './InteractiveRfRadar';

export type RadarCanvasProps = InteractiveRfRadarProps;

export const RadarCanvas: React.FC<RadarCanvasProps> = (props) => {
  return <InteractiveRfRadar {...props} />;
};

export { InteractiveRfRadar };
