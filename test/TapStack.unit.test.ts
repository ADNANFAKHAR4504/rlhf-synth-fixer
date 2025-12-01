// Comprehensive unit tests for Terraform HCL EKS infrastructure
// Tests all 6 .tf files: provider.tf, variables.tf, main.tf, eks-cluster.tf, node-groups.tf, outputs.tf

import fs from 'fs';
import hcl from 'hcl2-parser';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read and parse HCL files
function readHcl(filename: string): any {
  const filePath = path.join(LIB_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  return { content, parsed: hcl.parseToObject(content) };
}

// Helper function to check if content contains hardcoded environment values
function hasHardcodedEnvironment(content: string): boolean {
  const hardcodedPatterns = [
    /['"]production['"]/i,
    /['"]staging['"]/i,
    /['"]prod['"]/i,
    /['"]stage['"]/i,
  ];
  return hardcodedPatterns.some(pattern => pattern.test(content));
}

describe('Terraform HCL Infrastructure - File Existence', () => {
  test('provider.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
  });

  test('variables.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
  });

  test('main.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'main.tf'))).toBe(true);
  });

  test('eks-cluster.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'eks-cluster.tf'))).toBe(true);
  });

  test('node-groups.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'node-groups.tf'))).toBe(true);
  });

  test('outputs.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
  });
});

