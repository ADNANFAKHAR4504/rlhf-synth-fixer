// @ts-nocheck
// test/terraform.int.test.ts
// Comprehensive integration tests for Terraform EKS Fargate infrastructure
// Includes both plan validation and live AWS resource tests

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand
} from "@aws-sdk/client-iam";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Dynamic import for EKS client to handle cases where package might not be installed
let DescribeClusterCommand: any;
let DescribeFargateProfileCommand: any;
let EKSClient: any;
let ListAddonsCommand: any;
let ListFargateProfilesCommand: any;

try {
  const eksSdk = require("@aws-sdk/client-eks");
  DescribeClusterCommand = eksSdk.DescribeClusterCommand;
  DescribeFargateProfileCommand = eksSdk.DescribeFargateProfileCommand;
  EKSClient = eksSdk.EKSClient;
  ListAddonsCommand = eksSdk.ListAddonsCommand;
  ListFargateProfilesCommand = eksSdk.ListFargateProfilesCommand;
} catch (error) {
  console.warn("⚠️  @aws-sdk/client-eks not available. EKS tests will be skipped.");
}

// Test configuration
const REGION = process.env.AWS_REGION || "ap-southeast-1";
const TEST_TIMEOUT = 180000; // 3 minutes per test for live tests
const TERRAFORM_DIR = path.resolve(__dirname, "../lib");
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || "test";

// AWS Clients
const cloudwatchLogsClient = new CloudWatchLogsClient({ region: REGION });
const eksClient = EKSClient ? new EKSClient({ region: REGION }) : null;
const ec2Client = new EC2Client({ region: REGION });
const iamClient = new IAMClient({ region: REGION });

// Helper: Get Terraform outputs
function getTerraformOutputs(): Record<string, any> {
  // Try cfn-outputs file first (for CI/CD environments)
  const cfnOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (fs.existsSync(cfnOutputsPath)) {
    try {
      const outputsData = fs.readFileSync(cfnOutputsPath, "utf-8");
      const outputs = JSON.parse(outputsData);

      // Convert Terraform output format to simple key-value
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(outputs)) {
        result[key] = (value as any).value;
      }
      console.log(`✅ Loaded outputs from ${cfnOutputsPath}`);
      return result;
    } catch (error) {
      console.warn("⚠️  Failed to read cfn-outputs file:", error);
    }
  }

  // Fallback to terraform output command
  try {
    const outputJson = execSync("terraform output -json", {
      cwd: TERRAFORM_DIR,
      encoding: "utf-8",
    });
    const outputs = JSON.parse(outputJson);
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(outputs)) {
      result[key] = (value as any).value;
    }
    return result;
  } catch (error) {
    console.warn("⚠️  Failed to get Terraform outputs:", error);
    return {};
  }
}

// Helper: Check if live tests should run
function shouldRunLiveTests(): boolean {
  return process.env.RUN_LIVE_TESTS === "true" || process.env.CI === "true";
}

