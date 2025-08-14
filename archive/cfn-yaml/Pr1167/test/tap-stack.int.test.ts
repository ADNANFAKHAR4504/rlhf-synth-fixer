import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-southeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const sns = new SNSClient({ region });
const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });
const codepipeline = new CodePipelineClient({ region });

// Load outputs from flat-outputs.json
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('TapStack CI/CD CloudFormation Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const required = [
        'NotificationTopic',
        'SourceCodeBucket',
        'ArtifactStoreBucket',
        'PipelineName',
        'TestLambdaFunction',
      ];
      required.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('SNS Topic', () => {
    test('should exist and have correct display name', async () => {
      const topicArn = outputs.NotificationTopic;
      expect(topicArn).toMatch(/^arn:aws:sns:/);
      const res = await sns.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );
      expect(res.Attributes?.TopicArn).toBe(topicArn);
      expect(res.Attributes?.DisplayName).toBe('CI/CD Pipeline Notifications');
    });
  });

  describe('S3 Buckets', () => {
    test('Source code bucket should exist and be in correct region', async () => {
      const bucket = outputs.SourceCodeBucket;
      expect(bucket).toMatch(/^nodejs-cicd-source/);
      const res = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      expect([null, '', region]).toContain(res.LocationConstraint);
    });
    test('Artifact store bucket should exist and be versioned', async () => {
      const bucket = outputs.ArtifactStoreBucket;
      expect(bucket).toMatch(/^nodejs-cicd-artifacts/);
      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucket })
      );
      expect(['Enabled', 'Suspended']).toContain(versioning.Status);
    });
  });

  describe('Lambda Function', () => {
    test('should exist and have correct configuration', async () => {
      const functionName = outputs.TestLambdaFunction;
      expect(functionName).toMatch(/test-function/);
      const res = await lambda.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      expect(res.FunctionName).toBe(functionName);
      expect(res.Runtime).toMatch(/python3.11/);
      expect(res.Handler).toBe('index.lambda_handler');
      expect(res.Timeout).toBeGreaterThanOrEqual(60);
    });
  });

  describe('CodePipeline', () => {
    test('should exist and have required stages', async () => {
      const pipelineName = outputs.PipelineName;
      expect(pipelineName).toMatch(/pipeline/);
      const res = await codepipeline.send(
        new GetPipelineCommand({ name: pipelineName })
      );
      expect(res.pipeline?.name).toBe(pipelineName);
      const stageNames = (res.pipeline?.stages || []).map(s => s.name);
      expect(stageNames).toEqual([
        'Source',
        'Build',
        'Test',
        'ManualApproval',
        'Deploy',
      ]);
    });
  });
});
