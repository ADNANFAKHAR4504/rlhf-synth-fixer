import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TapStack instantiates successfully with custom props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'test',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
      defaultTags: [{ tags: { CustomTag: 'CustomValue' } }],
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('custom-state-bucket');
    expect(synthesized).toContain('test/TestTapStackWithProps.tfstate');
  });

  test('TapStack uses default values when no props provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('iac-rlhf-tf-states');
    expect(synthesized).toContain('dev/TestTapStackDefault.tfstate');
  });

  test('TapStack respects AWS_REGION_OVERRIDE for us-east-2', () => {
    app = new App();
    stack = new TapStack(app, 'TestRegionOverride', {
      awsRegion: 'us-west-1',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"region": "us-east-2"');
  });

  test('TapStack creates VPC stack with environmentSuffix', () => {
    app = new App();
    stack = new TapStack(app, 'TestVPCStack', {
      environmentSuffix: 'prod',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('eks-vpc-prod');
  });

  test('TapStack creates EKS cluster stack with environmentSuffix', () => {
    app = new App();
    stack = new TapStack(app, 'TestEKSStack', {
      environmentSuffix: 'staging',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('eks-cluster-staging');
  });

  test('TapStack outputs are defined', () => {
    app = new App();
    stack = new TapStack(app, 'TestOutputs', {
      environmentSuffix: 'dev',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"output"');
    expect(synthesized).toContain('cluster-endpoint');
    expect(synthesized).toContain('cluster-certificate-authority');
    expect(synthesized).toContain('oidc-provider-url');
    expect(synthesized).toContain('cluster-name');
    expect(synthesized).toContain('region');
    expect(synthesized).toContain('vpc-id');
    expect(synthesized).toContain('kubectl-config-command');
  });

  test('TapStack configures S3 backend correctly', () => {
    app = new App();
    stack = new TapStack(app, 'TestBackend', {
      environmentSuffix: 'qa',
      stateBucket: 'my-terraform-state',
      stateBucketRegion: 'eu-west-1',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"backend"');
    expect(synthesized).toContain('"s3"');
    expect(synthesized).toContain('my-terraform-state');
    expect(synthesized).toContain('qa/TestBackend.tfstate');
    expect(synthesized).toContain('eu-west-1');
    expect(synthesized).toContain('"encrypt": true');
  });

  test('TapStack configures AWS provider with default tags', () => {
    app = new App();
    stack = new TapStack(app, 'TestProviderTags', {
      environmentSuffix: 'prod',
      defaultTags: [
        {
          tags: {
            Project: 'EKS-Deployment',
            Owner: 'DevOps',
          },
        },
      ],
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('"provider"');
    expect(synthesized).toContain('"aws"');
    expect(synthesized).toContain('Project');
    expect(synthesized).toContain('EKS-Deployment');
    expect(synthesized).toContain('Owner');
    expect(synthesized).toContain('DevOps');
  });

  test('TapStack uses empty array for defaultTags when not provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestNoTags');
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack creates all required resources', () => {
    app = new App();
    stack = new TapStack(app, 'TestAllResources', {
      environmentSuffix: 'test',
    });
    synthesized = Testing.synth(stack);

    // VPC resources
    expect(synthesized).toContain('aws_vpc');
    expect(synthesized).toContain('aws_subnet');
    expect(synthesized).toContain('aws_internet_gateway');
    expect(synthesized).toContain('aws_nat_gateway');
    expect(synthesized).toContain('aws_eip');
    expect(synthesized).toContain('aws_route_table');

    // EKS resources
    expect(synthesized).toContain('aws_eks_cluster');
    expect(synthesized).toContain('aws_eks_node_group');
    expect(synthesized).toContain('aws_eks_addon');
    expect(synthesized).toContain('aws_iam_role');
    expect(synthesized).toContain('aws_iam_policy');
    expect(synthesized).toContain('aws_security_group');
    expect(synthesized).toContain('aws_cloudwatch_log_group');
    expect(synthesized).toContain('aws_iam_openid_connect_provider');
  });
}
);
