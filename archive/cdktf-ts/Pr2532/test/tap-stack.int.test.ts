// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand, ListRolePoliciesCommand, GetRolePolicyCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeAddressesCommand } from "@aws-sdk/client-ec2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import { Route53Client, GetHostedZoneCommand, ListResourceRecordSetsCommand } from "@aws-sdk/client-route-53";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const route53Client = new Route53Client({ region: awsRegion });

describe("TapStack Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // Get the first (and likely only) stack
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "vpc-id",
      "public-subnet-id",
      "private-subnet-id",
      "ec2-instance-id",
      "s3-bucket-name",
      "cloudwatch-alarm-arn",
      "asg-name",
      "route53-zone-id",
      "ami-id"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists with correct CIDR and DNS settings", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
    }, 20000);

    test("Public subnet exists and is properly configured", async () => {
      const subnetId = stackOutputs["public-subnet-id"];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
      
      expect(Subnets).toHaveLength(1);
      const subnet = Subnets![0];
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.VpcId).toBe(stackOutputs["vpc-id"]);
      expect(subnet.State).toBe("available");
      expect(subnet.CidrBlock).toBe("10.0.1.0/24");
    }, 20000);

    test("Private subnet exists and is properly configured", async () => {
      const subnetId = stackOutputs["private-subnet-id"];
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
      
      expect(Subnets).toHaveLength(1);
      const subnet = Subnets![0];
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.VpcId).toBe(stackOutputs["vpc-id"]);
      expect(subnet.State).toBe("available");
      expect(subnet.CidrBlock).toBe("10.0.2.0/24");
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
    }, 20000);

    test("NAT Gateway exists in public subnet with EIP", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const publicSubnetId = stackOutputs["public-subnet-id"];
      
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(NatGateways).toHaveLength(1);
      const natGateway = NatGateways![0];
      expect(natGateway.State).toBe("available");
      expect(natGateway.VpcId).toBe(vpcId);
      expect(natGateway.SubnetId).toBe(publicSubnetId);
      
      // Verify EIP is associated
      expect(natGateway.NatGatewayAddresses).toHaveLength(1);
      expect(natGateway.NatGatewayAddresses![0].AllocationId).toBeDefined();
    }, 20000);

    test("Route tables are properly configured", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const publicSubnetId = stackOutputs["public-subnet-id"];
      const privateSubnetId = stackOutputs["private-subnet-id"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have at least 3 route tables: default + public + private
      expect(RouteTables!.length).toBeGreaterThanOrEqual(3);
      
      // Check for public route table with internet gateway route
      const publicRouteTable = RouteTables?.find(rt => 
        rt.Associations?.some(assoc => assoc.SubnetId === publicSubnetId)
      );
      expect(publicRouteTable).toBeDefined();
      
      const publicInternetRoute = publicRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
      );
      expect(publicInternetRoute).toBeDefined();
      
      // Check for private route table with NAT gateway route
      const privateRouteTable = RouteTables?.find(rt => 
        rt.Associations?.some(assoc => assoc.SubnetId === privateSubnetId)
      );
      expect(privateRouteTable).toBeDefined();
      
      const privateNatRoute = privateRouteTable?.Routes?.find(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
      );
      expect(privateNatRoute).toBeDefined();
    }, 20000);
  });

  describe("Security Groups", () => {
    test("Public security group allows HTTP and SSH", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["tap-infrastructure-public-sg"] }
        ]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const publicSg = SecurityGroups![0];
      
      // Check HTTP ingress rule
      const httpRule = publicSg.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check SSH ingress rule
      const sshRule = publicSg.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check egress allows all outbound
      const egressRule = publicSg.IpPermissionsEgress?.find(rule => 
        rule.IpProtocol === "-1" && rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")
      );
      expect(egressRule).toBeDefined();
    }, 20000);

    test("Private security group allows traffic from public security group", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["tap-infrastructure-private-sg"] }
        ]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const privateSg = SecurityGroups![0];
      
      // Check ingress rule from public security group
      const ingressRule = privateSg.IpPermissions?.find(rule => 
        rule.FromPort === 0 && rule.ToPort === 65535 && rule.IpProtocol === "tcp"
      );
      expect(ingressRule).toBeDefined();
      expect(ingressRule?.UserIdGroupPairs).toHaveLength(1);
      
      // Check egress allows all outbound
      const egressRule = privateSg.IpPermissionsEgress?.find(rule => 
        rule.IpProtocol === "-1" && rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")
      );
      expect(egressRule).toBeDefined();
    }, 20000);
  });

  describe("EC2 Instance", () => {
    test("EC2 instance is running and properly configured", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      expect(Reservations).toHaveLength(1);
      const instance = Reservations![0].Instances![0];
      
      expect(instance.State?.Name).toBe("running");
      expect(instance.InstanceType).toBe("t3.micro");
      expect(instance.VpcId).toBe(stackOutputs["vpc-id"]);
      expect(instance.SubnetId).toBe(stackOutputs["public-subnet-id"]);
      expect(instance.ImageId).toBe(stackOutputs["ami-id"]);
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.PublicIpAddress).toBe(stackOutputs["ec2-public-ip"]);
    }, 30000);

    test("EC2 instance has proper IAM role and policies", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      const instanceProfileArn = instance.IamInstanceProfile?.Arn;
      const instanceProfileName = instanceProfileArn?.split('/').pop();
      
      if (instanceProfileName) {
        const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({
          InstanceProfileName: instanceProfileName
        }));
        
        expect(InstanceProfile?.Roles).toHaveLength(1);
        
        const roleName = InstanceProfile!.Roles![0].RoleName;
        const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        
        // Verify assume role policy allows EC2
        const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
        expect(
          assumeRolePolicy.Statement.some(
            (statement: any) =>
              statement.Effect === "Allow" &&
              statement.Principal.Service === "ec2.amazonaws.com"
          )
        ).toBe(true);
        
        // Check for S3 policy
        const { PolicyNames } = await iamClient.send(new ListRolePoliciesCommand({ RoleName: roleName }));
        expect(PolicyNames?.some(name => name.includes("s3"))).toBe(true);
      }
    }, 20000);
  });

  describe("Auto Scaling Group", () => {
    test("Auto Scaling Group is properly configured", async () => {
      const asgName = stackOutputs["asg-name"];
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));
      
      expect(AutoScalingGroups).toHaveLength(1);
      const asg = AutoScalingGroups![0];
      
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(5);
      expect(asg.HealthCheckType).toBe("EC2");
      expect(asg.HealthCheckGracePeriod).toBe(300);
      expect(asg.VPCZoneIdentifier).toBe(stackOutputs["private-subnet-id"]);
      expect(asg.LaunchTemplate).toBeDefined();
    }, 20000);
  });

  describe("S3 Storage Security", () => {
    test("S3 bucket exists and is accessible", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const headBucketResponse = await s3Client.send(new HeadBucketCommand({ 
        Bucket: bucketName 
      }));
      
      expect(headBucketResponse.$metadata.httpStatusCode).toBe(200);
    }, 20000);

    test("S3 bucket has AES-256 encryption enabled", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      expect(rule?.BucketKeyEnabled).toBe(true);
    }, 20000);

    test("S3 bucket has versioning enabled", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({ 
        Bucket: bucketName 
      }));
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("S3 bucket name follows naming convention", () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      expect(bucketName).toMatch(/^tap-infrastructure-app-data-[a-z0-9]+-\d+$/);
      expect(bucketName).toContain("tap-infrastructure");
      expect(bucketName).toContain("app-data");
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("CPU alarm exists and is properly configured", async () => {
      const alarmArn = stackOutputs["cloudwatch-alarm-arn"];
      const alarmName = alarmArn.split(':').pop();
      
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [alarmName!]
      }));
      
      expect(MetricAlarms).toHaveLength(1);
      const alarm = MetricAlarms![0];
      
      expect(alarm.AlarmName).toBe("tap-infrastructure-high-cpu-utilization");
      expect(alarm.MetricName).toBe("CPUUtilization");
      expect(alarm.Namespace).toBe("AWS/EC2");
      expect(alarm.Statistic).toBe("Average");
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(alarm.Dimensions).toHaveLength(1);
      expect(alarm.Dimensions![0].Name).toBe("AutoScalingGroupName");
      expect(alarm.Dimensions![0].Value).toBe(stackOutputs["asg-name"]);
    }, 20000);
  });

  describe("Route 53 DNS", () => {
    test("Route 53 hosted zone exists and is properly configured", async () => {
      const zoneId = stackOutputs["route53-zone-id"];
      const domainName = stackOutputs["domain-name"];
      
      const { HostedZone } = await route53Client.send(new GetHostedZoneCommand({
        Id: zoneId
      }));
      
      expect(HostedZone?.Name).toBe(`${domainName}.`);
      expect(HostedZone?.Config?.Comment).toContain("tap-infrastructure");
      expect(HostedZone?.Config?.PrivateZone).toBe(false);
    }, 20000);

    test("Route 53 name servers are properly configured", async () => {
      const zoneId = stackOutputs["route53-zone-id"];
      const nameServers = stackOutputs["route53-name-servers"];
      
      const { ResourceRecordSets } = await route53Client.send(new ListResourceRecordSetsCommand({
        HostedZoneId: zoneId
      }));
      
      const nsRecord = ResourceRecordSets?.find(record => record.Type === "NS");
      expect(nsRecord).toBeDefined();
      expect(nsRecord?.ResourceRecords).toHaveLength(4);
      
      // Verify name servers match output
      const recordNameServers = nsRecord?.ResourceRecords?.map(record => record.Value?.replace(/\.$/, ""));
      nameServers.forEach((ns: string) => {
        expect(recordNameServers).toContain(ns);
      });
    }, 20000);
  });

  describe("Resource Tagging and Compliance", () => {
    test("VPC resources have proper tagging", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Test VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Project" && tag.Value === "tap-infrastructure")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Name" && tag.Value === "tap-infrastructure-vpc")).toBe(true);
    }, 20000);

    test("Subnets have proper tagging", async () => {
      const publicSubnetId = stackOutputs["public-subnet-id"];
      const privateSubnetId = stackOutputs["private-subnet-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ 
        SubnetIds: [publicSubnetId, privateSubnetId] 
      }));
      
      Subnets?.forEach(subnet => {
        const subnetTags = subnet.Tags || [];
        expect(subnetTags.some(tag => tag.Key === "Project" && tag.Value === "tap-infrastructure")).toBe(true);
        expect(subnetTags.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform")).toBe(true);
        expect(subnetTags.some(tag => tag.Key === "Type")).toBe(true);
      });
    }, 20000);

    test("EC2 instance has proper tagging", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      const instanceTags = instance.Tags || [];
      
      expect(instanceTags.some(tag => tag.Key === "Project" && tag.Value === "tap-infrastructure")).toBe(true);
      expect(instanceTags.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform")).toBe(true);
      expect(instanceTags.some(tag => tag.Key === "Name" && tag.Value === "tap-infrastructure-web-instance")).toBe(true);
    }, 20000);
  });

  describe("AMI Validation", () => {
    test("AMI information is valid and up-to-date", () => {
      const amiId = stackOutputs["ami-id"];
      const amiName = stackOutputs["ami-name"];
      const creationDate = stackOutputs["ami-creation-date"];
      
      expect(amiId).toMatch(/^ami-[a-f0-9]{17}$/);
      expect(amiName).toContain("amzn2-ami-hvm");
      expect(amiName).toContain("x86_64-gp2");
      expect(new Date(creationDate)).toBeInstanceOf(Date);
      
      // AMI should be relatively recent (within last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    });
  });

  describe("Network Security", () => {
    test("Private subnet cannot directly access internet", async () => {
      const privateSubnetId = stackOutputs["private-subnet-id"];
      const vpcId = stackOutputs["vpc-id"];
      
      // Get route tables associated with private subnet
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const privateRouteTable = RouteTables?.find(rt => 
        rt.Associations?.some(assoc => assoc.SubnetId === privateSubnetId)
      );
      
      expect(privateRouteTable).toBeDefined();
      
      // Private route table should not have direct internet gateway routes
      const hasDirectInternetRoute = privateRouteTable?.Routes?.some(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
      );
      expect(hasDirectInternetRoute).toBe(false);
      
      // Should have NAT gateway route instead
      const hasNatRoute = privateRouteTable?.Routes?.some(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
      );
      expect(hasNatRoute).toBe(true);
    }, 20000);
  });

  describe("Output Validation", () => {
    test("All required outputs are present and valid", () => {
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["public-subnet-id"]).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(stackOutputs["private-subnet-id"]).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(stackOutputs["ec2-instance-id"]).toMatch(/^i-[a-f0-9]{17}$/);
      expect(stackOutputs["s3-bucket-name"]).toMatch(/^[a-z0-9-]+$/);
      expect(stackOutputs["cloudwatch-alarm-arn"]).toMatch(/^arn:aws:cloudwatch:/);
      expect(stackOutputs["route53-zone-id"]).toMatch(/^Z[A-Z0-9]+$/);
      expect(stackOutputs["asg-name"]).toBe("tap-infrastructure-asg");
      expect(stackOutputs["vpc-cidr"]).toBe("10.0.0.0/16");
    });

    test("Domain name follows expected pattern", () => {
      const domainName = stackOutputs["domain-name"];
      expect(domainName).toMatch(/^[a-z0-9-]+\.tap-infrastructure\.com$/);
      expect(domainName).toContain("tap-infrastructure.com");
    });

    test("S3 bucket ARN is properly formatted", () => {
      const bucketArn = stackOutputs["s3-bucket-arn"];
      const bucketName = stackOutputs["s3-bucket-name"];
      
      expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);
      expect(bucketArn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
    });

    test("Route 53 zone ARN is properly formatted", () => {
      const zoneArn = stackOutputs["route53-zone-arn"];
      const zoneId = stackOutputs["route53-zone-id"];
      
      expect(zoneArn).toBe(`arn:aws:route53:::hostedzone/${zoneId}`);
      expect(zoneArn).toMatch(/^arn:aws:route53:::hostedzone\/Z[A-Z0-9]+$/);
    });
  });

  describe("High Availability Configuration", () => {
    test("Resources are distributed across different availability zones", async () => {
      const publicSubnetId = stackOutputs["public-subnet-id"];
      const privateSubnetId = stackOutputs["private-subnet-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ 
        SubnetIds: [publicSubnetId, privateSubnetId] 
      }));
      
      const availabilityZones = Subnets?.map(subnet => subnet.AvailabilityZone);
      
      // Public and private subnets should be in different AZs
      expect(availabilityZones![0]).not.toBe(availabilityZones![1]);
      
      // Verify AZs are in the correct region
      availabilityZones?.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);
  });
});