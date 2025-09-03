The build failed with below error, please fix it:
"$ npm run build

> tap@0.1.0 build
> tsc --skipLibCheck

lib/tap-stack.ts:248:20 - error TS2339: Property 'base64' does not exist on type 'typeof Fn'.

248 userData: Fn.base64(userData),
~~~~~~

Found 1 error in lib/tap-stack.ts:248

npm notice
npm notice New major version of npm available! 10.9.2 -> 11.5.2
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.5.2
npm notice To update run: npm install -g npm@11.5.2
npm notice"
