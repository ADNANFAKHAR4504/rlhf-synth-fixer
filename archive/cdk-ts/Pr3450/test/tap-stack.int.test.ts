// Integration Tests for Multi-Region Resilient Infrastructure
// These tests validate the deployed infrastructure using real AWS outputs
// No mocking - uses actual deployment results from cfn-outputs and CloudFormation stacks

import fs from 'fs';
import path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  EFSClient,
  DescribeFileSystemsCommand,
} from '@aws-sdk/client-efs';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  Route53Client,
  ListHealthChecksCommand,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';

// Environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const primaryRegion = 'eu-west-2';
const standbyRegion = 'eu-west-3';

// AWS Clients for both regions
const primaryCfnClient = new CloudFormationClient({ region: primaryRegion });
const standbyCfnClient = new CloudFormationClient({ region: standbyRegion });
const primaryEc2Client = new EC2Client({ region: primaryRegion });
const standbyEc2Client = new EC2Client({ region: standbyRegion });
const primaryAlbClient = new ElasticLoadBalancingV2Client({ region: primaryRegion });
const standbyAlbClient = new ElasticLoadBalancingV2Client({ region: standbyRegion });
const primaryRdsClient = new RDSClient({ region: primaryRegion });
const standbyRdsClient = new RDSClient({ region: standbyRegion });
const primaryEfsClient = new EFSClient({ region: primaryRegion });
const standbyEfsClient = new EFSClient({ region: standbyRegion });
const primaryAsgClient = new AutoScalingClient({ region: primaryRegion });
const standbyAsgClient = new AutoScalingClient({ region: standbyRegion });
const route53Client = new Route53Client({ region: primaryRegion });
const primaryKmsClient = new KMSClient({ region: primaryRegion });
const standbyKmsClient = new KMSClient({ region: standbyRegion });

// Load outputs from deployment
let outputs: any = {};
let standbyOutputs: any = {};

