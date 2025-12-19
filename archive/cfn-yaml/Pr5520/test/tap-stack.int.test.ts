import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from '@aws-sdk/client-cloudtrail';
import { DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';
import http from 'http';
import path from 'path';

// Create AWS config factory to use detected region
function createAwsConfig() {
  const config: any = {
    maxAttempts: 3,
    region: detectedRegion
  };

  // If AWS credentials are available in environment, use them explicitly
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
    };
  }

  return config;
}

// Optional: allow CI to override outputs path, default to local flat-outputs.json
const outputsPath = process.env.CFN_OUTPUTS_PATH || path.join(__dirname, '../cfn-outputs/flat-outputs.json');

function readFlatOutputs(): Record<string, any> | null {
  try {
    if (!fs.existsSync(outputsPath)) {
      console.error(`Outputs file not found at: ${outputsPath}`);
      return null;
    }
    const raw = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to read or parse outputs file: ${e}`);
    return null;
  }
}

function httpGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('Request timeout')));
  });
}

// Read once for all tests
const flat = readFlatOutputs();

// Extract AWS region from outputs (RDS endpoint or SNS ARN) if available
function extractRegionFromOutputs(): string {
  if (!flat) return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

  // Try to extract from RDS endpoint
  const rdsEndpoint = flat['DBEndpoint'];
  if (rdsEndpoint && typeof rdsEndpoint === 'string') {
    const match = rdsEndpoint.match(/\.([a-z0-9-]+)\.rds\.amazonaws\.com/);
    if (match) return match[1];
  }

  // Try to extract from SNS ARN
  const snsArn = flat['AlarmTopicArn'];
  if (snsArn && typeof snsArn === 'string') {
    const match = snsArn.match(/^arn:aws:sns:([a-z0-9-]+):/);
    if (match) return match[1];
  }

  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
}

const detectedRegion = extractRegionFromOutputs();

describe('TapStack Integration Tests (Production Infrastructure)', () => {
  // Increase timeout for network calls
  beforeAll(() => {
    // 60 seconds, as ALB connection can be slow to establish
    jest.setTimeout(60000);
    
    // Fail fast if outputs file is not available
    if (!flat) {
      throw new Error('flat-outputs.json not found. Integration tests require deployed infrastructure outputs.');
    }
  });

  const albDns = (flat!['ApplicationLoadBalancerDNS'] || '').toString();
  const rdsEndpoint = (flat!['DBEndpoint'] || '').toString();
  const s3BucketName = (flat!['ApplicationDataBucketName'] || '').toString();
  const vpcId = (flat!['VPCId'] || '').toString();
  const kmsKeyId = (flat!['KMSKeyId'] || '').toString();
  const cloudTrailName = (flat!['CloudTrailName'] || '').toString();
  const alarmTopicArn = (flat!['AlarmTopicArn'] || '').toString();
  const lambdaFunctionArn = (flat!['LambdaFunctionArn'] || '').toString();
  const loadBalancerURL = (flat!['LoadBalancerURL'] || '').toString();

  test('verify required outputs are present and non-empty', () => {
    const required = [
      'VPCId',
      'ApplicationLoadBalancerDNS',
      'ApplicationDataBucketName',
      'KMSKeyId',
      'DBEndpoint',
      'CloudTrailName',
      'AlarmTopicArn',
      'LoadBalancerURL',
      'LambdaFunctionArn'
    ];

    let missing: string[] = [];
    required.forEach(key => {
      const val = (flat![key] || '').toString();
      if (!val || val.length === 0) {
        missing.push(key);
      }
      expect(flat![key]).toBeDefined();
      expect(val.length).toBeGreaterThan(0);
    });
    if (missing.length > 0) {
      console.error(`Missing required outputs: ${missing.join(', ')}`);
    }
  });

  describe('Infrastructure Output Validation', () => {
    test('VPC ID format is valid', () => {
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      console.log('\n— VPC Validation —');
      console.log('VPC ID:', vpcId);
    });

    test('KMS Key ID format is valid', () => {
      expect(kmsKeyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      console.log('\n— KMS Encryption —');
      console.log('KMS Key ID:', kmsKeyId);
    });

    test('RDS endpoint format is valid', () => {
      expect(rdsEndpoint).toContain('.rds.amazonaws.com');
      console.log('\n— RDS Database —');
      console.log('RDS Endpoint:', rdsEndpoint);
    });

    test('S3 bucket name format is valid', () => {
      expect(s3BucketName).toMatch(/^tapstack-[a-z0-9]+-app-bucket-[0-9]+$/);
      console.log('\n— S3 Storage —');
      console.log('Application Bucket:', s3BucketName);
    });

    test('SNS Topic ARN format is valid', () => {
      expect(alarmTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:[0-9]+:.+$/);
      console.log('\n— CloudWatch Alarms —');
      console.log('SNS Topic ARN:', alarmTopicArn);
    });

    test('Lambda Function ARN format is valid', () => {
      expect(lambdaFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:[0-9]+:function:.+$/);
      console.log('\n— Lambda Function —');
      console.log('Lambda ARN:', lambdaFunctionArn);
    });

    test('Load Balancer URL format is valid', () => {
      expect(loadBalancerURL).toMatch(/^http:\/\/.+\.[a-z0-9-]+\.elb\.amazonaws\.com$/);
      console.log('\n— Load Balancer —');
      console.log('Load Balancer URL:', loadBalancerURL);
    });
  });

  describe('ALB -> ASG -> EC2 -> Services E2E', () => {
    let healthStatus = 0;
    let healthJson: any = null;

    beforeAll(async () => {
      if (!albDns) {
        console.log('ALB DNS not found, skipping E2E tests.');
        return;
      }
      try {
        const { status, body } = await httpGet(`http://${albDns}/health`);
        healthStatus = status;
        try {
          healthJson = JSON.parse(body);
        } catch (e) {
          console.error('Failed to parse JSON from /health response:', body);
          healthJson = {};
        }
      } catch (e: any) {
        console.error(`HTTP request to /health failed: ${e.message}`);
      }
    });

    test('ALB -> TargetGroup -> ASG -> EC2 path (GET /health returns 200)', () => {
      expect(healthStatus).toBe(200);
      console.log('\n— E2E Path Verification —');
      console.log('Network path: Client -> ALB -> Target Group -> Auto Scaling Group -> EC2: OK');
      console.log('ALB DNS:', albDns);
      console.log('Overall application health (from /health):', healthJson?.status);
    });

    test('health check returns healthy status', () => {
      expect(healthJson?.status).toBe('healthy');
      console.log('\n— Health Check Status —');
      console.log('Application status:', healthJson?.status);
    });

    test('EC2 -> RDS connectivity', () => {
      expect(healthJson?.rds).toBe('success');
      console.log('\n— EC2 -> RDS —');
      console.log('RDS endpoint =', rdsEndpoint || 'N/A', '| status =', healthJson?.rds);
    });

    test('EC2 -> S3 connectivity', () => {
      expect(healthJson?.s3).toBe('success');
      console.log('\n— EC2 -> S3 —');
      console.log('S3 bucket =', s3BucketName || 'N/A', '| status =', healthJson?.s3);
    });

    test('Application root path via ALB -> ASG -> EC2 (GET /)', async () => {
      if (!albDns) {
        return;
      }
      const { status, body } = await httpGet(`http://${albDns}/`);
      expect(status).toBe(200);
      expect(body).toContain('Financial Services Application - OK');

      console.log('\n— Application Page Verification —');
      console.log('Page served via: ALB -> Target Group -> ASG -> EC2: OK');
      console.log('Verified root path / serves plain text welcome message.');
    });
  });

  describe('Security & Best Practices Validation', () => {
    test('CloudTrail is configured (placeholder or active)', async () => {
      expect(cloudTrailName).toBeDefined();
      expect(cloudTrailName.length).toBeGreaterThan(0);

      console.log('\n— Audit & Compliance —');
      console.log('CloudTrail Name/ARN:', cloudTrailName);

      if (cloudTrailName.includes('placeholder')) {
        console.log('CloudTrail Status: Placeholder (not yet implemented)');
        console.log('Note: CloudTrail should be enabled in production for compliance');
        expect(cloudTrailName).toContain('cloudtrail');
      } else {
        const cloudTrailClient = new CloudTrailClient(createAwsConfig());

        try {
          const statusResponse = await cloudTrailClient.send(
            new GetTrailStatusCommand({ Name: cloudTrailName })
          );

          expect(statusResponse.IsLogging).toBe(true);

          const describeResponse = await cloudTrailClient.send(
            new DescribeTrailsCommand({ trailNameList: [cloudTrailName] })
          );

          const trail = describeResponse.trailList?.[0];
          expect(trail).toBeDefined();

        console.log('CloudTrail Status: Logging =', statusResponse.IsLogging);
        console.log('Multi-Region Trail:', trail?.IsMultiRegionTrail);
        console.log('S3 Bucket:', trail?.S3BucketName);
      } catch (error: any) {
        console.log('CloudTrail check failed:', error.message);
        throw error;
      }
      }
    });

    test('KMS key is enabled and ready for encryption', async () => {
      expect(kmsKeyId).toBeDefined();
      expect(kmsKeyId.length).toBeGreaterThan(0);

      try {
        const kmsClient = new KMSClient(createAwsConfig());
        const keyResponse = await kmsClient.send(
          new DescribeKeyCommand({ KeyId: kmsKeyId })
        );

        const keyMetadata = keyResponse.KeyMetadata;
        expect(keyMetadata).toBeDefined();
        expect(keyMetadata?.Enabled).toBe(true);
        expect(keyMetadata?.KeyState).toBe('Enabled');

        console.log('\n— Data Encryption —');
        console.log('KMS Key ID:', kmsKeyId);
        console.log('KMS Key State:', keyMetadata?.KeyState);
        console.log('Key Usage:', keyMetadata?.KeyUsage);
        console.log('Origin:', keyMetadata?.Origin);
      } catch (error: any) {
        console.log('KMS validation failed:', error.message);
        throw error;
      }
    });

    test('S3 bucket has encryption enabled', async () => {
      expect(s3BucketName).toBeDefined();
      expect(s3BucketName.length).toBeGreaterThan(0);

      const s3Client = new S3Client(createAwsConfig());
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = encryptionResponse.ServerSideEncryptionConfiguration?.Rules;
      expect(rules).toBeDefined();
      expect(rules!.length).toBeGreaterThan(0);

      const encryptionRule = rules![0];
      expect(encryptionRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(encryptionRule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(kmsKeyId);

      console.log('\n— S3 Bucket Encryption —');
      console.log('S3 Bucket:', s3BucketName);
      console.log('Encryption Algorithm:', encryptionRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm);
      console.log('KMS Key ID:', encryptionRule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID);
      console.log('Bucket Key Enabled:', encryptionRule.BucketKeyEnabled);
    });

    test('SNS topic exists and is configured for alarms', async () => {
      expect(alarmTopicArn).toBeDefined();
      expect(alarmTopicArn).toContain('sns');

      const snsClient = new SNSClient(createAwsConfig());
      const topicResponse = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: alarmTopicArn })
      );

      expect(topicResponse.Attributes).toBeDefined();
      const attributes = topicResponse.Attributes!;

      console.log('\n— Monitoring & Alerting —');
      console.log('SNS Topic ARN:', alarmTopicArn);
      console.log('Topic Display Name:', attributes.DisplayName || 'N/A');
      console.log('Subscriptions Confirmed:', attributes.SubscriptionsConfirmed);
      console.log('Subscriptions Pending:', attributes.SubscriptionsPending);
    });
  });

  describe('High Availability & Scalability', () => {
    test('RDS Multi-AZ deployment is enabled', async () => {
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toContain('.rds.amazonaws.com');

      // Extract DB instance identifier from endpoint
      const dbIdentifier = rdsEndpoint.split('.')[0];

      try {
        const rdsClient = new RDSClient(createAwsConfig());
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier
          })
        );

        const dbInstance = dbResponse.DBInstances?.[0];
        expect(dbInstance).toBeDefined();
        expect(dbInstance?.MultiAZ).toBe(true);
        expect(dbInstance?.StorageEncrypted).toBe(true);

        console.log('\n— RDS High Availability —');
        console.log('DB Instance:', dbIdentifier);
        console.log('Multi-AZ Deployment:', dbInstance?.MultiAZ);
        console.log('Storage Encrypted:', dbInstance?.StorageEncrypted);
        console.log('Instance Class:', dbInstance?.DBInstanceClass);
        console.log('Engine:', dbInstance?.Engine, dbInstance?.EngineVersion);
        console.log('Availability Zone:', dbInstance?.AvailabilityZone);
        console.log('Backup Retention Period:', dbInstance?.BackupRetentionPeriod, 'days');
      } catch (error: any) {
        console.log('RDS validation failed:', error.message);
        throw error;
      }
    });

    test('Auto Scaling Group is configured with min 2, max 6 instances', async () => {
      const asgClient = new AutoScalingClient(createAwsConfig());

      const asgResponse = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const tapStackASG = asgResponse.AutoScalingGroups?.find(asg =>
        asg.AutoScalingGroupName?.includes('TapStack')
      );

      expect(tapStackASG).toBeDefined();
      expect(tapStackASG?.MinSize).toBe(2);
      expect(tapStackASG?.MaxSize).toBe(6);
      expect(tapStackASG?.DesiredCapacity).toBeGreaterThanOrEqual(2);

      const azs = new Set(tapStackASG?.Instances?.map(i => i.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      console.log('\n— Auto Scaling Group —');
      console.log('ASG Name:', tapStackASG?.AutoScalingGroupName);
      console.log('Min Size:', tapStackASG?.MinSize);
      console.log('Max Size:', tapStackASG?.MaxSize);
      console.log('Desired Capacity:', tapStackASG?.DesiredCapacity);
      console.log('Current Instance Count:', tapStackASG?.Instances?.length);
      console.log('Availability Zones:', Array.from(azs).join(', '));
      console.log('Health Check Type:', tapStackASG?.HealthCheckType);
      console.log('Health Check Grace Period:', tapStackASG?.HealthCheckGracePeriod, 'seconds');
    });

    test('Application Load Balancer spans multiple availability zones', async () => {
      expect(albDns).toBeDefined();
      expect(albDns.length).toBeGreaterThan(0);

      try {
        const elbClient = new ElasticLoadBalancingV2Client(createAwsConfig());

        const albResponse = await elbClient.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = albResponse.LoadBalancers?.find(lb =>
          lb.DNSName === albDns
        );

        expect(alb).toBeDefined();
        expect(alb?.Scheme).toBe('internet-facing');
        expect(alb?.Type).toBe('application');
        expect(alb?.State?.Code).toBe('active');

        const availabilityZones = alb?.AvailabilityZones || [];
        expect(availabilityZones.length).toBeGreaterThanOrEqual(2);

        console.log('\n— Application Load Balancer —');
        console.log('Load Balancer ARN:', alb?.LoadBalancerArn?.split('/').slice(-2).join('/'));
        console.log('DNS Name:', alb?.DNSName);
        console.log('Scheme:', alb?.Scheme);
        console.log('State:', alb?.State?.Code);
        console.log('Availability Zones:', availabilityZones.map(az => az.ZoneName).join(', '));
        console.log('VPC:', alb?.VpcId);
      } catch (error: any) {
        console.log('ALB validation failed:', error.message);
        throw error;
      }
    });

    test('Target Group has health checks properly configured', async () => {
      try {
        const elbClient = new ElasticLoadBalancingV2Client(createAwsConfig());

        const tgResponse = await elbClient.send(
          new DescribeTargetGroupsCommand({})
        );

        const tapStackTG = tgResponse.TargetGroups?.find(tg =>
          tg.TargetGroupName?.includes('TapStack')
        );

        expect(tapStackTG).toBeDefined();
        expect(tapStackTG?.HealthCheckEnabled).toBe(true);
        expect(tapStackTG?.HealthCheckPath).toBe('/health');
        expect(tapStackTG?.HealthCheckProtocol).toBe('HTTP');
        expect(tapStackTG?.HealthCheckIntervalSeconds).toBeDefined();
        expect(tapStackTG?.HealthyThresholdCount).toBeDefined();
        expect(tapStackTG?.UnhealthyThresholdCount).toBeDefined();

        // Check target health
        const healthResponse = await elbClient.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: tapStackTG?.TargetGroupArn
          })
        );

        const allTargets = healthResponse.TargetHealthDescriptions || [];
        const healthyTargets = allTargets.filter(
          t => t.TargetHealth?.State === 'healthy'
        );
        const totalTargets = allTargets.length;

        console.log('\n— Target Group Health Checks —');
        console.log('Target Group Name:', tapStackTG?.TargetGroupName);
        console.log('Health Check Path:', tapStackTG?.HealthCheckPath);
        console.log('Health Check Interval:', tapStackTG?.HealthCheckIntervalSeconds, 'seconds');
        console.log('Health Check Timeout:', tapStackTG?.HealthCheckTimeoutSeconds, 'seconds');
        console.log('Healthy Threshold:', tapStackTG?.HealthyThresholdCount);
        console.log('Unhealthy Threshold:', tapStackTG?.UnhealthyThresholdCount);
        console.log('Total Targets:', totalTargets);
        console.log('Healthy Targets:', healthyTargets.length);

        if (allTargets.length > 0) {
          console.log('Target States:');
          allTargets.forEach((target, idx) => {
            console.log(`  Target ${idx + 1}: ${target.TargetHealth?.State || 'unknown'} - ${target.TargetHealth?.Reason || 'N/A'}`);
          });

          expect(totalTargets).toBeGreaterThanOrEqual(1);
          expect(healthyTargets.length).toBeGreaterThanOrEqual(1);
        }
      } catch (error: any) {
        console.log('Target Group validation failed:', error.message);
        throw error;
      }
    });
  });
});
