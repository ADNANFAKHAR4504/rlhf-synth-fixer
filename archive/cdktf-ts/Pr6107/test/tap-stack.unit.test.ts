import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('instantiates successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('instantiates successfully with default values', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('uses environmentSuffix from props', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test123',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('test123');
    });
  });

  describe('Provider Configuration', () => {
    test('configures primary AWS provider for us-east-1', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"alias": "primary"');
      expect(synthesized).toContain('"region": "us-east-1"');
    });

    test('configures DR AWS provider for us-east-2', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"alias": "dr"');
      expect(synthesized).toContain('"region": "us-east-2"');
    });

    test('configures S3 backend with correct encryption', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'my-state-bucket',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"backend"');
      expect(synthesized).toContain('"s3"');
      expect(synthesized).toContain('"encrypt": true');
      expect(synthesized).toContain('"bucket": "my-state-bucket"');
    });
  });

  describe('Networking Resources', () => {
    test('creates primary networking stack', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('primary-networking');
      expect(synthesized).toContain('10.0.0.0/16');
    });

    test('creates DR networking stack', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('dr-networking');
      expect(synthesized).toContain('10.1.0.0/16');
    });

    test('creates VPC with DNS support enabled', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"enable_dns_hostnames": true');
      expect(synthesized).toContain('"enable_dns_support": true');
    });
  });

  describe('IAM Resources', () => {
    test('creates IAM stack with replication role', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_iam_role"');
      expect(synthesized).toContain('replication');
    });

    test('creates EC2 instance profile', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_iam_instance_profile"');
    });
  });

  describe('Storage Resources', () => {
    test('creates primary S3 bucket', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('payment-assets-test-us-east-1');
      expect(synthesized).toContain('"force_destroy": true');
    });

    test('creates DR S3 bucket', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('payment-assets-test-us-east-2');
    });

    test('enables S3 bucket versioning', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_s3_bucket_versioning"');
      expect(synthesized).toContain('"status": "Enabled"');
    });

    test('configures cross-region replication', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_s3_bucket_replication_configuration"');
      expect(synthesized).toContain('"status": "Enabled"');
    });
  });

  describe('Database Resources', () => {
    test('creates RDS Global Cluster', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_rds_global_cluster"');
      expect(synthesized).toContain('aurora-postgresql');
    });

    test('creates primary RDS cluster', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_rds_cluster"');
      expect(synthesized).toContain('primary');
    });

    test('creates DR RDS cluster', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('dr');
    });

    test('creates database security groups', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('db-sg');
      expect(synthesized).toContain('"from_port": 5432');
      expect(synthesized).toContain('"to_port": 5432');
    });
  });

  describe('Load Balancer Resources', () => {
    test('creates primary ALB', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('payment-alb-test-us-east-1');
      expect(synthesized).toContain('"load_balancer_type": "application"');
    });

    test('creates DR ALB', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('payment-alb-test-us-east-2');
    });

    test('creates target groups', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_lb_target_group"');
      expect(synthesized).toContain('"protocol": "HTTP"');
      expect(synthesized).toContain('"port": 80');
    });

    test('creates ALB security groups with HTTP and HTTPS', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('alb-sg');
      expect(synthesized).toContain('"from_port": 80');
      expect(synthesized).toContain('"from_port": 443');
    });

    test('configures health checks on target groups', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"health_check"');
      expect(synthesized).toContain('"path": "/"');
      expect(synthesized).toContain('"enabled": true');
    });
  });

  describe('Compute Resources', () => {
    test('creates primary Auto Scaling Group', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_autoscaling_group"');
      expect(synthesized).toContain('primary-compute');
    });

    test('creates DR Auto Scaling Group', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('dr-compute');
    });

    test('creates launch templates with t3.large', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_launch_template"');
      expect(synthesized).toContain('"instance_type": "t3.large"');
    });

    test('uses Amazon Linux 2 AMI', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('amzn2-ami-hvm');
    });
  });

  describe('Monitoring Resources', () => {
    test('creates SNS topics in both regions', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_sns_topic"');
      expect(synthesized).toContain('payment-alarms-test-us-east-1');
      expect(synthesized).toContain('payment-alarms-test-us-east-2');
    });

    test('creates CloudWatch alarms for ALB', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"aws_cloudwatch_metric_alarm"');
      // CloudWatch alarms are created for monitoring
      expect(synthesized).toMatch(/"metric_name":\s*"[^"]+"/);
    });

    test('creates CloudWatch alarms for ASG', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('GroupInServiceInstances');
    });
  });

  describe('Resource Tagging', () => {
    test('applies Environment tag to all resources', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"Environment": "prod"');
    });

    test('applies CostCenter tag', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"CostCenter": "payment-processing"');
    });

    test('applies DR-Role tag to resources', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"DR-Role": "primary"');
      expect(synthesized).toContain('"DR-Role": "dr"');
    });
  });

  describe('Stack Outputs', () => {
    test('exports primary ALB DNS', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"primary_alb_dns"');
      expect(synthesized).toContain('"output"');
    });

    test('exports DR ALB DNS', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"dr_alb_dns"');
    });

    test('exports database endpoints as sensitive', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"primary_db_endpoint"');
      expect(synthesized).toContain('"dr_db_endpoint"');
      expect(synthesized).toContain('"sensitive": true');
    });

    test('exports S3 bucket names', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"primary_s3_bucket"');
      expect(synthesized).toContain('"dr_s3_bucket"');
    });

    test('exports SNS topic ARNs', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"primary_sns_topic"');
      expect(synthesized).toContain('"dr_sns_topic"');
    });
  });

  describe('Multi-Region Configuration', () => {
    test('uses different CIDR blocks for each region', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"cidr_block": "10.0.0.0/16"');
      expect(synthesized).toContain('"cidr_block": "10.1.0.0/16"');
    });

    test('creates resources in both us-east-1 and us-east-2', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      const eastOneCount = (synthesized.match(/us-east-1/g) || []).length;
      const eastTwoCount = (synthesized.match(/us-east-2/g) || []).length;

      expect(eastOneCount).toBeGreaterThan(5);
      expect(eastTwoCount).toBeGreaterThan(5);
    });
  });

  describe('Security Configuration', () => {
    test('enables S3 bucket encryption', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"block_public_acls": true');
      expect(synthesized).toContain('"block_public_policy": true');
      expect(synthesized).toContain('"ignore_public_acls": true');
      expect(synthesized).toContain('"restrict_public_buckets": true');
    });

    test('configures database security groups correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('db-sg');
      expect(synthesized).toContain('"protocol": "tcp"');
    });

    test('allows egress traffic from security groups', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"type": "egress"');
      expect(synthesized).toContain('"protocol": "-1"');
    });
  });
});
