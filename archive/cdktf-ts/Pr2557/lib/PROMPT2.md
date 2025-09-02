The lint got failed due to below error:

~ npm run lint -- --fix

> tap@0.1.0 lint
> eslint . --fix

=============

WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.

You may find that it works just fine, or you may not.

SUPPORTED TYPESCRIPT VERSIONS: >=4.7.4 <5.6.0

YOUR TYPESCRIPT VERSION: 5.9.2

Please only submit bug reports when using the officially supported version.

=============

/home/akshat/Desktop/iac-test-automations/lib/tap-stack.ts
2:10 error 'App' is defined but never used @typescript-eslint/no-unused-vars

✖ 1 problem (1 error, 0 warnings)
