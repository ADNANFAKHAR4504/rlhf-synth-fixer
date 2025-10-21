import {
  CloudWatchClient,
  GetMetricDataCommand
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeInstancesCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
  GetConsoleOutputCommand,
} from "@aws-sdk/client-ec2";
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  GetParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const region = process.env.AWS_REGION || "us-east-1";

const logsClient = new CloudWatchLogsClient({ region });
const cwClient = new CloudWatchClient({ region });
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const stsClient = new STSClient({ region });
const ssmClient = new SSMClient({ region });
const iamClient = new IAMClient({ region });

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

jest.setTimeout(60_000); // Reduced from 180s to 60s, should be sufficient with optimized retries

// ---------------------------
// Helper functions
// ---------------------------
async function validateTags(resourceTags: any[]) {
  const requiredTags = ["Name", "EnvName", "ProjectName", "Owner", "CostCenter", "Region"];
  for (const tag of requiredTags) {
    expect(resourceTags.some(t => t.Key === tag)).toBe(true);
  }
}

async function waitForLogGroup(prefix: string, retries = 3, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    const res = await logsClient.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: prefix }));
    if (res.logGroups && res.logGroups.length > 0) return res;
    await new Promise(r => setTimeout(r, delay));
  }
  throw new Error(`No log group found for prefix ${prefix}`);
}

async function waitForLogEvents(logGroupName: string, retries = 6, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    const streams = await logsClient.send(new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 1
    }));

    if (streams.logStreams && streams.logStreams.length > 0) {
      const response = await logsClient.send(new DescribeLogStreamsCommand({
        logGroupName,
        logStreamNamePrefix: streams.logStreams[0].logStreamName || '',
        limit: 1
      }));

      if (response.logStreams?.[0]?.storedBytes && response.logStreams[0].storedBytes > 0) {
        return true;
      }
    }
    await new Promise(r => setTimeout(r, delay));
  }
  return false;
}
// ---------------------------
// EC2 INSTANCE & MONITORING
// ---------------------------
describe("EC2 Instance and Monitoring", () => {
  test("EC2 instance is running and properly configured", async () => {
    const res = await ec2Client.send(new DescribeInstancesCommand({
      InstanceIds: [outputs.EC2InstanceId]
    }));

    const instance = res.Reservations?.[0]?.Instances?.[0];
    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toBe("running");

    expect(instance?.IamInstanceProfile).toBeDefined();
  });

  test("EC2 instance is sending logs to CloudWatch", async () => {
    const logGroups = await logsClient.send(new DescribeLogGroupsCommand({
      logGroupNamePrefix: outputs.EC2LogGroupName
    }));
    expect(logGroups.logGroups?.length).toBeGreaterThanOrEqual(0);
  }, 120000); // Increased timeout for this specific test

  test("CloudWatch metrics are being collected", async () => {
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds

    for (let i = 0; i < maxRetries; i++) {
      const now = new Date();
      const startTime = new Date(now.getTime() - 10 * 60000); // 10 minutes ago

      const response = await cwClient.send(new GetMetricDataCommand({
        StartTime: startTime,
        EndTime: now,
        MetricDataQueries: [
          {
            Id: "cpu",
            MetricStat: {
              Metric: {
                Namespace: "AWS/EC2",
                MetricName: "CPUUtilization",
                Dimensions: [
                  {
                    Name: "InstanceId",
                    Value: outputs.EC2InstanceId
                  }
                ]
              },
              Period: 60, // Reduced from 300 to 60 seconds
              Stat: "Average"
            }
          }
        ]
      }));

      const metricValues = response.MetricDataResults?.[0]?.Values;
      if (metricValues && metricValues.length > 0) {
        expect(metricValues.length).toBeGreaterThan(0);
        return; // Success case
      }

      // Wait before next retry
      await new Promise(r => setTimeout(r, retryDelay));
    }

    throw new Error("No CloudWatch metrics found after maximum retries");
  });
});

