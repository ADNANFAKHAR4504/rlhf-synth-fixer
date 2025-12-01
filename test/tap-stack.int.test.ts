import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  LambdaClient,
  GetFunctionCommand,
  ListFunctionsCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import {
  EventBridgeClient,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';

// Dynamically discover stack name from environment
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

interface StackOutputs {
  TagComplianceFunctionArn?: string;
  AMIComplianceFunctionArn?: string;
  DriftDetectionFunctionArn?: string;
  ComplianceReportBucketName?: string;
  ComplianceAlertTopicArn?: string;
  ConfigRecorderName?: string;
  ComplianceDashboardURL?: string;
}

interface StackResource {
  LogicalResourceId: string;
  ResourceType: string;
  ResourceStatus: string;
  PhysicalResourceId?: string;
}

interface DiscoveredResources {
  stackName: string;
  stackOutputs: StackOutputs;
  stackResources: StackResource[];
  stackStatus: string;
}

async function discoverStack(): Promise<DiscoveredResources> {
  const cfnClient = new CloudFormationClient({ region });

  // Try exact match first
  let stackName = `TapStack${environmentSuffix}`;
  let matchingStack;

  try {
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfnClient.send(describeCommand);
    matchingStack = response.Stacks?.[0];
  } catch (error) {
    // Stack not found with exact name, try to discover dynamically
    console.log(`Stack ${stackName} not found, searching for matching stacks...`);

    const listCommand = new DescribeStacksCommand({});
    const allStacks = await cfnClient.send(listCommand);

    // Try to find any TapStack that matches the pattern
    matchingStack = allStacks.Stacks?.find(
      (stack) =>
        stack.StackName?.startsWith('TapStack') &&
        (stack.StackName?.includes(environmentSuffix) ||
          stack.StackName?.endsWith(environmentSuffix)) &&
        stack.StackStatus !== 'DELETE_COMPLETE' &&
        (stack.StackStatus === 'CREATE_COMPLETE' ||
          stack.StackStatus === 'UPDATE_COMPLETE')
    );

    // If still not found, try to find any TapStack
    if (!matchingStack) {
      matchingStack = allStacks.Stacks?.find(
        (stack) =>
          stack.StackName?.startsWith('TapStack') &&
          stack.StackStatus !== 'DELETE_COMPLETE' &&
          (stack.StackStatus === 'CREATE_COMPLETE' ||
            stack.StackStatus === 'UPDATE_COMPLETE')
      );
    }

    if (matchingStack) {
      stackName = matchingStack.StackName!;
    }
  }

  if (!matchingStack) {
    throw new Error(
      `Could not find CloudFormation stack. ` +
        `Searched for: TapStack${environmentSuffix} or TapStack*${environmentSuffix}. ` +
        `Environment suffix: ${environmentSuffix}. ` +
        `Please deploy the stack first.`
    );
  }

  const stackStatus = matchingStack.StackStatus || 'UNKNOWN';

  if (
    !stackStatus.includes('COMPLETE') &&
    !stackStatus.includes('UPDATE_COMPLETE')
  ) {
    throw new Error(
      `Stack ${stackName} is not in a valid state. Current status: ${stackStatus}`
    );
  }

  // Extract outputs
  const stackOutputs: StackOutputs = {};
  if (matchingStack.Outputs) {
    for (const output of matchingStack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        stackOutputs[output.OutputKey as keyof StackOutputs] =
          output.OutputValue;
      }
    }
  }

  // Discover stack resources with pagination
  const stackResources: StackResource[] = [];
  let nextToken: string | undefined;

  do {
    const resourcesCommand = new ListStackResourcesCommand({
      StackName: stackName,
      NextToken: nextToken,
    });
    const resourcesResponse = await cfnClient.send(resourcesCommand);

    if (resourcesResponse.StackResourceSummaries) {
      for (const resource of resourcesResponse.StackResourceSummaries) {
        stackResources.push({
          LogicalResourceId: resource.LogicalResourceId || '',
          ResourceType: resource.ResourceType || '',
          ResourceStatus: resource.ResourceStatus || '',
          PhysicalResourceId: resource.PhysicalResourceId,
        });
      }
    }

    nextToken = resourcesResponse.NextToken;
  } while (nextToken);

  return {
    stackName,
    stackOutputs,
    stackResources,
    stackStatus,
  };
}

