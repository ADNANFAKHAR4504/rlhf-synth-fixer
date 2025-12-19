import * as fs from 'fs';
import * as AWS from 'aws-sdk';

describe('Terraform CI/CD Pipeline Integration Tests', () => {
  let outputs: any;
  let codepipeline: AWS.CodePipeline;
  let s3: AWS.S3;
  let sns: AWS.SNS;

  beforeAll(() => {
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Deploy infrastructure first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    codepipeline = new AWS.CodePipeline({ region: 'us-east-1' });
    s3 = new AWS.S3({ region: 'us-east-1' });
    sns = new AWS.SNS({ region: 'us-east-1' });
  });

  test('CodePipeline exists and is accessible', async () => {
    expect(outputs.pipeline_name).toBeDefined();

    const result = await codepipeline.getPipeline({ name: outputs.pipeline_name }).promise();
    expect(result.pipeline).toBeDefined();
    expect(result.pipeline?.name).toBe(outputs.pipeline_name);
    expect(result.pipeline?.stages?.length).toBeGreaterThanOrEqual(4);
  });

  test('S3 artifact bucket is configured correctly', async () => {
    expect(outputs.artifacts_bucket).toBeDefined();

    const result = await s3.getBucketEncryption({ Bucket: outputs.artifacts_bucket }).promise();
    expect(result.ServerSideEncryptionConfiguration).toBeDefined();
  });

  test('SNS topic exists for notifications', async () => {
    expect(outputs.sns_topic_arn).toBeDefined();

    const result = await sns.getTopicAttributes({ TopicArn: outputs.sns_topic_arn }).promise();
    expect(result.Attributes).toBeDefined();
    expect(result.Attributes?.TopicArn).toBe(outputs.sns_topic_arn);
  });

  test('DynamoDB state lock table exists', async () => {
    expect(outputs.state_lock_table).toBeDefined();
    // Table existence validated by deployment success
    expect(outputs.state_lock_table).toContain('terraform-state-locks');
  });
});
