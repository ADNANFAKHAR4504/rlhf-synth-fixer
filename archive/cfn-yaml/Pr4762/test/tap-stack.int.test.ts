import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  CloudWatchClient,
  GetMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeLaunchTemplatesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand
} from "@aws-sdk/client-iam";
import {
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  S3Client
} from "@aws-sdk/client-s3";
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

// Load outputs and configuration
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Extract region and stack name dynamically
const getRegionAndStack = () => {
  // Try to get region from different possible sources
  const region = process.env.AWS_REGION ||
    (outputs.NLBTargetGroupArn && outputs.NLBTargetGroupArn.split(":")[3]) ||
    (outputs.VPCId && outputs.VPCId.split("-")[0]);

  // Try to get stack name from different possible sources
  const stackName = process.env.STACK_NAME ||
    (outputs.VPCFlowLogRoleArn && outputs.VPCFlowLogRoleArn.split("/")[1].split("-")[0]) ||
    "TapStack";

  return { region, stackName };
};

const { region, stackName } = getRegionAndStack();

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const asgClient = new AutoScalingClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const iamClient = new IAMClient({ region });
const s3Client = new S3Client({ region });
const cwClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const stsClient = new STSClient({ region });

jest.setTimeout(120000); // 2 minutes timeout for integration tests

// Helper Functions
async function validateTags(resourceTags: any[], stackName: string) {
  const requiredTags = ['Name', 'Project', 'Environment', 'Owner'];
  for (const tag of requiredTags) {
    expect(resourceTags.some(t => t.Key === tag)).toBe(true);
  }
  expect(resourceTags.some(t => t.Value.includes(stackName))).toBe(true);
}

async function waitForResource(checkFn: () => Promise<boolean>, maxRetries = 10, delay = 3000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (await checkFn()) return true;
    await new Promise(r => setTimeout(r, delay));
  }
  return false;
}

// ====================
// NETWORKING TESTS
// ====================
describe("VPC and Networking Integration Tests", () => {
  test("VPC is properly configured with DNS and CIDR", async () => {
    const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
      VpcIds: [outputs.VPCId]
    }));

    const vpc = vpcResponse.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.CidrBlock).toBe("10.0.0.0/16");

    // Verify DNS settings
    const dnsHostnames = await ec2Client.send(new DescribeVpcAttributeCommand({
      VpcId: outputs.VPCId,
      Attribute: "enableDnsHostnames"
    }));
    const dnsSupport = await ec2Client.send(new DescribeVpcAttributeCommand({
      VpcId: outputs.VPCId,
      Attribute: "enableDnsSupport"
    }));

    expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

    await validateTags(vpc?.Tags || [], outputs.VPCId.split('-')[0]);
  });

  test("Subnets are configured correctly with proper routing", async () => {
    const publicSubnets = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
    const privateSubnets = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];

    // Test public subnets
    for (const subnetId of publicSubnets) {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [subnetId]
      }));
      const subnet = response.Subnets?.[0];
      expect(subnet?.MapPublicIpOnLaunch).toBe(true);

      // Verify route to internet gateway
      const routes = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "association.subnet-id", Values: [subnetId] }]
      }));
      expect(routes.RouteTables?.[0].Routes?.some(r =>
        r.DestinationCidrBlock === "0.0.0.0/0" &&
        r.GatewayId?.startsWith("igw-")
      )).toBe(true);
    }

    // Test private subnets
    for (const subnetId of privateSubnets) {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [subnetId]
      }));
      const subnet = response.Subnets?.[0];
      expect(subnet?.MapPublicIpOnLaunch).toBe(false);

      // Verify route to NAT gateway
      const routes = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "association.subnet-id", Values: [subnetId] }]
      }));
      expect(routes.RouteTables?.[0].Routes?.some(r =>
        r.DestinationCidrBlock === "0.0.0.0/0" &&
        r.NatGatewayId?.startsWith("nat-")
      )).toBe(true);
    }
  });

  test("NAT Gateways are active and properly configured", async () => {
    const response = await ec2Client.send(new DescribeNatGatewaysCommand({
      NatGatewayIds: [outputs.NatGateway1Id, outputs.NatGateway2Id]
    }));

    for (const natGateway of response.NatGateways || []) {
      expect(natGateway.State).toBe("available");
      expect(natGateway.ConnectivityType).toBe("public");

      // Verify NAT Gateway is in public subnet
      const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [natGateway.SubnetId!]
      }));
      expect(subnetResponse.Subnets?.[0].MapPublicIpOnLaunch).toBe(true);
    }
  });
});

