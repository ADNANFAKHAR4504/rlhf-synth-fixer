// TAP Stack Unit Tests for Terraform EKS Cluster Infrastructure
// Validates the infrastructure configuration files

import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack - EKS Cluster Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
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

  describe('Infrastructure Files Existence', () => {
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
      test(`${file} should exist`, () => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Backend State Management', () => {
    test('should use S3 backend', () => {
      expect(backendContent).toMatch(/backend\s+"s3"\s*\{/);
    });
  });

  describe('Provider Setup', () => {
    test('should configure AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
    });

    test('should use variable for region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('should set default tags', () => {
      expect(providerContent).toMatch(/default_tags\s*\{/);
    });
  });

  describe('Terraform Version Constraints', () => {
    test('should require Terraform 1.5.0 or higher', () => {
      expect(versionsContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('should require AWS provider version 5.x', () => {
      expect(versionsContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('should include TLS provider', () => {
      expect(versionsContent).toContain('hashicorp/tls');
    });
  });

  describe('Variable Definitions', () => {
    test('should define aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
    });

    test('should define environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test('should define vpc_cidr variable', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*\{/);
    });

    test('should define cluster_version variable', () => {
      expect(variablesContent).toMatch(/variable\s+"cluster_version"\s*\{/);
    });

    test('should define enable_cluster_autoscaler variable', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_cluster_autoscaler"\s*\{/);
    });

    test('should define enable_spot_instances variable', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_spot_instances"\s*\{/);
    });

    test('should define team variable', () => {
      expect(variablesContent).toMatch(/variable\s+"team"\s*\{/);
    });

    test('should define cost_center variable', () => {
      expect(variablesContent).toMatch(/variable\s+"cost_center"\s*\{/);
    });
  });

  describe('Main Configuration', () => {
    test('should have AWS caller identity data source', () => {
      expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should have AWS region data source', () => {
      expect(mainContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test('should define locals block', () => {
      expect(mainContent).toMatch(/locals\s*\{/);
    });

    test('should define cluster_name in locals', () => {
      expect(mainContent).toContain('cluster_name');
    });

    test('should define common_tags in locals', () => {
      expect(mainContent).toContain('common_tags');
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should create EKS cluster resource', () => {
      expect(eksContent).toMatch(/resource\s+"aws_eks_cluster"\s+"main"/);
    });

    test('should use cluster_version variable', () => {
      expect(eksContent).toMatch(/version\s*=\s*var\.cluster_version/);
    });

    test('should enable private endpoint access', () => {
      expect(eksContent).toMatch(/endpoint_private_access\s*=\s*true/);
    });

    test('should disable public endpoint access', () => {
      expect(eksContent).toMatch(/endpoint_public_access\s*=\s*false/);
    });

    test('should configure encryption for secrets', () => {
      expect(eksContent).toMatch(/encryption_config\s*\{/);
      expect(eksContent).toContain('secrets');
    });

    test('should enable cluster logging', () => {
      expect(eksContent).toContain('enabled_cluster_log_types');
      expect(eksContent).toContain('api');
      expect(eksContent).toContain('audit');
    });

    test('should have OIDC provider removed with explanation comment', () => {
      expect(eksContent).toMatch(/OIDC Provider removed due to LocalStack limitation/);
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC resource', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('should enable DNS hostnames', () => {
      expect(networkingContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('should enable DNS support', () => {
      expect(networkingContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should create Internet Gateway', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should create control plane subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_control_plane"/);
    });

    test('should create system node subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_system"/);
    });

    test('should create application node subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_application"/);
    });

    test('should create spot node subnets', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_spot"/);
    });

    test('should create NAT Gateways', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test('should create Elastic IPs for NAT', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('should create route tables', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_route_table"/);
    });

    test('should create route table associations', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_route_table_association"/);
    });
  });

  describe('Security Resources', () => {
    test('should create KMS key for EKS', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_key"\s+"eks"/);
    });

    test('should enable KMS key rotation', () => {
      expect(securityContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should create KMS alias', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_alias"\s+"eks"/);
    });

    test('should create cluster security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"eks_cluster"/);
    });

    test('should create system nodes security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"system_nodes"/);
    });

    test('should create application nodes security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"application_nodes"/);
    });

    test('should create spot nodes security group', () => {
      expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"spot_nodes"/);
    });

    test('security groups should allow egress', () => {
      expect(securityContent).toMatch(/egress\s*\{/);
    });
  });

  describe('Node Groups', () => {
    test('should create system node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"system"/);
    });

    test('should create application node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"application"/);
    });

    test('should create spot node group', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"spot"/);
    });

    test('should create system launch template', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_launch_template"\s+"system"/);
    });

    test('should create application launch template', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_launch_template"\s+"application"/);
    });

    test('should create spot launch template', () => {
      expect(nodeGroupsContent).toMatch(/resource\s+"aws_launch_template"\s+"spot"/);
    });

    test('should require IMDSv2 tokens', () => {
      expect(nodeGroupsContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test('should configure scaling for node groups', () => {
      expect(nodeGroupsContent).toMatch(/scaling_config\s*\{/);
    });

    test('should configure node labels', () => {
      expect(nodeGroupsContent).toMatch(/labels\s*=\s*\{/);
    });

    test('should configure node taints', () => {
      expect(nodeGroupsContent).toMatch(/taint\s*\{/);
    });

    test('spot node group should use ON_DEMAND due to LocalStack limitation', () => {
      expect(nodeGroupsContent).toMatch(/capacity_type\s*=\s*"ON_DEMAND"/);
      expect(nodeGroupsContent).toMatch(/LocalStack does not properly emulate SPOT capacity type/);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EKS cluster IAM role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"eks_cluster"/);
    });

    test('should create node group IAM role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"eks_nodes"/);
    });

    test('should attach EKS cluster policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_cluster_policy"/);
      expect(iamContent).toContain('AmazonEKSClusterPolicy');
    });

    test('should attach worker node policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_worker_node_policy"/);
      expect(iamContent).toContain('AmazonEKSWorkerNodePolicy');
    });

    test('should attach CNI policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_cni_policy"/);
      expect(iamContent).toContain('AmazonEKS_CNI_Policy');
    });

    test('should attach container registry policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_container_registry_policy"/);
      expect(iamContent).toContain('AmazonEC2ContainerRegistryReadOnly');
    });

    test('should create cluster autoscaler policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"cluster_autoscaler"/);
    });

    test('should create EBS CSI driver policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"ebs_csi_driver"/);
    });

    test('should create EBS CSI driver IAM role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ebs_csi_driver"/);
    });

    test('should create Load Balancer Controller policy', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"load_balancer_controller"/);
    });

    test('should create Load Balancer Controller IAM role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"load_balancer_controller"/);
    });
  });

  describe('EKS Addons', () => {
    test('should install EBS CSI driver addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"ebs_csi_driver"/);
      expect(addonsContent).toContain('aws-ebs-csi-driver');
    });

    test('should install VPC CNI addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"vpc_cni"/);
      expect(addonsContent).toContain('vpc-cni');
    });

    test('should install CoreDNS addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"coredns"/);
      expect(addonsContent).toContain('coredns');
    });

    test('should install kube-proxy addon', () => {
      expect(addonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"kube_proxy"/);
      expect(addonsContent).toContain('kube-proxy');
    });
  });

  describe('Outputs', () => {
    test('should output cluster_id', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_id"/);
    });

    test('should output cluster_name', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_name"/);
    });

    test('should output cluster_endpoint', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_endpoint"/);
    });

    test('cluster_endpoint should be sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_endpoint"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('should output cluster_security_group_id', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_security_group_id"/);
    });

    test('should output cluster_iam_role_arn', () => {
      expect(outputsContent).toMatch(/output\s+"cluster_iam_role_arn"/);
    });

    test('should output vpc_id', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });

    test('should output subnet IDs', () => {
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids_control_plane"/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids_system"/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids_application"/);
    });

    test('should output KMS key info', () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_id"/);
      expect(outputsContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test('should output node group IDs', () => {
      expect(outputsContent).toMatch(/output\s+"system_node_group_id"/);
      expect(outputsContent).toMatch(/output\s+"application_node_group_id"/);
    });

    test('should output kubectl configuration command', () => {
      expect(outputsContent).toMatch(/output\s+"configure_kubectl"/);
    });
  });

  describe('Security Best Practices', () => {
    test('should use environment_suffix for naming isolation', () => {
      expect(eksContent).toContain('environment_suffix');
      expect(networkingContent).toContain('environment_suffix');
      expect(securityContent).toContain('environment_suffix');
      expect(nodeGroupsContent).toContain('environment_suffix');
      expect(iamContent).toContain('environment_suffix');
    });

    test('should use KMS encryption for secrets', () => {
      expect(eksContent).toContain('aws_kms_key.eks.arn');
    });

    test('should tag subnets for Kubernetes', () => {
      expect(networkingContent).toContain('kubernetes.io/cluster');
    });

    test('should tag subnets for internal load balancers', () => {
      expect(networkingContent).toContain('kubernetes.io/role/internal-elb');
    });

    test('should use simplified IAM roles without OIDC for LocalStack', () => {
      expect(iamContent).toContain('Simplified IAM role without OIDC due to LocalStack limitation');
      expect(iamContent).toContain('AssumeRole');
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy across multiple availability zones', () => {
      expect(networkingContent).toContain('aws_availability_zones');
    });

    test('should create multiple subnets', () => {
      expect(networkingContent).toMatch(/count\s*=\s*3/);
    });

    test('should have single NAT gateway for cost optimization', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      // Single NAT Gateway should not have count parameter
      const natGatewayMatch = networkingContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[^}]*}/s);
      expect(natGatewayMatch).toBeTruthy();
      if (natGatewayMatch) {
        expect(natGatewayMatch[0]).not.toMatch(/count\s*=/);
      }
    });
  });
});
