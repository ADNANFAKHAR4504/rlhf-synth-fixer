// Unit tests for Terraform EKS Cluster Infrastructure
// Simple presence + sanity checks for the lib/*.tf files
// No Terraform commands are executed.

import fs from 'fs';
import path from 'path';

const libPath = path.resolve(__dirname, '../lib');

describe('Terraform EKS Cluster Infrastructure Unit Tests', () => {
  let mainContent: string;
  let eksContent: string;
  let providerContent: string;
  let versionsContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let backendContent: string;
  let networkingContent: string;
  let securityContent: string;
  let nodeGroupsContent: string;
  let iamContent: string;
  let addonsContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    eksContent = fs.readFileSync(path.join(libPath, 'eks.tf'), 'utf8');
    providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    versionsContent = fs.readFileSync(path.join(libPath, 'versions.tf'), 'utf8');
    variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    backendContent = fs.readFileSync(path.join(libPath, 'backend.tf'), 'utf8');
    networkingContent = fs.readFileSync(path.join(libPath, 'networking.tf'), 'utf8');
    securityContent = fs.readFileSync(path.join(libPath, 'security.tf'), 'utf8');
    nodeGroupsContent = fs.readFileSync(path.join(libPath, 'node-groups.tf'), 'utf8');
    iamContent = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
    addonsContent = fs.readFileSync(path.join(libPath, 'addons.tf'), 'utf8');
  });

  describe('File Structure', () => {
    const requiredFiles = [
      'main.tf',
      'eks.tf',
      'provider.tf',
      'versions.tf',
      'variables.tf',
      'outputs.tf',
      'backend.tf',
      'networking.tf',
      'security.tf',
      'node-groups.tf',
      'iam.tf',
      'addons.tf',
    ];

    requiredFiles.forEach((file) => {
      test(`${file} exists`, () => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Backend Configuration', () => {
    test('should have S3 backend configured', () => {
      expect(backendContent).toMatch(/backend\s+"s3"\s*\{/);
    });
  });

  describe('Provider Configuration', () => {
    test('should have AWS provider configured', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
    });

    test('should use aws_region variable', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('should have default tags configured', () => {
      expect(providerContent).toMatch(/default_tags\s*\{/);
    });
  });

  describe('Terraform Version Requirements', () => {
    test('should have required Terraform version', () => {
      expect(versionsContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('should have AWS provider requirement', () => {
      expect(versionsContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(versionsContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('should have TLS provider requirement', () => {
      expect(versionsContent).toMatch(/source\s*=\s*"hashicorp\/tls"/);
    });
  });

  describe('Variable Definitions', () => {
    test('should have aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
    });

    test('should have environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test('should have vpc_cidr variable', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*\{/);
    });

    test('should have cluster_version variable', () => {
      expect(variablesContent).toMatch(/variable\s+"cluster_version"\s*\{/);
    });

    test('should have enable_cluster_autoscaler variable', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_cluster_autoscaler"\s*\{/);
    });

    test('should have enable_spot_instances variable', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_spot_instances"\s*\{/);
    });
  });

  describe('Main Configuration', () => {
    test('should have data source for AWS caller identity', () => {
      expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should have data source for AWS region', () => {
      expect(mainContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test('should have locals block with cluster_name', () => {
      expect(mainContent).toMatch(/locals\s*\{/);
      expect(mainContent).toMatch(/cluster_name\s*=/);
    });

    test('should have common_tags in locals', () => {
      expect(mainContent).toMatch(/common_tags\s*=/);
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should have EKS cluster resource', () => {
      expect(eksContent).toMatch(/resource\s+"aws_eks_cluster"\s+"main"/);
    });

    test('should have cluster version configured', () => {
      expect(eksContent).toMatch(/version\s*=\s*var\.cluster_version/);
    });

    test('should have VPC config with private endpoint access', () => {
      expect(eksContent).toMatch(/endpoint_private_access\s*=\s*true/);
    });

    test('should have public endpoint disabled', () => {
      expect(eksContent).toMatch(/endpoint_public_access\s*=\s*false/);
    });

    test('should have encryption config for secrets', () => {
      expect(eksContent).toMatch(/encryption_config\s*\{/);
      expect(eksContent).toMatch(/resources\s*=\s*\["secrets"\]/);
    });

    test('should have cluster logging enabled', () => {
      expect(eksContent).toMatch(/enabled_cluster_log_types\s*=/);
    });

    test('should have OIDC provider removed with explanation comment', () => {
      expect(eksContent).toMatch(/OIDC Provider removed due to LocalStack limitation/);
    });
  });

  describe('Networking Configuration', () => {
    test('should have VPC resource', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('should have DNS hostnames enabled', () => {
      expect(networkingContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('should have Internet Gateway', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should have private subnets for control plane', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_control_plane"/);
    });

    test('should have private subnets for system node group', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_system"/);
    });

    test('should have private subnets for application node group', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_application"/);
    });

    test('should have private subnets for spot node group', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_spot"/);
    });

    test('should have NAT Gateway', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test('should have Elastic IPs for NAT', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('should have route tables for private subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_route_table"\s+"private_control_plane"/);
      expect(networkingContent).toMatch(/resource\s+"aws_route_table"\s+"private_system"/);
      expect(networkingContent).toMatch(/resource\s+"aws_route_table"\s+"private_application"/);
      expect(networkingContent).toMatch(/resource\s+"aws_route_table"\s+"private_spot"/);
    });
  });

  describe('Security Configuration', () => {
    test('should have KMS key for EKS secrets', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_key"\s+"eks"/);
    });

    test('should have key rotation enabled', () => {
      expect(securityContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should have KMS alias', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_alias"\s+"eks"/);
    });

    test('should have EKS cluster security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"eks_cluster"/);
    });

    test('should have system nodes security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"system_nodes"/);
    });

    test('should have application nodes security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"application_nodes"/);
    });

    test('should have spot nodes security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"spot_nodes"/);
    });
  });

  describe('Node Groups Configuration', () => {
    test('should have system node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"system"/);
    });

    test('should have application node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"application"/);
    });

    test('should have spot node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"spot"/);
    });

    test('should have launch template for system nodes', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_launch_template"\s+"system"/);
    });

    test('should have launch template for application nodes', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_launch_template"\s+"application"/);
    });

    test('should have launch template for spot nodes', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_launch_template"\s+"spot"/);
    });

    test('should have IMDSv2 required in launch templates', () => {
      expect(nodeGroupsContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test('spot node group should use SPOT capacity type', () => {
      expect(nodeGroupsContent).toMatch(/capacity_type\s*=\s*"SPOT"/);
    });

    test('node groups should have taints configured', () => {
      expect(nodeGroupsContent).toMatch(/taint\s*\{/);
    });
  });

  describe('IAM Configuration', () => {
    test('should have EKS cluster IAM role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"eks_cluster"/);
    });

    test('should have EKS nodes IAM role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"eks_nodes"/);
    });

    test('should have EKS cluster policy attachment', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_cluster_policy"/);
    });

    test('should have worker node policy attachment', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_worker_node_policy"/);
    });

    test('should have CNI policy attachment', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_cni_policy"/);
    });

    test('should have cluster autoscaler policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"cluster_autoscaler"/);
    });

    test('should have EBS CSI driver policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"ebs_csi_driver"/);
    });

    test('should have EBS CSI driver IAM role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ebs_csi_driver"/);
    });

    test('should have Load Balancer Controller policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"load_balancer_controller"/);
    });

    test('should have Load Balancer Controller IAM role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"load_balancer_controller"/);
    });
  });

  describe('EKS Addons Configuration', () => {
    test('should have EBS CSI driver addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"ebs_csi_driver"/);
    });

    test('should have VPC CNI addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"vpc_cni"/);
    });

    test('should have CoreDNS addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"coredns"/);
    });

    test('should have kube-proxy addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"kube_proxy"/);
    });
  });

  describe('Output Definitions', () => {
    test('should have cluster_id output', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_id"/);
    });

    test('should have cluster_name output', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_name"/);
    });

    test('should have cluster_endpoint output', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_endpoint"/);
    });

    test('cluster_endpoint should be marked sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_endpoint"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('should have vpc_id output', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });

    test('should have node group outputs', () => {
      expect(outputsContent).toMatch(/output\s+"system_node_group_id"/);
      expect(outputsContent).toMatch(/output\s+"application_node_group_id"/);
    });

    test('should have IAM role outputs', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_iam_role_arn"/);
      expect(outputsContent).toMatch(/output\s+"node_iam_role_arn"/);
    });

    test('should have configure_kubectl output', () => {
      expect(outputsContent).toMatch(/output\s+"configure_kubectl"/);
    });
  });

  describe('Security Best Practices', () => {
    test('should use environment_suffix for resource naming', () => {
      expect(eksContent).toContain('var.environment_suffix');
      expect(networkingContent).toContain('var.environment_suffix');
      expect(securityContent).toContain('var.environment_suffix');
    });

    test('should have KMS encryption for secrets', () => {
      expect(eksContent).toMatch(/key_arn\s*=\s*aws_kms_key\.eks\.arn/);
    });

    test('should have Kubernetes cluster tags on subnets', () => {
      expect(networkingContent).toMatch(/kubernetes\.io\/cluster/);
    });

    test('should have internal-elb tags on private subnets', () => {
      expect(networkingContent).toMatch(/kubernetes\.io\/role\/internal-elb/);
    });
  });

  describe('High Availability', () => {
    test('should create 3 subnets per node group type', () => {
      expect(networkingContent).toMatch(/count\s*=\s*3/);
    });

    test('should use multiple availability zones', () => {
      expect(networkingContent).toMatch(/data\.aws_availability_zones\.available\.names/);
    });

    test('should have multiple NAT gateways', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?count\s*=\s*3/);
    });
  });
});