describe('Terraform HCL Infrastructure - Provider Configuration', () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
  });

  test('declares terraform required_version >= 1.0', () => {
    expect(providerContent).toMatch(/required_version\s*=\s*['"]\s*>=\s*1\.0['"]/);
  });

  test('declares AWS provider with version ~> 5.0', () => {
    expect(providerContent).toMatch(/source\s*=\s*['"]hashicorp\/aws['"]/);
    expect(providerContent).toMatch(/version\s*=\s*['"]~>\s*5\.0['"]/);
  });

  test('AWS provider uses var.aws_region', () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test('AWS provider has default_tags with Environment = var.environment', () => {
    expect(providerContent).toMatch(/default_tags/);
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environment/);
  });

  test('AWS provider has default_tags with ManagedBy = terraform', () => {
    expect(providerContent).toMatch(/ManagedBy\s*=\s*['"]terraform['"]/);
  });
});

describe('Terraform HCL Infrastructure - Variables Configuration', () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
  });

  test('declares aws_region variable with default us-east-1', () => {
    expect(variablesContent).toMatch(/variable\s+['"]aws_region['"]/);
    expect(variablesContent).toMatch(/default\s*=\s*['"]us-east-1['"]/);
  });

  test('declares environment variable with validation', () => {
    expect(variablesContent).toMatch(/variable\s+['"]environment['"]/);
    expect(variablesContent).toMatch(/validation\s*{/);
  });

  test('environment variable has validation for dev, staging, production', () => {
    expect(variablesContent).toMatch(/contains\s*\(\s*\[\s*['"]dev['"],\s*['"]staging['"],\s*['"]production['"]\s*\]/);
  });

  test('declares environment_suffix variable with validation', () => {
    expect(variablesContent).toMatch(/variable\s+['"]environment_suffix['"]/);
    expect(variablesContent).toMatch(/validation\s*{/);
  });

  test('environment_suffix has length validation (1-8 characters)', () => {
    expect(variablesContent).toMatch(/length\s*\(\s*var\.environment_suffix\s*\)\s*>\s*0/);
    expect(variablesContent).toMatch(/length\s*\(\s*var\.environment_suffix\s*\)\s*<=\s*8/);
  });

  test('declares cluster_name variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]cluster_name['"]/);
  });

  test('declares cluster_version variable with default 1.28', () => {
    expect(variablesContent).toMatch(/variable\s+['"]cluster_version['"]/);
    expect(variablesContent).toMatch(/default\s*=\s*['"]1\.28['"]/);
  });

  test('declares vpc_cidr variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]vpc_cidr['"]/);
  });

  test('declares availability_zones variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]availability_zones['"]/);
  });

  test('declares system_node_group_config variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]system_node_group_config['"]/);
  });

  test('system_node_group_config has object type with instance_types, min_size, max_size, desired_size', () => {
    expect(variablesContent).toMatch(/instance_types\s*=\s*list\(string\)/);
    expect(variablesContent).toMatch(/min_size\s*=\s*number/);
    expect(variablesContent).toMatch(/max_size\s*=\s*number/);
    expect(variablesContent).toMatch(/desired_size\s*=\s*number/);
  });

  test('system_node_group_config default includes t3.medium', () => {
    expect(variablesContent).toMatch(/instance_types\s*=\s*\[\s*['"]t3\.medium['"]/);
  });

  test('declares application_node_group_config variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]application_node_group_config['"]/);
  });

  test('application_node_group_config default includes m5.large', () => {
    expect(variablesContent).toMatch(/instance_types\s*=\s*\[\s*['"]m5\.large['"]/);
  });

  test('declares spot_node_group_config variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]spot_node_group_config['"]/);
  });

  test('spot_node_group_config default includes m5.large', () => {
    expect(variablesContent).toMatch(/instance_types\s*=\s*\[\s*['"]m5\.large['"]/);
  });

  test('declares enable_cluster_autoscaler variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]enable_cluster_autoscaler['"]/);
  });

  test('declares enable_ebs_csi_driver variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]enable_ebs_csi_driver['"]/);
  });

  test('enable_ebs_csi_driver defaults to false', () => {
    expect(variablesContent).toMatch(/variable\s+['"]enable_ebs_csi_driver['"][\s\S]*default\s*=\s*false/);
  });

  test('declares kms_key_deletion_window variable with validation', () => {
    expect(variablesContent).toMatch(/variable\s+['"]kms_key_deletion_window['"]/);
    expect(variablesContent).toMatch(/validation\s*{/);
  });

  test('kms_key_deletion_window has validation (7-30 days)', () => {
    expect(variablesContent).toMatch(/var\.kms_key_deletion_window\s*>=\s*7/);
    expect(variablesContent).toMatch(/var\.kms_key_deletion_window\s*<=\s*30/);
  });

  test('declares tags variable', () => {
    expect(variablesContent).toMatch(/variable\s+['"]tags['"]/);
  });

  test('NO hardcoded environment values in variables.tf (except in validation)', () => {
    // Remove validation blocks which legitimately contain env names
    const contentWithoutValidation = variablesContent.replace(/validation\s*{[\s\S]*?}/g, '');
    const hasHardcoded = hasHardcodedEnvironment(contentWithoutValidation);
    expect(hasHardcoded).toBe(false);
  });
});

describe('Terraform HCL Infrastructure - KMS Encryption', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
  });

  test('declares aws_kms_key resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_kms_key['"]\s+['"]eks['"]/);
  });

  test('KMS key has enable_key_rotation = true', () => {
    expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test('KMS key has deletion_window_in_days', () => {
    expect(mainContent).toMatch(/deletion_window_in_days\s*=\s*var\.kms_key_deletion_window/);
  });

  test('KMS key has tags with Environment = var.environment', () => {
    expect(mainContent).toMatch(/Environment\s*=\s*var\.environment/);
  });

  test('declares aws_kms_alias resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_kms_alias['"]\s+['"]eks['"]/);
  });
});

describe('Terraform HCL Infrastructure - VPC and Networking', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
  });

  test('declares aws_vpc resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_vpc['"]\s+['"]main['"]/);
  });

  test('VPC has enable_dns_hostnames = true', () => {
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test('VPC has enable_dns_support = true', () => {
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test('VPC uses var.vpc_cidr', () => {
    expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
  });

  test('VPC has kubernetes.io/cluster tag', () => {
    // VPC tag can use either direct variables or the local.cluster_name_unique
    expect(mainContent).toMatch(/"kubernetes\.io\/cluster\/(?:\$\{var\.cluster_name\}-\$\{var\.environment_suffix\}|\$\{local\.cluster_name_unique\})"\s*=\s*['"]shared['"]/);
  });

  test('declares aws_internet_gateway resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_internet_gateway['"]\s+['"]main['"]/);
  });

  test('declares aws_subnet.system_private resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]system_private['"]/);
  });

  test('system_private subnets use count with availability_zones', () => {
    expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
  });

  test('system_private subnets have NodeGroup = system tag', () => {
    expect(mainContent).toMatch(/NodeGroup\s*=\s*['"]system['"]/);
  });

  test('system_private subnets have kubernetes.io/role/internal-elb tag', () => {
    expect(mainContent).toMatch(/"kubernetes\.io\/role\/internal-elb"\s*=\s*['"]1['"]/);
  });

  test('declares aws_subnet.application_private resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]application_private['"]/);
  });

  test('application_private subnets have NodeGroup = application tag', () => {
    expect(mainContent).toMatch(/NodeGroup\s*=\s*['"]application['"]/);
  });

  test('declares aws_subnet.spot_private resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]spot_private['"]/);
  });

  test('spot_private subnets have NodeGroup = spot tag', () => {
    expect(mainContent).toMatch(/NodeGroup\s*=\s*['"]spot['"]/);
  });

  test('declares aws_subnet.public resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]public['"]/);
  });

  test('public subnets have map_public_ip_on_launch = true', () => {
    expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test('public subnets have kubernetes.io/role/elb tag', () => {
    expect(mainContent).toMatch(/"kubernetes\.io\/role\/elb"\s*=\s*['"]1['"]/);
  });

  test('declares aws_eip for NAT gateways', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_eip['"]\s+['"]nat['"]/);
  });

  test('EIP uses count with availability_zones', () => {
    expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
  });

  test('declares aws_nat_gateway resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_nat_gateway['"]\s+['"]main['"]/);
  });

  test('NAT gateway uses count with availability_zones', () => {
    expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
  });

  test('declares aws_route_table.public resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_route_table['"]\s+['"]public['"]/);
  });

  test('public route table has route to internet gateway', () => {
    expect(mainContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test('declares aws_route_table.system_private resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_route_table['"]\s+['"]system_private['"]/);
  });

  test('system_private route tables have route to NAT gateway', () => {
    expect(mainContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
  });

  test('declares aws_route_table.application_private resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_route_table['"]\s+['"]application_private['"]/);
  });

  test('declares aws_route_table.spot_private resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_route_table['"]\s+['"]spot_private['"]/);
  });

  test('declares aws_route_table_association resources', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_route_table_association['"]/);
  });
});

describe('Terraform HCL Infrastructure - Security Groups', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
  });

  test('declares aws_security_group.eks_cluster resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_security_group['"]\s+['"]eks_cluster['"]/);
  });

  test('EKS cluster security group has description', () => {
    expect(mainContent).toMatch(/description\s*=\s*['"]Security group for EKS cluster control plane['"]/);
  });

  test('declares aws_security_group_rule.cluster_egress', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_security_group_rule['"]\s+['"]cluster_egress['"]/);
  });

  test('cluster_egress allows all outbound traffic', () => {
    expect(mainContent).toMatch(/type\s*=\s*['"]egress['"]/);
    expect(mainContent).toMatch(/cidr_blocks\s*=\s*\[\s*['"]0\.0\.0\.0\/0['"]/);
  });

  test('declares aws_security_group.eks_nodes resource', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_security_group['"]\s+['"]eks_nodes['"]/);
  });

  test('declares aws_security_group_rule.nodes_internal', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_security_group_rule['"]\s+['"]nodes_internal['"]/);
  });

  test('nodes_internal allows nodes to communicate (self = true)', () => {
    expect(mainContent).toMatch(/self\s*=\s*true/);
  });

  test('declares aws_security_group_rule.nodes_cluster_inbound', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_security_group_rule['"]\s+['"]nodes_cluster_inbound['"]/);
  });

  test('nodes_cluster_inbound allows ports 1025-65535', () => {
    expect(mainContent).toMatch(/from_port\s*=\s*1025/);
    expect(mainContent).toMatch(/to_port\s*=\s*65535/);
  });

  test('declares aws_security_group_rule.cluster_nodes_inbound', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_security_group_rule['"]\s+['"]cluster_nodes_inbound['"]/);
  });

  test('cluster_nodes_inbound allows port 443', () => {
    expect(mainContent).toMatch(/from_port\s*=\s*443/);
    expect(mainContent).toMatch(/to_port\s*=\s*443/);
  });

  test('declares aws_security_group_rule.nodes_egress', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_security_group_rule['"]\s+['"]nodes_egress['"]/);
  });
});

describe('Terraform HCL Infrastructure - EKS Cluster', () => {
  let eksContent: string;

  beforeAll(() => {
    eksContent = fs.readFileSync(path.join(LIB_DIR, 'eks-cluster.tf'), 'utf8');
  });

  test('declares aws_iam_role.eks_cluster resource', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_role['"]\s+['"]eks_cluster['"]/);
  });

  test('EKS cluster role has assume_role_policy for eks.amazonaws.com', () => {
    expect(eksContent).toMatch(/Service.*eks\.amazonaws\.com/);
  });

  test('attaches AmazonEKSClusterPolicy', () => {
    expect(eksContent).toMatch(/policy_arn\s*=\s*['"]arn:aws:iam::aws:policy\/AmazonEKSClusterPolicy['"]/);
  });

  test('attaches AmazonEKSVPCResourceController', () => {
    expect(eksContent).toMatch(/policy_arn\s*=\s*['"]arn:aws:iam::aws:policy\/AmazonEKSVPCResourceController['"]/);
  });

  test('declares aws_cloudwatch_log_group for EKS', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_cloudwatch_log_group['"]\s+['"]eks_cluster['"]/);
  });

  test('CloudWatch log group has retention_in_days', () => {
    expect(eksContent).toMatch(/retention_in_days\s*=\s*7/);
  });

  test('declares aws_eks_cluster.main resource', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_eks_cluster['"]\s+['"]main['"]/);
  });

  test('EKS cluster name includes environment_suffix', () => {
    // Cluster name can use either direct variables or the local.cluster_name_unique
    expect(eksContent).toMatch(/name\s*=\s*(?:['"]\$\{var\.cluster_name\}-\$\{var\.environment_suffix\}['"]|local\.cluster_name_unique)/);
  });

  test('EKS cluster version uses var.cluster_version', () => {
    expect(eksContent).toMatch(/version\s*=\s*var\.cluster_version/);
  });

  test('EKS cluster has endpoint_private_access = true', () => {
    expect(eksContent).toMatch(/endpoint_private_access\s*=\s*true/);
  });

  test('EKS cluster has endpoint_public_access = false', () => {
    expect(eksContent).toMatch(/endpoint_public_access\s*=\s*false/);
  });

  test('EKS cluster has encryption_config with KMS key', () => {
    expect(eksContent).toMatch(/encryption_config\s*{/);
    expect(eksContent).toMatch(/key_arn\s*=\s*aws_kms_key\.eks\.arn/);
  });

  test('EKS cluster encrypts secrets', () => {
    expect(eksContent).toMatch(/resources\s*=\s*\[\s*['"]secrets['"]/);
  });

  test('EKS cluster has enabled_cluster_log_types', () => {
    expect(eksContent).toMatch(/enabled_cluster_log_types\s*=\s*\[/);
  });

  test('EKS cluster enables api logs', () => {
    expect(eksContent).toMatch(/['"]api['"]/);
  });

  test('EKS cluster enables audit logs', () => {
    expect(eksContent).toMatch(/['"]audit['"]/);
  });

  test('EKS cluster enables authenticator logs', () => {
    expect(eksContent).toMatch(/['"]authenticator['"]/);
  });

  test('EKS cluster enables controllerManager logs', () => {
    expect(eksContent).toMatch(/['"]controllerManager['"]/);
  });

  test('EKS cluster enables scheduler logs', () => {
    expect(eksContent).toMatch(/['"]scheduler['"]/);
  });

  test('EKS cluster has depends_on for IAM policies', () => {
    expect(eksContent).toMatch(/depends_on\s*=\s*\[/);
  });

  test('EKS cluster subnet_ids includes all private subnets', () => {
    expect(eksContent).toMatch(/subnet_ids\s*=\s*concat\(/);
    expect(eksContent).toMatch(/aws_subnet\.system_private\[\*\]\.id/);
    expect(eksContent).toMatch(/aws_subnet\.application_private\[\*\]\.id/);
    expect(eksContent).toMatch(/aws_subnet\.spot_private\[\*\]\.id/);
  });
});

describe('Terraform HCL Infrastructure - OIDC Provider and IRSA', () => {
  let eksContent: string;

  beforeAll(() => {
    eksContent = fs.readFileSync(path.join(LIB_DIR, 'eks-cluster.tf'), 'utf8');
  });

  test('declares data.tls_certificate.eks', () => {
    expect(eksContent).toMatch(/data\s+['"]tls_certificate['"]\s+['"]eks['"]/);
  });

  test('tls_certificate data source uses EKS OIDC issuer', () => {
    expect(eksContent).toMatch(/url\s*=\s*aws_eks_cluster\.main\.identity\[0\]\.oidc\[0\]\.issuer/);
  });

  test('declares aws_iam_openid_connect_provider.eks', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_openid_connect_provider['"]\s+['"]eks['"]/);
  });

  test('OIDC provider has client_id_list with sts.amazonaws.com', () => {
    expect(eksContent).toMatch(/client_id_list\s*=\s*\[\s*['"]sts\.amazonaws\.com['"]/);
  });

  test('OIDC provider has thumbprint_list from tls_certificate', () => {
    expect(eksContent).toMatch(/thumbprint_list\s*=\s*\[data\.tls_certificate\.eks\.certificates\[0\]\.sha1_fingerprint\]/);
  });

  test('OIDC provider url uses EKS cluster identity', () => {
    expect(eksContent).toMatch(/url\s*=\s*aws_eks_cluster\.main\.identity\[0\]\.oidc\[0\]\.issuer/);
  });
});

describe('Terraform HCL Infrastructure - EBS CSI Driver', () => {
  let eksContent: string;

  beforeAll(() => {
    eksContent = fs.readFileSync(path.join(LIB_DIR, 'eks-cluster.tf'), 'utf8');
  });

  test('declares aws_iam_role.ebs_csi_driver', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_role['"]\s+['"]ebs_csi_driver['"]/);
  });

  test('EBS CSI driver role has AssumeRoleWithWebIdentity', () => {
    expect(eksContent).toMatch(/sts:AssumeRoleWithWebIdentity/);
  });

  test('EBS CSI driver role has OIDC condition for kube-system:ebs-csi-controller-sa', () => {
    expect(eksContent).toMatch(/system:serviceaccount:kube-system:ebs-csi-controller-sa/);
  });

  test('attaches AmazonEBSCSIDriverPolicy', () => {
    expect(eksContent).toMatch(/policy_arn\s*=\s*['"]arn:aws:iam::aws:policy\/service-role\/AmazonEBSCSIDriverPolicy['"]/);
  });

  test('declares aws_iam_role_policy.ebs_csi_driver_kms', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_role_policy['"]\s+['"]ebs_csi_driver_kms['"]/);
  });

  test('EBS CSI driver KMS policy allows encryption operations', () => {
    expect(eksContent).toMatch(/kms:Decrypt/);
    expect(eksContent).toMatch(/kms:Encrypt/);
    expect(eksContent).toMatch(/kms:GenerateDataKey/);
    expect(eksContent).toMatch(/kms:CreateGrant/);
  });

  test('declares aws_eks_addon.ebs_csi_driver', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_eks_addon['"]\s+['"]ebs_csi_driver['"]/);
  });

  test('EBS CSI addon name is aws-ebs-csi-driver', () => {
    expect(eksContent).toMatch(/addon_name\s*=\s*['"]aws-ebs-csi-driver['"]/);
  });

  test('EBS CSI addon has service_account_role_arn', () => {
    expect(eksContent).toMatch(/service_account_role_arn\s*=\s*aws_iam_role\.ebs_csi_driver\.arn/);
  });

  test('EBS CSI addon has count for conditional creation', () => {
    expect(eksContent).toMatch(/count\s*=\s*var\.enable_ebs_csi_driver\s*\?\s*1\s*:\s*0/);
  });

  test('EBS CSI addon has resolve_conflicts_on_create = OVERWRITE', () => {
    expect(eksContent).toMatch(/resolve_conflicts_on_create\s*=\s*['"]OVERWRITE['"]/);
  });

  test('EBS CSI addon has resolve_conflicts_on_update = OVERWRITE', () => {
    expect(eksContent).toMatch(/resolve_conflicts_on_update\s*=\s*['"]OVERWRITE['"]/);
  });

  test('EBS CSI addon has timeouts configuration', () => {
    expect(eksContent).toMatch(/timeouts\s*{/);
    expect(eksContent).toMatch(/create\s*=\s*['"]30m['"]/);
    expect(eksContent).toMatch(/update\s*=\s*['"]30m['"]/);
  });

  test('EBS CSI addon depends_on system and application node groups', () => {
    expect(eksContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_eks_node_group\.system/);
    expect(eksContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_eks_node_group\.application/);
  });
});

describe('Terraform HCL Infrastructure - Load Balancer Controller IAM', () => {
  let eksContent: string;

  beforeAll(() => {
    eksContent = fs.readFileSync(path.join(LIB_DIR, 'eks-cluster.tf'), 'utf8');
  });

  test('declares aws_iam_role.aws_load_balancer_controller', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_role['"]\s+['"]aws_load_balancer_controller['"]/);
  });

  test('Load Balancer Controller role has AssumeRoleWithWebIdentity', () => {
    expect(eksContent).toMatch(/sts:AssumeRoleWithWebIdentity/);
  });

  test('Load Balancer Controller role has OIDC condition for kube-system:aws-load-balancer-controller', () => {
    expect(eksContent).toMatch(/system:serviceaccount:kube-system:aws-load-balancer-controller/);
  });

  test('declares aws_iam_policy.aws_load_balancer_controller', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_policy['"]\s+['"]aws_load_balancer_controller['"]/);
  });

  test('Load Balancer Controller policy allows EC2 describe operations', () => {
    expect(eksContent).toMatch(/ec2:DescribeAccountAttributes/);
    expect(eksContent).toMatch(/ec2:DescribeVpcs/);
    expect(eksContent).toMatch(/ec2:DescribeSubnets/);
    expect(eksContent).toMatch(/ec2:DescribeSecurityGroups/);
  });

  test('Load Balancer Controller policy allows ELB operations', () => {
    expect(eksContent).toMatch(/elasticloadbalancing:DescribeLoadBalancers/);
    expect(eksContent).toMatch(/elasticloadbalancing:CreateLoadBalancer/);
    expect(eksContent).toMatch(/elasticloadbalancing:CreateTargetGroup/);
  });

  test('Load Balancer Controller policy allows security group management', () => {
    expect(eksContent).toMatch(/ec2:CreateSecurityGroup/);
    expect(eksContent).toMatch(/ec2:AuthorizeSecurityGroupIngress/);
  });

  test('attaches Load Balancer Controller policy to role', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_role_policy_attachment['"]\s+['"]aws_load_balancer_controller['"]/);
  });
});

describe('Terraform HCL Infrastructure - Cluster Autoscaler IAM', () => {
  let eksContent: string;

  beforeAll(() => {
    eksContent = fs.readFileSync(path.join(LIB_DIR, 'eks-cluster.tf'), 'utf8');
  });

  test('declares aws_iam_role.cluster_autoscaler', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_role['"]\s+['"]cluster_autoscaler['"]/);
  });

  test('Cluster Autoscaler role has AssumeRoleWithWebIdentity', () => {
    expect(eksContent).toMatch(/sts:AssumeRoleWithWebIdentity/);
  });

  test('Cluster Autoscaler role has OIDC condition for kube-system:cluster-autoscaler', () => {
    expect(eksContent).toMatch(/system:serviceaccount:kube-system:cluster-autoscaler/);
  });

  test('declares aws_iam_policy.cluster_autoscaler', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_policy['"]\s+['"]cluster_autoscaler['"]/);
  });

  test('Cluster Autoscaler policy allows autoscaling describe operations', () => {
    expect(eksContent).toMatch(/autoscaling:DescribeAutoScalingGroups/);
    expect(eksContent).toMatch(/autoscaling:DescribeAutoScalingInstances/);
  });

  test('Cluster Autoscaler policy allows EC2 describe operations', () => {
    expect(eksContent).toMatch(/ec2:DescribeImages/);
    expect(eksContent).toMatch(/ec2:DescribeInstanceTypes/);
  });

  test('Cluster Autoscaler policy allows EKS describe operations', () => {
    expect(eksContent).toMatch(/eks:DescribeNodegroup/);
  });

  test('Cluster Autoscaler policy allows SetDesiredCapacity', () => {
    expect(eksContent).toMatch(/autoscaling:SetDesiredCapacity/);
  });

  test('Cluster Autoscaler policy allows TerminateInstanceInAutoScalingGroup', () => {
    expect(eksContent).toMatch(/autoscaling:TerminateInstanceInAutoScalingGroup/);
  });

  test('Cluster Autoscaler policy has condition for owned tag', () => {
    expect(eksContent).toMatch(/k8s\.io\/cluster-autoscaler.*owned/);
  });

  test('attaches Cluster Autoscaler policy to role', () => {
    expect(eksContent).toMatch(/resource\s+['"]aws_iam_role_policy_attachment['"]\s+['"]cluster_autoscaler['"]/);
  });
});

describe('Terraform HCL Infrastructure - Node Groups IAM', () => {
  let nodeGroupsContent: string;

  beforeAll(() => {
    nodeGroupsContent = fs.readFileSync(path.join(LIB_DIR, 'node-groups.tf'), 'utf8');
  });

  test('declares aws_iam_role.eks_nodes', () => {
    expect(nodeGroupsContent).toMatch(/resource\s+['"]aws_iam_role['"]\s+['"]eks_nodes['"]/);
  });

  test('EKS nodes role has assume_role_policy for ec2.amazonaws.com', () => {
    expect(nodeGroupsContent).toMatch(/Service.*ec2\.amazonaws\.com/);
  });

  test('attaches AmazonEKSWorkerNodePolicy', () => {
    expect(nodeGroupsContent).toMatch(/policy_arn\s*=\s*['"]arn:aws:iam::aws:policy\/AmazonEKSWorkerNodePolicy['"]/);
  });

  test('attaches AmazonEKS_CNI_Policy', () => {
    expect(nodeGroupsContent).toMatch(/policy_arn\s*=\s*['"]arn:aws:iam::aws:policy\/AmazonEKS_CNI_Policy['"]/);
  });

  test('attaches AmazonEC2ContainerRegistryReadOnly', () => {
    expect(nodeGroupsContent).toMatch(/policy_arn\s*=\s*['"]arn:aws:iam::aws:policy\/AmazonEC2ContainerRegistryReadOnly['"]/);
  });
});

describe('Terraform HCL Infrastructure - System Node Group', () => {
  let nodeGroupsContent: string;

  beforeAll(() => {
    nodeGroupsContent = fs.readFileSync(path.join(LIB_DIR, 'node-groups.tf'), 'utf8');
  });

  test('declares aws_eks_node_group.system', () => {
    expect(nodeGroupsContent).toMatch(/resource\s+['"]aws_eks_node_group['"]\s+['"]system['"]/);
  });

  test('system node group uses system_private subnets', () => {
    expect(nodeGroupsContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.system_private\[\*\]\.id/);
  });

  test('system node group has capacity_type = ON_DEMAND', () => {
    expect(nodeGroupsContent).toMatch(/capacity_type\s*=\s*['"]ON_DEMAND['"]/);
  });

  test('system node group has scaling_config', () => {
    expect(nodeGroupsContent).toMatch(/scaling_config\s*{/);
  });

  test('system node group has update_config', () => {
    expect(nodeGroupsContent).toMatch(/update_config\s*{/);
  });

  test('system node group has labels with role = system', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*role\s*=\s*['"]system['"]/);
  });

  test('system node group has labels with environment = var.environment', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*environment\s*=\s*var\.environment/);
  });

  test('system node group has labels with nodegroup = system', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*nodegroup\s*=\s*['"]system['"]/);
  });

  test('system node group has taint with dedicated = system', () => {
    expect(nodeGroupsContent).toMatch(/taint\s*{[\s\S]*key\s*=\s*['"]dedicated['"][\s\S]*value\s*=\s*['"]system['"]/);
  });

  test('system node group taint has effect = NO_SCHEDULE', () => {
    expect(nodeGroupsContent).toMatch(/effect\s*=\s*['"]NO_SCHEDULE['"]/);
  });

  test('system node group has cluster-autoscaler tags', () => {
    expect(nodeGroupsContent).toMatch(/k8s\.io\/cluster-autoscaler/);
  });

  test('system node group has depends_on for IAM policies', () => {
    expect(nodeGroupsContent).toMatch(/depends_on\s*=\s*\[/);
  });
});

describe('Terraform HCL Infrastructure - Application Node Group', () => {
  let nodeGroupsContent: string;

  beforeAll(() => {
    nodeGroupsContent = fs.readFileSync(path.join(LIB_DIR, 'node-groups.tf'), 'utf8');
  });

  test('declares aws_eks_node_group.application', () => {
    expect(nodeGroupsContent).toMatch(/resource\s+['"]aws_eks_node_group['"]\s+['"]application['"]/);
  });

  test('application node group uses application_private subnets', () => {
    expect(nodeGroupsContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.application_private\[\*\]\.id/);
  });

  test('application node group has capacity_type = ON_DEMAND', () => {
    expect(nodeGroupsContent).toMatch(/capacity_type\s*=\s*['"]ON_DEMAND['"]/);
  });

  test('application node group has labels with role = application', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*role\s*=\s*['"]application['"]/);
  });

  test('application node group has labels with environment = var.environment', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*environment\s*=\s*var\.environment/);
  });

  test('application node group has labels with nodegroup = application', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*nodegroup\s*=\s*['"]application['"]/);
  });

  test('application node group has taint with dedicated = application', () => {
    expect(nodeGroupsContent).toMatch(/taint\s*{[\s\S]*key\s*=\s*['"]dedicated['"][\s\S]*value\s*=\s*['"]application['"]/);
  });

  test('application node group taint has effect = NO_SCHEDULE', () => {
    expect(nodeGroupsContent).toMatch(/effect\s*=\s*['"]NO_SCHEDULE['"]/);
  });

  test('application node group has cluster-autoscaler tags', () => {
    expect(nodeGroupsContent).toMatch(/k8s\.io\/cluster-autoscaler/);
  });

  test('application node group has depends_on for IAM policies', () => {
    expect(nodeGroupsContent).toMatch(/depends_on\s*=\s*\[/);
  });
});

describe('Terraform HCL Infrastructure - Spot Node Group', () => {
  let nodeGroupsContent: string;

  beforeAll(() => {
    nodeGroupsContent = fs.readFileSync(path.join(LIB_DIR, 'node-groups.tf'), 'utf8');
  });

  test('declares aws_eks_node_group.spot', () => {
    expect(nodeGroupsContent).toMatch(/resource\s+['"]aws_eks_node_group['"]\s+['"]spot['"]/);
  });

  test('spot node group uses spot_private subnets', () => {
    expect(nodeGroupsContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.spot_private\[\*\]\.id/);
  });

  test('spot node group has capacity_type = SPOT', () => {
    expect(nodeGroupsContent).toMatch(/capacity_type\s*=\s*['"]SPOT['"]/);
  });

  test('spot node group has labels with role = batch', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*role\s*=\s*['"]batch['"]/);
  });

  test('spot node group has labels with environment = var.environment', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*environment\s*=\s*var\.environment/);
  });

  test('spot node group has labels with nodegroup = spot', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*nodegroup\s*=\s*['"]spot['"]/);
  });

  test('spot node group has labels with capacity = spot', () => {
    expect(nodeGroupsContent).toMatch(/labels\s*=\s*{[\s\S]*capacity\s*=\s*['"]spot['"]/);
  });

  test('spot node group has taint with dedicated = spot', () => {
    expect(nodeGroupsContent).toMatch(/taint\s*{[\s\S]*key\s*=\s*['"]dedicated['"][\s\S]*value\s*=\s*['"]spot['"]/);
  });

  test('spot node group taint has effect = NO_SCHEDULE', () => {
    expect(nodeGroupsContent).toMatch(/effect\s*=\s*['"]NO_SCHEDULE['"]/);
  });

  test('spot node group has cluster-autoscaler tags', () => {
    expect(nodeGroupsContent).toMatch(/k8s\.io\/cluster-autoscaler/);
  });

  test('spot node group has depends_on for IAM policies', () => {
    expect(nodeGroupsContent).toMatch(/depends_on\s*=\s*\[/);
  });
});

describe('Terraform HCL Infrastructure - Outputs', () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
  });

  test('declares cluster_id output', () => {
    expect(outputsContent).toMatch(/output\s+['"]cluster_id['"]/);
  });

  test('declares cluster_arn output', () => {
    expect(outputsContent).toMatch(/output\s+['"]cluster_arn['"]/);
  });

  test('declares cluster_endpoint output', () => {
    expect(outputsContent).toMatch(/output\s+['"]cluster_endpoint['"]/);
  });

  test('declares cluster_version output', () => {
    expect(outputsContent).toMatch(/output\s+['"]cluster_version['"]/);
  });

  test('declares cluster_security_group_id output', () => {
    expect(outputsContent).toMatch(/output\s+['"]cluster_security_group_id['"]/);
  });

  test('declares cluster_oidc_issuer_url output', () => {
    expect(outputsContent).toMatch(/output\s+['"]cluster_oidc_issuer_url['"]/);
  });

  test('declares oidc_provider_arn output', () => {
    expect(outputsContent).toMatch(/output\s+['"]oidc_provider_arn['"]/);
  });

  test('declares vpc_id output', () => {
    expect(outputsContent).toMatch(/output\s+['"]vpc_id['"]/);
  });

  test('declares system_private_subnet_ids output', () => {
    expect(outputsContent).toMatch(/output\s+['"]system_private_subnet_ids['"]/);
  });

  test('declares application_private_subnet_ids output', () => {
    expect(outputsContent).toMatch(/output\s+['"]application_private_subnet_ids['"]/);
  });

  test('declares spot_private_subnet_ids output', () => {
    expect(outputsContent).toMatch(/output\s+['"]spot_private_subnet_ids['"]/);
  });

  test('declares public_subnet_ids output', () => {
    expect(outputsContent).toMatch(/output\s+['"]public_subnet_ids['"]/);
  });

  test('declares nat_gateway_ids output', () => {
    expect(outputsContent).toMatch(/output\s+['"]nat_gateway_ids['"]/);
  });

  test('declares system_node_group_id output', () => {
    expect(outputsContent).toMatch(/output\s+['"]system_node_group_id['"]/);
  });

  test('declares application_node_group_id output', () => {
    expect(outputsContent).toMatch(/output\s+['"]application_node_group_id['"]/);
  });

  test('declares spot_node_group_id output', () => {
    expect(outputsContent).toMatch(/output\s+['"]spot_node_group_id['"]/);
  });

  test('declares kms_key_id output', () => {
    expect(outputsContent).toMatch(/output\s+['"]kms_key_id['"]/);
  });

  test('declares kms_key_arn output', () => {
    expect(outputsContent).toMatch(/output\s+['"]kms_key_arn['"]/);
  });

  test('declares ebs_csi_driver_role_arn output', () => {
    expect(outputsContent).toMatch(/output\s+['"]ebs_csi_driver_role_arn['"]/);
  });

  test('declares aws_load_balancer_controller_role_arn output', () => {
    expect(outputsContent).toMatch(/output\s+['"]aws_load_balancer_controller_role_arn['"]/);
  });

  test('declares cluster_autoscaler_role_arn output', () => {
    expect(outputsContent).toMatch(/output\s+['"]cluster_autoscaler_role_arn['"]/);
  });

  test('declares configure_kubectl output', () => {
    expect(outputsContent).toMatch(/output\s+['"]configure_kubectl['"]/);
  });
});

describe('Terraform HCL Infrastructure - Security Best Practices', () => {
  let mainContent: string;
  let eksContent: string;
  let nodeGroupsContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    eksContent = fs.readFileSync(path.join(LIB_DIR, 'eks-cluster.tf'), 'utf8');
    nodeGroupsContent = fs.readFileSync(path.join(LIB_DIR, 'node-groups.tf'), 'utf8');
  });

  test('KMS encryption enabled for EKS secrets', () => {
    expect(eksContent).toMatch(/encryption_config\s*{/);
    expect(eksContent).toMatch(/resources\s*=\s*\[\s*['"]secrets['"]/);
  });

  test('KMS key rotation enabled', () => {
    expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test('EKS API endpoint is private only', () => {
    expect(eksContent).toMatch(/endpoint_private_access\s*=\s*true/);
    expect(eksContent).toMatch(/endpoint_public_access\s*=\s*false/);
  });

  test('All EKS control plane logs enabled', () => {
    expect(eksContent).toMatch(/['"]api['"]/);
    expect(eksContent).toMatch(/['"]audit['"]/);
    expect(eksContent).toMatch(/['"]authenticator['"]/);
    expect(eksContent).toMatch(/['"]controllerManager['"]/);
    expect(eksContent).toMatch(/['"]scheduler['"]/);
  });

  test('Node groups have taints for workload isolation', () => {
    expect(nodeGroupsContent).toMatch(/taint\s*{/);
    expect(nodeGroupsContent).toMatch(/effect\s*=\s*['"]NO_SCHEDULE['"]/);
  });

  test('Security groups restrict ingress appropriately', () => {
    expect(mainContent).toMatch(/from_port\s*=\s*443/);
    expect(mainContent).toMatch(/from_port\s*=\s*1025/);
  });

  test('IAM roles follow least privilege (specific service accounts)', () => {
    expect(eksContent).toMatch(/system:serviceaccount:kube-system:ebs-csi-controller-sa/);
    expect(eksContent).toMatch(/system:serviceaccount:kube-system:aws-load-balancer-controller/);
    expect(eksContent).toMatch(/system:serviceaccount:kube-system:cluster-autoscaler/);
  });

  test('NAT gateways provide outbound internet access for private subnets', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_nat_gateway['"]/);
    expect(mainContent).toMatch(/nat_gateway_id/);
  });
});

describe('Terraform HCL Infrastructure - High Availability', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
  });

  test('Resources deployed across multiple availability zones', () => {
    expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
  });

  test('NAT gateways in multiple AZs for HA', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_nat_gateway['"]\s+['"]main['"][\s\S]*count/);
  });

  test('Private subnets for each node group in multiple AZs', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]system_private['"][\s\S]*count/);
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]application_private['"][\s\S]*count/);
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]spot_private['"][\s\S]*count/);
  });

  test('Public subnets in multiple AZs', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]public['"][\s\S]*count/);
  });

  test('Separate route tables per AZ for private subnets', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_route_table['"]\s+['"]system_private['"][\s\S]*count/);
    expect(mainContent).toMatch(/resource\s+['"]aws_route_table['"]\s+['"]application_private['"][\s\S]*count/);
    expect(mainContent).toMatch(/resource\s+['"]aws_route_table['"]\s+['"]spot_private['"][\s\S]*count/);
  });
});

describe('Terraform HCL Infrastructure - Network Segmentation', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
  });

  test('Dedicated subnets for system node group', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]system_private['"]/);
    expect(mainContent).toMatch(/NodeGroup\s*=\s*['"]system['"]/);
  });

  test('Dedicated subnets for application node group', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]application_private['"]/);
    expect(mainContent).toMatch(/NodeGroup\s*=\s*['"]application['"]/);
  });

  test('Dedicated subnets for spot node group', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]spot_private['"]/);
    expect(mainContent).toMatch(/NodeGroup\s*=\s*['"]spot['"]/);
  });

  test('Public subnets separate from private subnets', () => {
    expect(mainContent).toMatch(/resource\s+['"]aws_subnet['"]\s+['"]public['"]/);
    expect(mainContent).toMatch(/Type\s*=\s*['"]public['"]/);
  });

  test('Private subnets tagged as private', () => {
    expect(mainContent).toMatch(/Type\s*=\s*['"]private['"]/);
  });

  test('System subnets use different CIDR blocks (count.index)', () => {
    expect(mainContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\)/);
  });

  test('Application subnets use different CIDR blocks (count.index + 3)', () => {
    expect(mainContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\s*\+\s*3\)/);
  });

  test('Spot subnets use different CIDR blocks (count.index + 6)', () => {
    expect(mainContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\s*\+\s*6\)/);
  });

  test('Public subnets use different CIDR blocks (count.index + 9)', () => {
    expect(mainContent).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*4,\s*count\.index\s*\+\s*9\)/);
  });
});

describe('Terraform HCL Infrastructure - Environment Parameterization', () => {
  let allContent: string;

  beforeAll(() => {
    const files = ['provider.tf', 'variables.tf', 'main.tf', 'eks-cluster.tf', 'node-groups.tf', 'outputs.tf'];
    allContent = files.map(f => fs.readFileSync(path.join(LIB_DIR, f), 'utf8')).join('\n');
  });

  test('CRITICAL: NO hardcoded "production" values anywhere (except in validation)', () => {
    const contentWithoutValidation = allContent.replace(/validation\s*{[\s\S]*?}/g, '');
    expect(contentWithoutValidation).not.toMatch(/['"]production['"]/i);
  });

  test('CRITICAL: NO hardcoded "staging" values anywhere (except in validation)', () => {
    const contentWithoutValidation = allContent.replace(/validation\s*{[\s\S]*?}/g, '');
    expect(contentWithoutValidation).not.toMatch(/['"]staging['"]/i);
  });

  test('CRITICAL: NO hardcoded "prod" values anywhere', () => {
    expect(allContent).not.toMatch(/['"]prod['"]/i);
  });

  test('CRITICAL: NO hardcoded "stage" values anywhere', () => {
    const contentWithoutValidation = allContent.replace(/validation\s*{[\s\S]*?}/g, '');
    expect(contentWithoutValidation).not.toMatch(/['"]stage['"]/i);
  });

  test('All node group labels use var.environment', () => {
    const nodeGroupsContent = fs.readFileSync(path.join(LIB_DIR, 'node-groups.tf'), 'utf8');
    const labelsMatches = nodeGroupsContent.match(/labels\s*=\s*{[\s\S]*?}/g) || [];
    labelsMatches.forEach(labelBlock => {
      expect(labelBlock).toMatch(/environment\s*=\s*var\.environment/);
    });
  });

  test('Tags use var.environment consistently', () => {
    const tagMatches = allContent.match(/Environment\s*=\s*var\.environment/g) || [];
    expect(tagMatches.length).toBeGreaterThan(15);
  });
});

describe('Terraform HCL Infrastructure - Code Quality', () => {
  let allFiles: string[];

  beforeAll(() => {
    allFiles = ['provider.tf', 'variables.tf', 'main.tf', 'eks-cluster.tf', 'node-groups.tf', 'outputs.tf'];
  });

  test('All files exist and are readable', () => {
    allFiles.forEach(file => {
      const filePath = path.join(LIB_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.statSync(filePath).isFile()).toBe(true);
    });
  });

  test('All files have non-zero content', () => {
    allFiles.forEach(file => {
      const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test('No files contain TODO or FIXME comments', () => {
    allFiles.forEach(file => {
      const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      expect(content).not.toMatch(/TODO/i);
      expect(content).not.toMatch(/FIXME/i);
    });
  });

  test('Resource names use snake_case', () => {
    allFiles.forEach(file => {
      const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      const resourceMatches = content.match(/resource\s+['"][\w-]+['"]\s+['"][\w_]+['"]/g) || [];
      resourceMatches.forEach(match => {
        const resourceName = match.match(/['"]([\w_]+)['"]$/)?.[1];
        if (resourceName) {
          expect(resourceName).toMatch(/^[a-z][a-z0-9_]*$/);
        }
      });
    });
  });

  test('Variable names use snake_case', () => {
    const variablesContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
    const variableMatches = variablesContent.match(/variable\s+['"][\w_]+['"]/g) || [];
    variableMatches.forEach(match => {
      const variableName = match.match(/['"]([\w_]+)['"]$/)?.[1];
      if (variableName) {
        expect(variableName).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    });
  });
});
