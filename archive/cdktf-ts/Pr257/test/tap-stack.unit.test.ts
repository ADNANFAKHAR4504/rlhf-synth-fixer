import { App, Testing } from 'cdktf';
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
    expect(config.provider.aws[0].region).toBe('us-west-2');
    // Check tags
    expect(config.provider.aws[0].default_tags).toBeDefined();
  });

  it('should use default values when no props provided', () => {
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    const config = JSON.parse(synthesized);
    expect(config.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(config.terraform.backend.s3.region).toBe('us-east-1');
    expect(config.provider.aws[0].region).toBe('us-west-2');
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
