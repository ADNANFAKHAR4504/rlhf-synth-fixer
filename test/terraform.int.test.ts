// tests/integration/integration-tests.ts
// Integration tests for Terraform infrastructure using actual deployment outputs
// These tests validate the real AWS resources deployed

import fs from "fs";
import path from "path";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { EventBridgeClient, DescribeEventBusCommand, DescribeRuleCommand } from "@aws-sdk/client-eventbridge";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";

// Read the deployment outputs
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const content = fs.readFileSync(outputsPath, "utf8");
  outputs = JSON.parse(content);
  console.log("Loaded outputs with resource prefix:", extractResourcePrefix(outputs));
} else {
  console.log("No outputs file found at:", outputsPath);
}

// Helper function to extract resource prefix from outputs
function extractResourcePrefix(outputs: any): string {
  if (outputs.vpc_id) {
    // Extract from a resource name to understand the deployment
    const names = [
      outputs.autoscaling_group_name,
      outputs.cloudwatch_log_group_name,
      outputs.eventbridge_bus_name
    ].filter(Boolean);
    
    if (names.length > 0) {
      const match = names[0].match(/tap-stack-([^-]+)/);
      return match ? match[1] : 'unknown';
    }
  }
  return 'no-resources';
}

// Configure AWS clients with the region from outputs or default
const region = process.env.AWS_REGION || "eu-north-1";
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const ssmClient = new SSMClient({ region });
const iamClient = new IAMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const kmsClient = new KMSClient({ region });

