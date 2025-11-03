// Jest setup file to configure CDK for testing without Docker
process.env.SKIP_ESBUILD = '1';
process.env.CDK_DOCKER = 'false';