describe('Infrastructure Compliance Monitoring System - Integration Tests', () => {
  let discovered: DiscoveredResources;
  const lambdaClient = new LambdaClient({ region });
  const s3Client = new S3Client({ region });
  const snsClient = new SNSClient({ region });
  const configClient = new ConfigServiceClient({ region });
  const eventBridgeClient = new EventBridgeClient({ region });
  const cloudWatchClient = new CloudWatchClient({ region });
  const ssmClient = new SSMClient({ region });

  beforeAll(async () => {
    console.log(
      `🔍 Discovering stack with environment suffix: ${environmentSuffix} in region: ${region}`
    );
    discovered = await discoverStack();
    console.log(`✅ Discovered stack: ${discovered.stackName}`);
    console.log(`📊 Stack status: ${discovered.stackStatus}`);
    console.log(`📦 Discovered ${discovered.stackResources.length} resources`);
    console.log(`📤 Stack outputs:`, Object.keys(discovered.stackOutputs));
  }, 60000);

  describe('Stack Discovery', () => {
    test('should discover CloudFormation stack', () => {
      expect(discovered).toBeDefined();
      expect(discovered.stackName).toBeDefined();
      expect(discovered.stackName).toContain('TapStack');
      expect(discovered.stackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        'TagComplianceFunctionArn',
        'AMIComplianceFunctionArn',
        'DriftDetectionFunctionArn',
        'ComplianceReportBucketName',
        'ComplianceAlertTopicArn',
        'ConfigRecorderName',
        'ComplianceDashboardURL',
      ];

      for (const outputKey of requiredOutputs) {
        expect(discovered.stackOutputs[outputKey as keyof StackOutputs]).toBeDefined();
        expect(discovered.stackOutputs[outputKey as keyof StackOutputs]).not.toBe('');
      }
    });

    test('should have discovered stack resources', () => {
      expect(discovered.stackResources.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Functions', () => {
    test('Tag Compliance Lambda function should exist and be active', async () => {
      const functionArn = discovered.stackOutputs.TagComplianceFunctionArn;
      expect(functionArn).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('AMI Compliance Lambda function should exist and be active', async () => {
      const functionArn = discovered.stackOutputs.AMIComplianceFunctionArn;
      expect(functionArn).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('Drift Detection Lambda function should exist and be active', async () => {
      const functionArn = discovered.stackOutputs.DriftDetectionFunctionArn;
      expect(functionArn).toBeDefined();

      const command = new GetFunctionCommand({
        FunctionName: functionArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('All Lambda functions should have CloudWatch Logs configured', async () => {
      const functions = [
        discovered.stackOutputs.TagComplianceFunctionArn,
        discovered.stackOutputs.AMIComplianceFunctionArn,
        discovered.stackOutputs.DriftDetectionFunctionArn,
      ];

      for (const functionArn of functions) {
        if (!functionArn) continue;

        const command = new GetFunctionCommand({
          FunctionName: functionArn,
        });
        const response = await lambdaClient.send(command);

        // Extract function name from ARN
        const functionName = functionArn.split(':').pop() || '';
        expect(response.Configuration?.LoggingConfig).toBeDefined();
      }
    });
  });

  describe('S3 Bucket', () => {
    test('Compliance Report Bucket should exist', async () => {
      const bucketName = discovered.stackOutputs.ComplianceReportBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket should have encryption enabled', async () => {
      const bucketName = discovered.stackOutputs.ComplianceReportBucketName;
      if (!bucketName) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBeDefined();
    });

    test('S3 bucket should block public access', async () => {
      const bucketName = discovered.stackOutputs.ComplianceReportBucketName;
      if (!bucketName) return;

      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        response.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('SNS Topic', () => {
    test('Compliance Alert Topic should exist', async () => {
      const topicArn = discovered.stackOutputs.ComplianceAlertTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('SNS topic should have subscriptions', async () => {
      const topicArn = discovered.stackOutputs.ComplianceAlertTopicArn;
      if (!topicArn) return;

      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: topicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Config', () => {
    test('Config Recorder should exist', async () => {
      const recorderName = discovered.stackOutputs.ConfigRecorderName;
      expect(recorderName).toBeDefined();

      const command = new DescribeConfigurationRecordersCommand({});
      const response = await configClient.send(command);

      const recorder = response.ConfigurationRecorders?.find(
        (r) => r.name === recorderName
      );
      expect(recorder).toBeDefined();
      expect(recorder?.name).toBe(recorderName);
    });

    test('Config Rules should exist', async () => {
      const command = new DescribeConfigRulesCommand({});
      const response = await configClient.send(command);

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules!.length).toBeGreaterThan(0);

      // Check for required-tags rule
      const requiredTagsRule = response.ConfigRules?.find(
        (rule) => rule.ConfigRuleName?.includes('required-tags')
      );
      expect(requiredTagsRule).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    test('EventBridge rules should exist for compliance monitoring', async () => {
      const command = new ListRulesCommand({});
      const response = await eventBridgeClient.send(command);

      expect(response.Rules).toBeDefined();

      // Find rules related to compliance monitoring
      const complianceRules = response.Rules?.filter(
        (rule) =>
          rule.Name?.includes('compliance') ||
          rule.Name?.includes('config') ||
          rule.Name?.includes('drift')
      );

      expect(complianceRules).toBeDefined();
      expect(complianceRules!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Compliance Dashboard should exist', async () => {
      const dashboardUrl = discovered.stackOutputs.ComplianceDashboardURL;
      expect(dashboardUrl).toBeDefined();

      // Extract dashboard name from URL
      const dashboardNameMatch = dashboardUrl.match(/dashboards:name=([^&]+)/);
      if (dashboardNameMatch) {
        const dashboardName = decodeURIComponent(dashboardNameMatch[1]);

        const command = new ListDashboardsCommand({
          DashboardNamePrefix: dashboardName,
        });
        const response = await cloudWatchClient.send(command);

        expect(response.DashboardEntries).toBeDefined();
        const dashboard = response.DashboardEntries?.find(
          (d) => d.DashboardName === dashboardName
        );
        expect(dashboard).toBeDefined();
        expect(dashboard?.DashboardName).toBe(dashboardName);
      }
    });
  });

  describe('Systems Manager Parameter Store', () => {
    test('Approved AMIs parameter should exist', async () => {
      // Find the parameter from stack resources
      const paramResource = discovered.stackResources.find(
        (r) =>
          r.ResourceType === 'AWS::SSM::Parameter' &&
          r.LogicalResourceId?.includes('ApprovedAMIs')
      );

      if (paramResource && paramResource.PhysicalResourceId) {
        const command = new GetParameterCommand({
          Name: paramResource.PhysicalResourceId,
        });
        const response = await ssmClient.send(command);

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter?.Value).toBeDefined();
      }
    });
  });

  describe('Stack Resources Validation', () => {
    test('should have Lambda function resources', () => {
      const lambdaResources = discovered.stackResources.filter(
        (r) => r.ResourceType === 'AWS::Lambda::Function'
      );
      expect(lambdaResources.length).toBeGreaterThanOrEqual(3);
    });

    test('should have S3 bucket resource', () => {
      const s3Resources = discovered.stackResources.filter(
        (r) => r.ResourceType === 'AWS::S3::Bucket'
      );
      expect(s3Resources.length).toBeGreaterThan(0);
    });

    test('should have SNS topic resource', () => {
      const snsResources = discovered.stackResources.filter(
        (r) => r.ResourceType === 'AWS::SNS::Topic'
      );
      expect(snsResources.length).toBeGreaterThan(0);
    });

    test('should have AWS Config resources', () => {
      const configResources = discovered.stackResources.filter(
        (r) =>
          r.ResourceType === 'AWS::Config::ConfigurationRecorder' ||
          r.ResourceType === 'AWS::Config::ConfigRule'
      );
      expect(configResources.length).toBeGreaterThan(0);
    });

    test('should have EventBridge rule resources', () => {
      const eventBridgeResources = discovered.stackResources.filter(
        (r) => r.ResourceType === 'AWS::Events::Rule'
      );
      expect(eventBridgeResources.length).toBeGreaterThan(0);
    });

    test('should have IAM role resources', () => {
      const iamResources = discovered.stackResources.filter(
        (r) =>
          r.ResourceType === 'AWS::IAM::Role' ||
          r.ResourceType === 'AWS::IAM::Policy'
      );
      expect(iamResources.length).toBeGreaterThan(0);
    });

    test('all resources should be in CREATE_COMPLETE or UPDATE_COMPLETE status', () => {
      const failedResources = discovered.stackResources.filter(
        (r) =>
          !r.ResourceStatus.includes('COMPLETE') &&
          !r.ResourceStatus.includes('UPDATE_COMPLETE')
      );
      expect(failedResources.length).toBe(0);
    });
  });

  describe('Resource Naming', () => {
    test('all Lambda functions should contain environment suffix', () => {
      const functions = [
        discovered.stackOutputs.TagComplianceFunctionArn,
        discovered.stackOutputs.AMIComplianceFunctionArn,
        discovered.stackOutputs.DriftDetectionFunctionArn,
      ];

      for (const functionArn of functions) {
        if (!functionArn) continue;
        const functionName = functionArn.split(':').pop() || '';
        // Function names should contain the environment suffix
        expect(functionName).toMatch(new RegExp(`-${environmentSuffix}$|${environmentSuffix}-`));
      }
    });

    test('S3 bucket should contain environment suffix', () => {
      const bucketName = discovered.stackOutputs.ComplianceReportBucketName;
      if (!bucketName) return;
      expect(bucketName).toContain(environmentSuffix);
    });

    test('SNS topic should contain environment suffix', () => {
      const topicArn = discovered.stackOutputs.ComplianceAlertTopicArn;
      if (!topicArn) return;
      expect(topicArn).toContain(environmentSuffix);
    });
  });
});

