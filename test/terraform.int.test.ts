// Integration tests for Terraform feature flag infrastructure
// These tests verify deployed infrastructure (when available)

import { execSync } from 'child_process';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to check if Terraform state exists
function hasDeployedInfrastructure(): boolean {
  try {
    const stateFiles = execSync('find . -name "terraform.tfstate" -o -name "*.tfstate"', {
      cwd: LIB_DIR,
      encoding: 'utf8'
    });
    return stateFiles.trim().length > 0;
  } catch {
    return false;
  }
}

// Helper to skip tests if infrastructure not deployed
function skipIfNotDeployed() {
  if (!hasDeployedInfrastructure()) {
    console.warn('⚠️  Infrastructure not deployed - skipping integration tests');
    return true;
  }
  return false;
}

// Helper to get Terraform output
function getTerraformOutput(outputName: string): string | null {
  if (skipIfNotDeployed()) return null;
  
  try {
    const result = execSync(`terraform output -raw ${outputName}`, {
      cwd: LIB_DIR,
      encoding: 'utf8'
    });
    return result.trim();
  } catch (error) {
    console.error(`Failed to get output ${outputName}:`, error);
    return null;
  }
}

describe('Terraform Infrastructure - Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should be deployed', () => {
      if (skipIfNotDeployed()) return;
      
      const vpcId = getTerraformOutput('vpc_id');
      expect(vpcId).toBeTruthy();
      expect(vpcId).toMatch(/^vpc-/);
    });
  });

  describe('DynamoDB Global Table', () => {
    test('DynamoDB table should exist', () => {
      if (skipIfNotDeployed()) return;
      
      const tableName = getTerraformOutput('dynamodb_table_name');
      expect(tableName).toBeTruthy();
      expect(tableName).toMatch(/feature-flags/);
    });

    test('DynamoDB table ARN should be valid', () => {
      if (skipIfNotDeployed()) return;
      
      const tableArn = getTerraformOutput('dynamodb_table_arn');
      expect(tableArn).toBeTruthy();
      expect(tableArn).toMatch(/^arn:aws:dynamodb:/);
    });
  });

  describe('SNS and SQS', () => {
    test('SNS topic should be deployed', () => {
      if (skipIfNotDeployed()) return;
      
      const topicArn = getTerraformOutput('sns_topic_arn');
      expect(topicArn).toBeTruthy();
      expect(topicArn).toMatch(/^arn:aws:sns:/);
    });

    test('SQS queues should be deployed', () => {
      if (skipIfNotDeployed()) return;
      
      const queueUrls = getTerraformOutput('sqs_queue_urls');
      expect(queueUrls).toBeTruthy();
    });
  });

  describe('ElastiCache Redis', () => {
    test('Redis endpoint should be available', () => {
      if (skipIfNotDeployed()) return;
      
      const redisEndpoint = getTerraformOutput('redis_endpoint');
      expect(redisEndpoint).toBeTruthy();
      expect(redisEndpoint).toMatch(/\.cache\.amazonaws\.com/);
    });
  });

  describe('OpenSearch', () => {
    test('OpenSearch endpoint should be available', () => {
      if (skipIfNotDeployed()) return;
      
      const opensearchEndpoint = getTerraformOutput('opensearch_endpoint');
      expect(opensearchEndpoint).toBeTruthy();
      expect(opensearchEndpoint).toMatch(/\.es\.amazonaws\.com/);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should be created', () => {
      if (skipIfNotDeployed()) return;
      
      const kmsKeyId = getTerraformOutput('kms_key_id');
      expect(kmsKeyId).toBeTruthy();
      expect(kmsKeyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('KMS key ARN should be valid', () => {
      if (skipIfNotDeployed()) return;
      
      const kmsKeyArn = getTerraformOutput('kms_key_arn');
      expect(kmsKeyArn).toBeTruthy();
      expect(kmsKeyArn).toMatch(/^arn:aws:kms:/);
    });
  });
});
