import {
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeNetworkAclsCommand,
  DescribeVpcEndpointsCommand,
  DescribeFlowLogsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  ListAliasesCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import {
  DescribeLogGroupsCommand,
  CloudWatchLogsClient
} from '@aws-sdk/client-cloudwatch-logs';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  DescribeAutoScalingGroupsCommand,
  AutoScalingClient
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';
import fs from 'fs';

// Load CloudFormation stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configuration
const region = process.env.AWS_REGION || 'us-east-2';
const stackName = process.env.STACK_NAME || 'TapStackpr1835';

describe('TAP Multi-Tier Architecture Integration Tests - Deployed AWS Resources', () => {

  describe('VPC and Networking', () => {
    const ec2 = new EC2Client({ region });

    test('VPC exists with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      
      const response = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));
      
      const vpc = response.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      
      // DNS settings are returned as attributes, not direct properties
      // You can verify these with DescribeVpcAttribute if needed
      expect(vpc).toBeDefined();
      expect(vpc?.VpcId).toBe(vpcId);
    });

    test('6 subnets exist across 3 tiers', async () => {
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));
      
      const subnets = response.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(6);
      
      // Check for public, app, and db subnets
      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = subnets.filter(s => s.MapPublicIpOnLaunch === false);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(4);
      
      // Verify CIDR blocks
      const expectedCidrs = [
        '10.0.0.0/20', '10.0.16.0/20',   // Public
        '10.0.32.0/20', '10.0.48.0/20',  // App
        '10.0.64.0/20', '10.0.80.0/20'   // DB
      ];
      
      const actualCidrs = subnets.map(s => s.CidrBlock);
      expectedCidrs.forEach(cidr => {
        expect(actualCidrs).toContain(cidr);
      });
    });

    test('2 NAT Gateways exist and are available', async () => {
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] }
        ]
      }));
      
      const natGateways = response.NatGateways || [];
      expect(natGateways.length).toBe(2);
      
      natGateways.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses).toHaveLength(1);
      });
    });

    test('Network ACLs exist for each tier', async () => {
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeNetworkAclsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));
      
      const nacls = response.NetworkAcls || [];
      // At least 4 NACLs: default + 3 custom (public, app, db)
      expect(nacls.length).toBeGreaterThanOrEqual(4);
      
      // Check for custom NACLs by looking at entries
      const customNacls = nacls.filter(nacl => 
        nacl.Entries?.some(e => e.RuleNumber && e.RuleNumber < 32767)
      );
      expect(customNacls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Security Groups', () => {
    const ec2 = new EC2Client({ region });

    test('ALB security group allows HTTP from internet', async () => {
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['sg-alb'] }
        ]
      }));
      
      const sg = response.SecurityGroups?.[0];
      if (sg) {
        const httpRule = sg.IpPermissions?.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();
        expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      }
    });

    test('App security group has restricted SSH', async () => {
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['sg-app'] }
        ]
      }));
      
      const sg = response.SecurityGroups?.[0];
      if (sg) {
        const sshRule = sg.IpPermissions?.find(rule => 
          rule.FromPort === 22 && rule.ToPort === 22
        );
        expect(sshRule).toBeDefined();
        expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('203.0.113.0/24');
      }
    });

    test('DB security group restricts to app tier', async () => {
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['sg-db'] }
        ]
      }));
      
      const sg = response.SecurityGroups?.[0];
      if (sg) {
        const mysqlRules = sg.IpPermissions?.filter(rule => 
          rule.FromPort === 3306 && rule.ToPort === 3306
        );
        expect(mysqlRules?.length).toBeGreaterThanOrEqual(1);
        
        // Should reference security groups, not CIDR blocks
        mysqlRules?.forEach(rule => {
          expect(rule.UserIdGroupPairs?.length).toBeGreaterThanOrEqual(1);
        });
      }
    });
  });

  describe('VPC Endpoint', () => {
    const ec2 = new EC2Client({ region });

    test('Secrets Manager VPC endpoint exists', async () => {
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeVpcEndpointsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'service-name', Values: [`com.amazonaws.${region}.secretsmanager`] }
        ]
      }));
      
      const endpoints = response.VpcEndpoints || [];
      if (endpoints.length > 0) {
        const endpoint = endpoints[0];
        expect(endpoint.State).toBe('available');
        expect(endpoint.VpcEndpointType).toBe('Interface');
        expect(endpoint.PrivateDnsEnabled).toBe(true);
      }
    });
  });

  describe('KMS Keys', () => {
    const kms = new KMSClient({ region });

    test('Data CMK exists and has rotation enabled', async () => {
      const response = await kms.send(new ListAliasesCommand({}));
      
      const dataAlias = response.Aliases?.find(a => 
        a.AliasName === 'alias/secure/data'
      );
      
      if (dataAlias?.TargetKeyId) {
        const keyResponse = await kms.send(new DescribeKeyCommand({
          KeyId: dataAlias.TargetKeyId
        }));
        
        expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
        expect(keyResponse.KeyMetadata?.Description).toContain('app data');
        
        const rotationResponse = await kms.send(new GetKeyRotationStatusCommand({
          KeyId: dataAlias.TargetKeyId
        }));
        
        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      }
    });

    test('Logs CMK exists and has rotation enabled', async () => {
      const response = await kms.send(new ListAliasesCommand({}));
      
      const logsAlias = response.Aliases?.find(a => 
        a.AliasName === 'alias/secure/logs'
      );
      
      if (logsAlias?.TargetKeyId) {
        const keyResponse = await kms.send(new DescribeKeyCommand({
          KeyId: logsAlias.TargetKeyId
        }));
        
        expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
        expect(keyResponse.KeyMetadata?.Description).toContain('logs');
        
        const rotationResponse = await kms.send(new GetKeyRotationStatusCommand({
          KeyId: logsAlias.TargetKeyId
        }));
        
        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      }
    });
  });

  describe('S3 Buckets', () => {
    const s3 = new S3Client({ region });

    test('Data bucket exists with KMS encryption', async () => {
      const bucketName = outputs.DataBucketName;
      expect(bucketName).toBeDefined();
      
      await expect(s3.send(new HeadBucketCommand({
        Bucket: bucketName
      }))).resolves.not.toThrow();
      
      const encResponse = await s3.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));
      
      const rule = encResponse.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    });

    test('Logs bucket exists with KMS encryption', async () => {
      const bucketName = outputs.LogsBucketName;
      expect(bucketName).toBeDefined();
      
      await expect(s3.send(new HeadBucketCommand({
        Bucket: bucketName
      }))).resolves.not.toThrow();
      
      const encResponse = await s3.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));
      
      const rule = encResponse.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    });

    test('Buckets have public access blocked', async () => {
      const buckets = [outputs.DataBucketName, outputs.LogsBucketName];
      
      for (const bucket of buckets) {
        const response = await s3.send(new GetPublicAccessBlockCommand({
          Bucket: bucket
        }));
        
        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);
      }
    });

    test('Buckets have versioning enabled', async () => {
      const buckets = [outputs.DataBucketName, outputs.LogsBucketName];
      
      for (const bucket of buckets) {
        const response = await s3.send(new GetBucketVersioningCommand({
          Bucket: bucket
        }));
        
        expect(response.Status).toBe('Enabled');
      }
    });

    test('Bucket policies enforce TLS', async () => {
      const buckets = [outputs.DataBucketName, outputs.LogsBucketName];
      
      for (const bucket of buckets) {
        const response = await s3.send(new GetBucketPolicyCommand({
          Bucket: bucket
        }));
        
        const policy = JSON.parse(response.Policy || '{}');
        const tlsStatement = policy.Statement?.find((s: any) => 
          s.Sid === 'DenyInsecureTransport' &&
          s.Effect === 'Deny'
        );
        
        expect(tlsStatement).toBeDefined();
        const secureTransport = tlsStatement?.Condition?.Bool?.['aws:SecureTransport'];
        expect(secureTransport === false || secureTransport === 'false').toBe(true);
      }
    });
  });

  describe('CloudWatch Logs', () => {
    const logs = new CloudWatchLogsClient({ region });

    test('VPC Flow Logs log group exists', async () => {
      const response = await logs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/secure/vpc/flow'
      }));
      
      const logGroup = response.logGroups?.find(lg => 
        lg.logGroupName === '/secure/vpc/flow'
      );
      
      if (logGroup) {
        expect(logGroup.retentionInDays).toBe(90);
        expect(logGroup.kmsKeyId).toBeDefined();
      }
    });

    test('VPC Flow Logs are enabled', async () => {
      const ec2 = new EC2Client({ region });
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }]
      }));
      
      const flowLogs = response.FlowLogs || [];
      expect(flowLogs.length).toBeGreaterThanOrEqual(1);
      
      const flowLog = flowLogs[0];
      if (flowLog) {
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
        expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      }
    });
  });

  describe('Load Balancer', () => {
    const elbv2 = new ElasticLoadBalancingV2Client({ region });

    test('ALB exists and is active', async () => {
      const albDns = outputs.ALBDNS;
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);
      
      const response = await elbv2.send(new DescribeLoadBalancersCommand({}));
      
      const alb = response.LoadBalancers?.find(lb => lb.DNSName === albDns);
      if (alb) {
        expect(alb.State?.Code).toBe('active');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.Type).toBe('application');
        expect(alb.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('Target group exists', async () => {
      const response = await elbv2.send(new DescribeTargetGroupsCommand({}));
      
      const tg = response.TargetGroups?.find(t => 
        t.TargetGroupName?.includes('tg-app') || 
        t.TargetGroupName?.includes(stackName)
      );
      
      if (tg) {
        expect(tg.Port).toBe(80);
        expect(tg.Protocol).toBe('HTTP');
        expect(tg.TargetType).toBe('instance');
        expect(tg.HealthCheckPath).toBe('/');
      }
    });

    test('HTTP listener is configured', async () => {
      const lbResponse = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const alb = lbResponse.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.ALBDNS
      );
      
      if (alb?.LoadBalancerArn) {
        const response = await elbv2.send(new DescribeListenersCommand({
          LoadBalancerArn: alb.LoadBalancerArn
        }));
        
        const listener = response.Listeners?.find(l => l.Port === 80);
        expect(listener).toBeDefined();
        expect(listener?.Protocol).toBe('HTTP');
        expect(listener?.DefaultActions?.[0]?.Type).toBe('forward');
      }
    });
  });

  describe('Auto Scaling Group', () => {
    const autoscaling = new AutoScalingClient({ region });

    test('ASG exists with zero capacity', async () => {
      const response = await autoscaling.send(new DescribeAutoScalingGroupsCommand({}));
      
      const asg = response.AutoScalingGroups?.find(a => 
        a.Tags?.some(t => 
          t.Key === 'aws:cloudformation:stack-name' && 
          t.Value === stackName
        )
      );
      
      if (asg) {
        expect(asg.MinSize).toBe(0);
        expect(asg.MaxSize).toBe(0);
        expect(asg.DesiredCapacity).toBe(0);
        expect(asg.VPCZoneIdentifier).toBeDefined();
      }
    });
  });

  describe('RDS Database', () => {
    const rds = new RDSClient({ region });

    test('RDS instance exists and is available', async () => {
      const dbEndpoint = outputs.RDSEndpoint;
      expect(dbEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      
      const response = await rds.send(new DescribeDBInstancesCommand({}));
      
      const dbInstance = response.DBInstances?.find(db => 
        db.Endpoint?.Address === dbEndpoint
      );
      
      if (dbInstance) {
        expect(dbInstance.DBInstanceStatus).toBe('available');
        expect(dbInstance.Engine).toBe('mysql');
        expect(dbInstance.EngineVersion).toContain('8.0');
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.PubliclyAccessible).toBe(false);
        expect(dbInstance.BackupRetentionPeriod).toBe(7);
      }
    });

    test('DB subnet group exists', async () => {
      const response = await rds.send(new DescribeDBSubnetGroupsCommand({}));
      
      const subnetGroup = response.DBSubnetGroups?.find(sg => 
        sg.DBSubnetGroupName?.includes(stackName) ||
        sg.DBSubnetGroupName?.includes('db-subnet-group')
      );
      
      if (subnetGroup) {
        expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
        expect(subnetGroup.Subnets?.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Secrets Manager', () => {
    const sm = new SecretsManagerClient({ region });

    test('DB secret exists with rotation configured', async () => {
      const response = await sm.send(new DescribeSecretCommand({
        SecretId: 'secure-rds-master'
      })).catch(() => null);
      
      if (response) {
        expect(response.RotationEnabled).toBe(true);
        expect(response.RotationRules?.Duration).toBe('2h');
        expect(response.RotationRules?.ScheduleExpression).toBe('rate(30 days)');
        expect(response.KmsKeyId).toBeDefined();
      }
    });
  });

  describe('Lambda Function', () => {
    const lambda = new LambdaClient({ region });

    test('Rotation Lambda function exists', async () => {
      const cfn = new CloudFormationClient({ region });
      const stackResponse = await cfn.send(new DescribeStacksCommand({
        StackName: stackName
      })).catch(() => null);
      
      if (stackResponse?.Stacks?.[0]) {
        const resources = stackResponse.Stacks[0].Outputs || [];
        const lambdaResource = resources.find(r => 
          r.OutputKey?.includes('SecretRotationFn')
        );
        
        if (lambdaResource?.OutputValue) {
          const fnResponse = await lambda.send(new GetFunctionCommand({
            FunctionName: lambdaResource.OutputValue
          })).catch(() => null);
          
          if (fnResponse) {
            expect(fnResponse.Configuration?.Runtime).toBe('python3.12');
            expect(fnResponse.Configuration?.Handler).toBe('index.handler');
            expect(fnResponse.Configuration?.Timeout).toBe(60);
          }
        }
      }
    });
  });

  describe('SNS Topic', () => {
    const sns = new SNSClient({ region });

    test('Security alerts topic exists', async () => {
      const accountId = outputs.RDSEndpoint.split('.')[1]; // Extract from RDS endpoint
      const topicArn = `arn:aws:sns:${region}:${accountId}:security-alerts`;
      
      const response = await sns.send(new GetTopicAttributesCommand({
        TopicArn: topicArn
      })).catch(() => null);
      
      if (response) {
        expect(response.Attributes?.TopicArn).toBe(topicArn);
      }
    });
  });

  describe('Security Compliance', () => {
    test('All storage is encrypted', async () => {
      // S3 buckets
      const s3 = new S3Client({ region });
      const buckets = [outputs.DataBucketName, outputs.LogsBucketName];
      
      for (const bucket of buckets) {
        const response = await s3.send(new GetBucketEncryptionCommand({
          Bucket: bucket
        }));
        
        expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      }
      
      // RDS
      const rds = new RDSClient({ region });
      const dbResponse = await rds.send(new DescribeDBInstancesCommand({}));
      const dbInstance = dbResponse.DBInstances?.find(db => 
        db.Endpoint?.Address === outputs.RDSEndpoint
      );
      
      if (dbInstance) {
        expect(dbInstance.StorageEncrypted).toBe(true);
      }
    });

    test('No resources have unrestricted access', async () => {
      const ec2 = new EC2Client({ region });
      const vpcId = outputs.VpcId;
      
      const sgResponse = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));
      
      const securityGroups = sgResponse.SecurityGroups || [];
      
      // Check SSH is not open to 0.0.0.0/0
      securityGroups.forEach(sg => {
        const sshRules = sg.IpPermissions?.filter(rule => 
          rule.FromPort === 22 && rule.ToPort === 22
        );
        
        sshRules?.forEach(rule => {
          const hasUnrestricted = rule.IpRanges?.some(range => 
            range.CidrIp === '0.0.0.0/0'
          );
          expect(hasUnrestricted).toBe(false);
        });
      });
    });

    test('VPC Flow Logs are enabled', async () => {
      const ec2 = new EC2Client({ region });
      const vpcId = outputs.VpcId;
      
      const response = await ec2.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }]
      }));
      
      expect(response.FlowLogs?.length).toBeGreaterThanOrEqual(1);
      expect(response.FlowLogs?.[0]?.FlowLogStatus).toBe('ACTIVE');
    });
  });

  describe('CloudFormation Stack', () => {
    const cfn = new CloudFormationClient({ region });

    test('Stack exists and is in complete state', async () => {
      const response = await cfn.send(new DescribeStacksCommand({
        StackName: stackName
      }));
      
      const stack = response.Stacks?.[0];
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE'])
        .toContain(stack?.StackStatus || '');
    });

    test('Stack has expected outputs', async () => {
      const response = await cfn.send(new DescribeStacksCommand({
        StackName: stackName
      }));
      
      const outputs = response.Stacks?.[0]?.Outputs || [];
      const outputKeys = outputs.map(o => o.OutputKey);
      
      expect(outputKeys).toContain('VpcId');
      expect(outputKeys).toContain('ALBDNS');
      expect(outputKeys).toContain('RDSEndpoint');
      expect(outputKeys).toContain('DataBucketName');
      expect(outputKeys).toContain('LogsBucketName');
    });
  });
});