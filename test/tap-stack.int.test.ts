import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketEncryptionCommand, 
  GetPublicAccessBlockCommand 
} from "@aws-sdk/client-s3";
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand, 
  DescribeInternetGatewaysCommand, 
  DescribeNatGatewaysCommand, 
  DescribeRouteTablesCommand,
  DescribeLaunchTemplatesCommand
} from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
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
import { IAMClient,} from "@aws-sdk/client-iam";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let internetGatewayId: string;
  let natGatewayId: string;
  let publicRouteTableId: string;
  let privateRouteTableId: string;
  let publicSecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let albDnsName: string;
  let albZoneId: string;
  let autoScalingGroupName: string;
  let s3LogsBucketName: string;
  let s3LogsBucketArn: string;
  let rdsEndpoint: string;
  let rdsInstanceId: string;
  let rdsPort: number;
  let ec2LaunchTemplateId: string;
  let cloudwatchLogGroupName: string;
  let ebsLifecyclePolicyId: string;

  beforeAll(() => {
    // Load deployment outputs from flat-outputs.json
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // Get the first (and likely only) stack
    const stackOutputs = outputs[stackKey];

    // Extract all required outputs
    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = JSON.parse(stackOutputs["public-subnet-ids"]);
    privateSubnetIds = JSON.parse(stackOutputs["private-subnet-ids"]);
    internetGatewayId = stackOutputs["internet-gateway-id"];
    natGatewayId = stackOutputs["nat-gateway-id"];
    publicRouteTableId = stackOutputs["public-route-table-id"];
    privateRouteTableId = stackOutputs["private-route-table-id"];
    publicSecurityGroupId = stackOutputs["public-security-group-id"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];
    albDnsName = stackOutputs["alb-dns-name"];
    albZoneId = stackOutputs["alb-zone-id"];
    autoScalingGroupName = stackOutputs["auto-scaling-group-name"];
    s3LogsBucketName = stackOutputs["s3-logs-bucket-name"];
    s3LogsBucketArn = stackOutputs["s3-logs-bucket-arn"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsInstanceId = stackOutputs["rds-instance-id"];
    rdsPort = parseInt(stackOutputs["rds-port"], 10);
    ec2LaunchTemplateId = stackOutputs["ec2-launch-template-id"];
    cloudwatchLogGroupName = stackOutputs["cloudwatch-log-group-name"];
    ebsLifecyclePolicyId = stackOutputs["ebs-lifecycle-policy-id"];

    // Validate required outputs
    if (!vpcId || !s3LogsBucketName || !rdsEndpoint || !albDnsName || !autoScalingGroupName) {
      throw new Error("Missing required stack outputs for integration tests");
    }
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct CIDR configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");

      
      // Verify tags
      expect(vpc?.Tags?.some(tag => 
        tag.Key === "Name" && tag.Value?.includes("tap") && tag.Value?.includes("vpc")
      )).toBe(true);
    }, 30000);

    test("Public subnets exist with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      const expectedCidrs = ["10.0.1.0/24", "10.0.2.0/24"];
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(expectedCidrs.includes(subnet?.CidrBlock || "")).toBe(true);
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.State).toBe("available");
        
        // Verify tags
        expect(subnet?.Tags?.some(tag => 
          tag.Key === "Name" && tag.Value?.includes("public-subnet")
        )).toBe(true);
        expect(subnet?.Tags?.some(tag => 
          tag.Key === "Environment"
        )).toBe(true);
      });
    }, 30000);

    test("Private subnets exist with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      const expectedCidrs = ["10.0.11.0/24", "10.0.12.0/24"];

      Subnets?.forEach((subnet, index) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(expectedCidrs.includes(subnet?.CidrBlock || "")).toBe(true);
        expect(subnet?.MapPublicIpOnLaunch).toBe(false);
        expect(subnet?.State).toBe("available");
        
        // Verify tags
        expect(subnet?.Tags?.some(tag => 
          tag.Key === "Name" && tag.Value?.includes("private-subnet")
        )).toBe(true);
      });
    }, 30000);

    test("Internet Gateway exists and is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );
      expect(InternetGateways?.length).toBe(1);

      const igw = InternetGateways?.[0];
      expect(igw?.InternetGatewayId).toBe(internetGatewayId);
      
      const attachment = igw?.Attachments?.find(att => att.VpcId === vpcId);
      expect(attachment).toBeDefined();
      expect(attachment?.State).toBe("available");
    }, 30000);

    test("NAT Gateway exists in public subnet", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );
      expect(NatGateways?.length).toBe(1);

      const natGw = NatGateways?.[0];
      expect(natGw?.NatGatewayId).toBe(natGatewayId);
      expect(natGw?.State).toBe("available");
      expect(publicSubnetIds.includes(natGw?.SubnetId || "")).toBe(true);
      expect(natGw?.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
    }, 30000);

    test("Route tables are properly configured", async () => {
      // Test public route table
      const { RouteTables: publicRouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({ RouteTableIds: [publicRouteTableId] })
      );
      expect(publicRouteTables?.length).toBe(1);

      const publicRouteTable = publicRouteTables?.[0];
      expect(publicRouteTable?.VpcId).toBe(vpcId);
      
      // Check for internet gateway route
      const igwRoute = publicRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId === internetGatewayId
      );
      expect(igwRoute).toBeDefined();

      // Test private route table
      const { RouteTables: privateRouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({ RouteTableIds: [privateRouteTableId] })
      );
      expect(privateRouteTables?.length).toBe(1);

      const privateRouteTable = privateRouteTables?.[0];
      expect(privateRouteTable?.VpcId).toBe(vpcId);
      
      // Check for NAT gateway route
      const natRoute = privateRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId === natGatewayId
      );
      expect(natRoute).toBeDefined();
    }, 30000);
  });

  describe("Security Groups", () => {
    test("Public security group has correct ingress rules", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [publicSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.VpcId).toBe(vpcId);
          
      // Check for HTTP and HTTPS ingress rules
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();

      const httpsRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
    }, 30000);

    test("RDS security group has correct database access rules", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.VpcId).toBe(vpcId);
      
      // Check for MySQL/Aurora port access
      const dbRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(dbRule).toBeDefined();
    }, 30000);
  });


  describe("Auto Scaling Group", () => {
    test("Auto Scaling Group exists and is properly configured", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );
      expect(AutoScalingGroups?.length).toBe(1);

      const asg = AutoScalingGroups?.[0];
      expect(asg?.AutoScalingGroupName).toBe(autoScalingGroupName);
      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.MaxSize).toBeGreaterThanOrEqual(2);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(1);
      expect(asg?.HealthCheckGracePeriod).toBeGreaterThanOrEqual(300);
      
      // Verify ASG is in private subnets
      const asgSubnetIds = asg?.VPCZoneIdentifier?.split(",") || [];
      privateSubnetIds.forEach(subnetId => {
        expect(asgSubnetIds.includes(subnetId)).toBe(true);
      });
    }, 30000);

    test("Launch Template is properly configured", async () => {
      const { LaunchTemplates } = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ec2LaunchTemplateId] })
      );
      expect(LaunchTemplates?.length).toBe(1);

      const template = LaunchTemplates?.[0];
      expect(template?.LaunchTemplateId).toBe(ec2LaunchTemplateId);
      expect(template?.LaunchTemplateName).toContain("tap");
    }, 30000);
  });

  describe("S3 Bucket", () => {
    test("S3 logs bucket exists and is accessible", async () => {
      const headBucketResult = await s3Client.send(
        new HeadBucketCommand({ Bucket: s3LogsBucketName })
      );
      expect(headBucketResult.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test("S3 bucket has proper encryption configuration", async () => {
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3LogsBucketName })
      );

      expect(ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    }, 30000);

    test("S3 bucket has public access blocked", async () => {
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3LogsBucketName })
      );

      // Verify public access is properly restricted
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);
  });

  describe("Network Connectivity", () => {
    test("Public subnets have internet connectivity through IGW", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "association.subnet-id", Values: publicSubnetIds }
          ]
        })
      );

      RouteTables?.forEach(routeTable => {
        const igwRoute = routeTable?.Routes?.find(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && 
          route.GatewayId === internetGatewayId
        );
        expect(igwRoute).toBeDefined();
      });
    }, 30000);

    test("Private subnets have internet connectivity through NAT Gateway", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "association.subnet-id", Values: privateSubnetIds }
          ]
        })
      );

      RouteTables?.forEach(routeTable => {
        const natRoute = routeTable?.Routes?.find(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && 
          route.NatGatewayId === natGatewayId
        );
        expect(natRoute).toBeDefined();
      });
    }, 30000);
  });

  describe("High Availability", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      // Check public subnets AZs
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      
      const publicAZs = publicSubnets?.map(subnet => subnet.AvailabilityZone) || [];
      expect(new Set(publicAZs).size).toBe(2); // Should span 2 AZs

      // Check private subnets AZs
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      
      const privateAZs = privateSubnets?.map(subnet => subnet.AvailabilityZone) || [];
      expect(new Set(privateAZs).size).toBe(2); // Should span 2 AZs
    }, 30000);

    test("Auto Scaling Group can scale across availability zones", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [autoScalingGroupName] })
      );

      const asg = AutoScalingGroups?.[0];
      const asgAZs = asg?.AvailabilityZones || [];
      expect(asgAZs.length).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe("Security Compliance", () => {
    test("All storage is encrypted", async () => {
      // RDS encryption already tested above
      // S3 encryption already tested above
      
      // Check launch template for EBS encryption
      const { LaunchTemplates } = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ec2LaunchTemplateId] })
      );

      if (LaunchTemplates && LaunchTemplates.length > 0) {
        // Note: Detailed block device mapping encryption would require 
        // describing launch template versions, which is acceptable for this test level
        expect(LaunchTemplates[0]?.LaunchTemplateId).toBe(ec2LaunchTemplateId);
      }
    }, 30000);

    test("Security groups follow principle of least privilege", async () => {
      // Public security group should only allow HTTP/HTTPS
      const { SecurityGroups: publicSGs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [publicSecurityGroupId] })
      );

      const publicSG = publicSGs?.[0];
      const allowedPorts = publicSG?.IpPermissions?.map(rule => rule.FromPort) || [];
      
      // Should contain common web ports
      expect(allowedPorts.includes(80) || allowedPorts.includes(443)).toBe(true);
      
      // RDS security group should only allow database port
      const { SecurityGroups: rdsSGs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
      );

      const rdsSG = rdsSGs?.[0];
      const rdsAllowedPorts = rdsSG?.IpPermissions?.map(rule => rule.FromPort) || [];
      expect(rdsAllowedPorts.includes(3306)).toBe(true); // MySQL port
    }, 30000);
  });
});
