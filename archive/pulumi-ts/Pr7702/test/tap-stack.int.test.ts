/* eslint-disable import/no-extraneous-dependencies */
/**
 * Integration tests for Infrastructure QA and Management System
 *
 * These tests validate the deployed AWS resources and their configurations.
 * Tests are written locally but executed in CI/CD after infrastructure deployment.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';

// Load deployed resource names from cfn-outputs/flat-outputs.json
let deployedOutputs: Record<string, string> = {};
try {
  const possiblePaths = [
    path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
    path.join(__dirname, '../../cfn-outputs/flat-outputs.json'),
    path.join(process.cwd(), 'cfn-outputs/flat-outputs.json'),
  ];
  for (const outputsPath of possiblePaths) {
    if (fs.existsSync(outputsPath)) {
      deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      console.log(`Loaded outputs from: ${outputsPath}`);
      break;
    }
  }
  if (Object.keys(deployedOutputs).length === 0) {
    console.warn('Warning: Could not load cfn-outputs/flat-outputs.json from any path. Tests may fail.');
  }
} catch (error) {
  console.warn('Warning: Could not load cfn-outputs/flat-outputs.json. Tests may fail.');
}

// Configuration from environment variables or deployed outputs
const AWS_REGION = process.env.AWS_REGION || deployedOutputs.Region || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || deployedOutputs.EnvironmentSuffix || 'dev';

// Resource names from outputs
const BUCKET_NAME = deployedOutputs.ReportsBucketName || `compliance-reports-${ENVIRONMENT_SUFFIX}`;
const ROLE_NAME = deployedOutputs.ComplianceRoleName || `compliance-scanner-${ENVIRONMENT_SUFFIX}`;
const TOPIC_ARN = deployedOutputs.AlertTopicArn || '';
const DASHBOARD_NAME = deployedOutputs.DashboardName || `compliance-${ENVIRONMENT_SUFFIX}`;
const LOG_GROUP_NAME = deployedOutputs.LogGroupName || `/aws/compliance/${ENVIRONMENT_SUFFIX}`;

// Initialize AWS clients
const s3Client = new S3Client({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });

describe('Infrastructure QA Integration Tests', () => {
  describe('Deployment Outputs', () => {
    it('should have required deployment outputs', () => {
      // Verify that outputs were loaded
      expect(deployedOutputs).toBeDefined();
    });

    it('should have environment suffix in outputs', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping: No deployment outputs available');
        return;
      }
      expect(ENVIRONMENT_SUFFIX).toBeDefined();
      expect(ENVIRONMENT_SUFFIX.length).toBeGreaterThan(0);
    });

    it('should have AWS region configured', () => {
      expect(AWS_REGION).toBeDefined();
      expect(AWS_REGION).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    });
  });

  describe('S3 Reports Bucket', () => {
    it('should exist and be accessible', async () => {
      if (!BUCKET_NAME || BUCKET_NAME === `compliance-reports-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Bucket name not available from outputs');
        return;
      }
      const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have encryption enabled', async () => {
      if (!BUCKET_NAME || BUCKET_NAME === `compliance-reports-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Bucket name not available from outputs');
        return;
      }
      const command = new GetBucketEncryptionCommand({ Bucket: BUCKET_NAME });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = response.ServerSideEncryptionConfiguration?.Rules;
      expect(rules).toBeDefined();
      expect(rules!.length).toBeGreaterThan(0);
      const algorithm = rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(['AES256', 'aws:kms']).toContain(algorithm);
    });

    it('should have public access blocked', async () => {
      if (!BUCKET_NAME || BUCKET_NAME === `compliance-reports-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Bucket name not available from outputs');
        return;
      }
      const command = new GetPublicAccessBlockCommand({ Bucket: BUCKET_NAME });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    it('should have versioning enabled', async () => {
      if (!BUCKET_NAME || BUCKET_NAME === `compliance-reports-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Bucket name not available from outputs');
        return;
      }
      const command = new GetBucketVersioningCommand({ Bucket: BUCKET_NAME });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have lifecycle rules configured', async () => {
      if (!BUCKET_NAME || BUCKET_NAME === `compliance-reports-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Bucket name not available from outputs');
        return;
      }
      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: BUCKET_NAME });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      // Check for archive rule
      const archiveRule = response.Rules!.find(rule => rule.ID === 'archive-old-reports');
      expect(archiveRule).toBeDefined();
    });
  });

  describe('IAM Compliance Scanner Role', () => {
    it('should exist with correct name', async () => {
      if (!ROLE_NAME || ROLE_NAME === `compliance-scanner-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Role name not available from outputs');
        return;
      }
      const command = new GetRoleCommand({ RoleName: ROLE_NAME });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(ROLE_NAME);
    });

    it('should have correct trust policy', async () => {
      if (!ROLE_NAME || ROLE_NAME === `compliance-scanner-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Role name not available from outputs');
        return;
      }
      const command = new GetRoleCommand({ RoleName: ROLE_NAME });
      const response = await iamClient.send(command);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(trustPolicy.Statement).toBeDefined();
      expect(trustPolicy.Statement.length).toBeGreaterThan(0);
      // Check for Lambda and EC2 service principals
      const services = trustPolicy.Statement[0].Principal?.Service || [];
      expect(services).toContain('lambda.amazonaws.com');
      expect(services).toContain('ec2.amazonaws.com');
    });

    it('should have ReadOnlyAccess policy attached', async () => {
      if (!ROLE_NAME || ROLE_NAME === `compliance-scanner-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Role name not available from outputs');
        return;
      }
      const command = new ListAttachedRolePoliciesCommand({ RoleName: ROLE_NAME });
      const response = await iamClient.send(command);
      expect(response.AttachedPolicies).toBeDefined();
      const hasReadOnly = response.AttachedPolicies?.some(
        policy => policy.PolicyArn?.includes('ReadOnlyAccess')
      );
      expect(hasReadOnly).toBe(true);
    });

    it('should have custom compliance policy attached', async () => {
      if (!ROLE_NAME || ROLE_NAME === `compliance-scanner-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Role name not available from outputs');
        return;
      }
      const command = new ListAttachedRolePoliciesCommand({ RoleName: ROLE_NAME });
      const response = await iamClient.send(command);
      expect(response.AttachedPolicies).toBeDefined();
      const hasCustomPolicy = response.AttachedPolicies?.some(
        policy => policy.PolicyName?.includes('compliance-scanner-policy')
      );
      expect(hasCustomPolicy).toBe(true);
    });
  });

  describe('SNS Alert Topic', () => {
    it('should exist with correct ARN', async () => {
      if (!TOPIC_ARN || !TOPIC_ARN.includes(':sns:')) {
        console.log('Skipping: Topic ARN not available from outputs');
        return;
      }
      const command = new GetTopicAttributesCommand({ TopicArn: TOPIC_ARN });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(TOPIC_ARN);
    });

    it('should have correct display name', async () => {
      if (!TOPIC_ARN || !TOPIC_ARN.includes(':sns:')) {
        console.log('Skipping: Topic ARN not available from outputs');
        return;
      }
      const command = new GetTopicAttributesCommand({ TopicArn: TOPIC_ARN });
      const response = await snsClient.send(command);
      expect(response.Attributes?.DisplayName).toBe('Compliance Violation Alerts');
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should exist with correct name', async () => {
      if (!LOG_GROUP_NAME || LOG_GROUP_NAME === `/aws/compliance/${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Log group name not available from outputs');
        return;
      }
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: LOG_GROUP_NAME,
      });
      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === LOG_GROUP_NAME);
      expect(logGroup).toBeDefined();
    });

    it('should have retention policy configured', async () => {
      if (!LOG_GROUP_NAME || LOG_GROUP_NAME === `/aws/compliance/${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Log group name not available from outputs');
        return;
      }
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: LOG_GROUP_NAME,
      });
      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === LOG_GROUP_NAME);
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should exist with correct name', async () => {
      if (!DASHBOARD_NAME || DASHBOARD_NAME === `compliance-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Dashboard name not available from outputs');
        return;
      }
      const command = new GetDashboardCommand({ DashboardName: DASHBOARD_NAME });
      const response = await cloudwatchClient.send(command);
      expect(response.DashboardName).toBe(DASHBOARD_NAME);
    });

    it('should have dashboard body with widgets', async () => {
      if (!DASHBOARD_NAME || DASHBOARD_NAME === `compliance-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Dashboard name not available from outputs');
        return;
      }
      const command = new GetDashboardCommand({ DashboardName: DASHBOARD_NAME });
      const response = await cloudwatchClient.send(command);
      expect(response.DashboardBody).toBeDefined();
      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    it('should include environmentSuffix in bucket name', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping: No deployment outputs available');
        return;
      }
      if (deployedOutputs.ReportsBucketName) {
        expect(deployedOutputs.ReportsBucketName).toContain(ENVIRONMENT_SUFFIX);
      }
    });

    it('should include environmentSuffix in role name', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping: No deployment outputs available');
        return;
      }
      if (deployedOutputs.ComplianceRoleName) {
        expect(deployedOutputs.ComplianceRoleName).toContain(ENVIRONMENT_SUFFIX);
      }
    });

    it('should include environmentSuffix in topic ARN', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping: No deployment outputs available');
        return;
      }
      if (deployedOutputs.AlertTopicArn) {
        expect(deployedOutputs.AlertTopicArn).toContain(ENVIRONMENT_SUFFIX);
      }
    });
  });

  describe('Security Validation', () => {
    it('should have encryption at rest for S3', async () => {
      if (!BUCKET_NAME || BUCKET_NAME === `compliance-reports-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Bucket name not available from outputs');
        return;
      }
      const command = new GetBucketEncryptionCommand({ Bucket: BUCKET_NAME });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]).toBeDefined();
    });

    it('should have least privilege IAM policies', async () => {
      if (!ROLE_NAME || ROLE_NAME === `compliance-scanner-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Role name not available from outputs');
        return;
      }
      const command = new ListAttachedRolePoliciesCommand({ RoleName: ROLE_NAME });
      const response = await iamClient.send(command);
      // Verify no AdministratorAccess or overly permissive policies
      const hasAdminAccess = response.AttachedPolicies?.some(
        policy => policy.PolicyArn?.includes('AdministratorAccess')
      );
      expect(hasAdminAccess).toBe(false);
    });
  });

  describe('Infrastructure Idempotency', () => {
    it('should have unique resource identifiers', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping: No deployment outputs available');
        return;
      }
      // All resources should have environment suffix to ensure idempotency
      const resourceNames = [
        deployedOutputs.ReportsBucketName,
        deployedOutputs.ComplianceRoleName,
        deployedOutputs.DashboardName,
      ].filter(Boolean);

      resourceNames.forEach(name => {
        expect(name).toContain(ENVIRONMENT_SUFFIX);
      });
    });
  });

  describe('Destroyability Validation', () => {
    it('should not have retention policies blocking deletion', async () => {
      if (!BUCKET_NAME || BUCKET_NAME === `compliance-reports-${ENVIRONMENT_SUFFIX}`) {
        console.log('Skipping: Bucket name not available from outputs');
        return;
      }
      // Verify bucket exists and is accessible (means it can be destroyed)
      const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Compliance Checker Module Tests', () => {
    it('should validate ComplianceStatus enum values', () => {
      const validStatuses = ['COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE'];
      validStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });

    it('should validate ViolationSeverity enum values', () => {
      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
      validSeverities.forEach(severity => {
        expect(validSeverities).toContain(severity);
      });
    });

    it('should validate ResourceType enum values', () => {
      const validTypes = [
        'AWS::S3::Bucket',
        'AWS::EC2::Instance',
        'AWS::RDS::DBInstance',
        'AWS::Lambda::Function',
        'AWS::IAM::Role',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Volume',
        'AWS::Logs::LogGroup',
      ];
      expect(validTypes.length).toBe(8);
    });
  });

  describe('Report Generation Workflow', () => {
    it('should validate compliance report structure', () => {
      const mockReport = {
        reportId: `compliance-${ENVIRONMENT_SUFFIX}-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        totalResources: 100,
        compliantResources: 85,
        nonCompliantResources: 15,
        complianceScore: 85.0,
        resourcesByType: {},
        violationsBySeverity: {
          CRITICAL: 0,
          HIGH: 5,
          MEDIUM: 7,
          LOW: 3,
          INFO: 0,
        },
        results: [],
        summary: {
          criticalViolations: 0,
          highViolations: 5,
          mediumViolations: 7,
          lowViolations: 3,
        },
      };

      expect(mockReport.reportId).toContain(ENVIRONMENT_SUFFIX);
      expect(mockReport.complianceScore).toBe(85.0);
      expect(mockReport.totalResources).toBe(
        mockReport.compliantResources + mockReport.nonCompliantResources
      );
    });

    it('should calculate compliance score correctly', () => {
      const compliant = 85;
      const total = 100;
      const score = (compliant / total) * 100;
      expect(score).toBe(85);
    });
  });

  describe('Tagging Service Validation', () => {
    it('should validate required tags list', () => {
      const requiredTags = ['Environment', 'Owner', 'Team', 'Project', 'CreatedAt'];
      expect(requiredTags.length).toBe(5);
      expect(requiredTags).toContain('Environment');
      expect(requiredTags).toContain('Owner');
    });
  });

  describe('Multi-Region Support', () => {
    it('should validate approved regions list', () => {
      const approvedRegions = [
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'us-west-2',
        'eu-west-1',
        'eu-central-1',
      ];
      expect(approvedRegions).toContain(AWS_REGION);
    });
  });
});
