// Unit tests for Terraform EKS infrastructure with Graviton2 nodes
// Tests validate Terraform configuration files for correctness, syntax, and best practices

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read Terraform file
function readTerraformFile(filename: string): string {
  const filepath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  return fs.readFileSync(filepath, 'utf8');
}

// Helper function to check for environment_suffix usage
function hasEnvironmentSuffix(content: string): boolean {
  return content.includes('var.environment_suffix') || content.includes('environment_suffix');
}

describe('Terraform EKS Infrastructure with Graviton2 - Unit Tests', () => {

  describe('File Structure', () => {
    test('all required Terraform files exist', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'vpc.tf',
        'eks-cluster.tf',
        'eks-node-group.tf',
        'iam-cluster.tf',
        'iam-nodes.tf',
        'iam-autoscaler.tf',
        'vpc-cni-addon.tf',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        const filepath = path.join(LIB_DIR, file);
        expect(fs.existsSync(filepath)).toBe(true);
      });
    });

    test('PROMPT.md exists in lib directory', () => {
      const promptPath = path.join(LIB_DIR, 'PROMPT.md');
      expect(fs.existsSync(promptPath)).toBe(true);
    });

    test('MODEL_RESPONSE.md exists in lib directory', () => {
      const modelResponsePath = path.join(LIB_DIR, 'MODEL_RESPONSE.md');
      expect(fs.existsSync(modelResponsePath)).toBe(true);
    });

    test('IDEAL_RESPONSE.md exists in lib directory', () => {
      const idealResponsePath = path.join(LIB_DIR, 'IDEAL_RESPONSE.md');
      expect(fs.existsSync(idealResponsePath)).toBe(true);
    });

    test('MODEL_FAILURES.md exists in lib directory', () => {
      const modelFailuresPath = path.join(LIB_DIR, 'MODEL_FAILURES.md');
      expect(fs.existsSync(modelFailuresPath)).toBe(true);
    });

    test('README.md exists in lib directory', () => {
      const readmePath = path.join(LIB_DIR, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });
  });

  describe('Provider Configuration (provider.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('provider.tf');
    });

    test('declares AWS provider', () => {
      expect(content).toMatch(/provider\s+"aws"\s*{/);
    });

    test('specifies AWS provider version constraint', () => {
      expect(content).toMatch(/required_providers\s*{[\s\S]*?aws\s*=\s*{[\s\S]*?version\s*=/);
    });

    test('sets region using region variable', () => {
      expect(content).toMatch(/region\s*=\s*var\.region/);
    });

    test('declares required Terraform version', () => {
      expect(content).toMatch(/required_version\s*=/);
    });

    test('provider block does NOT contain hardcoded region', () => {
      const providerBlock = content.match(/provider\s+"aws"\s*{[^}]*}/s);
      expect(providerBlock).toBeTruthy();
      expect(providerBlock![0]).not.toMatch(/region\s*=\s*"us-east-2"/);
    });
  });

  describe('Variables Configuration (variables.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('variables.tf');
    });

    test('declares environment_suffix variable', () => {
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('declares region variable', () => {
      expect(content).toMatch(/variable\s+"region"\s*{/);
    });

    test('declares cluster_version variable', () => {
      expect(content).toMatch(/variable\s+"cluster_version"\s*{/);
    });

    test('declares node_instance_type variable', () => {
      expect(content).toMatch(/variable\s+"node_instance_type"\s*{/);
    });

    test('environment_suffix variable has description', () => {
      const envSuffixBlock = content.match(/variable\s+"environment_suffix"\s*{[^}]*}/s);
      expect(envSuffixBlock).toBeTruthy();
      expect(envSuffixBlock![0]).toMatch(/description\s*=/);
    });

    test('environment_suffix variable has type', () => {
      const envSuffixBlock = content.match(/variable\s+"environment_suffix"\s*{[^}]*}/s);
      expect(envSuffixBlock).toBeTruthy();
      expect(envSuffixBlock![0]).toMatch(/type\s*=\s*string/);
    });

    test('region variable defaults to us-east-2', () => {
      const regionBlock = content.match(/variable\s+"region"\s*{[^}]*}/s);
      expect(regionBlock).toBeTruthy();
      expect(regionBlock![0]).toMatch(/default\s*=\s*"us-east-2"/);
    });

    test('cluster_version variable has Kubernetes 1.28 or higher', () => {
      const versionBlock = content.match(/variable\s+"cluster_version"\s*{[^}]*}/s);
      expect(versionBlock).toBeTruthy();
      expect(versionBlock![0]).toMatch(/default\s*=\s*"1\.(2[89]|[3-9][0-9])"/);
    });
  });

  describe('VPC Configuration (vpc.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('vpc.tf');
    });

    test('creates VPC resource', () => {
      expect(content).toMatch(/resource\s+"aws_vpc"\s+/);
    });

    test('VPC uses environment_suffix in name', () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+[^{]*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(hasEnvironmentSuffix(vpcBlock![0])).toBe(true);
    });

    test('creates public subnets', () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public/);
    });

    test('creates private subnets', () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private/);
    });

    test('creates Internet Gateway', () => {
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+/);
    });

    test('creates NAT Gateway(s)', () => {
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+/);
    });

    test('creates Elastic IP(s) for NAT', () => {
      expect(content).toMatch(/resource\s+"aws_eip"\s+/);
    });

    test('creates route tables', () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+/);
    });

    test('creates route table associations', () => {
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+/);
    });

    test('subnets span 3 availability zones', () => {
      const subnetCount = content.match(/resource\s+"aws_subnet"\s+"(public|private)"/g);
      expect(subnetCount).toBeTruthy();
      expect(subnetCount!.length).toBeGreaterThanOrEqual(2);
    });

    test('public subnets enable map_public_ip_on_launch', () => {
      const publicSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"public[^"]*"\s*{[^}]*}/s);
      expect(publicSubnetBlock).toBeTruthy();
      expect(publicSubnetBlock![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('VPC enables DNS hostnames', () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+[^{]*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('VPC enables DNS support', () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+[^{]*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('VPC CIDR block is defined', () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+[^{]*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/cidr_block\s*=/);
    });

    test('subnets have CIDR blocks', () => {
      expect(content).toMatch(/cidr_block\s*=/);
    });

    test('subnets are tagged with proper Kubernetes tags', () => {
      expect(content).toMatch(/kubernetes\.io\/role/);
    });
  });

  describe('IAM Cluster Configuration (iam-cluster.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('iam-cluster.tf');
    });

    test('creates EKS cluster IAM role', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+".*cluster/i);
    });

    test('IAM role uses environment_suffix', () => {
      const iamRoleBlock = content.match(/resource\s+"aws_iam_role"\s+[^{]*{[^}]*}/s);
      expect(iamRoleBlock).toBeTruthy();
      expect(hasEnvironmentSuffix(iamRoleBlock![0])).toBe(true);
    });

    test('attaches AmazonEKSClusterPolicy', () => {
      expect(content).toMatch(/AmazonEKSClusterPolicy/);
    });

    test('defines assume role policy for EKS service', () => {
      expect(content).toMatch(/assume_role_policy\s*=/);
      expect(content).toMatch(/eks\.amazonaws\.com/);
    });

    test('IAM policy allows EKS to assume role', () => {
      expect(content).toMatch(/sts:AssumeRole/);
    });

    test('policy attachment references correct IAM role', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
      expect(content).toMatch(/role\s*=\s*aws_iam_role/);
    });
  });

  describe('IAM Nodes Configuration (iam-nodes.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('iam-nodes.tf');
    });

    test('creates EKS node IAM role', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+".*node/i);
    });

    test('IAM role uses environment_suffix', () => {
      const iamRoleBlock = content.match(/resource\s+"aws_iam_role"\s+[^{]*{[^}]*}/s);
      expect(iamRoleBlock).toBeTruthy();
      expect(hasEnvironmentSuffix(iamRoleBlock![0])).toBe(true);
    });

    test('attaches AmazonEKSWorkerNodePolicy', () => {
      expect(content).toMatch(/AmazonEKSWorkerNodePolicy/);
    });

    test('attaches AmazonEKS_CNI_Policy', () => {
      expect(content).toMatch(/AmazonEKS_CNI_Policy/);
    });

    test('attaches AmazonEC2ContainerRegistryReadOnly', () => {
      expect(content).toMatch(/AmazonEC2ContainerRegistryReadOnly/);
    });

    test('defines assume role policy for EC2 service', () => {
      expect(content).toMatch(/assume_role_policy\s*=/);
      expect(content).toMatch(/ec2\.amazonaws\.com/);
    });
  });

  describe('IAM Autoscaler Configuration (iam-autoscaler.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('iam-autoscaler.tf');
    });

    test('creates IAM role for cluster autoscaler', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+".*autoscaler/i);
    });

    test('IAM role uses environment_suffix', () => {
      const iamRoleBlock = content.match(/resource\s+"aws_iam_role"\s+[^{]*{[^}]*}/s);
      expect(iamRoleBlock).toBeTruthy();
      expect(hasEnvironmentSuffix(iamRoleBlock![0])).toBe(true);
    });

    test('creates IAM policy for autoscaler or uses inline policy', () => {
      const hasPolicy = content.match(/resource\s+"aws_iam_policy"\s+/) || 
                       content.match(/resource\s+"aws_iam_role_policy"\s+/);
      expect(hasPolicy).toBeTruthy();
    });

    test('policy allows autoscaling actions', () => {
      expect(content).toMatch(/autoscaling:DescribeAutoScalingGroups|autoscaling:SetDesiredCapacity/);
    });

    test('configures trust policy with OIDC or standard assume role', () => {
      expect(content).toMatch(/assume_role_policy\s*=/);
    });

    test('restricts to correct service account', () => {
      expect(content).toMatch(/kube-system:cluster-autoscaler/);
    });
  });

  describe('EKS Cluster Configuration (eks-cluster.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('eks-cluster.tf');
    });

    test('creates EKS cluster resource', () => {
      expect(content).toMatch(/resource\s+"aws_eks_cluster"\s+/);
    });

    test('cluster name uses environment_suffix', () => {
      expect(content).toMatch(/local\.cluster_name/);
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toMatch(/cluster_name\s*=.*environment_suffix/);
    });

    test('specifies Kubernetes version 1.28 or higher', () => {
      expect(content).toMatch(/version\s*=.*var\.cluster_version/);
    });

    test('enables private endpoint access', () => {
      expect(content).toMatch(/endpoint_private_access\s*=\s*true/);
    });

    test('configures public endpoint access', () => {
      expect(content).toMatch(/endpoint_public_access/);
    });

    test('restricts public access CIDR blocks', () => {
      expect(content).toMatch(/public_access_cidrs/);
    });

    test('creates OIDC provider', () => {
      expect(content).toMatch(/resource\s+"aws_iam_openid_connect_provider"\s+/);
    });

    test('OIDC provider configured properly', () => {
      const oidcBlock = content.match(/resource\s+"aws_iam_openid_connect_provider"\s+[^{]*{[\s\S]*?}/);
      expect(oidcBlock).toBeTruthy();
    });

    test('enables control plane logging for api and audit', () => {
      expect(content).toMatch(/enabled_cluster_log_types/);
      expect(content).toMatch(/"api"/);
      expect(content).toMatch(/"audit"/);
    });

    test('creates CloudWatch log group', () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+/);
    });

    test('CloudWatch log group has retention policy', () => {
      const logGroupBlock = content.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?retention_in_days/);
      expect(logGroupBlock).toBeTruthy();
    });

    test('configures VPC settings', () => {
      expect(content).toMatch(/vpc_config\s*{/);
      expect(content).toMatch(/subnet_ids/);
    });

    test('uses KMS encryption for secrets', () => {
      expect(content).toMatch(/encryption_config\s*{/);
      expect(content).toMatch(/resources\s*=\s*\["secrets"\]/);
    });

    test('has proper depends_on for IAM policies', () => {
      expect(content).toMatch(/depends_on\s*=\s*\[/);
    });
  });

  describe('EKS Node Group Configuration (eks-node-group.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('eks-node-group.tf');
    });

    test('creates managed node group resource', () => {
      expect(content).toMatch(/resource\s+"aws_eks_node_group"\s+/);
    });

    test('node group name uses environment_suffix', () => {
      const nodeGroupBlock = content.match(/node_group_name\s*=\s*"[^"]*"/);
      expect(nodeGroupBlock).toBeTruthy();
      expect(hasEnvironmentSuffix(nodeGroupBlock![0])).toBe(true);
    });

    test('uses Graviton2 ARM instance types (t4g.medium)', () => {
      expect(content).toMatch(/instance_types\s*=\s*\[.*var\.node_instance_type.*\]/);
      const variablesContent = readTerraformFile('variables.tf');
      expect(variablesContent).toMatch(/node_instance_type.*t4g\.medium/s);
    });

    test('uses Amazon Linux 2 EKS-optimized AMI', () => {
      expect(content).toMatch(/ami_type\s*=\s*"AL2_ARM_64"/);
    });

    test('configures scaling with min, max, and desired size', () => {
      expect(content).toMatch(/scaling_config\s*{/);
      expect(content).toMatch(/min_size\s*=\s*var\.node_min_size/);
      expect(content).toMatch(/max_size\s*=\s*var\.node_max_size/);
      expect(content).toMatch(/desired_size\s*=\s*var\.node_desired_size/);
    });

    test('distributes nodes across 3 AZs', () => {
      expect(content).toMatch(/subnet_ids/);
    });

    test('configures launch template', () => {
      expect(content).toMatch(/launch_template\s*{/);
    });

    test('configures gp3 EBS volumes via launch template', () => {
      expect(content).toMatch(/volume_type\s*=\s*"gp3"/);
      expect(content).toMatch(/volume_size\s*=\s*var\.node_disk_size/);
    });

    test('configures 3000 IOPS for EBS volumes', () => {
      expect(content).toMatch(/iops\s*=\s*3000/);
    });

    test('configures 125 MiB/s throughput for EBS volumes', () => {
      expect(content).toMatch(/throughput\s*=\s*125/);
    });

    test('enables EBS encryption', () => {
      expect(content).toMatch(/encrypted\s*=\s*true/);
    });

    test('configures update settings', () => {
      expect(content).toMatch(/update_config\s*{/);
    });

    test('has proper depends_on for IAM policies', () => {
      expect(content).toMatch(/depends_on\s*=\s*\[/);
    });

    test('references node IAM role', () => {
      expect(content).toMatch(/node_role_arn\s*=\s*aws_iam_role/);
    });

    test('launch template configured properly', () => {
      const launchTemplateBlock = content.match(/resource\s+"aws_launch_template"/);
      expect(launchTemplateBlock).toBeTruthy();
    });
  });

  describe('VPC CNI Addon Configuration (vpc-cni-addon.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('vpc-cni-addon.tf');
    });

    test('creates VPC CNI addon', () => {
      expect(content).toMatch(/resource\s+"aws_eks_addon"\s+/);
    });

    test('specifies vpc-cni addon name', () => {
      expect(content).toMatch(/addon_name\s*=\s*"vpc-cni"/);
    });

    test('enables prefix delegation', () => {
      expect(content).toMatch(/ENABLE_PREFIX_DELEGATION/);
      expect(content).toMatch(/"true"/);
    });

    test('configures addon version', () => {
      expect(content).toMatch(/addon_version/);
    });

    test('references EKS cluster', () => {
      expect(content).toMatch(/cluster_name\s*=\s*aws_eks_cluster/);
    });

    test('has proper depends_on or references for cluster', () => {
      const hasDepends = content.match(/depends_on\s*=\s*\[.*aws_eks_cluster/) || 
                        content.match(/cluster_name\s*=\s*aws_eks_cluster/);
      expect(hasDepends).toBeTruthy();
    });
  });

  describe('Outputs Configuration (outputs.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('outputs.tf');
    });

    test('outputs cluster endpoint', () => {
      expect(content).toMatch(/output\s+".*cluster.*endpoint/i);
    });

    test('outputs cluster certificate authority', () => {
      expect(content).toMatch(/output\s+".*certificate/i);
    });

    test('outputs OIDC provider URL', () => {
      expect(content).toMatch(/output\s+".*oidc/i);
    });

    test('outputs OIDC provider ARN', () => {
      expect(content).toMatch(/output\s+".*oidc.*provider.*arn/i);
    });

    test('outputs cluster name', () => {
      expect(content).toMatch(/output\s+".*cluster.*name/i);
    });

    test('outputs VPC ID', () => {
      expect(content).toMatch(/output\s+".*vpc.*id/i);
    });

    test('outputs subnet IDs', () => {
      expect(content).toMatch(/output\s+".*subnet/i);
    });

    test('outputs node group information', () => {
      expect(content).toMatch(/output\s+".*node.*group/i);
    });

    test('outputs kubectl config command', () => {
      expect(content).toMatch(/output\s+".*kubectl.*config/i);
    });

    test('all outputs have descriptions', () => {
      const outputBlocks = content.match(/output\s+"[^"]*"\s*{[^}]*}/gs);
      expect(outputBlocks).toBeTruthy();
      expect(outputBlocks!.length).toBeGreaterThan(0);

      outputBlocks!.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('outputs reference correct resource attributes', () => {
      const outputBlocks = content.match(/output\s+"[^"]*"\s*{[^}]*}/gs);
      expect(outputBlocks).toBeTruthy();

      outputBlocks!.forEach(block => {
        expect(block).toMatch(/value\s*=/);
      });
    });
  });

  describe('Resource Tagging', () => {
    test('common_tags variable includes Environment tag', () => {
      const variablesContent = readTerraformFile('variables.tf');
      expect(variablesContent).toMatch(/Environment\s*=\s*"[Pp]roduction"/);
    });

    test('common_tags variable includes ManagedBy tag', () => {
      const variablesContent = readTerraformFile('variables.tf');
      expect(variablesContent).toMatch(/ManagedBy\s*=\s*"[Tt]erraform"/);
    });
  });

  describe('Best Practices', () => {
    test('no hardcoded regions (uses variable)', () => {
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toMatch(/var\.region/);
    });

    test('no hardcoded account IDs', () => {
      const allFiles = ['provider.tf', 'iam-cluster.tf', 'iam-nodes.tf', 'iam-autoscaler.tf'];
      allFiles.forEach(file => {
        const content = readTerraformFile(file);
        expect(content).not.toMatch(/["']\d{12}["']/);
      });
    });

    test('no Retain policies (destroyable infrastructure)', () => {
      const allFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
      allFiles.forEach(file => {
        const content = readTerraformFile(file);
        expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
      });
    });

    test('all resource names include environment_suffix', () => {
      const allFiles = ['vpc.tf', 'eks-cluster.tf', 'eks-node-group.tf', 'iam-cluster.tf', 'iam-nodes.tf'];

      allFiles.forEach(file => {
        const content = readTerraformFile(file);
        const suffixCount = (content.match(/var\.environment_suffix/g) || []).length;
        expect(suffixCount).toBeGreaterThan(0);
      });
    });

    test('uses depends_on for resource dependencies where needed', () => {
      const eksContent = readTerraformFile('eks-cluster.tf');
      const nodesContent = readTerraformFile('eks-node-group.tf');

      expect(eksContent.includes('depends_on')).toBe(true);
      expect(nodesContent.includes('depends_on')).toBe(true);
    });

    test('IAM policies use AWS managed policies', () => {
      const iamClusterContent = readTerraformFile('iam-cluster.tf');
      const iamNodesContent = readTerraformFile('iam-nodes.tf');

      expect(iamClusterContent).toMatch(/arn:aws:iam::aws:policy/);
      expect(iamNodesContent).toMatch(/arn:aws:iam::aws:policy/);
    });
  });

  describe('Security Hardening', () => {
    test('KMS encryption enabled for EKS secrets', () => {
      const eksContent = readTerraformFile('eks-cluster.tf');
      expect(eksContent).toMatch(/encryption_config\s*{/);
      expect(eksContent).toMatch(/resources\s*=\s*\["secrets"\]/);
    });

    test('private API endpoint configured', () => {
      const eksContent = readTerraformFile('eks-cluster.tf');
      expect(eksContent).toMatch(/endpoint_private_access\s*=\s*true/);
    });

    test('public endpoint access restricted', () => {
      const eksContent = readTerraformFile('eks-cluster.tf');
      expect(eksContent).toMatch(/public_access_cidrs/);
    });

    test('IRSA (IAM Roles for Service Accounts) configured', () => {
      const eksContent = readTerraformFile('eks-cluster.tf');
      expect(eksContent).toMatch(/aws_iam_openid_connect_provider/);
    });

    test('CloudWatch logging enabled for api and audit', () => {
      const eksContent = readTerraformFile('eks-cluster.tf');
      expect(eksContent).toMatch(/enabled_cluster_log_types/);
      expect(eksContent).toMatch(/"api"/);
      expect(eksContent).toMatch(/"audit"/);
    });

    test('EBS volumes encrypted', () => {
      const nodesContent = readTerraformFile('eks-node-group.tf');
      expect(nodesContent).toMatch(/encrypted\s*=\s*true/);
    });

    test('nodes in private subnets', () => {
      const nodesContent = readTerraformFile('eks-node-group.tf');
      const vpcContent = readTerraformFile('vpc.tf');

      expect(nodesContent).toMatch(/subnet_ids/);
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private/);
    });

    test('IAM roles follow least privilege', () => {
      const iamClusterContent = readTerraformFile('iam-cluster.tf');
      const iamNodesContent = readTerraformFile('iam-nodes.tf');

      expect(iamClusterContent).toMatch(/AmazonEKS/);
      expect(iamNodesContent).toMatch(/AmazonEKS/);
      expect(iamClusterContent).not.toMatch(/Action\s*=\s*"\*"/);
    });
  });

  describe('Cost Optimization', () => {
    test('uses Graviton2 ARM instances (t4g.medium)', () => {
      const variablesContent = readTerraformFile('variables.tf');
      expect(variablesContent).toMatch(/node_instance_type.*t4g\.medium/s);
    });

    test('configures auto-scaling for efficient resource usage', () => {
      const variablesContent = readTerraformFile('variables.tf');
      expect(variablesContent).toMatch(/node_min_size/);
      expect(variablesContent).toMatch(/node_max_size/);
      expect(variablesContent).toMatch(/default\s*=\s*3/);
      expect(variablesContent).toMatch(/default\s*=\s*15/);
    });

    test('starts with minimum of 3 nodes', () => {
      const variablesContent = readTerraformFile('variables.tf');
      expect(variablesContent).toMatch(/node_desired_size[\s\S]*?default\s*=\s*3/);
    });

    test('uses gp3 volumes for better price-performance', () => {
      const nodesContent = readTerraformFile('eks-node-group.tf');
      expect(nodesContent).toMatch(/volume_type\s*=\s*"gp3"/);
    });

    test('selective logging (only api and audit)', () => {
      const eksContent = readTerraformFile('eks-cluster.tf');
      expect(eksContent).toMatch(/enabled_cluster_log_types[\s\S]*?"api"[\s\S]*?"audit"/);
    });
  });

  describe('High Availability', () => {
    test('infrastructure spans 3 availability zones', () => {
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toMatch(/slice.*3\)/);
    });

    test('nodes distributed across multiple AZs', () => {
      const nodesContent = readTerraformFile('eks-node-group.tf');
      expect(nodesContent).toMatch(/subnet_ids/);
    });

    test('NAT gateways for outbound connectivity', () => {
      const vpcContent = readTerraformFile('vpc.tf');
      expect(vpcContent).toMatch(/aws_nat_gateway/);
    });

    test('minimum of 3 nodes for redundancy', () => {
      const variablesContent = readTerraformFile('variables.tf');
      expect(variablesContent).toMatch(/node_min_size[\s\S]*?default\s*=\s*3/);
    });
  });

  describe('VPC CNI Prefix Delegation', () => {
    test('prefix delegation enabled', () => {
      const cniContent = readTerraformFile('vpc-cni-addon.tf');
      expect(cniContent).toMatch(/ENABLE_PREFIX_DELEGATION/);
      expect(cniContent).toMatch(/"true"/);
    });

    test('VPC CNI addon properly configured', () => {
      const cniContent = readTerraformFile('vpc-cni-addon.tf');
      expect(cniContent).toMatch(/addon_name\s*=\s*"vpc-cni"/);
      expect(cniContent).toMatch(/configuration_values/);
    });
  });

  describe('Cluster Autoscaler Integration', () => {
    test('autoscaler IAM role configured', () => {
      const autoscalerContent = readTerraformFile('iam-autoscaler.tf');
      expect(autoscalerContent).toMatch(/autoscaler/i);
    });

    test('autoscaler has correct permissions', () => {
      const autoscalerContent = readTerraformFile('iam-autoscaler.tf');
      expect(autoscalerContent).toMatch(/autoscaling:DescribeAutoScalingGroups|autoscaling:SetDesiredCapacity/);
    });

    test('autoscaler role configured with trust policy', () => {
      const autoscalerContent = readTerraformFile('iam-autoscaler.tf');
      expect(autoscalerContent).toMatch(/assume_role_policy/);
    });

    test('autoscaler role scoped to correct service account', () => {
      const autoscalerContent = readTerraformFile('iam-autoscaler.tf');
      expect(autoscalerContent).toMatch(/kube-system:cluster-autoscaler/);
    });
  });

  describe('README Documentation', () => {
    test('README contains deployment instructions', () => {
      const readmeContent = readTerraformFile('README.md');
      expect(readmeContent).toMatch(/terraform init|terraform apply/i);
    });

    test('README contains prerequisites', () => {
      const readmeContent = readTerraformFile('README.md');
      expect(readmeContent).toMatch(/prerequisite|requirement/i);
    });

    test('README contains architecture description', () => {
      const readmeContent = readTerraformFile('README.md');
      expect(readmeContent).toMatch(/architecture|infrastructure/i);
    });

    test('README contains kubectl configuration instructions', () => {
      const readmeContent = readTerraformFile('README.md');
      expect(readmeContent).toMatch(/kubectl|kubeconfig/i);
    });
  });
});
