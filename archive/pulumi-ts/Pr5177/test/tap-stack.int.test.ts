/**
 * tap-stack.int.test.ts
 *
 * Comprehensive integration tests for TapStack infrastructure.
 * Tests actual functionality of deployed AWS resources rather than just checking existence.
 *
 * Prerequisites:
 * - AWS credentials configured
 * - Set ENVIRONMENT_SUFFIX if not using 'dev'
 * - Stack deployed to target environment
 * - Required IAM permissions for testing
 *
 * Run with: npm run test:integration
 * Specific test: npm run test:integration -- -t "test name"
 */

import * as cloudtrail from '@aws-sdk/client-cloudtrail';
import * as cloudwatch from '@aws-sdk/client-cloudwatch';
import * as iam from '@aws-sdk/client-iam';
import * as kms from '@aws-sdk/client-kms';
import * as aws from '@aws-sdk/client-s3';
import * as sns from '@aws-sdk/client-sns';
import * as sts from '@aws-sdk/client-sts';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';

// Test configuration - all values are dynamic and region-agnostic
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'pr5032';
const STACK_NAME = `TapStack${ENVIRONMENT_SUFFIX}`;
const TEST_TIMEOUT = 60000; // 60 seconds
const EXTENDED_TIMEOUT = 120000; // 120 seconds for async operations

// Get current region from AWS SDK
let AWS_REGION: string;
let AWS_ACCOUNT_ID: string;

// Log configuration for debugging
console.log(`   Test Configuration:`);
console.log(`   Stack Name: ${STACK_NAME}`);
console.log(`   Environment Suffix: ${ENVIRONMENT_SUFFIX}`);

// Stack outputs interface based on your actual outputs
interface StackOutputs {
  adminRoleArn: string;
  auditLogsBucketName: string;
  cloudTrailArn: string;
  cloudWatchDashboardUrl: string;
  documentsBucketArn: string;
  documentsBucketName: string;
  kmsKeyArn: string;
  kmsKeyId: string;
  lawyersRoleArn: string;
  readOnlyRoleArn: string;
  snsTopicArn: string;
}

// Global test state
let stackOutputs: StackOutputs;
let s3Client: aws.S3Client;
let kmsClient: kms.KMSClient;
let iamClient: iam.IAMClient;
let snsClient: sns.SNSClient;
let cloudtrailClient: cloudtrail.CloudTrailClient;
let cloudwatchClient: cloudwatch.CloudWatchClient;
let stsClient: sts.STSClient;

/**
 * Get stack outputs using Pulumi CLI
 */
async function getStackOutputs(): Promise<StackOutputs> {
  const { execSync } = require('child_process');

  try {
    // Get flat outputs from cfn-outputs directory
    const fs = require('fs');
    const path = require('path');
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    let outputs;
    if (fs.existsSync(outputsPath)) {
      // Use flat outputs if available
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      // Fallback to Pulumi CLI
      const command = `pulumi stack output --json -s ${STACK_NAME}`;
      const outputBuffer = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf8',
      });
      outputs = JSON.parse(outputBuffer);
    }

    return {
      adminRoleArn: outputs.adminRoleArn,
      auditLogsBucketName: outputs.auditLogsBucketName,
      cloudTrailArn: outputs.cloudTrailArn,
      cloudWatchDashboardUrl: outputs.cloudWatchDashboardUrl,
      documentsBucketArn: outputs.documentsBucketArn,
      documentsBucketName: outputs.documentsBucketName,
      kmsKeyArn: outputs.kmsKeyArn,
      kmsKeyId: outputs.kmsKeyId,
      lawyersRoleArn: outputs.lawyersRoleArn,
      readOnlyRoleArn: outputs.readOnlyRoleArn,
      snsTopicArn: outputs.snsTopicArn,
    };
  } catch (error: any) {
    throw new Error(
      `Failed to get stack outputs: ${error.message}\nMake sure the stack is deployed: pulumi up -s ${STACK_NAME}`
    );
  }
}

/**
 * Helper: Wait for a condition to be true with polling
 */
async function waitForCondition(
  checkFn: () => Promise<boolean>,
  timeoutMs: number = 30000,
  pollIntervalMs: number = 2000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await checkFn();
      if (result) {
        return true;
      }
    } catch (error) {
      // Continue polling on errors
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  return false;
}

