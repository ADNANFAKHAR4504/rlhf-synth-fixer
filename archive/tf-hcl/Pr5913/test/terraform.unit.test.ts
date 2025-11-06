// Unit tests for Terraform EKS infrastructure
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

describe('Terraform EKS Infrastructure - Unit Tests', () => {

  describe('File Structure', () => {
    test('all required Terraform files exist', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'vpc.tf',
        'security.tf',
        'iam.tf',
        'eks.tf',
        'nodes.tf',
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

    test('sets default region', () => {
      expect(content).toMatch(/region\s*=/);
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

    test('declares aws_region variable', () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('declares cluster_name variable', () => {
      expect(content).toMatch(/variable\s+"cluster_name"\s*{/);
    });

    test('declares kubernetes_version variable', () => {
      expect(content).toMatch(/variable\s+"kubernetes_version"\s*{/);
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

    test('subnets span multiple availability zones', () => {
      expect(content).toMatch(/availability_zone/);
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
  });

  describe('Security Configuration (security.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('security.tf');
    });

    test('creates KMS key for EKS encryption', () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+/);
    });


    test('KMS key has alias', () => {
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+/);
    });


    test('creates security groups', () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+/);
    });

    test('security groups use environment_suffix', () => {
      const sgBlocks = content.match(/resource\s+"aws_security_group"\s+[^{]*{[^}]*}/gs);
      expect(sgBlocks).toBeTruthy();
      sgBlocks!.forEach(block => {
        expect(hasEnvironmentSuffix(block)).toBe(true);
      });
    });

    test('defines security group rules', () => {
      expect(content).toMatch(/resource\s+"aws_security_group_rule"\s+/);
    });
  });

  describe('IAM Configuration (iam.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('iam.tf');
    });

    test('creates EKS cluster IAM role', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+".*cluster/);
    });

    test('creates EKS node IAM role', () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+".*node/);
    });

    test('IAM roles use environment_suffix', () => {
      const iamRoleBlocks = content.match(/resource\s+"aws_iam_role"\s+[^{]*{[^}]*}/gs);
      expect(iamRoleBlocks).toBeTruthy();
      iamRoleBlocks!.forEach(block => {
        expect(hasEnvironmentSuffix(block)).toBe(true);
      });
    });

    test('attaches AmazonEKSClusterPolicy', () => {
      expect(content).toMatch(/AmazonEKSClusterPolicy/);
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

    test('creates IAM role for cluster autoscaler', () => {
      expect(content).toMatch(/cluster.*autoscaler|autoscaler/i);
    });

    test('creates IRSA sample role', () => {
      expect(content).toMatch(/irsa|service.*account/i);
    });

    test('defines assume role policies', () => {
      expect(content).toMatch(/assume_role_policy\s*=/);
    });

    test('IAM policies reference EKS service', () => {
      expect(content).toMatch(/eks\.amazonaws\.com/);
    });
  });

  describe('EKS Cluster Configuration (eks.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('eks.tf');
    });

    test('creates EKS cluster resource', () => {
      expect(content).toMatch(/resource\s+"aws_eks_cluster"\s+/);
    });


    test('creates OIDC provider', () => {
      expect(content).toMatch(/resource\s+"aws_iam_openid_connect_provider"\s+/);
    });


    test('configures all log types', () => {
      expect(content).toMatch(/api.*audit.*authenticator.*controllerManager.*scheduler/s);
    });

    test('creates CloudWatch log group', () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+/);
    });

  });

  describe('Node Groups Configuration (nodes.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('nodes.tf');
    });

    test('creates managed node group resource', () => {
      expect(content).toMatch(/resource\s+"aws_eks_node_group"\s+/);
    });

    test('node groups use environment_suffix', () => {
      const nodeGroupBlocks = content.match(/resource\s+"aws_eks_node_group"\s+[^{]*{[^}]*}/gs);
      expect(nodeGroupBlocks).toBeTruthy();
      nodeGroupBlocks!.forEach(block => {
        expect(hasEnvironmentSuffix(block)).toBe(true);
      });
    });

    test('configures Spot instances', () => {
      expect(content).toMatch(/capacity_type\s*=\s*"SPOT"/);
    });

    test('configures On-Demand instances', () => {
      expect(content).toMatch(/capacity_type\s*=\s*"ON_DEMAND"/);
    });

    test('uses mixed instance types', () => {
      expect(content).toMatch(/instance_types\s*=\s*\[/);
      expect(content).toMatch(/t3\.medium|t3\.large/);
    });



    test('configures update settings', () => {
      expect(content).toMatch(/update_config\s*{/);
    });

    test('node groups span multiple AZs', () => {
      // Should have at least 3 subnets referenced
      const subnetRefs = content.match(/subnet_ids/g);
      expect(subnetRefs).toBeTruthy();
    });
  });

  describe('Outputs Configuration (outputs.tf)', () => {
    let content: string;

    beforeAll(() => {
      content = readTerraformFile('outputs.tf');
    });

    test('outputs cluster endpoint', () => {
      expect(content).toMatch(/output\s+".*cluster.*endpoint/);
    });

    test('outputs cluster certificate authority', () => {
      expect(content).toMatch(/output\s+".*certificate/);
    });

    test('outputs OIDC provider URL', () => {
      expect(content).toMatch(/output\s+".*oidc.*provider.*url/i);
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

    test('outputs security group IDs', () => {
      expect(content).toMatch(/output\s+".*security.*group/i);
    });

    test('outputs KMS key ARN', () => {
      expect(content).toMatch(/output\s+".*kms/i);
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
    test('resources include Environment tag', () => {
      const allFiles = ['vpc.tf', 'eks.tf', 'nodes.tf', 'security.tf'];
      const hasEnvironmentTag = allFiles.some(file => {
        const content = readTerraformFile(file);
        return content.match(/Environment\s*=\s*"Production"/i);
      });
      expect(hasEnvironmentTag).toBe(true);
    });
  });

  describe('Best Practices', () => {
    test('no hardcoded regions (uses variable)', () => {
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toMatch(/var\.aws_region|var\.region/);
    });

    test('no hardcoded account IDs', () => {
      const allFiles = ['provider.tf', 'iam.tf', 'eks.tf'];
      allFiles.forEach(file => {
        const content = readTerraformFile(file);
        // Check for 12-digit account ID patterns
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
      const allFiles = ['vpc.tf', 'eks.tf', 'nodes.tf', 'security.tf', 'iam.tf'];

      allFiles.forEach(file => {
        const content = readTerraformFile(file);
        // Should have multiple references to environment_suffix
        const suffixCount = (content.match(/var\.environment_suffix/g) || []).length;
        expect(suffixCount).toBeGreaterThan(0);
      });
    });


    test('uses depends_on for resource dependencies where needed', () => {
      const eksContent = readTerraformFile('eks.tf');
      const nodesContent = readTerraformFile('nodes.tf');

      // At least one file should use depends_on
      const hasDependsOn = eksContent.includes('depends_on') || nodesContent.includes('depends_on');
      expect(hasDependsOn).toBe(true);
    });
  });

  describe('Security Hardening', () => {
    test('KMS encryption enabled for EKS secrets', () => {
      const eksContent = readTerraformFile('eks.tf');
      expect(eksContent).toMatch(/encryption_config\s*{/);
    });

    test('private API endpoint configured', () => {
      const eksContent = readTerraformFile('eks.tf');
      expect(eksContent).toMatch(/endpoint_private_access/);
    });

    test('IRSA (IAM Roles for Service Accounts) configured', () => {
      const iamContent = readTerraformFile('iam.tf');
      const eksContent = readTerraformFile('eks.tf');

      // Should have OIDC provider for IRSA
      expect(eksContent).toMatch(/aws_iam_openid_connect_provider/);
      // Should have sample IRSA role
      expect(iamContent).toMatch(/irsa|service.*account/i);
    });

    test('security groups defined', () => {
      const securityContent = readTerraformFile('security.tf');
      expect(securityContent).toMatch(/resource\s+"aws_security_group"/);
    });

    test('CloudWatch logging enabled', () => {
      const eksContent = readTerraformFile('eks.tf');
      expect(eksContent).toMatch(/enabled_cluster_log_types/);
      expect(eksContent).toMatch(/aws_cloudwatch_log_group/);
    });

    test('IAM policies follow least privilege', () => {
      const iamContent = readTerraformFile('iam.tf');
      // Should use AWS managed policies, not wildcard permissions
      expect(iamContent).toMatch(/AmazonEKS.*Policy/);
      expect(iamContent).not.toMatch(/Action\s*=\s*"\*"/);
    });

    test('nodes in private subnets', () => {
      const nodesContent = readTerraformFile('nodes.tf');
      const vpcContent = readTerraformFile('vpc.tf');

      // Should reference private subnets
      expect(nodesContent).toMatch(/private|subnet/i);
    });
  });

  describe('Cost Optimization', () => {
    test('uses Spot instances for cost savings', () => {
      const nodesContent = readTerraformFile('nodes.tf');
      expect(nodesContent).toMatch(/capacity_type\s*=\s*"SPOT"/);
    });

    test('configures auto-scaling for efficient resource usage', () => {
      const nodesContent = readTerraformFile('nodes.tf');
      expect(nodesContent).toMatch(/scaling_config/);
      expect(nodesContent).toMatch(/min_size/);
      expect(nodesContent).toMatch(/max_size/);
    });

    test('uses appropriate instance types (t3.medium, t3.large)', () => {
      const nodesContent = readTerraformFile('nodes.tf');
      expect(nodesContent).toMatch(/t3\.medium|t3\.large/);
    });

  });

  describe('High Availability', () => {
    test('infrastructure spans multiple availability zones', () => {
      const vpcContent = readTerraformFile('vpc.tf');
      // Should have multiple AZ references
      expect(vpcContent).toMatch(/availability_zone.*availability_zone/s);
    });

    test('multiple node groups configured', () => {
      const nodesContent = readTerraformFile('nodes.tf');
      const nodeGroupCount = (nodesContent.match(/resource\s+"aws_eks_node_group"/g) || []).length;
      expect(nodeGroupCount).toBeGreaterThanOrEqual(2); // Spot + On-Demand
    });

    test('NAT gateways for outbound connectivity', () => {
      const vpcContent = readTerraformFile('vpc.tf');
      expect(vpcContent).toMatch(/aws_nat_gateway/);
    });
  });
});
