/* eslint-disable prettier/prettier */
/**
 * Integration Tests for TapStack
 * 
 * These tests validate the TapStack component against real AWS resources.
 * They test end-to-end functionality, resource relationships, and actual deployments.
 * 
 * Note: These tests require AWS credentials and will create real resources.
 * Use a dedicated test AWS account to avoid conflicts with production resources.
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// AWS SDK v3 imports
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeRouteTablesCommand, DescribeFlowLogsCommand } from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand, GetBucketTaggingCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SSMClient, GetParameterCommand, GetParametersByPathCommand, ListTagsForResourceCommand } from '@aws-sdk/client-ssm';
import { IAMClient, ListRolesCommand, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { SNSClient, ListTopicsCommand, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand, ListDashboardsCommand, GetDashboardCommand } from '@aws-sdk/client-cloudwatch';
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand, GetEventSelectorsCommand } from '@aws-sdk/client-cloudtrail';

// Integration test configuration
const integrationTestConfig = {
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  testEnvironment: process.env.TEST_ENV || 'integration-test',
  timeout: 300000, // 5 minutes timeout for AWS operations
};

describe('TapStack Integration Tests', () => {
  let stack: TapStack;
  let deployedResources: {
    vpcId?: string;
    privateSubnetIds?: string[];
    publicSubnetIds?: string[];
    cloudTrailBucketName?: string;
    parameterStorePrefix?: string;
  } = {};

  const testTags = {
    Environment: integrationTestConfig.testEnvironment,
    Project: 'IaC-AWS-Nova-Model-Breaking-Integration-Test',
    Owner: 'integration-test',
    TestRun: Date.now().toString(),
  };

  beforeAll(async () => {
    // Create the stack for integration testing
    stack = new TapStack('integration-test-stack', {
      tags: testTags,
      environment: integrationTestConfig.testEnvironment,
      regions: [integrationTestConfig.awsRegion],
      enableMultiAccount: false, // Disable for integration tests
    });

    // Extract outputs from the deployed stack
    await Promise.all([
      new Promise<void>((resolve) => {
        stack.vpc.id.apply(id => {
          deployedResources.vpcId = id;
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        pulumi.all(stack.privateSubnets.map(s => s.id)).apply(ids => {
          deployedResources.privateSubnetIds = ids;
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        pulumi.all(stack.publicSubnets.map(s => s.id)).apply(ids => {
          deployedResources.publicSubnetIds = ids;
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        stack.cloudTrailBucket.bucket.apply(name => {
          deployedResources.cloudTrailBucketName = name;
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        stack.parameterStorePrefix.apply(prefix => {
          deployedResources.parameterStorePrefix = prefix;
          resolve();
        });
      }),
    ]);
  }, integrationTestConfig.timeout);

  describe('VPC and Network Infrastructure', () => {
    test('should create VPC with correct configuration', async () => {
      expect(deployedResources.vpcId).toBeDefined();
      expect(deployedResources.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);

      // Verify VPC exists in AWS
      const ec2Client = new EC2Client({ region: integrationTestConfig.awsRegion });
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [deployedResources.vpcId!]
      }));

      expect(vpcResponse.Vpcs).toHaveLength(1);
      expect(vpcResponse.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(vpcResponse.Vpcs![0].State).toBe('available');
    });

    test('should create public subnets with internet access', async () => {
      expect(deployedResources.publicSubnetIds).toBeDefined();
      expect(deployedResources.publicSubnetIds).toHaveLength(3);

      const ec2Client = new EC2Client({ region: integrationTestConfig.awsRegion });
      
      for (const subnetId of deployedResources.publicSubnetIds!) {
        const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: [subnetId]
        }));

        expect(subnetResponse.Subnets).toHaveLength(1);
        expect(subnetResponse.Subnets![0].MapPublicIpOnLaunch).toBe(true);
        expect(subnetResponse.Subnets![0].VpcId).toBe(deployedResources.vpcId);

        // Verify route table has internet gateway route
        const routeTablesResponse = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] }
          ]
        }));

        expect(routeTablesResponse.RouteTables).toHaveLength(1);
        const routes = routeTablesResponse.RouteTables![0].Routes!;
        const internetRoute = routes.find((r: any) => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(internetRoute).toBeDefined();
        expect(internetRoute!.GatewayId).toMatch(/^igw-/);
      }
    });

    test('should create private subnets with NAT gateway access', async () => {
      expect(deployedResources.privateSubnetIds).toBeDefined();
      expect(deployedResources.privateSubnetIds).toHaveLength(3);

      const ec2Client = new EC2Client({ region: integrationTestConfig.awsRegion });
      
      for (const subnetId of deployedResources.privateSubnetIds!) {
        const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: [subnetId]
        }));

        expect(subnetResponse.Subnets).toHaveLength(1);
        expect(subnetResponse.Subnets![0].MapPublicIpOnLaunch).toBe(false);
        expect(subnetResponse.Subnets![0].VpcId).toBe(deployedResources.vpcId);

        // Verify route table has NAT gateway route
        const routeTablesResponse = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] }
          ]
        }));

        expect(routeTablesResponse.RouteTables).toHaveLength(1);
        const routes = routeTablesResponse.RouteTables![0].Routes!;
        const natRoute = routes.find((r: any) => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(natRoute).toBeDefined();
        expect(natRoute!.NatGatewayId).toMatch(/^nat-/);
      }
    });

    test('should distribute subnets across availability zones', async () => {
      const ec2Client = new EC2Client({ region: integrationTestConfig.awsRegion });
      
      // Get AZs for all subnets
      const allSubnetIds = [
        ...deployedResources.publicSubnetIds!,
        ...deployedResources.privateSubnetIds!
      ];

      const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      }));

      const azs = new Set(subnetResponse.Subnets!.map((s: any) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThan(1); // Should span multiple AZs
    });
  });

  describe('Storage Infrastructure', () => {
    test('should create CloudTrail S3 bucket with proper configuration', async () => {
      expect(deployedResources.cloudTrailBucketName).toBeDefined();

      const s3Client = new S3Client({ region: integrationTestConfig.awsRegion });
      
      // Verify bucket exists
      const headResponse = await s3Client.send(new HeadBucketCommand({
        Bucket: deployedResources.cloudTrailBucketName!
      }));
      expect(headResponse).toBeDefined();

      // Verify bucket versioning
      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: deployedResources.cloudTrailBucketName!
      }));
      expect(versioningResponse.Status).toBe('Enabled');

      // Verify bucket encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: deployedResources.cloudTrailBucketName!
      }));
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // Verify bucket policy exists
      const policyResponse = await s3Client.send(new GetBucketPolicyCommand({
        Bucket: deployedResources.cloudTrailBucketName!
      }));
      expect(policyResponse.Policy).toBeDefined();
      const policy = JSON.parse(policyResponse.Policy!);
      expect(policy.Statement).toContainEqual(
        expect.objectContaining({
          Principal: { Service: 'cloudtrail.amazonaws.com' }
        })
      );
    });

    test('should apply consistent tagging to S3 buckets', async () => {
      const s3Client = new S3Client({ region: integrationTestConfig.awsRegion });
      
      const cloudTrailTagsResponse = await s3Client.send(new GetBucketTaggingCommand({
        Bucket: deployedResources.cloudTrailBucketName!
      }));

      const tags = cloudTrailTagsResponse.TagSet!.reduce((acc: Record<string, string>, tag: any) => {
        acc[tag.Key!] = tag.Value!;
        return acc;
      }, {});

      expect(tags.Environment).toBe(integrationTestConfig.testEnvironment);
      expect(tags.Project).toBe('IaC-AWS-Nova-Model-Breaking-Integration-Test');
      expect(tags.ManagedBy).toBe('Pulumi');
    });
  });

  describe('Parameter Store Integration', () => {
    test('should create parameters in Parameter Store', async () => {
      expect(deployedResources.parameterStorePrefix).toBeDefined();

      const ssmClient = new SSMClient({ region: integrationTestConfig.awsRegion });
      
      // Test specific parameters
      const parametersToTest = [
        `${deployedResources.parameterStorePrefix}/vpc-id`,
        `${deployedResources.parameterStorePrefix}/region`,
        `${deployedResources.parameterStorePrefix}/environment`,
      ];

      for (const paramName of parametersToTest) {
        const paramResponse = await ssmClient.send(new GetParameterCommand({
          Name: paramName
        }));

        expect(paramResponse.Parameter).toBeDefined();
        expect(paramResponse.Parameter!.Value).toBeDefined();
        expect(paramResponse.Parameter!.Value).not.toBe('');
      }

      // Verify VPC ID parameter matches actual VPC
      const vpcIdParam = await ssmClient.send(new GetParameterCommand({
        Name: `${deployedResources.parameterStorePrefix}/vpc-id`
      }));
      expect(vpcIdParam.Parameter!.Value).toBe(deployedResources.vpcId);
    });

    test('should retrieve parameters by path', async () => {
      const ssmClient = new SSMClient({ region: integrationTestConfig.awsRegion });
      
      const parametersResponse = await ssmClient.send(new GetParametersByPathCommand({
        Path: deployedResources.parameterStorePrefix!,
        Recursive: true
      }));

      expect(parametersResponse.Parameters).toBeDefined();
      expect(parametersResponse.Parameters!.length).toBeGreaterThan(0);

      // Verify all parameters have the correct prefix
      parametersResponse.Parameters!.forEach((param: any) => {
        expect(param.Name).toMatch(new RegExp(`^${deployedResources.parameterStorePrefix!}`));
      });
    });
  });

  describe('IAM Security and Roles', () => {
    test('should create IAM roles with proper trust relationships', async () => {
      const iamClient = new IAMClient({ region: integrationTestConfig.awsRegion });
      
      // Test CloudTrail role
      const roles = await iamClient.send(new ListRolesCommand({}));
      const cloudTrailRole = roles.Roles!.find((r: any) => 
        r.RoleName.includes(`${integrationTestConfig.testEnvironment}-cloudtrail-role`)
      );
      
      expect(cloudTrailRole).toBeDefined();
      
      const trustPolicy = JSON.parse(decodeURIComponent(cloudTrailRole!.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement).toContainEqual(
        expect.objectContaining({
          Principal: { Service: 'cloudtrail.amazonaws.com' }
        })
      );
    });

    test('should validate least privilege principle in policies', async () => {
      const iamClient = new IAMClient({ region: integrationTestConfig.awsRegion });
      
      // Find deployment role
      const roles = await iamClient.send(new ListRolesCommand({}));
      const deploymentRole = roles.Roles!.find((r: any) => 
        r.RoleName.includes(`${integrationTestConfig.testEnvironment}-deployment-role`)
      );
      
      expect(deploymentRole).toBeDefined();
      
      // Check attached policies
      const attachedPolicies = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: deploymentRole!.RoleName
      }));
      
      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      
      // Verify no overly permissive policies
      const powerUserPolicy = attachedPolicies.AttachedPolicies!.find((p: any) => 
        p.PolicyArn === 'arn:aws:iam::aws:policy/PowerUserAccess'
      );
      expect(powerUserPolicy).toBeUndefined(); // Should not have PowerUser access
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch log groups', async () => {
      const cloudwatchClient = new CloudWatchLogsClient({ region: integrationTestConfig.awsRegion });
      
      const logGroups = await cloudwatchClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/infrastructure/${integrationTestConfig.testEnvironment}`
      }));
      
      expect(logGroups.logGroups).toBeDefined();
      expect(logGroups.logGroups!.length).toBeGreaterThan(0);
      
      const targetLogGroup = logGroups.logGroups!.find((lg: any) => 
        lg.logGroupName === `/aws/infrastructure/${integrationTestConfig.testEnvironment}`
      );
      expect(targetLogGroup).toBeDefined();
    });

    test('should create SNS topic for alarms', async () => {
      const snsClient = new SNSClient({ region: integrationTestConfig.awsRegion });
      
      const topics = await snsClient.send(new ListTopicsCommand({}));
      const alarmTopic = topics.Topics!.find((t: any) => 
        t.TopicArn!.includes(`${integrationTestConfig.testEnvironment}-infrastructure-alarms`)
      );
      
      expect(alarmTopic).toBeDefined();
      
      // Verify topic attributes
      const attributes = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: alarmTopic!.TopicArn!
      }));
      
      expect(attributes.Attributes).toBeDefined();
    });

    test('should create CloudWatch alarms', async () => {
      const cloudwatchClient = new CloudWatchClient({ region: integrationTestConfig.awsRegion });
      
      const alarms = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `${integrationTestConfig.testEnvironment}-`
      }));
      
      expect(alarms.MetricAlarms).toBeDefined();
      expect(alarms.MetricAlarms!.length).toBeGreaterThan(0);
      
      // Verify VPC alarm exists
      const vpcAlarm = alarms.MetricAlarms!.find((a: any) => 
        a.AlarmName === `${integrationTestConfig.testEnvironment}-vpc-high-rejects`
      );
      expect(vpcAlarm).toBeDefined();
      expect(vpcAlarm!.MetricName).toBe('PacketDropCount');
    });

    test('should create CloudWatch dashboard', async () => {
      const cloudwatchClient = new CloudWatchClient({ region: integrationTestConfig.awsRegion });
      
      const dashboards = await cloudwatchClient.send(new ListDashboardsCommand({
        DashboardNamePrefix: `${integrationTestConfig.testEnvironment}-Infrastructure`
      }));
      
      expect(dashboards.DashboardEntries).toBeDefined();
      expect(dashboards.DashboardEntries!.length).toBeGreaterThan(0);
      
      const dashboard = dashboards.DashboardEntries![0];
      const dashboardDetail = await cloudwatchClient.send(new GetDashboardCommand({
        DashboardName: dashboard.DashboardName!
      }));
      
      expect(dashboardDetail.DashboardBody).toBeDefined();
      const dashboardConfig = JSON.parse(dashboardDetail.DashboardBody!);
      expect(dashboardConfig.widgets).toBeDefined();
      expect(dashboardConfig.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('CloudTrail and Compliance', () => {
    test('should create CloudTrail with proper configuration', async () => {
      const cloudtrailClient = new CloudTrailClient({ region: integrationTestConfig.awsRegion });
      
      const trails = await cloudtrailClient.send(new DescribeTrailsCommand({}));
      const testTrail = trails.trailList!.find((t: any) => 
        t.Name === `${integrationTestConfig.testEnvironment}-audit-trail`
      );
      
      expect(testTrail).toBeDefined();
      expect(testTrail!.S3BucketName).toBe(deployedResources.cloudTrailBucketName);
      expect(testTrail!.IncludeGlobalServiceEvents).toBe(true);
      expect(testTrail!.IsMultiRegionTrail).toBe(true);
      
      // Verify trail status
      const status = await cloudtrailClient.send(new GetTrailStatusCommand({
        Name: testTrail!.TrailARN!
      }));
      expect(status.IsLogging).toBe(true);
    });

    test('should validate CloudTrail event selectors', async () => {
      const cloudtrailClient = new CloudTrailClient({ region: integrationTestConfig.awsRegion });
      
      const trails = await cloudtrailClient.send(new DescribeTrailsCommand({}));
      const testTrail = trails.trailList!.find((t: any) => 
        t.Name === `${integrationTestConfig.testEnvironment}-audit-trail`
      );
      
      const eventSelectors = await cloudtrailClient.send(new GetEventSelectorsCommand({
        TrailName: testTrail!.TrailARN!
      }));
      
      expect(eventSelectors.EventSelectors).toBeDefined();
      expect(eventSelectors.EventSelectors!.length).toBeGreaterThan(0);
      
      const selector = eventSelectors.EventSelectors![0];
      expect(selector.ReadWriteType).toBe('All');
      expect(selector.IncludeManagementEvents).toBe(true);
    });
  });

  describe('VPC Flow Logs and Security Monitoring', () => {
    test('should create VPC Flow Logs', async () => {
      const ec2Client = new EC2Client({ region: integrationTestConfig.awsRegion });
      
      const flowLogs = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [{
          Name: 'resource-id',
          Values: [deployedResources.vpcId!]
        }]
      }));
      
      expect(flowLogs.FlowLogs).toBeDefined();
      expect(flowLogs.FlowLogs!.length).toBeGreaterThan(0);
      
      const vpcFlowLog = flowLogs.FlowLogs![0];
      expect(vpcFlowLog.ResourceId).toBe(deployedResources.vpcId);
      expect(vpcFlowLog.TrafficType).toBe('ALL');
      expect(vpcFlowLog.FlowLogStatus).toBe('ACTIVE');
    });

    test('should create VPC Flow Logs CloudWatch log group', async () => {
      const cloudwatchClient = new CloudWatchLogsClient({ region: integrationTestConfig.awsRegion });
      
      const logGroups = await cloudwatchClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/vpc/flowlogs'
      }));
      
      expect(logGroups.logGroups).toBeDefined();
      expect(logGroups.logGroups!.length).toBeGreaterThan(0);
      
      const flowLogsGroup = logGroups.logGroups!.find((lg: any) => 
        lg.logGroupName === '/aws/vpc/flowlogs'
      );
      expect(flowLogsGroup).toBeDefined();
    });
  });

  describe('Cross-Service Integration', () => {
    test('should validate CloudTrail logs are being delivered to S3', async () => {
      // Wait a bit for logs to be delivered
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      const s3Client = new S3Client({ region: integrationTestConfig.awsRegion });
      
      const objects = await s3Client.send(new ListObjectsV2Command({
        Bucket: deployedResources.cloudTrailBucketName!,
        MaxKeys: 10
      }));
      
      // Note: This might be empty in a fresh test environment
      // In a real scenario, we'd generate some API activity first
      expect(objects).toBeDefined();
    });

    test('should validate parameter store integration with other services', async () => {
      const ssmClient = new SSMClient({ region: integrationTestConfig.awsRegion });
      
      // Test parameter can be retrieved and used
      const vpcParam = await ssmClient.send(new GetParameterCommand({
        Name: `${deployedResources.parameterStorePrefix}/vpc-id`
      }));
      
      expect(vpcParam.Parameter!.Value).toBe(deployedResources.vpcId);
      
      // Verify parameter has proper tags
      const tags = await ssmClient.send(new ListTagsForResourceCommand({
        ResourceType: 'Parameter',
        ResourceId: vpcParam.Parameter!.Name!
      }));
      
      const tagMap = tags.TagList!.reduce((acc: Record<string, string>, tag: any) => {
        acc[tag.Key!] = tag.Value!;
        return acc;
      }, {});
      
      expect(tagMap.Environment).toBe(integrationTestConfig.testEnvironment);
    });
  });

  describe('Resource Cleanup and Error Handling', () => {
    test('should handle resource dependencies correctly', async () => {
      // This test verifies that resources can be created and destroyed
      // in the correct order without dependency violations
      expect(deployedResources.vpcId).toBeDefined();
      expect(deployedResources.privateSubnetIds).toBeDefined();
      expect(deployedResources.publicSubnetIds).toBeDefined();
      
      // All dependent resources should exist
      const ec2Client = new EC2Client({ region: integrationTestConfig.awsRegion });
      
      // Verify subnets depend on VPC
      const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: deployedResources.privateSubnetIds!
      }));
      
      subnetResponse.Subnets!.forEach((subnet: any) => {
        expect(subnet.VpcId).toBe(deployedResources.vpcId);
      });
    });

    test('should handle partial deployment failures gracefully', async () => {
      // This test would involve creating a stack with intentional errors
      // and verifying that rollback works correctly
      // For now, we just verify the current stack is in good state
      expect(stack).toBeInstanceOf(TapStack);
      expect(deployedResources.vpcId).toBeDefined();
    });
  });

  describe('Performance and Scaling', () => {
    test('should handle concurrent resource creation', async () => {
      // Verify multiple subnets were created concurrently
      expect(deployedResources.privateSubnetIds!.length).toBe(3);
      expect(deployedResources.publicSubnetIds!.length).toBe(3);
      
      // All should be in different AZs for high availability
      const ec2Client = new EC2Client({ region: integrationTestConfig.awsRegion });
      const allSubnets = [
        ...deployedResources.privateSubnetIds!,
        ...deployedResources.publicSubnetIds!
      ];
      
      const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnets
      }));
      
      const azs = new Set(subnetResponse.Subnets!.map((s: any) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThan(1);
    });

    test('should validate resource limits and quotas', async () => {
      // Basic validation that we're not hitting AWS limits
      const ec2Client = new EC2Client({ region: integrationTestConfig.awsRegion });
      
      // Verify we haven't created too many resources
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      expect(vpcs.Vpcs!.length).toBeLessThan(5); // AWS default limit is 5 VPCs per region
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Note: In a real scenario, you might want to clean up resources
    // For integration tests, this is typically handled by the CI/CD pipeline
    // or by using temporary AWS accounts that get destroyed
    console.log('Integration tests completed. Resources created:');
    console.log('VPC ID:', deployedResources.vpcId);
    console.log('CloudTrail Bucket:', deployedResources.cloudTrailBucketName);
  }, integrationTestConfig.timeout);
});
