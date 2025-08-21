import { App } from 'aws-cdk-lib';
import { ComputeStack } from '../../lib/stacks/compute-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { NetworkStack } from '../../lib/stacks/network-stack';
import { StorageStack } from '../../lib/stacks/storage-stack';
describe('ComputeStack Integration', () => {
  it('provisions ALB, ASG, IAM, SG with valid dependencies', () => {
    const app = new App();
    const network = new NetworkStack(app, 'NetworkStack');
    const kms = new KmsStack(app, 'KmsStack');
    const storage = new StorageStack(app, 'StorageStack', {
      dataKey: kms.dataKey,
    });
    const compute = new ComputeStack(app, 'ComputeStack', {
      vpc: network.vpc,
      dataKey: kms.dataKey,
      appBucket: storage.appBucket,
    });
    expect(compute.alb).toBeDefined();
    expect(compute.asg).toBeDefined();
    expect(compute.instanceRole).toBeDefined();
    expect(compute.appSecurityGroup).toBeDefined();
  });
  it('throws error if appBucket is missing', () => {
    const app = new App();
    const network = new NetworkStack(app, 'NetworkStack');
    const kms = new KmsStack(app, 'KmsStack');
    expect(
      () =>
        new ComputeStack(app, 'BadCompute', {
          vpc: network.vpc,
          dataKey: kms.dataKey,
          // appBucket missing
        } as any)
    ).toThrow();
  });
});
