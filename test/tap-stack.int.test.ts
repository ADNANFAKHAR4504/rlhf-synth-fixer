import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests - Nova Model Breaking Infrastructure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe('Complete Infrastructure Integration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: 'integration',
        stateBucket: 'integration-test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        domainName: 'integration.nova-test.com',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create all required AWS resources', () => {
      // Core Infrastructure
      expect(synthesized.resource.aws_vpc).toBeDefined();
      expect(synthesized.resource.aws_subnet).toBeDefined();
      expect(synthesized.resource.aws_internet_gateway).toBeDefined();
      expect(synthesized.resource.aws_route_table).toBeDefined();
      expect(synthesized.resource.aws_security_group).toBeDefined();

      // Storage and Database
      expect(synthesized.resource.aws_s3_bucket).toBeDefined();
      expect(synthesized.resource.aws_s3_bucket_versioning).toBeDefined();
      expect(synthesized.resource.aws_s3_bucket_server_side_encryption_configuration).toBeDefined();
      expect(synthesized.resource.aws_db_instance).toBeDefined();
      expect(synthesized.resource.aws_db_subnet_group).toBeDefined();

      // Compute
      expect(synthesized.resource.aws_launch_template).toBeDefined();
      expect(synthesized.resource.aws_autoscaling_group).toBeDefined();

      // Security
      expect(synthesized.resource.aws_iam_role).toBeDefined();
      expect(synthesized.resource.aws_iam_policy).toBeDefined();
      expect(synthesized.resource.aws_guardduty_detector).toBeDefined();
      expect(synthesized.resource.aws_waf_web_acl).toBeDefined();

      // Monitoring and Compliance
      expect(synthesized.resource.aws_lambda_function).toBeDefined();
      expect(synthesized.resource.aws_cloudwatch_event_rule).toBeDefined();
      expect(synthesized.resource.aws_flow_log).toBeDefined();

      // CDN and DNS
      expect(synthesized.resource.aws_cloudfront_distribution).toBeDefined();
      expect(synthesized.resource.aws_route53_zone).toBeDefined();
      expect(synthesized.resource.aws_acm_certificate).toBeDefined();

      // Encryption
      expect(synthesized.resource.aws_kms_key).toBeDefined();
    });

    test('should properly configure resource dependencies', () => {
      // VPC -> Subnets dependency
      const subnet1 = synthesized.resource.aws_subnet['public-subnet-1'];
      expect(subnet1.vpc_id).toContain('aws_vpc.main-vpc.id');

      // Security Group -> VPC dependency
      const webSg = synthesized.resource.aws_security_group['web-security-group'];
      expect(webSg.vpc_id).toContain('aws_vpc.main-vpc.id');

      // Auto Scaling Group -> Launch Template dependency
      const asg = synthesized.resource.aws_autoscaling_group['web-asg'];
      expect(asg.launch_template.id).toContain('aws_launch_template.web-launch-template.id');

      // RDS -> DB Subnet Group dependency
      const rds = synthesized.resource.aws_db_instance['main-database'];
      expect(rds.db_subnet_group_name).toContain('aws_db_subnet_group.db-subnet-group.name');

      // S3 Encryption -> KMS Key dependency
      const s3Encryption = synthesized.resource.aws_s3_bucket_server_side_encryption_configuration['app-bucket-encryption'];
      expect(s3Encryption.rule[0].apply_server_side_encryption_by_default.kms_master_key_id).toContain('aws_kms_key.main-kms-key.arn');
    });

    test('should enforce us-east-1 region constraint', () => {
      // Check AWS Provider region
      expect(synthesized.provider.aws.region).toBe('us-east-1');

      // Check AZ constraints for subnets
      expect(synthesized.resource.aws_subnet['public-subnet-1'].availability_zone).toBe('us-east-1a');
      expect(synthesized.resource.aws_subnet['public-subnet-2'].availability_zone).toBe('us-east-1b');
      expect(synthesized.resource.aws_subnet['private-subnet-1'].availability_zone).toBe('us-east-1a');
      expect(synthesized.resource.aws_subnet['private-subnet-2'].availability_zone).toBe('us-east-1b');
    });

    test('should implement security best practices', () => {
      // Verify S3 bucket encryption with KMS
      const s3Encryption = synthesized.resource.aws_s3_bucket_server_side_encryption_configuration['app-bucket-encryption'];
      expect(s3Encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe('aws:kms');

      // Verify RDS encryption
      const rds = synthesized.resource.aws_db_instance['main-database'];
      expect(rds.storage_encrypted).toBe(true);
      expect(rds.kms_key_id).toContain('aws_kms_key.main-kms-key.arn');

      // Verify Multi-AZ RDS
      expect(rds.multi_az).toBe(true);
      expect(rds.backup_retention_period).toBe(7);

      // Verify Security Group restrictions
      const webSg = synthesized.resource.aws_security_group['web-security-group'];
      const httpRule = webSg.ingress.find((rule: any) => rule.from_port === 80);
      const httpsRule = webSg.ingress.find((rule: any) => rule.from_port === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      // Verify database security group isolation
      const dbSg = synthesized.resource.aws_security_group['db-security-group'];
      const dbRule = dbSg.ingress.find((rule: any) => rule.from_port === 3306);
      expect(dbRule).toBeDefined();
      expect(dbRule.cidr_blocks).toBeUndefined(); // Should use security_groups instead
    });

    test('should implement least privilege IAM policies', () => {
      // EC2 Role Policy - should only have necessary permissions
      const ec2Policy = synthesized.resource.aws_iam_policy['ec2-policy'];
      const policyDoc = JSON.parse(ec2Policy.policy);
      const statement = policyDoc.Statement[0];
      
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:PutObject');
      expect(statement.Action).toContain('cloudwatch:PutMetricData');
      expect(statement.Action).not.toContain('*'); // No wildcard permissions

      // Lambda Role - should assume role correctly
      const lambdaRole = synthesized.resource.aws_iam_role['lambda-compliance-role'];
      const lambdaAssumePolicy = JSON.parse(lambdaRole.assume_role_policy);
      expect(lambdaAssumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('should configure Auto Scaling Groups correctly', () => {
      const asg = synthesized.resource.aws_autoscaling_group['web-asg'];
      
      // Verify capacity settings
      expect(asg.min_size).toBe(1);
      expect(asg.max_size).toBe(3);
      expect(asg.desired_capacity).toBe(2);
      
      // Verify health check configuration
      expect(asg.health_check_type).toBe('ELB');
      expect(asg.health_check_grace_period).toBe(300);
      
      // Verify subnet placement (should be in public subnets)
      expect(asg.vpc_zone_identifier).toEqual(
        expect.arrayContaining([
          expect.stringContaining('aws_subnet.public-subnet-1.id'),
          expect.stringContaining('aws_subnet.public-subnet-2.id'),
        ])
      );
    });

    test('should enable comprehensive monitoring and logging', () => {
      // VPC Flow Logs
      const flowLog = synthesized.resource.aws_flow_log['vpc-flow-log'];
      expect(flowLog.traffic_type).toBe('ALL');
      expect(flowLog.resource_type).toBe('VPC');

      // GuardDuty
      const guardDuty = synthesized.resource.aws_guardduty_detector['main-guardduty'];
      expect(guardDuty.enable).toBe(true);

      // Lambda for compliance monitoring
      const lambda = synthesized.resource.aws_lambda_function['compliance-lambda'];
      expect(lambda.function_name).toBe('compliance-checker-integration');
      expect(lambda.runtime).toBe('python3.9');

      // CloudWatch Event Rule for scheduled compliance checks
      const eventRule = synthesized.resource.aws_cloudwatch_event_rule['compliance-event-rule'];
      expect(eventRule.schedule_expression).toBe('rate(24 hours)');
    });

    test('should implement WAF protection', () => {
      const waf = synthesized.resource.aws_waf_web_acl['main-waf'];
      
      expect(waf.name).toBe('nova-waf-integration');
      expect(waf.default_action.type).toBe('ALLOW');
      expect(waf.metric_name).toBe('NovaWAFintegration');
    });

    test('should configure CloudFront and SSL correctly', () => {
      const distribution = synthesized.resource.aws_cloudfront_distribution['main-cloudfront'];
      
      expect(distribution.enabled).toBe(true);
      expect(distribution.aliases).toContain('integration.nova-test.com');
      expect(distribution.viewer_certificate.ssl_support_method).toBe('sni-only');
      expect(distribution.default_cache_behavior.viewer_protocol_policy).toBe('redirect-to-https');
      
      // Verify S3 origin configuration
      const s3Origin = distribution.origin.find((origin: any) => origin.origin_id === 'S3-nova-app');
      expect(s3Origin).toBeDefined();
      expect(s3Origin.domain_name).toContain('aws_s3_bucket.app-bucket.bucket_domain_name');
    });

    test('should configure Route53 with failover routing', () => {
      const hostedZone = synthesized.resource.aws_route53_zone['main-zone'];
      expect(hostedZone.name).toBe('integration.nova-test.com');

      const healthCheck = synthesized.resource.aws_route53_health_check['main-health-check'];
      expect(healthCheck.fqdn).toBe('integration.nova-test.com');
      expect(healthCheck.type).toBe('HTTPS');
      expect(healthCheck.port).toBe(443);

      const primaryRecord = synthesized.resource.aws_route53_record['primary-record'];
      expect(primaryRecord.type).toBe('A');
      expect(primaryRecord.set_identifier).toBe('primary');
      expect(primaryRecord.failover_routing_policy.type).toBe('PRIMARY');
    });

    test('should properly configure S3 bucket with versioning and KMS', () => {
      const bucket = synthesized.resource.aws_s3_bucket['app-bucket'];
      expect(bucket.bucket_prefix).toBe('nova-app-integration-');

      const versioning = synthesized.resource.aws_s3_bucket_versioning['app-bucket-versioning'];
      expect(versioning.versioning_configuration.status).toBe('Enabled');

      const encryption = synthesized.resource.aws_s3_bucket_server_side_encryption_configuration['app-bucket-encryption'];
      expect(encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe('aws:kms');
      expect(encryption.rule[0].apply_server_side_encryption_by_default.kms_master_key_id).toContain('aws_kms_key.main-kms-key.arn');
    });

    test('should validate all terraform outputs are present', () => {
      const outputs = synthesized.output;
      
      expect(outputs['vpc-id']).toBeDefined();
      expect(outputs['vpc-id'].description).toBe('VPC ID');
      
      expect(outputs['cloudfront-domain']).toBeDefined();
      expect(outputs['cloudfront-domain'].description).toBe('CloudFront Distribution Domain Name');
      
      expect(outputs['s3-bucket-name']).toBeDefined();
      expect(outputs['s3-bucket-name'].description).toBe('S3 Bucket Name');
      
      expect(outputs['kms-key-id']).toBeDefined();
      expect(outputs['kms-key-id'].description).toBe('KMS Key ID');
    });

    test('should apply consistent tagging across all resources', () => {
      const expectedTags = {
        Environment: 'integration',
        Owner: 'DevOps-Team',
        Project: 'IaC-AWS-Nova-Model-Breaking',
      };

      // Check VPC tags
      const vpc = synthesized.resource.aws_vpc['main-vpc'];
      expect(vpc.tags).toEqual(expect.objectContaining(expectedTags));

      // Check S3 bucket tags
      const bucket = synthesized.resource.aws_s3_bucket['app-bucket'];
      expect(bucket.tags).toEqual(expect.objectContaining(expectedTags));

      // Check RDS tags
      const rds = synthesized.resource.aws_db_instance['main-database'];
      expect(rds.tags).toEqual(expect.objectContaining(expectedTags));

      // Check Launch Template tags
      const launchTemplate = synthesized.resource.aws_launch_template['web-launch-template'];
      const instanceTags = launchTemplate.tag_specifications.find((spec: any) => spec.resource_type === 'instance');
      expect(instanceTags.tags).toEqual(expect.objectContaining(expectedTags));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle minimal configuration', () => {
      const minimalStack = new TapStack(app, 'MinimalStack');
      const minimalSynthesized = JSON.parse(Testing.synth(minimalStack));
      
      expect(minimalSynthesized).toBeDefined();
      expect(minimalSynthesized.provider.aws.region).toBe('us-east-1');
    });

    test('should validate environment suffix propagation', () => {
      const envStack = new TapStack(app, 'EnvStack', { environmentSuffix: 'staging' });
      const envSynthesized = JSON.parse(Testing.synth(envStack));
      
      // Check that environment suffix is applied to resource names
      expect(envSynthesized.resource.aws_iam_role['ec2-role'].name).toBe('ec2-role-staging');
      expect(envSynthesized.resource.aws_security_group['web-security-group'].name).toBe('web-sg-staging');
      expect(envSynthesized.resource.aws_db_instance['main-database'].identifier).toBe('nova-db-staging');
    });

    test('should validate custom domain name handling', () => {
      const customDomainStack = new TapStack(app, 'CustomDomainStack', {
        environmentSuffix: 'prod',
        domainName: 'custom.example.com',
      });
      const customSynthesized = JSON.parse(Testing.synth(customDomainStack));
      
      expect(customSynthesized.resource.aws_acm_certificate['main-certificate'].domain_name).toBe('custom.example.com');
      expect(customSynthesized.resource.aws_route53_zone['main-zone'].name).toBe('custom.example.com');
      expect(customSynthesized.resource.aws_cloudfront_distribution['main-cloudfront'].aliases).toContain('custom.example.com');
    });
  });

  describe('Performance and Scalability Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'ScalabilityTestStack', {
        environmentSuffix: 'scale-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should configure resources for high availability', () => {
      // Multi-AZ RDS
      const rds = synthesized.resource.aws_db_instance['main-database'];
      expect(rds.multi_az).toBe(true);

      // Auto Scaling across multiple AZs
      const asg = synthesized.resource.aws_autoscaling_group['web-asg'];
      expect(asg.vpc_zone_identifier.length).toBe(2); // Two public subnets

      // Private subnets in different AZs for database
      expect(synthesized.resource.aws_subnet['private-subnet-1'].availability_zone).toBe('us-east-1a');
      expect(synthesized.resource.aws_subnet['private-subnet-2'].availability_zone).toBe('us-east-1b');
    });

    test('should configure CloudFront for global content delivery', () => {
      const distribution = synthesized.resource.aws_cloudfront_distribution['main-cloudfront'];
      expect(distribution.enabled).toBe(true);
      expect(distribution.default_cache_behavior.compress).toBe(true);
      expect(distribution.default_cache_behavior.viewer_protocol_policy).toBe('redirect-to-https');
    });
  });
});
