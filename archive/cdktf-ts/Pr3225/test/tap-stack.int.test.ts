// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeRouteTablesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeInstanceStatusCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand, DescribeTargetHealthCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, SetDesiredCapacityCommand } from "@aws-sdk/client-auto-scaling";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand, SimulatePrincipalPolicyCommand, ListAttachedRolePoliciesCommand, GetRolePolicyCommand, ListRolePoliciesCommand, GetPolicyCommand, GetPolicyVersionCommand } from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

// Helper Functions

/**
 * Wait for a condition to be met with retry logic
 */
async function waitForCondition(
  checkFn: () => Promise<boolean>,
  timeoutMs: number = 60000,
  intervalMs: number = 5000,
  description: string = "condition"
): Promise<void> {
  const startTime = Date.now();
  let lastError: any = null;
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await checkFn();
      if (result) {
        return;
      }
    } catch (error) {
      lastError = error;
      console.log(`Waiting for ${description}: ${error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  const errorMessage = lastError ? 
    `Timeout waiting for ${description} after ${timeoutMs}ms. Last error: ${lastError}` :
    `Timeout waiting for ${description} after ${timeoutMs}ms`;
  throw new Error(errorMessage);
}

/**
 * Wait for ASG instances to be in service
 */
async function waitForASGInstances(
  asgName: string,
  minInstances: number = 1,
  timeoutMs: number = 120000
): Promise<string[]> {
  const instanceIds: string[] = [];
  
  await waitForCondition(
    async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
      );
      
      const asg = AutoScalingGroups?.[0];
      if (!asg) {
        console.log(`ASG ${asgName} not found`);
        return false;
      }
      
      const inServiceInstances = asg.Instances?.filter(
        i => i.LifecycleState === "InService" && i.HealthStatus === "Healthy"
      ) || [];
      
      const totalInstances = asg.Instances?.length || 0;
      const pendingInstances = asg.Instances?.filter(i => i.LifecycleState === "Pending")?.length || 0;
      
      console.log(`ASG ${asgName}: ${inServiceInstances.length}/${minInstances} healthy (Total: ${totalInstances}, Pending: ${pendingInstances})`);
      
      if (inServiceInstances.length >= minInstances) {
        instanceIds.length = 0;
        instanceIds.push(...inServiceInstances.map(i => i.InstanceId!).filter(id => id));
        return true;
      }
      
      return false;
    },
    timeoutMs,
    10000,
    `ASG ${asgName} to have ${minInstances} healthy instances`
  );
  
  return instanceIds;
}

/**
 * Ensure ASG has desired capacity
 */
async function ensureASGCapacity(
  asgName: string,
  desiredCapacity: number = 1
): Promise<void> {
  const { AutoScalingGroups } = await autoScalingClient.send(
    new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
  );
  
  const asg = AutoScalingGroups?.[0];
  if (!asg) {
    throw new Error(`ASG ${asgName} not found`);
  }
  
  console.log(`\nASG Current State:`);
  console.log(`  Desired Capacity: ${asg.DesiredCapacity}`);
  console.log(`  Min Size: ${asg.MinSize}`);
  console.log(`  Max Size: ${asg.MaxSize}`);
  console.log(`  Current Instances: ${asg.Instances?.length || 0}`);
  
  if (asg.DesiredCapacity !== desiredCapacity) {
    console.log(`\nAdjusting ASG desired capacity from ${asg.DesiredCapacity} to ${desiredCapacity}`);
    await autoScalingClient.send(
      new SetDesiredCapacityCommand({
        AutoScalingGroupName: asgName,
        DesiredCapacity: desiredCapacity
      })
    );
    
    // Wait for ASG to acknowledge the change
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

/**
 * Check if IAM role has specific CloudWatch Logs permissions
 */
async function checkRoleHasCloudWatchLogsPermissions(roleName: string): Promise<boolean> {
  try {
    // Get attached managed policies
    const { AttachedPolicies } = await iamClient.send(
      new ListAttachedRolePoliciesCommand({ RoleName: roleName })
    );
    
    // Check for AWS managed CloudWatch Logs policies
    const hasCloudWatchPolicy = AttachedPolicies?.some(policy => 
      policy.PolicyName?.includes("CloudWatchAgent") ||
      policy.PolicyName?.includes("CloudWatchLogs")
    );
    
    if (hasCloudWatchPolicy) return true;
    
    // Get inline policies
    const { PolicyNames } = await iamClient.send(
      new ListRolePoliciesCommand({ RoleName: roleName })
    );
    
    // Check inline policies for CloudWatch Logs permissions
    for (const policyName of PolicyNames || []) {
      const { PolicyDocument } = await iamClient.send(
        new GetRolePolicyCommand({ 
          RoleName: roleName, 
          PolicyName: policyName 
        })
      );
      
      if (PolicyDocument) {
        const policy = JSON.parse(decodeURIComponent(PolicyDocument));
        const hasLogsPermissions = policy.Statement?.some((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          return actions.some((action: string) => 
            action.includes("logs:CreateLogStream") ||
            action.includes("logs:PutLogEvents") ||
            action.includes("logs:*")
          );
        });
        
        if (hasLogsPermissions) return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking CloudWatch Logs permissions for role ${roleName}:`, error);
    return false;
  }
}

