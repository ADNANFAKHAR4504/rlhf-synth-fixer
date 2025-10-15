import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import 'cdktf/lib/testing/adapters/jest';

describe('TapStack Unit Tests', () => {
  describe('Basic Stack Creation', () => {
    it('should create a valid CDKTF stack', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'eu-west-1',
        stateBucket: 'test-state-bucket',
        stateBucketRegion: 'us-east-1',
      });

      expect(stack).toBeDefined();
      
      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
      expect(synthesized.length).toBeGreaterThan(100);
    });

    it('should contain basic Terraform configuration', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test'
      });
      
      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('terraform');
      expect(synthesized).toContain('required_providers');
      expect(synthesized).toContain('aws');
    });
  });

  describe('Infrastructure Components', () => {
    let app: any;
    let stack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      app = Testing.app();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'eu-west-1',
      });
      synthesized = Testing.synth(stack);
    });

    it('should create VPC infrastructure', () => {
      expect(synthesized).toContain('aws_vpc');
      expect(synthesized).toContain('10.0.0.0/16');
      expect(synthesized).toContain('aws_subnet');
      expect(synthesized).toContain('aws_internet_gateway');
    });

    it('should create ECS infrastructure', () => {
      expect(synthesized).toContain('aws_ecs_cluster');
      expect(synthesized).toContain('aws_ecs_service');
      expect(synthesized).toContain('aws_ecs_task_definition');
      expect(synthesized).toContain('FARGATE');
    });

    it('should create RDS Aurora database', () => {
      expect(synthesized).toContain('aws_rds_cluster');
      expect(synthesized).toContain('aurora-postgresql');
      expect(synthesized).toContain('aws_rds_cluster_instance');
    });

    it('should create ElastiCache Redis', () => {
      expect(synthesized).toContain('aws_elasticache_replication_group');
      expect(synthesized).toContain('redis');
    });

    it('should create Application Load Balancer', () => {
      expect(synthesized).toContain('aws_alb');
      expect(synthesized).toContain('aws_alb_listener');
      expect(synthesized).toContain('aws_alb_target_group');
    });

    it('should create Secrets Manager resources', () => {
      expect(synthesized).toContain('aws_secretsmanager_secret');
      expect(synthesized).toContain('aws_secretsmanager_secret_version');
    });

    it('should create CloudWatch monitoring', () => {
      expect(synthesized).toContain('aws_cloudwatch_log_group');
      expect(synthesized).toContain('aws_cloudwatch_metric_alarm');
    });

    it('should use environment suffix in resource names', () => {
      expect(synthesized).toContain('-test');
      expect(synthesized).toContain('assessment-');
    });
  });

  describe('Configuration Options', () => {
    it('should use default values when no props provided', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'DefaultTestStack');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('-dev');
      expect(synthesized).toContain('eu-west-1');
      expect(synthesized).toContain('iac-rlhf-tf-states');
    });

    it('should configure S3 backend correctly', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'my-test-bucket',
        stateBucketRegion: 'us-west-2',
      });
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('backend');
      expect(synthesized).toContain('s3');
      expect(synthesized).toContain('my-test-bucket');
      expect(synthesized).toContain('us-west-2');
    });

    it('should respect AWS_REGION_OVERRIDE environment variable', () => {
      const originalRegion = process.env.AWS_REGION_OVERRIDE;
      process.env.AWS_REGION_OVERRIDE = 'us-west-2';
      
      try {
        const app = Testing.app();
        const stack = new TapStack(app, 'TestOverrideStack', {
          awsRegion: 'eu-west-1',
        });
        const synthesized = Testing.synth(stack);
        
        expect(synthesized).toContain('us-west-2');
      } finally {
        if (originalRegion) {
          process.env.AWS_REGION_OVERRIDE = originalRegion;
        } else {
          delete process.env.AWS_REGION_OVERRIDE;
        }
      }
    });
  });

  describe('Stack Outputs', () => {
    it('should create infrastructure outputs', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test'
      });
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('output');
      expect(synthesized).toContain('alb-dns-name');
      expect(synthesized).toContain('vpc-id');
      expect(synthesized).toContain('rds-cluster-endpoint');
      expect(synthesized).toContain('redis-endpoint');
    });
  });
});
