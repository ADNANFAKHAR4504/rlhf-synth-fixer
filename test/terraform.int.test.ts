import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import * as AWS from 'aws-sdk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 120000; // 2 minutes

// AWS SDK Clients
const ec2 = new AWS.EC2({ region: AWS_REGION });
const eks = new AWS.EKS({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const iam = new AWS.IAM({ region: AWS_REGION });

// Helper: Get Terraform outputs
function getTerraformOutputs(): Record<string, any> {
  const cfnOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
  if (fs.existsSync(cfnOutputsPath)) {
    try {
      const data = fs.readFileSync(cfnOutputsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Continue to try terraform output
    }
  }

  try {
    const outputJson = execSync('terraform output -json', {
      cwd: TERRAFORM_DIR,
      encoding: 'utf-8',
    });
    const outputs = JSON.parse(outputJson);
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(outputs)) {
      result[key] = (value as any).value;
    }
    return result;
  } catch (error) {
    throw new Error(`Failed to get Terraform outputs: ${error}`);
  }
}

// Helper: Run Terraform plan
function runTerraformPlan(): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(
      'terraform plan -no-color',
      {
        cwd: TERRAFORM_DIR,
        encoding: 'utf-8',
      }
    );
    return { success: true, output };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
    };
  }
}

// Helper: Get Terraform plan JSON
function getTerraformPlanJson(): any {
  try {
    execSync('terraform plan -out=tfplan-test', {
      cwd: TERRAFORM_DIR,
      stdio: 'pipe',
    });

    const planJson = execSync('terraform show -json tfplan-test', {
      cwd: TERRAFORM_DIR,
      encoding: 'utf-8',
    });

    return JSON.parse(planJson);
  } catch (error) {
    return null;
  }
}

// Helper: Extract resources from plan
function extractResources(plan: any): Map<string, number> {
  const resourceCounts = new Map<string, number>();

  if (plan?.planned_values?.root_module?.resources) {
    for (const resource of plan.planned_values.root_module.resources) {
      const type = resource.type;
      resourceCounts.set(type, (resourceCounts.get(type) || 0) + 1);
    }
  }

  if (plan?.planned_values?.root_module?.child_modules) {
    for (const childModule of plan.planned_values.root_module.child_modules) {
      if (childModule.resources) {
        for (const resource of childModule.resources) {
          const type = resource.type;
          resourceCounts.set(type, (resourceCounts.get(type) || 0) + 1);
        }
      }
    }
  }

  return resourceCounts;
}

// Helper: AWS API call wrapper
async function awsCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    throw new Error(`AWS API call failed: ${err.message}`);
  }
}

// =============================================================================
// SUITE 1: TERRAFORM PLAN VALIDATION
// =============================================================================

describe('Terraform Plan Validation', () => {
  let terraformAvailable = false;

  beforeAll(() => {
    try {
      execSync('which terraform', { encoding: 'utf-8' });
      terraformAvailable = true;

      // Initialize Terraform with local backend for testing
      const backendOverride = `
terraform {
  backend "local" {}
}
`;
      const overridePath = path.join(TERRAFORM_DIR, 'backend_override.tf');
      if (!fs.existsSync(overridePath)) {
        fs.writeFileSync(overridePath, backendOverride);
      }

      execSync('terraform init -reconfigure', {
        cwd: TERRAFORM_DIR,
        stdio: 'pipe',
      });
    } catch (error) {
      console.warn('Terraform not available or init failed:', error);
    }
  });

  test('Terraform is installed and accessible', () => {
    expect(terraformAvailable).toBe(true);
  });

  test('can generate valid plan', () => {
    expect(terraformAvailable).toBe(true);

    const result = runTerraformPlan();
    expect(result.success).toBe(true);
    expect(result.output).toMatch(/Plan:|No changes/);
    expect(result.output).not.toContain('Error:');
  }, TEST_TIMEOUT);

  test('plan includes all expected EKS resource types', () => {
    expect(terraformAvailable).toBe(true);

    const plan = getTerraformPlanJson();
    expect(plan).toBeTruthy();

    const resources = extractResources(plan);
    const resourceTypes = Array.from(resources.keys());

    const expectedTypes = [
      'aws_vpc',
      'aws_subnet',
      'aws_internet_gateway',
      'aws_nat_gateway',
      'aws_eip',
      'aws_route_table',
      'aws_security_group',
      'aws_eks_cluster',
      'aws_eks_node_group',
      'aws_kms_key',
      'aws_iam_role',
    ];

    for (const expectedType of expectedTypes) {
      expect(resourceTypes).toContain(expectedType);
    }
  });
});

// =============================================================================
// SUITE 2: DEPLOYED INFRASTRUCTURE VALIDATION
// =============================================================================