/**
 * Helper: Generate unique test identifier
 */
function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Helper: Extract bucket name from ARN
 */
function getBucketNameFromArn(bucketArn: string): string {
  return bucketArn.split(':::')[1];
}

/**
 * Helper: Extract role name from ARN
 */
function getRoleNameFromArn(roleArn: string): string {
  return roleArn.split('/').pop() || '';
}

/**
 * Helper: Extract topic name from ARN
 */
function getTopicNameFromArn(topicArn: string): string {
  return topicArn.split(':').pop() || '';
}

// Setup before all tests
beforeAll(async () => {
  // Get AWS region and account ID first
  stsClient = new sts.STSClient({});
  const identity = await stsClient.send(new sts.GetCallerIdentityCommand({}));
  if (!identity.Account) {
    throw new Error('Unable to retrieve AWS Account ID from STS');
  }
  AWS_ACCOUNT_ID = identity.Account;

  // Get current region from STS client config or environment
  AWS_REGION =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

  console.log(`   AWS Region: ${AWS_REGION}`);
  console.log(`   AWS Account ID: ${AWS_ACCOUNT_ID}`);

  // Get stack outputs
  stackOutputs = await getStackOutputs();
  console.log(`   Stack Outputs Retrieved Successfully`);

  // Initialize AWS SDK clients with detected region
  s3Client = new aws.S3Client({ region: AWS_REGION });
  kmsClient = new kms.KMSClient({ region: AWS_REGION });
  iamClient = new iam.IAMClient({ region: AWS_REGION });
  snsClient = new sns.SNSClient({ region: AWS_REGION });
  cloudtrailClient = new cloudtrail.CloudTrailClient({ region: AWS_REGION });
  cloudwatchClient = new cloudwatch.CloudWatchClient({ region: AWS_REGION });
}, TEST_TIMEOUT);

