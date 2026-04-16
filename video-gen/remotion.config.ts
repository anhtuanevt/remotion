import path from 'path';
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Enable WebGL for Three.js templates
Config.setChromiumOpenGlRenderer('angle');
// Resolve Next.js @/ path alias for Remotion bundler
const srcPath = path.resolve(process.cwd(), 'src');
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...((config.resolve?.alias as Record<string, string>) ?? {}),
      '@': srcPath,
    },
  },
}));
