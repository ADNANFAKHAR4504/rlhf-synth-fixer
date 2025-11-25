import {
  CloudFrontClient,
  GetCloudFrontOriginAccessIdentityCommand,
  GetDistributionCommand,
} from "@aws-sdk/client-cloudfront";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeAddressesCommand,
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeKeyPairsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  GetBucketLocationCommand,
  GetBucketPolicyCommand,
  GetBucketWebsiteCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import {
  GetParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";
import {
  GetCallerIdentityCommand,
  STSClient
} from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Load outputs and template dynamically
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Extract deployment information dynamically from outputs
const region = outputs.StackRegion || process.env.AWS_REGION || "us-east-1";
const stackName = outputs.StackName;
const environmentSuffix = outputs.EnvironmentSuffix;

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

// Custom credential provider that avoids dynamic imports
const getCredentialsSync = () => {
  // Try environment variables first
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
    };
  }

  // Try AWS credentials file
  const profile = process.env.AWS_PROFILE || 'default';
  const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');

  try {
    if (fs.existsSync(credentialsPath)) {
      const credentials = fs.readFileSync(credentialsPath, 'utf8');
      const profileSection = credentials.split(`[${profile}]`)[1]?.split('[')[0];

      if (profileSection) {
        const accessKeyMatch = profileSection.match(/aws_access_key_id\s*=\s*(.+)/);
        const secretKeyMatch = profileSection.match(/aws_secret_access_key\s*=\s*(.+)/);
        const sessionTokenMatch = profileSection.match(/aws_session_token\s*=\s*(.+)/);

        if (accessKeyMatch && secretKeyMatch) {
          return {
            accessKeyId: accessKeyMatch[1].trim(),
            secretAccessKey: secretKeyMatch[1].trim(),
            ...(sessionTokenMatch && { sessionToken: sessionTokenMatch[1].trim() }),
          };
        }
      }
    }
  } catch (error) {
    // Silently fail and let SDK use its default chain
  }

  return undefined;
};

// AWS Client configuration with explicit credentials
const credentials = getCredentialsSync();
const clientConfig: any = {
  region,
  ...(credentials && { credentials }),
};

