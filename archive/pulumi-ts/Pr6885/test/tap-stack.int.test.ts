/**
 * Integration Tests for TapStack Infrastructure
 *
 * These tests validate that the deployed infrastructure is working correctly
 * using real AWS resources and outputs from the deployment.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Deployment Outputs Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load the deployment outputs
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
    } else {
      throw new Error(
        'Deployment outputs not found. Please deploy the infrastructure first.'
      );
    }
  });

  it('validates VPC ID is present', () => {
    expect(outputs.vpcId).toBeDefined();
    expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
  });

  it('validates subnet IDs are present', () => {
    expect(outputs.subnetIds).toBeDefined();
    // Parse subnet IDs if they're stored as a JSON string in flat outputs
    const subnetIds = typeof outputs.subnetIds === 'string'
      ? JSON.parse(outputs.subnetIds)
      : outputs.subnetIds;
    expect(Array.isArray(subnetIds)).toBe(true);
    expect(subnetIds.length).toBeGreaterThanOrEqual(3);
    subnetIds.forEach((subnetId: string) => {
      expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
    });
  });

  it('validates database endpoint is present', () => {
    expect(outputs.databaseEndpoint).toBeDefined();
    expect(outputs.databaseEndpoint).toContain('.rds.amazonaws.com');
  });

  it('validates database ARN is present', () => {
    expect(outputs.databaseArn).toBeDefined();
    expect(outputs.databaseArn).toMatch(/^arn:aws:rds:/);
  });

  it('validates API Gateway endpoint is present', () => {
    expect(outputs.apiEndpoint).toBeDefined();
    expect(outputs.apiEndpoint).toMatch(/^https:\/\//);
    expect(outputs.apiEndpoint).toContain('.execute-api.');
    expect(outputs.apiEndpoint).toContain('.amazonaws.com');
  });

  it('validates DynamoDB transaction table name is present', () => {
    expect(outputs.transactionTableName).toBeDefined();
    expect(outputs.transactionTableName).toContain('payments-transactions');
  });

  it('validates DynamoDB transaction table ARN is present', () => {
    expect(outputs.transactionTableArn).toBeDefined();
    expect(outputs.transactionTableArn).toMatch(/^arn:aws:dynamodb:/);
  });

  it('validates S3 audit bucket name is present', () => {
    expect(outputs.auditBucketName).toBeDefined();
    expect(outputs.auditBucketName).toContain('payments');
    expect(outputs.auditBucketName).toContain('audit');
  });

  it('validates S3 audit bucket ARN is present', () => {
    expect(outputs.auditBucketArn).toBeDefined();
    expect(outputs.auditBucketArn).toMatch(/^arn:aws:s3:::/);
  });

  it('validates Lambda function ARN is present', () => {
    expect(outputs.lambdaFunctionArn).toBeDefined();
    expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
    expect(outputs.lambdaFunctionArn).toContain(':function:');
  });

  it('validates Lambda function name is present', () => {
    expect(outputs.lambdaFunctionName).toBeDefined();
    expect(outputs.lambdaFunctionName).toContain('payment-processor');
  });

  it('validates validation Lambda function ARN is present', () => {
    expect(outputs.validationFunctionArn).toBeDefined();
    expect(outputs.validationFunctionArn).toMatch(/^arn:aws:lambda:/);
    expect(outputs.validationFunctionArn).toContain(':function:');
  });

  it('validates validation Lambda function name is present', () => {
    expect(outputs.validationFunctionName).toBeDefined();
    expect(outputs.validationFunctionName).toContain('payment-validation');
  });

  it('validates all resource names contain environment suffix', () => {
    // Extract suffix from one of the resource names (e.g., pr6885)
    const tableNameParts = outputs.transactionTableName.split('-');
    const suffix = tableNameParts[tableNameParts.length - 1];
    expect(suffix).toBeDefined();
    expect(suffix.length).toBeGreaterThan(0);
    // Verify all resources contain the same suffix
    expect(outputs.transactionTableName).toContain(suffix);
    expect(outputs.auditBucketName).toContain(suffix);
    expect(outputs.lambdaFunctionName).toContain(suffix);
  });

  it('validates VPC ID format is correct', () => {
    expect(outputs.vpcId).toBeDefined();
    expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
  });

  it('validates resource naming follows conventions', () => {
    // Check table name follows pattern: payments-transactions-{env}-{suffix}
    expect(outputs.transactionTableName).toMatch(
      /^payments-transactions-dev-/
    );

    // Check bucket name follows pattern: payments-{env}-audit-{env}-{suffix}
    expect(outputs.auditBucketName).toMatch(/^payments-dev-audit-dev-/);

    // Check Lambda function name follows pattern: payment-processor-{env}-{suffix}
    expect(outputs.lambdaFunctionName).toMatch(/^payment-processor-dev-/);
  });

  it('validates database endpoint is in correct region', () => {
    expect(outputs.databaseEndpoint).toContain('us-east-1');
  });

  it('validates API endpoint is in correct region', () => {
    expect(outputs.apiEndpoint).toContain('us-east-1');
  });

  it('validates Lambda function ARN is in correct region', () => {
    expect(outputs.lambdaFunctionArn).toContain('us-east-1');
  });

  it('validates all ARNs follow AWS ARN format', () => {
    const arnPattern = /^arn:aws:[a-z]+:[a-z]+-[a-z]+-\d+:\d+:/;
    expect(outputs.databaseArn).toMatch(arnPattern);
    expect(outputs.transactionTableArn).toMatch(arnPattern);
    expect(outputs.lambdaFunctionArn).toMatch(arnPattern);
  });

  it('validates database cluster identifier format', () => {
    // Database endpoint should start with cluster identifier
    const endpoint = outputs.databaseEndpoint;
    const clusterId = endpoint.split('.')[0];
    expect(clusterId).toBeDefined();
    expect(clusterId.length).toBeGreaterThan(0);
  });

  it('validates API Gateway deployment stage', () => {
    expect(outputs.apiEndpoint).toContain('/dev');
  });

  it('validates consistency between resource names', () => {
    // Extract suffix from one of the resource names
    const tableNameParts = outputs.transactionTableName.split('-');
    const suffix = tableNameParts[tableNameParts.length - 1];
    const environment = 'dev';

    // All resources should have the same suffix
    expect(outputs.transactionTableName).toContain(suffix);
    expect(outputs.auditBucketName).toContain(suffix);
    expect(outputs.lambdaFunctionName).toContain(suffix);

    // All resources should have the same environment
    expect(outputs.transactionTableName).toContain(environment);
    expect(outputs.auditBucketName).toContain(environment);
    expect(outputs.lambdaFunctionName).toContain(environment);
  });

  it('validates minimum number of subnets for multi-AZ', () => {
    // Parse subnet IDs if they're stored as a JSON string in flat outputs
    const subnetIds = typeof outputs.subnetIds === 'string'
      ? JSON.parse(outputs.subnetIds)
      : outputs.subnetIds;
    expect(subnetIds.length).toBeGreaterThanOrEqual(2);
  });

  it('validates output completeness', () => {
    const requiredOutputs = [
      'vpcId',
      'subnetIds',
      'databaseEndpoint',
      'databaseArn',
      'apiEndpoint',
      'transactionTableName',
      'transactionTableArn',
      'auditBucketName',
      'auditBucketArn',
      'lambdaFunctionArn',
      'lambdaFunctionName',
      'validationFunctionArn',
      'validationFunctionName',
    ];

    requiredOutputs.forEach(output => {
      expect(outputs[output]).toBeDefined();
      expect(outputs[output]).not.toBeNull();
    });
  });
});
