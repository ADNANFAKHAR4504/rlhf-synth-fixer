import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack — integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };

    // Workspace / env
    process.env.ENVIRONMENT_SUFFIX = 'test';

    // Backend + Regions
    process.env.TERRAFORM_STATE_BUCKET = 'iac-rlhf-tf-states';
    process.env.TERRAFORM_STATE_BUCKET_REGION = 'us-east-1';
    process.env.TF_LOCK_TABLE = 'iac-rlhf-tf-locks';
    process.env.AWS_REGION_PRIMARY = 'us-east-1';
    process.env.AWS_REGION_SECONDARY = 'eu-west-1';

    // Networking / Compute
    process.env.VPC_CIDR_PRIMARY = '10.0.0.0/16';
    process.env.VPC_CIDR_SECONDARY = '10.1.0.0/16';
    process.env.AZ_COUNT = '2';
    process.env.NAT_PER_AZ = 'false';
    process.env.ENABLE_SSH_TO_APP = 'false';
    process.env.APP_PORT = '80';

    // TLS certs
    process.env.ACM_CERT_ARN =
      'arn:aws:acm:us-east-1:123456789012:certificate/integration-primary';
    process.env.ACM_CERT_ARN_SECONDARY =
      'arn:aws:acm:eu-west-1:123456789012:certificate/integration-secondary';

    // DNS so the Route53 construct is exercised
    process.env.DNS_HOSTED_ZONE_ID = 'ZTESTHOSTEDZONE123';
    process.env.DNS_RECORD_NAME = 'app.example.com';
    process.env.DNS_HEALTHCHECK_PATH = '/';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('synth produces expected cross-cutting resources and backend path', () => {
    const app = new App();
    const stackId = 'TapStackIntegration';
    const stack = new TapStack(app, stackId);
    const synthesized = Testing.synth(stack);

    expect(synthesized).toBeDefined();

    // ---- Backend path includes workspace + stack id
    // infrastructure/<ENVIRONMENT_SUFFIX>/<stackId>.tfstate
    expect(synthesized).toMatch(
      new RegExp(`infrastructure/test/${stackId}\\.tfstate`)
    );

    // ---- VPC layer present
    expect(synthesized).toMatch(/"aws_vpc"/);
    expect(synthesized).toMatch(/"aws_subnet"/);
    expect(synthesized).toMatch(/"aws_internet_gateway"/);

    // ---- Security groups (ALB/App/RDS)
    expect(synthesized).toMatch(/"aws_security_group"/);

    // ---- Compute layer (ALB/TG/Listeners/LT/ASG)
    expect(synthesized).toMatch(/"aws_lb"/);
    expect(synthesized).toMatch(/"aws_lb_target_group"/);
    expect(synthesized).toMatch(/"aws_lb_listener"/);
    expect(synthesized).toMatch(/"aws_launch_template"/);
    expect(synthesized).toMatch(/"aws_autoscaling_group"/);

    // ---- Database + Secrets + Random
    expect(synthesized).toMatch(/"random_password"/);
    expect(synthesized).toMatch(/"aws_secretsmanager_secret"/);
    expect(synthesized).toMatch(/"aws_db_instance"/);
    expect(synthesized).toMatch(/"aws_db_subnet_group"/);
    expect(synthesized).toMatch(/"aws_db_parameter_group"/);

    // ---- Monitoring (SNS + CW alarms)
    expect(synthesized).toMatch(/"aws_sns_topic"/);
    expect(synthesized).toMatch(/"aws_cloudwatch_metric_alarm"/);

    // ---- DNS (Route53 latency + health checks)
    expect(synthesized).toMatch(/"aws_route53_record"/);
    expect(synthesized).toMatch(/"aws_route53_health_check"/);

    // ---- Prove we emitted both region VPC outputs (multi-region wiring)
    expect(synthesized).toMatch(/"primary_vpc_id"/);
    expect(synthesized).toMatch(/"secondary_vpc_id"/);
  });
});
