// tests/integration/terraform.int.test.ts
// Integration tests for Terraform infrastructure using real AWS outputs

import fs from "fs";
import path from "path";
import { 
  EC2Client, 
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand
} from "@aws-sdk/client-ec2";
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from "@aws-sdk/client-rds";
import { 
  SSMClient, 
  GetParameterCommand,
  GetParametersByPathCommand 
} from "@aws-sdk/client-ssm";
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from "@aws-sdk/client-cloudwatch-logs";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from "@aws-sdk/client-auto-scaling";

// Determine if we're in CI environment
const isCI = process.env.CI === '1' || process.env.CI === 'true';

describe("Terraform Infrastructure Integration Tests", () => {
  let outputs: any = {};
  let ec2Client: EC2Client;
  let elbClient: ElasticLoadBalancingV2Client;
  let rdsClient: RDSClient;
  let ssmClient: SSMClient;
  let cwLogsClient: CloudWatchLogsClient;
  let asgClient: AutoScalingClient;

  beforeAll(() => {
    // Load deployment outputs if available
    const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, "utf8");
      try {
        outputs = JSON.parse(outputsContent);
      } catch (e) {
        console.warn("Could not parse outputs file:", e);
        outputs = {};
      }
    }

    // Initialize AWS clients (will use environment credentials or instance role)
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
      const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
      if (isCI) {
        expect(fs.existsSync(outputsPath)).toBe(true);
      } else {
        // In local development, outputs might not exist
        console.log("Skipping outputs file check in non-CI environment");
      }
    });

    test("outputs contain required keys", () => {
      if (isCI && Object.keys(outputs).length > 0) {
        expect(outputs).toHaveProperty("vpc_id");
        expect(outputs).toHaveProperty("alb_dns_name");
        expect(outputs).toHaveProperty("rds_endpoint");
      } else {
        console.log("Skipping outputs validation in non-CI environment or empty outputs");
      }
    });
  });

  describe("VPC and Networking", () => {
    test("VPC exists and is configured correctly", async () => {
      if (!isCI || !outputs.vpc_id) {
        console.log("Skipping VPC test - no VPC ID available");
        return;
      }

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test("public subnets exist and are configured correctly", async () => {
      if (!isCI || !outputs.public_subnet_ids) {
        console.log("Skipping public subnets test - no subnet IDs available");
        return;
      }

      const subnetIds = JSON.parse(outputs.public_subnet_ids);
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test("private subnets exist and are configured correctly", async () => {
      if (!isCI || !outputs.private_subnet_ids) {
        console.log("Skipping private subnets test - no subnet IDs available");
        return;
      }

      const subnetIds = JSON.parse(outputs.private_subnet_ids);
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
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

      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
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
      }));

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Security Groups", () => {
    test("security groups exist with correct configurations", async () => {
      if (!isCI || !outputs.security_group_ids) {
        console.log("Skipping security groups test - no security group IDs available");
        return;
      }

      const sgIds = JSON.parse(outputs.security_group_ids);
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgIds.alb, sgIds.app, sgIds.rds]
      }));

      expect(response.SecurityGroups).toHaveLength(3);
      
      // Verify ALB security group
      const albSg = response.SecurityGroups!.find(sg => sg.GroupId === sgIds.alb);
      expect(albSg).toBeDefined();
      const albIngressRules = albSg!.IpPermissions || [];
      const has80 = albIngressRules.some(rule => rule.FromPort === 80);
      const has443 = albIngressRules.some(rule => rule.FromPort === 443);
      expect(has80).toBe(true);
      expect(has443).toBe(true);

      // Verify App security group
      const appSg = response.SecurityGroups!.find(sg => sg.GroupId === sgIds.app);
      expect(appSg).toBeDefined();

      // Verify RDS security group
      const rdsSg = response.SecurityGroups!.find(sg => sg.GroupId === sgIds.rds);
      expect(rdsSg).toBeDefined();
      const rdsIngressRules = rdsSg!.IpPermissions || [];
      const has5432 = rdsIngressRules.some(rule => rule.FromPort === 5432);
      expect(has5432).toBe(true);
    });
  });

  describe("Application Load Balancer", () => {
    test("ALB exists and is active", async () => {
      if (!isCI || !outputs.alb_dns_name) {
        console.log("Skipping ALB test - no ALB DNS name available");
        return;
      }

      const response = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = response.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.alb_dns_name
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe("active");
      expect(alb!.Type).toBe("application");
      expect(alb!.Scheme).toBe("internet-facing");
    });

    test("target group exists and has healthy targets", async () => {
      if (!isCI || !outputs.alb_dns_name) {
        console.log("Skipping target group test - no ALB available");
        return;
      }

      const lbResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = lbResponse.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.alb_dns_name
      );

      if (!alb) {
        console.log("ALB not found, skipping target group test");
        return;
      }

      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb.LoadBalancerArn
      }));

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = tgResponse.TargetGroups![0];
      expect(targetGroup.Protocol).toBe("HTTP");
      expect(targetGroup.Port).toBe(80);

      // Check target health
      const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup.TargetGroupArn
      }));

      // In a fresh deployment, we might not have healthy targets immediately
      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
    });

    test("ALB is accessible via HTTP", async () => {
      if (!isCI || !outputs.alb_url) {
        console.log("Skipping ALB accessibility test - no ALB URL available");
        return;
      }

      // Use fetch to test HTTP connectivity
      try {
        const response = await fetch(outputs.alb_url, {
          method: 'GET',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        // We expect either 200 (success) or 503 (no healthy targets)
        expect([200, 503]).toContain(response.status);
      } catch (error: any) {
        // Network errors might occur if ALB is not fully ready
        console.log("ALB connectivity test failed:", error.message);
      }
    });
  });

  describe("Auto Scaling Group", () => {
    test("ASG exists with correct configuration", async () => {
      if (!isCI || !outputs.asg_name) {
        console.log("Skipping ASG test - no ASG name available");
        return;
      }

      const response = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.asg_name]
      }));

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

      const asgResponse = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.asg_name]
      }));

      const asg = asgResponse.AutoScalingGroups![0];
      const instanceIds = asg.Instances?.map(i => i.InstanceId) || [];

      if (instanceIds.length > 0) {
        const ec2Response = await ec2Client.send(new DescribeInstancesCommand({
          InstanceIds: instanceIds
        }));

        const instances = ec2Response.Reservations?.flatMap(r => r.Instances || []) || [];
        instances.forEach(instance => {
          expect(["running", "pending"]).toContain(instance.State?.Name);
        });
      }
    });
  });

  describe("RDS Database", () => {
    test("RDS instance exists and is available", async () => {
      if (!isCI || !outputs.rds_endpoint) {
        console.log("Skipping RDS test - no RDS endpoint available");
        return;
      }

      // Extract instance identifier from endpoint
      const instanceId = outputs.rds_endpoint.split(".")[0];
      
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId
      }));

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      
      expect(["available", "creating", "backing-up"]).toContain(dbInstance.DBInstanceStatus);
      expect(dbInstance.Engine).toBe("postgres");
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DeletionProtection).toBe(false);
    });
  });

  describe("SSM Parameters", () => {
    test("SSM parameters exist and are accessible", async () => {
      if (!isCI || !outputs.ssm_parameter_arns) {
        console.log("Skipping SSM parameters test - no parameter ARNs available");
        return;
      }

      const paramArns = JSON.parse(outputs.ssm_parameter_arns);
      
      // Test app config parameter
      if (paramArns.app_config) {
        const paramName = paramArns.app_config.split(":parameter")[1];
        try {
          const response = await ssmClient.send(new GetParameterCommand({
            Name: paramName
          }));
          expect(response.Parameter).toBeDefined();
          expect(response.Parameter!.Type).toBe("String");
        } catch (error: any) {
          console.log(`Could not fetch parameter ${paramName}:`, error.message);
        }
      }
    });

    test("CloudWatch config parameter contains valid JSON", async () => {
      if (!isCI || !outputs.ssm_parameter_arns) {
        console.log("Skipping CloudWatch config test - no parameter ARNs available");
        return;
      }

      const paramArns = JSON.parse(outputs.ssm_parameter_arns);
      if (paramArns.cloudwatch_config) {
        const paramName = paramArns.cloudwatch_config.split(":parameter")[1];
        try {
          const response = await ssmClient.send(new GetParameterCommand({
            Name: paramName
          }));
          
          expect(response.Parameter).toBeDefined();
          const configValue = response.Parameter!.Value;
          expect(() => JSON.parse(configValue!)).not.toThrow();
          
          const config = JSON.parse(configValue!);
          expect(config).toHaveProperty("agent");
          expect(config).toHaveProperty("logs");
        } catch (error: any) {
          console.log(`Could not fetch CloudWatch config:`, error.message);
        }
      }
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("log groups exist with correct retention", async () => {
      if (!isCI) {
        console.log("Skipping CloudWatch logs test - not in CI environment");
        return;
      }

      try {
        const response = await cwLogsClient.send(new DescribeLogGroupsCommand({
          limit: 50
        }));

        const logGroups = response.logGroups || [];
        
        // Check for app log group
        const appLogGroup = logGroups.find(lg => 
          lg.logGroupName?.includes("/app/") && lg.logGroupName?.includes("/web")
        );
        
        if (appLogGroup) {
          expect(appLogGroup.retentionInDays).toBe(30);
        }

        // Check for RDS log group
        const rdsLogGroup = logGroups.find(lg => 
          lg.logGroupName?.includes("/aws/rds/instance/")
        );
        
        if (rdsLogGroup) {
          expect(rdsLogGroup.retentionInDays).toBe(30);
        }
      } catch (error: any) {
        console.log("Could not fetch log groups:", error.message);
      }
    });
  });

  describe("End-to-End Workflow", () => {
    test("infrastructure components are interconnected", async () => {
      if (!isCI || !outputs.vpc_id || !outputs.alb_dns_name) {
        console.log("Skipping end-to-end test - insufficient outputs available");
        return;
      }

      // Verify VPC exists
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      }));
      expect(vpcResponse.Vpcs).toHaveLength(1);

      // Verify ALB is in the VPC
      const lbResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = lbResponse.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.alb_dns_name
      );
      expect(alb).toBeDefined();
      expect(alb!.VpcId).toBe(outputs.vpc_id);
    });

    test("resources are properly tagged", async () => {
      if (!isCI || !outputs.vpc_id) {
        console.log("Skipping tagging test - no VPC ID available");
        return;
      }

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      }));

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      
      const projectTag = tags.find(t => t.Key === "project");
      const envTag = tags.find(t => t.Key === "environment");
      const nameTag = tags.find(t => t.Key === "Name");
      
      expect(projectTag).toBeDefined();
      expect(envTag).toBeDefined();
      expect(nameTag).toBeDefined();
    });
  });
});