import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests - PROMPT.md Compliance Validation', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation and Configuration', () => {
    test('should instantiate successfully with custom props', () => {
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'production',
        domainName: 'app.example.com',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.provider?.aws?.[0]?.region).toBe('us-west-2');
    });

    test('should use default values when no props provided', () => {
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('VPC and Networking Compliance', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create VPC with correct CIDR block 10.0.0.0/16', () => {
      expect(synthesized.resource.aws_vpc['main-vpc']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.0.0/16',
          enable_dns_hostnames: true,
          enable_dns_support: true,
        })
      );
    });

    test('should create public subnets in different AZs', () => {
      expect(synthesized.resource.aws_subnet['public-subnet-1']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.1.0/24',
          availability_zone: 'us-west-2a',
          map_public_ip_on_launch: true,
        })
      );

      expect(synthesized.resource.aws_subnet['public-subnet-2']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.2.0/24',
          availability_zone: 'us-west-2b',
          map_public_ip_on_launch: true,
        })
      );
    });

    test('should create private subnets for EC2 instances', () => {
      expect(synthesized.resource.aws_subnet['private-subnet-1']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.10.0/24',
          availability_zone: 'us-west-2a',
        })
      );

      expect(synthesized.resource.aws_subnet['private-subnet-2']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.20.0/24',
          availability_zone: 'us-west-2b',
        })
      );
    });

    test('should create database subnets', () => {
      expect(synthesized.resource.aws_subnet['db-subnet-1']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.100.0/24',
          availability_zone: 'us-west-2a',
        })
      );

      expect(synthesized.resource.aws_subnet['db-subnet-2']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.101.0/24',
          availability_zone: 'us-west-2b',
        })
      );
    });

    test('should create internet gateway and route table', () => {
      expect(
        synthesized.resource.aws_internet_gateway['main-igw']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_route_table['public-route-table']
      ).toBeDefined();
      expect(synthesized.resource.aws_route['public-route']).toEqual(
        expect.objectContaining({
          destination_cidr_block: '0.0.0.0/0',
        })
      );
    });
  });

  describe('Application Load Balancer Implementation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create ALB in public subnets', () => {
      expect(synthesized.resource.aws_alb['main-alb']).toEqual(
        expect.objectContaining({
          internal: false,
          load_balancer_type: 'application',
          enable_deletion_protection: false,
        })
      );
    });

    test('should create ALB target group with health checks', () => {
      expect(
        synthesized.resource.aws_alb_target_group['alb-target-group']
      ).toEqual(
        expect.objectContaining({
          port: 80,
          protocol: 'HTTP',
          target_type: 'instance',
          health_check: expect.objectContaining({
            enabled: true,
            healthy_threshold: 2,
            unhealthy_threshold: 2,
            timeout: 5,
            interval: 30,
            path: '/',
            matcher: '200',
          }),
        })
      );
    });

    test('should create ALB listener', () => {
      expect(synthesized.resource.aws_alb_listener['alb-listener']).toEqual(
        expect.objectContaining({
          port: 80,
          protocol: 'HTTP',
          default_action: expect.arrayContaining([
            expect.objectContaining({
              type: 'forward',
            }),
          ]),
        })
      );
    });
  });

  describe('Security Groups Configuration (PROMPT.md Requirements)', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('ALB SG should allow HTTP/HTTPS from internet', () => {
      const albSg =
        synthesized.resource.aws_security_group['alb-security-group'];
      expect(albSg).toEqual(
        expect.objectContaining({
          description: 'Security group for Application Load Balancer',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              from_port: 80,
              to_port: 80,
              protocol: 'tcp',
              cidr_blocks: ['0.0.0.0/0'],
              description: 'HTTP access from internet',
            }),
            expect.objectContaining({
              from_port: 443,
              to_port: 443,
              protocol: 'tcp',
              cidr_blocks: ['0.0.0.0/0'],
              description: 'HTTPS access from internet',
            }),
          ]),
        })
      );
    });

    test('EC2 SG should allow HTTP/SSH only from ALB', () => {
      const ec2Sg =
        synthesized.resource.aws_security_group['ec2-security-group'];
      expect(ec2Sg).toEqual(
        expect.objectContaining({
          description: 'Security group for EC2 instances',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              from_port: 80,
              to_port: 80,
              protocol: 'tcp',
              description: 'HTTP access from ALB only',
            }),
            expect.objectContaining({
              from_port: 22,
              to_port: 22,
              protocol: 'tcp',
              description: 'SSH access from ALB only',
            }),
          ]),
        })
      );
    });

    test('RDS SG should allow PostgreSQL access only from EC2', () => {
      const rdsSg =
        synthesized.resource.aws_security_group['rds-security-group'];
      expect(rdsSg).toEqual(
        expect.objectContaining({
          description: 'Security group for RDS PostgreSQL database',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              from_port: 5432,
              to_port: 5432,
              protocol: 'tcp',
              description: 'PostgreSQL access from EC2 only',
            }),
          ]),
        })
      );
    });
  });

  describe('Auto Scaling Group with CPU-based Scaling', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create launch template with proper configuration', () => {
      expect(
        synthesized.resource.aws_launch_template['web-launch-template']
      ).toEqual(
        expect.objectContaining({
          image_id: 'ami-0c2d3e23b7e3c7bd4',
          instance_type: 't3.medium',
        })
      );
    });

    test('should create auto scaling group with proper capacity', () => {
      expect(synthesized.resource.aws_autoscaling_group['web-asg']).toEqual(
        expect.objectContaining({
          min_size: 2,
          max_size: 10,
          desired_capacity: 3,
          health_check_type: 'ELB',
          health_check_grace_period: 300,
        })
      );
    });

    test('should create CPU-based scaling policies', () => {
      expect(
        synthesized.resource.aws_autoscaling_policy['scale-up-policy']
      ).toEqual(
        expect.objectContaining({
          scaling_adjustment: 1,
          adjustment_type: 'ChangeInCapacity',
          cooldown: 300,
        })
      );

      expect(
        synthesized.resource.aws_autoscaling_policy['scale-down-policy']
      ).toEqual(
        expect.objectContaining({
          scaling_adjustment: -1,
          adjustment_type: 'ChangeInCapacity',
          cooldown: 300,
        })
      );
    });

    test('should create CloudWatch alarms for CPU monitoring', () => {
      expect(
        synthesized.resource.aws_cloudwatch_metric_alarm['cpu-high-alarm']
      ).toEqual(
        expect.objectContaining({
          comparison_operator: 'GreaterThanThreshold',
          metric_name: 'CPUUtilization',
          namespace: 'AWS/EC2',
          threshold: 70,
        })
      );

      expect(
        synthesized.resource.aws_cloudwatch_metric_alarm['cpu-low-alarm']
      ).toEqual(
        expect.objectContaining({
          comparison_operator: 'LessThanThreshold',
          metric_name: 'CPUUtilization',
          namespace: 'AWS/EC2',
          threshold: 30,
        })
      );
    });
  });

  describe('PostgreSQL RDS Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create PostgreSQL RDS instance with correct engine', () => {
      expect(
        synthesized.resource.aws_db_instance['postgresql-database']
      ).toEqual(
        expect.objectContaining({
          engine: 'postgres',
          engine_version: '15.4',
          instance_class: 'db.t3.micro',
          multi_az: true,
          storage_encrypted: true,
          publicly_accessible: false,
          backup_retention_period: 7,
          db_name: 'webapp',
          username: 'webapp_admin',
        })
      );
    });

    test('should create DB subnet group in private subnets', () => {
      expect(
        synthesized.resource.aws_db_subnet_group['db-subnet-group']
      ).toBeDefined();
    });
  });

  describe('S3 Logging with Lifecycle Policies', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create S3 bucket for application logs', () => {
      expect(synthesized.resource.aws_s3_bucket['logs-bucket']).toBeDefined();
    });

    test('should enable S3 bucket versioning', () => {
      expect(
        synthesized.resource.aws_s3_bucket_versioning['logs-bucket-versioning']
      ).toEqual(
        expect.objectContaining({
          versioning_configuration: {
            status: 'Enabled',
          },
        })
      );
    });

    test('should configure KMS encryption for S3 bucket', () => {
      const encryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'logs-bucket-encryption'
        ];
      expect(encryption.rule[0]).toEqual(
        expect.objectContaining({
          apply_server_side_encryption_by_default: expect.objectContaining({
            sse_algorithm: 'aws:kms',
          }),
        })
      );
    });

    test('should configure lifecycle policies: Glacier @ 30 days, delete @ 1 year', () => {
      const lifecycle =
        synthesized.resource.aws_s3_bucket_lifecycle_configuration[
          'logs-bucket-lifecycle'
        ];
      expect(lifecycle.rule[0]).toEqual(
        expect.objectContaining({
          id: 'log-lifecycle-rule',
          status: 'Enabled',
          transition: expect.arrayContaining([
            expect.objectContaining({
              days: 30,
              storage_class: 'GLACIER',
            }),
          ]),
          expiration: expect.arrayContaining([
            expect.objectContaining({
              days: 365,
            }),
          ]),
        })
      );
    });
  });

  describe('IAM Roles with Least Privilege', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create EC2 IAM role with least privilege', () => {
      const ec2Role = synthesized.resource.aws_iam_role['ec2-role'];
      expect(ec2Role).toEqual(
        expect.objectContaining({
          assume_role_policy: expect.stringContaining('ec2.amazonaws.com'),
        })
      );
    });

    test('should create IAM policies with minimal permissions', () => {
      const ec2Policy = synthesized.resource.aws_iam_policy['ec2-policy'];
      const policyDoc = JSON.parse(ec2Policy.policy);

      // Verify S3 access is limited to specific bucket pattern
      const s3Statement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement.Resource).toBe('arn:aws:s3:::webapp-logs-*/*');

      // Verify CloudWatch access is limited
      const cwStatement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwStatement.Resource).toContain(
        'arn:aws:cloudwatch:us-west-2:*:*'
      );

      // Verify SSM access is limited to webapp parameters
      const ssmStatement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('ssm:GetParameter')
      );
      expect(ssmStatement.Resource).toBe(
        'arn:aws:ssm:us-west-2:*:parameter/webapp/*'
      );
    });
  });

  describe('CloudFront and WAF Integration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create CloudFront distribution with ALB origin', () => {
      const distribution =
        synthesized.resource.aws_cloudfront_distribution['webapp-cloudfront'];
      expect(distribution).toEqual(
        expect.objectContaining({
          enabled: true,
          origin: expect.arrayContaining([
            expect.objectContaining({
              origin_id: 'ALB-webapp',
              custom_origin_config: expect.objectContaining({
                http_port: 80,
                https_port: 443,
                origin_protocol_policy: 'http-only',
              }),
            }),
          ]),
        })
      );
    });

    test('should create WAF WebACL with OWASP Top 10 rules', () => {
      const webAcl = synthesized.resource.aws_wafv2_web_acl['webapp-waf'];
      expect(webAcl).toEqual(
        expect.objectContaining({
          scope: 'CLOUDFRONT',
          default_action: { allow: {} },
          rule: expect.arrayContaining([
            expect.objectContaining({
              name: 'AWSManagedRulesCommonRuleSet',
              priority: 1,
            }),
            expect.objectContaining({
              name: 'AWSManagedRulesOWASPTop10',
              priority: 2,
            }),
          ]),
        })
      );
    });
  });

  describe('Route53 DNS Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
        domainName: 'app.example.com',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create Route53 hosted zone', () => {
      expect(synthesized.resource.aws_route53_zone['webapp-zone']).toEqual(
        expect.objectContaining({
          name: 'app.example.com',
        })
      );
    });

    test('should create Route53 A record pointing to CloudFront', () => {
      expect(
        synthesized.resource.aws_route53_record['webapp-dns-record']
      ).toEqual(
        expect.objectContaining({
          name: 'app.example.com',
          type: 'A',
          alias: expect.objectContaining({
            evaluate_target_health: false,
          }),
        })
      );
    });

    test('should create Route53 health check', () => {
      expect(
        synthesized.resource.aws_route53_health_check['webapp-health-check']
      ).toEqual(
        expect.objectContaining({
          type: 'HTTPS',
          port: 443,
          resource_path: '/',
          failure_threshold: 3,
          request_interval: 30,
        })
      );
    });
  });

  describe('SSM Parameter Store', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create SSM parameters for application configuration', () => {
      expect(
        synthesized.resource.aws_ssm_parameter['db-host-parameter']
      ).toEqual(
        expect.objectContaining({
          name: '/webapp/database/host',
          type: 'String',
          description: 'Database host endpoint',
        })
      );

      expect(
        synthesized.resource.aws_ssm_parameter['app-env-parameter']
      ).toEqual(
        expect.objectContaining({
          name: '/webapp/environment',
          type: 'String',
          value: 'production',
          description: 'Application environment',
        })
      );
    });
  });

  describe('Cost Monitoring and Budgets', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create AWS Budget for cost monitoring', () => {
      expect(synthesized.resource.aws_budgets_budget['webapp-budget']).toEqual(
        expect.objectContaining({
          budget_type: 'COST',
          limit_amount: '500',
          limit_unit: 'USD',
          time_unit: 'MONTHLY',
        })
      );
    });

    test('should create CloudWatch cost alarm', () => {
      expect(
        synthesized.resource.aws_cloudwatch_metric_alarm['cost-alarm']
      ).toEqual(
        expect.objectContaining({
          comparison_operator: 'GreaterThanThreshold',
          metric_name: 'EstimatedCharges',
          namespace: 'AWS/Billing',
          threshold: 400,
        })
      );
    });
  });

  describe('Resource Tagging Compliance', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should tag all resources with required organizational tags', () => {
      const vpc = synthesized.resource.aws_vpc['main-vpc'];
      expect(vpc.tags).toEqual(
        expect.objectContaining({
          Environment: 'Production',
          Owner: 'DevOps',
          Project: 'ScalableWebApp',
          ManagedBy: 'CDKTF',
          CostCenter: 'Engineering',
        })
      );
    });

    test('should apply default tags to AWS provider', () => {
      expect(synthesized.provider.aws[0].default_tags[0].tags).toEqual(
        expect.objectContaining({
          Environment: 'Production',
          Owner: 'DevOps',
          Project: 'ScalableWebApp',
          ManagedBy: 'CDKTF',
          CostCenter: 'Engineering',
        })
      );
    });
  });

  describe('Terraform Outputs', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should define all required outputs', () => {
      expect(synthesized.output['vpc-id']).toBeDefined();
      expect(synthesized.output['alb-dns-name']).toBeDefined();
      expect(synthesized.output['cloudfront-domain']).toBeDefined();
      expect(synthesized.output['route53-domain']).toBeDefined();
      expect(synthesized.output['logs-bucket-name']).toBeDefined();
      expect(synthesized.output['database-endpoint']).toBeDefined();
      expect(synthesized.output['waf-web-acl-arn']).toBeDefined();
      expect(synthesized.output['kms-key-id']).toBeDefined();
    });

    test('should have proper output descriptions', () => {
      expect(synthesized.output['vpc-id'].description).toBe('VPC ID');
      expect(synthesized.output['alb-dns-name'].description).toBe(
        'Application Load Balancer DNS Name'
      );
      expect(synthesized.output['cloudfront-domain'].description).toBe(
        'CloudFront Distribution Domain Name'
      );
      expect(synthesized.output['database-endpoint'].description).toBe(
        'PostgreSQL Database Endpoint'
      );
      expect(synthesized.output['waf-web-acl-arn'].description).toBe(
        'WAF WebACL ARN'
      );
    });
  });

  describe('Security and Encryption Compliance', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create KMS key for encryption', () => {
      expect(synthesized.resource.aws_kms_key['main-kms-key']).toEqual(
        expect.objectContaining({
          description: 'KMS key for encrypting resources',
        })
      );
    });

    test('should enable VPC Flow Logs for monitoring', () => {
      expect(synthesized.resource.aws_flow_log['vpc-flow-log']).toEqual(
        expect.objectContaining({
          log_destination_type: 'cloud-watch-logs',
          traffic_type: 'ALL',
        })
      );
    });
  });
});
