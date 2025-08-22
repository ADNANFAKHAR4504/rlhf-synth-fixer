import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  // Helper function to create consistent stack naming
  const createTestStack = (baseName: string, props?: any) => {
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    return new TapStack(app, `${baseName}${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
      ...props,
    });
  };

  describe('Full Stack Integration', () => {
    test('synthesizes valid Terraform configuration', () => {
      // Use same environment suffix as deployment pipeline
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      stack = new TapStack(app, `TapStack${environmentSuffix}`, {
        environmentSuffix: environmentSuffix,
        awsRegion: 'us-east-1',
        stateBucket: 'test-tf-state',
      });
      
      expect(() => {
        synthesized = Testing.synth(stack);
      }).not.toThrow();
      
      expect(synthesized).toBeDefined();
      expect(synthesized.length).toBeGreaterThan(1000);
    });

    test('generates valid JSON configuration', () => {
      stack = createTestStack('JSONTestStack');
      synthesized = Testing.synth(stack);

      expect(() => {
        JSON.parse(synthesized);
      }).not.toThrow();
    });

    test('includes all required resource types', () => {
      stack = createTestStack('ResourceTestStack');
      synthesized = Testing.synth(stack);

      const requiredResources = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_route_table',
        'aws_security_group',
        'aws_iam_role',
        'aws_iam_instance_profile',
        'aws_s3_bucket',
        'aws_db_instance',
        'aws_db_subnet_group',
        'aws_launch_template',
        'aws_autoscaling_group',
        'aws_lb',
        'aws_lb_target_group',
        'aws_cloudfront_distribution',
        'aws_cloudwatch_metric_alarm',
        'aws_sns_topic',
        'aws_wafv2_web_acl',
        'aws_ssm_parameter'
      ];

      requiredResources.forEach(resourceType => {
        expect(synthesized).toContain(`"${resourceType}"`);
      });
    });

    test('maintains proper resource relationships', () => {
      stack = createTestStack('RelationshipTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"vpc_id": "${aws_vpc');
      expect(synthesized).toContain('"subnet_id": "${aws_subnet');
      expect(synthesized).toContain('"security_group_id": "${aws_security_group');
      expect(synthesized).toContain('"load_balancer_arn": "${aws_lb');
    });

    test('applies consistent naming and tagging', () => {
      stack = createTestStack('TaggingTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('scalable-web-app');
      expect(synthesized).toContain('Project');
      expect(synthesized).toContain('Environment');
      expect(synthesized).toContain('ManagedBy');
      expect(synthesized).toContain('Terraform-CDKTF');
    });
  });

  describe('Network Security Integration', () => {
    test('configures security groups with proper ingress/egress rules', () => {
      stack = createTestStack('SecurityTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"from_port": 80');
      expect(synthesized).toContain('"from_port": 443');
      expect(synthesized).toContain('"from_port": 5432');
      expect(synthesized).toContain('"from_port": 22');
      expect(synthesized).toContain('"protocol": "tcp"');
      expect(synthesized).toContain('"type": "ingress"');
      expect(synthesized).toContain('"type": "egress"');
    });

    test('configures WAF with security rules', () => {
      stack = createTestStack('WAFTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('AWSManagedRulesCommonRuleSet');
      expect(synthesized).toContain('AWSManagedRulesKnownBadInputsRuleSet');
      expect(synthesized).toContain('AWSManagedRulesSQLiRuleSet');
      expect(synthesized).toContain('"scope": "REGIONAL"');
    });

    test('configures VPC Flow Logs', () => {
      stack = createTestStack('FlowLogsTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_flow_log');
      expect(synthesized).toContain('aws_cloudwatch_log_group');
      expect(synthesized).toContain('/aws/vpc/flowlogs/scalable-web-app');
    });
  });

  describe('High Availability Configuration', () => {
    test('distributes resources across multiple AZs', () => {
      stack = createTestStack('HATestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('us-east-1a');
      expect(synthesized).toContain('us-east-1b');
      expect(synthesized).toContain('us-east-1c');
    });

    test('configures NAT Gateways for high availability', () => {
      stack = createTestStack('NATTestStack');
      synthesized = Testing.synth(stack);

      const natGatewayMatches = synthesized.match(/aws_nat_gateway/g);
      const eipMatches = synthesized.match(/aws_eip/g);
      
      expect(natGatewayMatches?.length).toBeGreaterThanOrEqual(1);
      expect(eipMatches?.length).toBeGreaterThanOrEqual(1);
    });

    test('configures Auto Scaling for compute resources', () => {
      // Use same environment suffix as deployment pipeline
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      stack = new TapStack(app, `ASGTestStack${environmentSuffix}`, {
        environmentSuffix: environmentSuffix,
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"min_size": 1');
      expect(synthesized).toContain('"max_size": 6');
      expect(synthesized).toContain('"desired_capacity": 1');
      expect(synthesized).toContain('aws_autoscaling_policy');
      expect(synthesized).toContain('aws_cloudwatch_metric_alarm');
    });
  });

  describe('Storage and Database Integration', () => {
    test('configures S3 buckets with encryption and lifecycle', () => {
      stack = createTestStack('S3TestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(synthesized).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(synthesized).toContain('aws_s3_bucket_public_access_block');
      expect(synthesized).toContain('"sse_algorithm": "AES256"');
      expect(synthesized).toContain('"block_public_acls": true');
    });

    test('configures RDS with proper security and backup settings', () => {
      stack = createTestStack('RDSTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"engine": "postgres"');
      expect(synthesized).toContain('"storage_encrypted": true');
      expect(synthesized).toContain('"backup_retention_period": 7');
      expect(synthesized).toContain('"publicly_accessible": false');
      expect(synthesized).toContain('"multi_az": false');
      expect(synthesized).toContain('aws_db_parameter_group');
    });

    test('configures database subnet group in private subnets', () => {
      stack = new TapStack(app, 'DBSubnetTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_db_subnet_group');
      expect(synthesized).toContain('"subnet_ids": [');
      expect(synthesized).toContain('db-subnet');
    });
  });

  describe('Load Balancing and CDN Integration', () => {
    test('configures Application Load Balancer correctly', () => {
      stack = createTestStack('ALBTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"load_balancer_type": "application"');
      expect(synthesized).toContain('"internal": false');
      expect(synthesized).toContain('aws_lb_target_group');
      expect(synthesized).toContain('aws_lb_listener');
      expect(synthesized).toContain('"port": 80');
      expect(synthesized).toContain('"protocol": "HTTP"');
    });

    test('configures CloudFront distribution with proper caching', () => {
      stack = createTestStack('CloudFrontTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_cloudfront_distribution');
      expect(synthesized).toContain('"viewer_protocol_policy": "redirect-to-https"');
      expect(synthesized).toContain('"compress": true');
      expect(synthesized).toContain('"price_class": "PriceClass_100"');
      expect(synthesized).toContain('/api/*');
      expect(synthesized).toContain('/static/*');
    });

    test('integrates ALB with CloudFront as origin', () => {
      stack = new TapStack(app, 'ALBCloudFrontTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"domain_name": "${aws_lb');
      expect(synthesized).toContain('custom_origin_config');
      expect(synthesized).toContain('"http_port": 80');
    });
  });

  describe('Monitoring and Alerting Integration', () => {
    test('configures comprehensive monitoring alarms', () => {
      stack = createTestStack('MonitoringTestStack');
      synthesized = Testing.synth(stack);

      const expectedAlarms = [
        'cpu-utilization-high',
        'cpu-utilization-low',
        'rds-high-cpu',
        'rds-high-connections',
        'alb-high-response-time',
        'alb-5xx-errors',
        'cloudfront-4xx-errors',
        'cloudfront-5xx-errors'
      ];

      expectedAlarms.forEach(alarm => {
        expect(synthesized).toContain(alarm);
      });
    });

    test('configures SNS topic for alerts', () => {
      stack = new TapStack(app, 'SNSTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_sns_topic');
      expect(synthesized).toContain('aws_sns_topic_subscription');
      expect(synthesized).toContain('"protocol": "email"');
      expect(synthesized).toContain('scalable-web-app-dev-alerts');
    });

    test('configures CloudWatch Dashboard', () => {
      stack = new TapStack(app, 'DashboardTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_cloudwatch_dashboard');
      expect(synthesized).toContain('System Performance Overview');
      expect(synthesized).toContain('Request Metrics');
      expect(synthesized).toContain('Database Metrics');
    });

    test('configures budget alerts', () => {
      stack = new TapStack(app, 'BudgetTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_budgets_budget');
      expect(synthesized).toContain('"budget_type": "COST"');
      expect(synthesized).toContain('"limit_amount": "100"');
      expect(synthesized).toContain('"threshold": 80');
    });
  });

  describe('IAM and SSM Integration', () => {
    test('configures IAM roles with least privilege', () => {
      stack = new TapStack(app, 'IAMTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"s3:GetObject"');
      expect(synthesized).toContain('"s3:PutObject"');
      expect(synthesized).toContain('"ssm:GetParameter"');
      expect(synthesized).toContain('"cloudwatch:PutMetricData"');
      expect(synthesized).toContain('"logs:CreateLogGroup"');
    });

    test('configures SSM parameters for configuration management', () => {
      stack = new TapStack(app, 'SSMTestStack');
      synthesized = Testing.synth(stack);

      const expectedParameters = [
        '/scalable-web-app/database/host',
        '/scalable-web-app/database/name',
        '/scalable-web-app/database/username',
        '/scalable-web-app/database/password'
      ];

      expectedParameters.forEach(param => {
        expect(synthesized).toContain(param);
      });

      expect(synthesized).toContain('"type": "SecureString"');
    });
  });

  describe('Error Handling and Validation', () => {
    test('handles missing optional configuration gracefully', () => {
      expect(() => {
        new TapStack(app, 'MinimalConfigStack', {
          environmentSuffix: 'test',
        });
      }).not.toThrow();
    });

    test('applies default values correctly', () => {
      stack = new TapStack(app, 'DefaultValueTestStack');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "us-east-1"');
      expect(synthesized).toContain('iac-rlhf-tf-states');
    });

    test('handles large configuration without memory issues', () => {
      const startTime = Date.now();
      stack = new TapStack(app, 'LargeConfigTestStack', {
        environmentSuffix: 'production',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);
      const endTime = Date.now();

      expect(synthesized).toBeDefined();
      expect(endTime - startTime).toBeLessThan(30000);
      expect(synthesized.length).toBeGreaterThan(10000);
    });
  });
});