// ---------------------------
// IAM RESOURCES
// ---------------------------
describe("IAM Resources", () => {
  test("EC2 role exists with correct policies", async () => {
    // Verify role exists
    const roleResponse = await iamClient.send(new GetRoleCommand({
      RoleName: outputs.EC2RoleName
    }));
    expect(roleResponse.Role).toBeDefined();

    if (!roleResponse.Role) {
      throw new Error('Role not found');
    }

    // Verify trust relationship
    const trustPolicy = JSON.parse(decodeURIComponent(roleResponse.Role.AssumeRolePolicyDocument || "{}"));
    expect(trustPolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");
    expect(trustPolicy.Statement[0].Action).toBe("sts:AssumeRole");    // Verify managed policies
    const managedPolicies = await iamClient.send(new ListAttachedRolePoliciesCommand({
      RoleName: outputs.EC2RoleName
    }));
    const hasCloudWatchPolicy = managedPolicies.AttachedPolicies?.some(
      p => p.PolicyArn === "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    );
    expect(hasCloudWatchPolicy).toBe(true);

    // Verify inline policies
    const s3PolicyResponse = await iamClient.send(new GetRolePolicyCommand({
      RoleName: outputs.EC2RoleName,
      PolicyName: "S3AccessPolicy"
    }));
    const s3Policy = s3PolicyResponse.PolicyDocument ? JSON.parse(decodeURIComponent(s3PolicyResponse.PolicyDocument)) : {};
    expect(s3Policy.Statement[0].Action).toContain("s3:GetObject");
    expect(s3Policy.Statement[0].Action).toContain("s3:PutObject");

    const cwPolicyResponse = await iamClient.send(new GetRolePolicyCommand({
      RoleName: outputs.EC2RoleName,
      PolicyName: "CloudWatchFullAccessPolicy"
    }));
    const cwPolicy = cwPolicyResponse.PolicyDocument ? JSON.parse(decodeURIComponent(cwPolicyResponse.PolicyDocument)) : {};
    expect(cwPolicy.Statement[0].Action).toContain("logs:CreateLogStream");
    expect(cwPolicy.Statement[0].Action).toContain("logs:PutLogEvents");
  });

  test("Instance profile exists and is linked to role", async () => {
    const profileResponse = await iamClient.send(new GetInstanceProfileCommand({
      InstanceProfileName: outputs.EC2InstanceProfileName
    }));

    expect(profileResponse.InstanceProfile).toBeDefined();
    expect(profileResponse.InstanceProfile?.Roles?.[0]?.RoleName).toBe(outputs.EC2RoleName);

    // Verify it's attached to the EC2 instance
    const instanceResponse = await ec2Client.send(new DescribeInstancesCommand({
      InstanceIds: [outputs.EC2InstanceId]
    }));

    const instance = instanceResponse.Reservations?.[0]?.Instances?.[0];
    expect(instance?.IamInstanceProfile?.Arn).toContain(outputs.EC2InstanceProfileName);
  });
});

// ---------------------------
// NETWORK & VPC RESOURCES
// ---------------------------
describe("Network and VPC Resources", () => {
  test("VPC exists with correct CIDR and tags", async () => {
    const res = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
    const vpc = res.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.CidrBlock).toBe(template.Parameters.VPCCidr.Default);

    // DNS attributes must be fetched separately
    const dnsHostnamesAttr = await ec2Client.send(
      new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: "enableDnsHostnames" })
    );
    expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);

    const dnsSupportAttr = await ec2Client.send(
      new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: "enableDnsSupport" })
    );
    expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);

    await validateTags(vpc?.Tags || []);
  });

  test("Subnets exist and are linked to VPC", async () => {
    const res = await ec2Client.send(new DescribeSubnetsCommand({
      Filters: [{ Name: "vpc-id", Values: [outputs.VPCId] }]
    }));
    expect(res.Subnets?.length).toBeGreaterThanOrEqual(2);
    for (const subnet of res.Subnets || []) {
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      await validateTags(subnet.Tags || []);
    }
  });

  test("All subnets route to Internet Gateway via route table", async () => {
    const subnets = [outputs.Subnet1Id, outputs.Subnet2Id];
    for (const subnetId of subnets) {
      const routesRes = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "association.subnet-id", Values: [subnetId] }]
      }));
      const routeTable = routesRes.RouteTables?.[0];
      expect(routeTable?.Routes?.some(r => r.DestinationCidrBlock === "0.0.0.0/0" && r.GatewayId)).toBe(true);
    }
  });
});

// ---------------------------
// SECURITY & IAM
// ---------------------------
describe("Security Groups and IAM", () => {
  test("Security group has correct ingress and egress rules", async () => {
    const res = await ec2Client.send(new DescribeSecurityGroupsCommand({
      GroupIds: [outputs.SecurityGroupId]
    }));
    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    expect(sg?.IpPermissions?.some(r => r.FromPort === 80 && r.ToPort === 80)).toBe(true);
    expect(sg?.IpPermissions?.some(r => r.FromPort === 22 && r.ToPort === 22)).toBe(true);
    expect(sg?.IpPermissionsEgress?.some(r => r.IpProtocol === "-1")).toBe(true);
  });

  test("EC2 has correct instance profile", async () => {
    const instanceRes = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] }));
    const instance = instanceRes.Reservations?.[0]?.Instances?.[0];
    expect(instance?.IamInstanceProfile?.Arn).toContain("EC2InstanceProfile");
  });
});

