import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  describe('Infrastructure Synthesis', () => {
    test('should synthesize complete infrastructure without errors', () => {
      const app = new App();
      const stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: 'inttest',
        stateBucket: 'test-state-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: {
            Environment: 'test',
            ManagedBy: 'cdktf',
          },
        },
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);

      expect(manifest).toBeDefined();
      expect(manifest.resource).toBeDefined();
    });

    test('should create all required AWS resources', () => {
      const app = new App();
      const stack = new TapStack(app, 'ResourceTestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: { tags: {} },
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);

      // Verify critical resources exist
      expect(manifest.resource.aws_vpc).toBeDefined();
      expect(manifest.resource.aws_ecs_cluster).toBeDefined();
      expect(manifest.resource.aws_lb).toBeDefined();
      expect(manifest.resource.aws_ecr_repository).toBeDefined();
      expect(manifest.resource.aws_nat_gateway).toBeDefined();
    });

    test('should configure networking correctly', () => {
      const app = new App();
      const stack = new TapStack(app, 'NetworkTestStack', {
        environmentSuffix: 'nettest',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: { tags: {} },
      });

      const synthesized = Testing.synth(stack);

      // Verify networking components
      expect(synthesized).toContain('aws_internet_gateway');
      expect(synthesized).toContain('aws_nat_gateway');
      expect(synthesized).toContain('aws_route_table');
      expect(synthesized).toContain('public-subnet-1');
      expect(synthesized).toContain('private-subnet-1');
    });

    test('should configure security groups properly', () => {
      const app = new App();
      const stack = new TapStack(app, 'SecurityTestStack', {
        environmentSuffix: 'sectest',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: { tags: {} },
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);

      // Verify security groups
      expect(manifest.resource.aws_security_group).toBeDefined();
      expect(manifest.resource.aws_security_group_rule).toBeDefined();
    });

    test('should create ECS Fargate service with correct configuration', () => {
      const app = new App();
      const stack = new TapStack(app, 'ECSTestStack', {
        environmentSuffix: 'ecstest',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: { tags: {} },
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);

      // Verify ECS components
      const ecsService = Object.values(manifest.resource.aws_ecs_service)[0] as any;
      expect(ecsService.launch_type).toBe('FARGATE');
      expect(ecsService.desired_count).toBe(2);
    });

    test('should configure ALB with HTTP listener', () => {
      const app = new App();
      const stack = new TapStack(app, 'ALBTestStack', {
        environmentSuffix: 'albtest',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: { tags: {} },
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);

      // Verify ALB and listener
      expect(manifest.resource.aws_lb).toBeDefined();
      expect(manifest.resource.aws_lb_listener).toBeDefined();

      const listener = Object.values(manifest.resource.aws_lb_listener)[0] as any;
      expect(listener.port).toBe(80);
      expect(listener.protocol).toBe('HTTP');
    });

    test('should include terraform outputs', () => {
      const app = new App();
      const stack = new TapStack(app, 'OutputTestStack', {
        environmentSuffix: 'outtest',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: { tags: {} },
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);

      // Verify outputs
      expect(manifest.output).toBeDefined();
      expect(manifest.output['alb-dns-name']).toBeDefined();
      expect(manifest.output['ecs-cluster-name']).toBeDefined();
      expect(manifest.output['ecr-repository-url']).toBeDefined();
    });
  });
});
