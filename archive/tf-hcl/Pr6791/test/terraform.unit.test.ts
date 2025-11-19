// Unit tests for EKS Fargate Cluster Terraform configuration
// These tests validate the Terraform configuration structure and syntax without deploying

import fs from 'fs';
import path from 'path';

const libDir = path.resolve(__dirname, '../lib');

describe('Terraform Configuration Structure', () => {
  test('all required Terraform files exist', () => {
    const requiredFiles = [
      'provider.tf',
      'variables.tf',
      'vpc.tf',
      'iam.tf',
      'security_groups.tf',
      'eks_cluster.tf',
      'outputs.tf'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(libDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('provider.tf should configure AWS provider correctly', () => {
    const content = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');

    // Should have terraform block with required version
    expect(content).toMatch(/terraform\s*{/);
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.0"/);

    // Should configure AWS provider
    expect(content).toMatch(/provider\s+"aws"\s*{/);
    expect(content).toMatch(/hashicorp\/aws/);

    // Should use default_tags
    expect(content).toMatch(/default_tags\s*{/);
  });
});

describe('Variables Configuration', () => {
  test('variables.tf should declare environmentSuffix variable', () => {
    const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');

    expect(content).toMatch(/variable\s+"environmentSuffix"\s*{/);
    expect(content).toMatch(/type\s*=\s*string/);
  });

  test('variables.tf should declare region variable', () => {
    const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');

    expect(content).toMatch(/variable\s+"region"\s*{/);
    expect(content).toMatch(/default\s*=\s*"us-east-1"/);
  });

  test('variables.tf should declare VPC CIDR variable', () => {
    const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');

    expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test('variables.tf should declare cluster_version variable', () => {
    const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');

    expect(content).toMatch(/variable\s+"cluster_version"\s*{/);
  });

  test('variables.tf should declare app_namespace variable', () => {
    const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');

    expect(content).toMatch(/variable\s+"app_namespace"\s*{/);
  });
});

describe('VPC Configuration', () => {
  test('vpc.tf should create VPC with environmentSuffix in name', () => {
    const content = fs.readFileSync(path.join(libDir, 'vpc.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(content).toMatch(/vpc-trading-\$\{var\.environmentSuffix\}/);
  });

  test('vpc.tf should enable DNS support and hostnames', () => {
    const content = fs.readFileSync(path.join(libDir, 'vpc.tf'), 'utf8');

    expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(content).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test('vpc.tf should create internet gateway with environmentSuffix', () => {
    const content = fs.readFileSync(path.join(libDir, 'vpc.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    expect(content).toMatch(/igw-trading-\$\{var\.environmentSuffix\}/);
  });

  test('vpc.tf should create public and private subnets', () => {
    const content = fs.readFileSync(path.join(libDir, 'vpc.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(content).toMatch(/count\s*=\s*2/);
  });

  test('vpc.tf should create NAT gateways in public subnets', () => {
    const content = fs.readFileSync(path.join(libDir, 'vpc.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
  });

  test('vpc.tf should create route tables with proper routing', () => {
    const content = fs.readFileSync(path.join(libDir, 'vpc.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
  });

  test('vpc.tf should have EKS tags on subnets', () => {
    const content = fs.readFileSync(path.join(libDir, 'vpc.tf'), 'utf8');

    expect(content).toMatch(/kubernetes\.io\/cluster\/eks-cluster-\$\{var\.environmentSuffix\}/);
    expect(content).toMatch(/kubernetes\.io\/role\/elb/);
    expect(content).toMatch(/kubernetes\.io\/role\/internal-elb/);
  });
});

describe('IAM Configuration', () => {
  test('iam.tf should create EKS cluster role with environmentSuffix', () => {
    const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"cluster"\s*{/);
    expect(content).toMatch(/eks-cluster-role-\$\{var\.environmentSuffix\}/);
    expect(content).toMatch(/Service\s*=\s*"eks\.amazonaws\.com"/);
  });

  test('iam.tf should attach required policies to cluster role', () => {
    const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cluster_policy"\s*{/);
    expect(content).toMatch(/AmazonEKSClusterPolicy/);
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cluster_vpc_resource_controller"\s*{/);
    expect(content).toMatch(/AmazonEKSVPCResourceController/);
  });

  test('iam.tf should create Fargate pod execution role with environmentSuffix', () => {
    const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"fargate_pod_execution"\s*{/);
    expect(content).toMatch(/eks-fargate-pod-execution-role-\$\{var\.environmentSuffix\}/);
    expect(content).toMatch(/Service\s*=\s*"eks-fargate-pods\.amazonaws\.com"/);
  });

  test('iam.tf should attach Fargate pod execution policy', () => {
    const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"fargate_pod_execution_policy"\s*{/);
    expect(content).toMatch(/AmazonEKSFargatePodExecutionRolePolicy/);
  });
});

describe('Security Groups Configuration', () => {
  test('security_groups.tf should create cluster security group with environmentSuffix', () => {
    const content = fs.readFileSync(path.join(libDir, 'security_groups.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_security_group"\s+"cluster"\s*{/);
    expect(content).toMatch(/eks-cluster-sg-\$\{var\.environmentSuffix\}/);
  });

  test('security_groups.tf should allow cluster egress', () => {
    const content = fs.readFileSync(path.join(libDir, 'security_groups.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_security_group_rule"\s+"cluster_egress_all"\s*{/);
    expect(content).toMatch(/type\s*=\s*"egress"/);
  });

  test('security_groups.tf should allow pods to communicate with cluster API', () => {
    const content = fs.readFileSync(path.join(libDir, 'security_groups.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_security_group_rule"\s+"cluster_ingress_pods"\s*{/);
    expect(content).toMatch(/from_port\s*=\s*443/);
    expect(content).toMatch(/to_port\s*=\s*443/);
  });
});

describe('EKS Cluster Configuration', () => {
  test('eks_cluster.tf should create EKS cluster with environmentSuffix', () => {
    const content = fs.readFileSync(path.join(libDir, 'eks_cluster.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_eks_cluster"\s+"main"\s*{/);
    expect(content).toMatch(/eks-cluster-\$\{var\.environmentSuffix\}/);
  });

  test('eks_cluster.tf should enable cluster logging', () => {
    const content = fs.readFileSync(path.join(libDir, 'eks_cluster.tf'), 'utf8');

    expect(content).toMatch(/enabled_cluster_log_types\s*=\s*\[/);
    expect(content).toMatch(/"api"/);
    expect(content).toMatch(/"audit"/);
    expect(content).toMatch(/"authenticator"/);
    expect(content).toMatch(/"controllerManager"/);
    expect(content).toMatch(/"scheduler"/);
  });

  test('eks_cluster.tf should configure VPC settings', () => {
    const content = fs.readFileSync(path.join(libDir, 'eks_cluster.tf'), 'utf8');

    expect(content).toMatch(/vpc_config\s*{/);
    expect(content).toMatch(/endpoint_private_access\s*=\s*true/);
    expect(content).toMatch(/endpoint_public_access\s*=\s*true/);
  });

  test('eks_cluster.tf should NOT have any EC2 node groups', () => {
    const content = fs.readFileSync(path.join(libDir, 'eks_cluster.tf'), 'utf8');

    expect(content).not.toMatch(/aws_eks_node_group/);
    expect(content).not.toMatch(/node_group/i);
  });

  test('eks_cluster.tf should create Fargate profile for kube-system', () => {
    const content = fs.readFileSync(path.join(libDir, 'eks_cluster.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_eks_fargate_profile"\s+"kube_system"\s*{/);
    expect(content).toMatch(/fargate-profile-kube-system-\$\{var\.environmentSuffix\}/);
    expect(content).toMatch(/namespace\s*=\s*"kube-system"/);
  });

  test('eks_cluster.tf should create Fargate profile for application', () => {
    const content = fs.readFileSync(path.join(libDir, 'eks_cluster.tf'), 'utf8');

    expect(content).toMatch(/resource\s+"aws_eks_fargate_profile"\s+"application"\s*{/);
    expect(content).toMatch(/fargate-profile-app-\$\{var\.environmentSuffix\}/);
    expect(content).toMatch(/namespace\s*=\s*var\.app_namespace/);
    expect(content).toMatch(/namespace\s*=\s*"default"/);
  });

  test('Fargate profiles should use private subnets', () => {
    const content = fs.readFileSync(path.join(libDir, 'eks_cluster.tf'), 'utf8');

    expect(content).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });
});

describe('Outputs Configuration', () => {
  test('outputs.tf should export cluster information', () => {
    const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');

    expect(content).toMatch(/output\s+"cluster_id"\s*{/);
    expect(content).toMatch(/output\s+"cluster_name"\s*{/);
    expect(content).toMatch(/output\s+"cluster_endpoint"\s*{/);
    expect(content).toMatch(/output\s+"cluster_arn"\s*{/);
  });

  test('outputs.tf should export VPC information', () => {
    const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');

    expect(content).toMatch(/output\s+"vpc_id"\s*{/);
    expect(content).toMatch(/output\s+"private_subnet_ids"\s*{/);
    expect(content).toMatch(/output\s+"public_subnet_ids"\s*{/);
  });

  test('outputs.tf should export Fargate profile information', () => {
    const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');

    expect(content).toMatch(/output\s+"fargate_profile_kube_system_id"\s*{/);
    expect(content).toMatch(/output\s+"fargate_profile_application_id"\s*{/);
  });

  test('outputs.tf should export IAM role ARNs', () => {
    const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');

    expect(content).toMatch(/output\s+"cluster_iam_role_arn"\s*{/);
    expect(content).toMatch(/output\s+"fargate_pod_execution_role_arn"\s*{/);
  });

  test('outputs.tf should mark certificate authority as sensitive', () => {
    const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');

    expect(content).toMatch(/output\s+"cluster_certificate_authority_data"\s*{/);
    expect(content).toMatch(/sensitive\s*=\s*true/);
  });
});

describe('Resource Naming Convention', () => {
  test('all resource names should include environmentSuffix', () => {
    const files = ['vpc.tf', 'iam.tf', 'security_groups.tf', 'eks_cluster.tf'];

    files.forEach(file => {
      const content = fs.readFileSync(path.join(libDir, file), 'utf8');
      const nameMatches = content.match(/Name\s*=\s*"[^"]+"/g) || [];

      nameMatches.forEach(match => {
        // All resource names should include environmentSuffix
        expect(match).toMatch(/\$\{var\.environmentSuffix\}/);
      });
    });
  });

  test('no hardcoded environment names in resources', () => {
    const files = ['vpc.tf', 'iam.tf', 'security_groups.tf', 'eks_cluster.tf'];

    files.forEach(file => {
      const content = fs.readFileSync(path.join(libDir, file), 'utf8');

      // Should not have hardcoded env names in resource definitions
      expect(content).not.toMatch(/Name\s*=\s*"[^"]*-prod-/);
      expect(content).not.toMatch(/Name\s*=\s*"[^"]*-dev-/);
      expect(content).not.toMatch(/Name\s*=\s*"[^"]*-staging-/);
    });
  });
});

describe('Fargate-Only Requirements', () => {
  test('no EC2 instance types or AMIs should be defined', () => {
    const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

    files.forEach(file => {
      const content = fs.readFileSync(path.join(libDir, file), 'utf8');

      expect(content).not.toMatch(/instance_type\s*=\s*"t[23]\./);
      expect(content).not.toMatch(/ami\s*=\s*"ami-/);
      expect(content).not.toMatch(/aws_launch_template/);
      expect(content).not.toMatch(/aws_autoscaling_group/);
    });
  });

  test('no EC2 node groups should be defined', () => {
    const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

    files.forEach(file => {
      const content = fs.readFileSync(path.join(libDir, file), 'utf8');

      expect(content).not.toMatch(/aws_eks_node_group/);
    });
  });

  test('should only have Fargate profiles for compute', () => {
    const eksContent = fs.readFileSync(path.join(libDir, 'eks_cluster.tf'), 'utf8');

    // Should have Fargate profiles
    expect(eksContent).toMatch(/aws_eks_fargate_profile/);

    // Should NOT have node groups
    expect(eksContent).not.toMatch(/aws_eks_node_group/);
  });
});

describe('No Retain Policies', () => {
  test('no resources should have lifecycle prevent_destroy', () => {
    const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

    files.forEach(file => {
      const content = fs.readFileSync(path.join(libDir, file), 'utf8');

      expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
    });
  });

  test('no resources should have deletion_protection enabled', () => {
    const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));

    files.forEach(file => {
      const content = fs.readFileSync(path.join(libDir, file), 'utf8');

      expect(content).not.toMatch(/deletion_protection\s*=\s*true/);
    });
  });
});