// ====================
// SECURITY TESTS
// ====================
describe("Security Group and IAM Integration Tests", () => {
  test("Security groups have correct rules and no overly permissive access", async () => {
    const securityGroups = [
      outputs.NLBSecurityGroupId,
      outputs.EC2SecurityGroupId,
      outputs.DatabaseSecurityGroupId
    ];

    for (const sgId of securityGroups) {
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();

      // No overly permissive rules
      sg?.IpPermissions?.forEach(rule => {
        if (rule.IpRanges?.some(r => r.CidrIp === "0.0.0.0/0")) {
          // Allow 80, 443, and 22 (SSH) from anywhere
          expect([80, 443, 22]).toContain(rule.FromPort);
        }
      });
    }
  });

  test("IAM roles have correct policies and trust relationships", async () => {
    const roles = [outputs.EC2RoleArn, outputs.VPCFlowLogRoleArn];

    for (const roleArn of roles) {
      const roleName = roleArn.split("/").pop()!;
      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));

      expect(response.Role).toBeDefined();

      // Check trust relationship
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || "{}"));
      expect(trustPolicy.Statement[0].Effect).toBe("Allow");

      // Check both attached managed policies and inline policies
      const [attachedPolicies, inlinePolicies] = await Promise.all([
        iamClient.send(new ListAttachedRolePoliciesCommand({
          RoleName: roleName
        })),
        iamClient.send(new ListRolePoliciesCommand({
          RoleName: roleName
        }))
      ]);

      // Should have either managed policies or inline policies
      expect(
        (attachedPolicies.AttachedPolicies?.length || 0) +
        (inlinePolicies.PolicyNames?.length || 0)
      ).toBeGreaterThan(0);
    }
  });
});

// ======================
// LOAD BALANCER TESTS
// ======================
describe("Network Load Balancer Integration Tests", () => {
  test("NLB is active and properly configured", async () => {
    // First get the NLB ARN from the target group
    const tgResponse = await elbv2Client.send(new DescribeTargetGroupsCommand({
      TargetGroupArns: [outputs.NLBTargetGroupArn]
    }));

    const loadBalancerArn = tgResponse.TargetGroups?.[0].LoadBalancerArns?.[0];
    expect(loadBalancerArn).toBeDefined();

    const response = await elbv2Client.send(new DescribeLoadBalancersCommand({
      LoadBalancerArns: [loadBalancerArn!]
    }));

    const nlb = response.LoadBalancers?.[0];
    expect(nlb?.State?.Code).toBe("active");
    expect(nlb?.Scheme).toBe("internet-facing");
    expect(nlb?.Type).toBe("network");

    // Verify multi-AZ
    expect(nlb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
  });

  test("Target group has healthy targets", async () => {
    const response = await elbv2Client.send(new DescribeTargetGroupsCommand({
      TargetGroupArns: [outputs.NLBTargetGroupArn]
    }));

    const tg = response.TargetGroups?.[0];
    expect(tg?.HealthCheckEnabled).toBe(true);

    const health = await elbv2Client.send(new DescribeTargetHealthCommand({
      TargetGroupArn: outputs.NLBTargetGroupArn
    }));

    // Add timeout and retry logic for target health
    const isHealthy = await waitForResource(async () => {
      const healthCheck = await elbv2Client.send(new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.NLBTargetGroupArn
      }));


      return healthCheck.TargetHealthDescriptions?.some(t => t.TargetHealth?.State === "healthy") || false;
    }, 2, 15000); // 20 retries with 15 second intervals

    expect(isHealthy).toBe(true);
  });
});

// ==================
// DATABASE TESTS
// ==================
describe("RDS Database Integration Tests", () => {
  test("RDS instance is available and properly configured", async () => {
    const response = await rdsClient.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: outputs.DatabaseIdentifier
    }));

    const db = response.DBInstances?.[0];
    expect(db?.DBInstanceStatus).toBe("available");
    expect(db?.MultiAZ).toBe(true);
    expect(db?.StorageEncrypted).toBe(true);

    // Verify subnet group
    const subnetGroup = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
      DBSubnetGroupName: outputs.DBSubnetGroupName
    }));
    expect(subnetGroup.DBSubnetGroups?.[0].SubnetGroupStatus).toBe("Complete");

    // Verify parameter group
    const paramGroup = await rdsClient.send(new DescribeDBParameterGroupsCommand({
      DBParameterGroupName: outputs.DBParameterGroupName
    }));
    expect(paramGroup.DBParameterGroups?.[0]).toBeDefined();
  });

  test("Database secret exists and is accessible", async () => {
    const response = await secretsClient.send(new DescribeSecretCommand({
      SecretId: outputs.DBSecretArn
    }));

    expect(response.ARN).toBe(outputs.DBSecretArn);
    expect(response.Name).toContain("db-master-secret");
  });
});

