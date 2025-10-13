import { App, Testing } from 'cdktf';
import { FinancialProcessorStack } from '../lib/financial-processor-stack';

describe('Financial Processor Stack Unit Tests', () => {
  let app: App;
  let stack: FinancialProcessorStack;
  let synthesized: string;

  beforeAll(() => {
    app = new App();
    stack = new FinancialProcessorStack(app, 'test-financial-processor', {
      environment: 'production',
      appName: 'financial-processor',
      costCenter: 'FinOps',
      primaryRegion: 'us-east-2',
      secondaryRegion: 'us-west-2',
      domainName: 'finproc-demo.internal',
    });
    synthesized = Testing.synth(stack);
  });

  describe('Stack Instantiation', () => {
    test('should instantiate FinancialProcessorStack without errors', () => {
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
      expect(synthesized.length).toBeGreaterThan(0);
    });

    test('should set correct stack ID', () => {
      expect(stack.node.id).toBe('test-financial-processor');
    });

    test('should be a valid CDKTF stack', () => {
      expect(stack.constructor.name).toBe('FinancialProcessorStack');
    });

    test('should generate valid Terraform JSON structure', () => {
      const config = JSON.parse(synthesized);
      expect(config).toHaveProperty('terraform');
      expect(config).toHaveProperty('provider');
      expect(config).toHaveProperty('resource');
    });
  });

  describe('AWS Provider Configuration', () => {
    test('should configure primary AWS provider with correct region', () => {
      const config = JSON.parse(synthesized);
      const primaryProvider = config.provider.aws.find((p: any) => p.alias === 'primary');
      expect(primaryProvider.region).toBe('us-east-2');
      expect(primaryProvider.alias).toBe('primary');
    });

    test('should configure secondary AWS provider with correct region', () => {
      const config = JSON.parse(synthesized);
      const secondaryProvider = config.provider.aws.find((p: any) => p.alias === 'secondary');
      expect(secondaryProvider.region).toBe('us-west-2');
      expect(secondaryProvider.alias).toBe('secondary');
    });

    test('should have both AWS provider configurations', () => {
      const config = JSON.parse(synthesized);
      expect(config.provider.aws).toHaveLength(2);
      expect(config.provider.aws.find((p: any) => p.alias === 'primary')).toBeDefined();
      expect(config.provider.aws.find((p: any) => p.alias === 'secondary')).toBeDefined();
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS keys in both regions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_kms_key).toHaveProperty('primary-kms-key');
      expect(config.resource.aws_kms_key).toHaveProperty('secondary-kms-key');
    });

    test('should enable key rotation for both KMS keys', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_kms_key['primary-kms-key'].enable_key_rotation).toBe(true);
      expect(config.resource.aws_kms_key['secondary-kms-key'].enable_key_rotation).toBe(true);
    });

    test('should create KMS aliases for both keys', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_kms_alias).toHaveProperty('primary-kms-alias');
      expect(config.resource.aws_kms_alias).toHaveProperty('secondary-kms-alias');
    });

    test('should configure proper KMS key policies', () => {
      const config = JSON.parse(synthesized);
      const primaryKeyPolicy = JSON.parse(config.resource.aws_kms_key['primary-kms-key'].policy);
      const secondaryKeyPolicy = JSON.parse(config.resource.aws_kms_key['secondary-kms-key'].policy);

      expect(primaryKeyPolicy.Statement).toHaveLength(2);
      expect(secondaryKeyPolicy.Statement).toHaveLength(2);
      expect(primaryKeyPolicy.Statement[1].Principal.Service).toBe('logs.us-east-2.amazonaws.com');
      expect(secondaryKeyPolicy.Statement[1].Principal.Service).toBe('logs.us-west-2.amazonaws.com');
    });

    test('should include environment-specific alias names', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_kms_alias['primary-kms-alias'].name).toContain('financial-processor-primary');
      expect(config.resource.aws_kms_alias['secondary-kms-alias'].name).toContain('financial-processor-secondary');
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPCs in both regions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_vpc).toHaveProperty('primary-vpc');
      expect(config.resource.aws_vpc).toHaveProperty('secondary-vpc');
    });

    test('should configure correct CIDR blocks', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_vpc['primary-vpc'].cidr_block).toBe('10.0.0.0/16');
      expect(config.resource.aws_vpc['secondary-vpc'].cidr_block).toBe('10.1.0.0/16');
    });

    test('should enable DNS hostname and support', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_vpc['primary-vpc'].enable_dns_hostnames).toBe(true);
      expect(config.resource.aws_vpc['primary-vpc'].enable_dns_support).toBe(true);
      expect(config.resource.aws_vpc['secondary-vpc'].enable_dns_hostnames).toBe(true);
      expect(config.resource.aws_vpc['secondary-vpc'].enable_dns_support).toBe(true);
    });

    test('should include proper VPC tags', () => {
      const config = JSON.parse(synthesized);
      const primaryVpcTags = config.resource.aws_vpc['primary-vpc'].tags;
      const secondaryVpcTags = config.resource.aws_vpc['secondary-vpc'].tags;

      expect(primaryVpcTags.App).toBe('financial-processor');
      expect(primaryVpcTags.Environment).toBe('production');
      expect(primaryVpcTags.ManagedBy).toBe('CDKTF');
      expect(secondaryVpcTags.App).toBe('financial-processor');
    });
  });

  describe('Subnet Configuration', () => {
    test('should create public subnets in both regions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_subnet).toHaveProperty('primary-public-subnet-1');
      expect(config.resource.aws_subnet).toHaveProperty('primary-public-subnet-2');
      expect(config.resource.aws_subnet).toHaveProperty('secondary-public-subnet-1');
      expect(config.resource.aws_subnet).toHaveProperty('secondary-public-subnet-2');
    });

    test('should create private subnets in both regions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_subnet).toHaveProperty('primary-private-subnet-1');
      expect(config.resource.aws_subnet).toHaveProperty('primary-private-subnet-2');
      expect(config.resource.aws_subnet).toHaveProperty('secondary-private-subnet-1');
      expect(config.resource.aws_subnet).toHaveProperty('secondary-private-subnet-2');
    });

    test('should configure correct subnet CIDR blocks', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_subnet['primary-public-subnet-1'].cidr_block).toBe('10.0.1.0/24');
      expect(config.resource.aws_subnet['primary-public-subnet-2'].cidr_block).toBe('10.0.2.0/24');
      expect(config.resource.aws_subnet['primary-private-subnet-1'].cidr_block).toBe('10.0.10.0/24');
      expect(config.resource.aws_subnet['primary-private-subnet-2'].cidr_block).toBe('10.0.11.0/24');
    });

    test('should enable public IP mapping for public subnets', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_subnet['primary-public-subnet-1'].map_public_ip_on_launch).toBe(true);
      expect(config.resource.aws_subnet['primary-public-subnet-2'].map_public_ip_on_launch).toBe(true);
      expect(config.resource.aws_subnet['secondary-public-subnet-1'].map_public_ip_on_launch).toBe(true);
      expect(config.resource.aws_subnet['secondary-public-subnet-2'].map_public_ip_on_launch).toBe(true);
    });

    test('should configure subnets in different availability zones', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_subnet['primary-public-subnet-1'].availability_zone).toBe('us-east-2a');
      expect(config.resource.aws_subnet['primary-public-subnet-2'].availability_zone).toBe('us-east-2b');
      expect(config.resource.aws_subnet['secondary-public-subnet-1'].availability_zone).toBe('us-west-2a');
      expect(config.resource.aws_subnet['secondary-public-subnet-2'].availability_zone).toBe('us-west-2b');
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create internet gateways in both regions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_internet_gateway).toHaveProperty('primary-igw');
      expect(config.resource.aws_internet_gateway).toHaveProperty('secondary-igw');
    });

    test('should attach internet gateways to correct VPCs', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_internet_gateway['primary-igw'].vpc_id).toBe('${aws_vpc.primary-vpc.id}');
      expect(config.resource.aws_internet_gateway['secondary-igw'].vpc_id).toBe('${aws_vpc.secondary-vpc.id}');
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NAT gateway in primary region', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_nat_gateway).toHaveProperty('primary-nat-gateway');
    });

    test('should create Elastic IP for NAT gateway', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_eip).toHaveProperty('primary-nat-eip');
      expect(config.resource.aws_eip['primary-nat-eip'].domain).toBe('vpc');
    });

    test('should include proper NAT gateway tags', () => {
      const config = JSON.parse(synthesized);
      const natTags = config.resource.aws_nat_gateway['primary-nat-gateway'].tags;
      expect(natTags.App).toBe('financial-processor');
      expect(natTags.Environment).toBe('production');
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route tables in both regions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_route_table).toHaveProperty('primary-public-rt');
      expect(config.resource.aws_route_table).toHaveProperty('secondary-public-rt');
    });

    test('should create private route tables in both regions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_route_table).toHaveProperty('primary-private-rt');
      expect(config.resource.aws_route_table).toHaveProperty('secondary-private-rt');
    });

    test('should create routes for internet access', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_route).toHaveProperty('primary-public-route');
      expect(config.resource.aws_route).toHaveProperty('secondary-public-route');
      expect(config.resource.aws_route).toHaveProperty('primary-private-route');
    });

    test('should create route table associations', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_route_table_association).toHaveProperty('primary-public-rta-1');
      expect(config.resource.aws_route_table_association).toHaveProperty('primary-public-rta-2');
      expect(config.resource.aws_route_table_association).toHaveProperty('primary-private-rta-1');
      expect(config.resource.aws_route_table_association).toHaveProperty('primary-private-rta-2');
    });
  });

  describe('Security Group Configuration', () => {
    test('should create application security groups', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_security_group).toHaveProperty('app-security-group');
      expect(config.resource.aws_security_group).toHaveProperty('secondary-app-security-group');
    });

    test('should configure security group ingress rules', () => {
      const config = JSON.parse(synthesized);
      const sgIngress = config.resource.aws_security_group['app-security-group'].ingress;
      expect(sgIngress).toHaveLength(2);
      expect(sgIngress[0].from_port).toBe(443);
      expect(sgIngress[0].to_port).toBe(443);
      expect(sgIngress[0].protocol).toBe('tcp');
      expect(sgIngress[1].from_port).toBe(80);
      expect(sgIngress[1].to_port).toBe(80);
    });

    test('should configure security group egress rules', () => {
      const config = JSON.parse(synthesized);
      const sgEgress = config.resource.aws_security_group['app-security-group'].egress;
      expect(sgEgress).toHaveLength(1);
      expect(sgEgress[0].from_port).toBe(0);
      expect(sgEgress[0].to_port).toBe(0);
      expect(sgEgress[0].protocol).toBe('-1');
    });

    test('should include proper security descriptions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_security_group['app-security-group'].description).toBe('Security group for financial processor application');
      expect(config.resource.aws_security_group['app-security-group'].ingress[0].description).toBe('HTTPS traffic');
      expect(config.resource.aws_security_group['app-security-group'].ingress[1].description).toBe('HTTP traffic for health checks');
    });
  });

  describe('DynamoDB Configuration', () => {
    test('should create transaction table with correct configuration', () => {
      // The financial processor stack includes a DynamoDB table for transactions
      const config = JSON.parse(synthesized);
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];

      expect(dynamoTable).toBeDefined();
      expect(dynamoTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(dynamoTable.hash_key).toBe('transactionId');
      expect(dynamoTable.range_key).toBe('timestamp');
    });

    test('should configure DynamoDB table with proper attributes', () => {
      const config = JSON.parse(synthesized);
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];

      expect(dynamoTable.attribute).toHaveLength(3);
      expect(dynamoTable.attribute).toContainEqual({ name: 'transactionId', type: 'S' });
      expect(dynamoTable.attribute).toContainEqual({ name: 'timestamp', type: 'S' });
      expect(dynamoTable.attribute).toContainEqual({ name: 'userId', type: 'S' });
    });

    test('should configure DynamoDB table with global secondary index', () => {
      const config = JSON.parse(synthesized);
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];

      expect(dynamoTable.global_secondary_index).toHaveLength(1);
      expect(dynamoTable.global_secondary_index[0].name).toBe('UserIndex');
      expect(dynamoTable.global_secondary_index[0].hash_key).toBe('userId');
      expect(dynamoTable.global_secondary_index[0].range_key).toBe('timestamp');
      expect(dynamoTable.global_secondary_index[0].projection_type).toBe('ALL');
    });

    test('should configure DynamoDB table with encryption and PITR', () => {
      const config = JSON.parse(synthesized);
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];

      expect(dynamoTable.server_side_encryption.enabled).toBe(true);
      expect(dynamoTable.server_side_encryption.kms_key_arn).toContain('aws_kms_key.primary-kms-key.arn');
      expect(dynamoTable.point_in_time_recovery.enabled).toBe(true);
    });

    test('should configure DynamoDB table with cross-region replica', () => {
      const config = JSON.parse(synthesized);
      const dynamoTable = config.resource.aws_dynamodb_table['transaction-table'];

      expect(dynamoTable.replica).toHaveLength(1);
      expect(dynamoTable.replica[0].region_name).toBe('us-west-2');
      expect(dynamoTable.replica[0].kms_key_arn).toContain('aws_kms_key.secondary-kms-key.arn');
      expect(dynamoTable.replica[0].point_in_time_recovery).toBe(true);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 buckets in both regions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_s3_bucket).toHaveProperty('primary-bucket');
      expect(config.resource.aws_s3_bucket).toHaveProperty('secondary-bucket');
    });

    test('should configure bucket versioning', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_s3_bucket_versioning).toHaveProperty('primary-bucket-versioning');
      expect(config.resource.aws_s3_bucket_versioning).toHaveProperty('secondary-bucket-versioning');
      expect(config.resource.aws_s3_bucket_versioning['primary-bucket-versioning'].versioning_configuration.status).toBe('Enabled');
    });

    test('should configure server-side encryption', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_s3_bucket_server_side_encryption_configuration).toHaveProperty('primary-bucket-encryption');
      expect(config.resource.aws_s3_bucket_server_side_encryption_configuration).toHaveProperty('secondary-bucket-encryption');

      const primaryEncryption = config.resource.aws_s3_bucket_server_side_encryption_configuration['primary-bucket-encryption'];
      expect(primaryEncryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe('aws:kms');
    });

    test('should block public access', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_s3_bucket_public_access_block).toHaveProperty('primary-bucket-pab');
      expect(config.resource.aws_s3_bucket_public_access_block).toHaveProperty('secondary-bucket-pab');

      const pab = config.resource.aws_s3_bucket_public_access_block['primary-bucket-pab'];
      expect(pab.block_public_acls).toBe(true);
      expect(pab.block_public_policy).toBe(true);
      expect(pab.ignore_public_acls).toBe(true);
      expect(pab.restrict_public_buckets).toBe(true);
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM roles for S3 replication', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_iam_role).toHaveProperty('s3-replication-role');
      expect(config.resource.aws_iam_role).toHaveProperty('lambda-execution-role');
    });

    test('should create IAM policies', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_iam_policy).toHaveProperty('s3-replication-policy');
      expect(config.resource.aws_iam_policy).toHaveProperty('lambda-route53-policy');
    });

    test('should configure Lambda execution roles', () => {
      const config = JSON.parse(synthesized);
      const lambdaRole = config.resource.aws_iam_role['lambda-execution-role'];
      const assumeRolePolicy = JSON.parse(lambdaRole.assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('should include proper trust policies', () => {
      const config = JSON.parse(synthesized);
      const s3Role = config.resource.aws_iam_role['s3-replication-role'];
      const assumeRolePolicy = JSON.parse(s3Role.assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('s3.amazonaws.com');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should create Lambda functions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_lambda_function).toHaveProperty('health-check-lambda');
    });

    test('should configure Lambda runtime and handler', () => {
      const config = JSON.parse(synthesized);
      const lambda = config.resource.aws_lambda_function['health-check-lambda'];
      expect(lambda.runtime).toBe('nodejs18.x');
      expect(lambda.handler).toBe('index.handler');
    });

    test('should configure Lambda environment variables', () => {
      const config = JSON.parse(synthesized);
      const lambda = config.resource.aws_lambda_function['health-check-lambda'];
      expect(lambda.environment.variables.DOMAIN_NAME).toBe('finproc-demo.internal');
      expect(lambda.environment.variables).toHaveProperty('HOSTED_ZONE_ID');
      expect(lambda.environment.variables).toHaveProperty('PRIMARY_HEALTH_CHECK_ID');
      expect(lambda.environment.variables).toHaveProperty('SECONDARY_HEALTH_CHECK_ID');
    });

    test('should configure Lambda timeout', () => {
      const config = JSON.parse(synthesized);
      const lambda = config.resource.aws_lambda_function['health-check-lambda'];
      expect(lambda.timeout).toBe(300);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should configure EventBridge rules', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cloudwatch_event_rule).toHaveProperty('health-check-event-rule');

      const eventRule = config.resource.aws_cloudwatch_event_rule['health-check-event-rule'];
      expect(eventRule.schedule_expression).toBe('rate(2 minutes)');
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create Application Load Balancer', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_lb).toHaveProperty('primary-alb');
      expect(config.resource.aws_lb).toHaveProperty('secondary-alb');

      const primaryAlb = config.resource.aws_lb['primary-alb'];
      expect(primaryAlb.load_balancer_type).toBe('application');
      expect(primaryAlb.internal).toBe(false);
    });

    test('should configure ALB listeners', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_lb_listener).toHaveProperty('primary-alb-listener');
      expect(config.resource.aws_lb_listener).toHaveProperty('secondary-alb-listener');

      const listener = config.resource.aws_lb_listener['primary-alb-listener'];
      expect(listener.port).toBe(80);
      expect(listener.protocol).toBe('HTTP');
    });

    test('should create target groups', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_lb_target_group).toHaveProperty('primary-target-group');
      expect(config.resource.aws_lb_target_group).toHaveProperty('secondary-target-group');
    });

    test('should configure health checks', () => {
      const config = JSON.parse(synthesized);
      const targetGroup = config.resource.aws_lb_target_group['primary-target-group'];
      expect(targetGroup.health_check.enabled).toBe(true);
      expect(targetGroup.health_check.path).toBe('/health');
      expect(targetGroup.health_check.matcher).toBe('200');
    });
  });

  describe('Route 53 Configuration', () => {
    test('should create Route 53 hosted zone', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_route53_zone).toHaveProperty('hosted-zone');

      const hostedZone = config.resource.aws_route53_zone['hosted-zone'];
      expect(hostedZone.name).toBe('finproc-demo.internal');
    });

    test('should create Route 53 records', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_route53_record).toHaveProperty('primary-dns-record');
      expect(config.resource.aws_route53_record).toHaveProperty('secondary-dns-record');

      const primaryRecord = config.resource.aws_route53_record['primary-dns-record'];
      expect(primaryRecord.failover_routing_policy.type).toBe('PRIMARY');
      expect(primaryRecord.type).toBe('A');
    });

    test('should configure health checks', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_route53_health_check).toHaveProperty('primary-health-check');
      expect(config.resource.aws_route53_health_check).toHaveProperty('secondary-health-check');

      const healthCheck = config.resource.aws_route53_health_check['primary-health-check'];
      expect(healthCheck.type).toBe('HTTP');
      expect(healthCheck.resource_path).toBe('/health');
      expect(healthCheck.port).toBe(80);
    });
  });

  describe('Resource Tagging', () => {
    test('should include all required tags on resources', () => {
      const config = JSON.parse(synthesized);

      // Check VPC tags
      const vpcTags = config.resource.aws_vpc['primary-vpc'].tags;
      expect(vpcTags.App).toBe('financial-processor');
      expect(vpcTags.Environment).toBe('production');
      expect(vpcTags.CostCenter).toBe('FinOps');
      expect(vpcTags.ManagedBy).toBe('CDKTF');
    });

    test('should have consistent tagging across resources', () => {
      const config = JSON.parse(synthesized);

      const s3Tags = config.resource.aws_s3_bucket['primary-bucket'].tags;
      const kmsKeys = config.resource.aws_kms_key['primary-kms-key'].tags;
      const lambdaTags = config.resource.aws_lambda_function['health-check-lambda'].tags;

      expect(s3Tags.App).toBe('financial-processor');
      expect(kmsKeys.App).toBe('financial-processor');
      expect(lambdaTags.App).toBe('financial-processor');

      expect(s3Tags.Environment).toBe('production');
      expect(kmsKeys.Environment).toBe('production');
      expect(lambdaTags.Environment).toBe('production');
    });
  });

  describe('Terraform Outputs', () => {
    test('should define Terraform outputs', () => {
      const config = JSON.parse(synthesized);
      expect(config).toHaveProperty('output');
    });

    test('should output important resource references', () => {
      const config = JSON.parse(synthesized);
      expect(config.output).toHaveProperty('primary-alb-dns');
      expect(config.output).toHaveProperty('secondary-alb-dns');
      expect(config.output).toHaveProperty('route53-zone-id');
      expect(config.output).toHaveProperty('primary-s3-bucket');
      expect(config.output).toHaveProperty('secondary-s3-bucket');
    });
  });

  describe('Multi-Region Configuration', () => {
    test('should configure resources in both primary and secondary regions', () => {
      const config = JSON.parse(synthesized);

      // Check resources have appropriate provider configurations
      expect(config.resource.aws_vpc['primary-vpc'].provider).toBe('aws.primary');
      expect(config.resource.aws_vpc['secondary-vpc'].provider).toBe('aws.secondary');
      expect(config.resource.aws_s3_bucket['primary-bucket'].provider).toBe('aws.primary');
      expect(config.resource.aws_s3_bucket['secondary-bucket'].provider).toBe('aws.secondary');
    });

    test('should have region-specific resource naming', () => {
      const config = JSON.parse(synthesized);

      expect(config.resource.aws_vpc['primary-vpc'].tags.Name).toContain('primary');
      expect(config.resource.aws_vpc['secondary-vpc'].tags.Name).toContain('secondary');
    });

    test('should configure cross-region replication', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_s3_bucket_replication_configuration).toHaveProperty('primary-bucket-replication');

      const replication = config.resource.aws_s3_bucket_replication_configuration['primary-bucket-replication'];
      expect(replication.rule[0].destination.bucket).toContain('aws_s3_bucket.secondary-bucket.arn');
    });
  });

  describe('Security Configuration', () => {
    test('should configure HTTP protocol on load balancers', () => {
      const config = JSON.parse(synthesized);
      const listener = config.resource.aws_lb_listener['primary-alb-listener'];
      expect(listener.protocol).toBe('HTTP');
      expect(listener.port).toBe(80);
    });

    test('should use KMS encryption for S3', () => {
      const config = JSON.parse(synthesized);
      const encryption = config.resource.aws_s3_bucket_server_side_encryption_configuration['primary-bucket-encryption'];
      expect(encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe('aws:kms');
      expect(encryption.rule[0].apply_server_side_encryption_by_default.kms_master_key_id).toContain('aws_kms_key.primary-kms-key.arn');
    });

    test('should configure proper IAM permissions', () => {
      const config = JSON.parse(synthesized);
      const s3Policy = JSON.parse(config.resource.aws_iam_policy['s3-replication-policy'].policy);
      expect(s3Policy.Statement).toHaveLength(5);
      expect(s3Policy.Statement[0].Action).toContain('s3:GetObjectVersionForReplication');
      expect(s3Policy.Statement[4].Action).toContain('kms:GenerateDataKey');
    });

    test('should block public access on S3 buckets', () => {
      const config = JSON.parse(synthesized);
      const pab = config.resource.aws_s3_bucket_public_access_block['primary-bucket-pab'];
      expect(pab.block_public_acls).toBe(true);
      expect(pab.block_public_policy).toBe(true);
      expect(pab.ignore_public_acls).toBe(true);
      expect(pab.restrict_public_buckets).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    test('should handle different environment configurations', () => {
      const testApp = new App();
      const devStack = new FinancialProcessorStack(testApp, 'dev-financial-processor', {
        environment: 'development',
        appName: 'financial-processor',
        costCenter: 'DevOps',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-1',
        domainName: 'dev.finproc.internal',
      });
      const devSynthesized = Testing.synth(devStack);
      const devConfig = JSON.parse(devSynthesized);

      const primaryProvider = devConfig.provider.aws.find((p: any) => p.alias === 'primary');
      const secondaryProvider = devConfig.provider.aws.find((p: any) => p.alias === 'secondary');
      expect(primaryProvider.region).toBe('us-east-1');
      expect(secondaryProvider.region).toBe('us-west-1');
      expect(devStack).toBeDefined();
    });

    test('should handle different region configurations', () => {
      const testApp = new App();
      const euStack = new FinancialProcessorStack(testApp, 'eu-financial-processor', {
        environment: 'production',
        appName: 'financial-processor',
        costCenter: 'FinOps',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'eu-central-1',
        domainName: 'eu.finproc.internal',
      });
      const euSynthesized = Testing.synth(euStack);
      const euConfig = JSON.parse(euSynthesized);

      const primaryProvider = euConfig.provider.aws.find((p: any) => p.alias === 'primary');
      const secondaryProvider = euConfig.provider.aws.find((p: any) => p.alias === 'secondary');
      expect(primaryProvider.region).toBe('eu-west-1');
      expect(secondaryProvider.region).toBe('eu-central-1');
      expect(euStack).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle stack instantiation with minimal configuration', () => {
      const testApp = new App();
      const minimalStack = new FinancialProcessorStack(testApp, 'minimal-financial-processor', {
        environment: 'test',
        appName: 'test-app',
        costCenter: 'Test',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        domainName: 'test.internal',
      });
      const minimalSynthesized = Testing.synth(minimalStack);

      expect(minimalStack).toBeDefined();
      expect(minimalSynthesized).toBeDefined();
      expect(typeof minimalSynthesized).toBe('string');
    });

    test('should generate unique resource names', () => {
      const config = JSON.parse(synthesized);
      const primaryBucket = config.resource.aws_s3_bucket['primary-bucket'].bucket;
      const secondaryBucket = config.resource.aws_s3_bucket['secondary-bucket'].bucket;

      expect(primaryBucket).toContain('financial-processor-primary');
      expect(secondaryBucket).toContain('financial-processor-secondary');
      expect(primaryBucket).not.toBe(secondaryBucket);
    });
  });
});

// add more test suites and cases as needed
