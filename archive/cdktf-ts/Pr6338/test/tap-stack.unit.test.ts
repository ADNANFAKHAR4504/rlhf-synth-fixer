import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;

  beforeEach(() => {
    app = new App({ context: { excludeStackIdFromLogicalIds: 'true' } });
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    test('creates stack with default props', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('"data":');
      expect(synthesized).toContain('"output":');
    });

    test('TapStack instantiates successfully via props', () => {
      const stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('custom-state-bucket');
      expect(synthesized).toContain('us-west-2');
    });

    test('TapStack uses default values when no props provided', () => {
      const stack = new TapStack(app, 'TestTapStackDefault');
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('iac-rlhf-tf-states');
      expect(synthesized).toContain('us-east-1');
    });

    test('creates stack with custom environment suffix', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'custom123',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('custom123');
    });

    test('creates stack with default tags', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        defaultTags: [
          {
            tags: {
              Project: 'TestProject',
              Owner: 'TestOwner',
            },
          },
        ],
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('TestProject');
      expect(synthesized).toContain('TestOwner');
    });
  });

  describe('Environment Configurations', () => {
    test('uses dev configuration for dev environment', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('10.1.0.0/16');
      expect(synthesized).toContain('db.t3.medium');
      expect(synthesized).toContain('"cpu": "256"');
      expect(synthesized).toContain('"memory": "512"');
    });

    test('uses staging configuration for staging environment', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('10.2.0.0/16');
      expect(synthesized).toContain('db.t3.large');
      expect(synthesized).toContain('"cpu": "512"');
      expect(synthesized).toContain('"memory": "1024"');
    });

    test('uses prod configuration for prod environment', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('10.3.0.0/16');
      expect(synthesized).toContain('db.r5.large');
      expect(synthesized).toContain('"cpu": "1024"');
      expect(synthesized).toContain('"memory": "2048"');
    });

    test('defaults to dev configuration for unknown environment', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'unknown',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('10.1.0.0/16');
      expect(synthesized).toContain('db.t3.medium');
    });
  });

  describe('VPC Resources', () => {
    test('creates VPC with correct CIDR block', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('"cidr_block": "10.1.0.0/16"');
      expect(synthesized).toContain('"enable_dns_hostnames": true');
      expect(synthesized).toContain('"enable_dns_support": true');
    });

    test('creates 3 public and 3 private subnets', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('10.1.0.0/24');
      expect(synthesized).toContain('10.1.1.0/24');
      expect(synthesized).toContain('10.1.2.0/24');
      expect(synthesized).toContain('10.1.10.0/24');
      expect(synthesized).toContain('10.1.11.0/24');
      expect(synthesized).toContain('10.1.12.0/24');
      expect(synthesized).toContain('"map_public_ip_on_launch": true');
    });

    test('creates internet gateway and NAT gateways', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_internet_gateway');
      expect(synthesized).toContain('aws_nat_gateway');
      expect(synthesized).toContain('aws_eip');
    });

    test('VPC resources include environmentSuffix in names', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'unique123',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('vpc-dev-unique123');
      expect(synthesized).toContain('igw-dev-unique123');
    });
  });

  describe('Aurora RDS Resources', () => {
    test('creates RDS cluster with correct configuration', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_rds_cluster');
      expect(synthesized).toContain('"engine": "aurora-postgresql"');
      expect(synthesized).toContain('"engine_version": "14.6"');
      expect(synthesized).toContain('"database_name": "appdb"');
      expect(synthesized).toContain('"master_username": "dbadmin"');
      expect(synthesized).toContain('"storage_encrypted": true');
    });

    test('creates DB subnet group and security group', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_db_subnet_group');
      expect(synthesized).toContain('aurora-subnet-dev-test');
      expect(synthesized).toContain('aurora-sg-dev-test');
      expect(synthesized).toContain('"from_port": 5432');
      expect(synthesized).toContain('"to_port": 5432');
    });

    test('stores master password in SSM Parameter Store', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_ssm_parameter');
      expect(synthesized).toContain('"type": "SecureString"');
      expect(synthesized).toContain('/test/aurora/master-password');
      // Verify random password is generated
      expect(synthesized).toContain('random_password');
    });

    test('Aurora resources include environmentSuffix', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'unique456',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aurora-dev-unique456');
    });
  });

  describe('ECR Resources', () => {
    test('creates ECR repository with lifecycle policy', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_ecr_repository');
      expect(synthesized).toContain('app-repo-test');
      expect(synthesized).toContain('"scan_on_push": true');
      expect(synthesized).toContain('aws_ecr_lifecycle_policy');
      expect(synthesized).toContain('Keep last 10 images');
    });

    test('ECR repository includes environmentSuffix', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'unique789',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('app-repo-unique789');
    });
  });

  describe('ECS Resources', () => {
    test('creates ECS cluster and CloudWatch log group', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_ecs_cluster');
      expect(synthesized).toContain('app-cluster-dev-test');
      expect(synthesized).toContain('aws_cloudwatch_log_group');
      expect(synthesized).toContain('/ecs/dev-test');
    });

    test('creates ECS task definition with Fargate', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_ecs_task_definition');
      expect(synthesized).toContain('FARGATE');
      expect(synthesized).toContain('"network_mode": "awsvpc"');
    });

    test('creates ALB with target group and listener', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_lb');
      expect(synthesized).toContain('alb-dev-test');
      expect(synthesized).toContain('aws_lb_target_group');
      expect(synthesized).toContain('"path": "/health"');
      expect(synthesized).toContain('aws_lb_listener');
      expect(synthesized).toContain('"port": 80');
    });

    test('creates HTTPS listener when certificate ARN is provided', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_lb_listener');
      expect(synthesized).toContain('"port": 443');
      expect(synthesized).toContain('"protocol": "HTTPS"');
      expect(synthesized).toContain('ELBSecurityPolicy-TLS-1-2-2017-01');
      expect(synthesized).toContain('arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012');
      // HTTP listener should redirect to HTTPS
      expect(synthesized).toContain('"type": "redirect"');
      expect(synthesized).toContain('HTTP_301');
    });

    test('HTTP listener forwards directly when no certificate is provided', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('"type": "forward"');
      // Should not have redirect when no certificate
      const redirectCount = (synthesized.match(/"type": "redirect"/g) || []).length;
      expect(redirectCount).toBe(0);
    });

    test('creates IAM roles for ECS tasks', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_iam_role');
      expect(synthesized).toContain('ecs-execution-dev-test');
      expect(synthesized).toContain('ecs-task-dev-test');
    });

    test('ECS resources scale based on environment', () => {
      const devStack = new TapStack(app, 'DevStack', {
        environmentSuffix: 'dev',
      });
      const prodStack = new TapStack(app, 'ProdStack', {
        environmentSuffix: 'prod',
      });

      const devSynth = Testing.synth(devStack);
      const prodSynth = Testing.synth(prodStack);

      // Verify different desired counts per environment
      expect(devSynth).toContain('"desired_count": 1');
      expect(prodSynth).toContain('"desired_count": 3');

      // Verify different CPU/memory configurations
      expect(devSynth).toContain('"cpu": "256"');
      expect(prodSynth).toContain('"cpu": "1024"');
    });
  });

  describe('S3 Resources', () => {
    test('creates S3 bucket with encryption and public access block', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_s3_bucket');
      expect(synthesized).toContain('app-bucket-dev-test');
      expect(synthesized).toContain(
        'aws_s3_bucket_server_side_encryption_configuration',
      );
      expect(synthesized).toContain('"sse_algorithm": "AES256"');
      expect(synthesized).toContain('aws_s3_bucket_public_access_block');
      expect(synthesized).toContain('"block_public_acls": true');
    });

    test('configures S3 lifecycle policies', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(synthesized).toContain('"storage_class": "STANDARD_IA"');
      expect(synthesized).toContain('"storage_class": "GLACIER"');
    });
  });

  describe('CloudWatch Monitoring Resources', () => {
    test('creates CloudWatch dashboard', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_cloudwatch_dashboard');
      expect(synthesized).toContain('dev-dashboard-test');
      expect(synthesized).toContain('AWS/RDS');
      expect(synthesized).toContain('AWS/ECS');
      expect(synthesized).toContain('AWS/ApplicationELB');
    });

    test('creates CloudWatch alarms for ECS and RDS', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_cloudwatch_metric_alarm');
      expect(synthesized).toContain('dev-ecs-cpu-test');
      expect(synthesized).toContain('dev-ecs-memory-test');
      expect(synthesized).toContain('dev-rds-cpu-test');
    });

    test('alarm thresholds vary by environment', () => {
      const devStack = new TapStack(app, 'DevStack', {
        environmentSuffix: 'dev',
      });
      const prodStack = new TapStack(app, 'ProdStack', {
        environmentSuffix: 'prod',
      });

      const devSynth = Testing.synth(devStack);
      const prodSynth = Testing.synth(prodStack);

      expect(devSynth).toContain('"threshold": 80');
      expect(prodSynth).toContain('"threshold": 70');
    });
  });

  describe('Stack Outputs', () => {
    test('exports all required outputs', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('"vpc_id"');
      expect(synthesized).toContain('"aurora_cluster_endpoint"');
      expect(synthesized).toContain('"aurora_cluster_arn"');
      expect(synthesized).toContain('"alb_dns_name"');
      expect(synthesized).toContain('"alb_arn"');
      expect(synthesized).toContain('"ecs_cluster_name"');
      expect(synthesized).toContain('"ecs_cluster_arn"');
      expect(synthesized).toContain('"ecr_repository_url"');
      expect(synthesized).toContain('"s3_bucket_name"');
      expect(synthesized).toContain('"s3_bucket_arn"');
      expect(synthesized).toContain('"environment_name"');
      expect(synthesized).toContain('"environment_suffix"');
    });
  });

  describe('Backend Configuration', () => {
    test('configures S3 backend with encryption and locking', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-west-2',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('test-bucket');
      expect(synthesized).toContain('test/TestStack.tfstate');
      expect(synthesized).toContain('"encrypt": true');
      expect(synthesized).toContain('"use_lockfile": true');
      expect(synthesized).toContain('us-west-2');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all resource names include environmentSuffix', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test123',
      });

      const synthesized = Testing.synth(stack);
      const matches = synthesized.match(/test123/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(10);
    });

    test('all resources have proper environment tags', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('"Environment": "dev"');
    });

    test('resources are destroyable without retention', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).not.toContain('deletion_protection: true');
      expect(synthesized).toContain('"skip_final_snapshot": true');
    });
  });
});
