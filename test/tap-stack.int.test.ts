import {
  ApplicationInsightsClient,
  DescribeApplicationCommand,
} from '@aws-sdk/client-application-insights';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  DescribeInstanceInformationCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as path from 'path';

// Load the deployed outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const ssmClient = new SSMClient({ region });
const appInsightsClient = new ApplicationInsightsClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

describe('TapStack Integration Tests', () => {
  // Skip tests if no outputs are available
  const skipIfNoOutputs =
    outputs && Object.keys(outputs).length > 0 ? test : test.skip;

  // Skip RDS tests if DatabaseEndpoint is not available (LocalStack mode)
  const skipIfNoRdsOutputs =
    outputs && outputs.DatabaseEndpoint ? test : test.skip;

  describe('VPC and Networking', () => {
    skipIfNoOutputs('VPC exists and has correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
      // DNS settings are in attributes, not direct properties
      const vpc = response.Vpcs![0];
      expect(vpc).toBeDefined();
    });

    skipIfNoOutputs(
      'VPC has subnets in multiple availability zones',
      async () => {
        const command = new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
          ],
        });
        const response = await ec2Client.send(command);

        const azs = new Set(
          response.Subnets?.map(subnet => subnet.AvailabilityZone)
        );
        expect(azs.size).toBeGreaterThanOrEqual(2);

        const publicSubnets = response.Subnets?.filter(
          subnet => subnet.MapPublicIpOnLaunch
        );
        const privateSubnets = response.Subnets?.filter(
          subnet => !subnet.MapPublicIpOnLaunch
        );

        expect(publicSubnets?.length).toBe(2);
        expect(privateSubnets?.length).toBe(2);
      }
    );

    // NAT Gateway is disabled for LocalStack Community compatibility
    test.skip('NAT Gateway is active', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(1);
      expect(response.NatGateways![0].State).toBe('available');
      expect(response.NatGateways![0].VpcId).toBe(outputs.VpcId);
    });
  });

  describe('EC2 Instance', () => {
    skipIfNoOutputs('EC2 instance is running', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.WebServerInstanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.PublicIpAddress).toBe(outputs.WebServerPublicIp);
    });

    skipIfNoOutputs('EC2 instance has correct security group', async () => {
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.WebServerInstanceId],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const securityGroupIds =
        instanceResponse.Reservations![0].Instances![0].SecurityGroups?.map(
          sg => sg.GroupId
        );

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds?.filter(
          (id): id is string => id !== undefined
        ),
      });
      const sgResponse = await ec2Client.send(sgCommand);

      // Collect all ingress rules from all security groups attached to the instance
      const allIpPermissions = sgResponse.SecurityGroups?.flatMap(
        sg => sg.IpPermissions || []
      ) || [];

      const httpRule = allIpPermissions.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = allIpPermissions.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      const sshRule = allIpPermissions.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(sshRule).toBeUndefined(); // SSH should not be allowed (using Session Manager instead)
    });

    skipIfNoOutputs('Web server is accessible via HTTP', async () => {
      const response = await fetch(`http://${outputs.WebServerPublicIp}`, {
        timeout: 10000,
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Migration Server Ready');
    });
  });

  describe('RDS Database', () => {
    skipIfNoRdsOutputs('RDS instance is available', async () => {
      const dbInstanceId = outputs.DatabaseEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(false);
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    skipIfNoRdsOutputs('RDS has automated backups enabled', async () => {
      const dbInstanceId = outputs.DatabaseEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
    });

    skipIfNoRdsOutputs(
      'Database credentials secret exists and is accessible',
      async () => {
        const command = new GetSecretValueCommand({
          SecretId: outputs.DatabaseCredentialsSecret,
        });

        const response = await secretsClient.send(command);
        expect(response.SecretString).toBeDefined();

        const secretValue = JSON.parse(response.SecretString!);
        expect(secretValue.username).toBe('dbadmin');
        expect(secretValue.password).toBeDefined();
        expect(secretValue.password.length).toBeGreaterThanOrEqual(20);
      }
    );
  });

  describe('S3 Bucket', () => {
    skipIfNoOutputs('S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.LogsBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    skipIfNoOutputs('S3 bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.LogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    skipIfNoOutputs('S3 bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.LogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules![0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    skipIfNoOutputs('S3 bucket has public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.LogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('Session Manager Configuration', () => {
    skipIfNoOutputs('EC2 instance is registered with SSM', async () => {
      const command = new DescribeInstanceInformationCommand({
        Filters: [
          {
            Key: 'InstanceIds',
            Values: [outputs.WebServerInstanceId],
          },
        ],
      });
      const response = await ssmClient.send(command);

      expect(response.InstanceInformationList).toHaveLength(1);
      const instanceInfo = response.InstanceInformationList![0];
      expect(instanceInfo.PingStatus).toBe('Online');
      expect(instanceInfo.InstanceId).toBe(outputs.WebServerInstanceId);
    });

    skipIfNoOutputs('Session Manager log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.SessionManagerLogGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].logGroupName).toBe(
        outputs.SessionManagerLogGroupName
      );
    });
  });

  describe('CloudWatch Application Insights', () => {
    // Application Insights is a Pro/Enterprise feature in LocalStack
    test.skip('Application Insights is configured', async () => {
      const command = new DescribeApplicationCommand({
        ResourceGroupName: outputs.ApplicationInsightsResourceGroupName,
      });
      const response = await appInsightsClient.send(command);

      expect(response.ApplicationInfo).toBeDefined();
      expect(response.ApplicationInfo?.ResourceGroupName).toBe(
        outputs.ApplicationInsightsResourceGroupName
      );
      expect(response.ApplicationInfo?.CWEMonitorEnabled).toBe(true);
      expect(response.ApplicationInfo?.OpsCenterEnabled).toBe(true);
    });

    skipIfNoOutputs('Application log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ApplicationLogGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].logGroupName).toBe(
        outputs.ApplicationLogGroupName
      );
    });
  });

  describe('Migration Workflow Validation', () => {
    skipIfNoRdsOutputs('EC2 instance can connect to RDS database', async () => {
      // Get the database security group
      const dbInstanceId = outputs.DatabaseEndpoint.split('.')[0];
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      const dbSecurityGroups = rdsResponse.DBInstances![0].VpcSecurityGroups;

      // Get EC2 instance security groups
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: [outputs.WebServerInstanceId],
      });
      const ec2Response = await ec2Client.send(ec2Command);
      const ec2SecurityGroups =
        ec2Response.Reservations![0].Instances![0].SecurityGroups;

      // Check that database security group allows traffic from EC2 security group
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: dbSecurityGroups
          ?.map(sg => sg.VpcSecurityGroupId)
          .filter((id): id is string => id !== undefined),
      });
      const sgResponse = await ec2Client.send(sgCommand);

      const dbSg = sgResponse.SecurityGroups![0];
      const mysqlRule = dbSg.IpPermissions?.find(
        rule =>
          rule.FromPort === 3306 &&
          rule.UserIdGroupPairs?.some(pair =>
            ec2SecurityGroups?.some(ec2Sg => ec2Sg.GroupId === pair.GroupId)
          )
      );

      expect(mysqlRule).toBeDefined();
    });

    skipIfNoRdsOutputs(
      'Infrastructure components are in the same VPC',
      async () => {
        // Check EC2 instance VPC
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: [outputs.WebServerInstanceId],
        });
        const ec2Response = await ec2Client.send(ec2Command);
        const ec2VpcId = ec2Response.Reservations![0].Instances![0].VpcId;

        // Check RDS VPC
        const dbInstanceId = outputs.DatabaseEndpoint.split('.')[0];
        const rdsCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        });
        const rdsResponse = await rdsClient.send(rdsCommand);
        const dbSubnetGroup = rdsResponse.DBInstances![0].DBSubnetGroup;
        const dbVpcId = dbSubnetGroup?.VpcId;

        expect(ec2VpcId).toBe(outputs.VpcId);
        expect(dbVpcId).toBe(outputs.VpcId);
      }
    );

    // NAT Gateway is disabled for LocalStack Community compatibility
    test.skip('Private subnets have internet access through NAT Gateway', async () => {
      // This is implicitly tested by checking NAT Gateway exists and is available
      // In a real scenario, we'd test by deploying a resource in private subnet
      // and verifying it can reach the internet
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const natResponse = await ec2Client.send(natCommand);

      expect(natResponse.NatGateways).toHaveLength(1);

      // Verify NAT Gateway is in a public subnet
      const natGateway = natResponse.NatGateways![0];
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [natGateway.SubnetId!],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      expect(subnetResponse.Subnets![0].MapPublicIpOnLaunch).toBe(true);
    });
  });
});
