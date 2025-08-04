import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests - PROMPT.md Compliance', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'test-stack', {
      environmentSuffix: 'production',
      domainName: 'app.example.com',
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  describe('CDKTF Synthesis Validation', () => {
    test('should synthesize without errors', () => {
      expect(() => {
        Testing.synth(stack);
      }).not.toThrow();
    });

    test('should generate valid Terraform configuration', () => {
      const synthesizedStr = Testing.synth(stack);
      expect(synthesizedStr).toBeDefined();
      expect(typeof synthesizedStr).toBe('string');
      expect(synthesizedStr.length).toBeGreaterThan(0);
    });
  });

  describe('PROMPT.md Requirement Validation', () => {
    test('should target us-west-2 region as required', () => {
      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
    });

    test('should create VPC with correct CIDR 10.0.0.0/16', () => {
      expect(synthesized.resource.aws_vpc['main-vpc']).toBeDefined();
      expect(synthesized.resource.aws_vpc['main-vpc'].cidr_block).toBe(
        '10.0.0.0/16'
      );
    });

    test('should create subnets across 2+ availability zones', () => {
      expect(
        synthesized.resource.aws_subnet['public-subnet-1'].availability_zone
      ).toBe('us-west-2a');
      expect(
        synthesized.resource.aws_subnet['public-subnet-2'].availability_zone
      ).toBe('us-west-2b');
      expect(
        synthesized.resource.aws_subnet['private-subnet-1'].availability_zone
      ).toBe('us-west-2a');
      expect(
        synthesized.resource.aws_subnet['private-subnet-2'].availability_zone
      ).toBe('us-west-2b');
    });

    test('should create Application Load Balancer in public subnets', () => {
      expect(synthesized.resource.aws_alb['main-alb']).toBeDefined();
      expect(synthesized.resource.aws_alb['main-alb'].internal).toBe(false);
      expect(synthesized.resource.aws_alb['main-alb'].load_balancer_type).toBe(
        'application'
      );
    });

    test('should create PostgreSQL RDS (not MySQL) in private subnets', () => {
      expect(
        synthesized.resource.aws_db_instance['postgresql-database']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_db_instance['postgresql-database'].engine
      ).toBe('postgres');
      expect(
        synthesized.resource.aws_db_instance['postgresql-database']
          .publicly_accessible
      ).toBe(false);
    });

    test('should create Auto Scaling Group with CPU-based scaling', () => {
      expect(
        synthesized.resource.aws_autoscaling_group['web-asg']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_autoscaling_policy['scale-up-policy']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_autoscaling_policy['scale-down-policy']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_cloudwatch_metric_alarm['cpu-high-alarm']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_cloudwatch_metric_alarm['cpu-low-alarm']
      ).toBeDefined();
    });

    test('should implement proper security group isolation', () => {
      // ALB SG: HTTP/HTTPS from internet
      const albSg =
        synthesized.resource.aws_security_group['alb-security-group'];
      expect(albSg.ingress).toEqual(
        expect.arrayContaining([
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
        ])
      );

      // RDS SG: PostgreSQL only from EC2
      const rdsSg =
        synthesized.resource.aws_security_group['rds-security-group'];
      expect(rdsSg.ingress[0].from_port).toBe(5432);
      expect(rdsSg.ingress[0].to_port).toBe(5432);
      expect(rdsSg.ingress[0].protocol).toBe('tcp');
    });

    test('should create S3 bucket with lifecycle policies', () => {
      expect(synthesized.resource.aws_s3_bucket['logs-bucket']).toBeDefined();
      expect(
        synthesized.resource.aws_s3_bucket_lifecycle_configuration[
          'logs-bucket-lifecycle'
        ]
      ).toBeDefined();

      const lifecycle =
        synthesized.resource.aws_s3_bucket_lifecycle_configuration[
          'logs-bucket-lifecycle'
        ];
      expect(lifecycle.rule[0].transition[0].days).toBe(30);
      expect(lifecycle.rule[0].transition[0].storage_class).toBe('GLACIER');
      expect(lifecycle.rule[0].expiration[0].days).toBe(365);
    });

    test('should create CloudFront distribution with WAF integration', () => {
      expect(
        synthesized.resource.aws_cloudfront_distribution['webapp-cloudfront']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_wafv2_web_acl['webapp-waf']
      ).toBeDefined();

      const waf = synthesized.resource.aws_wafv2_web_acl['webapp-waf'];
      expect(waf.scope).toBe('CLOUDFRONT');
      expect(waf.rule).toBeDefined();
      expect(waf.rule.length).toBeGreaterThan(0);
    });

    test('should create Route53 DNS configuration', () => {
      expect(
        synthesized.resource.aws_route53_zone['webapp-zone']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_route53_record['webapp-dns-record']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_route53_health_check['webapp-health-check']
      ).toBeDefined();
    });

    test('should create SSM Parameter Store for environment variables', () => {
      expect(
        synthesized.resource.aws_ssm_parameter['db-host-parameter']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_ssm_parameter['app-env-parameter']
      ).toBeDefined();

      expect(
        synthesized.resource.aws_ssm_parameter['db-host-parameter'].name
      ).toBe('/webapp/database/host');
      expect(
        synthesized.resource.aws_ssm_parameter['app-env-parameter'].name
      ).toBe('/webapp/environment');
    });

    test('should implement cost monitoring with budgets and alarms', () => {
      expect(
        synthesized.resource.aws_budgets_budget['webapp-budget']
      ).toBeDefined();
      expect(
        synthesized.resource.aws_cloudwatch_metric_alarm['cost-alarm']
      ).toBeDefined();

      const budget = synthesized.resource.aws_budgets_budget['webapp-budget'];
      expect(budget.budget_type).toBe('COST');
      expect(budget.limit_amount).toBe('500');
      expect(budget.limit_unit).toBe('USD');
    });

    test('should apply proper resource tagging', () => {
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

    test('should create IAM roles with least privilege access', () => {
      expect(synthesized.resource.aws_iam_role['ec2-role']).toBeDefined();
      expect(synthesized.resource.aws_iam_policy['ec2-policy']).toBeDefined();

      const ec2Policy = synthesized.resource.aws_iam_policy['ec2-policy'];
      const policyDoc = JSON.parse(ec2Policy.policy);

      // Verify least privilege - specific S3 bucket access only
      const s3Statement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement.Resource).toBe('arn:aws:s3:::webapp-logs-*/*');
    });
  });

  describe('Infrastructure Outputs Validation', () => {
    test('should provide all required Terraform outputs', () => {
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
      expect(synthesized.output['cloudfront-domain'].description).toBe(
        'CloudFront Distribution Domain Name'
      );
      expect(synthesized.output['database-endpoint'].description).toBe(
        'PostgreSQL Database Endpoint'
      );
    });
  });

  describe('Security Compliance Validation', () => {
    test('should encrypt all storage with KMS', () => {
      expect(synthesized.resource.aws_kms_key['main-kms-key']).toBeDefined();
      expect(
        synthesized.resource.aws_db_instance['postgresql-database']
          .storage_encrypted
      ).toBe(true);
      expect(
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration[
          'logs-bucket-encryption'
        ]
      ).toBeDefined();
    });

    test('should enable VPC flow logs for network monitoring', () => {
      expect(synthesized.resource.aws_flow_log['vpc-flow-log']).toBeDefined();
      expect(
        synthesized.resource.aws_cloudwatch_log_group['vpc-flow-log-group']
      ).toBeDefined();
    });

    test('should implement multi-AZ deployment for high availability', () => {
      expect(
        synthesized.resource.aws_db_instance['postgresql-database'].multi_az
      ).toBe(true);
    });
  });
});
