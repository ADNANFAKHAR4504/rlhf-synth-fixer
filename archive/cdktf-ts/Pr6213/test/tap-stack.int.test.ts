import * as fs from 'fs';
import * as path from 'path';

interface StackOutputs {
  's3-kms-key-id': string;
  'logs-kms-key-id': string;
  's3-bucket-name': string;
  's3-bucket-arn': string;
  'payment-role-arn': string;
  'cross-account-role-arn': string;
  'audit-log-group-name': string;
  'compliance-topic-arn': string;
  'security-scp-id'?: string;
}

describe('TAP Stack Integration Tests', () => {
  let outputs: StackOutputs;
  const region = 'ap-southeast-1';

  beforeAll(() => {
    console.log('\n========================================');
    console.log('TAP Stack Integration Tests - Starting');
    console.log('========================================\n');

    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    console.log(`Loading outputs from: ${outputsPath}`);

    const outputsData = fs.readFileSync(outputsPath, 'utf-8');
    const parsedData = JSON.parse(outputsData);
    
    const stackKey = Object.keys(parsedData)[0];
    outputs = parsedData[stackKey];

    console.log('\nDeployment Outputs Loaded:');
    console.log(JSON.stringify(outputs, null, 2));
    console.log(`\nAWS Region: ${region}\n`);
  });

  afterAll(() => {
    console.log('\n========================================');
    console.log('TAP Stack Integration Tests - Complete');
    console.log('========================================\n');
  });

  describe('Output Validation Tests', () => {
    test('Should load deployment outputs successfully', () => {
      console.log('\n--- Testing Output Loading ---');
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      console.log('PASS: Outputs loaded successfully');
    });

    test('Should have all required output keys', () => {
      console.log('\n--- Testing Output Keys ---');
      const requiredKeys = [
        's3-kms-key-id',
        'logs-kms-key-id',
        's3-bucket-name',
        's3-bucket-arn',
        'payment-role-arn',
        'cross-account-role-arn',
        'audit-log-group-name',
        'compliance-topic-arn',
      ];

      requiredKeys.forEach(key => {
        console.log(`  Checking: ${key} = ${outputs[key as keyof StackOutputs]}`);
        expect(outputs[key as keyof StackOutputs]).toBeDefined();
      });
      console.log('PASS: All required keys are present');
    });
  });

  describe('KMS Output Validation Tests', () => {
    test('S3 KMS key ID should be valid multi-region key format', () => {
      console.log('\n--- Testing S3 KMS Key Format ---');
      const keyId = outputs['s3-kms-key-id'];
      console.log(`S3 KMS Key ID: ${keyId}`);
      
      expect(keyId).toBeDefined();
      expect(keyId).toMatch(/^mrk-[a-f0-9]{32}$/);
      console.log('PASS: S3 KMS key ID format is valid');
    });

    test('Logs KMS key ID should be valid multi-region key format', () => {
      console.log('\n--- Testing Logs KMS Key Format ---');
      const keyId = outputs['logs-kms-key-id'];
      console.log(`Logs KMS Key ID: ${keyId}`);
      
      expect(keyId).toBeDefined();
      expect(keyId).toMatch(/^mrk-[a-f0-9]{32}$/);
      console.log('PASS: Logs KMS key ID format is valid');
    });

    test('KMS keys should be different for S3 and Logs', () => {
      console.log('\n--- Testing KMS Key Separation ---');
      const s3KeyId = outputs['s3-kms-key-id'];
      const logsKeyId = outputs['logs-kms-key-id'];
      
      console.log(`S3 Key: ${s3KeyId}`);
      console.log(`Logs Key: ${logsKeyId}`);
      console.log(`Different: ${s3KeyId !== logsKeyId}`);
      
      expect(s3KeyId).not.toBe(logsKeyId);
      console.log('PASS: Separate KMS keys for different purposes');
    });
  });

  describe('S3 Output Validation Tests', () => {
    test('S3 bucket name should follow naming convention', () => {
      console.log('\n--- Testing S3 Bucket Name ---');
      const bucketName = outputs['s3-bucket-name'];
      console.log(`Bucket Name: ${bucketName}`);
      
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('payment-data-bucket');
      expect(bucketName).toMatch(/^payment-data-bucket-pr\d+$/);
      console.log('PASS: S3 bucket name follows naming convention');
    });

    test('S3 bucket ARN should be valid format', () => {
      console.log('\n--- Testing S3 Bucket ARN ---');
      const bucketArn = outputs['s3-bucket-arn'];
      const bucketName = outputs['s3-bucket-name'];
      console.log(`Bucket ARN: ${bucketArn}`);
      
      expect(bucketArn).toBeDefined();
      expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);
      expect(bucketArn).toMatch(/^arn:aws:s3:::payment-data-bucket-pr\d+$/);
      console.log('PASS: S3 bucket ARN format is valid');
    });

    test('S3 bucket name and ARN should match', () => {
      console.log('\n--- Testing S3 Name-ARN Consistency ---');
      const bucketArn = outputs['s3-bucket-arn'];
      const bucketName = outputs['s3-bucket-name'];
      
      console.log(`Bucket Name: ${bucketName}`);
      console.log(`Bucket ARN: ${bucketArn}`);
      
      expect(bucketArn).toContain(bucketName);
      console.log('PASS: Bucket name and ARN are consistent');
    });
  });

  describe('IAM Output Validation Tests', () => {
    test('Payment role ARN should be valid format', () => {
      console.log('\n--- Testing Payment Role ARN ---');
      const roleArn = outputs['payment-role-arn'];
      console.log(`Role ARN: ${roleArn}`);
      
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('payment-processing-role');
      expect(roleArn).toMatch(/^arn:aws:iam::\d{12}:role\/payment-processing-role-pr\d+$/);
      console.log('PASS: Payment role ARN format is valid');
    });

    test('Cross-account role ARN should be valid format', () => {
      console.log('\n--- Testing Cross-Account Role ARN ---');
      const roleArn = outputs['cross-account-role-arn'];
      console.log(`Role ARN: ${roleArn}`);
      
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('cross-account-access-role');
      expect(roleArn).toMatch(/^arn:aws:iam::\d{12}:role\/cross-account-access-role-pr\d+$/);
      console.log('PASS: Cross-account role ARN format is valid');
    });

    test('Both IAM roles should be in the same account', () => {
      console.log('\n--- Testing IAM Account Consistency ---');
      const paymentRoleArn = outputs['payment-role-arn'];
      const crossAccountRoleArn = outputs['cross-account-role-arn'];
      
      const paymentAccountId = paymentRoleArn.split(':')[4];
      const crossAccountId = crossAccountRoleArn.split(':')[4];
      
      console.log(`Payment Role Account: ${paymentAccountId}`);
      console.log(`Cross-Account Role Account: ${crossAccountId}`);
      
      expect(paymentAccountId).toBe(crossAccountId);
      console.log('PASS: Both roles are in the same AWS account');
    });

    test('IAM role names should be extractable from ARNs', () => {
      console.log('\n--- Testing IAM Role Name Extraction ---');
      const paymentRoleArn = outputs['payment-role-arn'];
      const crossAccountRoleArn = outputs['cross-account-role-arn'];
      
      const paymentRoleName = paymentRoleArn.split('/').pop();
      const crossAccountRoleName = crossAccountRoleArn.split('/').pop();
      
      console.log(`Payment Role Name: ${paymentRoleName}`);
      console.log(`Cross-Account Role Name: ${crossAccountRoleName}`);
      
      expect(paymentRoleName).toContain('payment-processing-role');
      expect(crossAccountRoleName).toContain('cross-account-access-role');
      console.log('PASS: Role names can be extracted from ARNs');
    });
  });

  describe('Monitoring Output Validation Tests', () => {
    test('Audit log group name should follow naming convention', () => {
      console.log('\n--- Testing Audit Log Group Name ---');
      const logGroupName = outputs['audit-log-group-name'];
      console.log(`Log Group Name: ${logGroupName}`);
      
      expect(logGroupName).toBeDefined();
      expect(logGroupName).toContain('/aws/payment-processing/audit');
      expect(logGroupName).toMatch(/^\/aws\/payment-processing\/audit-pr\d+$/);
      console.log('PASS: Log group name follows naming convention');
    });

    test('Compliance topic ARN should be valid format', () => {
      console.log('\n--- Testing Compliance Topic ARN ---');
      const topicArn = outputs['compliance-topic-arn'];
      console.log(`Topic ARN: ${topicArn}`);
      
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('compliance-alerts');
      expect(topicArn).toMatch(/^arn:aws:sns:ap-southeast-1:\d{12}:compliance-alerts-pr\d+$/);
      console.log('PASS: Compliance topic ARN format is valid');
    });

    test('SNS topic should be in the correct region', () => {
      console.log('\n--- Testing SNS Topic Region ---');
      const topicArn = outputs['compliance-topic-arn'];
      const topicRegion = topicArn.split(':')[3];
      
      console.log(`Topic Region: ${topicRegion}`);
      console.log(`Expected Region: ${region}`);
      
      expect(topicRegion).toBe(region);
      console.log('PASS: SNS topic is in the correct region');
    });
  });

  describe('Resource Naming Consistency Tests', () => {
    test('All resources should use the same environment suffix', () => {
      console.log('\n--- Testing Environment Suffix Consistency ---');
      
      const bucketName = outputs['s3-bucket-name'];
      const paymentRole = outputs['payment-role-arn'];
      const logGroup = outputs['audit-log-group-name'];
      const topicArn = outputs['compliance-topic-arn'];
      
      const suffixMatch = bucketName.match(/-pr\d+$/);
      expect(suffixMatch).not.toBeNull();
      const suffix = suffixMatch![0];
      
      console.log(`Environment Suffix: ${suffix}`);
      console.log(`Bucket: ${bucketName.includes(suffix)}`);
      console.log(`Payment Role: ${paymentRole.includes(suffix)}`);
      console.log(`Log Group: ${logGroup.includes(suffix)}`);
      console.log(`Topic: ${topicArn.includes(suffix)}`);
      
      expect(paymentRole).toContain(suffix);
      expect(logGroup).toContain(suffix);
      expect(topicArn).toContain(suffix);
      console.log('PASS: All resources use consistent environment suffix');
    });

    test('All AWS resources should be in the same account', () => {
      console.log('\n--- Testing AWS Account Consistency ---');
      
      const paymentRoleArn = outputs['payment-role-arn'];
      const crossAccountRoleArn = outputs['cross-account-role-arn'];
      const topicArn = outputs['compliance-topic-arn'];
      
      const paymentAccountId = paymentRoleArn.split(':')[4];
      const crossAccountId = crossAccountRoleArn.split(':')[4];
      const topicAccountId = topicArn.split(':')[4];
      
      console.log(`Account ID: ${paymentAccountId}`);
      
      expect(crossAccountId).toBe(paymentAccountId);
      expect(topicAccountId).toBe(paymentAccountId);
      console.log('PASS: All resources are in the same AWS account');
    });
  });

  describe('Security Configuration Validation Tests', () => {
    test('Should have separate KMS keys for different encryption purposes', () => {
      console.log('\n--- Testing KMS Key Separation Strategy ---');
      const s3KeyId = outputs['s3-kms-key-id'];
      const logsKeyId = outputs['logs-kms-key-id'];
      
      console.log(`S3 Encryption Key: ${s3KeyId}`);
      console.log(`Logs Encryption Key: ${logsKeyId}`);
      console.log(`Keys are different: ${s3KeyId !== logsKeyId}`);
      
      expect(s3KeyId).not.toBe(logsKeyId);
      expect(s3KeyId).toMatch(/^mrk-/);
      expect(logsKeyId).toMatch(/^mrk-/);
      console.log('PASS: Proper key separation for encryption purposes');
    });

    test('Should have security SCP configured if available', () => {
      console.log('\n--- Testing Security SCP ---');
      const scpId = outputs['security-scp-id'];
      
      if (scpId) {
        console.log(`SCP ID: ${scpId}`);
        expect(scpId).toMatch(/^p-[a-z0-9]+$/);
        console.log('PASS: Security SCP is configured');
      } else {
        console.log('SKIP: SCP ID not present (optional)');
      }
    });
  });

  describe('ARN Format Validation Tests', () => {
    test('All ARNs should have valid AWS ARN format', () => {
      console.log('\n--- Testing ARN Format Validity ---');
      
      const arns = {
        's3-bucket': outputs['s3-bucket-arn'],
        'payment-role': outputs['payment-role-arn'],
        'cross-account-role': outputs['cross-account-role-arn'],
        'compliance-topic': outputs['compliance-topic-arn'],
      };
      
      Object.entries(arns).forEach(([name, arn]) => {
        console.log(`  ${name}: ${arn}`);
        expect(arn).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d*:.+$/);
      });
      
      console.log('PASS: All ARNs have valid AWS ARN format');
    });

    test('ARNs should contain correct AWS service identifiers', () => {
      console.log('\n--- Testing ARN Service Identifiers ---');
      
      const s3Arn = outputs['s3-bucket-arn'];
      const iamArn = outputs['payment-role-arn'];
      const snsArn = outputs['compliance-topic-arn'];
      
      console.log(`S3 ARN service: ${s3Arn.split(':')[2]}`);
      console.log(`IAM ARN service: ${iamArn.split(':')[2]}`);
      console.log(`SNS ARN service: ${snsArn.split(':')[2]}`);
      
      expect(s3Arn.split(':')[2]).toBe('s3');
      expect(iamArn.split(':')[2]).toBe('iam');
      expect(snsArn.split(':')[2]).toBe('sns');
      console.log('PASS: ARNs have correct service identifiers');
    });
  });

  describe('Deployment Output Summary', () => {
    test('Should generate deployment summary report', () => {
      console.log('\n--- Deployment Summary Report ---');
      console.log('\nS3 Resources:');
      console.log(`   Bucket: ${outputs['s3-bucket-name']}`);
      console.log(`   ARN: ${outputs['s3-bucket-arn']}`);
      console.log(`   KMS Key: ${outputs['s3-kms-key-id']}`);
      
      console.log('\nIAM Resources:');
      console.log(`   Payment Role: ${outputs['payment-role-arn'].split('/').pop()}`);
      console.log(`   Cross-Account Role: ${outputs['cross-account-role-arn'].split('/').pop()}`);
      
      console.log('\nMonitoring Resources:');
      console.log(`   Log Group: ${outputs['audit-log-group-name']}`);
      console.log(`   SNS Topic: ${outputs['compliance-topic-arn'].split(':').pop()}`);
      console.log(`   Logs KMS Key: ${outputs['logs-kms-key-id']}`);
      
      console.log('\nEncryption:');
      console.log(`   S3 KMS Key: ${outputs['s3-kms-key-id']}`);
      console.log(`   Logs KMS Key: ${outputs['logs-kms-key-id']}`);
      console.log(`   Keys are separate: ${outputs['s3-kms-key-id'] !== outputs['logs-kms-key-id']}`);
      
      if (outputs['security-scp-id']) {
        console.log('\nSecurity:');
        console.log(`   SCP ID: ${outputs['security-scp-id']}`);
      }
      
      console.log('\nPASS: Deployment summary generated successfully');
      expect(true).toBe(true);
    });
  });
});
