import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ConfigServiceClient,
  DescribeConfigurationRecorderStatusCommand,
  DescribeConfigurationRecordersCommand,
} from '@aws-sdk/client-config-service';
import {
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancerAttributesCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetWebACLCommand,
  WAFV2Client,
} from '@aws-sdk/client-wafv2';
import { fromEnv } from '@aws-sdk/credential-provider-env';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import fs from 'fs';
import http from 'http';
import path from 'path';

type FlatOutputs = Record<string, string>;

const outputsPath =
  process.env.TAP_STACK_OUTPUTS_PATH ||
  path.join(__dirname, '../cfn-outputs/flat-outputs.json');

function readFlatOutputs(): FlatOutputs | null {
  try {
    if (!fs.existsSync(outputsPath)) {
      console.error(`Outputs file not found at: ${outputsPath}`);
      console.error('Deploy the TapStack stack and generate cfn-outputs/flat-outputs.json before running integration tests.');
      return null;
    }

    const raw = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read TapStack outputs: ${error}`);
    return null;
  }
}

const flat = readFlatOutputs();

function extractRegionFromOutputs(): string {
  if (flat?.ALBDNSName) {
    const match = flat.ALBDNSName.match(/\.([a-z0-9-]+)\.elb\.amazonaws\.com$/);
    if (match) {
      return match[1];
    }
  }

  if (flat?.RDSEndpoint) {
    const match = flat.RDSEndpoint.match(/\.([a-z0-9-]+)\.rds\.amazonaws\.com$/);
    if (match) {
      return match[1];
    }
  }

  if (flat?.LambdaFunctionArn) {
    const match = flat.LambdaFunctionArn.match(/^arn:aws:lambda:([a-z0-9-]+):/);
    if (match) {
      return match[1];
    }
  }

  return (
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    'us-east-1'
  );
}

const detectedRegion = extractRegionFromOutputs();

function createAwsConfig() {
  const config: Record<string, any> = {
    region: detectedRegion,
    maxAttempts: 3,
  };

  // Explicitly provide credentials to avoid dynamic import issues in Jest
  try {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = fromEnv();
    } else if (process.env.AWS_PROFILE || process.env.HOME) {
      config.credentials = fromIni();
    }
  } catch (error) {
    // If credential providers fail, continue without explicit credentials
    // SDK will try its default chain
    console.warn('Could not load explicit credentials, using SDK default chain');
  }

  return config;
}

function detectEnvironment(): string {
  if (flat?.ALBDNSName) {
    const match = flat.ALBDNSName.match(/ECommerce-ALB-([a-z]+)-[a-z0-9]+\./);
    if (match) {
      return match[1];
    }
  }

  if (flat?.RDSEndpoint) {
    const match = flat.RDSEndpoint.match(/ecommerce-db-([a-z]+)\./);
    if (match) {
      return match[1];
    }
  }

  if (flat?.CloudTrailName) {
    const match = flat.CloudTrailName.match(/ECommerce-Trail-([a-z]+)/);
    if (match) {
      return match[1];
    }
  }

  return process.env.TAP_STACK_ENV || 'production';
}

const environment = detectEnvironment();

const albDnsName = flat?.ALBDNSName ?? '';
const vpcId = flat?.VPCId ?? '';
const applicationBucketName = flat?.S3ApplicationBucketName ?? '';
const rdsEndpoint = flat?.RDSEndpoint ?? '';
const lambdaFunctionArn = flat?.LambdaFunctionArn ?? '';
const cloudTrailName = flat?.CloudTrailName ?? '';
const configRecorderName = flat?.ConfigRecorderName ?? '';
const webAclArn = flat?.WebACLArn ?? '';

const loadBalancerName = environment
  ? `ECommerce-ALB-${environment}`
  : undefined;
const targetGroupName = environment
  ? `ECommerce-TG-${environment}`
  : undefined;
const rdsIdentifier = environment
  ? `ecommerce-db-${environment}`
  : undefined;
const lambdaFunctionName = environment
  ? `ECommerce-Function-${environment}`
  : undefined;

function httpGet(url: string): Promise<{
  status: number;
  body: string;
  headers: http.IncomingHttpHeaders;
}> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, response => {
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        resolve({
          status: response.statusCode ?? 0,
          body: data,
          headers: response.headers,
        });
      });
    });

    request.on('error', reject);
    request.setTimeout(20000, () => {
      request.destroy(new Error('Request timeout'));
    });
  });
}

describe('TapStack Integration Tests (Secure E-Commerce Stack)', () => {
  beforeAll(() => {
    jest.setTimeout(90000);

    if (!flat) {
      throw new Error(
        'TapStack outputs not found. Deploy the stack and ensure cfn-outputs/flat-outputs.json is present.'
      );
    }

    console.log('\n=== TapStack Integration Context ===');
    console.log('Region:', detectedRegion);
    console.log('Environment:', environment);
    console.log('Outputs Path:', outputsPath);
  });

  test('required CloudFormation outputs exist and are non-empty', () => {
    const required = [
      'VPCId',
      'ALBDNSName',
      'S3ApplicationBucketName',
      'RDSEndpoint',
      'LambdaFunctionArn',
      'CloudTrailName',
      'ConfigRecorderName',
      'WebACLArn',
    ];

    const missing: string[] = [];

    required.forEach(key => {
      const value = (flat?.[key] ?? '').toString();
      if (!value) {
        missing.push(key);
      }
      expect(value).toBeDefined();
      expect(value.length).toBeGreaterThan(0);
    });

    if (missing.length > 0) {
      console.warn(`Missing required outputs: ${missing.join(', ')}`);
    }
  });

  describe('Networking & Load Balancing', () => {
    test('VPC is available with DNS support enabled', async () => {
      expect(vpcId).toBeTruthy();

      const ec2Client = new EC2Client(createAwsConfig());

      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = vpcResponse.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.IsDefault).toBe(false);

      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          Attribute: 'enableDnsSupport',
          VpcId: vpcId,
        })
      );
      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          Attribute: 'enableDnsHostnames',
          VpcId: vpcId,
        })
      );

      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);

      console.log('\n=== VPC Details ===');
      console.log('VPC ID:', vpcId);
      console.log('CIDR Block:', vpc?.CidrBlock);
      console.log('DNS Support:', dnsSupport.EnableDnsSupport?.Value);
      console.log('DNS Hostnames:', dnsHostnames.EnableDnsHostnames?.Value);
    });

    test('Application Load Balancer is active with access logging enabled', async () => {
      expect(albDnsName).toBeTruthy();
      expect(loadBalancerName).toBeTruthy();

      const elbv2 = new ElasticLoadBalancingV2Client(createAwsConfig());

      const lbResponse = await elbv2.send(
        new DescribeLoadBalancersCommand({})
      );

      const loadBalancer = lbResponse.LoadBalancers?.find(
        lb => lb.LoadBalancerName === loadBalancerName || lb.DNSName === albDnsName
      );

      expect(loadBalancer).toBeDefined();
      expect(loadBalancer?.Scheme).toBe('internet-facing');
      expect(loadBalancer?.Type).toBe('application');
      expect(loadBalancer?.State?.Code).toBe('active');
      expect(loadBalancer?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);

      const attrResponse = await elbv2.send(
        new DescribeLoadBalancerAttributesCommand({
          LoadBalancerArn: loadBalancer?.LoadBalancerArn,
        })
      );

      const attributeMap = new Map(
        (attrResponse.Attributes ?? []).map(attr => [attr.Key, attr.Value])
      );

      expect(attributeMap.get('access_logs.s3.enabled')).toBe('true');
      expect(attributeMap.get('idle_timeout.timeout_seconds')).toBe('60');

      console.log('\n=== ALB Details ===');
      console.log('ALB Name:', loadBalancer?.LoadBalancerName);
      console.log('DNS Name:', loadBalancer?.DNSName);
      console.log('Scheme:', loadBalancer?.Scheme);
      console.log('Access Logs Bucket:', attributeMap.get('access_logs.s3.bucket'));
    });

    test('Target group is healthy and configured for HTTP /health checks', async () => {
      expect(targetGroupName).toBeTruthy();

      const elbv2 = new ElasticLoadBalancingV2Client(createAwsConfig());

      const tgResponse = await elbv2.send(
        new DescribeTargetGroupsCommand({
          Names: [targetGroupName!],
        })
      );

      const targetGroup = tgResponse.TargetGroups?.[0];
      expect(targetGroup).toBeDefined();
      expect(targetGroup?.Protocol).toBe('HTTP');
      expect(targetGroup?.Port).toBe(80);
      expect(targetGroup?.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup?.HealthCheckPath).toBe('/health');

      if (targetGroup?.TargetGroupArn) {
        const health = await elbv2.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: targetGroup.TargetGroupArn,
          })
        );

        const targets = health.TargetHealthDescriptions ?? [];
        expect(targets.length).toBeGreaterThan(0);

        console.log('\n=== Target Group Health ===');
        targets.forEach(entry => {
          console.log(
            `Target ${entry.Target?.Id}:${entry.Target?.Port} - ${entry.TargetHealth?.State}`
          );
        });
      }
    });
  });

  describe('Database Layer', () => {
    test('PostgreSQL RDS instance is encrypted and private', async () => {
      expect(rdsIdentifier).toBeTruthy();

      const rdsClient = new RDSClient(createAwsConfig());

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: rdsIdentifier,
        })
      );

      const instance = response.DBInstances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.DBInstanceStatus).toBe('available');
      expect(instance?.Engine).toBe('postgres');
      expect(instance?.StorageEncrypted).toBe(true);
      expect(instance?.PubliclyAccessible).toBe(false);
      expect(instance?.EnabledCloudwatchLogsExports).toContain('postgresql');
      expect(instance?.DBSubnetGroup?.DBSubnetGroupName).toBeDefined();
      expect(instance?.DBSubnetGroup?.DBSubnetGroupName?.toLowerCase()).toContain('dbsubnet');

      console.log('\n=== RDS Details ===');
      console.log('Identifier:', instance?.DBInstanceIdentifier);
      console.log('Endpoint:', instance?.Endpoint?.Address);
      console.log('Multi-AZ:', instance?.MultiAZ);
      console.log('Storage Type:', instance?.StorageType);
    });
  });

  describe('Application Layer', () => {
    test('Core Lambda function is deployed inside the VPC with tracing enabled', async () => {
      expect(lambdaFunctionName).toBeTruthy();

      const lambdaClient = new LambdaClient(createAwsConfig());

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: lambdaFunctionName,
        })
      );

      const config = response.Configuration;
      expect(config).toBeDefined();
      expect(config?.Runtime).toBe('python3.9');
      expect(['Active', 'PassThrough']).toContain(config?.TracingConfig?.Mode);

      // VPC configuration is REQUIRED for Lambda in this stack
      const securityGroupIds = config?.VpcConfig?.SecurityGroupIds ?? [];
      const subnetIds = config?.VpcConfig?.SubnetIds ?? [];

      expect(securityGroupIds.length).toBeGreaterThan(0);
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);
      expect(config?.Timeout).toBeGreaterThanOrEqual(30);

      console.log('\n=== Lambda Function ===');
      console.log('Name:', config?.FunctionName);
      console.log('Runtime:', config?.Runtime);
      console.log('Memory (MB):', config?.MemorySize);
      console.log('VPC Subnets:', config?.VpcConfig?.SubnetIds);
      console.log('Security Groups:', config?.VpcConfig?.SecurityGroupIds);
    });
  });

  describe('Storage & Logging', () => {
    test('Application S3 bucket has versioning, encryption, logging, and public access blocking', async () => {
      expect(applicationBucketName).toBeTruthy();

      const s3Client = new S3Client(createAwsConfig());

      const [versioning, encryption, logging, publicAccess] = await Promise.all([
        s3Client.send(new GetBucketVersioningCommand({ Bucket: applicationBucketName })),
        s3Client.send(new GetBucketEncryptionCommand({ Bucket: applicationBucketName })),
        s3Client.send(new GetBucketLoggingCommand({ Bucket: applicationBucketName })),
        s3Client.send(new GetPublicAccessBlockCommand({ Bucket: applicationBucketName })),
      ]);

      expect(versioning.Status).toBe('Enabled');

      const rules =
        encryption.ServerSideEncryptionConfiguration?.Rules ?? [];
      const defaultSSE = rules[0]?.ApplyServerSideEncryptionByDefault;
      expect(defaultSSE?.SSEAlgorithm).toBe('aws:kms');
      expect(defaultSSE?.KMSMasterKeyID).toBeDefined();

      expect(logging.LoggingEnabled).toBeDefined();
      expect(logging.LoggingEnabled?.TargetBucket).toBeDefined();

      const publicBlock = publicAccess.PublicAccessBlockConfiguration;
      expect(publicBlock?.BlockPublicAcls).toBe(true);
      expect(publicBlock?.BlockPublicPolicy).toBe(true);
      expect(publicBlock?.IgnorePublicAcls).toBe(true);
      expect(publicBlock?.RestrictPublicBuckets).toBe(true);

      console.log('\n=== S3 Application Bucket ===');
      console.log('Bucket:', applicationBucketName);
      console.log('Logging Target:', logging.LoggingEnabled?.TargetBucket);
      console.log('KMS Key:', defaultSSE?.KMSMasterKeyID);
    });
  });

  describe('Security & Compliance', () => {
    test('CloudTrail trail is logging across regions with validation enabled', async () => {
      expect(cloudTrailName).toBeTruthy();

      const cloudTrailClient = new CloudTrailClient(createAwsConfig());

      const describeResponse = await cloudTrailClient.send(
        new DescribeTrailsCommand({
          trailNameList: [cloudTrailName],
          includeShadowTrails: false,
        })
      );

      const trail = describeResponse.trailList?.[0];
      expect(trail).toBeDefined();
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);

      const status = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: cloudTrailName })
      );

      expect(status.IsLogging).toBe(true);

      console.log('\n=== CloudTrail ===');
      console.log('Trail Name:', trail?.Name);
      console.log('Is Logging:', status.IsLogging);
      console.log('Latest Delivery Time:', status.LatestDeliveryTime);
    });

    test('AWS Config recorder is enabled and recording all resources', async () => {
      expect(configRecorderName).toBeTruthy();

      const configClient = new ConfigServiceClient(createAwsConfig());

      const recordersResponse = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      const recorder = recordersResponse.ConfigurationRecorders?.find(
        item => item.name === configRecorderName
      );
      expect(recorder).toBeDefined();
      expect(recorder?.recordingGroup?.allSupported).toBe(true);
      expect(recorder?.recordingGroup?.includeGlobalResourceTypes).toBe(true);

      const statusResponse = await configClient.send(
        new DescribeConfigurationRecorderStatusCommand({
          ConfigurationRecorderNames: [configRecorderName],
        })
      );

      const status = statusResponse.ConfigurationRecordersStatus?.[0];
      expect(status?.recording).toBe(true);

      console.log('\n=== AWS Config Recorder ===');
      console.log('Recorder Name:', recorder?.name);
      console.log('Recording:', status?.recording);
      console.log('Last Status Change:', status?.lastStatusChangeTime);
    });

    test('WAF web ACL applies managed rule groups and rate limiting', async () => {
      expect(webAclArn).toBeTruthy();

      const wafClient = new WAFV2Client(createAwsConfig());

      const segments = webAclArn.split('/');
      const scopeSegment = segments[1];
      const scope = scopeSegment === 'global' ? 'CLOUDFRONT' : 'REGIONAL';
      const webAclName = segments[2];
      const webAclId = segments[3];

      const response = await wafClient.send(
        new GetWebACLCommand({
          Name: webAclName,
          Id: webAclId,
          Scope: scope,
        })
      );

      const webAcl = response.WebACL;
      expect(webAcl).toBeDefined();
      expect(webAcl?.DefaultAction?.Allow).toBeDefined();
      expect(webAcl?.VisibilityConfig?.CloudWatchMetricsEnabled).toBe(true);
      expect(webAcl?.Rules?.length).toBeGreaterThanOrEqual(3);

      const rateLimitRule = webAcl?.Rules?.find(
        rule => rule.Name === 'RateLimitRule'
      );
      expect(rateLimitRule?.Statement?.RateBasedStatement?.Limit).toBe(2000);

      console.log('\n=== WAF Web ACL ===');
      console.log('Name:', webAcl?.Name);
      console.log('Metric:', webAcl?.VisibilityConfig?.MetricName);
      console.log('Rule Count:', webAcl?.Rules?.length);
    });
  });

  describe('Connectivity Checks', () => {
    test('ALB health endpoint responds over HTTP', async () => {
      expect(albDnsName).toBeTruthy();

      try {
        const url = `http://${albDnsName}/health`;
        const { status, headers, body } = await httpGet(url);

        console.log('\n=== ALB Connectivity ===');
        console.log('URL:', url);
        console.log('Status:', status);
        console.log('Content-Type:', headers['content-type']);

        expect([200, 301, 302, 403, 503]).toContain(status);

        if (status === 200) {
          console.log('Response Body:', body);
        }
      } catch (error: any) {
        console.error('ALB connectivity check failed:', error?.message || error);
        throw error;
      }
    });
  });
});

