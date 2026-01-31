import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function MapMarkerOffIcon({ size = 48, color = '#bbb' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 9.5a3 3 0 0 1 4.24 4.24"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M12 22s8-7.58 8-12A8 8 0 1 0 4 10c0 4.42 8 12 8 12z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M3 3l18 18"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