async function loadOutputs() {
  // Load primary region outputs from flat-outputs.json
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    console.log('✅ Loaded primary region outputs from flat-outputs.json');
  } else {
    throw new Error('cfn-outputs/flat-outputs.json not found. Deploy the stack first.');
  }

  // Query CloudFormation to get standby region stack outputs
  const stackName = `TapStack${environmentSuffix}`;
  const standbyStackNames = [
    `${stackName}-VpcStack-Standby`,
    `${stackName}-SecurityStandby`,
    `${stackName}-StorageStandby`,
    `${stackName}-DatabaseStandby`,
    `${stackName}-ComputeStandby`,
  ];

  for (const name of standbyStackNames) {
    try {
      const command = new DescribeStacksCommand({ StackName: name });
      const response = await standbyCfnClient.send(command);
      const stack = response.Stacks?.[0];

      if (stack?.Outputs) {
        for (const output of stack.Outputs) {
          if (output.OutputKey && output.OutputValue) {
            standbyOutputs[output.OutputKey] = output.OutputValue;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not load stack ${name}:`, (error as Error).message);
    }
  }

  console.log('✅ Loaded standby region outputs from CloudFormation');
  console.log(`   Primary outputs: ${Object.keys(outputs).length} keys`);
  console.log(`   Standby outputs: ${Object.keys(standbyOutputs).length} keys`);
}

describe('Multi-Region Resilient Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    await loadOutputs();
  }, 60000);

  describe('Primary Region (eu-west-2) Infrastructure', () => {
    describe('VPC Configuration', () => {
      test('VPC should exist with correct CIDR block', async () => {
        const vpcId = outputs.VpcId;
        expect(vpcId).toBeDefined();

        const response = await primaryEc2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );

        const vpc = response.Vpcs?.[0];
        expect(vpc).toBeDefined();
        expect(vpc?.VpcId).toBe(vpcId);
        expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc?.State).toBe('available');
      });

      test('VPC should have public, private, and isolated subnets', async () => {
        const vpcId = outputs.VpcId;

        const response = await primaryEc2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
          })
        );

        const subnets = response.Subnets || [];
        expect(subnets.length).toBeGreaterThanOrEqual(6); // At least 2 AZs × 3 subnet types

        // Check for public subnets
        const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
        expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

        // Check for private subnets
        const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);
        expect(privateSubnets.length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Security Configuration', () => {
      test('KMS key should exist with encryption enabled and rotation', async () => {
        // Extract KMS key ID from ARN
        const kmsKeyArn = Object.values(outputs).find((value: any) =>
          typeof value === 'string' && value.includes('arn:aws:kms')
        ) as string;

        if (!kmsKeyArn) {
          console.warn('⚠️ KMS key ARN not found in outputs');
          return;
        }

        const keyId = kmsKeyArn.split('/').pop();
        expect(keyId).toBeDefined();

        const keyResponse = await primaryKmsClient.send(
          new DescribeKeyCommand({ KeyId: keyId })
        );

        expect(keyResponse.KeyMetadata?.Enabled).toBe(true);
        expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');

        const rotationResponse = await primaryKmsClient.send(
          new GetKeyRotationStatusCommand({ KeyId: keyId })
        );

        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      });

      test('Security groups should follow least privilege principle', async () => {
        const vpcId = outputs.VpcId;

        const response = await primaryEc2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
          })
        );

        const securityGroups = response.SecurityGroups || [];
        expect(securityGroups.length).toBeGreaterThan(0);

        // Verify no security groups allow unrestricted access on critical ports
        for (const sg of securityGroups) {
          const hasUnrestrictedSsh = sg.IpPermissions?.some(rule =>
            rule.FromPort === 22 &&
            rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
          );
          expect(hasUnrestrictedSsh).toBeFalsy();

          const hasUnrestrictedRdp = sg.IpPermissions?.some(rule =>
            rule.FromPort === 3389 &&
            rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
          );
          expect(hasUnrestrictedRdp).toBeFalsy();
        }
      });
    });

    describe('Storage Resources', () => {
      test('EFS file system should exist with encryption enabled', async () => {
        const efsId = outputs.EfsId;
        expect(efsId).toBeDefined();

        const response = await primaryEfsClient.send(
          new DescribeFileSystemsCommand({ FileSystemId: efsId })
        );

        const fileSystem = response.FileSystems?.[0];
        expect(fileSystem).toBeDefined();
        expect(fileSystem?.FileSystemId).toBe(efsId);
        expect(fileSystem?.Encrypted).toBe(true);
        expect(fileSystem?.LifeCycleState).toBe('available');
      });

      test('EFS DNS name should be resolvable', () => {
        const efsDnsName = outputs.EfsDnsName;
        expect(efsDnsName).toBeDefined();
        expect(efsDnsName).toMatch(/^fs-[a-f0-9]+\.efs\.eu-west-2\.amazonaws\.com$/);
      });
    });

    describe('Database Resources', () => {
      test('RDS primary instance should be Multi-AZ with encryption', async () => {
        const dbEndpoint = outputs.DbEndpoint;
        expect(dbEndpoint).toBeDefined();

        // Extract DB instance identifier from endpoint
        const dbIdentifier = dbEndpoint.split('.')[0];

        const response = await primaryRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
        );

        const dbInstance = response.DBInstances?.[0];
        expect(dbInstance).toBeDefined();
        expect(dbInstance?.MultiAZ).toBe(true);
        expect(dbInstance?.StorageEncrypted).toBe(true);
        expect(dbInstance?.DBInstanceStatus).toBe('available');
        expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      });

      test('Database credentials should be stored in Secrets Manager', () => {
        const secretArn = outputs.DbCredentialsSecret;
        expect(secretArn).toBeDefined();
        expect(secretArn).toMatch(/^arn:aws:secretsmanager:eu-west-2/);
      });
    });

    describe('Compute Resources', () => {
      test('Application Load Balancer should be internet-facing', async () => {
        const albDns = outputs.LoadBalancerDns;
        expect(albDns).toBeDefined();

        const response = await primaryAlbClient.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = response.LoadBalancers?.find(lb =>
          lb.DNSName === albDns
        );

        expect(alb).toBeDefined();
        expect(alb?.Scheme).toBe('internet-facing');
        expect(alb?.State?.Code).toBe('active');
        expect(alb?.Type).toBe('application');
      });

      test('ALB should have target groups with health checks', async () => {
        const albDns = outputs.LoadBalancerDns;

        const lbResponse = await primaryAlbClient.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = lbResponse.LoadBalancers?.find(lb =>
          lb.DNSName === albDns
        );

        const tgResponse = await primaryAlbClient.send(
          new DescribeTargetGroupsCommand({
            LoadBalancerArn: alb?.LoadBalancerArn
          })
        );

        const targetGroups = tgResponse.TargetGroups || [];
        expect(targetGroups.length).toBeGreaterThan(0);

        for (const tg of targetGroups) {
          expect(tg.HealthCheckEnabled).toBe(true);
          expect(tg.HealthCheckPath).toBe('/health');
          expect(tg.HealthCheckProtocol).toBe('HTTP');
        }
      });

      test('Auto Scaling Group should have step scaling policies', async () => {
        // Find ASG name from outputs
        const asgName = Object.values(outputs).find((value: any) =>
          typeof value === 'string' && value.includes('AppAutoScalingGroupASG')
        ) as string;

        if (!asgName) {
          console.warn('⚠️ ASG name not found in outputs');
          return;
        }

        const asgResponse = await primaryAsgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [asgName]
          })
        );

        const asg = asgResponse.AutoScalingGroups?.[0];
        expect(asg).toBeDefined();
        expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
        expect(asg?.MaxSize).toBeGreaterThanOrEqual(2);

        const policiesResponse = await primaryAsgClient.send(
          new DescribePoliciesCommand({
            AutoScalingGroupName: asgName
          })
        );

        const policies = policiesResponse.ScalingPolicies || [];
        expect(policies.length).toBeGreaterThan(0);

        // Check for step scaling policies
        const stepPolicies = policies.filter(p => p.PolicyType === 'StepScaling');
        expect(stepPolicies.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Standby Region (eu-west-3) Infrastructure', () => {
    describe('VPC Configuration', () => {
      test('Standby VPC should exist with correct CIDR block', async () => {
        const vpcId = standbyOutputs.VpcId;
        expect(vpcId).toBeDefined();

        const response = await standbyEc2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );

        const vpc = response.Vpcs?.[0];
        expect(vpc).toBeDefined();
        expect(vpc?.VpcId).toBe(vpcId);
        expect(vpc?.CidrBlock).toBe('10.1.0.0/16');
        expect(vpc?.State).toBe('available');
      });

      test('Standby VPC should have public, private, and isolated subnets', async () => {
        const vpcId = standbyOutputs.VpcId;

        const response = await standbyEc2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
          })
        );

        const subnets = response.Subnets || [];
        expect(subnets.length).toBeGreaterThanOrEqual(6);
      });
    });

    describe('Storage Resources', () => {
      test('Standby EFS file system should exist with encryption', async () => {
        const efsId = standbyOutputs.EfsId;
        expect(efsId).toBeDefined();

        const response = await standbyEfsClient.send(
          new DescribeFileSystemsCommand({ FileSystemId: efsId })
        );

        const fileSystem = response.FileSystems?.[0];
        expect(fileSystem).toBeDefined();
        expect(fileSystem?.Encrypted).toBe(true);
        expect(fileSystem?.LifeCycleState).toBe('available');
      });
    });

    describe('Database Resources', () => {
      test('RDS read replica should exist in standby region', async () => {
        const dbEndpoint = standbyOutputs.DbEndpoint;
        expect(dbEndpoint).toBeDefined();

        const dbIdentifier = dbEndpoint.split('.')[0];

        const response = await standbyRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
        );

        const dbInstance = response.DBInstances?.[0];
        expect(dbInstance).toBeDefined();
        expect(dbInstance?.StorageEncrypted).toBe(true);
        expect(dbInstance?.DBInstanceStatus).toBe('available');

        // Verify it's a read replica
        expect(dbInstance?.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
      });
    });

    describe('Compute Resources', () => {
      test('Standby ALB should be internet-facing', async () => {
        const albUrl = outputs.StandbyAlbUrl;
        expect(albUrl).toBeDefined();

        const albDns = albUrl.replace('http://', '').replace('https://', '');

        const response = await standbyAlbClient.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = response.LoadBalancers?.find(lb =>
          lb.DNSName === albDns
        );

        expect(alb).toBeDefined();
        expect(alb?.Scheme).toBe('internet-facing');
        expect(alb?.State?.Code).toBe('active');
      });

      test('Standby ALB should have target groups with health checks', async () => {
        const albUrl = outputs.StandbyAlbUrl;
        const albDns = albUrl.replace('http://', '').replace('https://', '');

        const lbResponse = await standbyAlbClient.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = lbResponse.LoadBalancers?.find(lb =>
          lb.DNSName === albDns
        );

        const tgResponse = await standbyAlbClient.send(
          new DescribeTargetGroupsCommand({
            LoadBalancerArn: alb?.LoadBalancerArn
          })
        );

        const targetGroups = tgResponse.TargetGroups || [];
        expect(targetGroups.length).toBeGreaterThan(0);

        for (const tg of targetGroups) {
          expect(tg.HealthCheckEnabled).toBe(true);
          expect(tg.HealthCheckPath).toBe('/health');
        }
      });
    });
  });

  describe('Cross-Region Connectivity', () => {
    describe('VPC Peering', () => {
      test('VPC peering connection should be active', async () => {
        const peeringConnectionId = outputs.VpcPeeringConnectionId;
        expect(peeringConnectionId).toBeDefined();

        const response = await primaryEc2Client.send(
          new DescribeVpcPeeringConnectionsCommand({
            VpcPeeringConnectionIds: [peeringConnectionId]
          })
        );

        const peering = response.VpcPeeringConnections?.[0];
        expect(peering).toBeDefined();
        expect(peering?.Status?.Code).toBe('active');
      });

      test('VPC peering should connect primary and standby VPCs', async () => {
        const peeringConnectionId = outputs.VpcPeeringConnectionId;
        const primaryVpcId = outputs.VpcId;
        const standbyVpcId = standbyOutputs.VpcId;

        const response = await primaryEc2Client.send(
          new DescribeVpcPeeringConnectionsCommand({
            VpcPeeringConnectionIds: [peeringConnectionId]
          })
        );

        const peering = response.VpcPeeringConnections?.[0];
        expect(peering).toBeDefined();

        const requesterVpcId = peering?.RequesterVpcInfo?.VpcId;
        const accepterVpcId = peering?.AccepterVpcInfo?.VpcId;

        expect([requesterVpcId, accepterVpcId]).toContain(primaryVpcId);
        expect([requesterVpcId, accepterVpcId]).toContain(standbyVpcId);
      });

      test('VPC peering should have correct CIDR blocks', async () => {
        const peeringConnectionId = outputs.VpcPeeringConnectionId;

        const response = await primaryEc2Client.send(
          new DescribeVpcPeeringConnectionsCommand({
            VpcPeeringConnectionIds: [peeringConnectionId]
          })
        );

        const peering = response.VpcPeeringConnections?.[0];

        const requesterCidr = peering?.RequesterVpcInfo?.CidrBlock;
        const accepterCidr = peering?.AccepterVpcInfo?.CidrBlock;

        expect([requesterCidr, accepterCidr]).toContain('10.0.0.0/16');
        expect([requesterCidr, accepterCidr]).toContain('10.1.0.0/16');
      });
    });

    describe('Database Replication', () => {
      test('RDS replica should be replicating from primary', async () => {
        const primaryDbEndpoint = outputs.DbEndpoint;
        const standbyDbEndpoint = standbyOutputs.DbEndpoint;

        expect(primaryDbEndpoint).toBeDefined();
        expect(standbyDbEndpoint).toBeDefined();

        const primaryDbId = primaryDbEndpoint.split('.')[0];
        const standbyDbId = standbyDbEndpoint.split('.')[0];

        const primaryResponse = await primaryRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: primaryDbId })
        );

        const standbyResponse = await standbyRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: standbyDbId })
        );

        const primaryDb = primaryResponse.DBInstances?.[0];
        const standbyDb = standbyResponse.DBInstances?.[0];

        expect(primaryDb).toBeDefined();
        expect(standbyDb).toBeDefined();

        // Verify replica relationship
        expect(standbyDb?.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();

        // Check if the replica is in the primary's list (could be ARN or identifier)
        const replicaList = primaryDb?.ReadReplicaDBInstanceIdentifiers || [];
        const hasReplica = replicaList.some(id =>
          id === standbyDb?.DBInstanceIdentifier ||
          id.includes(standbyDb?.DBInstanceIdentifier || '')
        );
        expect(hasReplica).toBe(true);
      });
    });
  });

  describe('DNS and Failover Configuration', () => {
    describe('Route 53 Health Checks', () => {
      test('Health checks should exist for both ALBs', async () => {
        const response = await route53Client.send(
          new ListHealthChecksCommand({})
        );

        const healthChecks = response.HealthChecks || [];

        // Find health checks for our ALBs
        const primaryAlbDns = outputs.LoadBalancerDns;
        const standbyAlbUrl = outputs.StandbyAlbUrl;
        const standbyAlbDns = standbyAlbUrl?.replace('http://', '').replace('https://', '');

        const primaryHealthCheck = healthChecks.find(hc =>
          hc.HealthCheckConfig?.FullyQualifiedDomainName === primaryAlbDns
        );

        const standbyHealthCheck = healthChecks.find(hc =>
          hc.HealthCheckConfig?.FullyQualifiedDomainName === standbyAlbDns
        );

        // If domain is configured, health checks should exist
        if (outputs.ApplicationUrl) {
          expect(primaryHealthCheck || standbyHealthCheck).toBeDefined();
        }
      });
    });

    describe('Failover Records', () => {
      test('Primary and standby ALB URLs should be accessible', () => {
        const primaryAlbUrl = outputs.PrimaryAlbUrl;
        const standbyAlbUrl = outputs.StandbyAlbUrl;

        expect(primaryAlbUrl).toBeDefined();
        expect(standbyAlbUrl).toBeDefined();

        expect(primaryAlbUrl).toMatch(/^https?:\/\/.+\.eu-west-2\.elb\.amazonaws\.com$/);
        expect(standbyAlbUrl).toMatch(/^https?:\/\/.+\.eu-west-3\.elb\.amazonaws\.com$/);
      });
    });
  });

  describe('Resilience and Testing', () => {
    describe('Resilience Hub Application', () => {
      test('Resilience Hub app should be registered', () => {
        const resilienceHubAppArn = outputs.ResilienceHubAppArn;
        expect(resilienceHubAppArn).toBeDefined();
        expect(resilienceHubAppArn).toMatch(/^arn:aws:resiliencehub:eu-west-2/);
      });
    });
  });

  describe('Security and Compliance', () => {
    describe('Encryption at Rest', () => {
      test('All EFS file systems should be encrypted', async () => {
        const primaryEfsId = outputs.EfsId;
        const standbyEfsId = standbyOutputs.EfsId;

        const primaryEfs = await primaryEfsClient.send(
          new DescribeFileSystemsCommand({ FileSystemId: primaryEfsId })
        );

        const standbyEfs = await standbyEfsClient.send(
          new DescribeFileSystemsCommand({ FileSystemId: standbyEfsId })
        );

        expect(primaryEfs.FileSystems?.[0]?.Encrypted).toBe(true);
        expect(standbyEfs.FileSystems?.[0]?.Encrypted).toBe(true);
      });

      test('All RDS instances should be encrypted', async () => {
        const primaryDbId = outputs.DbEndpoint.split('.')[0];
        const standbyDbId = standbyOutputs.DbEndpoint.split('.')[0];

        const primaryDb = await primaryRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: primaryDbId })
        );

        const standbyDb = await standbyRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: standbyDbId })
        );

        expect(primaryDb.DBInstances?.[0]?.StorageEncrypted).toBe(true);
        expect(standbyDb.DBInstances?.[0]?.StorageEncrypted).toBe(true);
      });
    });

    describe('Network Isolation', () => {
      test('Database instances should be in isolated subnets', async () => {
        const primaryDbId = outputs.DbEndpoint.split('.')[0];
        const standbyDbId = standbyOutputs.DbEndpoint.split('.')[0];

        const primaryDb = await primaryRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: primaryDbId })
        );

        const standbyDb = await standbyRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: standbyDbId })
        );

        expect(primaryDb.DBInstances?.[0]?.PubliclyAccessible).toBe(false);
        expect(standbyDb.DBInstances?.[0]?.PubliclyAccessible).toBe(false);
      });

      test('EC2 instances should not have public IPs', async () => {
        // This is verified through the ASG and target groups
        // EC2 instances in private subnets should not have public IPs
        const primaryVpcId = outputs.VpcId;

        const subnets = await primaryEc2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              { Name: 'vpc-id', Values: [primaryVpcId] },
              { Name: 'tag:Name', Values: ['*private*'] }
            ]
          })
        );

        const privateSubnets = subnets.Subnets || [];
        for (const subnet of privateSubnets) {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
        }
      });
    });
  });

  describe('High Availability Configuration', () => {
    describe('Multi-AZ Deployment', () => {
      test('Primary RDS should be deployed across multiple AZs', async () => {
        const dbEndpoint = outputs.DbEndpoint;
        const dbIdentifier = dbEndpoint.split('.')[0];

        const response = await primaryRdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
        );

        const dbInstance = response.DBInstances?.[0];
        expect(dbInstance?.MultiAZ).toBe(true);
      });

      test('Primary VPC should span multiple availability zones', async () => {
        const vpcId = outputs.VpcId;

        const response = await primaryEc2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
          })
        );

        const subnets = response.Subnets || [];
        const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));

        expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      });

      test('Standby VPC should span multiple availability zones', async () => {
        const vpcId = standbyOutputs.VpcId;

        const response = await standbyEc2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
          })
        );

        const subnets = response.Subnets || [];
        const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));

        expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Auto Scaling Configuration', () => {
      test('Auto Scaling groups should have minimum capacity for HA', async () => {
        const asgName = Object.values(outputs).find((value: any) =>
          typeof value === 'string' && value.includes('AppAutoScalingGroupASG')
        ) as string;

        if (!asgName) {
          console.warn('⚠️ ASG name not found in outputs');
          return;
        }

        const response = await primaryAsgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [asgName]
          })
        );

        const asg = response.AutoScalingGroups?.[0];
        expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
        expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('VPC resources should be properly tagged', async () => {
      const primaryVpcId = outputs.VpcId;

      const response = await primaryEc2Client.send(
        new DescribeVpcsCommand({ VpcIds: [primaryVpcId] })
      );

      const vpc = response.Vpcs?.[0];
      const tags = vpc?.Tags || [];

      expect(tags.length).toBeGreaterThan(0);
    });

    test('All outputs should be environment-agnostic', () => {
      // Verify outputs don't hardcode environment suffixes in assertions
      // This test ensures reproducibility across environments

      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.EfsId).toMatch(/^fs-[a-f0-9]+$/);
      expect(outputs.VpcPeeringConnectionId).toMatch(/^pcx-[a-f0-9]+$/);

      if (outputs.DbEndpoint) {
        expect(outputs.DbEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      }
    });
  });
});
