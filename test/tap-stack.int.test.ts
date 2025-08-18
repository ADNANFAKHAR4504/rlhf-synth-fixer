import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Extract AWS credentials from environment variables (if set)
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Optionally log for debug (do not log secrets in production)
if (awsAccessKeyId && awsSecretAccessKey) {
  console.log('AWS credentials loaded from environment variables.');
  console.log('AWS_ACCESS_KEY_ID (partial):', awsAccessKeyId.substring(0, 4) + '...' + awsAccessKeyId.substring(5, awsAccessKeyId.length));
  console.log('AWS_SECRET_ACCESS_KEY (partial):', awsSecretAccessKey.substring(0, 4) + '...' + awsSecretAccessKey.substring(5, awsSecretAccessKey.length));
}

// Configuration - Get outputs from CloudFormation stack
let outputs: any = {};
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.log(
    'cfn-outputs/flat-outputs.json not found, will fetch from CloudFormation API'
  );
}

const cfnClient = new CloudFormationClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

describe('TapStack Integration Tests', () => {
  let stackOutputs: any = {};
  let stackResources: any = {};

  beforeAll(async () => {
    try {
      if (Object.keys(outputs).length === 0) {
        const describeStacksCommand = new DescribeStacksCommand({
          StackName: stackName,
        });
        const stackResult = await cfnClient.send(describeStacksCommand);
        if (stackResult.Stacks?.[0]?.Outputs) {
          stackResult.Stacks[0].Outputs.forEach(output => {
            if (output.OutputKey && output.OutputValue) {
              stackOutputs[output.OutputKey] = output.OutputValue;
            }
          });
        }
      } else {
        stackOutputs = outputs;
      }

      // Get stack resources
      const listResourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResult = await cfnClient.send(listResourcesCommand);
      if (resourcesResult.StackResourceSummaries) {
        resourcesResult.StackResourceSummaries.forEach(resource => {
          if (resource.LogicalResourceId && resource.PhysicalResourceId) {
            stackResources[resource.LogicalResourceId] = resource.PhysicalResourceId;
          }
        });
      }
    } catch (error) {
      console.warn('Could not fetch stack information:', error);
    }
  }, 30000);

  describe('CloudFormation Stack Validation', () => {
    test('stack should exist and be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const result = await cfnClient.send(command);
      expect(result.Stacks).toHaveLength(1);
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
        result.Stacks![0].StackStatus
      );
    });

    test('stack should have all expected outputs', () => {
      const expectedOutputs = [
        'PipelineName',
        'SourceBucketName',
        'ArtifactsBucketName',
        'CodeBuildProjectName',
        'ValidationLambdaName',
        'PipelineConsoleURL',
        'SourceBucketConsoleURL',
      ];
      expectedOutputs.forEach(key => {
        expect(stackOutputs[key]).toBeDefined();
        expect(String(stackOutputs[key]).length).toBeGreaterThan(0);
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Source and Artifacts buckets should exist and be encrypted', async () => {
      for (const key of ['SourceBucketName', 'ArtifactsBucketName']) {
        const bucketName = stackOutputs[key];
        // Check bucket exists
        await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();
        // Check encryption
        const encryption = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      }
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('Log groups should exist for CodeBuild, Lambda, S3, and Pipeline', async () => {
      const logGroupNames = [
        `/aws/codebuild/${stackOutputs.PipelineName.replace('-pipeline','')}`,
        `/aws/lambda/${stackOutputs.ValidationLambdaName}`,
        `/aws/s3/${stackOutputs.PipelineName.replace('-pipeline','')}`,
        `/aws/codepipeline/${stackOutputs.PipelineName}`,
      ];
      for (const logGroupName of logGroupNames) {
        const result = await logsClient.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName }));
        expect(result.logGroups).toBeDefined();
        expect(result.logGroups!.length).toBeGreaterThan(0);
      }
    });
  });
});
