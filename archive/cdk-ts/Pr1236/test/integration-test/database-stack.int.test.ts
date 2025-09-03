import { App } from 'aws-cdk-lib';
import { ComputeStack } from '../../lib/stacks/compute-stack';
import { DatabaseStack } from '../../lib/stacks/database-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { NetworkStack } from '../../lib/stacks/network-stack';
describe('DatabaseStack Integration', () => {
  it('provisions RDS with valid SG and IAM role from ComputeStack', () => {
    const app = new App();
    const network = new NetworkStack(app, 'NetworkStack');
    const kms = new KmsStack(app, 'KmsStack');
    const compute = new ComputeStack(app, 'ComputeStack', {
      vpc: network.vpc,
      dataKey: kms.dataKey,
      appBucket: { grantReadWrite: jest.fn() } as any,
    });
    const db = new DatabaseStack(app, 'DatabaseStack', {
      vpc: network.vpc,
      dataKey: kms.dataKey,
      appSecurityGroup: compute.appSecurityGroup,
      appInstanceRole: compute.instanceRole,
    });
    expect(db.dbInstance).toBeDefined();
  });
  it('throws error if appSecurityGroup is missing', () => {
    const app = new App();
    const network = new NetworkStack(app, 'NetworkStack');
    const kms = new KmsStack(app, 'KmsStack');
    expect(
      () =>
        new DatabaseStack(app, 'BadDb', {
          vpc: network.vpc,
          dataKey: kms.dataKey,
          // appSecurityGroup missing
          appInstanceRole: { grantPrincipal: jest.fn() } as any,
        } as any)
    ).toThrow();
  });
});
