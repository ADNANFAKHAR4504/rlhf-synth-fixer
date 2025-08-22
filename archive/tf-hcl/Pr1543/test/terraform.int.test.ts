// Integration tests for Terraform infrastructure
// Tests real AWS resources using deployment outputs 

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand
} from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client as ELBv2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketLoggingCommand,
  HeadBucketCommand
} from "@aws-sdk/client-s3";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from "@aws-sdk/client-auto-scaling";
import fs from "fs";
import path from "path";

// Load deployment outputs
let outputs: any;
const outputsPath = path.join(__dirname, "../cfn-outputs/flat-outputs.json");
const fallbackPath = path.join(__dirname, "../lib/flat-outputs.json");

try {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  } else if (fs.existsSync(fallbackPath)) {
    outputs = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
  }
} catch (error) {
  console.warn("No deployment outputs found - integration tests will be skipped");
}

// AWS clients
const region = "us-west-2";
const ec2Client = new EC2Client({ region });
const elbv2Client = new ELBv2Client({ region });
const s3Client = new S3Client({ region });
const autoScalingClient = new AutoScalingClient({ region });

describe("Terraform Infrastructure Integration Tests", () => {
  const TIMEOUT = 30000;

  beforeAll(() => {
    if (!outputs) {
      console.log("Skipping integration tests - no deployment outputs available");
    }
  });

  describe("VPC Infrastructure", () => {
    test("int-vpc-exists - VPC exists and has correct configuration", async () => {
      if (!outputs?.vpc_id) {
        console.log("Skipping test - vpc_id not available in outputs");
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc.State).toBe("available");
      expect(vpc.Tags?.find(t => t.Key === "Environment")?.Value).toBe("Production");
    }, TIMEOUT);

    test("int-subnets-multi-az - Subnets deployed across multiple AZs", async () => {
      if (!outputs?.vpc_id) {
        console.log("Skipping test - vpc_id not available in outputs");
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [outputs.vpc_id] }
        ]
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      // Should have 6 subnets total (3 public + 3 private)
      expect(subnets.length).toBe(6);

      // Check public subnets
      const publicSubnets = subnets.filter(s => 
        s.Tags?.find(t => t.Key === "Type" && t.Value === "Public")
      );
      expect(publicSubnets).toHaveLength(3);

      // Check private subnets
      const privateSubnets = subnets.filter(s =>
        s.Tags?.find(t => t.Key === "Type" && t.Value === "Private")
      );
      expect(privateSubnets).toHaveLength(3);

      // Verify different AZs
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    }, TIMEOUT);

    test("int-nat-gateways-ha - NAT Gateways for high availability", async () => {
      if (!outputs?.vpc_id) {
        console.log("Skipping test - vpc_id not available in outputs");
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          { Name: "vpc-id", Values: [outputs.vpc_id] }
        ]
      });

      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];

      // Should have 3 NAT gateways for HA
      expect(natGateways).toHaveLength(3);

      // All should be in available state
      natGateways.forEach(ngw => {
        expect(ngw.State).toBe("available");
        expect(ngw.Tags?.find(t => t.Key === "Environment")?.Value).toBe("Production");
      });
    }, TIMEOUT);
  });

  describe("Security Groups", () => {
    test("int-security-groups - Security groups configured correctly", async () => {
      if (!outputs?.vpc_id) {
        console.log("Skipping test - vpc_id not available in outputs");
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [outputs.vpc_id] },
          { Name: "tag:Environment", Values: ["Production"] }
        ]
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];

      // Should have at least ALB and Web security groups
      expect(securityGroups.length).toBeGreaterThanOrEqual(2);

      const albSg = securityGroups.find(sg => sg.GroupName?.includes("alb-sg"));
      const webSg = securityGroups.find(sg => sg.GroupName?.includes("web-sg"));

      expect(albSg).toBeDefined();
      expect(webSg).toBeDefined();

      // Check ALB SG allows HTTP/HTTPS
      const albIngress = albSg?.IpPermissions || [];
      const httpRule = albIngress.find(rule => rule.FromPort === 80);
      const httpsRule = albIngress.find(rule => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    }, TIMEOUT);
  });

  describe("Load Balancer", () => {
    test("int-load-balancer - Application Load Balancer exists", async () => {
      if (!outputs?.load_balancer_dns) {
        console.log("Skipping test - load_balancer_dns not available in outputs");
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbv2Client.send(command);
      
      const loadBalancer = response.LoadBalancers?.find(lb =>
        lb.DNSName === outputs.load_balancer_dns
      );

      expect(loadBalancer).toBeDefined();
      expect(loadBalancer?.Type).toBe("application");
      expect(loadBalancer?.State?.Code).toBe("active");
      expect(loadBalancer?.Scheme).toBe("internet-facing");
    }, TIMEOUT);

    test("int-target-group - Target group configured with health checks", async () => {
      if (!outputs?.load_balancer_dns) {
        console.log("Skipping test - load_balancer_dns not available in outputs");
        return;
      }

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbv2Client.send(lbCommand);
      
      const loadBalancer = lbResponse.LoadBalancers?.find(lb =>
        lb.DNSName === outputs.load_balancer_dns
      );

      if (!loadBalancer?.LoadBalancerArn) {
        throw new Error("Load balancer not found");
      }

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: loadBalancer.LoadBalancerArn
      });
      const tgResponse = await elbv2Client.send(tgCommand);

      expect(tgResponse.TargetGroups).toHaveLength(1);
      
      const targetGroup = tgResponse.TargetGroups![0];
      expect(targetGroup.Protocol).toBe("HTTP");
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.HealthCheckEnabled).toBe(true);
      expect(targetGroup.HealthCheckPath).toBe("/");
    }, TIMEOUT);
  });

  describe("Auto Scaling", () => {
    test("int-auto-scaling-group - ASG configured correctly", async () => {
      if (!outputs?.autoscaling_group_name) {
        console.log("Skipping test - autoscaling_group_name not available in outputs");
        return;
      }

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(3);
      expect(asg.VPCZoneIdentifier).toBeDefined();
      expect(asg.HealthCheckType).toBe("ELB");
    }, TIMEOUT);

    test("int-instances-private-subnets - Instances in private subnets", async () => {
      if (!outputs?.autoscaling_group_name || !outputs?.vpc_id) {
        console.log("Skipping test - required outputs not available");
        return;
      }

      // Get instances from ASG
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      
      const instances = asgResponse.AutoScalingGroups?.[0]?.Instances || [];
      if (instances.length === 0) {
        console.log("No instances running in ASG yet");
        return;
      }

      const instanceIds = instances.map(i => i.InstanceId!);
      
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: instanceIds
      });
      const ec2Response = await ec2Client.send(ec2Command);

      const instanceDetails = ec2Response.Reservations?.flatMap(r => r.Instances || []) || [];

      // Get private subnets
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [outputs.vpc_id] },
          { Name: "tag:Type", Values: ["Private"] }
        ]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const privateSubnetIds = subnetResponse.Subnets?.map(s => s.SubnetId!) || [];

      // Verify all instances are in private subnets
      instanceDetails.forEach(instance => {
        expect(privateSubnetIds).toContain(instance.SubnetId);
        expect(instance.PublicIpAddress).toBeUndefined();
      });
    }, TIMEOUT);
  });

  describe("S3 Storage", () => {
    test("int-s3-bucket - S3 bucket exists and configured", async () => {
      if (!outputs?.s3_bucket_name) {
        console.log("Skipping test - s3_bucket_name not available in outputs");
        return;
      }

      // Check bucket exists
      const headCommand = new HeadBucketCommand({
        Bucket: outputs.s3_bucket_name
      });

      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
    }, TIMEOUT);

    test("int-s3-versioning - S3 bucket versioning enabled", async () => {
      if (!outputs?.s3_bucket_name) {
        console.log("Skipping test - s3_bucket_name not available in outputs");
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    }, TIMEOUT);

    test("int-s3-logging - S3 bucket logging configured", async () => {
      if (!outputs?.s3_bucket_name) {
        console.log("Skipping test - s3_bucket_name not available in outputs");
        return;
      }

      const command = new GetBucketLoggingCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled?.TargetBucket).toBe(outputs.s3_bucket_name);
      expect(response.LoggingEnabled?.TargetPrefix).toBe("access-logs/");
    }, TIMEOUT);
  });

  describe("Resource Tagging", () => {
    test("int-resource-tags - All resources properly tagged", async () => {
      if (!outputs?.vpc_id) {
        console.log("Skipping test - vpc_id not available in outputs");
        return;
      }

      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      
      expect(vpc.Tags?.find(t => t.Key === "Environment")?.Value).toBe("Production");
      expect(vpc.Tags?.find(t => t.Key === "Name")?.Value).toContain("production");

      // Check subnet tags
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [outputs.vpc_id] }]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      subnetResponse.Subnets?.forEach(subnet => {
        expect(subnet.Tags?.find(t => t.Key === "Environment")?.Value).toBe("Production");
        expect(subnet.Tags?.find(t => t.Key === "Name")?.Value).toContain("production");
      });
    }, TIMEOUT);
  });
});
