# Model Response Failures Analysis

This document analyzes the critical failures in the MODEL_RESPONSE for the EKS Cluster Terraform deployment task. The model generated infrastructure code that **cannot be deployed** in the CI/CD pipeline due to multiple blocking issues.

## Critical Failures

### 1. Hardcoded Backend Configuration (DEPLOYMENT BLOCKER)

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-eks-cluster"
    key            = "eks/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock-eks"
  }
}
```

The backend configuration contains hardcoded bucket names ("terraform-state-eks-cluster") and table names ("terraform-state-lock-eks"). This prevents:
- Parallel deployments across multiple environments
- CI/CD pipeline execution (requires dynamic configuration)
- Multiple teams using the same infrastructure

**IDEAL_RESPONSE Fix**:
```hcl
# Backend configuration must be initialized with:
# terraform init \
#   -backend-config="bucket=${TERRAFORM_STATE_BUCKET}" \
#   -backend-config="key=eks/${ENVIRONMENT_SUFFIX}/terraform.tfstate" \
#   -backend-config="dynamodb_table=${TERRAFORM_STATE_DYNAMODB_TABLE}" \
#   -backend-config="region=${AWS_REGION}"

terraform {
  backend "s3" {
    # These values are provided via -backend-config flags at init time
    # Do NOT hardcode bucket names - they must be environment-specific
    encrypt = true
  }
}
```

**Root Cause**: Model failed to understand that Terraform state backends in multi-environment CI/CD pipelines must use dynamic configuration. The prompt explicitly stated "Terraform state must be stored in S3 with DynamoDB locking configured" but didn't specify it must support parallel deployments. However, the "environment_suffix" requirement implies multiple environments.

**AWS Documentation Reference**: https://developer.hashicorp.com/terraform/language/settings/backends/configuration#partial-configuration

**Cost/Security/Performance Impact**:
- **Deployment**: BLOCKED - Infrastructure cannot be deployed via CI/CD
- **Multi-tenancy**: BLOCKED - Cannot support parallel environments
- **Risk**: HIGH - State collisions if multiple deployments attempt to use same bucket/key

---

### 2. Provider Version Mismatch (BUILD BLOCKER)

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
The `.terraform.lock.hcl` file contains AWS provider version 6.9.0, but `versions.tf` specifies:
```hcl
aws = {
  source  = "hashicorp/aws"
  version = "~> 5.0"
}
```

Error message:
```
Error: Failed to query available provider packages
Could not retrieve the list of available versions for provider
hashicorp/aws: locked provider registry.terraform.io/hashicorp/aws 6.9.0
does not match configured version constraint ~> 5.0
```

**IDEAL_RESPONSE Fix**: Regenerate lock file with correct provider version:
```bash
cd lib
rm .terraform.lock.hcl
terraform init -upgrade
```

**Root Cause**: Model generated the lock file with a newer AWS provider version (6.9.0) than what was specified in the code (~> 5.0). This indicates:
1. Lock file was generated separately from code generation
2. No validation was performed to ensure version consistency
3. Model doesn't understand Terraform's version constraint syntax (~> means same major version)

**AWS Documentation Reference**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs

**Cost/Security/Performance Impact**:
- **Build**: BLOCKED - `terraform init` fails immediately
- **Deployment**: BLOCKED - Cannot proceed without successful init
- **Risk**: HIGH - Prevents any infrastructure operations

---

### 3. Excessive NAT Gateway Cost (COST OPTIMIZATION FAILURE)

**Impact Level**: High

**MODEL_RESPONSE Issue**:
The networking configuration creates **3 NAT Gateways** (one per availability zone):
```hcl
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"
  # ...
}

