// tests/integration/terraform.int.test.ts
// Integration tests for Terraform infrastructure using real AWS outputs

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from "@aws-sdk/client-auto-scaling";
import {
  CloudWatchLogsClient
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand // <-- added
  ,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  RDSClient
} from "@aws-sdk/client-rds";
import {
  SSMClient
} from "@aws-sdk/client-ssm";
import fs from "fs";
import path from "path";

// Determine if we're in CI environment
const isCI = process.env.CI === "1" || process.env.CI === "true";

describe("Terraform Infrastructure Integration Tests", () => {
  let outputs: any = {};
  let ec2Client: EC2Client;
  let elbClient: ElasticLoadBalancingV2Client;
  let rdsClient: RDSClient;
  let ssmClient: SSMClient;
  let cwLogsClient: CloudWatchLogsClient;
  let asgClient: AutoScalingClient;

  beforeAll(() => {
    const outputsPath = path.resolve(
      __dirname,
      "../cfn-outputs/flat-outputs.json"
    );
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, "utf8");
      try {
        outputs = JSON.parse(outputsContent);
      } catch (e) {
        console.warn("Could not parse outputs file:", e);
        outputs = {};
      }
    }

    const region = process.env.AWS_REGION || "us-west-2";
    ec2Client = new EC2Client({ region });
    elbClient = new ElasticLoadBalancingV2Client({ region });
    rdsClient = new RDSClient({ region });
    ssmClient = new SSMClient({ region });
    cwLogsClient = new CloudWatchLogsClient({ region });
    asgClient = new AutoScalingClient({ region });
  });

  describe("Deployment Outputs", () => {
    test("outputs file exists", () => {
      const outputsPath = path.resolve(
        __dirname,
        "../cfn-outputs/flat-outputs.json"
      );
      if (isCI) {
        expect(fs.existsSync(outputsPath)).toBe(true);
      } else {
        console.log("Skipping outputs file check in non-CI environment");
      }
    });

    test("outputs contain required keys", () => {
      if (isCI && Object.keys(outputs).length > 0) {
        expect(outputs).toHaveProperty("vpc_id");
        expect(outputs).toHaveProperty("alb_dns_name");
        expect(outputs).toHaveProperty("rds_endpoint");
      } else {
        console.log(
          "Skipping outputs validation in non-CI environment or empty outputs"
        );
      }
    });
  });

  describe("VPC and Networking", () => {
    test("VPC exists and is configured correctly", async () => {
      if (!isCI || !outputs.vpc_id) {
        console.log("Skipping VPC test - no VPC ID available");
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id]
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");

      // Fetch DNS attributes separately
      const dnsHostAttr = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs.vpc_id,
          Attribute: "enableDnsHostnames"
        })
      );
      expect(dnsHostAttr.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportAttr = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs.vpc_id,
          Attribute: "enableDnsSupport"
        })
      );
      expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);
    });

    test("public subnets exist and are configured correctly", async () => {
      if (!isCI || !outputs.public_subnet_ids) {
        console.log(
          "Skipping public subnets test - no subnet IDs available"
        );
        return;
      }

      const subnetIds = JSON.parse(outputs.public_subnet_ids);
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds
        })
      );

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test("private subnets exist and are configured correctly", async () => {
      if (!isCI || !outputs.private_subnet_ids) {
        console.log(
          "Skipping private subnets test - no subnet IDs available"
        );
        return;
      }

      const subnetIds = JSON.parse(outputs.private_subnet_ids);
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds
        })
      );

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test("NAT Gateways exist and are running", async () => {
      if (!isCI || !outputs.vpc_id) {
        console.log("Skipping NAT Gateway test - no VPC ID available");
        return;
      }

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: "vpc-id",
              Values: [outputs.vpc_id]
            },
            {
              Name: "state",
              Values: ["available"]
            }
          ]
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Security Groups", () => {
    test("security groups exist with correct configurations", async () => {
      if (!isCI || !outputs.security_group_ids) {
        console.log(
          "Skipping security groups test - no security group IDs available"
        );
        return;
      }

      const sgIds = JSON.parse(outputs.security_group_ids);
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [sgIds.alb, sgIds.app, sgIds.rds]
        })
      );

      expect(response.SecurityGroups).toHaveLength(3);

      const albSg = response.SecurityGroups!.find(
        (sg) => sg.GroupId === sgIds.alb
      );
      expect(albSg).toBeDefined();
      const albIngressRules = albSg!.IpPermissions || [];
      expect(albIngressRules.some((r) => r.FromPort === 80)).toBe(true);
      expect(albIngressRules.some((r) => r.FromPort === 443)).toBe(true);

      const appSg = response.SecurityGroups!.find(
        (sg) => sg.GroupId === sgIds.app
      );
      expect(appSg).toBeDefined();

      const rdsSg = response.SecurityGroups!.find(
        (sg) => sg.GroupId === sgIds.rds
      );
      expect(rdsSg).toBeDefined();
      const rdsIngressRules = rdsSg!.IpPermissions || [];
      expect(rdsIngressRules.some((r) => r.FromPort === 5432)).toBe(true);
    });
  });

  describe("Application Load Balancer", () => {
    // unchanged…
  });

  describe("Auto Scaling Group", () => {
    test("ASG exists with correct configuration", async () => {
      if (!isCI || !outputs.asg_name) {
        console.log("Skipping ASG test - no ASG name available");
        return;
      }

      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.asg_name]
        })
      );

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(4);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.HealthCheckType).toBe("ELB");
    });

    test("instances are running in ASG", async () => {
      if (!isCI || !outputs.asg_name) {
        console.log("Skipping instances test - no ASG name available");
        return;
      }

      const asgResponse = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.asg_name]
        })
      );

      const asg = asgResponse.AutoScalingGroups![0];
      const instanceIds = (asg.Instances || [])
        .map((i) => i.InstanceId)
        .filter((id): id is string => Boolean(id)); // ensure string[]

      if (instanceIds.length > 0) {
        const ec2Response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: instanceIds
          })
        );

        const instances =
          ec2Response.Reservations?.flatMap((r) => r.Instances || []) || [];
        instances.forEach((instance) => {
          expect(["running", "pending"]).toContain(instance.State?.Name);
        });
      }
    });
  });

  // rest of file unchanged…
});
