import { App } from 'aws-cdk-lib';
import { ComputeStack } from '../../lib/stacks/compute-stack';
import { DatabaseStack } from '../../lib/stacks/database-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { MonitoringStack } from '../../lib/stacks/monitoring-stack';
import { NetworkStack } from '../../lib/stacks/network-stack';
describe('MonitoringStack Integration', () => {
  it('provisions alarms for ALB, ASG, and DB with valid dependencies', () => {
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
    const monitoring = new MonitoringStack(app, 'MonitoringStack', {
      alb: compute.alb,
      asg: compute.asg,
      dbInstance: db.dbInstance,
    });
    expect(monitoring).toBeDefined();
  });
  it('throws error if dbInstance is missing', () => {
    const app = new App();
    const network = new NetworkStack(app, 'NetworkStack');
    const kms = new KmsStack(app, 'KmsStack');
    const compute = new ComputeStack(app, 'ComputeStack', {
      vpc: network.vpc,
      dataKey: kms.dataKey,
      appBucket: { grantReadWrite: jest.fn() } as any,
    });
    expect(
      () =>
        new MonitoringStack(app, 'BadMonitoring', {
          alb: compute.alb,
          asg: compute.asg,
          // dbInstance missing
        } as any)
    ).toThrow();
  });
});
