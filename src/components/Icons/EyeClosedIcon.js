import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function EyeClosedIcon({ size = 20, color = '#555' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3l18 18"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.88 9.88A3 3 0 0 1 14.12 14.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.53 6.54C3.9 8.02 2.25 10 1.5 12c1.1 2.85 4.9 7 10.5 7 1.51 0 2.87-.28 4.09-.74m3.38-2.1C20.9 15.98 22.55 14 23.3 12 22.2 9.15 18.4 5 12.8 5c-.87 0-1.7.1-2.49.28"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
