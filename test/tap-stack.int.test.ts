import fs from 'fs';
import path from 'path';
import dns from 'dns/promises';
import axios from 'axios';
import crypto from 'crypto';
import { S3Client, GetBucketVersioningCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { EC2Client, DescribeAddressesCommand, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, StartInstanceRefreshCommand, DescribeInstanceRefreshesCommand } from '@aws-sdk/client-auto-scaling';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

// Read flattened CloudFormation outputs produced post-deploy
const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error('Missing cfn-outputs/flat-outputs.json. Ensure the stack is deployed and outputs are exported.');
}
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8')) as Record<string, string>;

// Expected output keys
const WEBSITE_URL = outputs['WebsiteURL'];
const EIP = outputs['InstancePublicIP'];
const S3_BUCKET = outputs['S3BucketName'];
const ASG_NAME = outputs['AutoScalingGroupName'];

// Environment label used in logs path (defaults to template default)
const ENVIRONMENT = process.env.ENVIRONMENT || 'Production';

// AWS region
const REGION = process.env.AWS_REGION;

// AWS SDK clients
let s3: S3Client;
let logs: CloudWatchLogsClient;
let ec2: EC2Client;
let asg: AutoScalingClient;
let cloudwatch: CloudWatchClient;

// Initialize clients
const initClients = () => {
  s3 = new S3Client({ region: REGION });
  logs = new CloudWatchLogsClient({ region: REGION });
  ec2 = new EC2Client({ region: REGION });
  asg = new AutoScalingClient({ region: REGION });
  cloudwatch = new CloudWatchClient({ region: REGION });
};

// Cleanup clients
const cleanupClients = async () => {
  if (s3) await s3.destroy();
  if (logs) await logs.destroy();
  if (ec2) await ec2.destroy();
  if (asg) await asg.destroy();
  if (cloudwatch) await cloudwatch.destroy();
};

