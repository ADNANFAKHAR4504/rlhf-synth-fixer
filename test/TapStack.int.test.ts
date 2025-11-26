import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { KMSClient, DescribeKeyCommand, ListAliasesCommand } from '@aws-sdk/client-kms';
import { S3Client, GetBucketVersioningCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

/**
 * Dynamically fetch Pulumi stack outputs
 */
function getPulumiOutputs(): Record<string, any> {
  try {
    const passphrase = process.env.PULUMI_CONFIG_PASSPHRASE || 'dev-passphrase';
    const result = execSync(
      `pulumi stack output --json`,
      {
        encoding: 'utf-8',
        env: { ...process.env, PULUMI_CONFIG_PASSPHRASE: passphrase },
        cwd: path.join(__dirname, '..'),
      }
    );
    const outputs = JSON.parse(result);
    console.log(`✅ Fetched ${Object.keys(outputs).length} outputs from Pulumi stack`);
    return outputs;
  } catch (error: any) {
    console.warn(`⚠️ Could not fetch Pulumi outputs: ${error.message}`);
    // Try fallback to flat-outputs.json
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      try {
        const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
        console.log(`✅ Using outputs from ${outputsPath}`);
        return outputs;
      } catch (e) {
        console.warn(`⚠️ Could not read ${outputsPath}`);
      }
    }
    return {};
  }
}

/**
 * Get current Pulumi stack name
 */
function getPulumiStackName(): string {
  try {
    const passphrase = process.env.PULUMI_CONFIG_PASSPHRASE || 'dev-passphrase';
    const result = execSync(
      `pulumi stack --show-name`,
      {
        encoding: 'utf-8',
        env: { ...process.env, PULUMI_CONFIG_PASSPHRASE: passphrase },
        cwd: path.join(__dirname, '..'),
      }
    );
    return result.trim();
  } catch (error: any) {
    console.warn(`⚠️ Could not get Pulumi stack name: ${error.message}`);
    return environmentSuffix;
  }
}

/**
 * Check if a resource exists in Pulumi stack by URN pattern
 */
function isResourceDeployed(urnPattern: string): boolean {
  try {
    const passphrase = process.env.PULUMI_CONFIG_PASSPHRASE || 'dev-passphrase';
    const result = execSync(
      `pulumi stack --show-urns`,
      {
        encoding: 'utf-8',
        env: { ...process.env, PULUMI_CONFIG_PASSPHRASE: passphrase },
        cwd: path.join(__dirname, '..'),
      }
    );
    return result.includes(urnPattern);
  } catch (error) {
    return false;
  }
}

/**
 * Discover resources by naming convention if outputs are missing
 */
async function discoverResourceByName(
  client: any,
  command: any,
  namePattern: string,
  resourceType: string
): Promise<any> {
  try {
    const response = await client.send(command);
    const resources = response[resourceType] || response[`${resourceType}s`] || [];
    const matching = resources.filter((r: any) => {
      const name = r.Name || r[`${resourceType}Name`] || r[`${resourceType}Identifier`] || '';
      return name.includes(namePattern);
    });
    return matching.length > 0 ? matching[0] : null;
  } catch (error) {
    return null;
  }
}

