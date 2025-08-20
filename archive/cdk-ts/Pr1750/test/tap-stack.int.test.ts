// tap-stack.int.test.ts
import fs from 'fs';
import AWS from 'aws-sdk';

// Load outputs
const outputsPath = 'cfn-outputs/flat-outputs.json';
const outputsRaw = fs.existsSync(outputsPath)
  ? fs.readFileSync(outputsPath, 'utf8')
  : '{}';
const outputs: Record<string, string> = JSON.parse(outputsRaw || '{}');

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  jest.setTimeout(300000); // allow up to 5 minutes for live AWS calls

  const region = process.env.AWS_REGION || 'us-west-2';
  AWS.config.update({ region });

  const ec2 = new AWS.EC2();
  const s3 = new AWS.S3();
  const apigateway = new AWS.APIGateway();
  const logs = new AWS.CloudWatchLogs();
  const guardduty = new AWS.GuardDuty();

  it('should have created the VPC', async () => {
    expect(outputs.VpcId).toBeDefined();
    const vpcResp = await ec2
      .describeVpcs({ VpcIds: [outputs.VpcId] })
      .promise();
    expect(vpcResp.Vpcs?.[0]?.VpcId).toEqual(outputs.VpcId);
  });

  it('should have created the logging bucket', async () => {
    expect(outputs.LogsBucketName).toBeDefined();
    const bucketResp = await s3
      .getBucketLocation({ Bucket: outputs.LogsBucketName })
      .promise();
    expect(bucketResp).toBeDefined();
  });

  it('should have deployed the API Gateway', async () => {
    expect(outputs.ApiId).toBeDefined();
    const apiResp = await apigateway
      .getRestApi({ restApiId: outputs.ApiId })
      .promise();
    expect(apiResp?.id).toEqual(outputs.ApiId);
  });

  it('should have created the API Log Group', async () => {
    expect(outputs.ApiLogGroupName).toBeDefined();
    const logResp = await logs
      .describeLogGroups({ logGroupNamePrefix: outputs.ApiLogGroupName })
      .promise();
    const found = logResp.logGroups?.some(
      (g: AWS.CloudWatchLogs.LogGroup) =>
        g.logGroupName === outputs.ApiLogGroupName
    );
    expect(found).toBeTruthy();
  });

  it('should have enabled GuardDuty in the primary region', async () => {
    expect(outputs.GuardDutyDetectorId).toBeDefined();
    const gdResp = await guardduty
      .getDetector({ DetectorId: outputs.GuardDutyDetectorId })
      .promise();
    expect(gdResp?.Status).toEqual('ENABLED');
  });
});
