// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from "@aws-sdk/client-s3";
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeInstancesCommand
} from "@aws-sdk/client-ec2";
// To this:
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand, 
  DescribeTargetGroupsCommand,
  DescribeListenersCommand 
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand 
} from "@aws-sdk/client-auto-scaling";
import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from "@aws-sdk/client-rds";
import { 
  IAMClient, 
  GetRoleCommand, 
  GetInstanceProfileCommand 
} from "@aws-sdk/client-iam";
import { 
  SecretsManagerClient, 
  DescribeSecretCommand 
} from "@aws-sdk/client-secrets-manager";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let internetGatewayId: string;
  let albSecurityGroupId: string;
  let ec2SecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let albDnsName: string;
  let asgName: string;
  let rdsEndpoint: string;
  let rdsPort: number;
  let rdsSecretName: string;
  let s3BucketName: string;
  let instanceProfileName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = JSON.parse(stackOutputs["public-subnet-ids"]);
    privateSubnetIds = JSON.parse(stackOutputs["private-subnet-ids"]);
    internetGatewayId = stackOutputs["internet-gateway-id"];
    albSecurityGroupId = stackOutputs["alb-security-group-id"];
    ec2SecurityGroupId = stackOutputs["ec2-security-group-id"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];
    albDnsName = stackOutputs["alb-dns-name"];
    asgName = stackOutputs["asg-name"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsPort = stackOutputs["rds-port"];
    rdsSecretName = stackOutputs["rds-secret-name"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    instanceProfileName = stackOutputs["ec2-instance-profile-name"];

    if (!vpcId || !publicSubnetIds || !privateSubnetIds || !internetGatewayId || 
        !albSecurityGroupId || !ec2SecurityGroupId || !rdsSecurityGroupId ||
        !albDnsName || !asgName || !rdsEndpoint || !rdsSecretName || 
        !s3BucketName || !instanceProfileName) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("AWS Account Verification", () => {
    test("AWS credentials are properly configured", async () => {
      const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));
      expect(Account).toBeDefined();
      expect(Account).toMatch(/^\d{12}$/); // AWS account ID is 12 digits
    }, 20000);
  });

  describe("Network Infrastructure", () => {
    test("VPC exists with correct configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.State).toBe("available");
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "main-vpc")).toBe(true);
    }, 20000);

    test("Public subnets are configured correctly", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      Subnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);
        expect(subnet.Tags?.some(tag => 
          tag.Key === "Name" && tag.Value === `public-subnet-${index + 1}`
        )).toBe(true);
      });
    }, 20000);

    test("Private subnets are configured correctly", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      Subnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.(10|20)\.0\/24$/);
        expect(subnet.Tags?.some(tag => 
          tag.Key === "Name" && tag.Value === `private-subnet-${index + 1}`
        )).toBe(true);
      });
    }, 20000);

    test("Internet Gateway is properly configured", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );
      expect(InternetGateways?.length).toBe(1);

      const igw = InternetGateways?.[0];
      expect(igw?.InternetGatewayId).toBe(internetGatewayId);
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
      expect(igw?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "main-igw")).toBe(true);
    }, 20000);
  });

  describe("Security Groups", () => {
    test("ALB security group has correct configuration", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [albSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(albSecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("alb-security-group");
      expect(sg?.Description).toBe("Security group for Application Load Balancer");

      // Check HTTP ingress rule (port 80 from anywhere)
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
    }, 20000);

    test("EC2 security group has correct configuration", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(ec2SecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("ec2-security-group");
      expect(sg?.Description).toBe("Security group for EC2 instances");

      // Check SSH ingress rule (port 22 from VPC CIDR)
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "10.0.0.0/16")).toBe(true);

      // Check HTTP ingress rule (port 80 from ALB security group)
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === albSecurityGroupId
      )).toBe(true);
    }, 20000);

    test("RDS security group has correct configuration", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(rdsSecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("rds-security-group");
      expect(sg?.Description).toBe("Security group for RDS instance");

      // Check MySQL ingress rule (port 3306 from EC2 security group)
      const mysqlRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === ec2SecurityGroupId
      )).toBe(true);
    }, 20000);
  });

  describe("Load Balancer and Auto Scaling", () => {
    test("Application Load Balancer is properly configured", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: ["web-servers-alb"]
        })
      );
      expect(LoadBalancers?.length).toBe(1);

      const alb = LoadBalancers?.[0];
      expect(alb?.LoadBalancerName).toBe("web-servers-alb");
      expect(alb?.DNSName).toBe(albDnsName);
      expect(alb?.Type).toBe("application");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.VpcId).toBe(vpcId);
      expect(alb?.SecurityGroups).toContain(albSecurityGroupId);

    }, 30000);

    test("ALB listener is configured for HTTP", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: ["web-servers-alb"]
        })
      );
      const albArn = LoadBalancers?.[0]?.LoadBalancerArn;

      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn
        })
      );
      expect(Listeners?.length).toBe(1);

      const listener = Listeners?.[0];
      expect(listener?.Port).toBe(80);
      expect(listener?.Protocol).toBe("HTTP");
      expect(listener?.DefaultActions?.[0]?.Type).toBe("forward");
    }, 20000);

    test("Target Group is properly configured", async () => {
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: ["web-servers-tg"]
        })
      );
      expect(TargetGroups?.length).toBe(1);

      const tg = TargetGroups?.[0];
      expect(tg?.TargetGroupName).toBe("web-servers-tg");
      expect(tg?.Port).toBe(80);
      expect(tg?.Protocol).toBe("HTTP");
      expect(tg?.VpcId).toBe(vpcId);
      expect(tg?.HealthCheckPath).toBe("/");
      expect(tg?.HealthCheckProtocol).toBe("HTTP");
    }, 20000);

    test("Auto Scaling Group is properly configured", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        })
      );
      expect(AutoScalingGroups?.length).toBe(1);

      const asg = AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(asgName);
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBe(4);
      expect(asg?.HealthCheckType).toBe("ELB");
      expect(asg?.HealthCheckGracePeriod).toBe(300);

      // Check subnets
      privateSubnetIds.forEach(subnetId => {
        expect(asg?.VPCZoneIdentifier?.split(',')).toContain(subnetId);
      });
    }, 30000);
  });

  describe("Database Infrastructure", () => {
    test("RDS instance is properly configured", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: "main-database"
        })
      );
      expect(DBInstances?.length).toBe(1);

      const rds = DBInstances?.[0];
      expect(rds?.DBInstanceIdentifier).toBe("main-database");
      expect(rds?.DBInstanceStatus).toBe("available");
      expect(rds?.Engine).toBe("mysql");
      expect(rds?.EngineVersion).toMatch(/^8\.0/);
      expect(rds?.DBInstanceClass).toBe("db.t3.micro");
      expect(rds?.AllocatedStorage).toBe(20);
      expect(rds?.MaxAllocatedStorage).toBe(100);
      expect(rds?.StorageType).toBe("gp2");
      expect(rds?.MasterUsername).toBe("admin");
      expect(rds?.DBName).toBe("maindb");
      expect(rds?.MultiAZ).toBe(true);
      expect(rds?.StorageEncrypted).toBe(true);
      expect(rds?.BackupRetentionPeriod).toBe(7);
      expect(rds?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(rdsSecurityGroupId);
    }, 30000);

    test("RDS endpoint matches expected format", async () => {
      expect(rdsEndpoint).toMatch(/^main-database\.[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com:3306$/);
      expect(rdsPort).toBe(3306);
    }, 20000);

    test("RDS secret is properly configured", async () => {
      const { Name, Description } = await secretsManagerClient.send(
        new DescribeSecretCommand({
          SecretId: rdsSecretName
        })
      );
      expect(Name).toBe(rdsSecretName);
      expect(Description).toBe("RDS Admin Password");
    }, 20000);
  });

  describe("Storage and IAM", () => {
    test("S3 bucket exists with correct configuration", async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));
    }, 20000);

    test("S3 bucket has versioning enabled", async () => {
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);

    test("IAM instance profile exists with correct configuration", async () => {
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: instanceProfileName
        })
      );
      expect(InstanceProfile?.InstanceProfileName).toBe(instanceProfileName);
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe("ec2-s3-access-role");
    }, 20000);

    test("IAM role has correct policies attached", async () => {
      const { Role } = await iamClient.send(
        new GetRoleCommand({
          RoleName: "ec2-s3-access-role"
        })
      );
      expect(Role?.RoleName).toBe("ec2-s3-access-role");
      
      // Verify assume role policy for EC2
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
      expect(assumeRolePolicy.Version).toBe("2012-10-17");
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");
    }, 20000);
  });

  describe("Resource Naming and Tagging", () => {
    test("Resources follow consistent naming conventions", async () => {
      // Check VPC naming
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.[0]?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "main-vpc")).toBe(true);

      // Check Internet Gateway naming
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );
      expect(InternetGateways?.[0]?.Tags?.some(tag => 
        tag.Key === "Name" && tag.Value === "main-igw"
      )).toBe(true);

      // Check security group naming
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [albSecurityGroupId] })
      );
      expect(SecurityGroups?.[0]?.Tags?.some(tag => 
        tag.Key === "Name" && tag.Value === "alb-sg"
      )).toBe(true);
    }, 20000);

    test("Load balancer and ASG follow naming conventions", async () => {
      expect(albDnsName).toMatch(/^web-servers-alb-\d+\.us-east-1\.elb\.amazonaws\.com$/);
      expect(asgName).toBe("web-servers-asg");
    }, 20000);

    test("Database and storage resources follow naming conventions", async () => {
      expect(rdsSecretName).toBe("rds-admin-password");
      expect(instanceProfileName).toBe("ec2-s3-instance-profile");
    }, 20000);
  });

  describe("High Availability and Fault Tolerance", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      // Check public subnets are in different AZs
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      const publicAZs = publicSubnets?.map(subnet => subnet.AvailabilityZone);
      expect(new Set(publicAZs).size).toBe(2); // Should be in 2 different AZs

      // Check private subnets are in different AZs
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      const privateAZs = privateSubnets?.map(subnet => subnet.AvailabilityZone);
      expect(new Set(privateAZs).size).toBe(2); // Should be in 2 different AZs

      // Check RDS Multi-AZ is enabled
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: "main-database"
        })
      );
      expect(DBInstances?.[0]?.MultiAZ).toBe(true);
    }, 30000);

    test("Auto Scaling Group maintains desired capacity", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        })
      );
      
      const asg = AutoScalingGroups?.[0];
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg?.MinSize || 0);
      expect(asg?.DesiredCapacity).toBeLessThanOrEqual(asg?.MaxSize || 0);
      
      // Check that instances are distributed across private subnets
      expect(asg?.VPCZoneIdentifier?.split(',').length).toBe(2);
    }, 20000);
  });
});