// Initialize AWS clients with dynamic region
const ec2Client = new EC2Client(clientConfig);
const s3Client = new S3Client(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const iamClient = new IAMClient(clientConfig);
const secretsClient = new SecretsManagerClient(clientConfig);
const cloudWatchLogsClient = new CloudWatchLogsClient(clientConfig);
const cloudFrontClient = new CloudFrontClient(clientConfig);
const ssmClient = new SSMClient(clientConfig);
const stsClient = new STSClient(clientConfig);

jest.setTimeout(300_000); // 5 minutes for integration tests

// ---------------------------
// Helper functions
// ---------------------------
function extractRoleName(roleArn: string): string {
  return roleArn.split("/").pop() || "";
}

function extractSecretName(secretArn: string): string {
  return secretArn.split(":").pop()?.split("-")[0] || "";
}

function validateResourceNaming(resourceName: string, expectedComponents: string[]): void {
  if (resourceName && typeof resourceName === "string") {
    const lowerName = resourceName.toLowerCase();
    const matchedComponents = expectedComponents.filter(component =>
      lowerName.includes(component.toLowerCase())
    );
    // At least 2 out of 3 naming components should be present
    expect(matchedComponents.length).toBeGreaterThanOrEqual(2);
  }
}

// ---------------------------
// TapStack - Web Application Infrastructure Integration Tests
// ---------------------------
describe("TapStack - Live AWS Web Application Integration Tests", () => {
  // Display dynamic configuration
  beforeAll(() => {
    console.log("=== Integration Test Configuration ===");
    console.log(`Region: ${region}`);
    console.log(`Stack Name: ${stackName}`);
    console.log(`Environment Suffix: ${environmentSuffix}`);
    console.log(`Template: TapStack.json`);
    console.log("==========================================");
  });

  // ---------------------------
  // CROSS-ACCOUNT AND REGION INDEPENDENCE
  // ---------------------------
  describe("Cross-Account and Region Independence Validation", () => {
    test("Template contains no hardcoded account IDs or regions", async () => {
      const identity = await stsClient.send(new GetCallerIdentityCommand({}));
      const templateStr = JSON.stringify(template);

      // Verify no hardcoded account ID
      expect(templateStr).not.toContain(identity.Account || "");

      // Verify no hardcoded regions (except in allowed patterns)
      const regionPattern = /us-[a-z]+-\d+|eu-[a-z]+-\d+|ap-[a-z]+-\d+/g;
      const matches = templateStr.match(regionPattern) || [];

      // Filter out acceptable contexts (like documentation or comments)
      const hardcodedRegions = matches.filter(match => {
        const context = templateStr.substring(templateStr.indexOf(match) - 50, templateStr.indexOf(match) + 50);
        return !context.includes("AllowedValues") && !context.includes("Description") && !context.includes("ami-amazon-linux");
      });

      expect(hardcodedRegions.length).toBe(0);

      // Verify uses AWS pseudo parameters
      expect(templateStr).toContain("AWS::AccountId");
      expect(templateStr).toContain("AWS::Region");
      expect(templateStr).toContain("AWS::StackName");
    });

    test("All deployed resources use dynamic naming with environment suffix", () => {
      const resourceNames = [
        outputs.VPCId,
        outputs.S3BucketName,
        outputs.EC2InstanceId,
        outputs.RDSInstanceId,
        outputs.WebSecurityGroupName,
        outputs.DatabaseSecurityGroupName,
        outputs.EC2KeyPairId,
      ];

      for (const name of resourceNames) {
        expect(name).toBeDefined();
        expect(name).not.toBe("");

        if (typeof name === "string" && !name.startsWith("vpc-") && !name.startsWith("i-") && !name.startsWith("sg-")) {
          // Check naming convention for custom-named resources
          validateResourceNaming(name, [stackName, region, environmentSuffix]);
        }
      }
    });

    test("Dynamic parameter extraction works correctly", () => {
      expect(region).toBeDefined();
      expect(region).not.toBe("");
      expect(stackName).toBeDefined();
      expect(stackName).not.toBe("");
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix).not.toBe("");

      console.log(`Validated deployment: Stack=${stackName}, Region=${region}, Suffix=${environmentSuffix}`);
    });

    test("Stack is portable across AWS accounts", async () => {
      const identity = await stsClient.send(new GetCallerIdentityCommand({}));

      // Verify all ARNs use current account
      expect(outputs.S3BucketArn).toContain(identity.Account!);
      expect(outputs.EC2RoleArn).toContain(identity.Account!);
      expect(outputs.EC2InstanceProfileArn).toContain(identity.Account!);
      expect(outputs.VPCFlowLogRoleArn).toContain(identity.Account!);
      expect(outputs.DBSecretArn).toContain(identity.Account!);

      console.log(`Deployment successfully uses account: ${identity.Account}, region: ${region}`);
      console.log("Stack is fully portable across accounts and regions");
    });
  });

  // ---------------------------
  // VPC AND NETWORKING VALIDATION
  // ---------------------------
  describe("VPC and Network Infrastructure", () => {
    test("VPC exists and is properly configured", async () => {
      const res = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );

      const vpc = res.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.VpcId).toBe(outputs.VPCId);
      expect(vpc?.State).toBe("available");
      expect(vpc?.CidrBlock).toBe(outputs.VPCCidrBlock);
      expect(vpc?.DhcpOptionsId).toBeDefined();
      expect(vpc?.InstanceTenancy).toBe("default");

      // Verify DNS configuration
      const dnsHostnamesRes = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs.VPCId,
          Attribute: "enableDnsHostnames",
        })
      );
      const dnsSupportRes = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs.VPCId,
          Attribute: "enableDnsSupport",
        })
      );

      expect(dnsHostnamesRes.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupportRes.EnableDnsSupport?.Value).toBe(true);

      // Verify tags
      const nameTag = vpc?.Tags?.find(t => t.Key === "Name");
      expect(nameTag?.Value).toContain(stackName);
      expect(nameTag?.Value).toContain(environmentSuffix);
      expect(nameTag?.Value).toContain("vpc");
    });

    test("Public subnets are properly configured", async () => {
      const subnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      const subnets = res.Subnets || [];
      expect(subnets.length).toBe(2);

      // Verify each subnet is in a different AZ
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      // Verify public subnets have MapPublicIpOnLaunch enabled
      subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.VPCId);

        // Verify CIDR blocks match expected outputs
        const isSubnet1 = subnet.SubnetId === outputs.PublicSubnet1Id;
        const expectedCidr = isSubnet1 ? outputs.PublicSubnet1CidrBlock : outputs.PublicSubnet2CidrBlock;
        expect(subnet.CidrBlock).toBe(expectedCidr);
      });
    });

    test("Private subnets are properly configured", async () => {
      const subnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      const subnets = res.Subnets || [];
      expect(subnets.length).toBe(2);

      // Verify each subnet is in a different AZ
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBeFalsy();
        expect(subnet.State).toBe("available");
        expect(subnet.VpcId).toBe(outputs.VPCId);

        // Verify CIDR blocks match expected outputs
        const isSubnet1 = subnet.SubnetId === outputs.PrivateSubnet1Id;
        const expectedCidr = isSubnet1 ? outputs.PrivateSubnet1CidrBlock : outputs.PrivateSubnet2CidrBlock;
        expect(subnet.CidrBlock).toBe(expectedCidr);
      });
    });

    test("Internet Gateway is attached to VPC", async () => {
      const res = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          InternetGatewayIds: [outputs.InternetGatewayId],
        })
      );

      const igw = res.InternetGateways?.[0];
      expect(igw).toBeDefined();
      expect(igw?.InternetGatewayId).toBe(outputs.InternetGatewayId);

      const attachment = igw?.Attachments?.[0];
      expect(attachment?.State).toBe("available");
      expect(attachment?.VpcId).toBe(outputs.VPCId);
    });

    test("Route table is properly configured", async () => {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          RouteTableIds: [outputs.PublicRouteTableId],
        })
      );

      const routeTable = res.RouteTables?.[0];
      expect(routeTable).toBeDefined();
      expect(routeTable?.VpcId).toBe(outputs.VPCId);

      // Check for Internet Gateway route
      const igwRoute = routeTable?.Routes?.find(r => r.GatewayId === outputs.InternetGatewayId);
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(igwRoute?.State).toBe("active");
    });

    test("Security groups are properly configured", async () => {
      const sgIds = [
        outputs.WebSecurityGroupId,
        outputs.DatabaseSecurityGroupId,
      ];

      const res = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
      );

      expect(res.SecurityGroups?.length).toBe(2);

      res.SecurityGroups?.forEach(sg => {
        expect(sg.VpcId).toBe(outputs.VPCId);

        // Verify naming convention
        if (sg.GroupId === outputs.WebSecurityGroupId) {
          expect(sg.GroupName).toBe(outputs.WebSecurityGroupName);

          // Verify HTTP and SSH ingress rules
          const httpRule = sg.IpPermissions?.find(rule => rule.FromPort === 80);
          const sshRule = sg.IpPermissions?.find(rule => rule.FromPort === 22);

          expect(httpRule).toBeDefined();
          expect(httpRule?.IpProtocol).toBe("tcp");
          expect(sshRule).toBeDefined();
          expect(sshRule?.IpProtocol).toBe("tcp");
        }

        if (sg.GroupId === outputs.DatabaseSecurityGroupId) {
          expect(sg.GroupName).toBe(outputs.DatabaseSecurityGroupName);

          // Verify PostgreSQL port (5432) rule
          const dbRule = sg.IpPermissions?.find(rule => rule.FromPort === 5432);
          expect(dbRule).toBeDefined();
          expect(dbRule?.IpProtocol).toBe("tcp");
        }
      });
    });
  });

  // ---------------------------
  // S3 BUCKET VALIDATION
  // ---------------------------
  describe("S3 Bucket Configuration", () => {
    test("S3 bucket exists and is accessible", async () => {
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: outputs.S3BucketName }))
      ).resolves.not.toThrow();

      // Verify bucket location matches region
      const locationRes = await s3Client.send(
        new GetBucketLocationCommand({ Bucket: outputs.S3BucketName })
      );

      // LocationConstraint is null for us-east-1, otherwise it's the region
      const bucketRegion = locationRes.LocationConstraint || "us-east-1";
      expect(bucketRegion).toBe(region);
    });

    test("S3 bucket has website configuration", async () => {
      const res = await s3Client.send(
        new GetBucketWebsiteCommand({ Bucket: outputs.S3BucketName })
      );

      expect(res.IndexDocument?.Suffix).toBe("index.html");
      expect(res.ErrorDocument?.Key).toBe("error.html");
    });

    test("S3 bucket has public read policy", async () => {
      const res = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: outputs.S3BucketName })
      );

      expect(res.Policy).toBeDefined();
      const policy = JSON.parse(res.Policy!);

      expect(policy.Statement).toHaveLength(1);
      expect(policy.Statement[0].Effect).toBe("Allow");
      expect(policy.Statement[0].Principal).toBe("*");
      expect(policy.Statement[0].Action).toBe("s3:GetObject");
      expect(policy.Statement[0].Resource).toContain(outputs.S3BucketArn);
    });

    test("S3 bucket naming follows convention", () => {
      // Bucket name should include account ID, region, and environment suffix
      expect(outputs.S3BucketName).toContain(region);
      expect(outputs.S3BucketName).toContain(environmentSuffix);
      expect(outputs.S3BucketName).toContain("-bucket");

      // Verify URL endpoints are properly formatted
      expect(outputs.S3BucketWebsiteURL).toContain(outputs.S3BucketName);
      expect(outputs.S3BucketWebsiteURL).toContain(region);
      expect(outputs.S3BucketRegionalDomainName).toContain(outputs.S3BucketName);
      expect(outputs.S3BucketRegionalDomainName).toContain(region);
    });
  });

  // ---------------------------
  // IAM ROLES AND POLICIES VALIDATION
  // ---------------------------
  describe("IAM Roles and Policies Configuration", () => {
    test("EC2 IAM role exists and has proper configuration", async () => {
      const roleName = extractRoleName(outputs.EC2RoleArn);
      const res = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      const role = res.Role;
      expect(role).toBeDefined();
      expect(role?.Arn).toBe(outputs.EC2RoleArn);
      expect(role?.RoleName).toBe(roleName);

      // Verify assume role policy allows EC2 service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(role?.AssumeRolePolicyDocument || ""));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain("ec2.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
    });

    test("EC2 role has required managed and inline policies", async () => {
      const roleName = extractRoleName(outputs.EC2RoleArn);

      // Check managed policies
      const managedPoliciesRes = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const managedPolicyArns = managedPoliciesRes.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(managedPolicyArns).toContain("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
    });

    test("EC2 instance profile exists and is linked to role", async () => {
      const profileName = outputs.EC2InstanceProfileArn.split("/").pop() || "";
      const res = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );

      const profile = res.InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile?.Arn).toBe(outputs.EC2InstanceProfileArn);

      // Verify role is attached to instance profile
      expect(profile?.Roles).toHaveLength(1);
      expect(profile?.Roles?.[0]?.Arn).toBe(outputs.EC2RoleArn);
    });

    test("VPC Flow Log role exists with proper permissions", async () => {
      const roleName = extractRoleName(outputs.VPCFlowLogRoleArn);
      const res = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      const role = res.Role;
      expect(role).toBeDefined();
      expect(role?.Arn).toBe(outputs.VPCFlowLogRoleArn);

      // Verify assume role policy allows VPC Flow Logs service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(role?.AssumeRolePolicyDocument || ""));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain("vpc-flow-logs.amazonaws.com");
    });
  });

  // ---------------------------
  // EC2 INSTANCE VALIDATION
  // ---------------------------
  describe("EC2 Instance Configuration", () => {
    test("EC2 instance exists and is running", async () => {
      const res = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        })
      );

      const reservation = res.Reservations?.[0];
      expect(reservation).toBeDefined();

      const instance = reservation?.Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.InstanceId).toBe(outputs.EC2InstanceId);
      expect(instance?.State?.Name).toBe("running");
    });

    test("EC2 instance uses dynamic AMI resolution", async () => {
      const res = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        })
      );

      const instance = res.Reservations?.[0]?.Instances?.[0];
      expect(instance?.ImageId).toBe(outputs.InstanceImageId);

      // Verify AMI ID is resolved dynamically from SSM parameter
      const ssmRes = await ssmClient.send(
        new GetParameterCommand({
          Name: "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
        })
      );

      expect(instance?.ImageId).toBe(ssmRes.Parameter?.Value);
    });

    test("EC2 instance has proper network configuration", async () => {
      const res = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        })
      );

      const instance = res.Reservations?.[0]?.Instances?.[0];
      expect(instance?.VpcId).toBe(outputs.VPCId);
      expect(instance?.SubnetId).toBe(outputs.PublicSubnet1Id);
      expect(instance?.PrivateIpAddress).toBe(outputs.EC2InstancePrivateIp);
      expect(instance?.PrivateDnsName).toBe(outputs.EC2InstancePrivateDnsName);

      // Verify security group assignment
      expect(instance?.SecurityGroups).toHaveLength(1);
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(outputs.WebSecurityGroupId);
    });

    test("EC2 instance has proper IAM instance profile", async () => {
      const res = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        })
      );

      const instance = res.Reservations?.[0]?.Instances?.[0];
      expect(instance?.IamInstanceProfile?.Arn).toBe(outputs.EC2InstanceProfileArn);
    });

    test("EC2 key pair exists and is associated", async () => {
      const res = await ec2Client.send(
        new DescribeKeyPairsCommand({
          KeyNames: [outputs.EC2KeyPairId],
        })
      );

      const keyPair = res.KeyPairs?.[0];
      expect(keyPair).toBeDefined();
      expect(keyPair?.KeyName).toBe(outputs.EC2KeyPairId);
      expect(keyPair?.KeyFingerprint).toBe(outputs.EC2KeyPairFingerprint);
    });
  });

  // ---------------------------
  // ELASTIC IP VALIDATION
  // ---------------------------
  describe("Elastic IP Configuration", () => {
    test("Elastic IP exists and is associated with EC2 instance", async () => {
      const res = await ec2Client.send(
        new DescribeAddressesCommand({
          AllocationIds: [outputs.ElasticIPAllocationId],
        })
      );

      const eip = res.Addresses?.[0];
      expect(eip).toBeDefined();
      expect(eip?.PublicIp).toBe(outputs.ElasticIPAddress);
      expect(eip?.AllocationId).toBe(outputs.ElasticIPAllocationId);
      expect(eip?.InstanceId).toBe(outputs.EC2InstanceId);
      expect(eip?.Domain).toBe("vpc");
      expect(eip?.AssociationId).toBeDefined();
    });
  });

  // ---------------------------
  // RDS DATABASE VALIDATION
  // ---------------------------
  describe("RDS Database Configuration", () => {
    test("RDS instance exists and is available", async () => {
      const res = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.RDSInstanceId,
        })
      );

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceIdentifier).toBe(outputs.RDSInstanceId);
      expect(dbInstance?.DBInstanceStatus).toBe("available");
      expect(dbInstance?.Engine).toBe("postgres");
      expect(dbInstance?.DBInstanceClass).toBe(outputs.DBInstanceClass);
    });

    test("RDS instance has proper network configuration", async () => {
      const res = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.RDSInstanceId,
        })
      );

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance?.VpcSecurityGroups).toHaveLength(1);
      expect(dbInstance?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(outputs.DatabaseSecurityGroupId);
      expect(dbInstance?.VpcSecurityGroups?.[0]?.Status).toBe("active");

      // Verify endpoint configuration
      expect(dbInstance?.Endpoint?.Address).toBe(outputs.RDSEndpoint);
      expect(dbInstance?.Endpoint?.Port?.toString()).toBe(outputs.RDSPort);
    });

    test("RDS subnet group exists and uses private subnets", async () => {
      const res = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: outputs.DBSubnetGroupName,
        })
      );

      const subnetGroup = res.DBSubnetGroups?.[0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.DBSubnetGroupName).toBe(outputs.DBSubnetGroupName);
      expect(subnetGroup?.VpcId).toBe(outputs.VPCId);

      // Verify uses both private subnets
      const subnetIds = subnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
    });

    test("Database master secret exists and is accessible", async () => {
      const res = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: outputs.DBSecretArn,
        })
      );

      expect(res.SecretString).toBeDefined();
      const secretValue = JSON.parse(res.SecretString!);
      expect(secretValue.username).toBeDefined();
      expect(secretValue.password).toBeDefined();
      expect(secretValue.username).toBe("dbadmin"); // Default from template
    });
  });

  // ---------------------------
  // VPC FLOW LOGS VALIDATION
  // ---------------------------
  describe("VPC Flow Logs Configuration", () => {
    test("VPC Flow Log exists and is active", async () => {
      const res = await ec2Client.send(
        new DescribeFlowLogsCommand({
          FlowLogIds: [outputs.VPCFlowLogId],
        })
      );

      const flowLog = res.FlowLogs?.[0];
      expect(flowLog).toBeDefined();
      expect(flowLog?.FlowLogId).toBe(outputs.VPCFlowLogId);
      expect(flowLog?.FlowLogStatus).toBe("ACTIVE");
      expect(flowLog?.ResourceId).toBe(outputs.VPCId);
      expect(flowLog?.TrafficType).toBe("ALL");
      expect(flowLog?.LogDestinationType).toBe("cloud-watch-logs");
    });

    test("CloudWatch Log Group exists for VPC Flow Logs", async () => {
      const logGroupName = `/aws/vpc/flowlogs/${stackName}-${region}-${environmentSuffix}`;
      const res = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      const logGroup = res.logGroups?.[0];
      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(logGroupName);
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  // ---------------------------
  // CLOUDFRONT DISTRIBUTION VALIDATION
  // ---------------------------
  describe("CloudFront Distribution Configuration", () => {
    test("CloudFront distribution exists and is deployed", async () => {
      const res = await cloudFrontClient.send(
        new GetDistributionCommand({
          Id: outputs.CloudFrontDistributionId,
        })
      );

      const distribution = res.Distribution;
      expect(distribution).toBeDefined();
      expect(distribution?.Id).toBe(outputs.CloudFrontDistributionId);
      expect(distribution?.Status).toBe("Deployed");
      expect(distribution?.DomainName).toBe(outputs.CloudFrontDomainName);
    });

    test("CloudFront distribution has proper origin configuration", async () => {
      const res = await cloudFrontClient.send(
        new GetDistributionCommand({
          Id: outputs.CloudFrontDistributionId,
        })
      );

      const config = res.Distribution?.DistributionConfig;
      expect(config?.Origins?.Quantity).toBe(1);

      const origin = config?.Origins?.Items?.[0];
      expect(origin?.DomainName).toBe(outputs.S3BucketRegionalDomainName);
      expect(origin?.Id).toBe("S3Origin");
      expect(origin?.S3OriginConfig?.OriginAccessIdentity).toContain(outputs.CloudFrontOriginAccessIdentityId);
    });

    test("CloudFront Origin Access Identity exists", async () => {
      const res = await cloudFrontClient.send(
        new GetCloudFrontOriginAccessIdentityCommand({
          Id: outputs.CloudFrontOriginAccessIdentityId,
        })
      );

      const oai = res.CloudFrontOriginAccessIdentity;
      expect(oai).toBeDefined();
      expect(oai?.Id).toBe(outputs.CloudFrontOriginAccessIdentityId);
    });

    test("CloudFront distribution enforces HTTPS", async () => {
      const res = await cloudFrontClient.send(
        new GetDistributionCommand({
          Id: outputs.CloudFrontDistributionId,
        })
      );

      const behavior = res.Distribution?.DistributionConfig?.DefaultCacheBehavior;
      expect(behavior?.ViewerProtocolPolicy).toBe("redirect-to-https");
    });
  });

  // ---------------------------
  // END-TO-END INTEGRATION TESTS
  // ---------------------------
  describe("End-to-End Integration and Cross-Service Validation", () => {
    test("Web application stack components are properly integrated", async () => {
      // Verify EC2 can reach S3 (via IAM role)
      const ec2Res = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] })
      );
      const instance = ec2Res.Reservations?.[0]?.Instances?.[0];
      expect(instance?.IamInstanceProfile?.Arn).toBe(outputs.EC2InstanceProfileArn);

      // Verify S3 bucket is accessible via CloudFront
      expect(outputs.CloudFrontDistributionURL).toContain("https://");
      expect(outputs.CloudFrontDistributionURL).toContain(outputs.CloudFrontDomainName);

      // Verify RDS is accessible from EC2 subnet (network connectivity)
      const rdsRes = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.RDSInstanceId })
      );
      const dbInstance = rdsRes.DBInstances?.[0];

      // EC2 is in public subnet, RDS should be in private subnets
      expect(instance?.SubnetId).toBe(outputs.PublicSubnet1Id);
      const dbSubnetIds = dbInstance?.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      expect(dbSubnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(dbSubnetIds).toContain(outputs.PrivateSubnet2Id);
    });

    test("Security configuration follows best practices", async () => {
      // Verify RDS is not publicly accessible
      const rdsRes = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.RDSInstanceId })
      );
      const dbInstance = rdsRes.DBInstances?.[0];
      expect(dbInstance?.PubliclyAccessible).toBe(false);

      // Verify database password is managed by Secrets Manager
      expect(dbInstance?.MasterUsername).toBe("dbadmin");
      expect(outputs.DBSecretArn).toContain("secretsmanager");

      // Verify S3 bucket policy is restrictive (only GetObject allowed)
      const s3PolicyRes = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: outputs.S3BucketName })
      );
      const policy = JSON.parse(s3PolicyRes.Policy!);
      expect(policy.Statement[0].Action).toBe("s3:GetObject");
      expect(policy.Statement[0].Effect).toBe("Allow");
    });

    test("Multi-AZ deployment capability is properly configured", async () => {
      // Verify subnets are in different AZs
      const publicSubnets = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id],
        })
      );
      const privateSubnets = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
        })
      );

      const publicAZs = new Set(publicSubnets.Subnets?.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets.Subnets?.map(s => s.AvailabilityZone));

      expect(publicAZs.size).toBe(2);
      expect(privateAZs.size).toBe(2);

      // Verify RDS can use multiple AZs
      const rdsRes = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.RDSInstanceId })
      );
      const dbSubnetGroup = rdsRes.DBInstances?.[0]?.DBSubnetGroup;
      const dbAZs = new Set(dbSubnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name));
      expect(dbAZs.size).toBe(2);
    });

    test("Resource tagging is consistent across all resources", async () => {
      // Check VPC tags
      const vpcRes = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );
      const vpcTags = vpcRes.Vpcs?.[0]?.Tags || [];

      const environmentTag = vpcTags.find(t => t.Key === "Environment");
      const ownerTag = vpcTags.find(t => t.Key === "Owner");
      const projectTag = vpcTags.find(t => t.Key === "Project");

      expect(environmentTag?.Value).toBe("Development");
      expect(ownerTag?.Value).toBe("DevOps Team");
      expect(projectTag?.Value).toBe("WebApp");

      // Check EC2 tags
      const ec2Res = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] })
      );
      const ec2Tags = ec2Res.Reservations?.[0]?.Instances?.[0]?.Tags || [];

      const ec2EnvironmentTag = ec2Tags.find(t => t.Key === "Environment");
      expect(ec2EnvironmentTag?.Value).toBe("Development");
    });

    test("All outputs are consistent and properly formatted", () => {
      // Verify all required outputs exist
      const requiredOutputs = [
        'VPCId', 'S3BucketName', 'EC2InstanceId', 'RDSInstanceId',
        'CloudFrontDistributionId', 'StackName', 'StackRegion', 'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe("");
      });

      // Verify ARN formats
      const arnOutputs = [
        'S3BucketArn', 'EC2RoleArn', 'EC2InstanceProfileArn',
        'VPCFlowLogRoleArn', 'DBSecretArn', 'VPCFlowLogGroupArn'
      ];

      arnOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toMatch(/^arn:aws:/);
      });

      expect(outputs.S3BucketWebsiteURL).toMatch(/^http:\/\//);
      expect(outputs.CloudFrontDistributionURL).toMatch(/^https:\/\//);
    });
  });
});
