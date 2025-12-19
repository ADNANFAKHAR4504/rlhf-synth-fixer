import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TapStack instantiates successfully via props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
      defaultTags: {
        tags: {
          Environment: 'prod',
          Project: 'nodejs-api',
        },
      },
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('should create VPC with correct CIDR block', () => {
    app = new App();
    stack = new TapStack(app, 'TestVPC', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_vpc');
    expect(synthesized).toContain('10.0.0.0/16');
    expect(synthesized).toContain('vpc-test');
  });

  test('should create public and private subnets', () => {
    app = new App();
    stack = new TapStack(app, 'TestSubnets', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('public-subnet-1');
    expect(synthesized).toContain('public-subnet-2');
    expect(synthesized).toContain('private-subnet-1');
    expect(synthesized).toContain('private-subnet-2');
    expect(synthesized).toContain('10.0.1.0/24');
    expect(synthesized).toContain('10.0.10.0/24');
  });

  test('should create NAT Gateway with Elastic IP', () => {
    app = new App();
    stack = new TapStack(app, 'TestNAT', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_nat_gateway');
    expect(synthesized).toContain('aws_eip');
    expect(synthesized).toContain('nat-gateway-test');
  });

  test('should create security groups for ALB and ECS', () => {
    app = new App();
    stack = new TapStack(app, 'TestSG', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_security_group');
    expect(synthesized).toContain('alb-sg-test');
    expect(synthesized).toContain('ecs-sg-test');
  });

  test('should create ECS cluster and task definition', () => {
    app = new App();
    stack = new TapStack(app, 'TestECS', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_ecs_cluster');
    expect(synthesized).toContain('aws_ecs_task_definition');
    expect(synthesized).toContain('aws_ecs_service');
    expect(synthesized).toContain('nodejs-api-cluster-test');
    expect(synthesized).toContain('FARGATE');
  });

  test('should create Application Load Balancer', () => {
    app = new App();
    stack = new TapStack(app, 'TestALB', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_lb');
    expect(synthesized).toContain('aws_lb_target_group');
    expect(synthesized).toContain('aws_lb_listener');
    expect(synthesized).toContain('nodejs-api-alb-test');
  });

  test('should create ECR repository', () => {
    app = new App();
    stack = new TapStack(app, 'TestECR', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_ecr_repository');
    expect(synthesized).toContain('nodejs-api-test');
  });

  test('should create S3 bucket for ALB logs', () => {
    app = new App();
    stack = new TapStack(app, 'TestS3', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_s3_bucket');
    expect(synthesized).toContain('alb-logs-test');
    expect(synthesized).toContain('aws_s3_bucket_public_access_block');
  });

  test('should create auto-scaling configuration', () => {
    app = new App();
    stack = new TapStack(app, 'TestAutoScaling', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_appautoscaling_target');
    expect(synthesized).toContain('aws_appautoscaling_policy');
    expect(synthesized).toContain('ecs:service:DesiredCount');
  });

  test('should configure S3 backend correctly', () => {
    app = new App();
    stack = new TapStack(app, 'TestBackend', {
      environmentSuffix: 'test',
      stateBucket: 'my-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('my-state-bucket');
    expect(synthesized).toContain('us-west-2');
    expect(synthesized).toContain('terraform.tfstate');
  });

  test('should include Terraform outputs', () => {
    app = new App();
    stack = new TapStack(app, 'TestOutputs', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('alb-dns-name');
    expect(synthesized).toContain('api-url');
    expect(synthesized).toContain('ecs-cluster-name');
    expect(synthesized).toContain('ecr-repository-url');
  });

  test('should use environment suffix in resource names', () => {
    app = new App();
    stack = new TapStack(app, 'TestNaming', {
      environmentSuffix: 'prod123',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: { tags: {} },
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('prod123');
    expect(synthesized).toContain('vpc-prod123');
    expect(synthesized).toContain('nodejs-api-cluster-prod123');
  });
});
