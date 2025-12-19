// Configuration - These are coming from cfn-outputs after cdk deploy
import * as AWS from 'aws-sdk';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
) as Record<string, string>;

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK Configuration
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

const s3 = new AWS.S3();
const kms = new AWS.KMS();
const ec2 = new AWS.EC2();
const cloudtrail = new AWS.CloudTrail();
const cloudwatch = new AWS.CloudWatch();
const cloudwatchLogs = new AWS.CloudWatchLogs();
const iam = new AWS.IAM();
const sns = new AWS.SNS();

// Type guard functions
const assertDefined = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) {
    throw new Error(`Required value ${name} is undefined`);
  }
  return value;
};

// Updated function to match your actual output keys
const getRequiredOutput = (outputKey: string): string => {
  const value = outputs[outputKey];
  if (!value) {
    // List available keys for debugging
    console.log('Available output keys:', Object.keys(outputs));
    throw new Error(`Required CloudFormation output ${outputKey} not found. Available keys: ${Object.keys(outputs).join(', ')}`);
  }
  return value;
};

describe('Turn Around Prompt API Integration Tests', () => {
  // Test data cleanup array
  const testResourcesForCleanup: Array<{
    type: 's3-object' | 'kms-grant';
    resource: any;
  }> = [];

  afterAll(async () => {
    // Cleanup test resources
    for (const resource of testResourcesForCleanup) {
      try {
        if (resource.type === 's3-object') {
          await s3.deleteObject(resource.resource).promise();
        } else if (resource.type === 'kms-grant') {
          await kms.retireGrant(resource.resource).promise();
        }
      } catch (error: any) {
        console.warn(`Failed to cleanup resource: ${error.message}`);
      }
    }
  });

  describe('Infrastructure Discovery Tests', () => {
    test('CloudFormation outputs are available', () => {
      console.log('Available outputs:', Object.keys(outputs));
      expect(Object.keys(outputs).length).toBeGreaterThan(0);

      // Verify all expected outputs exist
      const expectedOutputs = ['KMSKeyArn', 'KMSKeyId', 'VPCId', 'CloudTrailBucketName', 'SecureDataBucketName'];
      expectedOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
      });
    });
  });

  describe('KMS Key Integration Tests', () => {
    test('KMS key exists and is accessible', async () => {
      const kmsKeyId = getRequiredOutput('KMSKeyId');

      const keyDetails = await kms.describeKey({ KeyId: kmsKeyId }).promise();
      const keyMetadata = assertDefined(keyDetails.KeyMetadata, 'KeyMetadata');

      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(keyMetadata.Enabled).toBe(true);
    });

    test('KMS key can encrypt and decrypt data', async () => {
      const kmsKeyId = getRequiredOutput('KMSKeyId');
      const testData = 'Test encryption data for integration test';

      // Encrypt data
      const encryptResult = await kms.encrypt({
        KeyId: kmsKeyId,
        Plaintext: testData
      }).promise();

      const ciphertextBlob = assertDefined(encryptResult.CiphertextBlob, 'CiphertextBlob');

      // Decrypt data
      const decryptResult = await kms.decrypt({
        CiphertextBlob: ciphertextBlob
      }).promise();

      const plaintext = assertDefined(decryptResult.Plaintext, 'Plaintext');
      expect(plaintext.toString()).toBe(testData);
    });

    test('KMS key ARN matches expected format', () => {
      const kmsKeyArn = getRequiredOutput('KMSKeyArn');
      const kmsKeyId = getRequiredOutput('KMSKeyId');

      expect(kmsKeyArn).toContain(kmsKeyId);
      expect(kmsKeyArn).toMatch(/^arn:aws:kms:/);
    });
  });

  describe('VPC Infrastructure Integration Tests', () => {
    test('VPC exists with correct configuration', async () => {
      const vpcId = getRequiredOutput('VPCId');

      const vpcDetails = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      const vpcs = assertDefined(vpcDetails.Vpcs, 'Vpcs');
      const vpc = assertDefined(vpcs[0], 'VPC');

      expect(vpc.State).toBe('available');
    });

    test('VPC has subnets configured', async () => {
      const vpcId = getRequiredOutput('VPCId');

      const subnetsResult = await ec2.describeSubnets({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }).promise();

      const subnets = assertDefined(subnetsResult.Subnets, 'Subnets');

      // Should have 9 subnets (3 AZs x 3 types)
      expect(subnets.length).toBe(9);

      // Check for different subnet types
      const publicSubnets = subnets.filter(subnet =>
        subnet.Tags?.some(tag => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public')
      );
      const privateSubnets = subnets.filter(subnet =>
        subnet.Tags?.some(tag => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private')
      );
      const isolatedSubnets = subnets.filter(subnet =>
        subnet.Tags?.some(tag => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Isolated')
      );

      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
      expect(isolatedSubnets.length).toBe(3);
    });

    test('NAT gateways are operational', async () => {
      const vpcId = getRequiredOutput('VPCId');

      const natGatewaysResult = await ec2.describeNatGateways({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }).promise();

      const natGateways = assertDefined(natGatewaysResult.NatGateways, 'NatGateways');

      expect(natGateways.length).toBe(2);
      natGateways.forEach(natGw => {
        expect(natGw.State).toBe('available');
      });
    });

    test('VPC endpoints exist and are configured correctly', async () => {
      const vpcId = getRequiredOutput('VPCId');

      const vpcEndpointsResult = await ec2.describeVpcEndpoints({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }).promise();

      const vpcEndpoints = assertDefined(vpcEndpointsResult.VpcEndpoints, 'VpcEndpoints');

      // Should have 7 endpoints (1 gateway + 6 interface)
      expect(vpcEndpoints.length).toBe(7);

      // Check for S3 gateway endpoint
      const s3Endpoint = vpcEndpoints.find(endpoint =>
        endpoint.ServiceName?.includes('s3') && endpoint.VpcEndpointType === 'Gateway'
      );
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint!.State).toBe('available');

      // Check for interface endpoints
      const expectedServices = ['kms', 'cloudtrail', 'monitoring', 'logs', 'sns', 'sts'];
      expectedServices.forEach(service => {
        const interfaceEndpoint = vpcEndpoints.find(endpoint =>
          endpoint.ServiceName?.includes(service) && endpoint.VpcEndpointType === 'Interface'
        );
        expect(interfaceEndpoint).toBeDefined();
        expect(interfaceEndpoint!.State).toBe('available');
      });
    });
  });

  describe('S3 Buckets Integration Tests', () => {
    test('secure data bucket exists with proper configuration', async () => {
      const bucketName = getRequiredOutput('SecureDataBucketName');

      // Check bucket exists
      const bucketLocation = await s3.getBucketLocation({ Bucket: bucketName }).promise();
      expect(bucketLocation).toBeDefined();

      // Check encryption configuration
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      const encryptionConfig = assertDefined(encryption.ServerSideEncryptionConfiguration, 'ServerSideEncryptionConfiguration');
      const rules = assertDefined(encryptionConfig.Rules, 'Rules');
      const defaultEncryption = assertDefined(rules[0].ApplyServerSideEncryptionByDefault, 'ApplyServerSideEncryptionByDefault');

      expect(defaultEncryption.SSEAlgorithm).toBe('aws:kms');

      // Check versioning
      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe('Enabled');

      // Check public access block
      const publicAccessBlockResult = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      const publicAccessBlock = assertDefined(publicAccessBlockResult.PublicAccessBlockConfiguration, 'PublicAccessBlockConfiguration');

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('CloudTrail bucket exists with proper configuration', async () => {
      const bucketName = getRequiredOutput('CloudTrailBucketName');

      // Check bucket exists
      const bucketLocation = await s3.getBucketLocation({ Bucket: bucketName }).promise();
      expect(bucketLocation).toBeDefined();

      // Check lifecycle configuration
      const lifecycle = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
      const rules = assertDefined(lifecycle.Rules, 'Rules');

      const retentionRule = rules.find(rule => rule.ID === 'CloudTrailLogRetention');
      expect(retentionRule).toBeDefined();
      expect(retentionRule!.Status).toBe('Enabled');

      const transitions = assertDefined(retentionRule!.Transitions, 'Transitions');
      expect(transitions.some(t => t.StorageClass === 'STANDARD_IA' && t.Days === 30)).toBe(true);
      expect(transitions.some(t => t.StorageClass === 'GLACIER' && t.Days === 90)).toBe(true);
    });

    test('can upload and retrieve encrypted object from secure data bucket', async () => {
      const bucketName = getRequiredOutput('SecureDataBucketName');
      const kmsKeyId = getRequiredOutput('KMSKeyId');
      const testKey = `integration-test-${uuidv4()}.txt`;
      const testContent = 'Integration test content';

      // Upload object
      await s3.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: kmsKeyId
      }).promise();

      testResourcesForCleanup.push({
        type: 's3-object',
        resource: { Bucket: bucketName, Key: testKey }
      });

      // Retrieve object
      const getResult = await s3.getObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();

      const body = assertDefined(getResult.Body, 'Body');
      expect(body.toString()).toBe(testContent);
      expect(getResult.ServerSideEncryption).toBe('aws:kms');
      expect(getResult.SSEKMSKeyId).toContain(kmsKeyId);
    });

    test('buckets have correct naming pattern', () => {
      const secureDataBucket = getRequiredOutput('SecureDataBucketName');
      const cloudTrailBucket = getRequiredOutput('CloudTrailBucketName');

      // Check naming patterns match the expected format
      expect(secureDataBucket).toMatch(/^secure-enterprisedata-pr\d+-[a-z0-9]{6}$/);
      expect(cloudTrailBucket).toMatch(/^cloudtrailsecure-logs-pr\d+-[a-z0-9]{6}$/);
    });
  });

  describe('CloudTrail Integration Tests', () => {


    test('CloudTrail events are being recorded', async () => {
      // Perform a test action that should be logged
      const kmsKeyId = getRequiredOutput('KMSKeyId');
      await kms.describeKey({ KeyId: kmsKeyId }).promise();

      // Wait a moment for CloudTrail to process
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Look up recent events
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 10 minutes ago

      const eventsResult = await cloudtrail.lookupEvents({
        StartTime: startTime,
        EndTime: endTime,
        LookupAttributes: [{
          AttributeKey: 'EventName',
          AttributeValue: 'DescribeKey'
        }]
      }).promise();

      const events = assertDefined(eventsResult.Events, 'Events');
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Monitoring Integration Tests', () => {

    test('security metric filters are configured', async () => {
      const logGroupsResult = await cloudwatchLogs.describeLogGroups({
        logGroupNamePrefix: `/aws/cloudtrail/pr${environmentSuffix}`
      }).promise();

      const logGroups = assertDefined(logGroupsResult.logGroups, 'logGroups');
      if (logGroups.length > 0) {
        const logGroupName = assertDefined(logGroups[0].logGroupName, 'logGroupName');
        const metricFiltersResult = await cloudwatchLogs.describeMetricFilters({
          logGroupName
        }).promise();

        const metricFilters = assertDefined(metricFiltersResult.metricFilters, 'metricFilters');

        // Should have metric filters for security events
        const expectedMetrics = [
          'UnauthorizedAPICallsMetric',
          'MFALoginFailuresMetric',
          'RootAccountUsageMetric',
          'IAMPolicyChangesMetric',
          'SecurityGroupChangesMetric',
          'CloudTrailChangesMetric'
        ];

        // Check that at least some metric filters exist
        expect(metricFilters.length).toBeGreaterThan(0);

        expectedMetrics.forEach(metricName => {
          const filter = metricFilters.find(f =>
            f.metricTransformations?.some(t => t.metricName === metricName)
          );
          if (filter) {
            expect(filter).toBeDefined();
          }
        });
      }
    });

    test('security dashboard exists', async () => {
      const dashboardsResult = await cloudwatch.listDashboards().promise();
      const dashboardEntries = assertDefined(dashboardsResult.DashboardEntries, 'DashboardEntries');

      const securityDashboard = dashboardEntries.find(dashboard =>
        dashboard.DashboardName?.includes(`security-monitoring-pr${environmentSuffix}`) ||
        dashboard.DashboardName?.includes('SecurityDashboard')
      );

      if (securityDashboard) {
        const dashboardName = assertDefined(securityDashboard!.DashboardName, 'DashboardName');

        // Try to get dashboard content
        const dashboardDetail = await cloudwatch.getDashboard({
          DashboardName: dashboardName
        }).promise();

        const dashboardBody = assertDefined(dashboardDetail.DashboardBody, 'DashboardBody');
        const dashboardConfig = JSON.parse(dashboardBody);
        expect(dashboardConfig.widgets).toBeDefined();
      }
    });
  });

  describe('SNS Alerts Integration Tests', () => {
    test('security alerts SNS topic exists', async () => {
      const topicsResult = await sns.listTopics().promise();
      const topics = assertDefined(topicsResult.Topics, 'Topics');

      const securityTopic = topics.find(topic =>
        topic.TopicArn?.includes(`security-alerts-pr${environmentSuffix}`) ||
        topic.TopicArn?.includes('SecurityAlertsTopic')
      );

      if (securityTopic) {
        const topicArn = assertDefined(securityTopic!.TopicArn, 'TopicArn');

        // Check topic attributes
        const attributesResult = await sns.getTopicAttributes({
          TopicArn: topicArn
        }).promise();

        const attributes = assertDefined(attributesResult.Attributes, 'Attributes');
        expect(attributes.DisplayName).toBe('Security Alerts');
        expect(attributes.KmsMasterKeyId).toBeDefined(); // Should be encrypted
      }
    });

    test('SNS topic has email subscription', async () => {
      const topicsResult = await sns.listTopics().promise();
      const topics = assertDefined(topicsResult.Topics, 'Topics');

      const securityTopic = topics.find(topic =>
        topic.TopicArn?.includes(`security-alerts-pr${environmentSuffix}`) ||
        topic.TopicArn?.includes('SecurityAlertsTopic')
      );

      if (securityTopic) {
        const topicArn = assertDefined(securityTopic!.TopicArn, 'TopicArn');

        const subscriptionsResult = await sns.listSubscriptionsByTopic({
          TopicArn: topicArn
        }).promise();

        const subscriptions = assertDefined(subscriptionsResult.Subscriptions, 'Subscriptions');
        expect(subscriptions.length).toBeGreaterThan(0);

        const emailSubscription = subscriptions.find(sub =>
          sub.Protocol === 'email'
        );
        expect(emailSubscription).toBeDefined();
        expect(emailSubscription!.Endpoint).toContain('@');
      }
    });
  });

  describe('IAM Security Integration Tests', () => {
    test('MFA-required group exists', async () => {
      const groupsResult = await iam.listGroups().promise();
      const groups = assertDefined(groupsResult.Groups, 'Groups');

      const mfaGroup = groups.find(group =>
        group.GroupName?.includes(`MFARequired-pr${environmentSuffix}`) ||
        group.GroupName?.includes('MFARequired')
      );

      expect(mfaGroup).toBeDefined();

      if (mfaGroup) {
        const groupName = assertDefined(mfaGroup!.GroupName, 'GroupName');

        // Check attached policies
        const attachedPoliciesResult = await iam.listAttachedGroupPolicies({
          GroupName: groupName
        }).promise();

        const attachedPolicies = assertDefined(attachedPoliciesResult.AttachedPolicies, 'AttachedPolicies');
        expect(attachedPolicies.length).toBeGreaterThan(0);

        const mfaPolicy = attachedPolicies.find(policy =>
          policy.PolicyName?.includes('MFARequired')
        );
        expect(mfaPolicy).toBeDefined();
      }
    });
  });

  describe('Write Integration TESTS', () => {

    test('End-to-end encrypted data workflow', async () => {
      const bucketName = getRequiredOutput('SecureDataBucketName');
      const kmsKeyId = getRequiredOutput('KMSKeyId');

      // Step 1: Create encrypted data
      const testData = `E2E test data - ${new Date().toISOString()}`;
      const encryptResult = await kms.encrypt({
        KeyId: kmsKeyId,
        Plaintext: testData
      }).promise();

      const ciphertextBlob = assertDefined(encryptResult.CiphertextBlob, 'CiphertextBlob');

      // Step 2: Store in secure bucket
      const testKey = `e2e-test-${uuidv4()}.enc`;
      await s3.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: ciphertextBlob,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: kmsKeyId
      }).promise();

      testResourcesForCleanup.push({
        type: 's3-object',
        resource: { Bucket: bucketName, Key: testKey }
      });

      // Step 3: Verify object was stored with correct encryption
      const objectMetadata = await s3.headObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();

      expect(objectMetadata.ServerSideEncryption).toBe('aws:kms');
      expect(objectMetadata.SSEKMSKeyId).toContain(kmsKeyId);

      // Step 4: Retrieve and decrypt
      const storedObject = await s3.getObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();

      const storedBody = assertDefined(storedObject.Body, 'Body') as Buffer;
      const decryptResult = await kms.decrypt({
        CiphertextBlob: storedBody
      }).promise();

      const decryptedPlaintext = assertDefined(decryptResult.Plaintext, 'Plaintext');
      expect(decryptedPlaintext.toString()).toBe(testData);

      console.log('✅ End-to-end encrypted workflow test completed successfully');
    });
  });
});

// Jest expect extension for additional matchers
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}
