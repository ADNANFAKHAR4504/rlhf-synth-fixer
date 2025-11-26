// Live Integration tests for EKS Terraform infrastructure
// These tests validate deployed resources in AWS using environment variables and AWS SDK

import * as fs from "fs";
import * as path from "path";
import { EC2Client, DescribeVpcsCommand, DescribeVpcEndpointsCommand } from "@aws-sdk/client-ec2";
import { EKSClient, DescribeClusterCommand } from "@aws-sdk/client-eks";
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, ListOpenIDConnectProvidersCommand } from "@aws-sdk/client-iam";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";

// Get environment suffix from environment variable (optional if outputs exist)
function getEnvironmentSuffix(): string {
  const suffix = process.env.ENVIRONMENT_SUFFIX;
  if (!suffix) {
    console.warn("ENVIRONMENT_SUFFIX environment variable not set");
  }
  return suffix || "";
}

// Get AWS region from environment variable
function getAwsRegion(): string {
  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION environment variable is required for integration tests");
  }
  return region;
}

// Load CloudFormation/Terraform outputs if available
function loadOutputs(): any {
  try {
    const outputPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
    if (fs.existsSync(outputPath)) {
      return JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    }
  } catch (error) {
    console.warn("Could not load outputs file:", error);
  }
  return {};
}

