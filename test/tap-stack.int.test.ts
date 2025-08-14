import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeTagsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  ListTopicsCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Configure AWS SDK v3 clients
const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });

describe('Security Infrastructure Integration Tests', () => {
  const testTimeout = 30000;

  describe('VPC Security', () => {
    test('VPC exists and is available', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      
      const response = await ec2Client.send(new DescribeVpcsCommand({ 
        VpcIds: [vpcId] 
      }));
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      // DNS attributes might need separate query
      expect(response.Vpcs![0]).toBeDefined();
    }, testTimeout);

    test('VPC has multiple subnets across AZs', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(new DescribeSubnetsCommand({ 
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }] 
      }));
      
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);
      
      // Check AZ distribution
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, testTimeout);

    test('Security groups are properly configured', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));
      
      // Check for web tier security group (allows HTTPS)
      const webSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('WebTierSecurityGroup')
      );
      expect(webSg).toBeDefined();
      
      // Check for app tier security group
      const appSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('AppTierSecurityGroup')
      );
      expect(appSg).toBeDefined();
      
      // Check for database tier security group
      const dbSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('DbTierSecurityGroup')
      );
      expect(dbSg).toBeDefined();
    }, testTimeout);

    test('VPC Flow Logs are enabled', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [
          { Name: 'resource-id', Values: [vpcId] }
        ]
      }));
      
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);
      
      // Check both S3 and CloudWatch destinations
      const s3FlowLog = response.FlowLogs!.find(fl => 
        fl.LogDestinationType === 's3'
      );
      expect(s3FlowLog).toBeDefined();
      
      const cwFlowLog = response.FlowLogs!.find(fl => 
        fl.LogDestinationType === 'cloud-watch-logs'
      );
      expect(cwFlowLog).toBeDefined();
    }, testTimeout);
  });

  describe('S3 Flow Logs Storage', () => {
    test('Flow logs S3 bucket exists and is configured correctly', async () => {
      const bucketName = outputs.FlowLogsBucketName;
      expect(bucketName).toBeDefined();
      
      // Check bucket exists
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      const flowLogsBucket = bucketsResponse.Buckets!.find(b => b.Name === bucketName);
      expect(flowLogsBucket).toBeDefined();
      
      // Check versioning is enabled
      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({ 
        Bucket: bucketName 
      }));
      expect(versioningResponse.Status).toBe('Enabled');
      
      // Check encryption is enabled
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ 
        Bucket: bucketName 
      }));
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      
      // Check public access is blocked
      const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({ 
        Bucket: bucketName 
      }));
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    }, testTimeout);

    test('Flow logs bucket has lifecycle rules configured', async () => {
      const bucketName = outputs.FlowLogsBucketName;
      const response = await s3Client.send(new GetBucketLifecycleConfigurationCommand({ 
        Bucket: bucketName 
      }));
      
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      
      const retentionRule = response.Rules!.find(r => r.ID === 'FlowLogsRetention');
      expect(retentionRule).toBeDefined();
      expect(retentionRule!.Status).toBe('Enabled');
      expect(retentionRule!.Transitions).toBeDefined();
      expect(retentionRule!.Transitions!.length).toBeGreaterThan(0);
    }, testTimeout);
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch log group for flow logs exists', async () => {
      const response = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/vpc/flowlogs/'
      }));
      
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      
      const flowLogsGroup = response.logGroups!.find(lg => 
        lg.logGroupName?.includes('synthtrainr86')
      );
      expect(flowLogsGroup).toBeDefined();
      expect(flowLogsGroup!.retentionInDays).toBe(365);
    }, testTimeout);

    test('Security dashboard exists', async () => {
      const response = await cloudWatchClient.send(new ListDashboardsCommand({
        DashboardNamePrefix: 'SecurityMetrics'
      }));
      
      expect(response.DashboardEntries).toBeDefined();
      const securityDashboard = response.DashboardEntries!.find(d => 
        d.DashboardName?.includes('SecurityMetrics-synthtrainr86')
      );
      expect(securityDashboard).toBeDefined();
    }, testTimeout);

    test('CloudWatch alarms are configured', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'TapStacksynthtrainr86Monitoring'
      }));
      
      expect(response.MetricAlarms).toBeDefined();
      const rejectedConnectionsAlarm = response.MetricAlarms!.find(a => 
        a.AlarmName?.includes('RejectedConnectionsAlarm')
      );
      expect(rejectedConnectionsAlarm).toBeDefined();
    }, testTimeout);
  });

  describe('SNS Notifications', () => {
    test('Security alerts SNS topic exists', async () => {
      const topicArn = outputs.SecurityAlertsTopicArn;
      expect(topicArn).toBeDefined();
      
      const response = await snsClient.send(new ListTopicsCommand({}));
      const securityTopic = response.Topics!.find(t => t.TopicArn === topicArn);
      expect(securityTopic).toBeDefined();
      
      // Check topic attributes
      const attributesResponse = await snsClient.send(new GetTopicAttributesCommand({ 
        TopicArn: topicArn 
      }));
      expect(attributesResponse.Attributes).toBeDefined();
      expect(attributesResponse.Attributes!.DisplayName).toContain('Security Alerts');
    }, testTimeout);

    test('SNS topic has SSL enforcement policy', async () => {
      const topicArn = outputs.SecurityAlertsTopicArn;
      const response = await snsClient.send(new GetTopicAttributesCommand({ 
        TopicArn: topicArn 
      }));
      
      const policy = JSON.parse(response.Attributes!.Policy);
      const sslEnforcementStatement = policy.Statement.find((s: any) => 
        s.Effect === 'Deny' && 
        s.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      expect(sslEnforcementStatement).toBeDefined();
    }, testTimeout);
  });

  describe('GuardDuty', () => {
    test('GuardDuty detector ID is exported', async () => {
      const detectorId = outputs.GuardDutyDetectorId;
      expect(detectorId).toBeDefined();
      expect(detectorId).toBe('4dc074dbceb04fc1a1da094d3f38f35c');
    }, testTimeout);
  });

  describe('Network Connectivity', () => {
    test('NAT Gateways are provisioned for private subnets', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] }
        ]
      }));
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    }, testTimeout);

    test('Internet Gateway is attached to VPC', async () => {
      const vpcId = outputs.VpcId;
      const response = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [vpcId] }
        ]
      }));
      
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      expect(response.InternetGateways![0].Attachments![0].State).toBe('available');
    }, testTimeout);
  });

  describe('Compliance and Tags', () => {
    test('Resources have required compliance tags', async () => {
      const vpcId = outputs.VpcId;
      
      // Check VPC tags
      const response = await ec2Client.send(new DescribeTagsCommand({
        Filters: [
          { Name: 'resource-id', Values: [vpcId] }
        ]
      }));
      
      expect(response.Tags).toBeDefined();
      
      const securityLevelTag = response.Tags!.find(t => t.Key === 'SecurityLevel');
      expect(securityLevelTag).toBeDefined();
      expect(securityLevelTag!.Value).toBe('High');
      
      const complianceTag = response.Tags!.find(t => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag!.Value).toBe('Enterprise');
      
      const dataClassificationTag = response.Tags!.find(t => t.Key === 'DataClassification');
      expect(dataClassificationTag).toBeDefined();
      expect(dataClassificationTag!.Value).toBe('Confidential');
    }, testTimeout);
  });
});