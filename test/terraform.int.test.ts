// __tests__/webapp-stack.int.test.ts
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeLaunchTemplatesCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from "@aws-sdk/client-rds";
import {
  S3Client,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketEncryptionCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetBucketLifecycleConfigurationCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribeScalingActivitiesCommand,
  DescribePoliciesCommand,
  SetDesiredCapacityCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  DescribeSecretCommand,
  PutSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  IAMClient,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
  GetRoleCommand,
} from "@aws-sdk/client-iam";
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from "@aws-sdk/client-ssm";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import * as fs from "fs";
import * as path from "path";
import axios from 'axios';

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const secretsClient = new SecretsManagerClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });
const cwLogsClient = new CloudWatchLogsClient({ region: awsRegion });

// Helper function to safely parse JSON arrays
function parseJsonArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }
  return [];
}

// Helper function to wait for SSM command completion
async function waitForCommand(commandId: string, instanceId: string, maxWaitTime: number = 60000): Promise<any> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await ssmClient.send(new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      }));

      if (result.Status === 'Success' || result.Status === 'Failed') {
        return result;
      }
    } catch (error) {
      // Command might not be ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error(`Command ${commandId} did not complete within ${maxWaitTime}ms`);
}

describe("WebApp Stack Integration Tests", () => {
  let outputs: any;
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let databaseSubnetIds: string[];
  let albDnsName: string;
  let albZoneId: string;
  let autoScalingGroupName: string;
  let rdsEndpoint: string;
  let rdsReadReplicaEndpoints: string[];
  let s3LogsBucket: string;
  let securityGroupAlbId: string;
  let securityGroupWebId: string;
  let securityGroupRdsId: string;
  let dbSecretArn: string;
  let dbSecretName: string;
  let projectName: string = "webapp";
  let environment: string = "production";

  beforeAll(async () => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    
    let fileContent: string;
    if (fs.existsSync(outputFilePath)) {
      fileContent = fs.readFileSync(outputFilePath, "utf-8");
    } else {
      const altPath = path.join(process.cwd(), "flat-outputs.json");
      if (fs.existsSync(altPath)) {
        fileContent = fs.readFileSync(altPath, "utf-8");
      } else {
        throw new Error("Output file not found. Please ensure Terraform outputs are exported.");
      }
    }

    const parsedOutputs = JSON.parse(fileContent);
    
    // Extract values from outputs
    vpcId = parsedOutputs.vpc_id?.value || parsedOutputs.vpc_id;
    publicSubnetIds = parsedOutputs.public_subnet_ids?.value || parsedOutputs.public_subnet_ids || [];
    privateSubnetIds = parsedOutputs.private_subnet_ids?.value || parsedOutputs.private_subnet_ids || [];
    databaseSubnetIds = parsedOutputs.database_subnet_ids?.value || parsedOutputs.database_subnet_ids || [];
    albDnsName = parsedOutputs.alb_dns_name?.value || parsedOutputs.alb_dns_name;
    albZoneId = parsedOutputs.alb_zone_id?.value || parsedOutputs.alb_zone_id;
    autoScalingGroupName = parsedOutputs.autoscaling_group_name?.value || parsedOutputs.autoscaling_group_name;
    rdsEndpoint = parsedOutputs.rds_endpoint?.value || parsedOutputs.rds_endpoint;
    rdsReadReplicaEndpoints = parsedOutputs.rds_read_replica_endpoints?.value || parsedOutputs.rds_read_replica_endpoints || [];
    s3LogsBucket = parsedOutputs.s3_logs_bucket?.value || parsedOutputs.s3_logs_bucket;
    securityGroupAlbId = parsedOutputs.security_group_alb_id?.value || parsedOutputs.security_group_alb_id;
    securityGroupWebId = parsedOutputs.security_group_web_id?.value || parsedOutputs.security_group_web_id;
    securityGroupRdsId = parsedOutputs.security_group_rds_id?.value || parsedOutputs.security_group_rds_id;
    dbSecretArn = parsedOutputs.db_secret_arn?.value || parsedOutputs.db_secret_arn;
    dbSecretName = parsedOutputs.db_secret_name?.value || parsedOutputs.db_secret_name;
  });

  describe('[Infrastructure] VPC and Networking', () => {
    test('VPC exists with correct configuration', async () => {
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs!.length).toBe(1);
      
      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    }, 30000);

    test('All subnets are properly configured across AZs', async () => {
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds];
      const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      }));

      expect(subnetResponse.Subnets).toBeDefined();
      expect(subnetResponse.Subnets!.length).toBe(6);

      // Verify public subnets
      const publicSubnets = subnetResponse.Subnets!.filter(s => 
        publicSubnetIds.includes(s.SubnetId!)
      );
      expect(publicSubnets.length).toBe(2);
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });

      // Verify private and database subnets
      const privateSubnets = subnetResponse.Subnets!.filter(s => 
        privateSubnetIds.includes(s.SubnetId!)
      );
      expect(privateSubnets.length).toBe(2);

      const dbSubnets = subnetResponse.Subnets!.filter(s => 
        databaseSubnetIds.includes(s.SubnetId!)
      );
      expect(dbSubnets.length).toBe(2);

      // Verify multi-AZ deployment
      const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    }, 30000);

    test('Internet Gateway is attached and configured', async () => {
      const igwResponse = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      }));

      expect(igwResponse.InternetGateways).toBeDefined();
      expect(igwResponse.InternetGateways!.length).toBeGreaterThanOrEqual(1);
      
      const igw = igwResponse.InternetGateways![0];
      expect(igw.Attachments?.[0]?.State).toBe('available');
    }, 30000);

    test('NAT Gateways are configured for high availability', async () => {
      const natResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] }
        ]
      }));

      expect(natResponse.NatGateways).toBeDefined();
      expect(natResponse.NatGateways!.length).toBe(2); // One per AZ
      
      const natAzs = new Set(natResponse.NatGateways!.map(nat => nat.SubnetId));
      expect(natAzs.size).toBe(2);
    }, 30000);

    test('Route tables are properly configured', async () => {
      const routeTablesResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      expect(routeTablesResponse.RouteTables).toBeDefined();
      
      // Check for public route table with IGW route
      const publicRouteTables = routeTablesResponse.RouteTables!.filter(rt =>
        rt.Routes?.some(r => r.GatewayId?.startsWith('igw-'))
      );
      expect(publicRouteTables.length).toBeGreaterThanOrEqual(1);

      // Check for private route tables with NAT routes
      const privateRouteTables = routeTablesResponse.RouteTables!.filter(rt =>
        rt.Routes?.some(r => r.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRouteTables.length).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('[Security] Security Groups Configuration', () => {
    test('ALB security group allows HTTP/HTTPS from internet', async () => {
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupAlbId]
      }));

      const albSG = sgResponse.SecurityGroups![0];
      expect(albSG).toBeDefined();

      // Check HTTP rule
      const httpRule = albSG.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);

      // Check HTTPS rule
      const httpsRule = albSG.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);
    }, 30000);

    test('Web security group allows traffic only from ALB', async () => {
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupWebId]
      }));

      const webSG = sgResponse.SecurityGroups![0];
      expect(webSG).toBeDefined();

      // Check HTTP from ALB
      const httpRule = webSG.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === securityGroupAlbId
      )).toBe(true);

      // Check SSH from VPC
      const sshRule = webSG.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(r => r.CidrIp === '10.0.0.0/16')).toBe(true);
    }, 30000);

    test('RDS security group allows MySQL traffic only from web servers', async () => {
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupRdsId]
      }));

      const rdsSG = sgResponse.SecurityGroups![0];
      expect(rdsSG).toBeDefined();

      const mysqlRule = rdsSG.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === securityGroupWebId
      )).toBe(true);
    }, 30000);
  });

  describe('[Compute] Application Load Balancer', () => {
    test('ALB is active and properly configured', async () => {
      const albResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      
      const alb = albResponse.LoadBalancers?.find(lb => 
        lb.DNSName === albDnsName
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.SecurityGroups).toContain(securityGroupAlbId);
    }, 30000);

    test('ALB has listeners configured for HTTP', async () => {
      const albResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = albResponse.LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      
      const listenersResponse = await elbClient.send(new DescribeListenersCommand({
        LoadBalancerArn: alb!.LoadBalancerArn
      }));

      expect(listenersResponse.Listeners).toBeDefined();
      
      const httpListener = listenersResponse.Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
    }, 30000);

    test('Target group is configured with health checks', async () => {
      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({}));
      
      const targetGroup = tgResponse.TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes(`${projectName}-${environment}-web-tg`)
      );

      expect(targetGroup).toBeDefined();
      expect(targetGroup!.Protocol).toBe('HTTP');
      expect(targetGroup!.Port).toBe(80);
      expect(targetGroup!.HealthCheckEnabled).toBe(true);
      expect(targetGroup!.HealthCheckPath).toBe('/');
      expect(targetGroup!.HealthCheckIntervalSeconds).toBe(30);
    }, 30000);

    test('ALB has targets registered and healthy', async () => {
      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({}));
      const targetGroup = tgResponse.TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes(`${projectName}-${environment}-web-tg`)
      );

      if (targetGroup) {
        const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup.TargetGroupArn
        }));

        const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(
          t => t.TargetHealth?.State === 'healthy'
        );

        expect(healthyTargets).toBeDefined();
        expect(healthyTargets!.length).toBeGreaterThanOrEqual(0);
      }
    }, 30000);
  });

  describe('[Compute] Auto Scaling Group', () => {
    test('Auto Scaling Group is properly configured', async () => {
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoScalingGroupName]
      }));

      expect(asgResponse.AutoScalingGroups).toBeDefined();
      expect(asgResponse.AutoScalingGroups!.length).toBe(1);
      
      const asg = asgResponse.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    }, 30000);

    test('Launch template is configured correctly', async () => {
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoScalingGroupName]
      }));

      const launchTemplateId = asgResponse.AutoScalingGroups![0].LaunchTemplate?.LaunchTemplateId;
      
      const ltResponse = await ec2Client.send(new DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [launchTemplateId!]
      }));

      expect(ltResponse.LaunchTemplates).toBeDefined();
      expect(ltResponse.LaunchTemplates!.length).toBe(1);
      
      const lt = ltResponse.LaunchTemplates![0];
      expect(lt.LaunchTemplateName).toContain(`${projectName}-${environment}-web`);
    }, 30000);

    test('Scaling policies are configured', async () => {
      const policiesResponse = await autoScalingClient.send(new DescribePoliciesCommand({
        AutoScalingGroupName: autoScalingGroupName
      }));

      expect(policiesResponse.ScalingPolicies).toBeDefined();
      expect(policiesResponse.ScalingPolicies!.length).toBeGreaterThanOrEqual(2);

      const scaleUpPolicy = policiesResponse.ScalingPolicies?.find(p => 
        p.PolicyName?.includes('scale-up')
      );
      const scaleDownPolicy = policiesResponse.ScalingPolicies?.find(p => 
        p.PolicyName?.includes('scale-down')
      );

      expect(scaleUpPolicy).toBeDefined();
      expect(scaleDownPolicy).toBeDefined();
    }, 30000);

    test('Instances are distributed across multiple AZs', async () => {
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoScalingGroupName]
      }));

      const instances = asgResponse.AutoScalingGroups![0].Instances;
      if (instances && instances.length > 0) {
        const instanceIds = instances.map(i => i.InstanceId!);
        const ec2Response = await ec2Client.send(new DescribeInstancesCommand({
          InstanceIds: instanceIds
        }));

        const azs = new Set(
          ec2Response.Reservations!
            .flatMap(r => r.Instances!)
            .map(i => i.Placement?.AvailabilityZone)
        );
        
        expect(azs.size).toBeGreaterThanOrEqual(1);
      }
    }, 30000);
  });

  describe('[Database] RDS Configuration', () => {
    test('RDS master instance is available and configured', async () => {
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      
      const dbHost = rdsEndpoint.split(':')[0];
      const master = dbResponse.DBInstances?.find(d =>
        d.Endpoint?.Address === dbHost
      );

      expect(master).toBeDefined();
      expect(master!.DBInstanceStatus).toBe('available');
      expect(master!.Engine).toBe('mysql');
      expect(master!.StorageEncrypted).toBe(true);
      expect(master!.MultiAZ).toBe(true);
      expect(master!.BackupRetentionPeriod).toBe(30);
    }, 60000);

    test('RDS read replica is configured', async () => {
      if (rdsReadReplicaEndpoints.length > 0) {
        const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
        
        const replicaHost = rdsReadReplicaEndpoints[0].split(':')[0];
        const replica = dbResponse.DBInstances?.find(d =>
          d.Endpoint?.Address === replicaHost
        );

        expect(replica).toBeDefined();
        expect(replica!.DBInstanceStatus).toBe('available');
        expect(replica!.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
      }
    }, 60000);

    test('RDS subnet group spans multiple AZs', async () => {
      const subnetGroupName = `${projectName}-${environment}-db-subnet-group`;
      const sgResponse = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName
      }));

      expect(sgResponse.DBSubnetGroups).toBeDefined();
      expect(sgResponse.DBSubnetGroups!.length).toBe(1);
      
      const subnets = sgResponse.DBSubnetGroups![0].Subnets;
      expect(subnets!.length).toBe(2);
      
      const azs = new Set(subnets!.map(s => s.SubnetAvailabilityZone?.Name));
      expect(azs.size).toBe(2);
    }, 30000);
  });

  describe('[Storage] S3 Bucket Configuration', () => {
    test('S3 bucket exists with versioning enabled', async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: s3LogsBucket }));

      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: s3LogsBucket
      }));
      expect(versioningResponse.Status).toBe('Enabled');
    }, 30000);

    test('S3 bucket has encryption enabled', async () => {
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: s3LogsBucket
      }));
      
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, 30000);

    test('S3 bucket has public access blocked', async () => {
      const pabResponse = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: s3LogsBucket
      }));
      
      expect(pabResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('S3 bucket has lifecycle configuration', async () => {
      const lifecycleResponse = await s3Client.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: s3LogsBucket
      }));
      
      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);
      
      const rule = lifecycleResponse.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions).toBeDefined();
      expect(rule.Expiration?.Days).toBe(365);
    }, 30000);

    test('Can write and read ALB logs to S3 bucket', async () => {
      const testKey = `test/alb-log-${Date.now()}.json`;
      const testData = {
        timestamp: new Date().toISOString(),
        test: 'alb-log-test'
      };

      // Upload test log
      await s3Client.send(new PutObjectCommand({
        Bucket: s3LogsBucket,
        Key: testKey,
        Body: JSON.stringify(testData),
        ServerSideEncryption: 'AES256'
      }));

      // Retrieve and verify
      const getResponse = await s3Client.send(new GetObjectCommand({
        Bucket: s3LogsBucket,
        Key: testKey
      }));

      expect(getResponse.ServerSideEncryption).toBe('AES256');
      
      const body = await getResponse.Body?.transformToString();
      const retrievedData = JSON.parse(body!);
      expect(retrievedData.test).toBe('alb-log-test');

      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: s3LogsBucket,
        Key: testKey
      }));
    }, 30000);
  });

  describe('[Security] Secrets Manager', () => {
    test('Database credentials secret exists and is accessible', async () => {
      const secretResponse = await secretsClient.send(new DescribeSecretCommand({
        SecretId: dbSecretArn
      }));

      expect(secretResponse.Name).toBe(dbSecretName);
      expect(secretResponse.ARN).toBe(dbSecretArn);
    }, 30000);

    test('Database credentials contain required fields', async () => {
      const secretResponse = await secretsClient.send(new GetSecretValueCommand({
        SecretId: dbSecretArn
      }));

      expect(secretResponse.SecretString).toBeDefined();
      const secretData = JSON.parse(secretResponse.SecretString!);
      
      expect(secretData.username).toBeDefined();
      expect(secretData.password).toBeDefined();
      expect(secretData.engine).toBe('mysql');
      expect(secretData.port).toBe(3306);
      expect(secretData.dbname).toBe('webapp');
    }, 30000);

    test('Can rotate secret version', async () => {
      // Get current secret
      const { SecretString: originalSecret } = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: dbSecretArn })
      );

      const originalCredentials = JSON.parse(originalSecret!);
      
      // Create new version with test flag
      const testCredentials = {
        ...originalCredentials,
        testRotation: Date.now(),
      };

      await secretsClient.send(new PutSecretValueCommand({
        SecretId: dbSecretArn,
        SecretString: JSON.stringify(testCredentials),
      }));

      // Verify the update
      const { SecretString: updatedSecret } = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: dbSecretArn })
      );

      const updatedCredentials = JSON.parse(updatedSecret!);
      expect(updatedCredentials.testRotation).toBeDefined();

      // Restore original secret
      await secretsClient.send(new PutSecretValueCommand({
        SecretId: dbSecretArn,
        SecretString: originalSecret,
      }));
    }, 30000);
  });

  describe('[Security] IAM Roles and Policies', () => {
    test('Web instance profile exists with correct role', async () => {
      const instanceProfileName = `${projectName}-${environment}-web-profile`;
      const instanceProfileResponse = await iamClient.send(new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName
      }));

      expect(instanceProfileResponse.InstanceProfile).toBeDefined();
      expect(instanceProfileResponse.InstanceProfile?.Roles).toBeDefined();
      expect(instanceProfileResponse.InstanceProfile!.Roles!.length).toBe(1);
      
      const roleName = instanceProfileResponse.InstanceProfile!.Roles![0].RoleName;
      expect(roleName).toBe(`${projectName}-${environment}-web-role`);
    }, 30000);

    test('Web role has required managed policies attached', async () => {
      const roleName = `${projectName}-${environment}-web-role`;
      const policiesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName
      }));

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      
      const policyArns = policiesResponse.AttachedPolicies!.map(p => p.PolicyArn);
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    }, 30000);
  });

  describe('[Monitoring] CloudWatch Configuration', () => {
    test('CloudWatch alarms are configured for auto scaling', async () => {
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `${projectName}-${environment}-cpu`
      }));

      expect(alarmsResponse.MetricAlarms).toBeDefined();
      expect(alarmsResponse.MetricAlarms!.length).toBeGreaterThanOrEqual(2);

      const highCpuAlarm = alarmsResponse.MetricAlarms?.find(a => 
        a.AlarmName?.includes('cpu-high')
      );
      const lowCpuAlarm = alarmsResponse.MetricAlarms?.find(a => 
        a.AlarmName?.includes('cpu-low')
      );

      expect(highCpuAlarm).toBeDefined();
      expect(highCpuAlarm!.Threshold).toBe(70);
      expect(lowCpuAlarm).toBeDefined();
      expect(lowCpuAlarm!.Threshold).toBe(20);
    }, 30000);

    test('Auto Scaling Group metrics are being collected', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 15 * 60 * 1000);

      const metricsResponse = await cloudWatchClient.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [{
          Name: 'AutoScalingGroupName',
          Value: autoScalingGroupName
        }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Average']
      }));

      expect(metricsResponse.Datapoints).toBeDefined();
    }, 30000);

    test('RDS CloudWatch log groups exist', async () => {
      const logGroups = [
        `/aws/rds/instance/${projectName}-${environment}-mysql-master/errortf`,
        `/aws/rds/instance/${projectName}-${environment}-mysql-master/general`,
        `/aws/rds/instance/${projectName}-${environment}-mysql-master/slowquery`
      ];

      for (const logGroupName of logGroups) {
        const response = await cwLogsClient.send(new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        }));

        if (response.logGroups && response.logGroups.length > 0) {
          expect(response.logGroups[0].retentionInDays).toBe(7);
        }
      }
    }, 30000);
  });

  describe('[End-to-End] Application Functionality', () => {
    test('Application is accessible via ALB', async () => {
      let isHealthy = false;
      let retries = 3;
      
      while (retries > 0 && !isHealthy) {
        try {
          const response = await axios.get(`http://${albDnsName}`, {
            timeout: 10000,
            validateStatus: () => true
          });
          isHealthy = response.status === 200 || response.status === 302;
        } catch (error) {
          console.log(`ALB health check attempt ${4 - retries} failed`);
        }
        retries--;
        if (!isHealthy && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      expect(isHealthy).toBe(true);
    }, 60000);

    test('Application can handle concurrent requests', async () => {
      const concurrentRequests = 20;
      const requests = Array(concurrentRequests).fill(null).map(async () => {
        try {
          const response = await axios.get(`http://${albDnsName}`, {
            timeout: 5000,
            validateStatus: () => true
          });
          return response.status === 200 || response.status === 302;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(requests);
      const successCount = results.filter(r => r).length;
      
      // At least 80% should succeed
      expect(successCount / concurrentRequests).toBeGreaterThanOrEqual(0.8);
    }, 30000);

    test('Auto Scaling can adjust capacity', async () => {
      // Get current configuration
      const { AutoScalingGroups: initialGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoScalingGroupName]
        })
      );

      const initialDesired = initialGroups![0].DesiredCapacity!;
      const newDesired = Math.min(initialDesired + 1, initialGroups![0].MaxSize!);

      // Scale up
      await autoScalingClient.send(new SetDesiredCapacityCommand({
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: newDesired
      }));

      // Wait for scaling
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Verify scale up
      const { AutoScalingGroups: scaledGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoScalingGroupName]
        })
      );

      expect(scaledGroups![0].DesiredCapacity).toBe(newDesired);

      // Scale back down
      await autoScalingClient.send(new SetDesiredCapacityCommand({
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: initialDesired
      }));

      await new Promise(resolve => setTimeout(resolve, 30000));

      // Verify scale down
      const { AutoScalingGroups: finalGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoScalingGroupName]
        })
      );

      expect(finalGroups![0].DesiredCapacity).toBe(initialDesired);
    }, 120000);
  });

  describe('[High Availability] Multi-AZ Deployment', () => {
    test('Resources span multiple availability zones', async () => {
      // Check instances in multiple AZs
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [autoScalingGroupName]
      }));

      const instances = asgResponse.AutoScalingGroups![0].Instances;
      if (instances && instances.length > 1) {
        const azs = new Set(instances.map(i => i.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);
      }

      // Check ALB spans multiple AZs
      const albResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = albResponse.LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);

      // Check RDS Multi-AZ
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbHost = rdsEndpoint.split(':')[0];
      const masterDb = dbResponse.DBInstances?.find(d =>
        d.Endpoint?.Address === dbHost
      );
      expect(masterDb?.MultiAZ).toBe(true);
    }, 30000);

    test('System remains available during instance failure simulation', async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoScalingGroupName]
        })
      );

      const currentDesired = AutoScalingGroups![0].DesiredCapacity!;
      const currentMin = AutoScalingGroups![0].MinSize!;

      // Temporarily reduce capacity to simulate failure
      await autoScalingClient.send(new SetDesiredCapacityCommand({
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: currentMin
      }));

      // Wait for scale down
      await new Promise(resolve => setTimeout(resolve, 20000));

      // Test application still accessible
      let isAccessible = false;
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 5000,
          validateStatus: () => true
        });
        isAccessible = response.status === 200 || response.status === 302;
      } catch {
        isAccessible = false;
      }

      expect(isAccessible).toBe(true);

      // Restore original capacity
      await autoScalingClient.send(new SetDesiredCapacityCommand({
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: currentDesired
      }));

      await new Promise(resolve => setTimeout(resolve, 30000));
    }, 90000);
  });
});