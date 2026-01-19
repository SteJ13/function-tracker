import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function EyeIcon({ size = 22, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 11a4 4 0 110-8 4 4 0 010 8z"
        fill={color}
      />
    </Svg>
  );
}