describe("TAP Stack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let autoScalingGroupName: string;
  let albSecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let loadBalancerDnsName: string;
  let albZoneId: string;
  let rdsEndpoint: string;
  let rdsInstanceId: string;
  let s3BucketName: string;
  let cloudWatchLogGroupName: string;
  let internetGatewayId: string;
  let natGatewayId: string;
  let environmentSuffix: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; 
    const stackOutputs = outputs[stackKey];

    // Extract environment suffix from stack key (e.g., "TapStackpr3225" -> "pr3225")
    environmentSuffix = stackKey.replace("TapStack", "").toLowerCase();

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = JSON.parse(stackOutputs["public-subnet-ids"]);
    privateSubnetIds = JSON.parse(stackOutputs["private-subnet-ids"]);
    autoScalingGroupName = stackOutputs["auto-scaling-group-name"];
    albSecurityGroupId = stackOutputs["public-security-group-id"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];
    loadBalancerDnsName = stackOutputs["alb-dns-name"];
    albZoneId = stackOutputs["alb-zone-id"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsInstanceId = stackOutputs["rds-instance-id"];
    s3BucketName = stackOutputs["s3-logs-bucket-name"];
    cloudWatchLogGroupName = stackOutputs["cloudwatch-log-group-name"];
    internetGatewayId = stackOutputs["internet-gateway-id"];
    natGatewayId = stackOutputs["nat-gateway-id"];

    if (!vpcId || !autoScalingGroupName || !s3BucketName || !rdsEndpoint || !loadBalancerDnsName) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists with correct configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.State).toBe("available");
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      
      // Check tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === "Name");
      expect(nameTag?.Value).toBe(`tap-${environmentSuffix}-vpc`);
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === environmentSuffix)).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform")).toBe(true);
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );
      
      expect(InternetGateways?.length).toBe(1);
      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
    }, 20000);

    test("NAT Gateway is configured correctly", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );
      
      expect(NatGateways?.length).toBe(1);
      const natGw = NatGateways?.[0];
      expect(natGw?.State).toBe("available");
      expect(natGw?.VpcId).toBe(vpcId);
      expect(publicSubnetIds).toContain(natGw?.SubnetId);
    }, 20000);

    test("Subnets are correctly configured", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ 
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );
      
      expect(Subnets?.length).toBe(4);
      
      const publicSubnets = Subnets?.filter(subnet => 
        publicSubnetIds.includes(subnet.SubnetId!)
      );
      const privateSubnets = Subnets?.filter(subnet => 
        privateSubnetIds.includes(subnet.SubnetId!)
      );
      
      // Check public subnets configuration
      publicSubnets?.forEach(subnet => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.State).toBe("available");
      });
      
      // Check private subnets configuration
      privateSubnets?.forEach(subnet => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.MapPublicIpOnLaunch).toBe(false);
        expect(subnet?.State).toBe("available");
      });
    }, 20000);
  });

  describe("Security Groups", () => {
    test("ALB security group allows HTTP/HTTPS from anywhere", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [albSecurityGroupId] })
      );

      const albSg = SecurityGroups?.[0];
      expect(albSg).toBeDefined();
      expect(albSg?.VpcId).toBe(vpcId);
      expect(albSg?.GroupName).toBe(`tap-${environmentSuffix}-alb-sg`);

      const httpRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

      const httpsRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
    }, 20000);

    test("RDS security group allows traffic only from EC2", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
      );
      
      const rdsSg = SecurityGroups?.[0];
      expect(rdsSg?.GroupName).toBe(`tap-${environmentSuffix}-rds-sg`);
      
      const mysqlRule = rdsSg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("RDS Database", () => {
    test("RDS instance exists with correct configuration", async () => {
      const rdsIdentifier = `tap-${environmentSuffix}-database`;
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      expect(DBInstances?.length).toBe(1);

      const db = DBInstances?.[0];
      expect(db?.DBInstanceIdentifier).toBe(rdsIdentifier);
      expect(db?.DBInstanceStatus).toBe("available");
      expect(db?.Engine).toBe("mysql");
      expect(db?.DBInstanceClass).toBe("db.t3.micro");
      expect(db?.AllocatedStorage).toBe(20);
      expect(db?.StorageType).toBe("gp3");
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.BackupRetentionPeriod).toBe(7);
      expect(db?.PubliclyAccessible).toBe(false);
      expect(db?.MultiAZ).toBe(false);
      expect(db?.DBName).toBe("tapdb");
      expect(db?.MasterUsername).toBe("dbadmin");
      expect(db?.Endpoint?.Port).toBe(3306);
      expect(db?.MonitoringInterval).toBe(0);
    }, 30000);

    test("RDS subnet group is correctly configured", async () => {
      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: `tap-${environmentSuffix}-db-subnet-group` })
      );
      
      expect(DBSubnetGroups?.length).toBe(1);
      const subnetGroup = DBSubnetGroups?.[0];
      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  describe("Application Load Balancer", () => {
    test("ALB is properly configured", async () => {
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find(lb => lb.DNSName === loadBalancerDnsName);
      
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.Type).toBe("application");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.VpcId).toBe(vpcId);
      expect(alb?.SecurityGroups).toContain(albSecurityGroupId);
      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    }, 20000);

    test("ALB has listener configured on port 80", async () => {
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = LoadBalancers?.find(lb => lb.DNSName === loadBalancerDnsName);
      
      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: alb?.LoadBalancerArn })
      );
      
      expect(Listeners?.length).toBeGreaterThan(0);
      const httpListener = Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe("HTTP");
      expect(httpListener?.DefaultActions?.[0]?.Type).toBe("forward");
    }, 20000);

    test("Target group exists and is configured correctly", async () => {
      const { TargetGroups } = await elbv2Client.send(new DescribeTargetGroupsCommand({}));
      const targetGroup = TargetGroups?.find(tg => tg.TargetGroupName?.includes(`tap-${environmentSuffix}`));
      
      expect(targetGroup).toBeDefined();
      expect(targetGroup?.Protocol).toBe("HTTP");
      expect(targetGroup?.Port).toBe(80);
      expect(targetGroup?.TargetType).toBe("instance");
      expect(targetGroup?.VpcId).toBe(vpcId);
      expect(targetGroup?.HealthCheckEnabled).toBe(true);
      expect(targetGroup?.HealthCheckPath).toBeDefined();
      expect(targetGroup?.HealthCheckProtocol).toBe("HTTP");
    }, 20000);
  });

  describe("Auto Scaling Group", () => {
    test("ASG exists with correct configuration", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      expect(AutoScalingGroups?.length).toBe(1);
      const asg = AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(autoScalingGroupName);
      expect(asg?.MinSize).toBe(1);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(1);
      expect(asg?.VPCZoneIdentifier).toBeDefined();
      expect(asg?.HealthCheckType).toBe("EC2");
      expect(asg?.DefaultCooldown).toBe(60);
    }, 20000);

    test("ASG has instances running", async () => {
      await ensureASGCapacity(autoScalingGroupName, 1);
      const instanceIds = await waitForASGInstances(autoScalingGroupName, 1, 120000);
      expect(instanceIds.length).toBeGreaterThanOrEqual(1);
      console.log(`✓ ASG has ${instanceIds.length} instances: ${instanceIds.join(", ")}`);
    }, 180000);
  });

  describe("S3 Bucket", () => {
    test("S3 bucket exists with proper versioning and access controls", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));
      
      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
      
      // Check public access block
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("EC2 instances have IAM instance profile attached", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const instanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId || "") || [];
      if (instanceIds.length > 0) {
        const { Reservations } = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: instanceIds })
        );
        
        const instances = Reservations?.flatMap(r => r.Instances || []);
        instances?.forEach(instance => {
          expect(instance?.IamInstanceProfile?.Arn).toContain(`tap-${environmentSuffix}-ec2-instance-profile`);
        });
      }
    }, 30000);
  });

  describe("CloudWatch Logs", () => {
    test("CloudWatch log group exists and is configured", async () => {
      const { logGroups } = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: cloudWatchLogGroupName })
      );
      
      const logGroup = logGroups?.find(lg => lg.logGroupName === cloudWatchLogGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    }, 20000);
  });

  describe(" EC2 → CloudWatch Logs", () => {
    test("EC2 instances can write to CloudWatch Logs via IAM role", async () => {
      // Get IAM role for EC2
      const roleName = `tap-${environmentSuffix}-ec2-role`;
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      
      expect(Role?.RoleName).toBe(roleName);
      
      // Verify instance profile exists
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: `tap-${environmentSuffix}-ec2-instance-profile` })
      );
      
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe(roleName);
      
      // Check if the role has CloudWatch Logs permissions
      const hasCloudWatchLogsPermissions = await checkRoleHasCloudWatchLogsPermissions(roleName);
      expect(hasCloudWatchLogsPermissions).toBe(true);
    }, 30000);
  });

  describe("Interactive Tests: VPC → Internet Connectivity", () => {
    test("Public subnets have routes to Internet Gateway", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "tag:Name", Values: [`tap-${environmentSuffix}-public-route-table`] }
          ]
        })
      );
      
      const publicRouteTable = RouteTables?.[0];
      expect(publicRouteTable).toBeDefined();
      
      const igwRoute = publicRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId === internetGatewayId
      );
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.State).toBe("active");
    }, 20000);

    test("Private subnets have routes to NAT Gateway", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "tag:Name", Values: [`tap-${environmentSuffix}-private-route-table`] }
          ]
        })
      );
      
      const privateRouteTable = RouteTables?.[0];
      expect(privateRouteTable).toBeDefined();
      
      const natRoute = privateRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId === natGatewayId
      );
      expect(natRoute).toBeDefined();
      expect(natRoute?.State).toBe("active");
    }, 20000);
  });

  describe("Interactive Tests: RDS → Security Group Integration", () => {
    test("RDS is only accessible from EC2 security group", async () => {
      // Get EC2 security group from ASG instances
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const instanceIds = AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId || "") || [];
      if (instanceIds.length > 0) {
        const { Reservations } = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: instanceIds })
        );
        
        const instance = Reservations?.[0]?.Instances?.[0];
        const ec2SecurityGroupId = instance?.SecurityGroups?.[0]?.GroupId;
        
        // Verify RDS security group has ingress rule from EC2
        const { SecurityGroups } = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
        );
        
        const rdsSg = SecurityGroups?.[0];
        const mysqlRule = rdsSg?.IpPermissions?.find(rule => 
          rule.FromPort === 3306 && 
          rule.ToPort === 3306 &&
          rule.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)
        );
        
        expect(mysqlRule).toBeDefined();
      }
    }, 30000);
  });

  describe("Interactive Tests: ASG → Launch Template Updates", () => {
    test("ASG uses latest launch template version", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      const asg = AutoScalingGroups?.[0];
      expect(asg?.LaunchTemplate?.LaunchTemplateId).toBeDefined();
      expect(asg?.LaunchTemplate?.Version).toBe("$Latest");
    }, 20000);

    test("ASG can scale instances up and down", async () => {
      // Get current capacity
      const { AutoScalingGroups: asgsBefore } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      const originalCapacity = asgsBefore?.[0]?.DesiredCapacity || 1;
      
      // Test scaling up (within limits)
      const newCapacity = Math.min(originalCapacity + 1, 6);
      await autoScalingClient.send(new SetDesiredCapacityCommand({
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: newCapacity,
      }));
      
      // Wait for the change to take effect
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { AutoScalingGroups: asgsAfter } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      
      expect(asgsAfter?.[0]?.DesiredCapacity).toBe(newCapacity);
      
      // Scale back to original
      await autoScalingClient.send(new SetDesiredCapacityCommand({
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: originalCapacity,
      }));
    }, 40000);
  });

  describe("Interactive Tests: CloudWatch Monitoring", () => {
    test("CloudWatch alarms are configured for the infrastructure", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ 
          AlarmNamePrefix: `tap-${environmentSuffix}` 
        })
      );
      
      // Should have at least CPU alarms and ALB alarms
      expect(MetricAlarms?.length).toBeGreaterThanOrEqual(4);
      
      const highCpuAlarm = MetricAlarms?.find(a => a.AlarmName === `tap-${environmentSuffix}-high-cpu`);
      const lowCpuAlarm = MetricAlarms?.find(a => a.AlarmName === `tap-${environmentSuffix}-low-cpu`);
      const responseTimeAlarm = MetricAlarms?.find(a => a.AlarmName === `tap-${environmentSuffix}-alb-response-time`);
      const unhealthyHostsAlarm = MetricAlarms?.find(a => a.AlarmName === `tap-${environmentSuffix}-unhealthy-hosts`);
      
      expect(highCpuAlarm).toBeDefined();
      expect(lowCpuAlarm).toBeDefined();
      expect(responseTimeAlarm).toBeDefined();
      expect(unhealthyHostsAlarm).toBeDefined();
      
      // Verify alarm configurations
      expect(highCpuAlarm?.MetricName).toBe("CPUUtilization");
      expect(highCpuAlarm?.Threshold).toBe(80);
      expect(lowCpuAlarm?.MetricName).toBe("CPUUtilization");
      expect(lowCpuAlarm?.Threshold).toBe(10);
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("All resources have required standard tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === environmentSuffix)).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Owner" && tag.Value === "infrastructure-team")).toBe(true);
      
      // Check ASG tags
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      const asg = AutoScalingGroups?.[0];
      expect(asg?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap")).toBe(true);
      expect(asg?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform")).toBe(true);
    }, 20000);

    test("Database is encrypted and has automated backups", async () => {
      const rdsIdentifier = `tap-${environmentSuffix}-database`;
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      
      const db = DBInstances?.[0];
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(db?.PreferredBackupWindow).toBe("03:00-04:00");
      expect(db?.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
      expect(db?.AutoMinorVersionUpgrade).toBe(true);
      expect(db?.CopyTagsToSnapshot).toBe(true);
    }, 20000);

    test("RDS uses AWS-managed master user password", async () => {
      const rdsIdentifier = `tap-${environmentSuffix}-database`;
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier })
      );
      
      const db = DBInstances?.[0];
      expect(db?.MasterUserSecret?.SecretArn).toBeDefined();
      expect(db?.MasterUserSecret?.SecretStatus).toBe("active");
    }, 20000);
  });
});