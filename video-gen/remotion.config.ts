import { Config } from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Enable WebGL for Three.js templates
Config.setChromiumOpenGlRenderer('angle');