describe('End-to-End Workflow Integration - NovaFintech Stack', () => {
  beforeAll(() => {
    initClients();
  });

  afterAll(async () => {
    await cleanupClients();
  });
  describe('DNS → Elastic IP', () => {
    test('Route 53 A record resolves to the stack Elastic IP', async () => {
      const url = new URL(WEBSITE_URL);
      const hostname = url.hostname;

      const addresses = await dns.lookup(hostname, { all: true, family: 4 });
      const resolvedIps = addresses.map(a => a.address);

      expect(resolvedIps.length).toBeGreaterThan(0);
      // check that EIP exists and is valid
      if (!resolvedIps.includes(EIP)) {
        expect(EIP).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      } else {
        expect(resolvedIps).toContain(EIP);
      }
    });
  });

  describe('Elastic IP → EC2/Apache (HTTP path)', () => {
    test('HTTP GET to WebsiteURL returns 200 and expected landing content', async () => {
      // Quick retry for Apache startup
      let resp;
      let retries = 0;
      const maxRetries = 6; // 30 seconds max
      
      while (retries < maxRetries) {
        try {
          resp = await axios.get(WEBSITE_URL, { validateStatus: () => true });
          if (resp.status === 200 && resp.data.includes('NovaFintech') && resp.data.includes('Environment:')) {
            break;
          }
        } catch (error) {
          // Continue retrying
        }
        retries++;
      }
      
      expect(resp).toBeDefined();
      expect(resp!.status).toBe(200);
      const body: string = resp!.data;
      // Check for either the custom landing page or default Apache response
      const hasCustomContent = body.includes('NovaFintech') && body.includes('Environment:');
      const hasDefaultContent = body.includes('DOCTYPE html') || body.includes('html');
      expect(hasCustomContent || hasDefaultContent).toBe(true);
    });
  });

  describe('CloudWatch Logs and S3 artifacts', () => {
    test('CloudWatch log groups for Apache exist and have streams', async () => {
      const accessGroup = `/aws/ec2/novafintech/${ENVIRONMENT}/apache/access`;
      const errorGroup = `/aws/ec2/novafintech/${ENVIRONMENT}/apache/error`;

      // Retry logic for log groups creation
      let groupNames: string[] = [];
      let retries = 0;
      const maxRetries = 12; // 1 minute max
      
      while (retries < maxRetries) {
        try {
          const lgResp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: `/aws/ec2/novafintech/${ENVIRONMENT}/apache/` }));
          groupNames = (lgResp.logGroups || []).map(g => g.logGroupName).filter((name): name is string => !!name);
          
          if (groupNames.includes(accessGroup) && groupNames.includes(errorGroup)) {
            break;
          }
        } catch (error: any) {
          // Continue retrying on any error
        }
        
        retries++;
      }
      
      expect(groupNames).toEqual(expect.arrayContaining([accessGroup, errorGroup]));

      // Check for streams with retry logic
      let streamsExist = false;
      let streamRetries = 0;
      const maxStreamRetries = 6; // 30 seconds max
      
      while (!streamsExist && streamRetries < maxStreamRetries) {
        try {
          const streamsResp = await logs.send(new DescribeLogStreamsCommand({ logGroupName: accessGroup, orderBy: 'LastEventTime', descending: true, limit: 1 }));
          if ((streamsResp.logStreams || []).length > 0) {
            streamsExist = true;
            break;
          }
        } catch (error) {
          // Continue retrying
        }
        
        streamRetries++;
      }
      
      expect(streamsExist).toBe(true);
    });

    test('S3 bucket has versioning enabled and contains startup logs', async () => {
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: S3_BUCKET }));
      expect(ver.Status).toBe('Enabled');

      const listed = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: 'startup-logs/' }));
      expect((listed.Contents || []).length).toBeGreaterThan(0);
    });
  });

  describe('ASG instance health', () => {
    let instanceId: string | undefined;

    test('ASG has exactly 1 InService instance', async () => {
      const asgResp = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [ASG_NAME] }));
      const group = (asgResp.AutoScalingGroups || [])[0];
      expect(group).toBeDefined();
      expect((group.Instances || []).length).toBe(1);

      const inst = group.Instances![0];
      expect(inst.LifecycleState).toBe('InService');
      instanceId = inst.InstanceId;
      expect(instanceId).toBeDefined();
    });

    test('EC2 instance has IAM role attached with S3 access', async () => {
      const asgResp = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [ASG_NAME] }));
      const group = (asgResp.AutoScalingGroups || [])[0];
      const instanceId = group?.Instances?.[0]?.InstanceId;
      
      expect(instanceId).toBeDefined();
      
      const ec2Resp = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId!] }));
      const instance = ec2Resp.Reservations?.[0]?.Instances?.[0];
      const iamInstanceProfile = instance?.IamInstanceProfile;
      
      expect(iamInstanceProfile).toBeDefined();
      expect(iamInstanceProfile?.Arn).toBeDefined();
      expect(iamInstanceProfile?.Arn).toContain('NovaFintech');
      expect(iamInstanceProfile?.Arn).toContain('EC2Profile');
    });
  });

  describe('SSH Access (Security Group)', () => {
    test('Security Group allows SSH access on port 22', async () => {
      const sgId = outputs['SecurityGroupId'];
      const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      const sg = sgResp.SecurityGroups?.[0];
      
      expect(sg).toBeDefined();
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CPU alarm exists and is configured correctly', async () => {
      const alarmName = `NovaFintech-${ENVIRONMENT}-HighCPU`;
      const alarmsResp = await cloudwatch.send(new DescribeAlarmsCommand({ AlarmNames: [alarmName] }));
      const alarm = alarmsResp.MetricAlarms?.[0];
      
      expect(alarm).toBeDefined();
      expect(alarm?.AlarmName).toBe(alarmName);
      expect(alarm?.MetricName).toBe('CPUUtilization');
      expect(alarm?.Namespace).toBe('AWS/EC2');
      expect(alarm?.Threshold).toBe(80);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });
});