resource "aws_nat_gateway" "main" {
  count = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.private_control_plane[count.index].id
  # ...
}
```

**Cost Analysis**:
- NAT Gateway: $0.045/hour × 3 = $0.135/hour
- Monthly cost: $0.135 × 24 × 30 = **$97.20/month**
- Data transfer: Additional $0.045/GB processed

**IDEAL_RESPONSE Fix**: Single NAT Gateway for private-only cluster:
```hcl
resource "aws_eip" "nat" {
  domain = "vpc"
  # Single EIP
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.private_control_plane[0].id
  # Single NAT Gateway
}
```

**Cost Savings**: ~$64/month (67% reduction)

**Root Cause**: Model applied high-availability NAT Gateway pattern (one per AZ) without considering:
1. The cluster has **private endpoint only** (no public access)
2. NAT is needed only for outbound traffic (pulling images, AWS API calls)
3. For a private EKS cluster, NAT Gateway failure is not critical (nodes can still communicate with control plane via private endpoint)
4. The prompt emphasized "production-ready" but didn't specify high-availability NAT as a requirement

**AWS Documentation Reference**: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html

**Cost/Security/Performance Impact**:
- **Cost**: HIGH - Unnecessary $64/month spend
- **Availability**: LOW impact - Private endpoint allows cluster to function during NAT outage
- **Performance**: Negligible - Single NAT Gateway can handle typical EKS cluster traffic

---

### 4. Incomplete Test Suite (QA BLOCKER)

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:

**Unit Tests** (`test/terraform.unit.test.ts`):
```typescript
const STACK_REL = "../lib/tap_stack.tf"; // WRONG FILE
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    expect(exists).toBe(true); // FAILS - file doesn't exist
  });
});
```

**Integration Tests** (`test/terraform.int.test.ts`):
```typescript
describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(true); // ALWAYS FAILS
    });
  });
});
```

**Issues**:
1. Unit tests reference non-existent file `tap_stack.tf` (should test actual .tf files in lib/)
2. Integration tests are placeholder with intentional failure
3. No actual testing of Terraform resources
4. No validation of outputs or resource creation
5. Cannot achieve 100% coverage requirement

**IDEAL_RESPONSE Fix**: Comprehensive test suite required:

**Unit Tests**:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as hcl from 'hcl2-parser';

describe('EKS Terraform Infrastructure Unit Tests', () => {
  const libDir = path.join(__dirname, '../lib');

  describe('File Existence', () => {
    test('versions.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'versions.tf'))).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'provider.tf'))).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'variables.tf'))).toBe(true);
    });

    test('main.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'main.tf'))).toBe(true);
    });

    test('backend.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'backend.tf'))).toBe(true);
    });

    test('networking.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'networking.tf'))).toBe(true);
    });

    test('security.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'security.tf'))).toBe(true);
    });

    test('iam.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'iam.tf'))).toBe(true);
    });

    test('eks.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'eks.tf'))).toBe(true);
    });

    test('node-groups.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'node-groups.tf'))).toBe(true);
    });

    test('addons.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'addons.tf'))).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fs.existsSync(path.join(libDir, 'outputs.tf'))).toBe(true);
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
    });

    test('declares environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test('declares aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
    });

    test('declares cluster_version variable', () => {
      expect(variablesContent).toMatch(/variable\s+"cluster_version"/);
    });

    test('environment_suffix has no default value', () => {
      const envSuffixBlock = variablesContent.match(/variable\s+"environment_suffix"\s*{[^}]+}/s);
      expect(envSuffixBlock).toBeTruthy();
      expect(envSuffixBlock![0]).not.toMatch(/default\s*=/);
    });
  });

  describe('Backend Configuration', () => {
    let backendContent: string;

    beforeAll(() => {
      backendContent = fs.readFileSync(path.join(libDir, 'backend.tf'), 'utf-8');
    });

    test('configures S3 backend', () => {
      expect(backendContent).toMatch(/backend\s+"s3"/);
    });

    test('enables encryption', () => {
      expect(backendContent).toMatch(/encrypt\s*=\s*true/);
    });

    test('does not hardcode bucket name', () => {
      expect(backendContent).not.toMatch(/bucket\s*=\s*"[^"]+"/);
    });
  });

  describe('EKS Cluster Configuration', () => {
    let eksContent: string;

    beforeAll(() => {
      eksContent = fs.readFileSync(path.join(libDir, 'eks.tf'), 'utf-8');
    });

    test('creates EKS cluster resource', () => {
      expect(eksContent).toMatch(/resource\s+"aws_eks_cluster"\s+"main"/);
    });

    test('cluster name includes environment_suffix', () => {
      expect(eksContent).toMatch(/name\s*=\s*"eks-cluster-\$\{var\.environment_suffix\}"/);
    });

    test('enables private endpoint access', () => {
      expect(eksContent).toMatch(/endpoint_private_access\s*=\s*true/);
    });

    test('disables public endpoint access', () => {
      expect(eksContent).toMatch(/endpoint_public_access\s*=\s*false/);
    });

    test('configures KMS encryption', () => {
      expect(eksContent).toMatch(/encryption_config\s*{/);
    });

    test('enables all cluster log types', () => {
      expect(eksContent).toMatch(/enabled_cluster_log_types/);
      expect(eksContent).toMatch(/api/);
      expect(eksContent).toMatch(/audit/);
      expect(eksContent).toMatch(/authenticator/);
      expect(eksContent).toMatch(/controllerManager/);
      expect(eksContent).toMatch(/scheduler/);
    });

    test('creates OIDC provider', () => {
      expect(eksContent).toMatch(/resource\s+"aws_iam_openid_connect_provider"\s+"eks"/);
    });
  });

  describe('Node Groups Configuration', () => {
    let nodeGroupsContent: string;

    beforeAll(() => {
      nodeGroupsContent = fs.readFileSync(path.join(libDir, 'node-groups.tf'), 'utf-8');
    });

    test('creates system node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"system"/);
    });

    test('creates application node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"application"/);
    });

    test('creates spot node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"spot"/);
    });

    test('system nodes use launch template', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_launch_template"\s+"system"/);
    });

    test('enforces IMDSv2', () => {
      expect(nodeGroupsContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test('enables detailed monitoring', () => {
      expect(nodeGroupsContent).toMatch(/monitoring\s*{\s*enabled\s*=\s*true/);
    });

    test('system nodes have taints', () => {
      const systemBlock = nodeGroupsContent.match(/resource\s+"aws_eks_node_group"\s+"system"[^}]*taint\s*{[^}]+}/s);
      expect(systemBlock).toBeTruthy();
    });

    test('application nodes have taints', () => {
      const appBlock = nodeGroupsContent.match(/resource\s+"aws_eks_node_group"\s+"application"[^}]*taint\s*{[^}]+}/s);
      expect(appBlock).toBeTruthy();
    });
  });

  describe('Networking Configuration', () => {
    let networkingContent: string;

    beforeAll(() => {
      networkingContent = fs.readFileSync(path.join(libDir, 'networking.tf'), 'utf-8');
    });

    test('creates VPC', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('creates control plane subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_control_plane"/);
    });

    test('creates system subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_system"/);
    });

    test('creates application subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_application"/);
    });

    test('creates spot subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_spot"/);
    });

    test('creates NAT gateway', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test('creates internet gateway', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });
  });

  describe('Security Configuration', () => {
    let securityContent: string;

    beforeAll(() => {
      securityContent = fs.readFileSync(path.join(libDir, 'security.tf'), 'utf-8');
    });

    test('creates KMS key', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_key"\s+"eks"/);
    });

    test('enables KMS key rotation', () => {
      expect(securityContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('creates cluster security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"eks_cluster"/);
    });

    test('creates node security groups', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"system_nodes"/);
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"application_nodes"/);
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"spot_nodes"/);
    });
  });

  describe('IAM Configuration', () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf-8');
    });

    test('creates EKS cluster role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"eks_cluster"/);
    });

    test('creates node group role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"eks_nodes"/);
    });

    test('creates EBS CSI driver role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ebs_csi_driver"/);
    });

    test('creates load balancer controller role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"load_balancer_controller"/);
    });

    test('creates cluster autoscaler policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"cluster_autoscaler"/);
    });

    test('no wildcard actions in policies', () => {
      const wildcardPattern = /"Action"\s*:\s*"\*"/;
      expect(iamContent).not.toMatch(wildcardPattern);
    });
  });

  describe('EKS Addons Configuration', () => {
    let addonsContent: string;

    beforeAll(() => {
      addonsContent = fs.readFileSync(path.join(libDir, 'addons.tf'), 'utf-8');
    });

    test('creates EBS CSI driver addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"ebs_csi_driver"/);
      expect(addonsContent).toMatch(/addon_name\s*=\s*"aws-ebs-csi-driver"/);
    });

    test('creates VPC CNI addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"vpc_cni"/);
      expect(addonsContent).toMatch(/addon_name\s*=\s*"vpc-cni"/);
    });

    test('creates CoreDNS addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"coredns"/);
      expect(addonsContent).toMatch(/addon_name\s*=\s*"coredns"/);
    });

    test('creates kube-proxy addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"kube_proxy"/);
      expect(addonsContent).toMatch(/addon_name\s*=\s*"kube-proxy"/);
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');
    });

    test('outputs cluster name', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_name"/);
    });

    test('outputs cluster endpoint', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_endpoint"/);
    });

    test('outputs OIDC provider ARN', () => {
      expect(outputsContent).toMatch(/output\s+"oidc_provider_arn"/);
    });

    test('outputs VPC ID', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });

    test('outputs IAM role ARNs', () => {
      expect(outputsContent).toMatch(/output\s+"node_iam_role_arn"/);
      expect(outputsContent).toMatch(/output\s+"ebs_csi_driver_role_arn"/);
      expect(outputsContent).toMatch(/output\s+"load_balancer_controller_role_arn"/);
    });
  });

  describe('Resource Naming Convention', () => {
    const terraformFiles = [
      'networking.tf',
      'security.tf',
      'iam.tf',
      'eks.tf',
      'node-groups.tf',
      'addons.tf'
    ];

    terraformFiles.forEach(file => {
      test(`${file} uses environment_suffix in resource names`, () => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf-8');
        expect(content).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });
  });
});
```

