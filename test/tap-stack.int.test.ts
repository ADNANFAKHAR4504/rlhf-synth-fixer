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

  it('should configure the S3 backend correctly', () => {
    const backend = synthesized.terraform.backend.s3;
    expect(backend).toBeDefined();
    expect(backend.bucket).toBe('${aws_s3_bucket.TerraformStateBucket.bucket}');
    expect(backend.key).toBe('enterprise-stack.tfstate');
    expect(backend.region).toBe('us-east-1');
  });

  it('should create all required resources with correct naming conventions', () => {
    const vpc: any = Object.values(synthesized.resource.aws_vpc || {})[0];
    expect(vpc.tags.Name).toBe('prod-vpc-main');

    const asg: any = Object.values(
      synthesized.resource.aws_autoscaling_group || {}
    )[0];
    expect(asg.name).toBe('prod-asg-app');

    const rds: any = Object.values(
      synthesized.resource.aws_db_instance || {}
    )[0];
    expect(rds.identifier).toBe('prod-rds-main');
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

  it('should create exactly one of each major resource type', () => {
    expect(Object.keys(synthesized.resource.aws_vpc || {}).length).toBe(1);
    expect(
      Object.keys(synthesized.resource.aws_autoscaling_group || {}).length
    ).toBe(1);
    expect(Object.keys(synthesized.resource.aws_db_instance || {}).length).toBe(
      1
    );
    expect(Object.keys(synthesized.resource.aws_s3_bucket || {}).length).toBe(
      1
    );
    expect(
      Object.keys(synthesized.resource.aws_dynamodb_table || {}).length
    ).toBe(1);
  });
});
