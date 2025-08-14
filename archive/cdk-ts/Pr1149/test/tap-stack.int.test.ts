// Integration tests use stack outputs written by CI/CD after "cdk deploy"
// Ensure the file exists at cfn-outputs/flat-outputs.json
import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import AWS from 'aws-sdk';
import axios from 'axios';
import fs from 'fs';

jest.setTimeout(30000);

type FlatOutputs = Record<string, string>;

const readRegion = (): string => {
  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  if (process.env.AWS_DEFAULT_REGION) return process.env.AWS_DEFAULT_REGION;
  try {
    const file = fs.readFileSync('lib/AWS_REGION', 'utf8');
    const line = file
      .split(/\r?\n/)
      .map(s => s.trim())
      .find(s => s.length > 0);
    if (line) return line;
  } catch {}
  return 'us-east-1';
};

const readOutputsFromFile = (): FlatOutputs | undefined => {
  const path = 'cfn-outputs/flat-outputs.json';
  if (fs.existsSync(path)) {
    try {
      return JSON.parse(fs.readFileSync(path, 'utf8')) as FlatOutputs;
    } catch {}
  }
  return undefined;
};

const readOutputsFromEnv = (): FlatOutputs | undefined => {
  const apiUrl = process.env.API_URL || process.env.API_ENDPOINT;
  if (apiUrl) return { ApiUrl: apiUrl };
  return undefined;
};

const readOutputsFromCloudFormation = async (): Promise<
  FlatOutputs | undefined
> => {
  const region = readRegion();
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const stackName = process.env.STACK_NAME || `TapStack${environmentSuffix}`;
  const cf = new AWS.CloudFormation({ region });
  try {
    const res = await cf.describeStacks({ StackName: stackName }).promise();
    const outputs = (res.Stacks?.[0]?.Outputs || []).reduce(
      (acc: FlatOutputs, o) => {
        if (o.OutputKey && o.OutputValue) acc[o.OutputKey] = o.OutputValue;
        return acc;
      },
      {} as FlatOutputs
    );
    return Object.keys(outputs).length > 0 ? outputs : undefined;
  } catch {
    return undefined;
  }
};

const loadOutputs = async (): Promise<FlatOutputs> => {
  const fromEnv = readOutputsFromEnv();
  if (fromEnv) return fromEnv;
  const fromFile = readOutputsFromFile();
  if (fromFile) return fromFile;
  const fromCfn = await readOutputsFromCloudFormation();
  if (fromCfn) return fromCfn;
  throw new Error(
    'Could not determine stack outputs. Provide API_URL env, or ensure cfn-outputs/flat-outputs.json exists, or CloudFormation has readable outputs.'
  );
};

const normalizeUrl = (base: string, path: string = ''): string => {
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  const suffix = path.startsWith('/') ? path.slice(1) : path;
  return `${trimmed}/${suffix}`;
};

describe('Serverless API Integration', () => {
  let apiBaseUrl: string;
  let region: string;
  let bucketName: string | undefined;
  let tableName: string | undefined;
  let s3EndpointId: string | undefined;
  let ddbEndpointId: string | undefined;
  let stackName: string;

  beforeAll(async () => {
    const outputs = await loadOutputs();
    region = readRegion();
    bucketName = outputs.BucketName;
    tableName = outputs.TableName;
    s3EndpointId = outputs.S3VpcEndpointId;
    ddbEndpointId = outputs.DynamoDbVpcEndpointId;
    const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    stackName = process.env.STACK_NAME || `TapStack${envSuffix}`;
    apiBaseUrl = (outputs.ApiUrl ||
      outputs.AppApiEndpoint979256A8 ||
      outputs.AppApiEndpoint ||
      outputs['TapStack.ApiUrl']) as string;
    if (!apiBaseUrl) throw new Error('ApiUrl output not found');
  });

  test('GET / returns 200 with ok:true', async () => {
    const url = normalizeUrl(apiBaseUrl, '/');
    const res = await axios.get(url, { validateStatus: () => true });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/i);
    expect(typeof res.data).toBe('object');
    expect(res.data.ok).toBe(true);
  });

  test('GET /health returns 200 with ok:true', async () => {
    const url = normalizeUrl(apiBaseUrl, '/health');
    const res = await axios.get(url, { validateStatus: () => true });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/i);
    expect(res.data.ok).toBe(true);
  });

  test('POST /data returns 200 with ok:true', async () => {
    const url = normalizeUrl(apiBaseUrl, '/data');
    const payload = { message: 'hello' };
    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/i);
    expect(res.data.ok).toBe(true);
  });

  test('VPC endpoints exist and are available (S3, DDB)', async () => {
    const ec2 = new AWS.EC2({ region });
    const ids = [s3EndpointId, ddbEndpointId].filter(Boolean) as string[];
    const out = await ec2
      .describeVpcEndpoints({ VpcEndpointIds: ids })
      .promise();
    expect(out.VpcEndpoints?.length).toBe(2);
    out.VpcEndpoints?.forEach(ep => {
      expect(ep.VpcEndpointType).toBe('Gateway');
      expect(ep.State).toBe('available');
    });
  });

  test('S3 policy denies PutObject without VPCE', async () => {
    if (!bucketName) return fail('BucketName output missing');
    const s3 = new AWS.S3({ region });
    const key = `it-${Date.now()}.txt`;
    await expect(
      s3.putObject({ Bucket: bucketName, Key: key, Body: 'denied' }).promise()
    ).rejects.toHaveProperty('code', 'AccessDenied');
  });

  test('DynamoDB table is PAY_PER_REQUEST (on-demand)', async () => {
    if (!tableName) return fail('TableName output missing');
    const ddb = new AWS.DynamoDB({ region });
    const info = await ddb.describeTable({ TableName: tableName }).promise();
    expect(info.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('Lambda function is configured inside the VPC', async () => {
    const cf = new AWS.CloudFormation({ region });
    const lambda = new AWS.Lambda({ region });
    const resources = await cf
      .listStackResources({ StackName: stackName })
      .promise();
    const lambdaResources = (resources.StackResourceSummaries || []).filter(
      r => r.ResourceType === 'AWS::Lambda::Function'
    );
    let foundVpcConfigured = false;
    for (const r of lambdaResources) {
      if (!r.PhysicalResourceId) continue;
      try {
        const cfg = await lambda
          .getFunctionConfiguration({ FunctionName: r.PhysicalResourceId })
          .promise();
        const vars = cfg.Environment?.Variables || {};
        if (vars.BUCKET_NAME === bucketName && vars.TABLE_NAME === tableName) {
          expect(
            cfg.VpcConfig?.SubnetIds && cfg.VpcConfig.SubnetIds.length
          ).toBeGreaterThan(0);
          foundVpcConfigured = true;
          break;
        }
      } catch {}
    }
    expect(foundVpcConfigured).toBe(true);
  });
});
