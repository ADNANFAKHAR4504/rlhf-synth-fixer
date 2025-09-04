
new TapStack(app, 'TapStack', {
  environmentSuffix: 'dev',
});


But I’m getting this error:

TS2353: Object literal may only specify known properties, and 'environmentSuffix' does not exist in type 'TapStackProps'.


Please update my TapStackProps interface in lib/tapstack.ts to include environmentSuffix as an optional property, and make sure it’s properly passed into the stack class.