**Integration Tests**:
```typescript
import {
  EKSClient,
  DescribeClusterCommand,
  ListNodegroupsCommand,
  DescribeAddonCommand,
  ListAddonsCommand
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand
} from '@aws-sdk/client-kms';
import * as fs from 'fs';
import * as path from 'path';

describe('EKS Terraform Infrastructure Integration Tests', () => {
  let outputs: any;
  let eksClient: EKSClient;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let kmsClient: KMSClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    eksClient = new EKSClient({ region });
    ec2Client = new EC2Client({ region });
    iamClient = new IAMClient({ region });
    kmsClient = new KMSClient({ region });
  });

  describe('EKS Cluster', () => {
    test('cluster exists and is active', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster!.status).toBe('ACTIVE');
      expect(response.cluster!.version).toBe('1.28');
    });

    test('cluster has private endpoint only', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      expect(response.cluster!.resourcesVpcConfig!.endpointPrivateAccess).toBe(true);
      expect(response.cluster!.resourcesVpcConfig!.endpointPublicAccess).toBe(false);
    });

    test('cluster logging is enabled', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      const enabledTypes = response.cluster!.logging!.clusterLogging![0].types;
      expect(enabledTypes).toContain('api');
      expect(enabledTypes).toContain('audit');
      expect(enabledTypes).toContain('authenticator');
      expect(enabledTypes).toContain('controllerManager');
      expect(enabledTypes).toContain('scheduler');
    });

    test('cluster has encryption configured', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      expect(response.cluster!.encryptionConfig).toBeDefined();
      expect(response.cluster!.encryptionConfig!.length).toBeGreaterThan(0);
      expect(response.cluster!.encryptionConfig![0].resources).toContain('secrets');
    });
  });

  describe('Node Groups', () => {
    test('cluster has 3 node groups', async () => {
      const command = new ListNodegroupsCommand({
        clusterName: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      expect(response.nodegroups!.length).toBe(3);
    });

    test('system node group exists', async () => {
      const command = new ListNodegroupsCommand({
        clusterName: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      const systemNodeGroup = response.nodegroups!.find(ng => ng.includes('system'));
      expect(systemNodeGroup).toBeDefined();
    });

    test('application node group exists', async () => {
      const command = new ListNodegroupsCommand({
        clusterName: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      const appNodeGroup = response.nodegroups!.find(ng => ng.includes('application'));
      expect(appNodeGroup).toBeDefined();
    });

    test('spot node group exists', async () => {
      const command = new ListNodegroupsCommand({
        clusterName: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      const spotNodeGroup = response.nodegroups!.find(ng => ng.includes('spot'));
      expect(spotNodeGroup).toBeDefined();
    });
  });

  describe('EKS Addons', () => {
    test('EBS CSI driver addon is installed', async () => {
      const command = new ListAddonsCommand({
        clusterName: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      expect(response.addons).toContain('aws-ebs-csi-driver');
    });

    test('VPC CNI addon is installed', async () => {
      const command = new ListAddonsCommand({
        clusterName: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      expect(response.addons).toContain('vpc-cni');
    });

    test('CoreDNS addon is installed', async () => {
      const command = new ListAddonsCommand({
        clusterName: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      expect(response.addons).toContain('coredns');
    });

    test('kube-proxy addon is installed', async () => {
      const command = new ListAddonsCommand({
        clusterName: outputs.cluster_name
      });
      const response = await eksClient.send(command);

      expect(response.addons).toContain('kube-proxy');
    });
  });

  describe('Networking', () => {
    test('VPC exists', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('control plane subnets exist', async () => {
      const subnetIds = outputs.private_subnet_ids_control_plane;
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBe(3);
    });

    test('system subnets exist', async () => {
      const subnetIds = outputs.private_subnet_ids_system;
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBe(3);
    });

    test('application subnets exist', async () => {
      const subnetIds = outputs.private_subnet_ids_application;
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBe(3);
    });
  });

  describe('Security', () => {
    test('cluster security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.cluster_security_group_id]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups!.length).toBe(1);
    });

    test('KMS key exists and rotation enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_arn
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyRotationEnabled).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('cluster IAM role exists', async () => {
      const roleArn = outputs.cluster_iam_role_arn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
    });

    test('node IAM role exists', async () => {
      const roleArn = outputs.node_iam_role_arn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
    });

    test('EBS CSI driver role exists', async () => {
      const roleArn = outputs.ebs_csi_driver_role_arn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
    });

    test('load balancer controller role exists', async () => {
      const roleArn = outputs.load_balancer_controller_role_arn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    test('all required outputs are present', () => {
      expect(outputs.cluster_name).toBeDefined();
      expect(outputs.cluster_endpoint).toBeDefined();
      expect(outputs.cluster_oidc_issuer_url).toBeDefined();
      expect(outputs.oidc_provider_arn).toBeDefined();
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.cluster_security_group_id).toBeDefined();
      expect(outputs.cluster_iam_role_arn).toBeDefined();
      expect(outputs.node_iam_role_arn).toBeDefined();
      expect(outputs.ebs_csi_driver_role_arn).toBeDefined();
      expect(outputs.load_balancer_controller_role_arn).toBeDefined();
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.kms_key_arn).toBeDefined();
    });
  });
});
```