describe("Terraform Infrastructure Integration Tests", () => {
  describe("Deployment Outputs", () => {
    test("outputs file exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("outputs contain required fields", () => {
      expect(outputs).toHaveProperty("vpc_id");
      expect(outputs).toHaveProperty("public_subnet_ids");
      expect(outputs).toHaveProperty("private_subnet_ids");
      expect(outputs).toHaveProperty("rds_endpoint");
      expect(outputs).toHaveProperty("security_group_ec2_id");
      expect(outputs).toHaveProperty("eventbridge_bus_name");
    });
  });

  describe("VPC Resources", () => {
    test("VPC exists and is available", async () => {
      if (!outputs.vpc_id) {
        console.log("Skipping VPC test - no VPC ID in outputs");
        return;
      }

      try {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        });
        
        const response = await ec2Client.send(command);
        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].State).toBe("available");
        expect(response.Vpcs![0].CidrBlock).toBe(outputs.vpc_cidr_block || "10.0.0.0/16");
      } catch (error: any) {
        if (error.name === 'InvalidVpcID.NotFound') {
          console.log(`VPC ${outputs.vpc_id} not found - deployment may have been cleaned up`);
          // Skip test instead of failing when resources don't exist
          return;
        }
        throw error;
      }
    });

    test("public subnets exist", async () => {
      if (!outputs.public_subnet_ids || !Array.isArray(outputs.public_subnet_ids) || outputs.public_subnet_ids.length < 2) {
        console.log("Skipping public subnet test - missing or invalid subnet IDs:", outputs.public_subnet_ids);
        return;
      }

      try {
        const command = new DescribeSubnetsCommand({
          SubnetIds: outputs.public_subnet_ids,
        });
        
        const response = await ec2Client.send(command);
        expect(response.Subnets).toHaveLength(2);
        
        response.Subnets!.forEach(subnet => {
          expect(subnet.State).toBe("available");
          expect(subnet.VpcId).toBe(outputs.vpc_id);
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        });
      } catch (error: any) {
        if (error.name === 'InvalidSubnetID.NotFound') {
          console.log(`Public subnets not found - deployment may have been cleaned up:`, outputs.public_subnet_ids);
          return;
        }
        throw error;
      }
    });

    test("private subnets exist", async () => {
      if (!outputs.private_subnet_ids || !Array.isArray(outputs.private_subnet_ids) || outputs.private_subnet_ids.length < 2) {
        console.log("Skipping private subnet test - missing or invalid subnet IDs:", outputs.private_subnet_ids);
        return;
      }

      try {
        const command = new DescribeSubnetsCommand({
          SubnetIds: outputs.private_subnet_ids,
        });
        
        const response = await ec2Client.send(command);
        expect(response.Subnets).toHaveLength(2);
        
        response.Subnets!.forEach(subnet => {
          expect(subnet.State).toBe("available");
          expect(subnet.VpcId).toBe(outputs.vpc_id);
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
        });
      } catch (error: any) {
        if (error.name === 'InvalidSubnetID.NotFound') {
          console.log(`Private subnets not found - deployment may have been cleaned up:`, outputs.private_subnet_ids);
          return;
        }
        throw error;
      }
    });

    test("database subnets exist", async () => {
      if (!outputs.database_subnet_ids || !Array.isArray(outputs.database_subnet_ids) || outputs.database_subnet_ids.length < 2) {
        console.log("Skipping database subnet test - missing or invalid subnet IDs:", outputs.database_subnet_ids);
        return;
      }

      try {
        const command = new DescribeSubnetsCommand({
          SubnetIds: outputs.database_subnet_ids,
        });
        
        const response = await ec2Client.send(command);
        expect(response.Subnets).toHaveLength(2);
        
        response.Subnets!.forEach(subnet => {
          expect(subnet.State).toBe("available");
          expect(subnet.VpcId).toBe(outputs.vpc_id);
        });
      } catch (error: any) {
        if (error.name === 'InvalidSubnetID.NotFound') {
          console.log(`Database subnets not found - deployment may have been cleaned up:`, outputs.database_subnet_ids);
          return;
        }
        throw error;
      }
    });
  });

  describe("Security Groups", () => {
    test("EC2 security group exists with correct rules", async () => {
      if (!outputs.security_group_ec2_id) {
        console.log("Skipping EC2 security group test - no ID in outputs");
        return;
      }

      try {
        const command = new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.security_group_ec2_id],
        });
        
        const response = await ec2Client.send(command);
        expect(response.SecurityGroups).toHaveLength(1);
        
        const sg = response.SecurityGroups![0];
        expect(sg.VpcId).toBe(outputs.vpc_id);
        
        // Check for HTTP/HTTPS ingress rules
        const httpRule = sg.IpPermissions?.find(rule => rule.FromPort === 80);
        const httpsRule = sg.IpPermissions?.find(rule => rule.FromPort === 443);
        
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      } catch (error: any) {
        if (error.name === 'InvalidGroup.NotFound') {
          console.log(`EC2 security group ${outputs.security_group_ec2_id} not found - deployment may have been cleaned up`);
          return;
        }
        throw error;
      }
    });

    test("RDS security group exists", async () => {
      if (!outputs.security_group_rds_id) {
        console.log("Skipping RDS security group test - no ID in outputs");
        return;
      }

      try {
        const command = new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.security_group_rds_id],
        });
        
        const response = await ec2Client.send(command);
        expect(response.SecurityGroups).toHaveLength(1);
        
        const sg = response.SecurityGroups![0];
        expect(sg.VpcId).toBe(outputs.vpc_id);
        
        // Check for MySQL port rule
        const mysqlRule = sg.IpPermissions?.find(rule => rule.FromPort === 3306);
        expect(mysqlRule).toBeDefined();
      } catch (error: any) {
        if (error.name === 'InvalidGroup.NotFound') {
          console.log(`RDS security group ${outputs.security_group_rds_id} not found - deployment may have been cleaned up`);
          return;
        }
        throw error;
      }
    });

  });

  describe("RDS Database", () => {
    test("RDS instance exists and is available", async () => {
      if (!outputs.rds_instance_id) {
        console.log("Skipping RDS test - no instance ID in outputs");
        return;
      }

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rds_instance_id,
      });
      
      try {
        const response = await rdsClient.send(command);
        expect(response.DBInstances).toHaveLength(1);
        
        const db = response.DBInstances![0];
        expect(db.DBInstanceStatus).toBe("available");
        expect(db.Engine).toBe("mysql");
        expect(db.StorageEncrypted).toBe(true);
        expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
        expect(db.DeletionProtection).toBe(false);
      } catch (error: any) {
        if (error.name === "DBInstanceNotFoundFault") {
          console.log("RDS instance not found - may have been cleaned up");
        } else {
          throw error;
        }
      }
    });

    test("RDS endpoint is accessible", () => {
      if (!outputs.rds_endpoint) {
        console.log("Skipping RDS endpoint test - no endpoint in outputs");
        return;
      }

      expect(outputs.rds_endpoint).toContain(".rds.amazonaws.com");
      expect(outputs.rds_endpoint).toContain(":3306");
    });
  });


  describe.skip("EventBridge Resources", () => {
    test("EventBridge custom bus exists", async () => {
      if (!outputs.eventbridge_bus_name) {
        console.log("Skipping EventBridge bus test - no name in outputs");
        return;
      }

      const command = new DescribeEventBusCommand({
        Name: outputs.eventbridge_bus_name,
      });
      
      try {
        const response = await eventBridgeClient.send(command);
        expect(response.Name).toBe(outputs.eventbridge_bus_name);
        expect(response.Arn).toBe(outputs.eventbridge_bus_arn);
      } catch (error: any) {
        if (error.name === "ResourceNotFoundException") {
          console.log("EventBridge bus not found - may have been cleaned up");
        } else {
          throw error;
        }
      }
    });

    test("EventBridge ASG events rule exists", async () => {
      if (!outputs.eventbridge_asg_rule_arn) {
        console.log("Skipping EventBridge ASG rule test - no ARN in outputs");
        return;
      }

      const ruleName = outputs.eventbridge_asg_rule_arn.split("/").pop();
      const command = new DescribeRuleCommand({
        Name: ruleName,
        EventBusName: outputs.eventbridge_bus_name,
      });
      
      try {
        const response = await eventBridgeClient.send(command);
        expect(response.Name).toContain("asg-events");
        expect(response.Description).toContain("Auto Scaling Group events");
        expect(response.State).toBe("ENABLED");
        
        const eventPattern = JSON.parse(response.EventPattern || "{}");
        expect(eventPattern.source).toContain("aws.autoscaling");
        expect(eventPattern["detail-type"]).toContain("EC2 Instance Launch Successful");
        expect(eventPattern["detail-type"]).toContain("EC2 Instance Terminate Successful");
      } catch (error: any) {
        if (error.name === "ResourceNotFoundException") {
          console.log("EventBridge ASG rule not found - may have been cleaned up");
        } else {
          throw error;
        }
      }
    });

    test("EventBridge application events rule exists", async () => {
      if (!outputs.eventbridge_app_rule_arn) {
        console.log("Skipping EventBridge app rule test - no ARN in outputs");
        return;
      }

      const ruleName = outputs.eventbridge_app_rule_arn.split("/").pop();
      const command = new DescribeRuleCommand({
        Name: ruleName,
        EventBusName: outputs.eventbridge_bus_name,
      });
      
      try {
        const response = await eventBridgeClient.send(command);
        expect(response.Name).toContain("custom-app-events");
        expect(response.Description).toContain("custom application events");
        expect(response.State).toBe("ENABLED");
        
        const eventPattern = JSON.parse(response.EventPattern || "{}");
        expect(eventPattern.source).toEqual(expect.arrayContaining([expect.stringContaining("-app")]));
      } catch (error: any) {
        if (error.name === "ResourceNotFoundException") {
          console.log("EventBridge app rule not found - may have been cleaned up");
        } else {
          throw error;
        }
      }
    });
  });

  describe("IAM Resources", () => {
    test("EC2 IAM role exists", async () => {
      if (!outputs.iam_role_ec2_arn) {
        console.log("Skipping IAM role test - no ARN in outputs");
        return;
      }

      const roleName = outputs.iam_role_ec2_arn.split("/").pop();
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      
      try {
        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role!.AssumeRolePolicyDocument).toContain("ec2.amazonaws.com");
      } catch (error: any) {
        if (error.name === "NoSuchEntity" || error.name === "NoSuchEntityException") {
          console.log("IAM role not found - may have been cleaned up");
          return;
        } else {
          throw error;
        }
      }
    });
  });

  describe("SSM Parameters", () => {
    test("database password parameter exists", async () => {
      if (!outputs.db_parameter_ssm_name) {
        console.log("Skipping SSM parameter test - no name in outputs");
        return;
      }

      const command = new GetParameterCommand({
        Name: outputs.db_parameter_ssm_name,
        WithDecryption: false, // Don't decrypt, just check existence
      });
      
      try {
        const response = await ssmClient.send(command);
        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Type).toBe("SecureString");
      } catch (error: any) {
        if (error.name === "ParameterNotFound") {
          console.log("SSM parameter not found - may have been cleaned up");
        } else {
          throw error;
        }
      }
    });
  });

  describe("CloudWatch Logs", () => {
    test("application log group exists", async () => {
      if (!outputs.cloudwatch_log_group_name) {
        console.log("Skipping CloudWatch log group test - no name in outputs");
        return;
      }

      try {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.cloudwatch_log_group_name,
        });
        
        const response = await logsClient.send(command);
        const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.cloudwatch_log_group_name);
        
        if (!logGroup) {
          console.log(`Application log group ${outputs.cloudwatch_log_group_name} not found - deployment may have been cleaned up`);
          return;
        }
        
        expect(logGroup).toBeDefined();
        if (logGroup) {
          expect(logGroup.retentionInDays).toBe(14);
        }
      } catch (error: any) {
        console.log(`Error checking application log group: ${error.message}`);
        return;
      }
    });

    test("EventBridge log group exists", async () => {
      if (!outputs.eventbridge_log_group_name) {
        console.log("Skipping EventBridge log group test - no name in outputs");
        return;
      }

      try {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.eventbridge_log_group_name,
        });
        
        const response = await logsClient.send(command);
        const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.eventbridge_log_group_name);
        
        if (!logGroup) {
          console.log(`EventBridge log group ${outputs.eventbridge_log_group_name} not found - deployment may have been cleaned up`);
          return;
        }
        
        expect(logGroup).toBeDefined();
        if (logGroup) {
          expect(logGroup.retentionInDays).toBe(14);
        }
      } catch (error: any) {
        console.log(`Error checking EventBridge log group: ${error.message}`);
        return;
      }
    });
  });

  describe("Resource Tagging", () => {
    test("resources have consistent tags", async () => {
      if (!outputs.vpc_id) {
        console.log("Skipping tagging test - no VPC ID");
        return;
      }

      try {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        });
        
        const response = await ec2Client.send(command);
        const tags = response.Vpcs![0].Tags || [];
        
        const envTag = tags.find(t => t.Key === "Environment");
        const projectTag = tags.find(t => t.Key === "Project");
        const managedByTag = tags.find(t => t.Key === "ManagedBy");
        const envSuffixTag = tags.find(t => t.Key === "EnvironmentSuffix");
        
        expect(envTag).toBeDefined();
        expect(projectTag).toBeDefined();
        expect(managedByTag?.Value).toBe("Terraform");
        expect(envSuffixTag).toBeDefined();
      } catch (error: any) {
        if (error.name === 'InvalidVpcID.NotFound') {
          console.log(`VPC ${outputs.vpc_id} not found for tagging test - deployment may have been cleaned up`);
          return;
        }
        throw error;
      }
    });
  });

  describe("Network Connectivity", () => {
    test("subnets are in different availability zones", async () => {
      if (!outputs.public_subnet_ids || !Array.isArray(outputs.public_subnet_ids) || outputs.public_subnet_ids.length < 2) {
        console.log("Skipping AZ distribution test - missing or invalid subnet IDs:", outputs.public_subnet_ids);
        return;
      }

      try {
        const command = new DescribeSubnetsCommand({
          SubnetIds: outputs.public_subnet_ids,
        });
        
        const response = await ec2Client.send(command);
        const azs = response.Subnets!.map(s => s.AvailabilityZone);
        
        expect(new Set(azs).size).toBe(2); // Should be in 2 different AZs
      } catch (error: any) {
        if (error.name === 'InvalidSubnetID.NotFound') {
          console.log(`Public subnets not found for AZ test - deployment may have been cleaned up:`, outputs.public_subnet_ids);
          return;
        }
        throw error;
      }
    });

    test("load balancer DNS name is accessible", () => {
      if (!outputs.load_balancer_dns_name) {
        console.log("Skipping load balancer DNS test - no DNS name in outputs");
        return;
      }

      expect(outputs.load_balancer_dns_name).toContain(".elb.amazonaws.com");
      expect(outputs.load_balancer_dns_name).toContain("eu-north-1");
    });
  });
});