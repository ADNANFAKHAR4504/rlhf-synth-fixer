Prompt to Fix environmentSuffix Error in CDK TypeScript Project

You are an AWS CDK (TypeScript) generator.
My project structure is:

tap-infrastructure/
├── bin/
│   └── tap.ts
├── lib/
│   └── tapstack.ts
├── test/
│   └── tap-stack.unit.test.ts


I am getting this error when running CDK synth/test:

error TS2353: Object literal may only specify known properties, and 'environmentSuffix' does not exist in type 'StackProps'.


I want you to fix this error by:

Defining a custom props interface in lib/tapstack.ts that extends StackProps and includes environmentSuffix?: string.

export interface TapStackProps extends StackProps {
  environmentSuffix?: string;
}


Updating the stack class (TapStack) to accept TapStackProps instead of just StackProps.

Fixing bin/tap.ts so that when instantiating the stack, it passes environmentSuffix inside TapStackProps (not plain StackProps). Example:

new TapStack(app, 'TapStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  environmentSuffix: 'dev',
});


Fixing tests (test/tap-stack.unit.test.ts) so they also use TapStackProps with environmentSuffix.

Ensure the generated code is type-safe, compiles without errors, and passes cdk synth successfully.