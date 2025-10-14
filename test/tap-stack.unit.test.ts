import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import 'cdktf/lib/testing/adapters/jest';

describe('TapStack Unit Tests', () => {
  describe('Stack Creation', () => {
    it('should create stack with proper configuration', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'eu-west-1',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        defaultTags: {
          tags: {
            Environment: 'test',
            Repository: 'test-repo',
            CommitAuthor: 'test-author',
            Project: 'student-assessment-pipeline',
          },
        },
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
    });

    it('should use default values when props not provided', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toMatchSnapshot();
    });

    it('should respect AWS_REGION_OVERRIDE environment variable', () => {
      process.env.AWS_REGION_OVERRIDE = 'us-west-2';
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        awsRegion: 'eu-west-1',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('us-west-2');

      delete process.env.AWS_REGION_OVERRIDE;
    });
  });

  describe('Resource Configuration', () => {
    let stack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'eu-west-1',
      });
      synthesized = Testing.synth(stack);
    });

    it('should create VPC with proper CIDR block', () => {
      expect(synthesized).toContain('"cidr_block":"10.0.0.0/16"');
      expect(synthesized).toContain('"enable_dns_hostnames":true');
      expect(synthesized).toContain('"enable_dns_support":true');
    });

    it('should create public subnets in multiple AZs', () => {
      expect(synthesized).toContain('"cidr_block":"10.0.1.0/24"');
      expect(synthesized).toContain('"cidr_block":"10.0.2.0/24"');
      expect(synthesized).toContain('"availability_zone":"eu-west-1a"');
      expect(synthesized).toContain('"availability_zone":"eu-west-1b"');
    });

    it('should create private subnets in multiple AZs', () => {
      expect(synthesized).toContain('"cidr_block":"10.0.10.0/24"');
      expect(synthesized).toContain('"cidr_block":"10.0.11.0/24"');
    });

    it('should create internet gateway', () => {
      expect(synthesized).toContain('"aws_internet_gateway"');
    });

    it('should create security groups for all components', () => {
      expect(synthesized).toContain('assessment-alb-sg-test');
      expect(synthesized).toContain('assessment-ecs-sg-test');
      expect(synthesized).toContain('assessment-db-sg-test');
      expect(synthesized).toContain('assessment-cache-sg-test');
    });

    it('should configure ALB security group rules', () => {
      expect(synthesized).toContain('"from_port":80');
      expect(synthesized).toContain('"from_port":443');
      expect(synthesized).toContain('"protocol":"tcp"');
    });

    it('should configure ECS security group to allow traffic from ALB', () => {
      expect(synthesized).toContain('"from_port":8080');
      expect(synthesized).toContain('"to_port":8080');
    });

    it('should configure RDS security group for PostgreSQL', () => {
      expect(synthesized).toContain('"from_port":5432');
      expect(synthesized).toContain('"to_port":5432');
    });

    it('should configure ElastiCache security group for Redis', () => {
      expect(synthesized).toContain('"from_port":6379');
      expect(synthesized).toContain('"to_port":6379');
    });
  });

  describe('Secrets Manager', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    it('should create Secrets Manager secret', () => {
      expect(synthesized).toContain('aws_secretsmanager_secret');
      expect(synthesized).toContain('assessment-db-credentials-test');
    });

    it('should create secret version', () => {
      expect(synthesized).toContain('aws_secretsmanager_secret_version');
    });

    it('should include proper tags', () => {
      expect(synthesized).toContain('"Environment":"test"');
    });
  });

  describe('RDS Aurora Configuration', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    it('should create Aurora Serverless v2 cluster', () => {
      expect(synthesized).toContain('aws_rds_cluster');
      expect(synthesized).toContain('assessment-db-test');
      expect(synthesized).toContain('"engine":"aurora-postgresql"');
      expect(synthesized).toContain('"engine_mode":"provisioned"');
    });

    it('should enable storage encryption', () => {
      expect(synthesized).toContain('"storage_encrypted":true');
    });

    it('should configure backups', () => {
      expect(synthesized).toContain('"backup_retention_period":7');
    });

    it('should skip final snapshot for testing', () => {
      expect(synthesized).toContain('"skip_final_snapshot":true');
    });

    it('should configure serverless v2 scaling', () => {
      expect(synthesized).toContain('"min_capacity":0.5');
      expect(synthesized).toContain('"max_capacity":1');
    });

    it('should create cluster instance', () => {
      expect(synthesized).toContain('aws_rds_cluster_instance');
      expect(synthesized).toContain('"instance_class":"db.serverless"');
    });
  });

  describe('ElastiCache Redis Configuration', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    it('should create Redis replication group', () => {
      expect(synthesized).toContain('aws_elasticache_replication_group');
      expect(synthesized).toContain('assessment-cache-test');
    });

    it('should enable at-rest encryption', () => {
      expect(synthesized).toContain('"at_rest_encryption_enabled":"true"');
    });

    it('should enable transit encryption', () => {
      expect(synthesized).toContain('"transit_encryption_enabled":true');
    });

    it('should enable automatic failover', () => {
      expect(synthesized).toContain('"automatic_failover_enabled":true');
    });

    it('should enable multi-AZ', () => {
      expect(synthesized).toContain('"multi_az_enabled":true');
    });

    it('should configure snapshots', () => {
      expect(synthesized).toContain('"snapshot_retention_limit":5');
    });
  });

  describe('ECS Fargate Configuration', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    it('should create ECS cluster', () => {
      expect(synthesized).toContain('aws_ecs_cluster');
      expect(synthesized).toContain('assessment-cluster-test');
    });

    it('should create task definition with Fargate', () => {
      expect(synthesized).toContain('aws_ecs_task_definition');
      expect(synthesized).toContain('"requires_compatibilities":["FARGATE"]');
      expect(synthesized).toContain('"network_mode":"awsvpc"');
    });

    it('should configure task resources', () => {
      expect(synthesized).toContain('"cpu":"256"');
      expect(synthesized).toContain('"memory":"512"');
    });

    it('should create execution and task roles', () => {
      expect(synthesized).toContain('assessment-ecs-execution-test');
      expect(synthesized).toContain('assessment-ecs-task-test');
    });

    it('should attach ECS execution role policy', () => {
      expect(synthesized).toContain('AmazonECSTaskExecutionRolePolicy');
    });

    it('should create secrets access policy', () => {
      expect(synthesized).toContain('assessment-secrets-policy-test');
      expect(synthesized).toContain('secretsmanager:GetSecretValue');
      expect(synthesized).toContain('kms:Decrypt');
    });

    it('should create CloudWatch log group', () => {
      expect(synthesized).toContain('/ecs/assessment-test');
      expect(synthesized).toContain('"retention_in_days":30');
    });

    it('should create ECS service', () => {
      expect(synthesized).toContain('aws_ecs_service');
      expect(synthesized).toContain('assessment-service-test');
      expect(synthesized).toContain('"desired_count":2');
    });
  });

  describe('Application Load Balancer', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    it('should create ALB', () => {
      expect(synthesized).toContain('aws_alb');
      expect(synthesized).toContain('assessment-alb-test');
      expect(synthesized).toContain('"internal":false');
      expect(synthesized).toContain('"load_balancer_type":"application"');
    });

    it('should disable deletion protection', () => {
      expect(synthesized).toContain('"enable_deletion_protection":false');
    });

    it('should create target group', () => {
      expect(synthesized).toContain('aws_alb_target_group');
      expect(synthesized).toContain('"port":8080');
      expect(synthesized).toContain('"protocol":"HTTP"');
      expect(synthesized).toContain('"target_type":"ip"');
    });

    it('should configure health checks', () => {
      expect(synthesized).toContain('"path":"/health"');
      expect(synthesized).toContain('"healthy_threshold":2');
      expect(synthesized).toContain('"unhealthy_threshold":3');
    });

    it('should create listener', () => {
      expect(synthesized).toContain('aws_alb_listener');
      expect(synthesized).toContain('"port":80');
      expect(synthesized).toContain('"type":"forward"');
    });
  });

  describe('CloudWatch Monitoring', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    it('should create monitoring log group', () => {
      expect(synthesized).toContain('/aws/assessment/test');
      expect(synthesized).toContain('"retention_in_days":90');
    });

    it('should create ECS CPU alarm', () => {
      expect(synthesized).toContain('assessment-ecs-cpu-test');
      expect(synthesized).toContain('"metric_name":"CPUUtilization"');
      expect(synthesized).toContain('"namespace":"AWS/ECS"');
      expect(synthesized).toContain('"threshold":80');
    });

    it('should create RDS CPU alarm', () => {
      expect(synthesized).toContain('assessment-rds-cpu-test');
      expect(synthesized).toContain('"namespace":"AWS/RDS"');
    });

    it('should create ElastiCache CPU alarm', () => {
      expect(synthesized).toContain('assessment-cache-cpu-test');
      expect(synthesized).toContain('"namespace":"AWS/ElastiCache"');
      expect(synthesized).toContain('"threshold":75');
    });
  });

  describe('Stack Outputs', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    it('should export VPC ID', () => {
      expect(synthesized).toContain('"vpc-id"');
    });

    it('should export ECS cluster name', () => {
      expect(synthesized).toContain('"ecs-cluster-name"');
    });

    it('should export ECS service name', () => {
      expect(synthesized).toContain('"ecs-service-name"');
    });

    it('should export ALB DNS name', () => {
      expect(synthesized).toContain('"alb-dns-name"');
    });

    it('should export RDS endpoint', () => {
      expect(synthesized).toContain('"rds-cluster-endpoint"');
    });

    it('should export Redis endpoint', () => {
      expect(synthesized).toContain('"redis-endpoint"');
    });

    it('should export log group name', () => {
      expect(synthesized).toContain('"log-group-name"');
    });

    it('should export AWS account ID', () => {
      expect(synthesized).toContain('"aws-account-id"');
    });
  });

  describe('Resource Naming', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'myenv',
      });
      synthesized = Testing.synth(stack);
    });

    it('should include environmentSuffix in all resource names', () => {
      expect(synthesized).toContain('assessment-vpc-myenv');
      expect(synthesized).toContain('assessment-cluster-myenv');
      expect(synthesized).toContain('assessment-db-myenv');
      expect(synthesized).toContain('assessment-cache-myenv');
      expect(synthesized).toContain('assessment-alb-myenv');
    });

    it('should tag resources appropriately', () => {
      expect(synthesized).toContain('"Environment":"myenv"');
    });
  });

  describe('S3 Backend Configuration', () => {
    let synthesized: string;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);
    });

    it('should configure S3 backend', () => {
      expect(synthesized).toContain('"backend":"s3"');
      expect(synthesized).toContain('"bucket":"my-state-bucket"');
      expect(synthesized).toContain('"region":"us-west-2"');
      expect(synthesized).toContain('"encrypt":true');
    });

    it('should use environmentSuffix in state key', () => {
      expect(synthesized).toContain('test/TestStack.tfstate');
    });
  });
});
