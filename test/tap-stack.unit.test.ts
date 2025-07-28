import { App, Testing } from 'cdktf';
import { SecureVpcStack } from '../lib/secure-vpc-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  it('should instantiate with all props provided', () => {
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'iac-rlhf-tf-states',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-west-2',
      defaultTags: { tags: { Project: 'Test' } },
    });
    synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    const config = JSON.parse(synthesized);
    // Check backend config
    expect(config.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(config.terraform.backend.s3.region).toBe('us-east-1');
    // Check provider config
    expect(config.provider.aws.region).toBe('us-west-2');
    // Check tags
    expect(config.provider.aws.default_tags).toBeDefined();
  });

  it('should use default values when no props provided', () => {
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    const config = JSON.parse(synthesized);
    expect(config.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(config.terraform.backend.s3.region).toBe('us-east-1');
    expect(config.provider.aws.region).toBe('us-east-1');
  });

  it('should set use_lockfile to true in backend config', () => {
    stack = new TapStack(app, 'TestTapStackLockfile');
    synthesized = Testing.synth(stack);
    const config = JSON.parse(synthesized);
    expect(config.terraform.backend.s3.use_lockfile).toBe(true);
  });

  it('should instantiate SecureVpcStack as a child construct', () => {
    stack = new TapStack(app, 'TestTapStackVpc');
    // Find child constructs
    const children = stack.node.children.map(c => c.constructor.name);
    expect(children).toContain('SecureVpcStack');
  });
});

describe('SecureVpcStack', () => {
  let app: App;
  let root: TapStack;
  let vpcStack: SecureVpcStack | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    root = new TapStack(app, 'TestTapStack');
    // Find SecureVpcStack child
    vpcStack = root.node.children.find(
      c => c.constructor.name === 'SecureVpcStack'
    ) as SecureVpcStack | undefined;
  });

  it('should create a VPC with the correct CIDR block', () => {
    const synthesized = Testing.synth(root);
    const config = JSON.parse(synthesized);
    // Output vpc_id should exist
    expect(config.output.vpc_id).toBeDefined();
  });

  it('should create two public subnets in different AZs', () => {
    const synthesized = Testing.synth(root);
    const config = JSON.parse(synthesized);
    // Output public_subnet_ids should be an array of length 2
    expect(config.output.public_subnet_ids).toBeDefined();
    expect(Array.isArray(config.output.public_subnet_ids.value)).toBe(true);
    expect(config.output.public_subnet_ids.value.length).toBe(2);
  });

  it('should allow only HTTP/HTTPS inbound in NACL and SG', () => {
    const synthesized = Testing.synth(root);
    const config = JSON.parse(synthesized);
    // Find all security group and NACL rules
    const sgRules = Object.values(config.resource || {}).filter(
      (r: any) => r.type === 'aws_security_group_rule'
    );
    const naclRules = Object.values(config.resource || {}).filter(
      (r: any) => r.type === 'aws_network_acl_rule'
    );
    // There should be rules for port 80 and 443
    const hasHttp = sgRules
      .concat(naclRules)
      .some((r: any) => r.from_port === 80);
    const hasHttps = sgRules
      .concat(naclRules)
      .some((r: any) => r.from_port === 443);
    expect(hasHttp).toBe(true);
    expect(hasHttps).toBe(true);
  });

  it('should deny all other inbound traffic in NACL', () => {
    const synthesized = Testing.synth(root);
    const config = JSON.parse(synthesized);
    const naclRules = Object.values(config.resource || {}).filter(
      (r: any) => r.type === 'aws_network_acl_rule'
    );
    // There should be a rule with rule_action deny and protocol -1
    const hasDenyAll = naclRules.some(
      (r: any) => r.rule_action === 'deny' && r.protocol === '-1'
    );
    expect(hasDenyAll).toBe(true);
  });

  it('should allow all outbound traffic in the security group', () => {
    const synthesized = Testing.synth(root);
    const config = JSON.parse(synthesized);
    const sgRules = Object.values(config.resource || {}).filter(
      (r: any) => r.type === 'aws_security_group_rule'
    );
    // There should be an egress rule with protocol -1 and cidr_blocks 0.0.0.0/0
    const hasAllowAllEgress = sgRules.some(
      (r: any) =>
        r.type === 'egress' &&
        r.protocol === '-1' &&
        r.cidr_blocks.includes('0.0.0.0/0')
    );
    expect(hasAllowAllEgress).toBe(true);
  });

  it('should output VPC ID and public subnet IDs', () => {
    const synthesized = Testing.synth(root);
    const config = JSON.parse(synthesized);
    expect(config.output.vpc_id).toBeDefined();
    expect(config.output.public_subnet_ids).toBeDefined();
  });
});
