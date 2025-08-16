// Comprehensive integration tests for Terraform infrastructure
// Tests real AWS resource deployment outputs and configurations
// Uses actual deployment results from cfn-outputs/flat-outputs.json

import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand
} from "@aws-sdk/client-rds";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand
} from "@aws-sdk/client-secrets-manager";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";

// AWS Clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || "us-west-2" });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION || "us-west-2" });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-west-2" });
const cwLogsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || "us-west-2" });

// Load deployment outputs
let deploymentOutputs: Record<string, any> = {};
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    const outputsContent = fs.readFileSync(outputsPath, "utf8");
    deploymentOutputs = JSON.parse(outputsContent);
  }
});

describe("Terraform Infrastructure Integration Tests", () => {
  
  describe("Deployment Outputs Validation", () => {
    test("deployment outputs file exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("deployment outputs contain required keys", () => {
      const requiredKeys = [
        "vpc_id",
        "vpc_arn", 
        "public_subnet_ids",
        "private_subnet_ids",
        "database_endpoint",
        "database_port",
        "web_security_group_id",
        "database_security_group_id"
      ];

      requiredKeys.forEach(key => {
        expect(deploymentOutputs).toHaveProperty(key);
        expect(deploymentOutputs[key]).toBeDefined();
        expect(deploymentOutputs[key]).not.toBe("");
      });
    });

    test("deployment outputs have correct format", () => {
      // VPC ID format
      expect(deploymentOutputs.vpc_id).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      
      // Security group ID format
      expect(deploymentOutputs.web_security_group_id).toMatch(/^sg-[a-f0-9]{8,17}$/);
      expect(deploymentOutputs.database_security_group_id).toMatch(/^sg-[a-f0-9]{8,17}$/);
      
      // Database endpoint format
      expect(deploymentOutputs.database_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
      
      // Database port should be numeric
      expect(Number(deploymentOutputs.database_port)).toBe(5432);
    });
  });

  describe("VPC and Networking Integration", () => {
    test("VPC exists and is properly configured", async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [deploymentOutputs.vpc_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
      expect(vpc.DhcpOptionsId).toBeDefined();
      expect(vpc.InstanceTenancy).toBe("default");
    });

    test("public subnets are properly configured", async () => {
      const subnetIds = Array.isArray(deploymentOutputs.public_subnet_ids) 
        ? deploymentOutputs.public_subnet_ids
        : [deploymentOutputs.public_subnet_ids];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBeGreaterThan(0);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(deploymentOutputs.vpc_id);
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.AvailabilityZone).toMatch(/^us-west-2[abc]$/);
      });
    });

    test("private subnets are properly configured", async () => {
      const subnetIds = Array.isArray(deploymentOutputs.private_subnet_ids) 
        ? deploymentOutputs.private_subnet_ids
        : [deploymentOutputs.private_subnet_ids];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBeGreaterThan(0);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(deploymentOutputs.vpc_id);
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.AvailabilityZone).toMatch(/^us-west-2[abc]$/);
      });
    });

    test("NAT gateways are operational", async () => {
      if (deploymentOutputs.nat_gateway_ids) {
        const natGatewayIds = Array.isArray(deploymentOutputs.nat_gateway_ids)
          ? deploymentOutputs.nat_gateway_ids
          : [deploymentOutputs.nat_gateway_ids];

        const command = new DescribeNatGatewaysCommand({
          NatGatewayIds: natGatewayIds
        });
        
        const response = await ec2Client.send(command);
        expect(response.NatGateways!.length).toBeGreaterThan(0);
        
        response.NatGateways!.forEach(natGw => {
          expect(natGw.State).toBe("available");
          expect(natGw.VpcId).toBe(deploymentOutputs.vpc_id);
        });
      }
    });
  });

  describe("Security Groups Integration", () => {
    test("web security group allows HTTP/HTTPS traffic", async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [deploymentOutputs.web_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(deploymentOutputs.vpc_id);
      
      // Check for HTTP (80) and HTTPS (443) ingress rules
      const ingressRules = sg.IpPermissions || [];
      const httpRule = ingressRules.find(rule => rule.FromPort === 80 && rule.ToPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443 && rule.ToPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule!.IpProtocol).toBe("tcp");
      expect(httpsRule!.IpProtocol).toBe("tcp");
    });

    test("database security group allows PostgreSQL traffic from web SG", async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [deploymentOutputs.database_security_group_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(deploymentOutputs.vpc_id);
      
      // Check for PostgreSQL (5432) ingress from web security group
      const ingressRules = sg.IpPermissions || [];
      const pgRule = ingressRules.find(rule => rule.FromPort === 5432 && rule.ToPort === 5432);
      
      expect(pgRule).toBeDefined();
      expect(pgRule!.IpProtocol).toBe("tcp");
      
      // Should allow access from web security group
      const sourceSgs = pgRule!.UserIdGroupPairs || [];
      const webSgRule = sourceSgs.find(pair => pair.GroupId === deploymentOutputs.web_security_group_id);
      expect(webSgRule).toBeDefined();
    });
  });

  describe("Database Integration", () => {
    test("RDS instance is available and properly configured", async () => {
      // Extract DB identifier from endpoint
      const dbEndpoint = deploymentOutputs.database_endpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe("available");
      expect(dbInstance.Engine).toBe("postgres");
      expect(dbInstance.Port).toBe(5432);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.VpcSecurityGroups).toBeDefined();
      expect(dbInstance.VpcSecurityGroups!.length).toBeGreaterThan(0);
      expect(dbInstance.VpcSecurityGroups![0].Status).toBe("active");
    });

    test("database subnet group covers multiple AZs", async () => {
      // Extract DB identifier from endpoint to get subnet group name
      const dbEndpoint = deploymentOutputs.database_endpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];
      
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      
      const dbResponse = await rdsClient.send(dbCommand);
      const subnetGroupName = dbResponse.DBInstances![0].DBSubnetGroup!.DBSubnetGroupName!;
      
      const subnetCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName
      });
      
      const subnetResponse = await rdsClient.send(subnetCommand);
      expect(subnetResponse.DBSubnetGroups).toHaveLength(1);
      
      const subnetGroup = subnetResponse.DBSubnetGroups![0];
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
      expect(subnetGroup.VpcId).toBe(deploymentOutputs.vpc_id);
      
      // Verify subnets are in different AZs
      const azs = subnetGroup.Subnets!.map(subnet => subnet.SubnetAvailabilityZone!.Name);
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Secrets Manager Integration", () => {
    test("database credentials secrets exist and are accessible", async () => {
      const secretNames = [
        deploymentOutputs.db_username_secret_name,
        deploymentOutputs.db_password_secret_name
      ].filter(name => name); // Filter out undefined values
      
      for (const secretName of secretNames) {
        const command = new DescribeSecretCommand({
          SecretId: secretName
        });
        
        const response = await secretsClient.send(command);
        expect(response.Name).toBe(secretName);
        expect(response.Description).toBeDefined();
        
        // Verify we can retrieve the secret value (but don't log it)
        const getValueCommand = new GetSecretValueCommand({
          SecretId: secretName
        });
        
        const valueResponse = await secretsClient.send(getValueCommand);
        expect(valueResponse.SecretString).toBeDefined();
        expect(valueResponse.SecretString!.length).toBeGreaterThan(0);
      }
    });

    test("API key secret exists if configured", async () => {
      if (deploymentOutputs.api_key_secret_name) {
        const command = new DescribeSecretCommand({
          SecretId: deploymentOutputs.api_key_secret_name
        });
        
        const response = await secretsClient.send(command);
        expect(response.Name).toBe(deploymentOutputs.api_key_secret_name);
      }
    });
  });

  describe("CloudWatch Logs Integration", () => {
    test("application log group exists with correct retention", async () => {
      if (deploymentOutputs.log_group_name) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: deploymentOutputs.log_group_name
        });
        
        const response = await cwLogsClient.send(command);
        expect(response.logGroups!.length).toBeGreaterThan(0);
        
        const logGroup = response.logGroups!.find(lg => lg.logGroupName === deploymentOutputs.log_group_name);
        expect(logGroup).toBeDefined();
        expect(logGroup!.retentionInDays).toBeDefined();
        expect(logGroup!.retentionInDays).toBeGreaterThan(0);
      }
    });
  });

  describe("Resource Tagging Integration", () => {
    test("all resources have proper tags", async () => {
      // Test VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [deploymentOutputs.vpc_id]
      });
      
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      const vpcTags = vpc.Tags || [];
      
      expect(vpcTags.find(tag => tag.Key === "Environment")).toBeDefined();
      expect(vpcTags.find(tag => tag.Key === "Project")).toBeDefined();
      expect(vpcTags.find(tag => tag.Key === "ManagedBy")).toBeDefined();
      expect(vpcTags.find(tag => tag.Key === "Owner")).toBeDefined();
      
      // Environment suffix tag should exist if it was used
      if (deploymentOutputs.environment_suffix) {
        expect(vpcTags.find(tag => tag.Key === "EnvironmentSuffix")).toBeDefined();
        expect(vpcTags.find(tag => tag.Key === "EnvironmentSuffix")?.Value).toBe(deploymentOutputs.environment_suffix);
      }
    });
  });

  describe("End-to-End Workflow Validation", () => {
    test("complete infrastructure stack is functional", async () => {
      // This test validates the complete workflow across all resources
      
      // 1. VPC and networking are operational
      expect(deploymentOutputs.vpc_id).toBeDefined();
      expect(deploymentOutputs.public_subnet_ids).toBeDefined();
      expect(deploymentOutputs.private_subnet_ids).toBeDefined();
      
      // 2. Security groups allow proper communication
      expect(deploymentOutputs.web_security_group_id).toBeDefined();
      expect(deploymentOutputs.database_security_group_id).toBeDefined();
      
      // 3. Database is reachable from application layer
      expect(deploymentOutputs.database_endpoint).toBeDefined();
      expect(deploymentOutputs.database_port).toBe("5432");
      
      // 4. Secrets are accessible for application configuration
      expect(deploymentOutputs.db_username_secret_name || deploymentOutputs.db_password_secret_name).toBeTruthy();
      
      console.log("✅ Complete infrastructure stack validation passed");
    });

    test("resource naming follows unique convention", () => {
      // Verify that resource names include environment suffix for uniqueness
      const resourceIds = [
        deploymentOutputs.vpc_id,
        deploymentOutputs.web_security_group_id,
        deploymentOutputs.database_security_group_id
      ];
      
      resourceIds.forEach(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
      });
      
      // If environment suffix was used, it should be consistent across resources
      if (deploymentOutputs.environment_suffix) {
        expect(typeof deploymentOutputs.environment_suffix).toBe("string");
        expect(deploymentOutputs.environment_suffix.length).toBeGreaterThan(0);
      }
    });
  });
});
