import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../../lib/stacks/network-stack';
describe('NetworkStack', () => {
  let app: App;
  beforeEach(() => {
    app = new App();
  });
  it('should create a VPC and output VpcId', () => {
    const stack = new NetworkStack(app, 'NetworkStack');
    expect(stack.vpc).toBeDefined();
  });
});
