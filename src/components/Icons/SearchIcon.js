import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function SearchIcon({ size = 20, color = '#888' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M21 21l-4.35-4.35"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