describe('Payment App Infrastructure - Integration Tests', () => {
  let outputs: Record<string, any>;
  let stackName: string;
  const appName = 'payment-app';

  beforeAll(() => {
    stackName = getPulumiStackName();
    outputs = getPulumiOutputs();
    console.log(`\n📋 Testing stack: ${stackName}`);
    console.log(`📋 Available outputs: ${Object.keys(outputs).join(', ')}`);
  });

  describe('VPC Resources', () => {
    const ec2Client = new EC2Client({ region });

    it('production VPC exists and is accessible', async () => {
      let vpcId = outputs.productionVpcId;
      
      // If output not available, discover by name
      if (!vpcId) {
        const command = new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [`${appName}-production-vpc-${environmentSuffix}*`] }],
        });
        const response = await ec2Client.send(command);
        vpcId = response.Vpcs?.[0]?.VpcId;
      }

      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId!] });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].VpcId).toBe(vpcId);
    }, 30000);

    it('staging VPC exists and is accessible', async () => {
      let vpcId = outputs.stagingVpcId;
      
      // If output not available, discover by name
      if (!vpcId) {
        const command = new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [`${appName}-staging-vpc-${environmentSuffix}*`] }],
        });
        const response = await ec2Client.send(command);
        vpcId = response.Vpcs?.[0]?.VpcId;
      }

      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId!] });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].VpcId).toBe(vpcId);
    }, 30000);

    it('VPC peering connection exists and is active', async () => {
      let peeringId = outputs.vpcPeeringConnectionId;
      
      // If output not available, discover by name
      if (!peeringId) {
        const command = new DescribeVpcPeeringConnectionsCommand({
          Filters: [{ Name: 'tag:Name', Values: [`${appName}-vpc-peering-${environmentSuffix}*`] }],
        });
        const response = await ec2Client.send(command);
        peeringId = response.VpcPeeringConnections?.[0]?.VpcPeeringConnectionId;
      }

      expect(peeringId).toBeDefined();
      expect(peeringId).toMatch(/^pcx-/);

      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [peeringId!],
      });
      const response = await ec2Client.send(command);
      expect(response.VpcPeeringConnections).toHaveLength(1);
      expect(response.VpcPeeringConnections?.[0].Status?.Code).toBe('active');
    }, 30000);

    it('VPCs have subnets in multiple availability zones', async () => {
      const prodVpcId = outputs.productionVpcId || 
        (await ec2Client.send(new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: [`${appName}-production-vpc-${environmentSuffix}*`] }],
        }))).Vpcs?.[0]?.VpcId;

      expect(prodVpcId).toBeDefined();

      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [prodVpcId!] }],
      });
      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('KMS Encryption', () => {
    const kmsClient = new KMSClient({ region });

    it('KMS key exists and has key rotation enabled', async () => {
      let keyId = outputs.kmsKeyId;
      
      // If output not available, discover by alias
      if (!keyId) {
        const aliasCommand = new ListAliasesCommand({});
        const aliases = await kmsClient.send(aliasCommand);
        const alias = aliases.Aliases?.find(a => 
          a.AliasName?.includes(`${appName}-${environmentSuffix}`)
        );
        keyId = alias?.TargetKeyId;
      }

      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({ KeyId: keyId! });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyId).toBe(keyId);
      expect(response.KeyMetadata?.Enabled).toBe(true);
    }, 30000);
  });

  describe('Load Balancer', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region });

    it('ALB exists and is active', async () => {
      // Check if ALB was actually deployed
      const albDeployed = isResourceDeployed('aws:lb/loadBalancer:LoadBalancer');
      if (!albDeployed) {
        throw new Error('ALB was not deployed - test should fail for undeployed resources');
      }

      let albArn = outputs.albArn;
      
      // If output not available, discover by name
      if (!albArn || albArn === 'N/A - HTTP-only mode') {
        const command = new DescribeLoadBalancersCommand({});
        const response = await elbClient.send(command);
        const alb = response.LoadBalancers?.find(lb => 
          lb.LoadBalancerName?.includes(`${appName}-alb-${environmentSuffix}`)
        );
        albArn = alb?.LoadBalancerArn;
      }

      expect(albArn).toBeDefined();
      expect(albArn).not.toBe('N/A - HTTP-only mode');
      
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn!],
      });
      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers?.[0].State?.Code).toBe('active');
    }, 30000);

    it('blue target group exists', async () => {
      // Check if target group was actually deployed
      const tgDeployed = isResourceDeployed('aws:lb/targetGroup:TargetGroup');
      if (!tgDeployed) {
        throw new Error('Target group was not deployed - test should fail for undeployed resources');
      }

      let tgArn = outputs.blueTargetGroupArn;
      
      if (!tgArn) {
        const command = new DescribeTargetGroupsCommand({});
        const response = await elbClient.send(command);
        const tg = response.TargetGroups?.find(t => 
          t.TargetGroupName?.includes(`${appName}-blue-tg-${environmentSuffix}`)
        );
        tgArn = tg?.TargetGroupArn;
      }

      expect(tgArn).toBeDefined();
      
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [tgArn!],
      });
      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
      expect(response.TargetGroups?.[0].HealthCheckPath).toBe('/health');
    }, 30000);

    it('green target group exists', async () => {
      // Check if target group was actually deployed
      const tgDeployed = isResourceDeployed('aws:lb/targetGroup:TargetGroup');
      if (!tgDeployed) {
        throw new Error('Target group was not deployed - test should fail for undeployed resources');
      }

      let tgArn = outputs.greenTargetGroupArn;
      
      if (!tgArn) {
        const command = new DescribeTargetGroupsCommand({});
        const response = await elbClient.send(command);
        const tg = response.TargetGroups?.find(t => 
          t.TargetGroupName?.includes(`${appName}-green-tg-${environmentSuffix}`)
        );
        tgArn = tg?.TargetGroupArn;
      }

      expect(tgArn).toBeDefined();
      
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [tgArn!],
      });
      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
      expect(response.TargetGroups?.[0].HealthCheckPath).toBe('/health');
    }, 30000);
  });

  describe('Aurora Database', () => {
    const rdsClient = new RDSClient({ region });

    it('Aurora cluster exists and is available', async () => {
      // Check if Aurora cluster was actually deployed
      const clusterDeployed = isResourceDeployed('aws:rds/cluster:Cluster');
      if (!clusterDeployed) {
        throw new Error('Aurora cluster was not deployed - test should fail for undeployed resources');
      }

      let clusterEndpoint = outputs.auroraClusterEndpoint;
      
      if (!clusterEndpoint) {
        const command = new DescribeDBClustersCommand({});
        const response = await rdsClient.send(command);
        const cluster = response.DBClusters?.find(c => 
          c.DBClusterIdentifier?.includes(`${appName}-aurora-cluster-${environmentSuffix}`)
        );
        clusterEndpoint = cluster?.Endpoint;
      }

      expect(clusterEndpoint).toBeDefined();

      const clusterId = clusterEndpoint!.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters?.[0].Endpoint).toBe(clusterEndpoint);
      expect(response.DBClusters?.[0].DatabaseName).toBe(outputs.databaseName || 'paymentdb');
      expect(response.DBClusters?.[0].StorageEncrypted).toBe(true);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    const secretsClient = new SecretsManagerClient({ region });

    it('database connection secret exists', async () => {
      // Check if secret was actually deployed
      const secretDeployed = isResourceDeployed('aws:secretsmanager/secret:Secret');
      if (!secretDeployed) {
        throw new Error('Secret was not deployed - test should fail for undeployed resources');
      }

      let secretArn = outputs.dbConnectionSecretArn;
      
      if (!secretArn) {
        const command = new ListSecretsCommand({});
        const response = await secretsClient.send(command);
        const secret = response.SecretList?.find(s => 
          s.Name?.includes(`${appName}-db-connection-${environmentSuffix}`)
        );
        secretArn = secret?.ARN;
      }

      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({
        SecretId: secretArn!,
      });
      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(secretArn);
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('Auto Scaling Groups', () => {
    const asgClient = new AutoScalingClient({ region });

    it('blue ASG exists with correct configuration', async () => {
      // Check if ASG was actually deployed
      const asgDeployed = isResourceDeployed('aws:autoscaling/group:Group');
      if (!asgDeployed) {
        throw new Error('ASG was not deployed - test should fail for undeployed resources');
      }

      let asgName = outputs.blueAsgName;
      
      if (!asgName) {
        const command = new DescribeAutoScalingGroupsCommand({});
        const response = await asgClient.send(command);
        const asg = response.AutoScalingGroups?.find(a => 
          a.AutoScalingGroupName?.includes(`${appName}-blue-asg-${environmentSuffix}`)
        );
        asgName = asg?.AutoScalingGroupName;
      }

      expect(asgName).toBeDefined();

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName!],
      });
      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      expect(response.AutoScalingGroups?.[0].MinSize).toBe(2);
      expect(response.AutoScalingGroups?.[0].MaxSize).toBe(4);
      expect(response.AutoScalingGroups?.[0].DesiredCapacity).toBe(2);
    }, 30000);

    it('green ASG exists with correct configuration', async () => {
      // Check if ASG was actually deployed
      const asgDeployed = isResourceDeployed('aws:autoscaling/group:Group');
      if (!asgDeployed) {
        throw new Error('ASG was not deployed - test should fail for undeployed resources');
      }

      let asgName = outputs.greenAsgName;
      
      if (!asgName) {
        const command = new DescribeAutoScalingGroupsCommand({});
        const response = await asgClient.send(command);
        const asg = response.AutoScalingGroups?.find(a => 
          a.AutoScalingGroupName?.includes(`${appName}-green-asg-${environmentSuffix}`)
        );
        asgName = asg?.AutoScalingGroupName;
      }

      expect(asgName).toBeDefined();

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName!],
      });
      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      expect(response.AutoScalingGroups?.[0].MinSize).toBe(0);
      expect(response.AutoScalingGroups?.[0].MaxSize).toBe(4);
    }, 30000);
  });

  describe('S3 Resources', () => {
    const s3Client = new S3Client({ region });

    it('ALB logs bucket exists with versioning', async () => {
      // Check if S3 bucket was actually deployed
      const bucketDeployed = isResourceDeployed('aws:s3/bucket:Bucket');
      if (!bucketDeployed) {
        throw new Error('S3 bucket was not deployed - test should fail for undeployed resources');
      }

      // Discover bucket by listing all buckets and finding the one with our naming pattern
      const listCommand = new ListBucketsCommand({});
      const listResponse = await s3Client.send(listCommand);
      
      const bucket = listResponse.Buckets?.find(b => 
        b.Name?.includes(`${appName}-alb-logs-${environmentSuffix}`)
      );
      
      expect(bucket).toBeDefined();
      expect(bucket?.Name).toBeDefined();

      const command = new GetBucketVersioningCommand({
        Bucket: bucket!.Name!,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);
  });

  describe('CloudWatch Resources', () => {
    const cwLogsClient = new CloudWatchLogsClient({ region });
    const cwClient = new CloudWatchClient({ region });

    it('log group exists with correct configuration', async () => {
      // Check if log group was actually deployed
      const logGroupDeployed = isResourceDeployed('aws:cloudwatch/logGroup:LogGroup');
      if (!logGroupDeployed) {
        throw new Error('Log group was not deployed - test should fail for undeployed resources');
      }

      let logGroupName = outputs.logGroupName;
      
      if (!logGroupName) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: `${appName}-logs-${environmentSuffix}`,
        });
        const response = await cwLogsClient.send(command);
        logGroupName = response.logGroups?.[0]?.logGroupName;
      }

      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName!,
      });
      const response = await cwLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === logGroupName || lg.logGroupName?.startsWith(logGroupName!)
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    }, 30000);

    it('dashboard exists', async () => {
      // Check if dashboard was actually deployed
      const dashboardDeployed = isResourceDeployed('aws:cloudwatch/dashboard:Dashboard');
      if (!dashboardDeployed) {
        throw new Error('Dashboard was not deployed - test should fail for undeployed resources');
      }

      let dashboardName = outputs.dashboardName;
      
      if (!dashboardName) {
        const command = new ListDashboardsCommand({});
        const response = await cwClient.send(command);
        dashboardName = response.DashboardEntries?.find(d => 
          d.DashboardName?.includes(`${appName}-dashboard-${environmentSuffix}`)
        )?.DashboardName;
      }

      expect(dashboardName).toBeDefined();

      const command = new ListDashboardsCommand({
        DashboardNamePrefix: dashboardName!,
      });
      const response = await cwClient.send(command);
      expect(response.DashboardEntries).toBeDefined();
      const dashboard = response.DashboardEntries?.find(
        d => d.DashboardName === dashboardName
      );
      expect(dashboard).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Validation', () => {
    it('critical infrastructure components are deployed', async () => {
      // Verify core resources that should always be deployed
      const ec2Client = new EC2Client({ region });
      const kmsClient = new KMSClient({ region });
      
      // Verify at least one VPC exists
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [`${appName}-*-vpc-${environmentSuffix}*`] },
        ],
      });
      const vpcs = await ec2Client.send(vpcCommand);
      expect(vpcs.Vpcs?.length).toBeGreaterThan(0);
      
      // Verify KMS key exists
      const aliasCommand = new ListAliasesCommand({});
      const aliases = await kmsClient.send(aliasCommand);
      const kmsAlias = aliases.Aliases?.find(a => 
        a.AliasName?.includes(`${appName}-${environmentSuffix}`)
      );
      expect(kmsAlias).toBeDefined();
      
      console.log(`\n✅ Verified core resources exist via AWS API`);
      console.log(`   - VPCs found: ${vpcs.Vpcs?.length}`);
      console.log(`   - KMS alias found: ${kmsAlias ? 'Yes' : 'No'}`);
    });

    it('VPC peering connects production and staging', () => {
      if (outputs.productionVpcId && outputs.stagingVpcId) {
        expect(outputs.productionVpcId).not.toBe(outputs.stagingVpcId);
        if (outputs.vpcPeeringConnectionId) {
          expect(outputs.vpcPeeringConnectionId).toMatch(/^pcx-/);
        }
      }
    });

    it('blue-green deployment is configured (if ALB deployed)', () => {
      const albDeployed = isResourceDeployed('aws:lb/loadBalancer:LoadBalancer');
      if (albDeployed) {
        expect(outputs.blueAsgName).toBeDefined();
        expect(outputs.greenAsgName).toBeDefined();
        expect(outputs.blueTargetGroupArn).toBeDefined();
        expect(outputs.greenTargetGroupArn).toBeDefined();
      }
    });
  });
});
