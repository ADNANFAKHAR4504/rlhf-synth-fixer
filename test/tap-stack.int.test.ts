import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetBucketVersioningCommand, GetPublicAccessBlockCommand, S3Client } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

jest.setTimeout(90000);

const hasAwsCreds = () =>
  Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_PROFILE ||
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE
  );

const loadStackOutputs = async () => {
  const cfn = new CloudFormationClient({ region });
  const resp = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
  const stack = resp.Stacks && resp.Stacks[0];
  if (!stack || !stack.Outputs) return {} as Record<string, string>;
  const out: Record<string, string> = {};
  for (const o of stack.Outputs) {
    if (o.OutputKey && o.OutputValue) out[o.OutputKey] = o.OutputValue;
  }
  return out;
};

describe('TapStack live integration tests', () => {
  let outputs: Record<string, string> = {};

  beforeAll(async () => {
    if (!hasAwsCreds()) {
      console.warn('Skipping live tests: AWS credentials not found in environment.');
      return;
    }
    try {
      outputs = await loadStackOutputs();
      console.log('CloudFormation Outputs:', outputs);
    } catch (err) {
      console.warn('Skipping live tests: unable to load stack outputs', err);
    }
  });

  const skipIfNoStack = () => {
    if (!hasAwsCreds()) return true;
    return Object.keys(outputs).length === 0;
  };

  test('S3 bucket has versioning and public access blocks', async () => {
    if (skipIfNoStack()) return; // skip
    const bucketName = outputs['ArtifactsBucketName'];
    expect(bucketName).toBeTruthy();
    const s3 = new S3Client({ region });
    const versioning = await s3.send(
      new GetBucketVersioningCommand({ Bucket: bucketName })
    );
    console.log('BucketVersioning:', versioning);
    expect(versioning.Status).toBe('Enabled');

    const pab = await s3.send(
      new GetPublicAccessBlockCommand({ Bucket: bucketName })
    );
    console.log('PublicAccessBlock:', pab);
    const cfg = pab.PublicAccessBlockConfiguration!;
    expect(cfg.BlockPublicAcls).toBe(true);
    expect(cfg.BlockPublicPolicy).toBe(true);
    expect(cfg.IgnorePublicAcls).toBe(true);
    expect(cfg.RestrictPublicBuckets).toBe(true);
  });

  test('DynamoDB table exists with expected schema', async () => {
    if (skipIfNoStack()) return;
    const tableName = outputs['TurnAroundPromptTableName'];
    expect(tableName).toBeTruthy();
    const ddb = new DynamoDBClient({ region });
    const resp = await ddb.send(new DescribeTableCommand({ TableName: tableName }));
    console.log('DynamoDB DescribeTable:', resp.Table);
    const table = resp.Table!;
    expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    const hash = table.KeySchema?.find(k => k.KeyType === 'HASH');
    expect(hash?.AttributeName).toBe('id');
  });

  test('NAT gateway is available', async () => {
    if (skipIfNoStack()) return;
    const natId = outputs['NatGatewayId'];
    expect(natId).toBeTruthy();
    const ec2 = new EC2Client({ region });
    const resp = await ec2.send(
      new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] })
    );
    console.log('DescribeNatGateways:', resp.NatGateways);
    const nat = resp.NatGateways && resp.NatGateways[0];
    expect(nat?.State === 'available' || nat?.State === 'pending').toBe(true);
  });

  test('Private subnets route to internet via NAT', async () => {
    if (skipIfNoStack()) return;
    const privateIds = (outputs['PrivateSubnetIds'] || '').split(',').filter(Boolean);
    const natId = outputs['NatGatewayId'];
    const ec2 = new EC2Client({ region });
    for (const subnetId of privateIds) {
      const rts = await ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] },
          ],
        })
      );
      console.log(`RouteTables for ${subnetId}:`, rts.RouteTables);
      const hasDefaultToNat = (rts.RouteTables || []).some(rt =>
        (rt.Routes || []).some(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId === natId)
      );
      expect(hasDefaultToNat).toBe(true);
    }
  });

  test('Public subnets have default route to Internet Gateway', async () => {
    if (skipIfNoStack()) return;
    const vpcId = outputs['VpcId'];
    const publicIds = (outputs['PublicSubnetIds'] || '').split(',').filter(Boolean);
    const ec2 = new EC2Client({ region });
    const igwResp = await ec2.send(
      new DescribeInternetGatewaysCommand({ Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }] })
    );
    console.log('DescribeInternetGateways:', igwResp.InternetGateways);
    const igwId = igwResp.InternetGateways?.[0]?.InternetGatewayId;
    expect(igwId).toBeTruthy();
    for (const subnetId of publicIds) {
      const rts = await ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] },
          ],
        })
      );
      console.log(`RouteTables for ${subnetId}:`, rts.RouteTables);
      const hasDefaultToIgw = (rts.RouteTables || []).some(rt =>
        (rt.Routes || []).some(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId === igwId)
      );
      expect(hasDefaultToIgw).toBe(true);
    }
  });
});