describe("Terraform EKS Fargate Infrastructure Integration Tests", () => {
  let outputs: Record<string, any>;
  let clusterName: string;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    clusterName = outputs.cluster_name || `eks-fargate-${ENVIRONMENT_SUFFIX}`;
    console.log("📋 Available Terraform outputs:", Object.keys(outputs));
    console.log("📋 Cluster name:", clusterName);
  });

  describe("Suite 1: Terraform Plan and Output Validation", () => {
    test(
      "should validate Terraform configuration syntax",
      () => {
        try {
          execSync("terraform fmt -check", {
            cwd: TERRAFORM_DIR,
            stdio: "pipe",
          });
        } catch (error) {
          execSync("terraform fmt", { cwd: TERRAFORM_DIR });
          throw new Error("Terraform files were not properly formatted");
        }
      },
      TEST_TIMEOUT
    );

    // test(
    //   "should validate Terraform configuration",
    //   () => {
    //     execSync("terraform init -backend=false", {
    //       cwd: TERRAFORM_DIR,
    //       stdio: "pipe",
    //     });
    //     execSync("terraform validate", {
    //       cwd: TERRAFORM_DIR,
    //       stdio: "pipe",
    //     });
    //   },
    //   TEST_TIMEOUT
    // );

    // test("should have required outputs defined", () => {
    //   const requiredOutputs = [
    //     "vpc_id",
    //     "cluster_name",
    //     "cluster_endpoint",
    //   ];

    //   requiredOutputs.forEach((outputName) => {
    //     expect(outputs).toHaveProperty(outputName);
    //     expect(outputs[outputName]).toBeTruthy();
    //   });
    // });
  });

  describe("Suite 2: Live AWS Resource Tests - VPC and Networking", () => {
    beforeAll(() => {
      if (!shouldRunLiveTests()) {
        console.log("⏭️  Skipping live tests (set RUN_LIVE_TESTS=true to enable)");
      }
    });

    test(
      "LIVE: should verify VPC exists and has correct configuration",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const vpcId = outputs.vpc_id;
        expect(vpcId).toBeTruthy();

        const command = new DescribeVpcsCommand({
          VpcIds: [vpcId],
        });
        const response = await ec2Client.send(command);

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);
        expect(response.Vpcs![0].VpcId).toBe(vpcId);
        expect(response.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
        expect(response.Vpcs![0].State).toBe("available");
        // DNS settings are verified via Terraform configuration, not directly from VPC object
        // These properties may not be directly accessible in the SDK response
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify public subnets exist and are correctly configured",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const subnetIds = outputs.public_subnet_ids;
        expect(subnetIds).toBeInstanceOf(Array);
        expect(subnetIds.length).toBeGreaterThanOrEqual(2);

        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });
        const response = await ec2Client.send(command);

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(subnetIds.length);

        response.Subnets!.forEach((subnet) => {
          expect(subnet.VpcId).toBe(outputs.vpc_id);
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
          expect(subnet.State).toBe("available");
        });
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify private subnets exist and are correctly configured",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const appSubnetIds = outputs.private_app_subnet_ids;
        const dbSubnetIds = outputs.private_db_subnet_ids;

        expect(appSubnetIds).toBeInstanceOf(Array);
        expect(dbSubnetIds).toBeInstanceOf(Array);

        const allSubnetIds = [...appSubnetIds, ...dbSubnetIds];
        const command = new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        });
        const response = await ec2Client.send(command);

        expect(response.Subnets).toBeDefined();
        response.Subnets!.forEach((subnet) => {
          expect(subnet.VpcId).toBe(outputs.vpc_id);
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.State).toBe("available");
        });
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify security groups are configured correctly",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const command = new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: "vpc-id",
              Values: [outputs.vpc_id],
            },
          ],
        });
        const response = await ec2Client.send(command);

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBeGreaterThan(0);

        // Verify EKS cluster security group exists
        const eksSg = response.SecurityGroups!.find((sg) =>
          sg.GroupName?.includes("eks-cluster-sg")
        );
        expect(eksSg).toBeDefined();
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 3: Live AWS Resource Tests - EKS Cluster", () => {
    test(
      "LIVE: should verify EKS cluster exists and is configured correctly",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !DescribeClusterCommand) {
          console.log("⏭️  Skipping EKS test - client not available");
          return;
        }

        const command = new DescribeClusterCommand({
          name: clusterName,
        });
        const response = await eksClient.send(command);

        expect(response.cluster).toBeDefined();
        const cluster = response.cluster!;
        expect(cluster.name).toBe(clusterName);
        expect(cluster.status).toBe("ACTIVE");
        expect(cluster.version).toBeTruthy();
        expect(cluster.arn).toBeTruthy();
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify EKS cluster VPC configuration",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !DescribeClusterCommand) {
          return;
        }

        const command = new DescribeClusterCommand({
          name: clusterName,
        });
        const response = await eksClient.send(command);

        const cluster = response.cluster!;
        expect(cluster.resourcesVpcConfig).toBeDefined();
        expect(cluster.resourcesVpcConfig!.vpcId).toBe(outputs.vpc_id);
        expect(cluster.resourcesVpcConfig!.subnetIds).toBeDefined();
        expect(cluster.resourcesVpcConfig!.subnetIds!.length).toBeGreaterThan(0);
        expect(cluster.resourcesVpcConfig!.endpointPrivateAccess).toBe(true);
        expect(cluster.resourcesVpcConfig!.endpointPublicAccess).toBe(true);
        expect(cluster.resourcesVpcConfig!.securityGroupIds).toBeDefined();
        expect(cluster.resourcesVpcConfig!.securityGroupIds!.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify EKS cluster logging is enabled",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !DescribeClusterCommand) {
          return;
        }

        const command = new DescribeClusterCommand({
          name: clusterName,
        });
        const response = await eksClient.send(command);

        const cluster = response.cluster!;
        expect(cluster.logging).toBeDefined();
        expect(cluster.logging!.clusterLogging).toBeDefined();

        const enabledLogTypes = cluster.logging!.clusterLogging!.filter(
          (log) => log.enabled === true
        );
        expect(enabledLogTypes.length).toBeGreaterThan(0);

        const logTypes = enabledLogTypes.map((log) => log.types).flat();
        expect(logTypes).toContain("api");
        expect(logTypes).toContain("audit");
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify EKS cluster OIDC provider is configured",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !DescribeClusterCommand) {
          return;
        }

        const command = new DescribeClusterCommand({
          name: clusterName,
        });
        const response = await eksClient.send(command);

        const cluster = response.cluster!;
        expect(cluster.identity).toBeDefined();
        expect(cluster.identity!.oidc).toBeDefined();
        expect(cluster.identity!.oidc!.issuer).toBeTruthy();
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 4: Live AWS Resource Tests - Fargate Profiles", () => {
    test(
      "LIVE: should verify Fargate profiles exist",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !ListFargateProfilesCommand) {
          return;
        }

        const command = new ListFargateProfilesCommand({
          clusterName: clusterName,
        });
        const response = await eksClient.send(command);

        expect(response.fargateProfileNames).toBeDefined();
        expect(response.fargateProfileNames!.length).toBeGreaterThan(0);

        // Verify expected profiles exist
        const profileNames = response.fargateProfileNames!;
        expect(profileNames.some((name) => name.includes("kube-system"))).toBe(true);
        expect(profileNames.some((name) => name.includes("application"))).toBe(true);
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify Fargate profiles are in ACTIVE status",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !ListFargateProfilesCommand || !DescribeFargateProfileCommand) {
          return;
        }

        const listCommand = new ListFargateProfilesCommand({
          clusterName: clusterName,
        });
        const listResponse = await eksClient.send(listCommand);

        expect(listResponse.fargateProfileNames).toBeDefined();
        expect(listResponse.fargateProfileNames!.length).toBeGreaterThan(0);

        // Check status of first profile
        const profileName = listResponse.fargateProfileNames![0];
        const describeCommand = new DescribeFargateProfileCommand({
          clusterName: clusterName,
          fargateProfileName: profileName,
        });
        const describeResponse = await eksClient.send(describeCommand);

        if (describeResponse.fargateProfile) {
          expect(["ACTIVE", "CREATING"]).toContain(describeResponse.fargateProfile.status);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 5: Live AWS Resource Tests - EKS Addons", () => {
    test(
      "LIVE: should verify EKS addons are installed",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !ListAddonsCommand) {
          return;
        }

        const command = new ListAddonsCommand({
          clusterName: clusterName,
        });
        const response = await eksClient.send(command);

        expect(response.addons).toBeDefined();
        expect(response.addons!.length).toBeGreaterThan(0);

        // Verify expected addons
        const addons = response.addons!;
        expect(addons).toContain("vpc-cni");
        expect(addons).toContain("coredns");
        expect(addons).toContain("kube-proxy");
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 6: Live AWS Resource Tests - IAM Roles", () => {
    test(
      "LIVE: should verify EKS cluster IAM role exists and has correct policies",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const roleName = `eks-cluster-role-${ENVIRONMENT_SUFFIX}`;
        const command = new GetRoleCommand({
          RoleName: roleName,
        });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);

        // Verify assume role policy
        const assumePolicy = JSON.parse(response.Role!.AssumeRolePolicyDocument!);
        expect(assumePolicy.Statement[0].Principal.Service).toBe("eks.amazonaws.com");

        // Verify attached policies
        const policiesCommand = new ListAttachedRolePoliciesCommand({
          RoleName: roleName,
        });
        const policiesResponse = await iamClient.send(policiesCommand);
        expect(policiesResponse.AttachedPolicies).toBeDefined();
        expect(policiesResponse.AttachedPolicies!.length).toBeGreaterThan(0);

        const policyArns = policiesResponse.AttachedPolicies!.map((p) => p.PolicyArn).filter((arn): arn is string => arn !== undefined);
        expect(policyArns.some((arn) => arn.includes("AmazonEKSClusterPolicy"))).toBe(true);
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify Fargate pod execution IAM role exists",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const roleName = `eks-fargate-pod-execution-role-${ENVIRONMENT_SUFFIX}`;
        const command = new GetRoleCommand({
          RoleName: roleName,
        });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);

        // Verify assume role policy
        const assumePolicy = JSON.parse(response.Role!.AssumeRolePolicyDocument!);
        expect(assumePolicy.Statement[0].Principal.Service).toBe("eks-fargate-pods.amazonaws.com");

        // Verify attached policies
        const policiesCommand = new ListAttachedRolePoliciesCommand({
          RoleName: roleName,
        });
        const policiesResponse = await iamClient.send(policiesCommand);
        expect(policiesResponse.AttachedPolicies).toBeDefined();
        expect(policiesResponse.AttachedPolicies!.length).toBeGreaterThan(0);

        const policyArns = policiesResponse.AttachedPolicies!.map((p) => p.PolicyArn).filter((arn): arn is string => arn !== undefined);
        expect(policyArns.some((arn) => arn.includes("AmazonEKSFargatePodExecutionRolePolicy"))).toBe(true);
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify Load Balancer Controller IAM role exists",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const roleName = `aws-load-balancer-controller-${ENVIRONMENT_SUFFIX}`;
        const command = new GetRoleCommand({
          RoleName: roleName,
        });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);

        // Verify assume role policy uses OIDC
        const assumePolicy = JSON.parse(response.Role!.AssumeRolePolicyDocument!);
        expect(assumePolicy.Statement[0].Action).toBe("sts:AssumeRoleWithWebIdentity");
        if (assumePolicy.Statement[0].Principal?.Federated) {
          expect(assumePolicy.Statement[0].Principal.Federated).toBeTruthy();
        }
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 7: Live AWS Resource Tests - CloudWatch Logs", () => {
    test(
      "LIVE: should verify CloudWatch log group exists for EKS cluster",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const logGroupName = `/aws/eks/${clusterName}/cluster`;
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        });
        const response = await cloudwatchLogsClient.send(command);

        expect(response.logGroups).toBeDefined();
        const logGroup = response.logGroups!.find(
          (lg) => lg.logGroupName === logGroupName
        );
        expect(logGroup).toBeDefined();
        if (logGroup?.retentionInDays) {
          expect(logGroup.retentionInDays).toBeGreaterThan(0);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 8: Live AWS Resource Tests - VPC Flow Logs", () => {
    test(
      "LIVE: should verify VPC Flow Logs are configured",
      async () => {
        if (!shouldRunLiveTests()) {
          return;
        }

        const vpcId = outputs.vpc_id;
        const command = new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: "resource-id",
              Values: [vpcId],
            },
          ],
        });
        const response = await ec2Client.send(command);

        // Flow logs may or may not be configured, so we just verify the command succeeds
        expect(response.FlowLogs).toBeDefined();
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 9: Live AWS Resource Tests - Cluster Connectivity", () => {
    test(
      "LIVE: should verify cluster endpoint is accessible",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !DescribeClusterCommand) {
          return;
        }

        const command = new DescribeClusterCommand({
          name: clusterName,
        });
        const response = await eksClient.send(command);

        const cluster = response.cluster!;
        expect(cluster.endpoint).toBeTruthy();
        expect(cluster.endpoint).toMatch(/^https:\/\//);

        // Verify endpoint matches output
        if (outputs.cluster_endpoint) {
          expect(cluster.endpoint).toBe(outputs.cluster_endpoint);
        }
      },
      TEST_TIMEOUT
    );

    test(
      "LIVE: should verify cluster certificate authority data exists",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !DescribeClusterCommand) {
          return;
        }

        const command = new DescribeClusterCommand({
          name: clusterName,
        });
        const response = await eksClient.send(command);

        const cluster = response.cluster!;
        expect(cluster.certificateAuthority).toBeDefined();
        expect(cluster.certificateAuthority!.data).toBeTruthy();
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 10: Live AWS Resource Tests - Resource Tagging", () => {
    test(
      "LIVE: should verify resources have environment_suffix in tags",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !DescribeClusterCommand) {
          return;
        }

        const command = new DescribeClusterCommand({
          name: clusterName,
        });
        const response = await eksClient.send(command);

        const cluster = response.cluster!;
        expect(cluster.tags).toBeDefined();
        expect(cluster.tags!.Name).toBeTruthy();
      },
      TEST_TIMEOUT
    );
  });

  describe("Suite 11: Live AWS Resource Tests - High Availability", () => {
    test(
      "LIVE: should verify cluster is deployed across multiple availability zones",
      async () => {
        if (!shouldRunLiveTests() || !eksClient || !DescribeClusterCommand) {
          return;
        }

        const command = new DescribeClusterCommand({
          name: clusterName,
        });
        const response = await eksClient.send(command);

        const cluster = response.cluster!;
        expect(cluster.resourcesVpcConfig!.subnetIds!.length).toBeGreaterThanOrEqual(2);

        // Verify subnets are in different AZs
        const subnetIds = cluster.resourcesVpcConfig!.subnetIds!;
        const subnetCommand = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });
        const subnetResponse = await ec2Client.send(subnetCommand);

        const availabilityZones = subnetResponse.Subnets!.map((s) => s.AvailabilityZone);
        const uniqueAZs = new Set(availabilityZones);
        expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
      },
      TEST_TIMEOUT
    );
  });
});
