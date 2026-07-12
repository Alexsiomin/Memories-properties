import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b600092f4f8a424bb333dd9cf8db3a63',
  appName: 'Siomin',
  webDir: 'dist',
  server: {
    url: 'https://b600092f-4f8a-424b-b333-dd9cf8db3a63.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
