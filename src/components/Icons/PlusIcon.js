import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export default function PlusIcon({ size = 28, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" stroke={color} strokeWidth={1.5} fill="none" />
      <Path
        d="M12 8v8M8 12h8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
