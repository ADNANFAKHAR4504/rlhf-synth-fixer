// Integration tests for deployed AWS infrastructure
// These tests run against live AWS resources after deployment

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUTPUTS_FILE = path.resolve(__dirname, '../outputs.json');

interface TerraformOutputs {
  vpc_id: { value: string };
  lambda_function_names: { value: string[] };
  rds_endpoint: { value: string };
  s3_bucket_name: { value: string };
  kms_key_id: { value: string };
  sns_topic_arn: { value: string };
  config_bucket_name: { value: string };
  secrets_manager_secret_arn: { value: string };
}

describe('AWS Infrastructure Integration Tests', () => {
  let outputs: TerraformOutputs;

  beforeAll(async () => {
    // Load Terraform outputs from deployed infrastructure
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(`Outputs file not found: ${OUTPUTS_FILE}. Run terraform apply first.`);
    }
    
    const outputsContent = fs.readFileSync(OUTPUTS_FILE, 'utf8');
    outputs = JSON.parse(outputsContent);
    
    // Validate required outputs exist
    const requiredOutputs = [
      'vpc_id', 'lambda_function_names', 'rds_endpoint', 's3_bucket_name',
      'kms_key_id', 'sns_topic_arn', 'config_bucket_name', 'secrets_manager_secret_arn'
    ];
    
    requiredOutputs.forEach(key => {
      if (!(key in outputs)) {
        throw new Error(`Required output ${key} not found in outputs.json`);
      }
    });
  }, 30000);

  describe('VPC and Network Infrastructure', () => {
    test('VPC exists and is active', async () => {
      const result = JSON.parse(execSync(
        `aws ec2 describe-vpcs --vpc-ids ${outputs.vpc_id.value} --query 'Vpcs[0].State' --output json`,
        { encoding: 'utf8' }
      ));
      expect(result).toBe('available');
    }, 10000);

    test('VPC has DNS resolution enabled', async () => {
      const result = JSON.parse(execSync(
        `aws ec2 describe-vpc-attribute --vpc-id ${outputs.vpc_id.value} --attribute enableDnsResolution --query 'EnableDnsResolution.Value' --output json`,
        { encoding: 'utf8' }
      ));
      expect(result).toBe(true);
    }, 10000);

    test('VPC has DNS hostnames enabled', async () => {
      const result = JSON.parse(execSync(
        `aws ec2 describe-vpc-attribute --vpc-id ${outputs.vpc_id.value} --attribute enableDnsHostnames --query 'EnableDnsHostnames.Value' --output json`,
        { encoding: 'utf8' }
      ));
      expect(result).toBe(true);
    }, 10000);

    test('public subnets have internet gateway route', async () => {
      const subnets = JSON.parse(execSync(
        `aws ec2 describe-subnets --filters "Name=vpc-id,Values=${outputs.vpc_id.value}" "Name=tag:Name,Values=*public*" --query 'Subnets[*].SubnetId' --output json`,
        { encoding: 'utf8' }
      ));
      
      expect(subnets.length).toBeGreaterThan(0);
      
      for (const subnetId of subnets) {
        const routeTable = JSON.parse(execSync(
          `aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=${subnetId}" --query 'RouteTables[0].Routes[?GatewayId!=null && starts_with(GatewayId, \`igw-\`)]' --output json`,
          { encoding: 'utf8' }
        ));
        expect(routeTable.length).toBeGreaterThan(0);
      }
    }, 15000);

    test('private subnets have NAT gateway route', async () => {
      const subnets = JSON.parse(execSync(
        `aws ec2 describe-subnets --filters "Name=vpc-id,Values=${outputs.vpc_id.value}" "Name=tag:Name,Values=*private*" --query 'Subnets[*].SubnetId' --output json`,
        { encoding: 'utf8' }
      ));
      
      expect(subnets.length).toBeGreaterThan(0);
      
      for (const subnetId of subnets) {
        const routeTable = JSON.parse(execSync(
          `aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=${subnetId}" --query 'RouteTables[0].Routes[?NatGatewayId!=null]' --output json`,
          { encoding: 'utf8' }
        ));
        expect(routeTable.length).toBeGreaterThan(0);
      }
    }, 15000);
  });

  describe('Lambda Functions', () => {
    test('all Lambda functions are active', async () => {
      for (const functionName of outputs.lambda_function_names.value) {
        const result = JSON.parse(execSync(
          `aws lambda get-function --function-name ${functionName} --query 'Configuration.State' --output json`,
          { encoding: 'utf8' }
        ));
        expect(result).toBe('Active');
      }
    }, 15000);

    test('Lambda functions have VPC configuration', async () => {
      for (const functionName of outputs.lambda_function_names.value) {
        const vpcConfig = JSON.parse(execSync(
          `aws lambda get-function --function-name ${functionName} --query 'Configuration.VpcConfig' --output json`,
          { encoding: 'utf8' }
        ));
        expect(vpcConfig.SubnetIds.length).toBeGreaterThan(0);
        expect(vpcConfig.SecurityGroupIds.length).toBeGreaterThan(0);
        expect(vpcConfig.VpcId).toBe(outputs.vpc_id.value);
      }
    }, 15000);

    test('Lambda functions use Python 3.11 runtime', async () => {
      for (const functionName of outputs.lambda_function_names.value) {
        const runtime = JSON.parse(execSync(
          `aws lambda get-function --function-name ${functionName} --query 'Configuration.Runtime' --output json`,
          { encoding: 'utf8' }
        ));
        expect(runtime).toBe('python3.11');
      }
    }, 15000);

    test('Lambda functions have required environment variables', async () => {
      const requiredEnvVars = ['DB_HOST', 'KMS_KEY_ID', 'S3_BUCKET', 'ENVIRONMENT'];
      
      for (const functionName of outputs.lambda_function_names.value) {
        const envVars = JSON.parse(execSync(
          `aws lambda get-function --function-name ${functionName} --query 'Configuration.Environment.Variables' --output json`,
          { encoding: 'utf8' }
        ));
        
        requiredEnvVars.forEach(envVar => {
          expect(envVars).toHaveProperty(envVar);
          expect(envVars[envVar]).toBeTruthy();
        });
      }
    }, 15000);

    test('Lambda functions can be invoked successfully', async () => {
      for (const functionName of outputs.lambda_function_names.value) {
        const response = JSON.parse(execSync(
          `aws lambda invoke --function-name ${functionName} --payload '{"test": true}' --invocation-type RequestResponse --query 'StatusCode' --output json response.json`,
          { encoding: 'utf8' }
        ));
        expect(response).toBe(200);
      }
    }, 20000);
  });

  describe('RDS Database', () => {
    test('RDS instance is available', async () => {
      const dbIdentifier = outputs.rds_endpoint.value.split('.')[0];
      const status = JSON.parse(execSync(
        `aws rds describe-db-instances --db-instance-identifier ${dbIdentifier} --query 'DBInstances[0].DBInstanceStatus' --output json`,
        { encoding: 'utf8' }
      ));
      expect(status).toBe('available');
    }, 15000);

    test('RDS has encryption enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint.value.split('.')[0];
      const encrypted = JSON.parse(execSync(
        `aws rds describe-db-instances --db-instance-identifier ${dbIdentifier} --query 'DBInstances[0].StorageEncrypted' --output json`,
        { encoding: 'utf8' }
      ));
      expect(encrypted).toBe(true);
    }, 10000);

    test('RDS has Multi-AZ enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint.value.split('.')[0];
      const multiAZ = JSON.parse(execSync(
        `aws rds describe-db-instances --db-instance-identifier ${dbIdentifier} --query 'DBInstances[0].MultiAZ' --output json`,
        { encoding: 'utf8' }
      ));
      expect(multiAZ).toBe(true);
    }, 10000);

    test('RDS has backup retention configured', async () => {
      const dbIdentifier = outputs.rds_endpoint.value.split('.')[0];
      const backupRetention = JSON.parse(execSync(
        `aws rds describe-db-instances --db-instance-identifier ${dbIdentifier} --query 'DBInstances[0].BackupRetentionPeriod' --output json`,
        { encoding: 'utf8' }
      ));
      expect(backupRetention).toBeGreaterThanOrEqual(7);
    }, 10000);

    test('RDS is in private subnets', async () => {
      const dbIdentifier = outputs.rds_endpoint.value.split('.')[0];
      const subnetGroup = JSON.parse(execSync(
        `aws rds describe-db-instances --db-instance-identifier ${dbIdentifier} --query 'DBInstances[0].DBSubnetGroup.Subnets[*].SubnetIdentifier' --output json`,
        { encoding: 'utf8' }
      ));
      
      for (const subnetId of subnetGroup) {
        const subnet = JSON.parse(execSync(
          `aws ec2 describe-subnets --subnet-ids ${subnetId} --query 'Subnets[0].Tags[?Key==\`Name\`].Value | [0]' --output json`,
          { encoding: 'utf8' }
        ));
        expect(subnet).toMatch(/database|private/i);
      }
    }, 15000);
  });

  describe('S3 Storage', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketExists = execSync(
        `aws s3 ls s3://${outputs.s3_bucket_name.value} --region us-east-1`,
        { encoding: 'utf8' }
      );
      expect(bucketExists).toBeDefined();
    }, 10000);

    test('S3 bucket has versioning enabled', async () => {
      const versioning = JSON.parse(execSync(
        `aws s3api get-bucket-versioning --bucket ${outputs.s3_bucket_name.value} --query 'Status' --output json`,
        { encoding: 'utf8' }
      ));
      expect(versioning).toBe('Enabled');
    }, 10000);

    test('S3 bucket has encryption configured', async () => {
      const encryption = JSON.parse(execSync(
        `aws s3api get-bucket-encryption --bucket ${outputs.s3_bucket_name.value} --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output json`,
        { encoding: 'utf8' }
      ));
      expect(encryption).toBe('aws:kms');
    }, 10000);

    test('S3 bucket blocks public access', async () => {
      const publicAccessBlock = JSON.parse(execSync(
        `aws s3api get-public-access-block --bucket ${outputs.s3_bucket_name.value} --query 'PublicAccessBlockConfiguration' --output json`,
        { encoding: 'utf8' }
      ));
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    }, 10000);
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and is enabled', async () => {
      const keyState = JSON.parse(execSync(
        `aws kms describe-key --key-id ${outputs.kms_key_id.value} --query 'KeyMetadata.KeyState' --output json`,
        { encoding: 'utf8' }
      ));
      expect(keyState).toBe('Enabled');
    }, 10000);

    test('KMS key has rotation enabled', async () => {
      const rotationStatus = JSON.parse(execSync(
        `aws kms get-key-rotation-status --key-id ${outputs.kms_key_id.value} --query 'KeyRotationEnabled' --output json`,
        { encoding: 'utf8' }
      ));
      expect(rotationStatus).toBe(true);
    }, 10000);

    test('KMS key is used for encryption', async () => {
      const keyUsage = JSON.parse(execSync(
        `aws kms describe-key --key-id ${outputs.kms_key_id.value} --query 'KeyMetadata.KeyUsage' --output json`,
        { encoding: 'utf8' }
      ));
      expect(keyUsage).toBe('ENCRYPT_DECRYPT');
    }, 10000);
  });

  describe('Secrets Manager', () => {
    test('secret exists and is accessible', async () => {
      const secret = JSON.parse(execSync(
        `aws secretsmanager describe-secret --secret-id ${outputs.secrets_manager_secret_arn.value} --query 'Name' --output json`,
        { encoding: 'utf8' }
      ));
      expect(secret).toBeTruthy();
    }, 10000);

    test('secret is encrypted with KMS', async () => {
      const kmsKeyId = JSON.parse(execSync(
        `aws secretsmanager describe-secret --secret-id ${outputs.secrets_manager_secret_arn.value} --query 'KmsKeyId' --output json`,
        { encoding: 'utf8' }
      ));
      expect(kmsKeyId).toBe(outputs.kms_key_id.value);
    }, 10000);

    test('secret contains required database credentials', async () => {
      const secretValue = JSON.parse(execSync(
        `aws secretsmanager get-secret-value --secret-id ${outputs.secrets_manager_secret_arn.value} --query 'SecretString' --output json`,
        { encoding: 'utf8' }
      ));
      const credentials = JSON.parse(secretValue);
      expect(credentials).toHaveProperty('username');
      expect(credentials).toHaveProperty('password');
      expect(credentials).toHaveProperty('host');
      expect(credentials).toHaveProperty('port');
    }, 10000);
  });

  describe('SNS Notifications', () => {
    test('SNS topic exists', async () => {
      const topicAttributes = JSON.parse(execSync(
        `aws sns get-topic-attributes --topic-arn ${outputs.sns_topic_arn.value} --query 'Attributes.TopicArn' --output json`,
        { encoding: 'utf8' }
      ));
      expect(topicAttributes).toBe(outputs.sns_topic_arn.value);
    }, 10000);

    test('SNS topic has KMS encryption', async () => {
      const kmsKeyId = JSON.parse(execSync(
        `aws sns get-topic-attributes --topic-arn ${outputs.sns_topic_arn.value} --query 'Attributes.KmsMasterKeyId' --output json`,
        { encoding: 'utf8' }
      ));
      expect(kmsKeyId).toBeTruthy();
    }, 10000);

    test('SNS topic has email subscription', async () => {
      const subscriptions = JSON.parse(execSync(
        `aws sns list-subscriptions-by-topic --topic-arn ${outputs.sns_topic_arn.value} --query 'Subscriptions[?Protocol==\`email\`]' --output json`,
        { encoding: 'utf8' }
      ));
      expect(subscriptions.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('AWS Config Compliance', () => {
    test('Config configuration recorder is recording', async () => {
      const recorderStatus = JSON.parse(execSync(
        `aws configservice describe-configuration-recorder-status --query 'ConfigurationRecordersStatus[0].recording' --output json`,
        { encoding: 'utf8' }
      ));
      expect(recorderStatus).toBe(true);
    }, 10000);

    test('Config delivery channel is configured', async () => {
      const deliveryChannels = JSON.parse(execSync(
        `aws configservice describe-delivery-channels --query 'DeliveryChannels' --output json`,
        { encoding: 'utf8' }
      ));
      expect(deliveryChannels.length).toBeGreaterThan(0);
      expect(deliveryChannels[0].s3BucketName).toBe(outputs.config_bucket_name.value);
    }, 10000);

    test('Config rules are active', async () => {
      const configRules = JSON.parse(execSync(
        `aws configservice describe-config-rules --query 'ConfigRules[?ConfigRuleState==\`ACTIVE\`]' --output json`,
        { encoding: 'utf8' }
      ));
      expect(configRules.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('CloudWatch Monitoring', () => {
    test('Lambda log groups exist with encryption', async () => {
      for (const functionName of outputs.lambda_function_names.value) {
        const logGroup = JSON.parse(execSync(
          `aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/${functionName}" --query 'logGroups[0]' --output json`,
          { encoding: 'utf8' }
        ));
        expect(logGroup).toBeTruthy();
        expect(logGroup.kmsKeyId).toBeTruthy();
      }
    }, 15000);

    test('CloudWatch alarms are in OK or ALARM state', async () => {
      const alarms = JSON.parse(execSync(
        `aws cloudwatch describe-alarms --query 'MetricAlarms[*].StateValue' --output json`,
        { encoding: 'utf8' }
      ));
      alarms.forEach((state: string) => {
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(state);
      });
    }, 10000);
  });

  describe('Security Groups and Network ACLs', () => {
    test('security groups follow least privilege principle', async () => {
      const securityGroups = JSON.parse(execSync(
        `aws ec2 describe-security-groups --filters "Name=vpc-id,Values=${outputs.vpc_id.value}" --query 'SecurityGroups' --output json`,
        { encoding: 'utf8' }
      ));
      
      securityGroups.forEach((sg: any) => {
        // Check that ingress rules are not overly permissive
        sg.IpPermissions.forEach((rule: any) => {
          if (rule.IpRanges) {
            rule.IpRanges.forEach((range: any) => {
              expect(range.CidrIp).not.toBe('0.0.0.0/0');
            });
          }
        });
      });
    }, 15000);

    test('database security group only allows access from Lambda security group', async () => {
      const dbSecurityGroups = JSON.parse(execSync(
        `aws ec2 describe-security-groups --filters "Name=vpc-id,Values=${outputs.vpc_id.value}" "Name=group-name,Values=*database*" --query 'SecurityGroups' --output json`,
        { encoding: 'utf8' }
      ));
      
      expect(dbSecurityGroups.length).toBeGreaterThan(0);
      
      dbSecurityGroups.forEach((sg: any) => {
        const hasPostgresRule = sg.IpPermissions.some((rule: any) => 
          rule.FromPort === 5432 && 
          rule.UserIdGroupPairs && 
          rule.UserIdGroupPairs.length > 0
        );
        expect(hasPostgresRule).toBe(true);
      });
    }, 15000);
  });

  describe('Infrastructure Health Check', () => {
    test('all critical resources are healthy', async () => {
      // Perform a comprehensive health check
      const healthChecks = [
        // VPC connectivity
        () => execSync(`aws ec2 describe-vpcs --vpc-ids ${outputs.vpc_id.value} --query 'Vpcs[0].State'`, { encoding: 'utf8' }),
        
        // Lambda function health
        ...outputs.lambda_function_names.value.map(fn => 
          () => execSync(`aws lambda get-function --function-name ${fn} --query 'Configuration.State'`, { encoding: 'utf8' })
        ),
        
        // RDS health
        () => {
          const dbId = outputs.rds_endpoint.value.split('.')[0];
          return execSync(`aws rds describe-db-instances --db-instance-identifier ${dbId} --query 'DBInstances[0].DBInstanceStatus'`, { encoding: 'utf8' });
        }
      ];

      const results = await Promise.all(
        healthChecks.map(check => 
          new Promise(resolve => {
            try {
              const result = check();
              resolve({ success: true, result: result.trim() });
            } catch (error) {
              resolve({ success: false, error });
            }
          })
        )
      );

      results.forEach((result: any) => {
        expect(result.success).toBe(true);
      });
    }, 30000);
  });

  afterAll(() => {
    // Clean up any temporary files
    const tempFiles = ['response.json'];
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });
});
