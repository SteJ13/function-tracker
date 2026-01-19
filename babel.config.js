module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@utils': './src/utils',
          '@hooks': './src/hooks',
          '@context': './src/context',
          '@services': './src/services',
          '@navigation': './src/navigation',
        },
      },
    ],
  ],
};
