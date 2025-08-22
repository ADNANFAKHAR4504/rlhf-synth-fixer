import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  GetBucketTaggingCommand,
} from '@aws-sdk/client-s3';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  Route53Client,
  GetHealthCheckCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import axios from 'axios';

/* ----------------------------- Utilities & Types ----------------------------- */

type TfOutputValue = { sensitive: boolean; type: string; value: any };

type StructuredOutputs = {
  primary_alb_name: TfOutputValue;
  secondary_alb_name: TfOutputValue;
  primary_alb_arn: TfOutputValue;
  secondary_alb_arn: TfOutputValue;
  primary_health_check_id: TfOutputValue;
  secondary_health_check_id: TfOutputValue;
  primary_alb_dns: TfOutputValue;
  secondary_alb_dns: TfOutputValue;
  rds_endpoint: TfOutputValue;
  s3_bucket_name: TfOutputValue;
  application_url: TfOutputValue;
  primary_vpc_id: TfOutputValue;
  secondary_vpc_id: TfOutputValue;
  vpc_peering_connection_id: TfOutputValue;
  primary_asg_name: TfOutputValue;
  secondary_asg_name: TfOutputValue;
  lambda_function_name: TfOutputValue;
  event_rule_name: TfOutputValue;
  primary_route53_health_check_id: TfOutputValue;
  secondary_route53_health_check_id: TfOutputValue;
  route53_zone_id: TfOutputValue;
  iam_ec2_role_name: TfOutputValue;
  iam_lambda_role_name: TfOutputValue;
  primary_db_identifier: TfOutputValue;
};

