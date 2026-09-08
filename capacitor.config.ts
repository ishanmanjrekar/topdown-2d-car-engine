import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.topdown2dcarengine.app',
  appName: 'Top-Down 2D Car Engine',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
