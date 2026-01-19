import * as React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

export default function EyeOffIcon({ size = 22, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 5c-7 0-11 7-11 7a18.5 18.5 0 004.06 4.94L3 19l1.41 1.41L19.41 5.41 18 4l-2.06 2.06A18.5 18.5 0 0012 5z"
        fill={color}
      />
    </Svg>
  );
}
