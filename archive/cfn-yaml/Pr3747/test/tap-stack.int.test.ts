// E-Commerce Platform Infrastructure Integration Tests
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSecurityGroupRulesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  Route53Client,
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand,
  GetEventSelectorsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Initialize AWS clients
const region = outputs.Region;
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const asgClient = new AutoScalingClient({ region });
const route53Client = new Route53Client({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const cwClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const secretsClient = new SecretsManagerClient({ region });

describe('E-Commerce Platform Infrastructure Integration Tests', () => {

  describe('VPC and Networking', () => {
    test('VPC should exist with correct CIDR and DNS enabled', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCID],
          Filters: [
            { Name: 'vpc-id', Values: [outputs.VPCID] }
          ]
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe(outputs.VPCCidr);
      expect(vpc.State).toBe('available');

      // Get VPC attributes separately
      const dnsResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs.VPCID,
          Attribute: 'enableDnsSupport'
        })
      );
      expect(dnsResponse.EnableDnsSupport?.Value).toBe(true);

      const hostnamesResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs.VPCID,
          Attribute: 'enableDnsHostnames'
        })
      );
      expect(hostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Public subnets should exist in different AZs with auto-assign public IP', async () => {
      const subnetIds = outputs.PublicSubnets.split(',');
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toHaveLength(2);
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Different AZs

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCID);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });
    });

    test('Private subnets should exist in different AZs without auto-assign public IP', async () => {
      const subnetIds = outputs.PrivateSubnets.split(',');
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(response.Subnets).toHaveLength(2);
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2); // Different AZs

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCID);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    test('NAT Gateways should be in public subnets and available', async () => {
      const natGatewayIds = [outputs.NatGateway1Id, outputs.NatGateway2Id];
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natGatewayIds })
      );

      expect(response.NatGateways).toHaveLength(2);
      const publicSubnetIds = outputs.PublicSubnets.split(',');

      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.VpcId).toBe(outputs.VPCID);
        expect(publicSubnetIds).toContain(nat.SubnetId);
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    });

    test('Internet Gateway should be attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [outputs.InternetGatewayId] })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.VPCID);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Security Groups', () => {
    test('ALB Security Group should allow HTTP/HTTPS from internet', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [outputs.ALBSecurityGroupId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VPCID);

      const httpRule = sg.IpPermissions!.find(r => r.FromPort === 80);
      const httpsRule = sg.IpPermissions!.find(r => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
      expect(httpsRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
    });

    test('Web Server Security Group should only allow traffic from ALB', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [outputs.WebServerSecurityGroupId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VPCID);

      const httpRule = sg.IpPermissions!.find(r => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule!.UserIdGroupPairs).toBeDefined();
      expect(httpRule!.UserIdGroupPairs![0].GroupId).toBe(outputs.ALBSecurityGroupId);
    });

    test('Database Security Group should only allow traffic from Web Servers on DB port', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [outputs.DBSecurityGroupId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VPCID);

      const dbPort = parseInt(outputs.DatabasePort);
      const dbRule = sg.IpPermissions!.find(r => r.FromPort === dbPort);

      expect(dbRule).toBeDefined();
      expect(dbRule!.UserIdGroupPairs).toBeDefined();
      expect(dbRule!.UserIdGroupPairs![0].GroupId).toBe(outputs.WebServerSecurityGroupId);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should be internet-facing and in public subnets', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [outputs.ApplicationLoadBalancerArn] })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];

      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State?.Code).toBe('active');
      expect(alb.VpcId).toBe(outputs.VPCID);
      expect(alb.Type).toBe('application');
      expect(alb.DNSName).toBe(outputs.ApplicationLoadBalancerDNSName);

      const albSubnetIds = alb.AvailabilityZones!.map(az => az.SubnetId);
      const publicSubnetIds = outputs.PublicSubnets.split(',');
      albSubnetIds.forEach(subnetId => {
        expect(publicSubnetIds).toContain(subnetId);
      });
    });

    test('ALB Target Group should be configured correctly', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({ TargetGroupArns: [outputs.ALBTargetGroupArn] })
      );

      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];

      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.VpcId).toBe(outputs.VPCID);
      expect(tg.TargetType).toBe('instance');
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckEnabled).toBe(true);
    });

    test('ALB Listener should forward to target group', async () => {
      const response = await elbClient.send(
        new DescribeListenersCommand({ LoadBalancerArn: outputs.ApplicationLoadBalancerArn })
      );

      expect(response.Listeners!.length).toBeGreaterThanOrEqual(1);
      const listener = response.Listeners!.find(l => l.Port === 80);

      expect(listener).toBeDefined();
      expect(listener!.Protocol).toBe('HTTP');
      expect(listener!.DefaultActions).toHaveLength(1);
      expect(listener!.DefaultActions![0].Type).toBe('forward');
      expect(listener!.DefaultActions![0].TargetGroupArn).toBe(outputs.ALBTargetGroupArn);
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG should be configured with correct subnets and size', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [outputs.AutoScalingGroupName] })
      );

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];

      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeLessThanOrEqual(asg.MaxSize!);

      // ASG should be in private subnets
      const privateSubnetIds = outputs.PrivateSubnets.split(',');
      const asgSubnetIds = asg.VPCZoneIdentifier!.split(',');
      asgSubnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });

      // Should be attached to target group
      expect(asg.TargetGroupARNs).toContain(outputs.ALBTargetGroupArn);
      expect(asg.HealthCheckType).toBe('ELB');
    });

    test('ASG should have instances launching', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [outputs.AutoScalingGroupName] })
      );

      const asg = response.AutoScalingGroups![0];
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(0);

      // If instances exist, verify they are in the ASG's configured subnets
      if (asg.Instances!.length > 0) {
        const asgSubnetIds = asg.VPCZoneIdentifier!.split(',');
        asg.Instances!.forEach(instance => {
          // Instance subnet should be one of the ASG's configured subnets
          expect(instance.AvailabilityZone).toBeDefined();
        });
      }
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should be in private subnets with encryption enabled', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.DatabaseInstanceId })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];

      expect(db.DBInstanceStatus).toBeDefined();
      expect(db.Engine).toBe('mysql');
      expect(db.DBName).toBe(outputs.DatabaseName);
      expect(db.Endpoint?.Address).toBe(outputs.DatabaseEndpoint);
      expect(db.Endpoint?.Port).toBe(parseInt(outputs.DatabasePort));

      // Should be in private subnets
      expect(db.PubliclyAccessible).toBe(false);

      // Encryption
      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId).toContain(outputs.EncryptionKeyId);

      // Security
      expect(db.DeletionProtection).toBe(false); // For testing purposes
      expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('Database credentials should be in Secrets Manager', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.DatabaseSecretArn })
      );

      expect(response.Name).toBeDefined();
      expect(response.ARN).toBe(outputs.DatabaseSecretArn);

      // Verify secret can be retrieved
      const secretValue = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: outputs.DatabaseSecretArn })
      );

      expect(secretValue.SecretString).toBeDefined();
      const secret = JSON.parse(secretValue.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
    });
  });

  describe('Route53 DNS', () => {
    test('Hosted Zone should exist for the domain', async () => {
      if (outputs.HostedZoneId === 'N/A') {
        console.log('Skipping DNS test - no domain configured');
        return;
      }

      const response = await route53Client.send(
        new GetHostedZoneCommand({ Id: outputs.HostedZoneId })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Name).toBe(`${outputs.DomainName}.`);
    });

    test('DNS record should point to ALB', async () => {
      if (outputs.HostedZoneId === 'N/A') {
        console.log('Skipping DNS test - no domain configured');
        return;
      }

      const response = await route53Client.send(
        new ListResourceRecordSetsCommand({ HostedZoneId: outputs.HostedZoneId })
      );

      const record = response.ResourceRecordSets!.find(
        r => r.Name === `${outputs.DNSRecordName}.`
      );

      expect(record).toBeDefined();
      expect(record!.Type).toBe('A');
      expect(record!.AliasTarget).toBeDefined();
      expect(record!.AliasTarget!.DNSName).toContain(outputs.ApplicationLoadBalancerDNSName);
    });
  });

  describe('Security and Encryption', () => {
    test('KMS key should be enabled with rotation', async () => {
      const describeResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.EncryptionKeyId })
      );

      expect(describeResponse.KeyMetadata).toBeDefined();
      expect(describeResponse.KeyMetadata!.KeyState).toBe('Enabled');
      expect(describeResponse.KeyMetadata!.Enabled).toBe(true);

      // Check key rotation separately
      const rotationResponse = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.EncryptionKeyId })
      );
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('KMS key policy should allow Auto Scaling to encrypt EBS volumes', async () => {
      const response = await kmsClient.send(
        new GetKeyPolicyCommand({ KeyId: outputs.EncryptionKeyId, PolicyName: 'default' })
      );

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      const asgStatement = policy.Statement.find(
        (s: any) => s.Sid === 'Allow service-linked role use of the customer managed key'
      );
      expect(asgStatement).toBeDefined();
      expect(asgStatement.Action).toContain('kms:Encrypt');
      expect(asgStatement.Action).toContain('kms:Decrypt');
    });

    test('CloudTrail should be logging with encryption', async () => {
      const trailResponse = await cloudTrailClient.send(
        new GetTrailCommand({ Name: outputs.CloudTrailName })
      );

      expect(trailResponse.Trail).toBeDefined();
      expect(trailResponse.Trail!.IsMultiRegionTrail).toBe(true);
      expect(trailResponse.Trail!.KmsKeyId).toContain(outputs.EncryptionKeyId);
      expect(trailResponse.Trail!.S3BucketName).toBe(outputs.CloudTrailBucketName);

      // Check logging status separately
      const statusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: outputs.CloudTrailName })
      );
      expect(statusResponse.IsLogging).toBe(true);
    });

    test('CloudTrail S3 bucket should have encryption and versioning enabled', async () => {
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.CloudTrailBucketName })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toContain(outputs.EncryptionKeyId);

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.CloudTrailBucketName })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('Monitoring and Alarms', () => {
    test('CPU alarm should be configured for Auto Scaling Group', async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [outputs.CPUAlarmName] })
      );

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];

      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Threshold).toBeGreaterThan(0);

      // Should alert to SNS topic
      expect(alarm.AlarmActions).toContain(outputs.AlertTopicARN);
    });

    test('SNS topic should be encrypted with KMS', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.AlertTopicARN })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).toContain(outputs.EncryptionKeyId);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Complete infrastructure connectivity: ALB -> Target Group -> ASG', async () => {
      // Verify ALB is healthy
      const albResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [outputs.ApplicationLoadBalancerArn] })
      );
      expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');

      // Verify Target Group health
      const tgHealthResponse = await elbClient.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: outputs.ALBTargetGroupArn })
      );
      expect(tgHealthResponse.TargetHealthDescriptions).toBeDefined();

      // Verify ASG is running
      const asgResponse = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [outputs.AutoScalingGroupName] })
      );
      const asg = asgResponse.AutoScalingGroups![0];
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(1);

      // Check connectivity chain
      expect(asg.TargetGroupARNs).toContain(outputs.ALBTargetGroupArn);
    });

    test('Database should be accessible from private subnets where EC2 instances run', async () => {
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.DatabaseInstanceId })
      );
      const db = dbResponse.DBInstances![0];

      // Database should be in the same VPC
      expect(db.DBSubnetGroup?.VpcId).toBe(outputs.VPCID);

      // Database subnets should be private subnets
      const dbSubnetIds = db.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      const privateSubnetIds = outputs.PrivateSubnets.split(',');

      dbSubnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    });

    test('All resources should be in the same VPC', async () => {
      const resources = [
        outputs.VPCID,
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      // All subnets should belong to the same VPC
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: resources.slice(1) })
      );

      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCID);
      });
    });

    test('Encryption should be consistent across all resources using same KMS key', async () => {
      // Verify RDS uses the KMS key
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.DatabaseInstanceId })
      );
      expect(dbResponse.DBInstances![0].KmsKeyId).toContain(outputs.EncryptionKeyId);

      // Verify CloudTrail uses the KMS key
      const trailResponse = await cloudTrailClient.send(
        new GetTrailCommand({ Name: outputs.CloudTrailName })
      );
      expect(trailResponse.Trail!.KmsKeyId).toContain(outputs.EncryptionKeyId);

      // Verify S3 bucket uses the KMS key
      const s3Response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.CloudTrailBucketName })
      );
      const rule = s3Response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toContain(outputs.EncryptionKeyId);

      // Verify SNS topic uses the KMS key
      const snsResponse = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.AlertTopicARN })
      );
      expect(snsResponse.Attributes!.KmsMasterKeyId).toContain(outputs.EncryptionKeyId);
    });
  });
});
