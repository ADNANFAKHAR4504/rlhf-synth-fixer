import { App, Testing } from 'cdktf';
import { FinancialProcessorStack } from '../lib/financial-processor-stack';

describe('Financial Processor Stack Integration Tests', () => {
  let app: App;
  let stack: FinancialProcessorStack;
  let synthesized: string;
  let config: any;

  beforeAll(() => {
    app = new App();
    stack = new FinancialProcessorStack(app, 'integration-test-financial-processor', {
      environment: 'production',
      appName: 'financial-processor',
      costCenter: 'FinOps',
      primaryRegion: 'eu-central-1',  // Updated for EU regions
      secondaryRegion: 'eu-west-1',   // Updated for EU regions
      domainName: 'finproc-integration.internal',
    });
    synthesized = Testing.synth(stack);
    config = JSON.parse(synthesized);
  });

  describe('Multi-Region Architecture Integration', () => {
    test('should deploy complete infrastructure across both regions', () => {
      // Verify primary region resources
      const primaryResources = Object.keys(config.resource).filter(key =>
        Object.values(config.resource[key]).some((resource: any) =>
          resource.provider === 'aws.primary'
        )
      );

      // Verify secondary region resources
      const secondaryResources = Object.keys(config.resource).filter(key =>
        Object.values(config.resource[key]).some((resource: any) =>
          resource.provider === 'aws.secondary'
        )
      );

      expect(primaryResources.length).toBeGreaterThan(10);
      expect(secondaryResources.length).toBeGreaterThan(5);
    });

    test('should configure cross-region networking properly', () => {
      // Verify VPCs in both regions
      expect(config.resource.aws_vpc).toHaveProperty('primary-vpc');
      expect(config.resource.aws_vpc).toHaveProperty('secondary-vpc');

      // Verify different CIDR blocks
      const primaryVpc = config.resource.aws_vpc['primary-vpc'];
      const secondaryVpc = config.resource.aws_vpc['secondary-vpc'];

      expect(primaryVpc.cidr_block).toBe('10.0.0.0/16');
      expect(secondaryVpc.cidr_block).toBe('10.1.0.0/16');
      expect(primaryVpc.provider).toBe('aws.primary');
      expect(secondaryVpc.provider).toBe('aws.secondary');
    });

    test('should establish proper subnet architecture', () => {
      // Count subnets per region
      const primarySubnets = Object.entries(config.resource.aws_subnet || {})
        .filter(([, subnet]: [string, any]) => subnet.provider === 'aws.primary');
      const secondarySubnets = Object.entries(config.resource.aws_subnet || {})
        .filter(([, subnet]: [string, any]) => subnet.provider === 'aws.secondary');

      expect(primarySubnets.length).toBe(4); // 2 public + 2 private
      expect(secondarySubnets.length).toBe(4); // 2 public + 2 private
    });
  });

  describe('Disaster Recovery Configuration', () => {
    test('should configure DynamoDB with global replication', () => {
      const dynamoTable = config.resource.aws_dynamodb_table?.['transaction-table'];
      expect(dynamoTable).toBeDefined();
      expect(dynamoTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(dynamoTable.hash_key).toBe('transactionId');
      expect(dynamoTable.range_key).toBe('timestamp');

      // Verify replica configuration exists
      expect(dynamoTable.replica).toBeDefined();
      expect(Array.isArray(dynamoTable.replica)).toBe(true);

      // Verify point-in-time recovery
      expect(dynamoTable.point_in_time_recovery).toBeDefined();
    });

    test('should configure S3 cross-region replication', () => {
      const primaryBucket = config.resource.aws_s3_bucket?.['primary-bucket'];
      const secondaryBucket = config.resource.aws_s3_bucket?.['secondary-bucket'];

      expect(primaryBucket).toBeDefined();
      expect(secondaryBucket).toBeDefined();
      expect(primaryBucket.provider).toBe('aws.primary');
      expect(secondaryBucket.provider).toBe('aws.secondary');

      // Verify replication configuration exists
      expect(config.resource.aws_s3_bucket_replication_configuration).toBeDefined();
      const replicationConfig = config.resource.aws_s3_bucket_replication_configuration['primary-bucket-replication'];
      expect(replicationConfig).toBeDefined();
      expect(replicationConfig.bucket).toContain('aws_s3_bucket.primary-bucket.id');
    });

    test('should configure Route53 health checks for failover', () => {
      expect(config.resource.aws_route53_health_check).toBeDefined();
      const healthChecks = Object.entries(config.resource.aws_route53_health_check);

      expect(healthChecks.length).toBeGreaterThanOrEqual(2);

      // Verify primary region health check
      const primaryHealthCheck = healthChecks.find(([name]) => name.includes('primary'));
      expect(primaryHealthCheck).toBeDefined();

      // Verify secondary region health check
      const secondaryHealthCheck = healthChecks.find(([name]) => name.includes('secondary'));
      expect(secondaryHealthCheck).toBeDefined();
    });

    test('should configure automatic failover with EventBridge and Lambda', () => {
      // Verify EventBridge rules for health monitoring
      expect(config.resource.aws_cloudwatch_event_rule).toBeDefined();
      const eventRules = Object.values(config.resource.aws_cloudwatch_event_rule);
      expect(eventRules.length).toBeGreaterThan(0);

      // Verify Lambda functions for failover automation
      expect(config.resource.aws_lambda_function).toBeDefined();
      const lambdaFunctions = Object.entries(config.resource.aws_lambda_function);

      const healthCheckLambda = lambdaFunctions.find(([name]) => name.includes('health-check'));
      expect(healthCheckLambda).toBeDefined();
      expect((healthCheckLambda![1] as any).runtime).toBe('nodejs18.x');
      expect((healthCheckLambda![1] as any).function_name).toBe('financial-processor-health-check');
    });
  });

  describe('Security and Compliance Integration', () => {
    test('should implement comprehensive encryption strategy', () => {
      // Verify KMS keys in both regions
      expect(config.resource.aws_kms_key['primary-kms-key']).toBeDefined();
      expect(config.resource.aws_kms_key['secondary-kms-key']).toBeDefined();

      // Verify KMS key rotation is enabled
      expect(config.resource.aws_kms_key['primary-kms-key'].enable_key_rotation).toBe(true);
      expect(config.resource.aws_kms_key['secondary-kms-key'].enable_key_rotation).toBe(true);

      // Verify DynamoDB encryption configuration exists
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];
      expect(dynamoTable.server_side_encryption).toBeDefined();

      // Verify S3 encryption
      expect(config.resource.aws_s3_bucket_server_side_encryption_configuration).toBeDefined();
      expect(config.resource.aws_s3_bucket_server_side_encryption_configuration['primary-bucket-encryption']).toBeDefined();
      expect(config.resource.aws_s3_bucket_server_side_encryption_configuration['secondary-bucket-encryption']).toBeDefined();
    });

    test('should configure IAM roles with least privilege', () => {
      expect(config.resource.aws_iam_role).toBeDefined();
      const iamRoles = Object.entries(config.resource.aws_iam_role);

      // Verify Lambda execution role
      const lambdaRole = iamRoles.find(([name]) => name.includes('lambda-execution-role'));
      expect(lambdaRole).toBeDefined();

      // Verify replication role for S3
      const replicationRole = iamRoles.find(([name]) => name.includes('s3-replication-role'));
      expect(replicationRole).toBeDefined();

      // Check that policies are attached
      expect(config.resource.aws_iam_role_policy_attachment).toBeDefined();
      expect(config.resource.aws_iam_role_policy_attachment['lambda-basic-execution']).toBeDefined();
      expect(config.resource.aws_iam_role_policy_attachment['s3-replication-policy-attachment']).toBeDefined();
    });

    test('should enforce TLS for in-transit encryption', () => {
      // Verify Load Balancer listeners use HTTPS
      const lbListeners = Object.values(config.resource.aws_lb_listener || {});
      lbListeners.forEach((listener: any) => {
        if (listener.port === 443) {
          expect(listener.protocol).toBe('HTTPS');
        }
      });

      // Verify security group rules allow HTTPS
      const securityGroups = Object.values(config.resource.aws_security_group || {});
      const hasHttpsIngress = securityGroups.some((sg: any) =>
        sg.ingress?.some((rule: any) => rule.from_port === 443 && rule.to_port === 443)
      );
      expect(hasHttpsIngress).toBe(true);
    });
  });

  describe('Monitoring and Observability Integration', () => {
    test('should configure comprehensive CloudWatch monitoring', () => {
      // Verify CloudWatch Log Groups
      expect(config.resource.aws_cloudwatch_log_group).toBeDefined();
      const logGroups = Object.entries(config.resource.aws_cloudwatch_log_group);
      expect(logGroups.length).toBeGreaterThan(0);

      // Verify CloudWatch Alarms
      expect(config.resource.aws_cloudwatch_metric_alarm).toBeDefined();
      const alarms = Object.entries(config.resource.aws_cloudwatch_metric_alarm);
      expect(alarms.length).toBeGreaterThan(0);
    });

    test('should configure audit trail logging', () => {
      const logGroups = Object.values(config.resource.aws_cloudwatch_log_group);
      expect(logGroups.length).toBeGreaterThan(0);

      // Verify application log groups exist
      const appLogGroup = logGroups.find((lg: any) =>
        lg.name && lg.name.includes('application')
      );
      expect(appLogGroup).toBeDefined();

      // Verify lambda log groups exist
      const lambdaLogGroup = logGroups.find((lg: any) =>
        lg.name && lg.name.includes('lambda')
      );
      expect(lambdaLogGroup).toBeDefined();
    });
  });

  describe('Performance and Scalability Integration', () => {
    test('should configure auto-scaling capabilities', () => {
      // Verify DynamoDB on-demand scaling
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];
      expect(dynamoTable.billing_mode).toBe('PAY_PER_REQUEST');

      // Verify Load Balancer configuration
      expect(config.resource.aws_lb).toBeDefined();
      const loadBalancer = Object.values(config.resource.aws_lb)[0] as any;
      expect(loadBalancer.load_balancer_type).toBe('application');
    });

    test('should configure proper target groups for load balancing', () => {
      expect(config.resource.aws_lb_target_group).toBeDefined();
      const targetGroups = Object.values(config.resource.aws_lb_target_group);

      expect(targetGroups.length).toBe(2); // Primary and secondary

      targetGroups.forEach((tg: any) => {
        expect(tg.protocol).toBe('HTTP');
        expect(tg.port).toBe(80);
        expect(tg.health_check).toBeDefined();
      });

      // Verify primary and secondary target groups exist
      expect(config.resource.aws_lb_target_group['primary-target-group']).toBeDefined();
      expect(config.resource.aws_lb_target_group['secondary-target-group']).toBeDefined();
    });
  });

  describe('Resource Tagging and Management Integration', () => {
    test('should apply consistent tagging across all resources', () => {
      const requiredTags = {
        Environment: 'production',
        App: 'financial-processor',
        ManagedBy: 'CDKTF',
        CostCenter: 'FinOps'
      };

      // Check VPC tags
      const primaryVpc = config.resource.aws_vpc['primary-vpc'];
      Object.entries(requiredTags).forEach(([key, value]) => {
        expect(primaryVpc.tags[key]).toBe(value);
      });

      // Check DynamoDB tags
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];
      Object.entries(requiredTags).forEach(([key, value]) => {
        expect(dynamoTable.tags[key]).toBe(value);
      });

      // Check S3 bucket tags
      const primaryBucket = config.resource.aws_s3_bucket['primary-bucket'];
      Object.entries(requiredTags).forEach(([key, value]) => {
        expect(primaryBucket.tags[key]).toBe(value);
      });
    });

    test('should generate unique resource names to avoid conflicts', () => {
      // Verify resources have unique suffixes
      const dynamoTableName = config.resource.aws_dynamodb_table['transaction-table'].name;
      const primaryBucketName = config.resource.aws_s3_bucket['primary-bucket'].bucket;
      const lambdaFunctionName = config.resource.aws_lambda_function['health-check-lambda'].function_name;

      expect(dynamoTableName).toMatch(/financial-processor-transactions-\d+-\w+/);
      expect(primaryBucketName).toMatch(/financial-processor-primary-\w+/);
      expect(lambdaFunctionName).toBe('financial-processor-health-check');
    });
  });

  describe('Terraform Configuration Integration', () => {
    test('should generate valid Terraform structure', () => {
      expect(config.terraform).toBeDefined();
      expect(config.terraform.required_providers).toBeDefined();
      expect(config.terraform.required_providers.aws.version).toBe('6.11.0');
    });

    test('should define proper Terraform outputs', () => {
      expect(config.output).toBeDefined();
      const outputs = Object.keys(config.output);

      // Verify essential outputs exist (using the actual output names)
      expect(outputs).toContain('primary-vpc-id');
      expect(outputs).toContain('secondary-vpc-id');
      expect(outputs).toContain('dynamodb-table-name');
      expect(outputs).toContain('route53-zone-id');
      expect(outputs).toContain('domain-name');
      expect(outputs).toContain('primary-alb-dns');
      expect(outputs).toContain('secondary-alb-dns');
    });
  });

  describe('End-to-End Disaster Recovery Integration', () => {
    test('should enable complete disaster recovery workflow', () => {
      // Verify all components for DR are present
      const hasHealthChecks = config.resource.aws_route53_health_check !== undefined;
      const hasFailoverRecords = config.resource.aws_route53_record !== undefined;
      const hasEventBridge = config.resource.aws_cloudwatch_event_rule !== undefined;
      const hasLambdaFailover = config.resource.aws_lambda_function !== undefined;
      const hasCrossRegionReplication = config.resource.aws_s3_bucket_replication_configuration !== undefined;
      const hasGlobalTables = config.resource.aws_dynamodb_table['transaction-table'].replica !== undefined;

      expect(hasHealthChecks).toBe(true);
      expect(hasFailoverRecords).toBe(true);
      expect(hasEventBridge).toBe(true);
      expect(hasLambdaFailover).toBe(true);
      expect(hasCrossRegionReplication).toBe(true);
      expect(hasGlobalTables).toBe(true);
    });

    test('should meet RTO and RPO requirements', () => {
      // Verify Route53 health check frequency (should check every 30 seconds for 5-minute RTO)
      const healthChecks = Object.values(config.resource.aws_route53_health_check);
      healthChecks.forEach((hc: any) => {
        expect(hc.request_interval).toBeLessThanOrEqual(30);
        expect(hc.failure_threshold).toBeLessThanOrEqual(10); // 5 minutes max
      });

      // Verify DynamoDB global tables for RPO < 1 minute
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];
      expect(dynamoTable.replica).toBeDefined();
      expect(Array.isArray(dynamoTable.replica)).toBe(true);

      // Verify point-in-time recovery is configured
      expect(dynamoTable.point_in_time_recovery).toBeDefined();
    });
  });

  describe('Cost Optimization Integration', () => {
    test('should use cost-effective resource configurations', () => {
      // Verify on-demand DynamoDB (cost-effective for variable workloads)
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];
      expect(dynamoTable.billing_mode).toBe('PAY_PER_REQUEST');

      // Verify NAT Gateway only in primary region (cost optimization)
      const natGateways = Object.entries(config.resource.aws_nat_gateway || {});
      const primaryNatGateways = natGateways.filter(([, nat]: [string, any]) =>
        nat.provider === 'aws.primary'
      );
      expect(primaryNatGateways.length).toBe(1); // Only one NAT gateway in primary
    });
  });
});