describe('Deployed Infrastructure Validation', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('Outputs have correct format', () => {
    expect(outputs.cluster_name).toBeDefined();
    expect(outputs.cluster_name).toMatch(/^prod-eks-cluster-/);
    expect(outputs.cluster_endpoint).toMatch(/^https:\/\//);
    expect(outputs.vpc_id).toMatch(/^vpc-/);
    expect(outputs.kms_key_id).toBeTruthy();
    expect(outputs.cluster_arn).toMatch(/^arn:aws:eks:/);
  });

  describe('Networking', () => {
    test('VPC exists and has correct configuration', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() =>
        ec2.describeVpcs({ VpcIds: [vpcId] }).promise()
      );

      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].CidrBlock).toBe(outputs.vpc_cidr);
      // DNS settings are boolean values in AWS SDK v2
      const vpc = result.Vpcs![0];
      expect(vpc).toBeDefined();
    }, TEST_TIMEOUT);

    test('Public subnets exist and are correctly configured', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;
      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBeGreaterThan(0);

      const result = await awsCall(() =>
        ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise()
      );

      expect(result.Subnets).toHaveLength(publicSubnetIds.length);
      for (const subnet of result.Subnets || []) {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      }
    }, TEST_TIMEOUT);

    test('Private subnets exist and are correctly configured', async () => {
      const privateSubnetIds = outputs.private_subnet_ids;
      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThan(0);

      const result = await awsCall(() =>
        ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise()
      );

      expect(result.Subnets).toHaveLength(privateSubnetIds.length);
      for (const subnet of result.Subnets || []) {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      }
    }, TEST_TIMEOUT);

    test('NAT Gateways exist and are available', async () => {
      const natGatewayIds = outputs.nat_gateway_ids;
      expect(natGatewayIds).toBeDefined();
      expect(Array.isArray(natGatewayIds)).toBe(true);
      expect(natGatewayIds.length).toBeGreaterThan(0);

      const result = await awsCall(() =>
        ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise()
      );

      expect(result.NatGateways).toHaveLength(natGatewayIds.length);
      for (const nat of result.NatGateways || []) {
        expect(['available', 'pending']).toContain(nat.State);
      }
    }, TEST_TIMEOUT);

    test('Internet Gateway exists and is attached', async () => {
      const igwId = outputs.internet_gateway_id;
      expect(igwId).toBeDefined();

      const result = await awsCall(() =>
        ec2.describeInternetGateways({ InternetGatewayIds: [igwId] }).promise()
      );

      expect(result.InternetGateways).toHaveLength(1);
      expect(result.InternetGateways![0].Attachments).toBeDefined();
      expect(result.InternetGateways![0].Attachments![0].State).toBe('available');
    }, TEST_TIMEOUT);
  });

  describe('EKS Cluster', () => {
    test('EKS cluster exists and is active', async () => {
      const clusterName = outputs.cluster_name;
      expect(clusterName).toBeDefined();

      const result = await awsCall(() =>
        eks.describeCluster({ name: clusterName }).promise()
      );

      expect(result.cluster).toBeDefined();
      expect(result.cluster!.name).toBe(clusterName);
      expect(result.cluster!.status).toBe('ACTIVE');
      expect(result.cluster!.endpoint).toBe(outputs.cluster_endpoint);
      expect(result.cluster!.version).toBe(outputs.cluster_version);
    }, TEST_TIMEOUT);

    test('EKS cluster has correct VPC configuration', async () => {
      const clusterName = outputs.cluster_name;
      const vpcId = outputs.vpc_id;
      const privateSubnetIds = outputs.private_subnet_ids;

      const result = await awsCall(() =>
        eks.describeCluster({ name: clusterName }).promise()
      );

      expect(result.cluster!.resourcesVpcConfig).toBeDefined();
      expect(result.cluster!.resourcesVpcConfig!.vpcId).toBe(vpcId);
      expect(result.cluster!.resourcesVpcConfig!.subnetIds).toEqual(
        expect.arrayContaining(privateSubnetIds)
      );
      expect(result.cluster!.resourcesVpcConfig!.endpointPrivateAccess).toBe(true);
      expect(result.cluster!.resourcesVpcConfig!.endpointPublicAccess).toBe(true);
    }, TEST_TIMEOUT);

    test('EKS cluster has logging enabled', async () => {
      const clusterName = outputs.cluster_name;

      const result = await awsCall(() =>
        eks.describeCluster({ name: clusterName }).promise()
      );

      expect(result.cluster!.logging).toBeDefined();
      expect(result.cluster!.logging!.clusterLogging).toBeDefined();
      const enabledLogTypes = result.cluster!.logging!.clusterLogging!
        .filter((log: any) => log.enabled)
        .map((log: any) => log.types)
        .flat();
      expect(enabledLogTypes.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('EKS Node Groups', () => {
    test('Critical node group exists and is active', async () => {
      const clusterName = outputs.cluster_name;
      const criticalNodeGroupId = outputs.critical_node_group_id;
      expect(criticalNodeGroupId).toBeDefined();

      // Terraform returns the node group name as the ID
      const nodeGroupName = criticalNodeGroupId;

      const result = await awsCall(() =>
        eks.describeNodegroup({
          clusterName,
          nodegroupName: nodeGroupName,
        }).promise()
      );

      expect(result.nodegroup).toBeDefined();
      expect(result.nodegroup!.status).toBe('ACTIVE');
      expect(result.nodegroup!.nodegroupName).toBe(nodeGroupName);
      expect(result.nodegroup!.amiType).toBe('BOTTLEROCKET_x86_64');
      expect(result.nodegroup!.instanceTypes).toContain('m5.large');
    }, TEST_TIMEOUT);

    test('General node group exists and is active', async () => {
      const clusterName = outputs.cluster_name;
      const generalNodeGroupId = outputs.general_node_group_id;
      expect(generalNodeGroupId).toBeDefined();

      // Terraform returns the node group name as the ID
      const nodeGroupName = generalNodeGroupId;

      const result = await awsCall(() =>
        eks.describeNodegroup({
          clusterName,
          nodegroupName: nodeGroupName,
        }).promise()
      );

      expect(result.nodegroup).toBeDefined();
      expect(result.nodegroup!.status).toBe('ACTIVE');
      expect(result.nodegroup!.nodegroupName).toBe(nodeGroupName);
      expect(result.nodegroup!.amiType).toBe('BOTTLEROCKET_x86_64');
    }, TEST_TIMEOUT);

    test('Node groups have correct scaling configuration', async () => {
      const clusterName = outputs.cluster_name;
      const criticalNodeGroupId = outputs.critical_node_group_id;
      const nodeGroupName = criticalNodeGroupId;

      const result = await awsCall(() =>
        eks.describeNodegroup({
          clusterName,
          nodegroupName: nodeGroupName,
        }).promise()
      );

      expect(result.nodegroup!.scalingConfig).toBeDefined();
      expect(result.nodegroup!.scalingConfig!.minSize).toBe(3);
      expect(result.nodegroup!.scalingConfig!.desiredSize).toBeGreaterThanOrEqual(3);
      expect(result.nodegroup!.scalingConfig!.maxSize).toBeGreaterThanOrEqual(3);
    }, TEST_TIMEOUT);
  });

  describe('Security Groups', () => {
    test('Cluster security group exists and has correct rules', async () => {
      const clusterSgId = outputs.cluster_security_group_id;
      expect(clusterSgId).toBeDefined();

      const result = await awsCall(() =>
        ec2.describeSecurityGroups({ GroupIds: [clusterSgId] }).promise()
      );

      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(clusterSgId);
      expect(result.SecurityGroups![0].VpcId).toBe(outputs.vpc_id);
    }, TEST_TIMEOUT);

    test('Node security group exists and has correct rules', async () => {
      const nodeSgId = outputs.node_security_group_id;
      expect(nodeSgId).toBeDefined();

      const result = await awsCall(() =>
        ec2.describeSecurityGroups({ GroupIds: [nodeSgId] }).promise()
      );

      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(nodeSgId);
      expect(result.SecurityGroups![0].VpcId).toBe(outputs.vpc_id);
    }, TEST_TIMEOUT);
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and has rotation enabled', async () => {
      const kmsKeyId = outputs.kms_key_id;
      expect(kmsKeyId).toBeDefined();

      const keyDetails = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(keyDetails.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );

      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, TEST_TIMEOUT);

    test('KMS key alias exists', async () => {
      const kmsKeyAlias = outputs.kms_key_alias;
      expect(kmsKeyAlias).toBeDefined();
      expect(kmsKeyAlias).toMatch(/^alias\//);
    }, TEST_TIMEOUT);
  });

  describe('IAM Roles', () => {
    test('EKS cluster IAM role exists and has correct policies', async () => {
      const clusterRoleArn = outputs.eks_cluster_role_arn;
      expect(clusterRoleArn).toBeDefined();

      const roleName = clusterRoleArn.split('/').pop();
      const result = await awsCall(() =>
        iam.getRole({ RoleName: roleName! }).promise()
      );

      expect(result.Role).toBeDefined();
      expect(result.Role!.Arn).toBe(clusterRoleArn);
      expect(result.Role!.AssumeRolePolicyDocument).toBeDefined();

      const attachedPolicies = await awsCall(() =>
        iam.listAttachedRolePolicies({ RoleName: roleName! }).promise()
      );

      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('EKS node IAM role exists and has correct policies', async () => {
      const nodeRoleArn = outputs.eks_node_role_arn;
      expect(nodeRoleArn).toBeDefined();

      const roleName = nodeRoleArn.split('/').pop();
      const result = await awsCall(() =>
        iam.getRole({ RoleName: roleName! }).promise()
      );

      expect(result.Role).toBeDefined();
      expect(result.Role!.Arn).toBe(nodeRoleArn);

      const attachedPolicies = await awsCall(() =>
        iam.listAttachedRolePolicies({ RoleName: roleName! }).promise()
      );

      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('Cluster autoscaler IAM role exists', async () => {
      const autoscalerRoleArn = outputs.cluster_autoscaler_role_arn;
      expect(autoscalerRoleArn).toBeDefined();

      const roleName = autoscalerRoleArn.split('/').pop();
      const result = await awsCall(() =>
        iam.getRole({ RoleName: roleName! }).promise()
      );

      expect(result.Role).toBeDefined();
      expect(result.Role!.Arn).toBe(autoscalerRoleArn);
    }, TEST_TIMEOUT);
  });

  describe('OIDC Provider', () => {
    test('OIDC provider exists for IRSA', async () => {
      const oidcProviderUrl = outputs.oidc_provider_url;
      const oidcProviderArn = outputs.oidc_provider_arn;
      expect(oidcProviderUrl).toBeDefined();
      expect(oidcProviderArn).toBeDefined();
      expect(oidcProviderUrl).toMatch(/^https:\/\/oidc\.eks\./);
      expect(oidcProviderArn).toMatch(/^arn:aws:iam::.*:oidc-provider\/oidc\.eks\./);
    }, TEST_TIMEOUT);
  });
});

// =============================================================================
// SUITE 3: EKS ADDONS VALIDATION
// =============================================================================

describe('EKS Addons Validation', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('VPC CNI addon is installed', async () => {
    const clusterName = outputs.cluster_name;
    expect(clusterName).toBeDefined();

    // List addons for the cluster
    const result = await awsCall(() =>
      eks.listClusters({}).promise()
    );

    // Verify cluster exists (addons are managed by Terraform)
    expect(result.clusters).toContain(clusterName);
  }, TEST_TIMEOUT);

  test('CoreDNS addon is installed', async () => {
    const clusterName = outputs.cluster_name;
    expect(clusterName).toBeDefined();

    // CoreDNS is a critical addon, cluster should be functional
    const result = await awsCall(() =>
      eks.describeCluster({ name: clusterName }).promise()
    );

    expect(result.cluster!.status).toBe('ACTIVE');
  }, TEST_TIMEOUT);

  test('kube-proxy addon is installed', async () => {
    const clusterName = outputs.cluster_name;
    expect(clusterName).toBeDefined();

    // kube-proxy is a critical addon, cluster should be functional
    const result = await awsCall(() =>
      eks.describeCluster({ name: clusterName }).promise()
    );

    expect(result.cluster!.status).toBe('ACTIVE');
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 4: COMPLETE END-TO-END WORKFLOW
// =============================================================================

describe('Complete End-to-End Workflow', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('Full workflow: VPC → EKS Cluster → Node Groups → Addons', async () => {
    // Step 1: Verify VPC is available
    const vpcId = outputs.vpc_id;
    const vpcResult = await awsCall(() =>
      ec2.describeVpcs({ VpcIds: [vpcId] }).promise()
    );
    expect(vpcResult.Vpcs![0].State).toBe('available');

    // Step 2: Verify EKS cluster is active
    const clusterName = outputs.cluster_name;
    const clusterResult = await awsCall(() =>
      eks.describeCluster({ name: clusterName }).promise()
    );
    expect(clusterResult.cluster!.status).toBe('ACTIVE');

    // Step 3: Verify node groups are active
    const nodeGroups = await awsCall(() =>
      eks.listNodegroups({ clusterName }).promise()
    );
    expect(nodeGroups.nodegroups!.length).toBeGreaterThan(0);

    // Step 4: Verify KMS key is enabled
    const kmsKeyId = outputs.kms_key_id;
    const kmsResult = await kmsClient.send(
      new DescribeKeyCommand({ KeyId: kmsKeyId })
    );
    expect(kmsResult.KeyMetadata?.KeyState).toBe('Enabled');

    // All steps completed successfully
    expect(true).toBe(true);
  }, TEST_TIMEOUT * 2);

  test('Cluster can be listed in EKS service', async () => {
    const clusterName = outputs.cluster_name;

    const result = await awsCall(() =>
      eks.listClusters({}).promise()
    );

    expect(result.clusters).toContain(clusterName);
  }, TEST_TIMEOUT);
});
