const cdk = require('aws-cdk-lib');
const { Template } = require('aws-cdk-lib/assertions');
const { TapStack } = require('./lib/tap-stack');

const app = new cdk.App();
const stack = new TapStack(app, 'TapStacktest', { environmentSuffix: 'test' });
const template = Template.fromStack(stack);

const subnets = template.findResources('AWS::EC2::Subnet');
console.log('Total subnets:', Object.keys(subnets).length);

const publicSubnets = Object.entries(subnets).filter(([_, resource]) => 
  resource.Properties?.MapPublicIpOnLaunch === true
);
console.log('Public subnets:', publicSubnets.length);

const privateSubnets = Object.entries(subnets).filter(([_, resource]) => 
  resource.Properties?.MapPublicIpOnLaunch === false
);
console.log('Private subnets:', privateSubnets.length);

// Debug output
Object.entries(subnets).forEach(([key, resource]) => {
  console.log(`${key}: MapPublicIpOnLaunch = ${resource.Properties?.MapPublicIpOnLaunch}`);
});
