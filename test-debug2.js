const cdk = require('aws-cdk-lib');

const app = new cdk.App();
const stack = new cdk.Stack(app, 'TestStack', {
  env: { region: 'us-east-1' }
});

console.log('Available AZs:', cdk.Stack.of(stack).availabilityZones);
console.log('AZ count:', cdk.Stack.of(stack).availabilityZones.length);
