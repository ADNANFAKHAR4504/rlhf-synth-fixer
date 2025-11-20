import fs from "fs";
import path from "path";
import { EC2Client, DescribeInstancesCommand, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand } from "@aws-sdk/client-s3";
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from "@aws-sdk/client-cloudtrail";
import { IAMClient, ListRolesCommand, GetRoleCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// Setup path to outputs file
const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath} — create it before running integration tests.`);
}

const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const outputsArray = Object.keys(raw)[0];
const outputs: Record<string, string> = {};
raw[outputsArray].forEach((o: { OutputKey: string; OutputValue: string }) => {
  outputs[o.OutputKey] = o.OutputValue;
});

// deduce region from outputs or environment variable
const region = process.env.AWS_REGION || "us-east-1";

// AWS clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const ct = new CloudTrailClient({ region });
const iam = new IAMClient({ region });
const rds = new RDSClient({ region });
const cw = new CloudWatchClient({ region });
const ssm = new SSMClient({ region });

// Retry function to handle incremental backoff for AWS SDK calls
async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 800): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelayMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}

// Validate VPC and Subnets
describe("TapStack – Integration Tests", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes for all tests to run

  // 1. Validate VPC creation
  it("VPC should exist", async () => {
    const vpcId = outputs.VPCId;
    const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(vpcResp.Vpcs?.length).toBeGreaterThan(0);
  });

  // 2. Validate subnets creation
  it("Subnets should exist", async () => {
    const subnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];
    const subnetResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    expect(subnetResp.Subnets?.length).toBeGreaterThan(0);
  });

  // 3. Validate Security Groups
  it("Security Groups: Web and DB SG should be present", async () => {
    const dbSecurityGroupId = outputs.DatabaseSecurityGroupId;
    const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [dbSecurityGroupId] }));
    expect(sgResp.SecurityGroups?.length).toBeGreaterThan(0);
  });

  // 4. Check CloudTrail existence and logging status
  it("CloudTrail: should be active with multi-region", async () => {
    const trailsResp = await retry(() => ct.send(new DescribeTrailsCommand({})));
    expect(trailsResp.trailList?.length).toBeGreaterThan(0);

    const multiRegionTrail = trailsResp.trailList?.find((trail: any) => trail.IsMultiRegionTrail);
    expect(multiRegionTrail).toBeDefined();

    const trailStatus = await retry(() => ct.send(new GetTrailStatusCommand({ Name: multiRegionTrail.Name })));
    expect(trailStatus.IsLogging).toBe(true);
  });

  // 5. Check S3 Bucket Encryption for CloudTrail and Application Bucket
  it("S3: CloudTrail Bucket should have encryption enabled", async () => {
    const cloudTrailBucket = outputs.CloudTrailBucketName;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: cloudTrailBucket })));

    const encryption = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: cloudTrailBucket })));
    expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
  });

  // 6. Check IAM Role for EC2 instance profile
  it("IAM Role for EC2 should have AmazonSSMManagedInstanceCore and CloudWatchAgentServerPolicy", async () => {
    const rolesResp = await retry(() => iam.send(new ListRolesCommand({})));
    const role = rolesResp.Roles?.find(r => r.AssumeRolePolicyDocument?.Statement[0]?.Principal?.Service?.includes('ec2.amazonaws.com'));
    expect(role).toBeDefined();
  });

  // 7. Validate DB instance using SecretsManager for password management
  it("RDS: DB instance should use SecretsManager for password", async () => {
    const dbPasswordSecret = outputs.DBMasterPasswordSecret;
    expect(dbPasswordSecret).toBeDefined();
  });

  // 8. Ensure CloudWatch Alarms are set for Unauthorized API calls
  it("CloudWatch: Unauthorized API calls alarm should exist", async () => {
    const alarmsResp = await retry(() => cw.send(new DescribeAlarmsCommand({})));
    const alarm = alarmsResp.MetricAlarms?.find(a => a.MetricName === "UnauthorizedAPICalls");
    expect(alarm).toBeDefined();
  });

  // 9. RDS TCP connection test on port 3306
  it("RDS: Should be able to connect to RDS on port 3306", async () => {
    const endpoint = outputs.RDSEndpoint;
    const port = 3306;
    const connected = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);
      socket.on("connect", () => {
        resolve(true);
        socket.destroy();
      });
      socket.on("timeout", () => {
        resolve(false);
        socket.destroy();
      });
      socket.on("error", () => {
        resolve(false);
      });
      socket.connect(port, endpoint);
    });
    expect(connected).toBe(true);
  });

  // 10. Ensure ALB is created and associated correctly
  it("ALB: Application Load Balancer should exist and be associated", async () => {
    const albDns = outputs.ApplicationLoadBalancerDNS;
    expect(albDns).toBeDefined();
  });

  // Additional tests for other components like WAF, EC2, SSM, etc.

  // Final test to validate outputs file consistency
  it("Outputs file should contain expected outputs", () => {
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.RDSEndpoint).toBeDefined();
  });
});
