import { Testing, App } from 'cdktf';
import { EnterpriseStack } from '../lib/tap-stack';

describe('EnterpriseStack Integration Tests', () => {
  let synthesized: any;

  beforeAll(() => {
    const app = new App();
    const stack = new EnterpriseStack(app, 'integration-test-stack', 'prod');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  it('should synthesize a valid Terraform configuration', () => {
    expect(synthesized).toBeDefined();
  });

  it('should create resources with dynamic naming conventions', () => {
    const asg: any = Object.values(
      synthesized.resource.aws_autoscaling_group || {}
    )[0];
    expect(asg.name).toContain('prod-asg-app-');

    const rds: any = Object.values(
      synthesized.resource.aws_db_instance || {}
    )[0];
    expect(rds.identifier).toContain('prod-rds-main-');
  });

  it('should apply prevent_destroy lifecycle policy to critical resources', () => {
    const vpc: any = Object.values(synthesized.resource.aws_vpc || {})[0];
    expect(vpc.lifecycle.prevent_destroy).toBe(true);

    const lt: any = Object.values(
      synthesized.resource.aws_launch_template || {}
    )[0];
    expect(lt.lifecycle.prevent_destroy).toBe(true);

    const rds: any = Object.values(
      synthesized.resource.aws_db_instance || {}
    )[0];
    expect(rds.lifecycle.prevent_destroy).toBe(true);
  });

  it('should create networking resources including a NAT Gateway', () => {
    expect(Object.keys(synthesized.resource.aws_vpc || {}).length).toBe(1);
    expect(Object.keys(synthesized.resource.aws_nat_gateway || {}).length).toBe(
      1
    );
  });

  it('should create a random password resource', () => {
    expect(Object.keys(synthesized.resource.random_password || {}).length).toBe(
      1
    );
  });
});
