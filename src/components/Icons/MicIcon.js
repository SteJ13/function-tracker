import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function MicIcon({ size = 22, color = '#666' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z"
        fill={color}
      />
      <Path
        d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V21h2v-3.07A7 7 0 0019 11z"
        fill={color}
      />
    </Svg>
  );
}