**Root Cause**: Model generated placeholder tests without implementing actual test logic. This suggests:
1. Model doesn't understand the importance of comprehensive testing in IaC
2. Test generation was an afterthought, not integrated with infrastructure generation
3. No validation was performed to ensure tests actually test the generated code
4. Model doesn't understand Jest testing framework properly

**Cost/Security/Performance Impact**:
- **QA**: BLOCKED - Cannot validate infrastructure correctness
- **Coverage**: 0% actual coverage (tests don't run or fail immediately)
- **Deployment**: BLOCKED - CI/CD pipeline requires 100% test coverage
- **Training Quality**: Severely impacted - Cannot demonstrate code works correctly

---

## High Failures

### 5. Missing Test Implementation Strategy

**Impact Level**: High

**MODEL_RESPONSE Issue**: No guidance on how to test Terraform infrastructure. README.md mentions testing but doesn't explain how to run tests or what they validate.

**IDEAL_RESPONSE Fix**: Added comprehensive testing documentation:
- Unit tests validate Terraform syntax and resource configuration
- Integration tests validate actual AWS resource creation
- Clear instructions on running tests
- Coverage requirements explained

**Root Cause**: Model generated infrastructure without considering testability. Testing should be designed alongside infrastructure, not added afterward.

**Cost/Security/Performance Impact**:
- **Quality**: Cannot validate infrastructure meets requirements
- **Maintenance**: Difficult to refactor without breaking existing functionality
- **Training**: Cannot demonstrate infrastructure quality

---

## Medium Failures

### 6. README Documentation Incomplete

**Impact Level**: Medium

**MODEL_RESPONSE Issue**: README.md contains deployment instructions with hardcoded backend values:
```bash
terraform init
```

This won't work without backend configuration.

**IDEAL_RESPONSE Fix**: Added proper initialization with environment variables:
```bash
terraform init \
  -backend-config="bucket=${TERRAFORM_STATE_BUCKET}" \
  -backend-config="key=eks/${ENVIRONMENT_SUFFIX}/terraform.tfstate" \
  -backend-config="dynamodb_table=${TERRAFORM_STATE_DYNAMODB_TABLE}" \
  -backend-config="region=${AWS_REGION}" \
  -reconfigure
```

**Root Cause**: Model generated documentation without understanding the backend configuration requirements.

**Cost/Security/Performance Impact**:
- **Usability**: Users cannot deploy infrastructure following README
- **Support**: Increased support burden
- **Training**: Documentation doesn't reflect actual deployment process

---

## Summary

- **Total failures**: 1 Critical (Deployment Blocker), 1 Critical (Build Blocker), 1 Critical (QA Blocker), 1 High (Cost), 1 High (Testing), 1 Medium (Documentation)
- **Primary knowledge gaps**:
  1. **Dynamic backend configuration in Terraform** - Hardcoded values prevent parallel deployments
  2. **Provider version management** - Lock file doesn't match code requirements
  3. **Cost optimization for specific use cases** - Over-provisioned NAT Gateways for private-only cluster
  4. **Comprehensive testing strategy** - Placeholder tests instead of real validation
  5. **Documentation completeness** - Instructions don't match actual deployment requirements

- **Training value**: **HIGH** - This example demonstrates multiple critical failures that would prevent deployment:
  - Infrastructure cannot be initialized (provider version mismatch)
  - Infrastructure cannot be deployed (hardcoded backend)
  - Infrastructure cannot be validated (incomplete tests)
  - Infrastructure is unnecessarily expensive (3x NAT Gateway cost)

  These failures represent fundamental misunderstandings of Terraform best practices, CI/CD requirements, cost optimization, and testing strategies. Training on this example would significantly improve model's ability to generate production-ready infrastructure code.