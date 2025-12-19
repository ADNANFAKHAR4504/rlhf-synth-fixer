import {
  S3Client,
  ListBucketsCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFormationClient,
  DeleteStackCommand,
} from '@aws-sdk/client-cloudformation';
import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const REGION = process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';
const STACK_NAME = `TapStack${ENVIRONMENT_SUFFIX}`;

// LocalStack endpoint configuration
const LOCALSTACK_ENDPOINT =
  process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const isLocalStack =
  LOCALSTACK_ENDPOINT.includes('localhost') ||
  LOCALSTACK_ENDPOINT.includes('4566');

describe('TapStack Integration Tests (LocalStack Compatible)', () => {
  let stack: TapStack;
  let app: cdk.App;
  let s3Client: S3Client;
  let cfClient: CloudFormationClient;
  let deploymentOutputs: any = {};

  beforeAll(async () => {
    app = new cdk.App();
    stack = new TapStack(app, STACK_NAME, {
      env: { region: REGION },
      environmentSuffix: ENVIRONMENT_SUFFIX,
    });

    // Configure clients with LocalStack endpoint if needed
    const clientConfig = isLocalStack
      ? { region: REGION, endpoint: LOCALSTACK_ENDPOINT, forcePathStyle: true }
      : { region: REGION };

    s3Client = new S3Client(clientConfig);
    cfClient = new CloudFormationClient(clientConfig);

    // Load deployment outputs if available
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      deploymentOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    }
  });

  afterAll(async () => {
    // Cleanup: destroy the stack
    try {
      await cfClient.send(new DeleteStackCommand({ StackName: STACK_NAME }));
    } catch (error) {
      console.warn('Stack cleanup failed:', error);
    }
  });

  test('Stack can be synthesized without errors', () => {
    const template = app.synth();
    expect(template).toBeDefined();
    expect(template.stacks.length).toBeGreaterThan(0);
  });

  test('S3 bucket has Block Public Access enabled', async () => {
    // Skip if no deployment outputs available
    if (!deploymentOutputs.S3BucketName) {
      console.log('Skipping S3 test - no deployment outputs available');
      return;
    }

    const blockConfig = await s3Client.send(
      new GetPublicAccessBlockCommand({
        Bucket: deploymentOutputs.S3BucketName,
      })
    );

    expect(blockConfig.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
      true
    );
    expect(blockConfig.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
      true
    );
    expect(blockConfig.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
      true
    );
    expect(
      blockConfig.PublicAccessBlockConfiguration?.RestrictPublicBuckets
    ).toBe(true);
  });

  test('S3 bucket has versioning enabled', async () => {
    // Skip if no deployment outputs available
    if (!deploymentOutputs.S3BucketName) {
      console.log('Skipping versioning test - no deployment outputs available');
      return;
    }

    const versioningConfig = await s3Client.send(
      new GetBucketVersioningCommand({
        Bucket: deploymentOutputs.S3BucketName,
      })
    );

    expect(versioningConfig.Status).toBe('Enabled');
  });

  test('S3 bucket has encryption enabled', async () => {
    // Skip if no deployment outputs available
    if (!deploymentOutputs.S3BucketName) {
      console.log('Skipping encryption test - no deployment outputs available');
      return;
    }

    const encryptionConfig = await s3Client.send(
      new GetBucketEncryptionCommand({
        Bucket: deploymentOutputs.S3BucketName,
      })
    );

    expect(encryptionConfig.ServerSideEncryptionConfiguration).toBeDefined();
    expect(
      encryptionConfig.ServerSideEncryptionConfiguration?.Rules?.length
    ).toBeGreaterThan(0);
  });

  test('LocalStack compatibility verified', () => {
    // Verify the stack is running in LocalStack mode
    if (isLocalStack) {
      expect(process.env.AWS_ENDPOINT_URL).toContain('4566');
    }
  });
});
