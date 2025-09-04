import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../../lib/stacks/network-stack';
describe('NetworkStack Integration', () => {
  it('provisions a VPC with correct subnets and outputs', () => {
    const app = new App();
    const network = new NetworkStack(app, 'NetworkStack');
    expect(network.vpc).toBeDefined();
    expect(network.vpc.publicSubnets.length).toBeGreaterThan(0);
    expect(network.vpc.privateSubnets.length).toBeGreaterThan(0);
  });
});
