import fs from 'fs';
import path from 'path';

describe('EKS Cluster Terraform Configuration - Unit Tests', () => {
  // Paths
  const libPath = path.join(__dirname, '..', 'lib');

  // File Contents
  let mainTf: string, variablesTf: string, outputsTf: string, providerTf: string;

  beforeAll(() => {
    // Load Terraform files
    mainTf = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    variablesTf = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    outputsTf = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    providerTf = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
  });

  // ---------------------------------------------------------------------------
  // 1. PROVIDER CONFIGURATION
  // ---------------------------------------------------------------------------
  describe('Provider Configuration', () => {
    test('Provider version is pinned to >= 5.0', () => {
      expect(providerTf).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerTf).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('TLS provider is configured', () => {
      expect(providerTf).toMatch(/source\s*=\s*"hashicorp\/tls"/);
      expect(providerTf).toMatch(/version\s*=\s*">=\s*4\.0"/);
    });

    test('Terraform version is >= 1.5.0', () => {
      expect(providerTf).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('AWS provider uses aws_region variable', () => {
      expect(providerTf).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('Provider has default tags including PRNumber', () => {
      expect(providerTf).toMatch(/PRNumber\s*=\s*var\.pr_number/);
      expect(providerTf).toMatch(/Environment\s*=\s*var\.environment_suffix/);
      expect(providerTf).toMatch(/Repository\s*=\s*var\.repository/);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. VARIABLES
  // ---------------------------------------------------------------------------
  describe('Variables Configuration', () => {
    test('aws_region variable exists with default us-east-1', () => {
      expect(variablesTf).toMatch(/variable\s+"aws_region"\s*{/);
      expect(variablesTf).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('cluster_name variable exists with default prod-eks-cluster', () => {
      expect(variablesTf).toMatch(/variable\s+"cluster_name"\s*{/);
      expect(variablesTf).toMatch(/default\s*=\s*"prod-eks-cluster"/);
    });

    test('kubernetes_version variable exists', () => {
      expect(variablesTf).toMatch(/variable\s+"kubernetes_version"\s*{/);
    });

    test('pr_number variable exists', () => {
      expect(variablesTf).toMatch(/variable\s+"pr_number"\s*{/);
    });

    test('VPC CIDR variables exist with proper defaults', () => {
      expect(variablesTf).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(variablesTf).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(variablesTf).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
    });

    test('Addon version variables exist', () => {
      expect(variablesTf).toMatch(/variable\s+"vpc_cni_version"\s*{/);
      expect(variablesTf).toMatch(/variable\s+"coredns_version"\s*{/);
      expect(variablesTf).toMatch(/variable\s+"kube_proxy_version"\s*{/);
    });

    test('Common tags variable exists with proper structure', () => {
      expect(variablesTf).toMatch(/variable\s+"common_tags"\s*{/);
      expect(variablesTf).toMatch(/Environment\s*=\s*"production"/);
      expect(variablesTf).toMatch(/Team\s*=\s*"platform"/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. NETWORKING
  // ---------------------------------------------------------------------------
  describe('Networking Configuration', () => {
    test('VPC is created with DNS support', () => {
      expect(mainTf).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(mainTf).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTf).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('VPC uses vpc_cidr variable', () => {
      expect(mainTf).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('Internet Gateway is created', () => {
      expect(mainTf).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test('Public and private subnets are defined', () => {
      expect(mainTf).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(mainTf).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test('NAT Gateways exist for private subnets', () => {
      expect(mainTf).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(mainTf).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
      expect(mainTf).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });

    test('Route tables are configured properly', () => {
      expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(mainTf).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(mainTf).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test('Subnets are associated with route tables', () => {
      expect(mainTf).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. SECURITY
  // ---------------------------------------------------------------------------
  describe('Security Configuration', () => {
    test('KMS key is created with rotation enabled', () => {
      expect(mainTf).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(mainTf).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS deletion window varies by environment', () => {
      expect(mainTf).toMatch(/deletion_window_in_days\s*=\s*var\.environment_suffix\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test('KMS key alias is created', () => {
      expect(mainTf).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
      expect(mainTf).toMatch(/name\s*=\s*"alias\/\$\{var\.cluster_name\}-\$\{var\.pr_number\}-tester(-\$\{random_id\.suffix\.hex\})?"/);
    });

    test('KMS key policy allows various AWS services', () => {
      expect(mainTf).toMatch(/resource\s+"aws_kms_key_policy"\s+"main"\s*{/);
      expect(mainTf).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
      expect(mainTf).toMatch(/Service\s*=\s*"ebs\.amazonaws\.com"/);
      expect(mainTf).toMatch(/Principal\s*=\s*{\s*Service\s*=\s*"ec2\.amazonaws\.com"\s*}/);
      expect(mainTf).toMatch(/Sid\s*=\s*"Allow Auto Scaling service-linked role to use the key"/);
      expect(mainTf).toMatch(/Sid\s*=\s*"Allow Auto Scaling service-linked role to manage grants"/);
      expect(mainTf).toMatch(/"kms:GrantIsForAWSResource"\s*=\s*"true"/);
    });

    test('Security groups are created for cluster and nodes', () => {
      expect(mainTf).toMatch(/resource\s+"aws_security_group"\s+"eks_cluster"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_security_group"\s+"eks_nodes"\s*{/);
    });

    test('Security group rules allow proper communication', () => {
      expect(mainTf).toMatch(/resource\s+"aws_security_group_rule"\s+"nodes_internal"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_security_group_rule"\s+"cluster_to_nodes"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_security_group_rule"\s+"nodes_to_cluster"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. EKS CLUSTER
  // ---------------------------------------------------------------------------
  describe('EKS Cluster Configuration', () => {
    test('EKS cluster IAM role is created', () => {
      expect(mainTf).toMatch(/resource\s+"aws_iam_role"\s+"eks_cluster"\s*{/);
      expect(mainTf).toMatch(/Service\s*=\s*"eks\.amazonaws\.com"/);
    });

    test('EKS cluster role has required policies attached', () => {
      expect(mainTf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_cluster_policy"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_vpc_resource_controller"\s*{/);
    });

    test('EKS cluster is created with proper configuration', () => {
      expect(mainTf).toMatch(/resource\s+"aws_eks_cluster"\s+"main"\s*{/);
      expect(mainTf).toMatch(/name\s*=\s*"\$\{var\.cluster_name\}-\$\{var\.pr_number\}-tester"/);
      expect(mainTf).toMatch(/role_arn\s*=\s*aws_iam_role\.eks_cluster\.arn/);
      expect(mainTf).toMatch(/version\s*=\s*var\.kubernetes_version/);
    });

    test('EKS cluster uses private subnets and has logging enabled', () => {
      expect(mainTf).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(mainTf).toMatch(/enabled_cluster_log_types\s*=\s*var\.cluster_log_types/);
    });

    test('OIDC provider is created for IRSA', () => {
      expect(mainTf).toMatch(/resource\s+"aws_iam_openid_connect_provider"\s+"eks"\s*{/);
      expect(mainTf).toMatch(/client_id_list\s*=\s*\["sts\.amazonaws\.com"\]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. NODE GROUPS
  // ---------------------------------------------------------------------------
  describe('Node Groups Configuration', () => {
    test('Node group IAM role is created', () => {
      expect(mainTf).toMatch(/resource\s+"aws_iam_role"\s+"eks_nodes"\s*{/);
      expect(mainTf).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
    });

    test('Node group role has required policies attached', () => {
      expect(mainTf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_worker_node_policy"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_cni_policy"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_container_registry_policy"\s*{/);
    });

    test('Critical node group is created with Bottlerocket AMI', () => {
      expect(mainTf).toMatch(/resource\s+"aws_eks_node_group"\s+"critical"\s*{/);
      expect(mainTf).toMatch(/ami_type\s*=\s*"BOTTLEROCKET_x86_64"/);
      expect(mainTf).toMatch(/instance_types\s*=\s*\["m5\.large"\]/);
    });

    test('General node group is created with mixed instances', () => {
      expect(mainTf).toMatch(/resource\s+"aws_eks_node_group"\s+"general"\s*{/);
      expect(mainTf).toMatch(/ami_type\s*=\s*"BOTTLEROCKET_x86_64"/);
      expect(mainTf).toMatch(/instance_types\s*=\s*\["m5\.large",\s*"m5\.xlarge"\]/);
    });

    test('Node groups use launch templates with encrypted EBS', () => {
      expect(mainTf).toMatch(/resource\s+"aws_launch_template"\s+"critical"\s*{/);
      expect(mainTf).toMatch(/resource\s+"aws_launch_template"\s+"general"\s*{/);
      expect(mainTf).toMatch(/encrypted\s*=\s*true/);
      expect(mainTf).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test('Node groups have proper scaling configuration', () => {
      expect(mainTf).toMatch(/scaling_config\s*{/);
      expect(mainTf).toMatch(/min_size\s*=\s*3/); // Critical
      expect(mainTf).toMatch(/min_size\s*=\s*2/); // General
    });

    test('Node groups have proper labels and taints', () => {
      expect(mainTf).toMatch(/nodegroup-type\s*=\s*"critical"/);
      expect(mainTf).toMatch(/nodegroup-type\s*=\s*"general"/);
      expect(mainTf).toMatch(/effect\s*=\s*"NO_SCHEDULE"/);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. ADDONS
  // ---------------------------------------------------------------------------
  describe('Addons Configuration', () => {
    test('VPC CNI addon is configured with prefix delegation', () => {
      expect(mainTf).toMatch(/resource\s+"aws_eks_addon"\s+"vpc_cni"\s*{/);
      expect(mainTf).toMatch(/addon_name\s*=\s*"vpc-cni"/);
      expect(mainTf).toMatch(/ENABLE_PREFIX_DELEGATION\s*=\s*"true"/);
    });

    test('CoreDNS addon is configured', () => {
      expect(mainTf).toMatch(/resource\s+"aws_eks_addon"\s+"coredns"\s*{/);
      expect(mainTf).toMatch(/addon_name\s*=\s*"coredns"/);
    });

    test('Kube-proxy addon is configured', () => {
      expect(mainTf).toMatch(/resource\s+"aws_eks_addon"\s+"kube_proxy"\s*{/);
      expect(mainTf).toMatch(/addon_name\s*=\s*"kube-proxy"/);
    });

    test('Addons depend on node groups', () => {
      expect(mainTf).toMatch(/depends_on\s*=\s*\[\s*aws_eks_node_group\.critical,\s*aws_eks_node_group\.general\s*\]/);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. CLUSTER AUTOSCALER
  // ---------------------------------------------------------------------------
  describe('Cluster Autoscaler Configuration', () => {
    test('IAM role for cluster autoscaler is created', () => {
      expect(mainTf).toMatch(/resource\s+"aws_iam_role"\s+"cluster_autoscaler"\s*{/);
      expect(mainTf).toMatch(/name\s*=\s*"\$\{var\.cluster_name\}-cluster-autoscaler-\$\{var\.pr_number\}-tester"/);
      expect(mainTf).toMatch(/lifecycle\s*{\s*create_before_destroy\s*=\s*true\s*}/);
      expect(mainTf).toMatch(/sts:AssumeRoleWithWebIdentity/);
    });

    test('IAM policy for cluster autoscaler is created', () => {
      expect(mainTf).toMatch(/resource\s+"aws_iam_policy"\s+"cluster_autoscaler"\s*{/);
      expect(mainTf).toMatch(/autoscaling:DescribeAutoScalingGroups/);
      expect(mainTf).toMatch(/autoscaling:SetDesiredCapacity/);
    });

    test('Policy is attached to cluster autoscaler role', () => {
      expect(mainTf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cluster_autoscaler"\s*{/);
      expect(mainTf).toMatch(/policy_arn\s*=\s*aws_iam_policy\.cluster_autoscaler\.arn/);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. OUTPUTS
  // ---------------------------------------------------------------------------
  describe('Outputs Configuration', () => {
    test('Cluster endpoint output is defined', () => {
      expect(outputsTf).toMatch(/output\s+"cluster_endpoint"\s*{/);
      expect(outputsTf).toMatch(/aws_eks_cluster\.main\.endpoint/);
    });

    test('Certificate authority data is marked as sensitive', () => {
      expect(outputsTf).toMatch(/output\s+"cluster_certificate_authority_data"\s*{/);
      expect(outputsTf).toMatch(/sensitive\s*=\s*true/);
    });

    test('OIDC provider outputs are defined', () => {
      expect(outputsTf).toMatch(/output\s+"oidc_provider_url"\s*{/);
      expect(outputsTf).toMatch(/output\s+"oidc_provider_arn"\s*{/);
    });

    test('Node group IDs are exported', () => {
      expect(outputsTf).toMatch(/output\s+"critical_node_group_id"\s*{/);
      expect(outputsTf).toMatch(/output\s+"general_node_group_id"\s*{/);
    });

    test('KMS key information is exported', () => {
      expect(outputsTf).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(outputsTf).toMatch(/output\s+"kms_key_arn"\s*{/);
      expect(outputsTf).toMatch(/output\s+"kms_key_alias"\s*{/);
    });

    test('Security group IDs are exported', () => {
      expect(outputsTf).toMatch(/output\s+"cluster_security_group_id"\s*{/);
      expect(outputsTf).toMatch(/output\s+"node_security_group_id"\s*{/);
    });

    test('Cluster autoscaler role ARN is exported', () => {
      expect(outputsTf).toMatch(/output\s+"cluster_autoscaler_role_arn"\s*{/);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. TAGGING
  // ---------------------------------------------------------------------------
  describe('Tagging Configuration', () => {
    test('Resources include PRNumber tag', () => {
      expect(mainTf).toMatch(/PRNumber\s*=\s*var\.pr_number/);
    });

    test('Resources include common tags', () => {
      expect(mainTf).toMatch(/merge\(\s*var\.common_tags/);
    });

    test('Resources have proper naming conventions', () => {
      expect(mainTf).toMatch(/Name\s*=\s*"\$\{var\.cluster_name\}-\$\{var\.pr_number\}-tester"/);
      expect(mainTf).toMatch(/Name\s*=\s*"\$\{var\.cluster_name\}-vpc-\$\{var\.pr_number\}-tester"/);
      expect(mainTf).toMatch(/Name\s*=\s*"\$\{var\.cluster_name\}-cluster-role-\$\{var\.pr_number\}-tester(-\$\{random_id\.suffix\.hex\})?"/);
    });
  });
});