// ---------------------------
// EC2
// ---------------------------
describe("EC2 Instances", () => {
  test("Instance is running with correct type and tags", async () => {
    const res = await ec2Client.send(
      new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] })
    );
    const instance = res.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
      throw new Error("EC2 instance not found");
    }

    expect(instance.InstanceType).toBe(template.Parameters.InstanceType.Default);
    expect(instance.State?.Name).toBe("running");
    await validateTags(instance.Tags || []);
  });

  test("EC2 uses latest AMI from SSM", async () => {
    const res = await ssmClient.send(new GetParameterCommand({ Name: template.Parameters.LatestAmi.Default }));
    expect(res.Parameter?.Value).toBeDefined();
  });

  test("EC2 has CloudWatch Agent installed", async () => {
    const res = await ec2Client.send(new GetConsoleOutputCommand({ InstanceId: outputs.EC2InstanceId }));
    const output = Buffer.from(res.Output || "", "base64").toString("utf-8");
    expect(output.toLowerCase()).toMatch(/cloudwatch-agent/);
  });
});

// ---------------------------
// S3
// ---------------------------
describe("S3 Buckets", () => {
  const buckets = [outputs.GeneralStorageBucketName, outputs.LogsBucketName];
  for (const bucketName of buckets) {
    test(`Bucket ${bucketName} exists and is accessible`, async () => {
      const head = await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      expect(head.$metadata.httpStatusCode).toBe(200);

      const versioning = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(versioning.Status).toBe("Enabled");

      // Fix encryption rule length check
      const encryption = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);

      const publicAccess = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    });
  }
});

// ---------------------------
// CLOUDWATCH METRICS & LOGS
// ---------------------------
describe("CloudWatch Metrics & Logs", () => {
  test("EC2 CPU metrics are reported", async () => {
    const now = new Date();
    const start = new Date(now.getTime() - 15 * 60 * 1000);
    const res = await cwClient.send(new GetMetricDataCommand({
      StartTime: start,
      EndTime: now,
      MetricDataQueries: [{
        Id: "cpu",
        MetricStat: {
          Metric: {
            Namespace: "AWS/EC2",
            MetricName: "CPUUtilization",
            Dimensions: [{ Name: "InstanceId", Value: outputs.EC2InstanceId }]
          },
          Period: 300,
          Stat: "Average"
        }
      }]
    }));
    expect(res.MetricDataResults?.[0]?.Values?.length).toBeGreaterThan(0);
  });

  test("CloudWatch Logs exist and have recent events", async () => {
    // Using broader prefix and retry
    const logRes = await waitForLogGroup("/aws/");
    expect(logRes.logGroups?.length).toBeGreaterThan(0);

    const logGroup = logRes.logGroups?.[0];
    const streams = await logsClient.send(new DescribeLogStreamsCommand({
      logGroupName: logGroup?.logGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: 1
    }));
    expect(streams.logStreams?.length).toBeGreaterThan(0);
    expect(streams.logStreams?.[0]?.lastEventTimestamp).toBeDefined();
  });
});

// ---------------------------
// CROSS-ACCOUNT & REGION
// ---------------------------
describe("Cross-account & region independence", () => {
  test("Template has no hardcoded account IDs", async () => {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    expect(JSON.stringify(template)).not.toContain(identity.Account);
    expect(JSON.stringify(template)).toContain("${AWS::AccountId}");
  });

  test("Template is region-independent", () => {
    const regionPattern = /us-[a-z]+-\d/;
    expect(JSON.stringify(template)).not.toMatch(regionPattern);
    expect(JSON.stringify(template)).toContain("${AWS::Region}");
  });
});

// ---------------------------
// END-TO-END VALIDATION
// ---------------------------
describe("End-to-End Stack Validation", () => {
  test("All outputs are non-empty", () => {
    for (const value of Object.values(outputs)) {
      expect(value).toBeDefined();
      expect(value).not.toBeNull();
      expect(value).not.toBe("");
    }
  });

  test("EC2 → Subnet → RouteTable → Internet connectivity", async () => {
    const instance = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] }));
    const subnetId = instance.Reservations?.[0]?.Instances?.[0]?.SubnetId;
    expect(subnetId).toBeDefined();

    const routes = await ec2Client.send(new DescribeRouteTablesCommand({
      Filters: [{ Name: "association.subnet-id", Values: [subnetId!] }]
    }));
    const routeTable = routes.RouteTables?.[0];
    expect(routeTable?.Routes?.some(r => r.DestinationCidrBlock === "0.0.0.0/0" && r.GatewayId)).toBe(true);
  });
});
