import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'IntegrationTapStack', {
      environmentSuffix: 'int',
      stateBucket: 'iac-rlhf-tf-states',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-west-2',
      defaultTags: { tags: { Env: 'integration' } },
    });
    synthesized = Testing.synth(stack);
  });

  it('should synthesize valid Terraform JSON', () => {
    expect(() => JSON.parse(synthesized)).not.toThrow();
    const config = JSON.parse(synthesized);
    expect(config).toHaveProperty('terraform');
    expect(config).toHaveProperty('provider');
    expect(config.provider.aws.region).toBe('us-west-2');
    expect(config.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(config.terraform.backend.s3.region).toBe('us-east-1');
  });

  it('should include SecureVpcStack resources in the output', () => {
    const config = JSON.parse(synthesized);
    // Check for VPC output
    expect(config.output.vpc_id).toBeDefined();
    expect(config.output.public_subnet_ids).toBeDefined();
    // Check for at least one subnet and one security group rule
    const resources = config.resource || {};
    const hasSubnet = Object.values(resources).some(
      (r: any) => r.type && r.type.includes('subnet')
    );
    const hasSgRule = Object.values(resources).some(
      (r: any) => r.type && r.type.includes('security_group_rule')
    );
    expect(hasSubnet).toBe(true);
    expect(hasSgRule).toBe(true);
  });

  it('should allow only HTTP/HTTPS inbound and deny all other inbound in NACL', () => {
    const config = JSON.parse(synthesized);
    const naclRules = Object.values(config.resource || {}).filter(
      (r: any) => r.type === 'aws_network_acl_rule'
    );
    const hasHttp = naclRules.some(
      (r: any) => r.from_port === 80 && r.rule_action === 'allow'
    );
    const hasHttps = naclRules.some(
      (r: any) => r.from_port === 443 && r.rule_action === 'allow'
    );
    const hasDenyAll = naclRules.some(
      (r: any) => r.rule_action === 'deny' && r.protocol === '-1'
    );
    expect(hasHttp).toBe(true);
    expect(hasHttps).toBe(true);
    expect(hasDenyAll).toBe(true);
  });

  it('should allow all outbound traffic in the security group', () => {
    const config = JSON.parse(synthesized);
    const sgRules = Object.values(config.resource || {}).filter(
      (r: any) => r.type === 'aws_security_group_rule'
    );
    const hasAllowAllEgress = sgRules.some(
      (r: any) =>
        r.type === 'egress' &&
        r.protocol === '-1' &&
        r.cidr_blocks.includes('0.0.0.0/0')
    );
    expect(hasAllowAllEgress).toBe(true);
  });

  it('should produce outputs for VPC and subnets', () => {
    const config = JSON.parse(synthesized);
    expect(config.output.vpc_id).toBeDefined();
    expect(config.output.public_subnet_ids).toBeDefined();
    expect(Array.isArray(config.output.public_subnet_ids.value)).toBe(true);
    expect(config.output.public_subnet_ids.value.length).toBe(2);
  });
});