describe("EKS Live Integration Tests", () => {
  let envSuffix: string;
  let region: string;
  let clusterName: string;
  let vpcName: string;
  let outputs: any;
  let ec2Client: EC2Client;
  let eksClient: EKSClient;
  let iamClient: IAMClient;
  let logsClient: CloudWatchLogsClient;

  beforeAll(() => {
    outputs = loadOutputs();

    // If outputs are available, extract cluster name, region, and env suffix from them
    if (outputs.cluster_name) {
      clusterName = outputs.cluster_name;
      // Extract suffix from cluster name (e.g., "eks-cluster-pr7319" -> "pr7319")
      const match = clusterName.match(/eks-cluster-(.+)$/);
      envSuffix = match ? match[1] : getEnvironmentSuffix();

      // Extract region from kubeconfig command if available
      if (outputs.kubeconfig_update_command) {
        const regionMatch = outputs.kubeconfig_update_command.match(/--region\s+(\S+)/);
        region = regionMatch ? regionMatch[1] : getAwsRegion();
      } else {
        region = getAwsRegion();
      }
    } else {
      // Fall back to environment variables
      envSuffix = getEnvironmentSuffix();
      region = getAwsRegion();
      clusterName = `eks-cluster-${envSuffix}`;
    }

    vpcName = `eks-vpc-${envSuffix}`;

    console.log(`Using cluster: ${clusterName}, region: ${region}, suffix: ${envSuffix}`);

    // Initialize AWS SDK clients with increased timeouts
    const clientConfig = {
      region,
      requestHandler: {
        requestTimeout: 10000, // 10 seconds per request
        httpsAgent: { timeout: 10000 }
      },
      maxAttempts: 3  // Retry failed requests up to 3 times
    };

    ec2Client = new EC2Client(clientConfig);
    eksClient = new EKSClient(clientConfig);
    iamClient = new IAMClient(clientConfig);
    logsClient = new CloudWatchLogsClient(clientConfig);
  });

  // Test 1: Verify VPC exists with correct environment tag
  test("VPC exists and has correct environment suffix tag", async () => {
    const command = new DescribeVpcsCommand({
      Filters: [{ Name: "tag:Name", Values: [vpcName] }]
    });
    const response = await ec2Client.send(command);

    expect(response.Vpcs).toBeDefined();
    expect(response.Vpcs!.length).toBeGreaterThanOrEqual(1);
    expect(response.Vpcs![0].State).toBe("available");

    const tags = response.Vpcs![0].Tags || [];
    const envTag = tags.find((t: any) => t.Key === "EnvironmentSuffix");
    expect(envTag?.Value).toBe(envSuffix);
  });

  // Test 2: Verify EKS cluster is active
  test("EKS cluster exists and is ACTIVE", async () => {
    const command = new DescribeClusterCommand({ name: clusterName });
    const response = await eksClient.send(command);

    expect(response.cluster).toBeDefined();
    expect(response.cluster!.status).toBe("ACTIVE");
    expect(response.cluster!.name).toBe(clusterName);
    expect(response.cluster!.version).toMatch(/^1\.\d+$/);
  });

  // Test 3: Verify cluster IAM role exists
  test("EKS cluster IAM role exists with correct policies", async () => {
    const roleName = `eks-cluster-role-${envSuffix}`;

    const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
    const roleResponse = await iamClient.send(getRoleCommand);

    expect(roleResponse.Role).toBeDefined();
    expect(roleResponse.Role!.RoleName).toBe(roleName);

    const listPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
    const policiesResponse = await iamClient.send(listPoliciesCommand);

    const policyNames = policiesResponse.AttachedPolicies!.map((p: any) => p.PolicyName);
    expect(policyNames).toContain("AmazonEKSClusterPolicy");
  });

  // Test 4: Verify OIDC provider exists for IRSA
  test("OIDC provider exists for IAM Roles for Service Accounts", async () => {
    const clusterCommand = new DescribeClusterCommand({ name: clusterName });
    const clusterResponse = await eksClient.send(clusterCommand);

    const oidcIssuer = clusterResponse.cluster!.identity!.oidc!.issuer;
    expect(oidcIssuer).toBeDefined();
    expect(oidcIssuer).toMatch(/^https:\/\//);

    const oidcId = oidcIssuer!.split("/").pop();
    const providersCommand = new ListOpenIDConnectProvidersCommand({});
    const providersResponse = await iamClient.send(providersCommand);

    const matchingProvider = providersResponse.OpenIDConnectProviderList!.find(
      (p: any) => p.Arn.includes(oidcId)
    );
    expect(matchingProvider).toBeDefined();
  });

  // Test 5: Verify CloudWatch log group for EKS logs
  test("CloudWatch log group exists for EKS cluster logs", async () => {
    const logGroupName = `/aws/eks/${clusterName}/cluster`;
    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: logGroupName
    });
    const response = await logsClient.send(command);

    expect(response.logGroups).toBeDefined();
    expect(response.logGroups!.length).toBe(1);
    expect(response.logGroups![0].logGroupName).toBe(logGroupName);
    expect(response.logGroups![0].retentionInDays).toBe(30);
  });

  // Test 6: Verify VPC endpoints for S3 and ECR
  test("VPC endpoints exist for S3 and ECR services", async () => {
    const vpcCommand = new DescribeVpcsCommand({
      Filters: [{ Name: "tag:Name", Values: [vpcName] }]
    });
    const vpcResponse = await ec2Client.send(vpcCommand);

    expect(vpcResponse.Vpcs).toBeDefined();
    expect(vpcResponse.Vpcs!.length).toBeGreaterThanOrEqual(1);

    const vpcId = vpcResponse.Vpcs![0].VpcId!;

    const endpointsCommand = new DescribeVpcEndpointsCommand({
      Filters: [{ Name: "vpc-id", Values: [vpcId] }]
    });
    const endpointsResponse = await ec2Client.send(endpointsCommand);

    expect(endpointsResponse.VpcEndpoints).toBeDefined();
    expect(endpointsResponse.VpcEndpoints!.length).toBeGreaterThanOrEqual(3);

    const serviceNames = endpointsResponse.VpcEndpoints!.map((e: any) => e.ServiceName);
    expect(serviceNames.some((s: string) => s.includes("s3"))).toBe(true);
    expect(serviceNames.some((s: string) => s.includes("ecr.api"))).toBe(true);
    expect(serviceNames.some((s: string) => s.includes("ecr.dkr"))).toBe(true);

    endpointsResponse.VpcEndpoints!.forEach((endpoint: any) => {
      expect(endpoint.State).toBe("available");
    });
  });
});