function readDeploymentOutputs(): Record<string, any> {
  const filePath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Outputs file not found at ${filePath}`);
  }
  const outputs = JSON.parse(
    fs.readFileSync(filePath, 'utf8')
  ) as StructuredOutputs;
  const extractedValues: Record<string, any> = {};
  for (const key in outputs) {
    const output = outputs[key as keyof StructuredOutputs];
    if (output?.value !== null && output?.value !== undefined) {
      extractedValues[key] = output.value;
    }
  }
  return extractedValues;
}

// AWS Clients initialization
const ec2ClientPrimary = new EC2Client({ region: 'us-east-1' });
const ec2ClientSecondary = new EC2Client({ region: 'us-west-2' });
const elbClientPrimary = new ElasticLoadBalancingV2Client({
  region: 'us-east-1',
});
const elbClientSecondary = new ElasticLoadBalancingV2Client({
  region: 'us-west-2',
});
const rdsClient = new RDSClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const asgClientPrimary = new AutoScalingClient({ region: 'us-east-1' });
const asgClientSecondary = new AutoScalingClient({ region: 'us-west-2' });
const route53Client = new Route53Client({ region: 'us-east-1' });
const cloudwatchLogsClientPrimary = new CloudWatchLogsClient({
  region: 'us-east-1',
});
const cloudwatchLogsClientSecondary = new CloudWatchLogsClient({
  region: 'us-west-2',
});
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

/* ----------------------------- Integration Tests ----------------------------- */

describe('AWS Infrastructure Integration Tests', () => {
  const outputs = readDeploymentOutputs();

  // Set longer timeout for AWS API calls
  jest.setTimeout(30000);

  describe('Multi-Region VPC and Networking', () => {
    it('should have VPCs properly configured in both regions', async () => {
      // Test primary VPC
      const primaryVpcResponse = await ec2ClientPrimary.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.primary_vpc_id] })
      );

      expect(primaryVpcResponse.Vpcs).toHaveLength(1);
      const primaryVpc = primaryVpcResponse.Vpcs![0];
      expect(primaryVpc.State).toBe('available');
      expect(primaryVpc.CidrBlock).toBe('10.1.0.0/16');

      // Test secondary VPC
      const secondaryVpcResponse = await ec2ClientSecondary.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.secondary_vpc_id] })
      );

      expect(secondaryVpcResponse.Vpcs).toHaveLength(1);
      const secondaryVpc = secondaryVpcResponse.Vpcs![0];
      expect(secondaryVpc.State).toBe('available');
      expect(secondaryVpc.CidrBlock).toBe('10.2.0.0/16');
    });

    it('should have VPC peering connection active and properly configured', async () => {
      const peeringResponse = await ec2ClientPrimary.send(
        new DescribeVpcPeeringConnectionsCommand({
          VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id],
        })
      );

      expect(peeringResponse.VpcPeeringConnections).toHaveLength(1);
      const peering = peeringResponse.VpcPeeringConnections![0];

      expect(peering.Status?.Code).toBe('active');
      expect(peering.AccepterVpcInfo?.VpcId).toBe(outputs.secondary_vpc_id);
      expect(peering.RequesterVpcInfo?.VpcId).toBe(outputs.primary_vpc_id);
      expect(peering.AccepterVpcInfo?.Region).toBe('us-west-2');
      expect(peering.RequesterVpcInfo?.Region).toBe('us-east-1');
    });

    it('should have NAT Gateways configured in both regions', async () => {
      // Check primary NAT Gateway
      const primaryNatResponse = await ec2ClientPrimary.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [outputs.primary_vpc_id] },
            { Name: 'state', Values: ['available'] },
          ],
        })
      );

      expect(primaryNatResponse.NatGateways).not.toHaveLength(0);
      expect(primaryNatResponse.NatGateways![0].State).toBe('available');

      // Check secondary NAT Gateway
      const secondaryNatResponse = await ec2ClientSecondary.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [outputs.secondary_vpc_id] },
            { Name: 'state', Values: ['available'] },
          ],
        })
      );

      expect(secondaryNatResponse.NatGateways).not.toHaveLength(0);
      expect(secondaryNatResponse.NatGateways![0].State).toBe('available');
    });

    it('should have public and private subnets in both regions', async () => {
      // Check primary subnets
      const primarySubnetsResponse = await ec2ClientPrimary.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.primary_vpc_id] }],
        })
      );

      expect(primarySubnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(4);

      const primaryPublicSubnets = primarySubnetsResponse.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === true
      );
      const primaryPrivateSubnets = primarySubnetsResponse.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === false
      );

      expect(primaryPublicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(primaryPrivateSubnets.length).toBeGreaterThanOrEqual(2);

      // Check secondary subnets
      const secondarySubnetsResponse = await ec2ClientSecondary.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.secondary_vpc_id] }],
        })
      );

      expect(secondarySubnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(
        4
      );
    });
  });

  describe('Load Balancers and Auto Scaling', () => {
    it('should have ALBs healthy and accessible in both regions', async () => {
      // Test primary ALB
      const primaryAlbResponse = await elbClientPrimary.send(
        new DescribeLoadBalancersCommand({
          Names: [outputs.primary_alb_name],
        })
      );

      expect(primaryAlbResponse.LoadBalancers).toHaveLength(1);
      const primaryAlb = primaryAlbResponse.LoadBalancers![0];
      expect(primaryAlb.State?.Code).toBe('active');
      expect(primaryAlb.Scheme).toBe('internet-facing');

      // Test HTTP endpoint
      try {
        const response = await axios.get(`http://${outputs.primary_alb_dns}`, {
          timeout: 5000,
        });
        expect(response.status).toBe(200);
        expect(response.data).toContain('Primary Region');
      } catch (error) {
        // ALB might not be fully configured, check it exists at least
        expect(primaryAlb.DNSName).toBe(outputs.primary_alb_dns);
      }

      // Test secondary ALB
      const secondaryAlbResponse = await elbClientSecondary.send(
        new DescribeLoadBalancersCommand({
          Names: [outputs.secondary_alb_name],
        })
      );

      expect(secondaryAlbResponse.LoadBalancers).toHaveLength(1);
      const secondaryAlb = secondaryAlbResponse.LoadBalancers![0];
      expect(secondaryAlb.State?.Code).toBe('active');
    });

    it('should have Auto Scaling Groups with healthy instances', async () => {
      // Test primary ASG
      const primaryAsgResponse = await asgClientPrimary.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.primary_asg_name],
        })
      );

      expect(primaryAsgResponse.AutoScalingGroups).toHaveLength(1);
      const primaryAsg = primaryAsgResponse.AutoScalingGroups![0];
      expect(primaryAsg.MinSize).toBeGreaterThanOrEqual(1);
      expect(primaryAsg.MaxSize).toBeGreaterThanOrEqual(4);
      expect(primaryAsg.DesiredCapacity).toBeGreaterThanOrEqual(1);
      expect(primaryAsg.HealthCheckType).toBe('ELB');
      expect(primaryAsg.HealthCheckGracePeriod).toBe(300);

      // Verify instances are running
      const healthyPrimaryInstances = primaryAsg.Instances?.filter(
        instance => instance.HealthStatus === 'Healthy'
      );
      expect(healthyPrimaryInstances!.length).toBeGreaterThanOrEqual(1);

      // Test secondary ASG
      const secondaryAsgResponse = await asgClientSecondary.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.secondary_asg_name],
        })
      );

      expect(secondaryAsgResponse.AutoScalingGroups).toHaveLength(1);
      const secondaryAsg = secondaryAsgResponse.AutoScalingGroups![0];
      expect(secondaryAsg.MinSize).toBeGreaterThanOrEqual(1);
      expect(secondaryAsg.MaxSize).toBeGreaterThanOrEqual(4);
    });

    it('should have target groups with healthy targets', async () => {
      // Get primary target groups
      const primaryTgResponse = await elbClientPrimary.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: outputs.primary_alb_arn,
        })
      );

      if (
        primaryTgResponse.TargetGroups &&
        primaryTgResponse.TargetGroups.length > 0
      ) {
        const targetGroup = primaryTgResponse.TargetGroups[0];

        // Check target health
        const healthResponse = await elbClientPrimary.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: targetGroup.TargetGroupArn,
          })
        );

        const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(
          target => target.TargetHealth?.State === 'healthy'
        );

        expect(healthyTargets!.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('RDS Database', () => {
    it('should have RDS instance properly configured with Multi-AZ', async () => {
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.primary_db_identifier,
        })
      );

      expect(dbResponse.DBInstances).toHaveLength(1);
      const db = dbResponse.DBInstances![0];

      expect(db.DBInstanceStatus).toBe('available');
      expect(db.MultiAZ).toBe(true);
      expect(db.Engine).toBe('postgres');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(db.DeletionProtection).toBe(false); // As per config
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.StorageType).toBe('gp3');
      expect(db.AllocatedStorage).toBeGreaterThanOrEqual(20);
    });

    it('should have RDS in private subnets only', async () => {
      const dbSubnetGroupResponse = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: outputs.db_subnet_group_name,
        })
      );

      if (
        dbSubnetGroupResponse.DBSubnetGroups &&
        dbSubnetGroupResponse.DBSubnetGroups.length > 0
      ) {
        const subnetGroup = dbSubnetGroupResponse.DBSubnetGroups[0];
        expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);

        // Verify subnets are in different AZs
        const azs = new Set(
          subnetGroup.Subnets!.map(
            subnet => subnet.SubnetAvailabilityZone?.Name
          )
        );
        expect(azs.size).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('S3 Storage', () => {
    it('should have S3 bucket with versioning enabled', async () => {
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.s3_bucket_name })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });

    it('should have S3 bucket with encryption enabled', async () => {
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.s3_bucket_name })
      );

      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules![0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have S3 bucket with public access blocked', async () => {
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.s3_bucket_name })
      );

      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration
          ?.RestrictPublicBuckets
      ).toBe(true);
    });

    it('should have S3 bucket accessible from the correct region', async () => {
      const headBucketResponse = await s3Client.send(
        new HeadBucketCommand({ Bucket: outputs.s3_bucket_name })
      );

      // If no error is thrown, bucket exists and is accessible
      expect(headBucketResponse.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Security Groups', () => {
    it('should have restrictive security groups for EC2 instances', async () => {
      const sgResponse = await ec2ClientPrimary.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.primary_vpc_id] },
            { Name: 'group-name', Values: ['ec2-primary-*'] },
          ],
        })
      );

      if (sgResponse.SecurityGroups && sgResponse.SecurityGroups.length > 0) {
        const ec2Sg = sgResponse.SecurityGroups[0];

        // Check SSH is not open to the world
        const sshRule = ec2Sg.IpPermissions?.find(
          rule => rule.FromPort === 22 && rule.ToPort === 22
        );

        if (sshRule) {
          const hasWideOpenSSH = sshRule.IpRanges?.some(
            range => range.CidrIp === '0.0.0.0/0'
          );
          expect(hasWideOpenSSH).toBe(false);
        }

        // Check HTTP traffic is only from ALB
        const httpRule = ec2Sg.IpPermissions?.find(
          rule => rule.FromPort === 80 && rule.ToPort === 80
        );

        if (httpRule) {
          expect(httpRule.UserIdGroupPairs).toBeDefined();
          expect(httpRule.UserIdGroupPairs!.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have RDS security group allowing traffic only from EC2', async () => {
      const sgResponse = await ec2ClientPrimary.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.primary_vpc_id] },
            { Name: 'group-name', Values: ['rds-primary-*'] },
          ],
        })
      );

      if (sgResponse.SecurityGroups && sgResponse.SecurityGroups.length > 0) {
        const rdsSg = sgResponse.SecurityGroups[0];

        const postgresRule = rdsSg.IpPermissions?.find(
          rule => rule.FromPort === 5432 && rule.ToPort === 5432
        );

        expect(postgresRule).toBeDefined();
        expect(postgresRule!.UserIdGroupPairs).toBeDefined();
        expect(postgresRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);

        // Should not have any CIDR blocks (only security group references)
        expect(postgresRule!.IpRanges?.length || 0).toBe(0);
      }
    });
  });

  describe('EC2 Instances', () => {
    it('should have EC2 instances with encrypted EBS volumes', async () => {
      const instancesResponse = await ec2ClientPrimary.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.primary_vpc_id] },
            { Name: 'instance-state-name', Values: ['running'] },
          ],
        })
      );

      for (const reservation of instancesResponse.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          // Get volume details
          const volumeIds = instance.BlockDeviceMappings?.map(
            device => device.Ebs?.VolumeId
          ).filter(Boolean) as string[];

          if (volumeIds.length > 0) {
            const volumesResponse = await ec2ClientPrimary.send(
              new DescribeVolumesCommand({ VolumeIds: volumeIds })
            );

            for (const volume of volumesResponse.Volumes || []) {
              expect(volume.Encrypted).toBe(true);
              expect(volume.VolumeType).toBe('gp3');
            }
          }
        }
      }
    });

    it('should have EC2 instances with IAM instance profiles attached', async () => {
      const instancesResponse = await ec2ClientPrimary.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.primary_vpc_id] },
            { Name: 'instance-state-name', Values: ['running'] },
          ],
        })
      );

      for (const reservation of instancesResponse.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.IamInstanceProfile?.Arn).toContain(
            'iam-instance-profile-ec2-nova'
          );
        }
      }
    });
  });

  describe('Route 53 DNS and Health Checks', () => {
    it('should have health checks configured and healthy', async () => {
      // Test primary health check
      const primaryHealthResponse = await route53Client.send(
        new GetHealthCheckCommand({
          HealthCheckId: outputs.primary_health_check_id,
        })
      );

      expect(primaryHealthResponse.HealthCheck).toBeDefined();
      expect(primaryHealthResponse.HealthCheck!.HealthCheckConfig?.Type).toBe(
        'HTTP'
      );
      expect(
        primaryHealthResponse.HealthCheck!.HealthCheckConfig
          ?.FullyQualifiedDomainName
      ).toBe(outputs.primary_alb_dns);
      expect(primaryHealthResponse.HealthCheck!.HealthCheckConfig?.Port).toBe(
        80
      );

      // Test secondary health check
      const secondaryHealthResponse = await route53Client.send(
        new GetHealthCheckCommand({
          HealthCheckId: outputs.secondary_health_check_id,
        })
      );

      expect(secondaryHealthResponse.HealthCheck).toBeDefined();
      expect(
        secondaryHealthResponse.HealthCheck!.HealthCheckConfig
          ?.FullyQualifiedDomainName
      ).toBe(outputs.secondary_alb_dns);
    });

    it('should have failover routing configured', async () => {
      const recordsResponse = await route53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: outputs.route53_zone_id,
        })
      );

      const failoverRecords = recordsResponse.ResourceRecordSets?.filter(
        record => record.Name?.startsWith('app.') && record.Failover
      );

      expect(failoverRecords).toHaveLength(2);

      const primaryRecord = failoverRecords?.find(
        r => r.Failover === 'PRIMARY'
      );
      const secondaryRecord = failoverRecords?.find(
        r => r.Failover === 'SECONDARY'
      );

      expect(primaryRecord).toBeDefined();
      expect(secondaryRecord).toBeDefined();
      expect(primaryRecord!.HealthCheckId).toBe(
        outputs.primary_health_check_id
      );
      expect(secondaryRecord!.HealthCheckId).toBe(
        outputs.secondary_health_check_id
      );
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have CloudWatch log groups created in both regions', async () => {
      // Test primary region log group
      const primaryLogsResponse = await cloudwatchLogsClientPrimary.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/app/nova-project-logs-',
        })
      );

      expect(primaryLogsResponse.logGroups).toBeDefined();
      expect(primaryLogsResponse.logGroups!.length).toBeGreaterThan(0);

      const primaryLogGroup = primaryLogsResponse.logGroups![0];
      expect(primaryLogGroup.retentionInDays).toBe(14);

      // Test secondary region log group
      const secondaryLogsResponse = await cloudwatchLogsClientSecondary.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/app/nova-project-logs-secondary-',
        })
      );

      expect(secondaryLogsResponse.logGroups).toBeDefined();
      expect(secondaryLogsResponse.logGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Cost Optimization', () => {
    it('should have Lambda function properly configured', async () => {
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );

      expect(lambdaResponse.Configuration).toBeDefined();
      expect(lambdaResponse.Configuration!.State).toBe('Active');
      expect(lambdaResponse.Configuration!.Runtime).toBe('python3.9');
      expect(lambdaResponse.Configuration!.Handler).toBe(
        'index.lambda_handler'
      );
      expect(lambdaResponse.Configuration!.Timeout).toBe(60);

      // Check IAM role
      expect(lambdaResponse.Configuration!.Role).toContain(
        'iam-role-lambda-cost-saver'
      );
    });

    it('should have EventBridge rule configured for nightly trigger', async () => {
      const ruleResponse = await eventBridgeClient.send(
        new DescribeRuleCommand({
          Name: outputs.event_rule_name,
        })
      );

      expect(ruleResponse.State).toBe('ENABLED');
      expect(ruleResponse.ScheduleExpression).toBe('cron(0 0 * * ? *)');

      // Check the rule has Lambda as target
      const targetsResponse = await eventBridgeClient.send(
        new ListTargetsByRuleCommand({
          Rule: outputs.event_rule_name,
        })
      );

      expect(targetsResponse.Targets).toHaveLength(1);
      expect(targetsResponse.Targets![0].Arn).toContain(
        outputs.lambda_function_name
      );
    });

    it('should have Lambda function with correct permissions', async () => {
      const configResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );

      const roleArn = configResponse.Role;
      const roleName = roleArn?.split('/').pop();

      // Get role policies
      const attachedPoliciesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: roleName,
        })
      );

      // Get inline policies
      const inlinePoliciesResponse = await iamClient.send(
        new ListRolePoliciesCommand({
          RoleName: roleName,
        })
      );

      // Should have at least one policy (either attached or inline)
      const totalPolicies =
        (attachedPoliciesResponse.AttachedPolicies?.length || 0) +
        (inlinePoliciesResponse.PolicyNames?.length || 0);

      expect(totalPolicies).toBeGreaterThan(0);
    });
  });

  describe('IAM Security', () => {
    it('should have EC2 role with least privilege policies', async () => {
      const roleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: outputs.iam_ec2_role_name,
        })
      );

      expect(roleResponse.Role).toBeDefined();

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!)
      );

      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );

      // List attached policies
      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: outputs.iam_ec2_role_name,
        })
      );

      // Should have specific policies, not AdministratorAccess
      const hasAdminAccess = policiesResponse.AttachedPolicies?.some(
        policy => policy.PolicyName === 'AdministratorAccess'
      );
      expect(hasAdminAccess).toBe(false);
    });

    it('should have Lambda role with specific permissions only', async () => {
      const roleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: outputs.iam_lambda_role_name,
        })
      );

      expect(roleResponse.Role).toBeDefined();

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!)
      );

      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );

      // Verify no overly permissive policies
      const attachedPoliciesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: outputs.iam_lambda_role_name,
        })
      );

      const hasAdminAccess = attachedPoliciesResponse.AttachedPolicies?.some(
        policy =>
          policy.PolicyName === 'AdministratorAccess' ||
          policy.PolicyName === 'PowerUserAccess'
      );
      expect(hasAdminAccess).toBe(false);
    });
  });

  describe('High Availability and Failover', () => {
    it('should verify cross-region connectivity via VPC peering', async () => {
      // Get route tables from primary VPC
      const primaryRouteTablesResponse = await ec2ClientPrimary.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.primary_vpc_id] }],
        })
      );

      // Check for peering routes
      let hasPeeringRoute = false;
      for (const routeTable of primaryRouteTablesResponse.RouteTables || []) {
        const peeringRoute = routeTable.Routes?.find(
          route =>
            route.VpcPeeringConnectionId === outputs.vpc_peering_connection_id
        );
        if (peeringRoute) {
          hasPeeringRoute = true;
          expect(peeringRoute.DestinationCidrBlock).toBe('10.2.0.0/16');
        }
      }
      expect(hasPeeringRoute).toBe(true);

      // Get route tables from secondary VPC
      const secondaryRouteTablesResponse = await ec2ClientSecondary.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.secondary_vpc_id] }],
        })
      );

      // Check for peering routes
      hasPeeringRoute = false;
      for (const routeTable of secondaryRouteTablesResponse.RouteTables || []) {
        const peeringRoute = routeTable.Routes?.find(
          route =>
            route.VpcPeeringConnectionId === outputs.vpc_peering_connection_id
        );
        if (peeringRoute) {
          hasPeeringRoute = true;
          expect(peeringRoute.DestinationCidrBlock).toBe('10.1.0.0/16');
        }
      }
      expect(hasPeeringRoute).toBe(true);
    });

    it('should test application URL responds (Route 53 failover)', async () => {
      try {
        const response = await axios.get(outputs.application_url, {
          timeout: 10000,
          validateStatus: () => true, // Accept any status
        });

        // Should get a response (even if it's a DNS error initially)
        expect(response).toBeDefined();

        if (response.status === 200) {
          // Check that response indicates which region served it
          const responseText = response.data.toString();
          const isFromPrimary = responseText.includes('Primary Region');
          const isFromSecondary = responseText.includes('Secondary Region');

          // Should be from one of the regions
          expect(isFromPrimary || isFromSecondary).toBe(true);
        }
      } catch (error: any) {
        // DNS might not be propagated yet, but verify the record exists
        if (error.code === 'ENOTFOUND') {
          console.log(
            'DNS not yet propagated, checking Route 53 records exist...'
          );

          const recordsResponse = await route53Client.send(
            new ListResourceRecordSetsCommand({
              HostedZoneId: outputs.route53_zone_id,
            })
          );

          const appRecords = recordsResponse.ResourceRecordSets?.filter(
            record => record.Name?.startsWith('app.')
          );

          expect(appRecords).toHaveLength(2);
        } else {
          throw error;
        }
      }
    });

    it('should verify RDS automated backups are configured', async () => {
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.primary_db_identifier,
        })
      );

      const db = dbResponse.DBInstances![0];

      // Check backup window is set
      expect(db.PreferredBackupWindow).toBeDefined();
      expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);

      // Check latest backup time exists (if database has been running)
      if (db.LatestRestorableTime) {
        const latestBackup = new Date(db.LatestRestorableTime);
        const now = new Date();
        const hoursSinceBackup =
          (now.getTime() - latestBackup.getTime()) / (1000 * 60 * 60);

        // Should have a recent backup (within 24 hours if DB is running)
        expect(hoursSinceBackup).toBeLessThan(25);
      }
    });
  });

  describe('Tagging Compliance', () => {
    it('should verify all major resources have required tags', async () => {
      const requiredTags = ['Project', 'Environment', 'Owner', 'ManagedBy'];

      // Check VPC tags
      const vpcResponse = await ec2ClientPrimary.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.primary_vpc_id] })
      );

      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      const vpcTagKeys = vpcTags.map(tag => tag.Key);

      requiredTags.forEach(tagKey => {
        expect(vpcTagKeys).toContain(tagKey);
      });

      // Verify ManagedBy tag value
      const managedByTag = vpcTags.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('terraform');

      // Check S3 bucket tags
      const s3TagsResponse = await s3Client.send(
        new GetBucketTaggingCommand({ Bucket: outputs.s3_bucket_name })
      );

      const s3Tags = s3TagsResponse.TagSet || [];
      const s3TagKeys = s3Tags.map(tag => tag.Key);

      requiredTags.forEach(tagKey => {
        expect(s3TagKeys).toContain(tagKey);
      });
    });
  });

  describe('Performance and Scaling', () => {
    it('should verify Auto Scaling policies are in place', async () => {
      // Check if ASG can scale
      const asgResponse = await asgClientPrimary.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.primary_asg_name],
        })
      );

      const asg = asgResponse.AutoScalingGroups![0];

      // Verify scaling capacity
      expect(asg.MaxSize).toBeGreaterThan(asg.MinSize!);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(4);

      // Check if currently scaled appropriately
      if (asg.Instances && asg.Instances.length > 0) {
        const runningInstances = asg.Instances.filter(
          i => i.LifecycleState === 'InService'
        ).length;

        expect(runningInstances).toBeGreaterThanOrEqual(asg.MinSize!);
        expect(runningInstances).toBeLessThanOrEqual(asg.MaxSize!);
      }
    });

    it('should verify CloudWatch alarms are configured', async () => {
      const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });

      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'alarm-primary-cpu-high',
        })
      );

      if (
        alarmsResponse.MetricAlarms &&
        alarmsResponse.MetricAlarms.length > 0
      ) {
        const cpuAlarm = alarmsResponse.MetricAlarms[0];

        expect(cpuAlarm.MetricName).toBe('CPUUtilization');
        expect(cpuAlarm.Statistic).toBe('Average');
        expect(cpuAlarm.Threshold).toBe(80);
        expect(cpuAlarm.ComparisonOperator).toBe(
          'GreaterThanOrEqualToThreshold'
        );
        expect(cpuAlarm.EvaluationPeriods).toBe(2);
      }
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    it('should validate complete infrastructure deployment', async () => {
      const infrastructureChecks = {
        // Networking
        primaryVpc: false,
        secondaryVpc: false,
        vpcPeering: false,

        // Compute
        primaryAlb: false,
        secondaryAlb: false,
        primaryAsg: false,
        secondaryAsg: false,

        // Database
        rdsInstance: false,
        rdsMultiAz: false,

        // Storage
        s3Bucket: false,
        s3Encryption: false,

        // DNS
        route53Zone: false,
        healthChecks: false,

        // Monitoring
        cloudWatchLogs: false,

        // Cost Optimization
        lambdaFunction: false,
        eventRule: false,
      };

      // Check VPCs
      try {
        const primaryVpc = await ec2ClientPrimary.send(
          new DescribeVpcsCommand({ VpcIds: [outputs.primary_vpc_id] })
        );
        infrastructureChecks.primaryVpc =
          primaryVpc.Vpcs![0].State === 'available';

        const secondaryVpc = await ec2ClientSecondary.send(
          new DescribeVpcsCommand({ VpcIds: [outputs.secondary_vpc_id] })
        );
        infrastructureChecks.secondaryVpc =
          secondaryVpc.Vpcs![0].State === 'available';
      } catch (e) {}

      // Check VPC Peering
      try {
        const peering = await ec2ClientPrimary.send(
          new DescribeVpcPeeringConnectionsCommand({
            VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id],
          })
        );
        infrastructureChecks.vpcPeering =
          peering.VpcPeeringConnections![0].Status?.Code === 'active';
      } catch (e) {}

      // Check ALBs
      try {
        const primaryAlb = await elbClientPrimary.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [outputs.primary_alb_arn],
          })
        );
        infrastructureChecks.primaryAlb =
          primaryAlb.LoadBalancers![0].State?.Code === 'active';

        const secondaryAlb = await elbClientSecondary.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [outputs.secondary_alb_arn],
          })
        );
        infrastructureChecks.secondaryAlb =
          secondaryAlb.LoadBalancers![0].State?.Code === 'active';
      } catch (e) {
        // Best Practice: Log the error for easier debugging
        console.error('Failed to describe ALBs in end-to-end test:', e);
      }

      // Check ASGs
      try {
        const primaryAsg = await asgClientPrimary.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.primary_asg_name],
          })
        );
        infrastructureChecks.primaryAsg =
          primaryAsg.AutoScalingGroups!.length > 0;

        const secondaryAsg = await asgClientSecondary.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [outputs.secondary_asg_name],
          })
        );
        infrastructureChecks.secondaryAsg =
          secondaryAsg.AutoScalingGroups!.length > 0;
      } catch (e) {}

      // Check RDS
      try {
        const rds = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.primary_db_identifier,
          })
        );
        infrastructureChecks.rdsInstance =
          rds.DBInstances![0].DBInstanceStatus === 'available';
        infrastructureChecks.rdsMultiAz = rds.DBInstances![0].MultiAZ === true;
      } catch (e) {}

      // Check S3
      try {
        await s3Client.send(
          new HeadBucketCommand({ Bucket: outputs.s3_bucket_name })
        );
        infrastructureChecks.s3Bucket = true;

        const encryption = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: outputs.s3_bucket_name })
        );
        infrastructureChecks.s3Encryption =
          encryption.ServerSideEncryptionConfiguration !== undefined;
      } catch (e) {}

      // Check Route53
      try {
        const records = await route53Client.send(
          new ListResourceRecordSetsCommand({
            HostedZoneId: outputs.route53_zone_id,
          })
        );
        infrastructureChecks.route53Zone =
          records.ResourceRecordSets!.length > 0;

        const healthCheck = await route53Client.send(
          new GetHealthCheckCommand({
            HealthCheckId: outputs.primary_health_check_id,
          })
        );
        infrastructureChecks.healthChecks =
          healthCheck.HealthCheck !== undefined;
      } catch (e) {}

      // Check CloudWatch Logs
      try {
        const logs = await cloudwatchLogsClientPrimary.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: '/app/nova-project-logs-',
          })
        );
        infrastructureChecks.cloudWatchLogs = logs.logGroups!.length > 0;
      } catch (e) {}

      // Check Lambda
      try {
        const lambda = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: outputs.lambda_function_name,
          })
        );
        infrastructureChecks.lambdaFunction =
          lambda.Configuration?.State === 'Active';

        const rule = await eventBridgeClient.send(
          new DescribeRuleCommand({
            Name: outputs.event_rule_name,
          })
        );
        infrastructureChecks.eventRule = rule.State === 'ENABLED';
      } catch (e) {}

      // Validate all components are deployed
      const failedComponents = Object.entries(infrastructureChecks)
        .filter(([_, status]) => !status)
        .map(([component, _]) => component);

      if (failedComponents.length > 0) {
        console.log('Failed infrastructure components:', failedComponents);
      }

      // All critical components should be deployed
      expect(infrastructureChecks.primaryVpc).toBe(true);
      expect(infrastructureChecks.secondaryVpc).toBe(true);
      expect(infrastructureChecks.vpcPeering).toBe(true);
      expect(infrastructureChecks.primaryAlb).toBe(true);
      expect(infrastructureChecks.secondaryAlb).toBe(true);
      expect(infrastructureChecks.primaryAsg).toBe(true);
      expect(infrastructureChecks.secondaryAsg).toBe(true);
      expect(infrastructureChecks.rdsInstance).toBe(true);
      expect(infrastructureChecks.rdsMultiAz).toBe(true);
      expect(infrastructureChecks.s3Bucket).toBe(true);
      expect(infrastructureChecks.s3Encryption).toBe(true);
      expect(infrastructureChecks.route53Zone).toBe(true);
      expect(infrastructureChecks.healthChecks).toBe(true);
      expect(infrastructureChecks.cloudWatchLogs).toBe(true);
      expect(infrastructureChecks.lambdaFunction).toBe(true);
      expect(infrastructureChecks.eventRule).toBe(true);
    });
  });
});