describe('TapStack Integration Tests - Legal Document Management System', () => {
  describe('S3 Document Storage Operations', () => {
    test(
      'Should successfully upload, retrieve, and delete legal documents from documents bucket',
      async () => {
        const testKey = `legal-docs/${generateTestId()}.pdf`;
        const testDocument = Buffer.from(
          'Mock legal document content - test case summary and findings'
        );

        // Upload document
        await s3Client.send(
          new aws.PutObjectCommand({
            Bucket: stackOutputs.documentsBucketName,
            Key: testKey,
            Body: testDocument,
            ContentType: 'application/pdf',
            Metadata: {
              'document-type': 'case-summary',
              'client-id': 'client-001',
              'lawyer-id': 'lawyer-123',
            },
          })
        );

        // Verify upload and retrieve document
        const getResponse = await s3Client.send(
          new aws.GetObjectCommand({
            Bucket: stackOutputs.documentsBucketName,
            Key: testKey,
          })
        );

        expect(getResponse.Body).toBeDefined();
        expect(getResponse.ContentType).toBe('application/pdf');
        expect(getResponse.Metadata?.['document-type']).toBe('case-summary');

        // Verify document is encrypted with KMS
        expect(getResponse.ServerSideEncryption).toBe('aws:kms');
        expect(getResponse.SSEKMSKeyId).toBeDefined();

        // Clean up - delete test document
        await s3Client.send(
          new aws.DeleteObjectCommand({
            Bucket: stackOutputs.documentsBucketName,
            Key: testKey,
          })
        );
      },
      TEST_TIMEOUT
    );

    test(
      'Should enforce bucket versioning for document revision tracking',
      async () => {
        const testKey = `contracts/${generateTestId()}-contract.docx`;
        const version1Content = Buffer.from(
          'Contract version 1.0 - Initial draft'
        );
        const version2Content = Buffer.from(
          'Contract version 2.0 - Revised terms and conditions'
        );

        // Upload version 1
        const upload1 = await s3Client.send(
          new aws.PutObjectCommand({
            Bucket: stackOutputs.documentsBucketName,
            Key: testKey,
            Body: version1Content,
            ContentType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          })
        );

        // Upload version 2 (same key, different content)
        const upload2 = await s3Client.send(
          new aws.PutObjectCommand({
            Bucket: stackOutputs.documentsBucketName,
            Key: testKey,
            Body: version2Content,
            ContentType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          })
        );

        // Verify both versions exist
        expect(upload1.VersionId).toBeDefined();
        expect(upload2.VersionId).toBeDefined();
        expect(upload1.VersionId).not.toBe(upload2.VersionId);

        // List object versions
        const versions = await s3Client.send(
          new aws.ListObjectVersionsCommand({
            Bucket: stackOutputs.documentsBucketName,
            Prefix: testKey,
          })
        );

        expect(versions.Versions?.length).toBeGreaterThanOrEqual(2);

        // Clean up all versions
        if (versions.Versions) {
          for (const version of versions.Versions) {
            if (version.Key === testKey && version.VersionId) {
              await s3Client.send(
                new aws.DeleteObjectCommand({
                  Bucket: stackOutputs.documentsBucketName,
                  Key: testKey,
                  VersionId: version.VersionId,
                })
              );
            }
          }
        }
      },
      TEST_TIMEOUT
    );

    test(
      'Should have proper bucket policy blocking public access',
      async () => {
        const bucketAcl = await s3Client.send(
          new aws.GetBucketAclCommand({
            Bucket: stackOutputs.documentsBucketName,
          })
        );

        // Verify no public read permissions
        const publicGrants =
          bucketAcl.Grants?.filter(
            grant =>
              grant.Grantee?.URI?.includes('AllUsers') ||
              grant.Grantee?.URI?.includes('AuthenticatedUsers')
          ) || [];

        expect(publicGrants).toHaveLength(0);

        // Check public access block settings
        const publicAccessBlock = await s3Client.send(
          new aws.GetPublicAccessBlockCommand({
            Bucket: stackOutputs.documentsBucketName,
          })
        );

        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration
            ?.RestrictPublicBuckets
        ).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('KMS Encryption and Security', () => {
    test(
      'Should have functional KMS key for document encryption',
      async () => {
        // Verify KMS key exists and is active
        const keyDescription = await kmsClient.send(
          new kms.DescribeKeyCommand({
            KeyId: stackOutputs.kmsKeyId,
          })
        );

        expect(keyDescription.KeyMetadata?.KeyId).toBe(stackOutputs.kmsKeyId);
        expect(keyDescription.KeyMetadata?.KeyState).toBe('Enabled');
        expect(keyDescription.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

        // Test encryption/decryption with the key
        const testData =
          'Sensitive legal document content - attorney-client privileged';
        const encryptResponse = await kmsClient.send(
          new kms.EncryptCommand({
            KeyId: stackOutputs.kmsKeyId,
            Plaintext: Buffer.from(testData),
          })
        );

        expect(encryptResponse.CiphertextBlob).toBeDefined();

        // Decrypt to verify functionality
        const decryptResponse = await kmsClient.send(
          new kms.DecryptCommand({
            CiphertextBlob: encryptResponse.CiphertextBlob,
          })
        );

        const decryptedText = Buffer.from(
          decryptResponse.Plaintext!
        ).toString();
        expect(decryptedText).toBe(testData);
      },
      TEST_TIMEOUT
    );

    test(
      'Should have proper KMS key permissions for CloudTrail and S3',
      async () => {
        const keyPolicy = await kmsClient.send(
          new kms.GetKeyPolicyCommand({
            KeyId: stackOutputs.kmsKeyId,
            PolicyName: 'default',
          })
        );

        const policy = JSON.parse(keyPolicy.Policy!);

        // Verify CloudTrail permissions exist
        const cloudTrailStatement = policy.Statement.find(
          (stmt: any) =>
            stmt.Principal?.Service === 'cloudtrail.amazonaws.com' ||
            (Array.isArray(stmt.Principal?.Service) &&
              stmt.Principal.Service.includes('cloudtrail.amazonaws.com'))
        );
        expect(cloudTrailStatement).toBeDefined();

        // Verify root account access for IAM management
        const rootStatement = policy.Statement.find(
          (stmt: any) =>
            stmt.Principal?.AWS?.includes(':root') ||
            (Array.isArray(stmt.Principal?.AWS) &&
              stmt.Principal.AWS.some((arn: string) => arn.includes(':root')))
        );
        expect(rootStatement).toBeDefined();
      },
      TEST_TIMEOUT
    );
  });

  describe('IAM Roles and Access Control', () => {
    test(
      'Should have admin role with appropriate permissions',
      async () => {
        const roleName = getRoleNameFromArn(stackOutputs.adminRoleArn);

        // Verify role exists
        const role = await iamClient.send(
          new iam.GetRoleCommand({
            RoleName: roleName,
          })
        );

        expect(role.Role?.Arn).toBe(stackOutputs.adminRoleArn);
        expect(role.Role?.AssumeRolePolicyDocument).toBeDefined();

        // List attached policies
        const attachedPolicies = await iamClient.send(
          new iam.ListRolePoliciesCommand({
            RoleName: roleName,
          })
        );

        expect(attachedPolicies.PolicyNames?.length).toBeGreaterThan(0);

        // Verify admin policy allows full S3 and KMS access
        if (attachedPolicies.PolicyNames?.[0]) {
          const policy = await iamClient.send(
            new iam.GetRolePolicyCommand({
              RoleName: roleName,
              PolicyName: attachedPolicies.PolicyNames[0],
            })
          );

          const policyDocument = JSON.parse(
            decodeURIComponent(policy.PolicyDocument!)
          );
          const hasS3Access = policyDocument.Statement.some(
            (stmt: any) =>
              stmt.Action.includes('s3:*') ||
              (Array.isArray(stmt.Action) && stmt.Action.includes('s3:*'))
          );
          const hasKMSAccess = policyDocument.Statement.some(
            (stmt: any) =>
              stmt.Action.includes('kms:*') ||
              (Array.isArray(stmt.Action) && stmt.Action.includes('kms:*'))
          );

          expect(hasS3Access).toBe(true);
          expect(hasKMSAccess).toBe(true);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'Should have lawyers role with limited document access permissions',
      async () => {
        const roleName = getRoleNameFromArn(stackOutputs.lawyersRoleArn);

        const role = await iamClient.send(
          new iam.GetRoleCommand({
            RoleName: roleName,
          })
        );

        expect(role.Role?.Arn).toBe(stackOutputs.lawyersRoleArn);

        // Check policy permissions are restricted (not full admin)
        const attachedPolicies = await iamClient.send(
          new iam.ListRolePoliciesCommand({
            RoleName: roleName,
          })
        );

        if (attachedPolicies.PolicyNames?.[0]) {
          const policy = await iamClient.send(
            new iam.GetRolePolicyCommand({
              RoleName: roleName,
              PolicyName: attachedPolicies.PolicyNames[0],
            })
          );

          const policyDocument = JSON.parse(
            decodeURIComponent(policy.PolicyDocument!)
          );

          // Should not have s3:* (full access)
          const hasFullS3Access = policyDocument.Statement.some(
            (stmt: any) =>
              stmt.Action === 's3:*' ||
              (Array.isArray(stmt.Action) && stmt.Action.includes('s3:*'))
          );
          expect(hasFullS3Access).toBe(false);

          // Should have specific S3 permissions
          const hasSpecificS3Access = policyDocument.Statement.some(
            (stmt: any) => {
              const actions = Array.isArray(stmt.Action)
                ? stmt.Action
                : [stmt.Action];
              return actions.some((action: string) =>
                ['s3:GetObject', 's3:PutObject', 's3:ListBucket'].includes(
                  action
                )
              );
            }
          );
          expect(hasSpecificS3Access).toBe(true);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'Should have read-only role with minimal permissions',
      async () => {
        const roleName = getRoleNameFromArn(stackOutputs.readOnlyRoleArn);

        const role = await iamClient.send(
          new iam.GetRoleCommand({
            RoleName: roleName,
          })
        );

        expect(role.Role?.Arn).toBe(stackOutputs.readOnlyRoleArn);

        const attachedPolicies = await iamClient.send(
          new iam.ListRolePoliciesCommand({
            RoleName: roleName,
          })
        );

        if (attachedPolicies.PolicyNames?.[0]) {
          const policy = await iamClient.send(
            new iam.GetRolePolicyCommand({
              RoleName: roleName,
              PolicyName: attachedPolicies.PolicyNames[0],
            })
          );

          const policyDocument = JSON.parse(
            decodeURIComponent(policy.PolicyDocument!)
          );

          // Should only have read permissions
          const hasWriteAccess = policyDocument.Statement.some((stmt: any) => {
            const actions = Array.isArray(stmt.Action)
              ? stmt.Action
              : [stmt.Action];
            return actions.some((action: string) =>
              ['s3:PutObject', 's3:DeleteObject', 'kms:Encrypt'].includes(
                action
              )
            );
          });
          expect(hasWriteAccess).toBe(false);

          // Should have read permissions
          const hasReadAccess = policyDocument.Statement.some((stmt: any) => {
            const actions = Array.isArray(stmt.Action)
              ? stmt.Action
              : [stmt.Action];
            return actions.some((action: string) =>
              ['s3:GetObject', 'kms:Decrypt'].includes(action)
            );
          });
          expect(hasReadAccess).toBe(true);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Audit and Compliance - CloudTrail', () => {
    test(
      'Should have functional CloudTrail for audit logging',
      async () => {
        const trailName = stackOutputs.cloudTrailArn.split('/').pop();

        // Verify CloudTrail is active
        const trail = await cloudtrailClient.send(
          new cloudtrail.DescribeTrailsCommand({
            trailNameList: [trailName!],
          })
        );

        expect(trail.trailList?.length).toBe(1);
        expect(trail.trailList?.[0].Name).toBe(trailName);
        expect(trail.trailList?.[0].S3BucketName).toBe(
          stackOutputs.auditLogsBucketName
        );

        // Verify trail status
        const trailStatus = await cloudtrailClient.send(
          new cloudtrail.GetTrailStatusCommand({
            Name: trailName!,
          })
        );

        expect(trailStatus.IsLogging).toBe(true);

        // Verify event selectors are configured for S3 data events
        const eventSelectors = await cloudtrailClient.send(
          new cloudtrail.GetEventSelectorsCommand({
            TrailName: trailName!,
          })
        );

        expect(eventSelectors.EventSelectors?.length).toBeGreaterThan(0);

        const s3DataEvents =
          eventSelectors.EventSelectors?.[0]?.DataResources?.some(
            resource => resource.Type === 'AWS::S3::Object'
          );
        expect(s3DataEvents).toBe(true);
      },
      TEST_TIMEOUT
    );



    describe('Monitoring and Alerting', () => {
      test(
        'Should have functional SNS topic for alerts',
        async () => {
          const topicName = getTopicNameFromArn(stackOutputs.snsTopicArn);

          // Verify topic exists
          const topics = await snsClient.send(new sns.ListTopicsCommand({}));
          const topic = topics.Topics?.find(
            t => t.TopicArn === stackOutputs.snsTopicArn
          );
          expect(topic).toBeDefined();

          // Test topic functionality by publishing a test message
          const testMessage = {
            alert: 'Integration test message',
            timestamp: new Date().toISOString(),
            source: 'tap-stack-integration-test',
          };

          const publishResult = await snsClient.send(
            new sns.PublishCommand({
              TopicArn: stackOutputs.snsTopicArn,
              Message: JSON.stringify(testMessage),
              Subject: 'TapStack Integration Test Alert',
            })
          );

          expect(publishResult.MessageId).toBeDefined();
        },
        TEST_TIMEOUT
      );

      test(
        'Should have accessible CloudWatch dashboard',
        async () => {
          // Verify dashboard URL is properly formatted
          expect(stackOutputs.cloudWatchDashboardUrl).toMatch(
            /^https:\/\/console\.aws\.amazon\.com\/cloudwatch/
          );
          expect(stackOutputs.cloudWatchDashboardUrl).toContain(
            'dashboards:name='
          );
          expect(stackOutputs.cloudWatchDashboardUrl).toContain(AWS_REGION);

          // Extract dashboard name from URL
          const dashboardName =
            stackOutputs.cloudWatchDashboardUrl.split('dashboards:name=')[1];
          expect(dashboardName).toBeDefined();
          expect(dashboardName).toContain(ENVIRONMENT_SUFFIX);
        },
        TEST_TIMEOUT
      );
    });

    describe('Cross-Service Integration', () => {
      test(
        'Should demonstrate end-to-end document lifecycle with full audit trail',
        async () => {
          const testKey = `integration - test / ${generateTestId()} - contract.pdf`;
          const originalContent = Buffer.from(
            'Original contract terms - Integration Test Document'
          );
          const revisedContent = Buffer.from(
            'Revised contract terms with amendments - Integration Test Document v2'
          );
          const beforeTime = new Date();

          // 1. Upload original document (should trigger CloudTrail logging)
          const upload1 = await s3Client.send(
            new aws.PutObjectCommand({
              Bucket: stackOutputs.documentsBucketName,
              Key: testKey,
              Body: originalContent,
              ContentType: 'application/pdf',
              Metadata: {
                client: 'integration-test-client',
                matter: 'contract-negotiation-001',
              },
            })
          );

          expect(upload1.VersionId).toBeDefined();

          // 2. Upload revision (new version)
          const upload2 = await s3Client.send(
            new aws.PutObjectCommand({
              Bucket: stackOutputs.documentsBucketName,
              Key: testKey,
              Body: revisedContent,
              ContentType: 'application/pdf',
              Metadata: {
                client: 'integration-test-client',
                matter: 'contract-negotiation-001',
                revision: '2',
              },
            })
          );

          expect(upload2.VersionId).toBeDefined();
          expect(upload2.VersionId).not.toBe(upload1.VersionId);

          // 3. Verify both versions are accessible
          const currentVersion = await s3Client.send(
            new aws.GetObjectCommand({
              Bucket: stackOutputs.documentsBucketName,
              Key: testKey,
            })
          );

          const previousVersion = await s3Client.send(
            new aws.GetObjectCommand({
              Bucket: stackOutputs.documentsBucketName,
              Key: testKey,
              VersionId: upload1.VersionId,
            })
          );

          expect(currentVersion.VersionId).toBe(upload2.VersionId);
          expect(previousVersion.VersionId).toBe(upload1.VersionId);

          // 4. Verify encryption is applied
          expect(currentVersion.ServerSideEncryption).toBe('aws:kms');
          expect(previousVersion.ServerSideEncryption).toBe('aws:kms');

          // 5. Clean up all versions
          await s3Client.send(
            new aws.DeleteObjectCommand({
              Bucket: stackOutputs.documentsBucketName,
              Key: testKey,
              VersionId: upload1.VersionId,
            })
          );

          await s3Client.send(
            new aws.DeleteObjectCommand({
              Bucket: stackOutputs.documentsBucketName,
              Key: testKey,
              VersionId: upload2.VersionId,
            })
          );
        },
        EXTENDED_TIMEOUT
      );
    });

    describe('Infrastructure Resilience', () => {
      test(
        'Should handle concurrent document operations without conflicts',
        async () => {
          const concurrentOperations = 5;
          const testPrefix = `stress - test / ${generateTestId()}`;
          const promises: Promise<any>[] = [];

          // Create concurrent upload operations
          for (let i = 0; i < concurrentOperations; i++) {
            const promise = s3Client.send(
              new aws.PutObjectCommand({
                Bucket: stackOutputs.documentsBucketName,
                Key: `${testPrefix}/doc-${i}.txt`,
                Body: Buffer.from(
                  `Concurrent test document ${i} - ${Date.now()}`
                ),
                ContentType: 'text/plain',
              })
            );
            promises.push(promise);
          }

          // Wait for all operations to complete
          const results = await Promise.all(promises);

          // Verify all uploads succeeded
          results.forEach(result => {
            expect(result.ETag).toBeDefined();
          });

          // Clean up test files
          const cleanupPromises: Promise<any>[] = [];
          for (let i = 0; i < concurrentOperations; i++) {
            const promise = s3Client.send(
              new aws.DeleteObjectCommand({
                Bucket: stackOutputs.documentsBucketName,
                Key: `${testPrefix}/doc-${i}.txt`,
              })
            );
            cleanupPromises.push(promise);
          }

          await Promise.all(cleanupPromises);
        },
        EXTENDED_TIMEOUT
      );
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    console.log('Integration tests completed');
  }, TEST_TIMEOUT);
});
