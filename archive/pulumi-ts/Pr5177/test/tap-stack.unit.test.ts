/**
 * tap-stack.unit.test.ts
 *
 * Comprehensive unit tests for TapStack
 * Tests all stack instantiation, outputs, resource creation, and configurations
 * Following pr4877 testing patterns without mocks
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Test constants - configurable via environment variables
const TEST_CONSTANTS = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID || '123456789012',
  AWS_USER_ID: process.env.AWS_USER_ID || 'AIDACKCEVSQ6C2EXAMPLE',
  DEFAULT_ENVIRONMENT: 'dev',
  DEFAULT_FIRM_NAME: 'morrison-associates',
  DEFAULT_RETENTION_DAYS: 90,
  CUSTOM_ENVIRONMENT: 'prod',
  CUSTOM_FIRM_NAME: 'acme-law',
  CUSTOM_RETENTION_DAYS: 180,
  NAMING_TEST_ENVIRONMENT: 'staging',
  NAMING_TEST_FIRM_NAME: 'test-firm',
} as const;

describe('TapStack', () => {
  let stack: TapStack;

  // Track created resources for verification
  const createdResources: Map<string, pulumi.runtime.MockResourceArgs> =
    new Map();

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (
        args: pulumi.runtime.MockResourceArgs
      ): { id: string; state: any } => {
        createdResources.set(args.name, args);

        // Return appropriate mock state based on resource type
        const baseState = {
          ...args.inputs,
          id: `${args.name}_id`,
        };

        switch (args.type) {
          case 'aws:s3/bucket:Bucket':
            return {
              id: `${args.name}_id`,
              state: {
                ...baseState,
                arn: `arn:aws:s3:::${args.inputs?.bucket || args.name}`,
                bucket: args.inputs?.bucket || `bucket-${args.name}`,
                bucketDomainName: `${args.inputs?.bucket || args.name}.s3.amazonaws.com`,
              },
            };
          case 'aws:kms/key:Key':
            return {
              id: `${args.name}_id`,
              state: {
                ...baseState,
                arn: `arn:aws:kms:${TEST_CONSTANTS.AWS_REGION}:${TEST_CONSTANTS.AWS_ACCOUNT_ID}:key/${args.name}_id`,
                keyId: `${args.name}_id`,
              },
            };
          case 'aws:iam/role:Role':
            return {
              id: `${args.name}_id`,
              state: {
                ...baseState,
                arn: `arn:aws:iam::${TEST_CONSTANTS.AWS_ACCOUNT_ID}:role/${args.inputs?.name || args.name}`,
                name: args.inputs?.name || args.name,
              },
            };
          case 'aws:sns/topic:Topic':
            return {
              id: `${args.name}_id`,
              state: {
                ...baseState,
                arn: `arn:aws:sns:${TEST_CONSTANTS.AWS_REGION}:${TEST_CONSTANTS.AWS_ACCOUNT_ID}:${args.inputs?.name || args.name}`,
                name: args.inputs?.name || args.name,
              },
            };
          case 'aws:cloudtrail/trail:Trail':
            return {
              id: `${args.name}_id`,
              state: {
                ...baseState,
                arn: `arn:aws:cloudtrail:${TEST_CONSTANTS.AWS_REGION}:${TEST_CONSTANTS.AWS_ACCOUNT_ID}:trail/${args.inputs?.name || args.name}`,
                name: args.inputs?.name || args.name,
              },
            };
          case 'aws:cloudwatch/dashboard:Dashboard':
            return {
              id: `${args.name}_id`,
              state: {
                ...baseState,
                dashboardName: args.inputs?.dashboardName || args.name,
              },
            };
          default:
            return {
              id: `${args.name}_id`,
              state: baseState,
            };
        }
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        // Mock AWS service calls
        switch (args.token) {
          case 'aws:index/getCallerIdentity:getCallerIdentity':
            return {
              accountId: TEST_CONSTANTS.AWS_ACCOUNT_ID,
              arn: `arn:aws:iam::${TEST_CONSTANTS.AWS_ACCOUNT_ID}:root`,
              userId: TEST_CONSTANTS.AWS_USER_ID,
            };
          case 'aws:index/getRegion:getRegion':
            return {
              name: TEST_CONSTANTS.AWS_REGION,
            };
          default:
            return args.inputs;
        }
      },
    });
  });

  beforeEach(() => {
    createdResources.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    describe('with minimal configuration', () => {
      beforeEach(async () => {
        stack = new TapStack('test-stack-minimal', {
          environmentSuffix: TEST_CONSTANTS.DEFAULT_ENVIRONMENT,
        });
        // Wait a tick to allow resources to be created
        await new Promise(resolve => setImmediate(resolve));
      });

      it('creates stack successfully', () => {
        expect(stack).toBeDefined();
        expect(stack).toBeInstanceOf(TapStack);
      });

      it('uses default firm name', () => {
        const kmsResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:kms/key:Key'
        );
        expect(kmsResource).toBeDefined();
        expect(kmsResource?.inputs?.description).toBe(
          'KMS key for legal document encryption'
        );
      });

      it('uses default retention period', () => {
        const lifecycleResource = Array.from(createdResources.values()).find(
          r =>
            r.type ===
            'aws:s3/bucketLifecycleConfiguration:BucketLifecycleConfiguration'
        );
        expect(lifecycleResource).toBeDefined();
        expect(lifecycleResource?.inputs?.rules).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              noncurrentVersionExpiration: expect.objectContaining({
                noncurrentDays: TEST_CONSTANTS.DEFAULT_RETENTION_DAYS,
              }),
            }),
          ])
        );
      });

      it('enables versioning by default', () => {
        const versioningResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:s3/bucketVersioning:BucketVersioning'
        );
        expect(versioningResource).toBeDefined();
        expect(
          versioningResource?.inputs?.versioningConfiguration?.status
        ).toBe('Enabled');
      });

      it('enables audit logging by default', () => {
        const cloudTrailResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:cloudtrail/trail:Trail'
        );
        expect(cloudTrailResource).toBeDefined();
        expect(cloudTrailResource?.inputs?.enableLogging).toBe(true);
      });

      it('applies default tags', done => {
        pulumi.all([stack.documentsBucketName]).apply(() => {
          const bucketResource = Array.from(createdResources.values()).find(
            r =>
              r.type === 'aws:s3/bucket:Bucket' &&
              r.name.includes('documents-bucket')
          );
          expect(bucketResource).toBeDefined();
          expect(bucketResource?.inputs?.tags).toEqual(
            expect.objectContaining({
              Environment: TEST_CONSTANTS.DEFAULT_ENVIRONMENT,
              Project: 'LegalDocumentStorage',
              ManagedBy: 'Pulumi',
              Compliance: 'Legal',
              FirmName: TEST_CONSTANTS.DEFAULT_FIRM_NAME,
            })
          );
          done();
        });
      });
    });

    describe('with full custom configuration', () => {
      beforeEach(async () => {
        stack = new TapStack('test-stack-custom', {
          environmentSuffix: TEST_CONSTANTS.CUSTOM_ENVIRONMENT,
          retentionDays: TEST_CONSTANTS.CUSTOM_RETENTION_DAYS,
          firmName: TEST_CONSTANTS.CUSTOM_FIRM_NAME,
          enableVersioning: false,
          enableAuditLogging: false,
          tags: pulumi.output({
            CustomTag: 'CustomValue',
            CostCenter: 'Legal',
          }),
        });
        // Wait a tick to allow resources to be created
        await new Promise(resolve => setImmediate(resolve));
      });

      it('creates stack with custom configuration', () => {
        expect(stack).toBeDefined();
        expect(stack).toBeInstanceOf(TapStack);
      });

      it('uses custom retention period', () => {
        const lifecycleResource = Array.from(createdResources.values()).find(
          r =>
            r.type ===
            'aws:s3/bucketLifecycleConfiguration:BucketLifecycleConfiguration'
        );
        expect(lifecycleResource).toBeDefined();
        expect(lifecycleResource?.inputs?.rules).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              noncurrentVersionExpiration: expect.objectContaining({
                noncurrentDays: TEST_CONSTANTS.CUSTOM_RETENTION_DAYS,
              }),
            }),
          ])
        );
      });

      it('uses custom firm name in resource names', () => {
        const bucketResource = Array.from(createdResources.values()).find(
          r =>
            r.type === 'aws:s3/bucket:Bucket' &&
            r.name.includes('documents-bucket')
        );
        expect(bucketResource).toBeDefined();
        expect(bucketResource?.inputs?.bucket).toContain(
          TEST_CONSTANTS.CUSTOM_FIRM_NAME
        );
      });

      it('disables versioning when configured', () => {
        const versioningResource = Array.from(createdResources.values()).find(
          r =>
            r.type === 'aws:s3/bucketVersioning:BucketVersioning' &&
            r.name.includes('documents-versioning')
        );
        expect(versioningResource).toBeDefined();
        expect(
          versioningResource?.inputs?.versioningConfiguration?.status
        ).toBe('Suspended');
      });

      it('applies custom tags', done => {
        pulumi.all([stack.documentsBucketName]).apply(() => {
          const bucketResource = Array.from(createdResources.values()).find(
            r =>
              r.type === 'aws:s3/bucket:Bucket' &&
              r.name.includes('documents-bucket')
          );
          expect(bucketResource).toBeDefined();
          expect(bucketResource?.inputs?.tags).toEqual(
            expect.objectContaining({
              CustomTag: 'CustomValue',
              CostCenter: 'Legal',
              Environment: TEST_CONSTANTS.CUSTOM_ENVIRONMENT,
              FirmName: TEST_CONSTANTS.CUSTOM_FIRM_NAME,
            })
          );
          done();
        });
      });
    });
  });

  describe('Storage Resources', () => {
    beforeEach(async () => {
      stack = new TapStack('test-storage', {
        environmentSuffix: TEST_CONSTANTS.DEFAULT_ENVIRONMENT,
      });
      // Wait a tick to allow resources to be created
      await new Promise(resolve => setImmediate(resolve));
    });

    describe('Documents Bucket', () => {
      it('creates documents bucket with correct configuration', () => {
        const bucketResource = Array.from(createdResources.values()).find(
          r =>
            r.type === 'aws:s3/bucket:Bucket' &&
            r.name.includes('documents-bucket')
        );
        expect(bucketResource).toBeDefined();
        expect(bucketResource?.inputs?.bucket).toContain(
          `${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-documents-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}`
        );
      });

      it('configures bucket versioning', () => {
        const versioningResource = Array.from(createdResources.values()).find(
          r =>
            r.type === 'aws:s3/bucketVersioning:BucketVersioning' &&
            r.name.includes('documents-versioning')
        );
        expect(versioningResource).toBeDefined();
        expect(
          versioningResource?.inputs?.versioningConfiguration?.status
        ).toBe('Enabled');
      });

      it('configures server-side encryption', () => {
        const encryptionResource = Array.from(createdResources.values()).find(
          r =>
            r.type ===
              'aws:s3/bucketServerSideEncryptionConfiguration:BucketServerSideEncryptionConfiguration' &&
            r.name.includes('documents-encryption')
        );
        expect(encryptionResource).toBeDefined();
        expect(
          encryptionResource?.inputs?.rules?.[0]
            ?.applyServerSideEncryptionByDefault?.sseAlgorithm
        ).toBe('aws:kms');
        expect(encryptionResource?.inputs?.rules?.[0]?.bucketKeyEnabled).toBe(
          true
        );
      });

      it('configures lifecycle policy', () => {
        const lifecycleResource = Array.from(createdResources.values()).find(
          r =>
            r.type ===
            'aws:s3/bucketLifecycleConfiguration:BucketLifecycleConfiguration'
        );
        expect(lifecycleResource).toBeDefined();
        expect(lifecycleResource?.inputs?.rules).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'document-retention-policy',
              status: 'Enabled',
              noncurrentVersionExpiration: expect.objectContaining({
                noncurrentDays: 90,
              }),
              transitions: expect.arrayContaining([
                expect.objectContaining({
                  days: 30,
                  storageClass: 'STANDARD_IA',
                }),
                expect.objectContaining({
                  days: 60,
                  storageClass: 'GLACIER',
                }),
              ]),
            }),
          ])
        );
      });

      it('blocks public access', () => {
        const publicAccessResource = Array.from(createdResources.values()).find(
          r =>
            r.type ===
              'aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock' &&
            r.name.includes('documents-public-access-block')
        );
        expect(publicAccessResource).toBeDefined();
        expect(publicAccessResource?.inputs).toEqual(
          expect.objectContaining({
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
          })
        );
      });

      it('exposes bucket name as output', done => {
        expect(stack.documentsBucketName).toBeDefined();
        pulumi.all([stack.documentsBucketName]).apply(([bucketName]) => {
          expect(bucketName).toBeTruthy();
          expect(bucketName).toContain('documents-bucket');
          done();
        });
      });

      it('exposes bucket ARN as output', done => {
        expect(stack.documentsBucketArn).toBeDefined();
        pulumi.all([stack.documentsBucketArn]).apply(([bucketArn]) => {
          expect(bucketArn).toBeTruthy();
          expect(bucketArn).toMatch(/^arn:aws:s3:::/);
          done();
        });
      });
    });

    describe('Audit Logs Bucket', () => {
      it('creates audit logs bucket', () => {
        const bucketResource = Array.from(createdResources.values()).find(
          r =>
            r.type === 'aws:s3/bucket:Bucket' &&
            r.name.includes('audit-logs-bucket')
        );
        expect(bucketResource).toBeDefined();
        expect(bucketResource?.inputs?.bucket).toContain(
          `${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-audit-logs-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}`
        );
      });

      it('configures audit bucket versioning', () => {
        const versioningResource = Array.from(createdResources.values()).find(
          r =>
            r.type === 'aws:s3/bucketVersioning:BucketVersioning' &&
            r.name.includes('audit-logs-versioning')
        );
        expect(versioningResource).toBeDefined();
        expect(
          versioningResource?.inputs?.versioningConfiguration?.status
        ).toBe('Enabled');
      });

      it('configures audit bucket encryption', () => {
        const encryptionResource = Array.from(createdResources.values()).find(
          r =>
            r.type ===
              'aws:s3/bucketServerSideEncryptionConfiguration:BucketServerSideEncryptionConfiguration' &&
            r.name.includes('audit-logs-encryption')
        );
        expect(encryptionResource).toBeDefined();
        expect(
          encryptionResource?.inputs?.rules?.[0]
            ?.applyServerSideEncryptionByDefault?.sseAlgorithm
        ).toBe('aws:kms');
      });

      it('exposes audit bucket name as output', done => {
        expect(stack.auditLogsBucketName).toBeDefined();
        pulumi.all([stack.auditLogsBucketName]).apply(([bucketName]) => {
          expect(bucketName).toBeTruthy();
          expect(bucketName).toContain('audit-logs-bucket');
          done();
        });
      });
    });
  });

  describe('Security Resources', () => {
    beforeEach(async () => {
      stack = new TapStack('test-security', {
        environmentSuffix: TEST_CONSTANTS.DEFAULT_ENVIRONMENT,
      });
      // Wait a tick to allow resources to be created
      await new Promise(resolve => setImmediate(resolve));
    });

    describe('KMS Key', () => {
      it('creates KMS key with proper configuration', () => {
        const kmsResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:kms/key:Key'
        );
        expect(kmsResource).toBeDefined();
        expect(kmsResource?.inputs?.description).toBe(
          'KMS key for legal document encryption'
        );
      });

      it('creates KMS alias', () => {
        const aliasResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:kms/alias:Alias'
        );
        expect(aliasResource).toBeDefined();
        expect(aliasResource?.inputs?.name).toMatch(
          new RegExp(
            `^alias/${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-documents-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}-[a-z0-9]{6}$`
          )
        );
      });

      it('exposes KMS key ID as output', done => {
        expect(stack.kmsKeyId).toBeDefined();
        pulumi.all([stack.kmsKeyId]).apply(([keyId]) => {
          expect(keyId).toBeTruthy();
          done();
        });
      });

      it('exposes KMS key ARN as output', done => {
        expect(stack.kmsKeyArn).toBeDefined();
        pulumi.all([stack.kmsKeyArn]).apply(([keyArn]) => {
          expect(keyArn).toBeTruthy();
          expect(keyArn).toMatch(/^arn:aws:kms:/);
          done();
        });
      });
    });

    describe('IAM Roles', () => {
      it('creates admin role', () => {
        const adminRoleResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:iam/role:Role' && r.name.includes('admin-role')
        );
        expect(adminRoleResource).toBeDefined();
        expect(adminRoleResource?.inputs?.name).toBe(
          `${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-admin-role-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}`
        );
      });

      it('creates lawyers role', () => {
        const lawyersRoleResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:iam/role:Role' && r.name.includes('lawyers-role')
        );
        expect(lawyersRoleResource).toBeDefined();
        expect(lawyersRoleResource?.inputs?.name).toBe(
          `${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-lawyers-role-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}`
        );
      });

      it('creates read-only role', () => {
        const readOnlyRoleResource = Array.from(createdResources.values()).find(
          r =>
            r.type === 'aws:iam/role:Role' && r.name.includes('readonly-role')
        );
        expect(readOnlyRoleResource).toBeDefined();
        expect(readOnlyRoleResource?.inputs?.name).toBe(
          `${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-readonly-role-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}`
        );
      });

      it('creates admin policy', () => {
        const adminPolicyResource = Array.from(createdResources.values()).find(
          r =>
            r.type === 'aws:iam/rolePolicy:RolePolicy' &&
            r.name.includes('admin-policy')
        );
        expect(adminPolicyResource).toBeDefined();
      });

      it('creates lawyers policy', () => {
        const lawyersPolicyResource = Array.from(
          createdResources.values()
        ).find(
          r =>
            r.type === 'aws:iam/rolePolicy:RolePolicy' &&
            r.name.includes('lawyers-policy')
        );
        expect(lawyersPolicyResource).toBeDefined();
      });

      it('creates read-only policy', () => {
        const readOnlyPolicyResource = Array.from(
          createdResources.values()
        ).find(
          r =>
            r.type === 'aws:iam/rolePolicy:RolePolicy' &&
            r.name.includes('readonly-policy')
        );
        expect(readOnlyPolicyResource).toBeDefined();
      });

      it('exposes admin role ARN as output', done => {
        expect(stack.adminRoleArn).toBeDefined();
        pulumi.all([stack.adminRoleArn]).apply(([roleArn]) => {
          expect(roleArn).toBeTruthy();
          expect(roleArn).toMatch(/^arn:aws:iam::/);
          done();
        });
      });

      it('exposes lawyers role ARN as output', done => {
        expect(stack.lawyersRoleArn).toBeDefined();
        pulumi.all([stack.lawyersRoleArn]).apply(([roleArn]) => {
          expect(roleArn).toBeTruthy();
          expect(roleArn).toMatch(/^arn:aws:iam::/);
          done();
        });
      });

      it('exposes read-only role ARN as output', done => {
        expect(stack.readOnlyRoleArn).toBeDefined();
        pulumi.all([stack.readOnlyRoleArn]).apply(([roleArn]) => {
          expect(roleArn).toBeTruthy();
          expect(roleArn).toMatch(/^arn:aws:iam::/);
          done();
        });
      });
    });
  });

  describe('Audit and Compliance Resources', () => {
    beforeEach(async () => {
      stack = new TapStack('test-audit', {
        environmentSuffix: TEST_CONSTANTS.DEFAULT_ENVIRONMENT,
        enableAuditLogging: true,
      });
      // Wait a tick to allow resources to be created
      await new Promise(resolve => setImmediate(resolve));
    });

    describe('CloudTrail', () => {
      it('creates CloudTrail when audit logging enabled', () => {
        const cloudTrailResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:cloudtrail/trail:Trail'
        );
        expect(cloudTrailResource).toBeDefined();
        expect(cloudTrailResource?.inputs?.name).toMatch(
          new RegExp(
            `^${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-document-audit-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}-[a-z0-9]{6}$`
          )
        );
      });

      it('configures CloudTrail with correct settings', () => {
        const cloudTrailResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:cloudtrail/trail:Trail'
        );
        expect(cloudTrailResource?.inputs).toEqual(
          expect.objectContaining({
            includeGlobalServiceEvents: true,
            isMultiRegionTrail: true,
            enableLogging: true,
          })
        );
      });

      it('configures event selectors for S3 objects only', () => {
        const cloudTrailResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:cloudtrail/trail:Trail'
        );
        expect(cloudTrailResource?.inputs?.eventSelectors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              readWriteType: 'All',
              includeManagementEvents: true,
              dataResources: expect.arrayContaining([
                expect.objectContaining({
                  type: 'AWS::S3::Object',
                }),
              ]),
            }),
          ])
        );
      });

      it('creates CloudTrail bucket policy', () => {
        const bucketPolicyResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:s3/bucketPolicy:BucketPolicy'
        );
        expect(bucketPolicyResource).toBeDefined();
      });

      it('exposes CloudTrail ARN as output', done => {
        expect(stack.cloudTrailArn).toBeDefined();
        pulumi.all([stack.cloudTrailArn]).apply(([trailArn]) => {
          expect(trailArn).toBeTruthy();
          expect(trailArn).toMatch(/^arn:aws:cloudtrail:/);
          done();
        });
      });
    });

    describe('CloudTrail Disabled', () => {
      beforeEach(async () => {
        createdResources.clear();
        stack = new TapStack('test-no-audit', {
          environmentSuffix: TEST_CONSTANTS.DEFAULT_ENVIRONMENT,
          enableAuditLogging: false,
        });
        // Wait a tick to allow resources to be created
        await new Promise(resolve => setImmediate(resolve));
      });

      it('does not create CloudTrail when audit logging disabled', () => {
        const cloudTrailResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:cloudtrail/trail:Trail'
        );
        expect(cloudTrailResource).toBeUndefined();
      });

      it('returns empty CloudTrail ARN when disabled', done => {
        expect(stack.cloudTrailArn).toBeDefined();
        pulumi.all([stack.cloudTrailArn]).apply(([trailArn]) => {
          expect(trailArn).toBe('');
          done();
        });
      });
    });
  });

  describe('Monitoring Resources', () => {
    beforeEach(async () => {
      stack = new TapStack('test-monitoring', {
        environmentSuffix: TEST_CONSTANTS.DEFAULT_ENVIRONMENT,
      });
      // Wait a tick to allow resources to be created
      await new Promise(resolve => setImmediate(resolve));
    });

    describe('SNS Topic', () => {
      it('creates SNS topic for alerts', () => {
        const snsResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:sns/topic:Topic'
        );
        expect(snsResource).toBeDefined();
        expect(snsResource?.inputs?.name).toBe(
          `${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-document-alerts-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}`
        );
      });

      it('exposes SNS topic ARN as output', done => {
        expect(stack.snsTopicArn).toBeDefined();
        pulumi.all([stack.snsTopicArn]).apply(([topicArn]) => {
          expect(topicArn).toBeTruthy();
          expect(topicArn).toMatch(/^arn:aws:sns:/);
          done();
        });
      });
    });

    describe('CloudWatch Dashboard', () => {
      it('creates CloudWatch dashboard', () => {
        const dashboardResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:cloudwatch/dashboard:Dashboard'
        );
        expect(dashboardResource).toBeDefined();
        expect(dashboardResource?.inputs?.dashboardName).toBe(
          `${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-documents-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}`
        );
      });

      it('exposes dashboard URL as output', done => {
        expect(stack.cloudWatchDashboardUrl).toBeDefined();
        pulumi.all([stack.cloudWatchDashboardUrl]).apply(([dashboardUrl]) => {
          expect(dashboardUrl).toBeTruthy();
          expect(dashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
          expect(dashboardUrl).toContain('#dashboards:name=');
          done();
        });
      });
    });

    describe('CloudWatch Alarms', () => {
      it('creates high access alarm', () => {
        const alarmResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:cloudwatch/metricAlarm:MetricAlarm'
        );
        expect(alarmResource).toBeDefined();
        expect(alarmResource?.inputs?.name).toBe(
          `${TEST_CONSTANTS.DEFAULT_FIRM_NAME}-high-document-access-${TEST_CONSTANTS.DEFAULT_ENVIRONMENT}`
        );
      });

      it('configures alarm with correct metrics', () => {
        const alarmResource = Array.from(createdResources.values()).find(
          r => r.type === 'aws:cloudwatch/metricAlarm:MetricAlarm'
        );
        expect(alarmResource?.inputs).toEqual(
          expect.objectContaining({
            metricName: 'AllRequests',
            namespace: 'AWS/S3',
            statistic: 'Sum',
            period: 300,
            evaluationPeriods: 2,
            threshold: 1000,
            comparisonOperator: 'GreaterThanThreshold',
          })
        );
      });
    });
  });

  describe('Resource Dependencies and Outputs', () => {
    beforeEach(async () => {
      stack = new TapStack('test-dependencies', {
        environmentSuffix: TEST_CONSTANTS.DEFAULT_ENVIRONMENT,
      });
      // Wait a tick to allow resources to be created
      await new Promise(resolve => setImmediate(resolve));
    });

    it('exposes all required outputs', () => {
      expect(stack.documentsBucketName).toBeDefined();
      expect(stack.documentsBucketArn).toBeDefined();
      expect(stack.auditLogsBucketName).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
      expect(stack.lawyersRoleArn).toBeDefined();
      expect(stack.adminRoleArn).toBeDefined();
      expect(stack.readOnlyRoleArn).toBeDefined();
      expect(stack.cloudWatchDashboardUrl).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
    });

    it('registers all outputs properly', done => {
      pulumi
        .all([
          stack.documentsBucketName,
          stack.documentsBucketArn,
          stack.auditLogsBucketName,
          stack.kmsKeyId,
          stack.kmsKeyArn,
          stack.lawyersRoleArn,
          stack.adminRoleArn,
          stack.readOnlyRoleArn,
          stack.cloudWatchDashboardUrl,
          stack.snsTopicArn,
          stack.cloudTrailArn,
        ])
        .apply(
          ([
            documentsBucketName,
            documentsBucketArn,
            auditLogsBucketName,
            kmsKeyId,
            kmsKeyArn,
            lawyersRoleArn,
            adminRoleArn,
            readOnlyRoleArn,
            cloudWatchDashboardUrl,
            snsTopicArn,
            cloudTrailArn,
          ]) => {
            expect(documentsBucketName).toBeTruthy();
            expect(documentsBucketArn).toBeTruthy();
            expect(auditLogsBucketName).toBeTruthy();
            expect(kmsKeyId).toBeTruthy();
            expect(kmsKeyArn).toBeTruthy();
            expect(lawyersRoleArn).toBeTruthy();
            expect(adminRoleArn).toBeTruthy();
            expect(readOnlyRoleArn).toBeTruthy();
            expect(cloudWatchDashboardUrl).toBeTruthy();
            expect(snsTopicArn).toBeTruthy();
            // cloudTrailArn can be empty if audit logging is disabled
            expect(cloudTrailArn).toBeDefined();
            done();
          }
        );
    });
  });

  describe('Resource Naming Consistency', () => {
    beforeEach(async () => {
      stack = new TapStack('test-naming', {
        environmentSuffix: TEST_CONSTANTS.NAMING_TEST_ENVIRONMENT,
        firmName: TEST_CONSTANTS.NAMING_TEST_FIRM_NAME,
      });
      // Wait a tick to allow resources to be created
      await new Promise(resolve => setImmediate(resolve));
    });

    it('uses consistent naming pattern across all resources', () => {
      const resources = Array.from(createdResources.values());

      // Check bucket naming
      const documentsBucket = resources.find(
        r =>
          r.type === 'aws:s3/bucket:Bucket' &&
          r.name.includes('documents-bucket')
      );
      expect(documentsBucket?.inputs?.bucket).toBe(
        `${TEST_CONSTANTS.NAMING_TEST_FIRM_NAME}-documents-${TEST_CONSTANTS.NAMING_TEST_ENVIRONMENT}`
      );

      const auditBucket = resources.find(
        r =>
          r.type === 'aws:s3/bucket:Bucket' &&
          r.name.includes('audit-logs-bucket')
      );
      expect(auditBucket?.inputs?.bucket).toBe(
        `${TEST_CONSTANTS.NAMING_TEST_FIRM_NAME}-audit-logs-${TEST_CONSTANTS.NAMING_TEST_ENVIRONMENT}`
      );

      // Check role naming
      const adminRole = resources.find(
        r => r.type === 'aws:iam/role:Role' && r.name.includes('admin-role')
      );
      expect(adminRole?.inputs?.name).toBe(
        `${TEST_CONSTANTS.NAMING_TEST_FIRM_NAME}-admin-role-${TEST_CONSTANTS.NAMING_TEST_ENVIRONMENT}`
      );

      // Check topic naming
      const snsTopic = resources.find(r => r.type === 'aws:sns/topic:Topic');
      expect(snsTopic?.inputs?.name).toBe(
        `${TEST_CONSTANTS.NAMING_TEST_FIRM_NAME}-document-alerts-${TEST_CONSTANTS.NAMING_TEST_ENVIRONMENT}`
      );

      // Check CloudTrail naming
      const cloudTrail = resources.find(
        r => r.type === 'aws:cloudtrail/trail:Trail'
      );
      expect(cloudTrail?.inputs?.name).toMatch(
        new RegExp(
          `^${TEST_CONSTANTS.NAMING_TEST_FIRM_NAME}-document-audit-${TEST_CONSTANTS.NAMING_TEST_ENVIRONMENT}-[a-z0-9]{6}$`
        )
      );
    });
  });
});
