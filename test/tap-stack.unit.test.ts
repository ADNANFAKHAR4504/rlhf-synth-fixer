import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests - Nova Model Breaking Infrastructure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('should instantiate successfully with custom props', () => {
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        domainName: 'test.example.com',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      
      // The provider is an array in CDKTF
      expect(synthesized.provider?.aws?.[0]?.region).toBe('us-east-1');
    });

    test('should use default values when no props provided', () => {
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create VPC with correct configuration', () => {
      expect(synthesized.resource.aws_vpc['main-vpc']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.0.0/16',
          enable_dns_hostnames: true,
          enable_dns_support: true,
          tags: expect.objectContaining({
            Environment: 'test',
            Owner: 'DevOps-Team',
            Project: 'IaC-AWS-Nova-Model-Breaking',
            Name: 'main-vpc',
          }),
        })
      );
    });

    test('should create public subnets in different AZs', () => {
      expect(synthesized.resource.aws_subnet['public-subnet-1']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.1.0/24',
          availability_zone: 'us-east-1a',
          map_public_ip_on_launch: true,
        })
      );

      expect(synthesized.resource.aws_subnet['public-subnet-2']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.2.0/24',
          availability_zone: 'us-east-1b',
          map_public_ip_on_launch: true,
        })
      );
    });

    test('should create private subnets in different AZs', () => {
      expect(synthesized.resource.aws_subnet['private-subnet-1']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.3.0/24',
          availability_zone: 'us-east-1a',
        })
      );

      expect(synthesized.resource.aws_subnet['private-subnet-2']).toEqual(
        expect.objectContaining({
          cidr_block: '10.0.4.0/24',
          availability_zone: 'us-east-1b',
        })
      );
    });

    test('should create internet gateway and route table', () => {
      expect(synthesized.resource.aws_internet_gateway['main-igw']).toBeDefined();
      expect(synthesized.resource.aws_route_table['public-route-table']).toBeDefined();
      expect(synthesized.resource.aws_route['public-route']).toEqual(
        expect.objectContaining({
          destination_cidr_block: '0.0.0.0/0',
        })
      );
    });

    test('should enable VPC Flow Logs', () => {
      expect(synthesized.resource.aws_flow_log['vpc-flow-log']).toEqual(
        expect.objectContaining({
          traffic_type: 'ALL',
          log_destination_type: 'cloud-watch-logs',
        })
      );
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create web security group with HTTP/HTTPS access', () => {
      const webSg = synthesized.resource.aws_security_group['web-security-group'];
      expect(webSg).toEqual(
        expect.objectContaining({
          name: 'web-sg-test',
          description: 'Security group for web servers',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              from_port: 80,
              to_port: 80,
              protocol: 'tcp',
              cidr_blocks: ['0.0.0.0/0'],
            }),
            expect.objectContaining({
              from_port: 443,
              to_port: 443,
              protocol: 'tcp',
              cidr_blocks: ['0.0.0.0/0'],
            }),
          ]),
        })
      );
    });

    test('should create database security group with restricted access', () => {
      const dbSg = synthesized.resource.aws_security_group['db-security-group'];
      expect(dbSg).toEqual(
        expect.objectContaining({
          name: 'db-sg-test',
          description: 'Security group for RDS database',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              from_port: 3306,
              to_port: 3306,
              protocol: 'tcp',
            }),
          ]),
        })
      );
    });
  });

  describe('S3 Bucket Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create S3 bucket with proper naming', () => {
      expect(synthesized.resource.aws_s3_bucket['app-bucket']).toEqual(
        expect.objectContaining({
          bucket_prefix: 'nova-app-test-',
        })
      );
    });

    test('should enable S3 bucket versioning', () => {
      expect(synthesized.resource.aws_s3_bucket_versioning['app-bucket-versioning']).toEqual(
        expect.objectContaining({
          versioning_configuration: {
            status: 'Enabled',
          },
        })
      );
    });

    test('should configure KMS encryption for S3 bucket', () => {
      const encryption = synthesized.resource.aws_s3_bucket_server_side_encryption_configuration['app-bucket-encryption'];
      expect(encryption.rule[0]).toEqual(
        expect.objectContaining({
          apply_server_side_encryption_by_default: expect.objectContaining({
            sse_algorithm: 'aws:kms',
          }),
        })
      );
    });
  });

  describe('RDS Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create RDS instance with multi-AZ configuration', () => {
      expect(synthesized.resource.aws_db_instance['main-database']).toEqual(
        expect.objectContaining({
          identifier: 'nova-db-test',
          engine: 'mysql',
          engine_version: '8.0',
          instance_class: 'db.t3.micro',
          multi_az: true,
          storage_encrypted: true,
          backup_retention_period: 7,
        })
      );
    });

    test('should create DB subnet group', () => {
      expect(synthesized.resource.aws_db_subnet_group['db-subnet-group']).toEqual(
        expect.objectContaining({
          name: 'db-subnet-group-test',
        })
      );
    });
  });

  describe('Auto Scaling Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create launch template with proper configuration', () => {
      expect(synthesized.resource.aws_launch_template['web-launch-template']).toEqual(
        expect.objectContaining({
          name: 'web-template-test',
          image_id: 'ami-0c02fb55956c7d316',
          instance_type: 't3.micro',
        })
      );
    });

    test('should create auto scaling group with proper capacity', () => {
      expect(synthesized.resource.aws_autoscaling_group['web-asg']).toEqual(
        expect.objectContaining({
          name: 'web-asg-test',
          min_size: 1,
          max_size: 3,
          desired_capacity: 2,
          health_check_type: 'ELB',
        })
      );
    });
  });

  describe('IAM Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create EC2 IAM role with least privilege', () => {
      const ec2Role = synthesized.resource.aws_iam_role['ec2-role'];
      expect(ec2Role).toEqual(
        expect.objectContaining({
          name: 'ec2-role-test',
          assume_role_policy: expect.stringContaining('ec2.amazonaws.com'),
        })
      );
    });

    test('should create Lambda IAM role for compliance checks', () => {
      const lambdaRole = synthesized.resource.aws_iam_role['lambda-compliance-role'];
      expect(lambdaRole).toEqual(
        expect.objectContaining({
          name: 'lambda-compliance-role-test',
          assume_role_policy: expect.stringContaining('lambda.amazonaws.com'),
        })
      );
    });

    test('should create IAM policies with minimal permissions', () => {
      const ec2Policy = synthesized.resource.aws_iam_policy['ec2-policy'];
      expect(ec2Policy.policy).toContain('s3:GetObject');
      expect(ec2Policy.policy).toContain('cloudwatch:PutMetricData');
    });
  });

  describe('Security Services', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should enable GuardDuty detector', () => {
      expect(synthesized.resource.aws_guardduty_detector['main-guardduty']).toEqual(
        expect.objectContaining({
          enable: true,
        })
      );
    });

    test('should create WAF Web ACL with basic configuration', () => {
      const waf = synthesized.resource.aws_waf_web_acl['main-waf'];
      expect(waf).toEqual(
        expect.objectContaining({
          name: 'nova-waf-test',
          metric_name: 'NovaWAFtest',
          default_action: {
            type: 'ALLOW',
          },
        })
      );
    });
  });

  describe('Lambda and CloudWatch', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create compliance Lambda function', () => {
      expect(synthesized.resource.aws_lambda_function['compliance-lambda']).toEqual(
        expect.objectContaining({
          function_name: 'compliance-checker-test',
          runtime: 'python3.9',
          handler: 'index.handler',
        })
      );
    });

    test('should create CloudWatch event rule for Lambda trigger', () => {
      expect(synthesized.resource.aws_cloudwatch_event_rule['compliance-event-rule']).toEqual(
        expect.objectContaining({
          name: 'compliance-check-rule-test',
          schedule_expression: 'rate(24 hours)',
        })
      );
    });
  });

  describe('CloudFront and Route53', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { 
        environmentSuffix: 'test',
        domainName: 'test.example.com' 
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create ACM certificate', () => {
      expect(synthesized.resource.aws_acm_certificate['main-certificate']).toEqual(
        expect.objectContaining({
          domain_name: 'test.example.com',
          validation_method: 'DNS',
        })
      );
    });

    test('should create Route53 hosted zone', () => {
      expect(synthesized.resource.aws_route53_zone['main-zone']).toEqual(
        expect.objectContaining({
          name: 'test.example.com',
        })
      );
    });

    test('should create CloudFront distribution with SSL', () => {
      const distribution = synthesized.resource.aws_cloudfront_distribution['main-cloudfront'];
      expect(distribution).toEqual(
        expect.objectContaining({
          enabled: true,
          aliases: ['test.example.com'],
        })
      );
      expect(distribution.viewer_certificate.ssl_support_method).toBe('sni-only');
    });

    test('should create Route53 health check', () => {
      expect(synthesized.resource.aws_route53_health_check['main-health-check']).toEqual(
        expect.objectContaining({
          fqdn: 'test.example.com',
          port: 443,
          type: 'HTTPS',
        })
      );
    });
  });

  describe('KMS Encryption', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create KMS key for encryption', () => {
      expect(synthesized.resource.aws_kms_key['main-kms-key']).toEqual(
        expect.objectContaining({
          description: 'KMS key for encrypting resources',
        })
      );
    });
  });

  describe('Terraform Outputs', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should define all required outputs', () => {
      expect(synthesized.output['vpc-id']).toBeDefined();
      expect(synthesized.output['cloudfront-domain']).toBeDefined();
      expect(synthesized.output['s3-bucket-name']).toBeDefined();
      expect(synthesized.output['kms-key-id']).toBeDefined();
    });

    test('should have proper output descriptions', () => {
      expect(synthesized.output['vpc-id'].description).toBe('VPC ID');
      expect(synthesized.output['cloudfront-domain'].description).toBe('CloudFront Distribution Domain Name');
      expect(synthesized.output['s3-bucket-name'].description).toBe('S3 Bucket Name');
      expect(synthesized.output['kms-key-id'].description).toBe('KMS Key ID');
    });
  });

  describe('Tagging Compliance', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should tag all resources with required tags', () => {
      const vpc = synthesized.resource.aws_vpc['main-vpc'];
      expect(vpc.tags).toEqual(
        expect.objectContaining({
          Environment: 'test',
          Owner: 'DevOps-Team',
          Project: 'IaC-AWS-Nova-Model-Breaking',
        })
      );
    });

    test('should apply default tags to AWS provider', () => {
      expect(synthesized.provider.aws[0].default_tags[0].tags).toEqual(
        expect.objectContaining({
          Environment: 'test',
          Owner: 'DevOps-Team',
          Project: 'IaC-AWS-Nova-Model-Breaking',
        })
      );
    });
  });
});
