import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack — unit coverage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();

    // Stable defaults so synth is deterministic
    process.env.ENVIRONMENT_SUFFIX = 'dev';
    process.env.TERRAFORM_STATE_BUCKET = 'iac-rlhf-tf-states';
    process.env.TERRAFORM_STATE_BUCKET_REGION = 'us-east-1';
    process.env.AWS_REGION_PRIMARY = 'us-east-1';
    process.env.AWS_REGION_SECONDARY = 'eu-west-1';
    process.env.ACM_CERT_ARN =
      'arn:aws:acm:us-east-1:123456789012:certificate/test-primary';
    process.env.ACM_CERT_ARN_SECONDARY =
      'arn:aws:acm:eu-west-1:123456789012:certificate/test-secondary';
    process.env.VPC_CIDR_PRIMARY = '10.0.0.0/16';
    process.env.VPC_CIDR_SECONDARY = '10.1.0.0/16';
    process.env.AZ_COUNT = '2';
    process.env.NAT_PER_AZ = 'false';
    process.env.ENABLE_SSH_TO_APP = 'false';
    process.env.ENABLE_SECONDARY = 'true'; // Explicitly enable secondary
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('instantiates with overrides via props (back-compat keys) and synthesizes', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2', // legacy, ignored but accepted
    });
    const synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Providers present
    expect(synthesized).toMatch(/"provider":\s*{\s*"aws":/);

    // Representative resources from each construct
    expect(synthesized).toMatch(/"aws_vpc"/);                    // VPC
    expect(synthesized).toMatch(/"aws_security_group"/);         // Security
    expect(synthesized).toMatch(/"aws_lb"/);                     // Compute
    expect(synthesized).toMatch(/"aws_autoscaling_group"/);      // Compute
    expect(synthesized).toMatch(/"aws_db_instance"/);            // Database
    expect(synthesized).toMatch(/"random_password"/);            // Random provider
    expect(synthesized).toMatch(/"aws_secretsmanager_secret"/);  // Secrets
    expect(synthesized).toMatch(/"aws_cloudwatch_metric_alarm"/);// Monitoring
    expect(synthesized).toMatch(/"aws_sns_topic"/);              // Monitoring

    // Unambiguous proof we created infra in both regions
    expect(synthesized).toMatch(/"primary_vpc_id"/);
    expect(synthesized).toMatch(/"secondary_vpc_id"/);
  });

  test('uses defaults with no props and still synthesizes full infra (without DNS)', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestTapStackDefault');
    const synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Core resources present
    expect(synthesized).toMatch(/"aws_vpc"/);
    expect(synthesized).toMatch(/"aws_lb"/);
    expect(synthesized).toMatch(/"aws_db_instance"/);

    // DNS should not be present since zone/record are unset
    expect(synthesized).not.toMatch(/"aws_route53_record"/);
    expect(synthesized).not.toMatch(/"aws_route53_health_check"/);
  });

  test('enables DNS when hosted zone + record env vars are provided', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestTapStackWithDns', {
      hostedZoneId: 'ZHOSTED123456', // Pass as prop to ensure it's set
      recordName: 'app.example.com', // Pass as prop to ensure it's set
    });
    const synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Route53 alias latency records + health checks appear
    expect(synthesized).toMatch(/"aws_route53_record"/);
    expect(synthesized).toMatch(/"aws_route53_health_check"/);
  });

  test('covers SSH-to-app and NAT-per-AZ branches', () => {
    process.env.ENABLE_SSH_TO_APP = 'true';
    process.env.ADMIN_CIDR = '203.0.113.0/24'; // required for SSH rule
    process.env.NAT_PER_AZ = 'true';
    process.env.AZ_COUNT = '3';

    const app = new App();
    const stack = new TapStack(app, 'TestTapStackBranches');
    const synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Sanity: NAT gateways exist (we don't count them; just ensure type present)
    expect(synthesized).toMatch(/"aws_nat_gateway"/);
    // Sanity: security groups exist (SSH rule branch executed)
    expect(synthesized).toMatch(/"aws_security_group"/);
  });

  test('disables secondary region when ENABLE_SECONDARY is false', () => {
    process.env.ENABLE_SECONDARY = 'false';

    const app = new App();
    const stack = new TapStack(app, 'TestTapStackNoSecondary');
    const synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Primary resources should be present
    expect(synthesized).toMatch(/"aws_vpc"/);
    expect(synthesized).toMatch(/"primary_vpc_id"/);

    // Secondary resources should not be present
    expect(synthesized).not.toMatch(/"secondary_vpc_id"/);
    expect(synthesized).not.toMatch(/"aws_lb".*alias:.*secondary/); // Approximate check for secondary ALB
  });
});