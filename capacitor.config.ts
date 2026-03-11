import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quran.journey',
  appName: 'ايه/ayah',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