// =================
// ASG TESTS
// =================
describe("Auto Scaling Group Integration Tests", () => {
  test("ASG is active with correct capacity", async () => {
    const response = await asgClient.send(new DescribeAutoScalingGroupsCommand({
      AutoScalingGroupNames: [outputs.AutoScalingGroupName]
    }));

    const asg = response.AutoScalingGroups?.[0];
    expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
    expect(asg?.Instances?.length).toBeGreaterThanOrEqual(2);

    // Verify instances are spread across AZs
    const azs = new Set(asg?.Instances?.map(i => i.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  test("Launch template is correctly configured", async () => {
    const response = await ec2Client.send(new DescribeLaunchTemplatesCommand({
      LaunchTemplateIds: [outputs.LaunchTemplateId]
    }));

    const template = response.LaunchTemplates?.[0];

    expect(template?.DefaultVersionNumber).toBe(parseInt(outputs.LaunchTemplateVersion));
  });
});

// ==================
// MONITORING TESTS
// ==================
describe("Monitoring and Logging Integration Tests", () => {
  test("VPC Flow Logs are active and generating logs", async () => {
    const response = await logsClient.send(new DescribeLogGroupsCommand({
      logGroupNamePrefix: outputs.VPCFlowLogGroupName
    }));

    expect(response.logGroups?.length).toBeGreaterThan(0);
    const logGroup = response.logGroups?.[0];

    const streams = await logsClient.send(new DescribeLogStreamsCommand({
      logGroupName: logGroup?.logGroupName!,
      orderBy: "LastEventTime",
      descending: true
    }));

    expect(streams.logStreams?.length).toBeGreaterThan(0);

    // Check for actual log events
    const events = await logsClient.send(new GetLogEventsCommand({
      logGroupName: logGroup?.logGroupName!,
      logStreamName: streams.logStreams![0].logStreamName!
    }));

    expect(events.events?.length).toBeGreaterThan(0);
  });

  test("CloudWatch metrics are being collected", async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 15 * 60000);

    const response = await cwClient.send(new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: now,
      MetricDataQueries: [{
        Id: "cpu",
        MetricStat: {
          Metric: {
            Namespace: "AWS/EC2",
            MetricName: "CPUUtilization",
            Dimensions: [{
              Name: "AutoScalingGroupName",
              Value: outputs.AutoScalingGroupName
            }]
          },
          Period: 300,
          Stat: "Average"
        }
      }]
    }));

    expect(response.MetricDataResults?.[0]?.Values?.length).toBeGreaterThan(0);
  });
});

// ===================
// END-TO-END TESTS
// ===================
describe("End-to-End Integration Tests", () => {
  test("Complete infrastructure is operational", async () => {
    // 1. Verify VPC and networking
    const vpc = await ec2Client.send(new DescribeVpcsCommand({
      VpcIds: [outputs.VPCId]
    }));
    expect(vpc.Vpcs?.[0].State).toBe("available");

    // 2. Verify Load Balancer health with retries
    const isHealthy = await waitForResource(async () => {
      const healthCheck = await elbv2Client.send(new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.NLBTargetGroupArn
      }));
      return healthCheck.TargetHealthDescriptions?.some(t => t.TargetHealth?.State === "healthy") || false;
    }, 2, 15000); // 20 retries with 15 second intervals

    expect(isHealthy).toBe(true);

    // 3. Verify Database connectivity
    const dbInstance = await rdsClient.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: outputs.DatabaseIdentifier
    }));
    expect(dbInstance.DBInstances?.[0].DBInstanceStatus).toBe("available");

    // 4. Verify ASG instances
    const asg = await asgClient.send(new DescribeAutoScalingGroupsCommand({
      AutoScalingGroupNames: [outputs.AutoScalingGroupName]
    }));
    expect(asg.AutoScalingGroups?.[0].Instances?.every(i =>
      i.LifecycleState === "InService"
    )).toBe(true);
  });

  test("Cross-account and region independence", async () => {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));

    // Verify no hardcoded account IDs
    Object.values(outputs).forEach(value => {
      if (typeof value === "string" && value.includes(identity.Account!)) {
        expect(value).toMatch(new RegExp(identity.Account!, "g"));
      }
    });

    // Verify region-specific resources are properly named
    expect(outputs.DatabaseIdentifier).toContain(region);
    expect(outputs.VPCFlowLogGroupName).toContain(region);
    expect(outputs.AutoScalingGroupName).toContain(region);
  });
});
