import { execSync } from 'child_process';
import * as fs from 'fs';

// Check for CDKTF outputs from successful deployment
const cdktfOutputsPath = 'cdktf.out/stacks/trading-platform/cdk.tf.json';
let outputs: Record<string, any> = {};
let hasDeployedInfrastructure = false;

// Function to ensure CDKTF synthesis is run
function ensureCdktfSynthesis() {
  if (!fs.existsSync(cdktfOutputsPath)) {
    console.log('CDKTF output file not found. Running synthesis...');
    try {
      execSync('npm run cdktf:synth', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to run CDKTF synthesis:', error);
      throw error;
    }
  }
}

try {
  ensureCdktfSynthesis();

  if (fs.existsSync(cdktfOutputsPath)) {
    const outputsContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
    const cdktfOutput = JSON.parse(outputsContent);
    outputs = cdktfOutput.output || {};
    hasDeployedInfrastructure = Object.keys(outputs).length > 0;
  }
} catch (error) {
  console.warn('Could not read CDKTF deployment outputs:', error);
}

describe('Trading Platform Integration Tests', () => {
  describe('Infrastructure Deployment Validation', () => {
    test('should have CDKTF synthesis outputs available', () => {
      expect(fs.existsSync(cdktfOutputsPath)).toBe(true);

      if (hasDeployedInfrastructure) {
        expect(outputs).toBeDefined();
        expect(Object.keys(outputs).length).toBeGreaterThan(0);

        // Check for expected outputs
        expect(outputs.VpcId).toBeDefined();
        expect(outputs.S3BucketArn).toBeDefined();
        expect(outputs.DynamoTableArn).toBeDefined();
      } else {
        console.warn(
          'No deployed infrastructure found. Deploy stack first with: npm run cdktf:deploy'
        );
      }
    });

    test('should have valid Terraform configuration', () => {
      expect(fs.existsSync(cdktfOutputsPath)).toBe(true);

      const configContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
      const config = JSON.parse(configContent);

      // Validate provider configuration
      expect(config.provider).toBeDefined();
      expect(config.provider.aws).toBeDefined();
      expect(config.provider.aws[0].region).toBe('us-east-1');

      // Validate default tags
      expect(config.provider.aws[0].default_tags).toBeDefined();
      expect(config.provider.aws[0].default_tags[0].tags.Project).toBe(
        'TradingPlatform'
      );

      // Validate resources
      expect(config.resource).toBeDefined();
      expect(config.resource.aws_vpc).toBeDefined();
      expect(config.resource.aws_s3_bucket).toBeDefined();
      expect(config.resource.aws_dynamodb_table).toBeDefined();
      expect(config.resource.aws_kms_key).toBeDefined();
    });

    test('should have proper VPC configuration', () => {
      ensureCdktfSynthesis();

      const configContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
      const config = JSON.parse(configContent);

      const vpc = Object.values(config.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);

      // Check subnets
      const subnets = config.resource.aws_subnet;
      expect(Object.keys(subnets).length).toBe(2);

      // Check internet gateway
      expect(config.resource.aws_internet_gateway).toBeDefined();

      // Check route tables
      expect(config.resource.aws_route_table).toBeDefined();
      expect(config.resource.aws_route).toBeDefined();
      expect(config.resource.aws_route_table_association).toBeDefined();
    });

    test('should have proper DynamoDB configuration', () => {
      ensureCdktfSynthesis();

      const configContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
      const config = JSON.parse(configContent);

      const dynamoTable = Object.values(
        config.resource.aws_dynamodb_table
      )[0] as any;

      expect(dynamoTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(dynamoTable.hash_key).toBe('tradingId');
      expect(dynamoTable.range_key).toBe('timestamp');

      // Check encryption
      expect(dynamoTable.server_side_encryption).toBeDefined();
      expect(dynamoTable.server_side_encryption.enabled).toBe(true);

      // Check point-in-time recovery
      expect(dynamoTable.point_in_time_recovery).toBeDefined();
      expect(dynamoTable.point_in_time_recovery.enabled).toBe(true);

      // Check attributes
      expect(dynamoTable.attribute).toHaveLength(3);
      const attributeNames = dynamoTable.attribute.map(
        (attr: any) => attr.name
      );
      expect(attributeNames).toContain('tradingId');
      expect(attributeNames).toContain('timestamp');
      expect(attributeNames).toContain('userId');

      // Check GSI
      expect(dynamoTable.global_secondary_index).toBeDefined();
      expect(dynamoTable.global_secondary_index[0].name).toBe('UserIndex');
    });

    test('should have proper S3 bucket configuration', () => {
      ensureCdktfSynthesis();

      const configContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
      const config = JSON.parse(configContent);

      const s3Bucket = Object.values(config.resource.aws_s3_bucket)[0] as any;

      expect(s3Bucket.bucket).toMatch(/^trading-platform-data-pri-/);
      expect(s3Bucket.tags).toBeDefined();
      expect(s3Bucket.tags.Purpose).toBe('Trading data storage');
      expect(s3Bucket.tags.Environment).toBe('Production');
    });

    test('should have proper KMS key configuration', () => {
      ensureCdktfSynthesis();

      const configContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
      const config = JSON.parse(configContent);

      const kmsKeys = config.resource.aws_kms_key;
      expect(Object.keys(kmsKeys).length).toBe(2);

      Object.values(kmsKeys).forEach((key: any) => {
        expect(key.key_usage).toBe('ENCRYPT_DECRYPT');
        expect(key.customer_master_key_spec).toBe('SYMMETRIC_DEFAULT');
        expect(key.deletion_window_in_days).toBe(30);
      });

      // Check KMS aliases
      const kmsAliases = config.resource.aws_kms_alias;
      expect(Object.keys(kmsAliases).length).toBe(2);

      Object.values(kmsAliases).forEach((alias: any) => {
        expect(alias.name).toMatch(/^alias\/trading-platform-/);
      });
    });

    test('should have proper security group configuration', () => {
      ensureCdktfSynthesis();

      const configContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
      const config = JSON.parse(configContent);

      const securityGroup = Object.values(
        config.resource.aws_security_group
      )[0] as any;

      // Check ingress rules
      expect(securityGroup.ingress).toBeDefined();
      expect(securityGroup.ingress.length).toBe(2);

      const httpRule = securityGroup.ingress.find(
        (rule: any) => rule.from_port === 80
      );
      const httpsRule = securityGroup.ingress.find(
        (rule: any) => rule.from_port === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      // Check egress rules
      expect(securityGroup.egress).toBeDefined();
      expect(securityGroup.egress.length).toBe(1);
      expect(securityGroup.egress[0].from_port).toBe(0);
      expect(securityGroup.egress[0].to_port).toBe(0);
      expect(securityGroup.egress[0].protocol).toBe('-1');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should have consistent resource naming', () => {
      ensureCdktfSynthesis();

      const configContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
      const config = JSON.parse(configContent);

      // Check that all resources follow the naming convention
      const s3Bucket = Object.values(config.resource.aws_s3_bucket)[0] as any;
      const dynamoTable = Object.values(
        config.resource.aws_dynamodb_table
      )[0] as any;

      expect(s3Bucket.bucket).toMatch(/trading-platform-data-pri-\d+-\w+/);
      expect(dynamoTable.name).toMatch(/trading-platform-pri-\d+-\w+/);
    });

    test('should have proper resource tags', () => {
      ensureCdktfSynthesis();

      const configContent = fs.readFileSync(cdktfOutputsPath, 'utf8');
      const config = JSON.parse(configContent);

      // Check default tags at provider level
      const defaultTags = config.provider.aws[0].default_tags[0].tags;
      expect(defaultTags.Project).toBe('TradingPlatform');
      expect(defaultTags.Environment).toBe('Production');
      expect(defaultTags.ManagedBy).toBe('CDKTF');
      expect(defaultTags.Owner).toBe('FinanceOps');
      expect(defaultTags.CostCenter).toBe('FinanceOps');
      expect(defaultTags['DR-RTO']).toBe('15-minutes');
      expect(defaultTags['DR-RPO']).toBe('5-minutes');

      // Check individual resource tags
      const s3Bucket = Object.values(config.resource.aws_s3_bucket)[0] as any;
      expect(s3Bucket.tags.Purpose).toBe('Trading data storage');

      const dynamoTable = Object.values(
        config.resource.aws_dynamodb_table
      )[0] as any;
      expect(dynamoTable.tags.Purpose).toBe('Trading transactions storage');
    });
  });
});
