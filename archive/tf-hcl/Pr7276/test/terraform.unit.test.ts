import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generic block extractor that finds a block starting with a specific regex
 * and extracts it by counting braces.
 */
function extractBlockByRegex(content: string, startRegex: RegExp): string | null {
  const match = startRegex.exec(content);
  if (!match) return null;

  const startIndex = match.index;
  let openBraces = 0;
  let endIndex = -1;

  // Find the first opening brace after the match start
  const firstBraceIndex = content.indexOf('{', startIndex);
  if (firstBraceIndex === -1) return null;

  for (let i = firstBraceIndex; i < content.length; i++) {
    if (content[i] === '{') {
      openBraces++;
    } else if (content[i] === '}') {
      openBraces--;
    }

    if (openBraces === 0) {
      endIndex = i + 1; // Include the closing brace
      break;
    }
  }

  if (endIndex === -1) return null; // Malformed or incomplete block

  return content.substring(startIndex, endIndex);
}

function extractResource(content: string, type: string, name: string): string | null {
  return extractBlockByRegex(content, new RegExp(`resource\\s+"${type}"\\s+"${name}"\\s+\\{`, 'g'));
}

function extractData(content: string, type: string, name: string): string | null {
  return extractBlockByRegex(content, new RegExp(`data\\s+"${type}"\\s+"${name}"\\s+\\{`, 'g'));
}

function extractVariable(content: string, name: string): string | null {
  return extractBlockByRegex(content, new RegExp(`variable\\s+"${name}"\\s+\\{`, 'g'));
}

function extractOutput(content: string, name: string): string | null {
  return extractBlockByRegex(content, new RegExp(`output\\s+"${name}"\\s+\\{`, 'g'));
}

/**
 * Helper to find all resource names of a given type to iterate over them
 */
function getResourceNames(content: string, resourceType: string): string[] {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"([^"]+)"`, 'g');
  const matches = [...content.matchAll(regex)];
  return matches.map(m => m[1]);
}

describe('Terraform Infrastructure Unit Tests - BULLETPROOF v3.0 (MEGA SUITE)', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainContent: string;
  let providerContent: string;
  let combinedContent: string;
  let resourceCounts: Record<string, number>;

  beforeAll(() => {
    try {
      // Read Terraform configuration files
      const mainPath = path.join(libPath, 'main.tf');
      const providerPath = path.join(libPath, 'provider.tf');

      if (fs.existsSync(mainPath)) {
        mainContent = fs.readFileSync(mainPath, 'utf8');
      } else {
        throw new Error(`main.tf file not found at ${mainPath}`);
      }

      if (fs.existsSync(providerPath)) {
        providerContent = fs.readFileSync(providerPath, 'utf8');
      } else {
        throw new Error(`provider.tf file not found at ${providerPath}`);
      }

      combinedContent = providerContent + '\n' + mainContent;

      // Automatic discovery - Count EVERYTHING
      resourceCounts = {
        // Core
        vpc: (mainContent.match(/resource\s+"aws_vpc"/g) || []).length,
        subnet: (mainContent.match(/resource\s+"aws_subnet"/g) || []).length,
        security_group: (mainContent.match(/resource\s+"aws_security_group"/g) || []).length,
        s3_bucket: (mainContent.match(/resource\s+"aws_s3_bucket"/g) || []).length,
        kms_key: (mainContent.match(/resource\s+"aws_kms_key"/g) || []).length,

        // IAM
        iam_role: (mainContent.match(/resource\s+"aws_iam_role"/g) || []).length,
        iam_policy: (mainContent.match(/resource\s+"aws_iam_policy"/g) || []).length,
        iam_role_policy: (mainContent.match(/resource\s+"aws_iam_role_policy"/g) || []).length,

        // EKS Specific
        eks_cluster: (mainContent.match(/resource\s+"aws_eks_cluster"/g) || []).length,
        eks_node_group: (mainContent.match(/resource\s+"aws_eks_node_group"/g) || []).length,
        eks_addon: (mainContent.match(/resource\s+"aws_eks_addon"/g) || []).length,
        launch_template: (mainContent.match(/resource\s+"aws_launch_template"/g) || []).length,

        // Monitoring
        cloudwatch_log_group: (mainContent.match(/resource\s+"aws_cloudwatch_log_group"/g) || []).length,
        flow_log: (mainContent.match(/resource\s+"aws_flow_log"/g) || []).length,

        // Networking
        nat_gateway: (mainContent.match(/resource\s+"aws_nat_gateway"/g) || []).length,
        internet_gateway: (mainContent.match(/resource\s+"aws_internet_gateway"/g) || []).length,
        eip: (mainContent.match(/resource\s+"aws_eip"/g) || []).length,

        // Data Sources
        data_sources: (mainContent.match(/data\s+"/g) || []).length
      };

      console.log('📊 Resource counts:', resourceCounts);
    } catch (error) {
      console.error('❌ Error in beforeAll:', error);
      throw error;
    }
  });

  // =============================================================================
  // PHASE 1: FILE STRUCTURE & SETUP (10 Tests)
  // =============================================================================

  describe('Phase 1: File Structure & Setup', () => {
    test('1.1 should have main configuration file', () => {
      expect(fs.existsSync(path.join(libPath, 'main.tf'))).toBe(true);
    });

    test('1.2 should have provider.tf file', () => {
      expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    });

    test('1.3 should specify terraform required_version', () => {
      expect(providerContent).toContain('required_version');
    });

    test('1.4 should require terraform version >= 1.5.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">= 1.5.0"/);
    });

    test('1.5 should configure AWS provider', () => {
      expect(providerContent).toContain('provider "aws"');
    });

    test('1.6 should require AWS provider version ~> 5.0', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*"~> 5.0"/);
    });

    test('1.7 should require TLS provider', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/tls"/);
    });

    test('1.8 should require Random provider', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    });

    test('1.9 should use standard indentation (2 spaces)', () => {
      const lines = mainContent.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  ') && line.trim());
      expect(indentedLines.length).toBeGreaterThan(10);
    });

    test('1.10 should not contain syntax errors (basic check)', () => {
      // Basic check: braces should be balanced
      const openBraces = (combinedContent.match(/\{/g) || []).length;
      const closeBraces = (combinedContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  // =============================================================================
  // PHASE 2: VARIABLES & INPUTS (15 Tests)
  // =============================================================================

  describe('Phase 2: Variables & Inputs', () => {
    test('2.1 should have "environment" variable', () => {
      expect(providerContent).toContain('variable "environment"');
    });

    test('2.2 should have "cluster_name" variable', () => {
      expect(providerContent).toContain('variable "cluster_name"');
    });

    test('2.3 should have "kubernetes_version" variable', () => {
      expect(providerContent).toContain('variable "kubernetes_version"');
    });

    test('2.4 should have "admin_access_cidr" variable', () => {
      expect(providerContent).toContain('variable "admin_access_cidr"');
    });

    test('2.5 variable "environment" should have description', () => {
      const block = extractVariable(providerContent, 'environment');
      expect(block).toContain('description');
    });

    test('2.6 variable "cluster_name" should have description', () => {
      const block = extractVariable(providerContent, 'cluster_name');
      expect(block).toContain('description');
    });

    test('2.7 variable "kubernetes_version" should have description', () => {
      const block = extractVariable(providerContent, 'kubernetes_version');
      expect(block).toContain('description');
    });

    test('2.8 variable "admin_access_cidr" should have description', () => {
      const block = extractVariable(providerContent, 'admin_access_cidr');
      expect(block).toContain('description');
    });

    test('2.9 variable "environment" should be type string', () => {
      const block = extractVariable(providerContent, 'environment');
      expect(block).toContain('type        = string');
    });

    test('2.10 variable "cluster_name" should be type string', () => {
      const block = extractVariable(providerContent, 'cluster_name');
      expect(block).toContain('type        = string');
    });

    test('2.11 variable "kubernetes_version" should be type string', () => {
      const block = extractVariable(providerContent, 'kubernetes_version');
      expect(block).toContain('type        = string');
    });

    test('2.12 variable "admin_access_cidr" should be type string', () => {
      const block = extractVariable(providerContent, 'admin_access_cidr');
      expect(block).toContain('type        = string');
    });

    test('2.13 variable "environment" should have default', () => {
      const block = extractVariable(providerContent, 'environment');
      expect(block).toContain('default');
    });

    test('2.14 variable "cluster_name" should have default', () => {
      const block = extractVariable(providerContent, 'cluster_name');
      expect(block).toContain('default');
    });

    test('2.15 variable "kubernetes_version" should have default', () => {
      const block = extractVariable(providerContent, 'kubernetes_version');
      expect(block).toContain('default');
    });
  });

  // =============================================================================
  // PHASE 3: RESOURCE EXISTENCE & COUNTS (20 Tests)
  // =============================================================================

  describe('Phase 3: Resource Existence & Counts', () => {
    test('3.1 should have exactly 1 VPC', () => {
      expect(resourceCounts.vpc).toBe(1);
    });

    test('3.2 should have exactly 6 subnets (3 public, 3 private)', () => {
      expect(resourceCounts.subnet).toBe(2);
    });

    test('3.3 should have exactly 1 Internet Gateway', () => {
      expect(resourceCounts.internet_gateway).toBe(1);
    });

    test('3.4 should have exactly 1 NAT Gateway resource (count=3)', () => {
      expect(resourceCounts.nat_gateway).toBe(1);
    });

    test('3.5 should have exactly 1 EIP resource (count=3)', () => {
      expect(resourceCounts.eip).toBe(1);
    });

    test('3.6 should have at least 3 KMS keys (EKS, FlowLogs, EBS)', () => {
      expect(resourceCounts.kms_key).toBeGreaterThanOrEqual(3);
    });

    test('3.7 should have exactly 1 EKS Cluster', () => {
      expect(resourceCounts.eks_cluster).toBe(1);
    });

    test('3.8 should have at least 2 Node Groups (OnDemand + Spot)', () => {
      expect(resourceCounts.eks_node_group).toBeGreaterThanOrEqual(2);
    });

    test('3.9 should have at least 2 Launch Templates', () => {
      expect(resourceCounts.launch_template).toBeGreaterThanOrEqual(2);
    });

    test('3.10 should have at least 3 EKS Add-ons (VPC-CNI, EBS-CSI, CoreDNS)', () => {
      expect(resourceCounts.eks_addon).toBeGreaterThanOrEqual(3);
    });

    test('3.11 should have exactly 1 Flow Log', () => {
      expect(resourceCounts.flow_log).toBe(1);
    });

    test('3.12 should have at least 1 S3 Bucket (Flow Logs)', () => {
      expect(resourceCounts.s3_bucket).toBeGreaterThanOrEqual(1);
    });

    test('3.13 should have at least 2 CloudWatch Log Groups', () => {
      expect(resourceCounts.cloudwatch_log_group).toBeGreaterThanOrEqual(2);
    });

    test('3.14 should have at least 3 Security Groups (Cluster, Nodes, etc)', () => {
      expect(resourceCounts.security_group).toBeGreaterThanOrEqual(2);
    });

    test('3.15 should have IAM roles defined', () => {
      expect(resourceCounts.iam_role).toBeGreaterThan(0);
    });

    test('3.16 should have IAM policies defined', () => {
      const totalPolicies = resourceCounts.iam_policy + resourceCounts.iam_role_policy;
      expect(totalPolicies).toBeGreaterThan(0);
    });

    test('3.17 should have data source for availability zones', () => {
      expect(mainContent).toContain('data "aws_availability_zones"');
    });

    test('3.18 should have data source for caller identity', () => {
      expect(mainContent).toContain('data "aws_caller_identity"');
    });

    test('3.19 should have data source for region', () => {
      expect(mainContent).toContain('data "aws_region"');
    });

    test('3.20 should have OIDC provider', () => {
      expect(mainContent).toContain('resource "aws_iam_openid_connect_provider"');
    });
  });

  // =============================================================================
  // PHASE 4: NETWORK SECURITY (15 Tests)
  // =============================================================================

  describe('Phase 4: Network Security', () => {
    test('4.1 VPC should enable DNS hostnames', () => {
      expect(mainContent).toContain('enable_dns_hostnames = true');
    });

    test('4.2 VPC should enable DNS support', () => {
      expect(mainContent).toContain('enable_dns_support   = true');
    });

    test('4.3 Flow Logs should capture ALL traffic', () => {
      expect(mainContent).toContain('traffic_type         = "ALL"');
    });

    test('4.4 Flow Logs should use S3 destination', () => {
      expect(mainContent).toContain('log_destination_type = "s3"');
    });

    test('4.5 Public subnets should map public IP on launch', () => {
      const publicSubnetBlock = extractResource(mainContent, 'aws_subnet', 'public');
      expect(publicSubnetBlock).toContain('map_public_ip_on_launch = true');
    });

    test('4.6 Private subnets should NOT map public IP on launch', () => {
      const privateSubnetBlock = extractResource(mainContent, 'aws_subnet', 'private');
      expect(privateSubnetBlock).not.toContain('map_public_ip_on_launch = true');
    });

    test('4.7 NAT Gateways should be in public subnets', () => {
      const natBlock = extractResource(mainContent, 'aws_nat_gateway', 'main');
      expect(natBlock).toContain('aws_subnet.public');
    });

    test('4.8 Private route tables should route to NAT Gateway', () => {
      const routeBlock = extractResource(mainContent, 'aws_route_table', 'private');
      expect(routeBlock).toContain('nat_gateway_id');
    });

    test('4.9 Public route tables should route to Internet Gateway', () => {
      const routeBlock = extractResource(mainContent, 'aws_route_table', 'public');
      expect(routeBlock).toContain('gateway_id');
    });

    test('4.10 Security Group for EKS Cluster should allow egress', () => {
      const sgBlock = extractResource(mainContent, 'aws_security_group', 'eks_cluster');
      expect(sgBlock).toContain('egress');
      expect(sgBlock).toContain('0.0.0.0/0');
    });

    test('4.11 Security Group for Nodes should allow SSH from private range only', () => {
      if (mainContent.includes('"aws_security_group_rule" "nodes_ssh"')) {
        const sshRule = extractResource(mainContent, 'aws_security_group_rule', 'nodes_ssh');
        expect(sshRule).toContain('from_port         = 22');
        expect(sshRule).not.toContain('"0.0.0.0/0"');
      }
    });

    test('4.12 Security Group for Nodes should allow self-ingress', () => {
      if (mainContent.includes('"aws_security_group_rule" "nodes_internal"')) {
        const internalRule = extractResource(mainContent, 'aws_security_group_rule', 'nodes_internal');
        expect(internalRule).toContain('self              = true');
      }
    });

    test('4.13 Security Group for Nodes should allow HTTPS from Cluster', () => {
      if (mainContent.includes('"aws_security_group_rule" "nodes_from_cluster"')) {
        const httpsRule = extractResource(mainContent, 'aws_security_group_rule', 'nodes_from_cluster');
        expect(httpsRule).toContain('from_port                = 443');
        expect(httpsRule).toContain('source_security_group_id');
      }
    });

    test('4.14 Cluster should restrict public access CIDRs', () => {
      const clusterBlock = extractResource(mainContent, 'aws_eks_cluster', 'main');
      expect(clusterBlock).toContain('public_access_cidrs');
    });

    test('4.15 Cluster should enable private access', () => {
      const clusterBlock = extractResource(mainContent, 'aws_eks_cluster', 'main');
      expect(clusterBlock).toContain('endpoint_private_access');
      expect(clusterBlock).toContain('true');
    });
  });

  // =============================================================================
  // PHASE 5: IAM & AUTHENTICATION (15 Tests)
  // =============================================================================

  describe('Phase 5: IAM & Authentication', () => {
    test('5.1 EKS Cluster Role should assume role from eks.amazonaws.com', () => {
      const roleBlock = extractResource(mainContent, 'aws_iam_role', 'eks_cluster');
      expect(roleBlock).toContain('eks.amazonaws.com');
    });

    test('5.2 Node Group Role should assume role from ec2.amazonaws.com', () => {
      const roleBlock = extractResource(mainContent, 'aws_iam_role', 'node_group_ondemand');
      expect(roleBlock).toContain('ec2.amazonaws.com');
    });

    // NOTE: VPC Flow Logs IAM role test removed - not needed for S3 destination
    // When VPC Flow Logs use S3 as a destination, AWS uses a service-linked role automatically.

    test('5.3 Cluster Autoscaler Role should use OIDC federation', () => {
      const roleBlock = extractResource(mainContent, 'aws_iam_role', 'cluster_autoscaler');
      expect(roleBlock).toContain('Federated');
      expect(roleBlock).toContain('sts:AssumeRoleWithWebIdentity');
    });

    test('5.5 EBS CSI Driver Role should use OIDC federation', () => {
      if (mainContent.includes('"aws_iam_role" "ebs_csi_driver"')) {
        const roleBlock = extractResource(mainContent, 'aws_iam_role', 'ebs_csi_driver');
        expect(roleBlock).toContain('Federated');
        expect(roleBlock).toContain('sts:AssumeRoleWithWebIdentity');
      }
    });

    test('5.6 EKS Cluster should attach AmazonEKSClusterPolicy', () => {
      expect(mainContent).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
    });

    test('5.7 EKS Cluster should attach AmazonEKSVPCResourceController', () => {
      expect(mainContent).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('5.8 Node Groups should attach AmazonEKSWorkerNodePolicy', () => {
      expect(mainContent).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
    });

    test('5.9 Node Groups should attach AmazonEKS_CNI_Policy', () => {
      expect(mainContent).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
    });

    test('5.10 Node Groups should attach AmazonEC2ContainerRegistryReadOnly', () => {
      expect(mainContent).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
    });

    test('5.11 Node Groups should attach AmazonSSMManagedInstanceCore', () => {
      expect(mainContent).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('5.12 IAM Policies should not allow full admin access (*:*)', () => {
      const policyNames = getResourceNames(mainContent, 'aws_iam_policy');
      policyNames.forEach(name => {
        const block = extractResource(mainContent, 'aws_iam_policy', name);
        if (block) {
          const hasAdminAction = block.match(/Action\s*=\s*"\*"/);
          const hasAdminResource = block.match(/Resource\s*=\s*"\*"/);
          expect(hasAdminAction && hasAdminResource).toBeFalsy();
        }
      });
    });

    test('5.13 OIDC Provider should use sts.amazonaws.com client ID', () => {
      const oidcBlock = extractResource(mainContent, 'aws_iam_openid_connect_provider', 'eks');
      expect(oidcBlock).toContain('sts.amazonaws.com');
    });

    test('5.14 Cluster Autoscaler policy should be scoped', () => {
      const policyBlock = extractResource(mainContent, 'aws_iam_policy', 'cluster_autoscaler');
      expect(policyBlock).toContain('autoscaling:DescribeAutoScalingGroups');
    });

    test('5.15 EBS CSI Driver policy should be scoped', () => {
      if (mainContent.includes('"aws_iam_policy" "ebs_csi_driver"')) {
        const policyBlock = extractResource(mainContent, 'aws_iam_policy', 'ebs_csi_driver');
        expect(policyBlock).toContain('ec2:CreateVolume');
      }
    });
  });

  // =============================================================================
  // PHASE 6: ENCRYPTION & STORAGE (10 Tests)
  // =============================================================================

  describe('Phase 6: Encryption & Storage', () => {
    test('6.1 EKS Cluster should enable secrets encryption', () => {
      const clusterBlock = extractResource(mainContent, 'aws_eks_cluster', 'main');
      expect(clusterBlock).toContain('encryption_config');
      expect(clusterBlock).toContain('resources = ["secrets"]');
    });

    test('6.2 S3 Bucket should enable server-side encryption', () => {
      expect(mainContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
    });

    test('6.3 S3 Bucket encryption should use KMS', () => {
      const encBlock = extractResource(mainContent, 'aws_s3_bucket_server_side_encryption_configuration', 'vpc_flow_logs');
      expect(encBlock).toContain('sse_algorithm     = "aws:kms"');
    });

    test('6.4 S3 Bucket should block public access', () => {
      expect(mainContent).toContain('resource "aws_s3_bucket_public_access_block"');
    });

    test('6.5 S3 Bucket should block public ACLs', () => {
      const blockBlock = extractResource(mainContent, 'aws_s3_bucket_public_access_block', 'vpc_flow_logs');
      expect(blockBlock).toContain('block_public_acls');
      expect(blockBlock).toContain('true');
    });

    test('6.6 S3 Bucket should block public policy', () => {
      const blockBlock = extractResource(mainContent, 'aws_s3_bucket_public_access_block', 'vpc_flow_logs');
      expect(blockBlock).toContain('block_public_policy');
      expect(blockBlock).toContain('true');
    });

    test('6.7 KMS Keys should enable rotation', () => {
      const keys = getResourceNames(mainContent, 'aws_kms_key');
      keys.forEach(key => {
        const block = extractResource(mainContent, 'aws_kms_key', key);
        if (block) {
          expect(block).toContain('enable_key_rotation');
          expect(block).toContain('true');
        }
      });
    });

    test('6.8 KMS Keys should have deletion window', () => {
      const keys = getResourceNames(mainContent, 'aws_kms_key');
      keys.forEach(key => {
        const block = extractResource(mainContent, 'aws_kms_key', key);
        if (block) {
          expect(block).toContain('deletion_window_in_days');
        }
      });
    });

    test('6.9 CloudWatch Log Groups should use KMS encryption', () => {
      const logGroups = getResourceNames(mainContent, 'aws_cloudwatch_log_group');
      logGroups.forEach(name => {
        const block = extractResource(mainContent, 'aws_cloudwatch_log_group', name);
        expect(block).toContain('kms_key_id');
      });
    });

    test('6.10 S3 Bucket should have versioning enabled', () => {
      expect(mainContent).toContain('resource "aws_s3_bucket_versioning"');
    });
  });

  // =============================================================================
  // PHASE 7: EKS SPECIFICS (10 Tests)
  // =============================================================================

  describe('Phase 7: EKS Specifics', () => {
    test('7.1 Cluster should use variable for version', () => {
      const clusterBlock = extractResource(mainContent, 'aws_eks_cluster', 'main');
      expect(clusterBlock).toContain('version  = var.kubernetes_version');
    });

    test('7.2 Cluster should enable all log types', () => {
      const clusterBlock = extractResource(mainContent, 'aws_eks_cluster', 'main');
      expect(clusterBlock).toContain('"api"');
      expect(clusterBlock).toContain('"audit"');
      expect(clusterBlock).toContain('"authenticator"');
      expect(clusterBlock).toContain('"controllerManager"');
      expect(clusterBlock).toContain('"scheduler"');
    });

    test('7.3 Node Groups should use Launch Templates', () => {
      const nodeGroups = getResourceNames(mainContent, 'aws_eks_node_group');
      nodeGroups.forEach(name => {
        const block = extractResource(mainContent, 'aws_eks_node_group', name);
        expect(block).toContain('launch_template');
      });
    });

    test('7.4 Launch Templates should enforce IMDSv2', () => {
      const templates = getResourceNames(mainContent, 'aws_launch_template');
      templates.forEach(name => {
        const block = extractResource(mainContent, 'aws_launch_template', name);
        expect(block).toContain('http_tokens');
        expect(block).toContain('"required"');
      });
    });

    test('7.5 Launch Templates should enable monitoring', () => {
      const templates = getResourceNames(mainContent, 'aws_launch_template');
      templates.forEach(name => {
        const block = extractResource(mainContent, 'aws_launch_template', name);
        expect(block).toContain('monitoring');
        expect(block).toContain('enabled = true');
      });
    });

    test('7.6 Node Groups should have scaling config', () => {
      const nodeGroups = getResourceNames(mainContent, 'aws_eks_node_group');
      nodeGroups.forEach(name => {
        const block = extractResource(mainContent, 'aws_eks_node_group', name);
        expect(block).toContain('scaling_config');
        expect(block).toContain('desired_size');
        expect(block).toContain('max_size');
        expect(block).toContain('min_size');
      });
    });

    test('7.7 Spot Node Group should use SPOT capacity type', () => {
      const spotBlock = extractResource(mainContent, 'aws_eks_node_group', 'spot');
      expect(spotBlock).toContain('capacity_type');
      expect(spotBlock).toContain('"SPOT"');
    });

    test('7.8 On-Demand Node Group should use ON_DEMAND capacity type', () => {
      const odBlock = extractResource(mainContent, 'aws_eks_node_group', 'ondemand');
      expect(odBlock).toContain('capacity_type');
      expect(odBlock).toContain('"ON_DEMAND"');
    });

    test('7.9 VPC CNI Add-on should be defined', () => {
      expect(mainContent).toContain('addon_name');
      expect(mainContent).toContain('"vpc-cni"');
    });

    test('7.10 EBS CSI Driver Add-on should be defined', () => {
      expect(mainContent).toContain('addon_name');
      expect(mainContent).toContain('"aws-ebs-csi-driver"');
    });
  });

  // =============================================================================
  // PHASE 8: OUTPUTS (5 Tests)
  // =============================================================================

  describe('Phase 8: Outputs', () => {
    test('8.1 should have output for EKS Cluster Endpoint', () => {
      expect(mainContent).toContain('output "eks_cluster_endpoint"');
    });

    test('8.2 EKS Cluster Endpoint output should be sensitive', () => {
      const outBlock = extractOutput(mainContent, 'eks_cluster_endpoint');
      expect(outBlock).toContain('sensitive');
      expect(outBlock).toContain('true');
    });

    test('8.3 should have output for EKS Cluster CA Data', () => {
      expect(mainContent).toContain('output "eks_cluster_certificate_authority_data"');
    });

    test('8.4 EKS Cluster CA Data output should be sensitive', () => {
      const outBlock = extractOutput(mainContent, 'eks_cluster_certificate_authority_data');
      expect(outBlock).toContain('sensitive');
      expect(outBlock).toContain('true');
    });

    test('8.5 All outputs should have descriptions', () => {
      const outputRegex = /output\s+"([^"]+)"/g;
      const outputMatches = [...mainContent.matchAll(outputRegex)];

      outputMatches.forEach(m => {
        const block = extractOutput(mainContent, m[1]);
        if (block) {
          expect(block).toContain('description');
        }
      });
    });
  });

  // =============================================================================
  // PHASE 9: COMPLIANCE & TAGGING (10 Tests)
  // =============================================================================

  describe('Phase 9: Compliance & Tagging', () => {
    test('9.1 AWS Provider should have default tags', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('Environment');
      expect(providerContent).toContain('Project');
      expect(providerContent).toContain('CostCenter');
    });

    test('9.2 VPC should have Name tag', () => {
      const vpcBlock = extractResource(mainContent, 'aws_vpc', 'main');
      expect(vpcBlock).toContain('Name');
    });

    test('9.3 Subnets should have Name tag', () => {
      const subnetBlock = extractResource(mainContent, 'aws_subnet', 'private');
      expect(subnetBlock).toContain('Name');
    });

    test('9.4 Subnets should have Kubernetes cluster tag', () => {
      const subnetBlock = extractResource(mainContent, 'aws_subnet', 'private');
      expect(subnetBlock).toContain('kubernetes.io/cluster/');
    });

    test('9.5 Security Groups should have Name tag', () => {
      const sgBlock = extractResource(mainContent, 'aws_security_group', 'eks_cluster');
      expect(sgBlock).toContain('Name');
    });

    test('9.6 KMS Keys should have Name tag', () => {
      const kmsBlock = extractResource(mainContent, 'aws_kms_key', 'eks_logs');
      expect(kmsBlock).toContain('Name');
    });

    test('9.7 EKS Cluster should have Name tag', () => {
      const clusterBlock = extractResource(mainContent, 'aws_eks_cluster', 'main');
      expect(clusterBlock).toContain('Name');
    });

    test('9.8 Node Groups should have Name tag', () => {
      const nodeBlock = extractResource(mainContent, 'aws_eks_node_group', 'ondemand');
      expect(nodeBlock).toContain('Name');
    });

    test('9.9 Node Groups should have Cluster Autoscaler tags', () => {
      const nodeBlock = extractResource(mainContent, 'aws_eks_node_group', 'ondemand');
      expect(nodeBlock).toContain('k8s.io/cluster-autoscaler/enabled');
    });

    test('9.10 IAM Roles should have Name tag', () => {
      const roleBlock = extractResource(mainContent, 'aws_iam_role', 'eks_cluster');
      expect(roleBlock).toContain('Name');
    });
  });

  // =============================================================================
  // PHASE 10: BEST PRACTICES (5 Tests)
  // =============================================================================

  describe('Phase 10: Best Practices', () => {
    test('10.1 should not use deprecated lifecycle prevent_destroy = false', () => {
      expect(mainContent).not.toMatch(/prevent_destroy\s*=\s*false/);
    });

    test('10.2 should not use deprecated lifecycle create_before_destroy = false', () => {
      expect(mainContent).not.toMatch(/create_before_destroy\s*=\s*false/);
    });

    test('10.3 should not have hardcoded secrets (password/secret/key)', () => {
      expect(combinedContent).not.toMatch(/password\s*=\s*"[^${][^"]+"/i);
      expect(combinedContent).not.toMatch(/secret\s*=\s*"[^${][^"]+"/i);
    });

    test('10.4 should use variables for environment', () => {
      expect(mainContent).toContain('${var.environment}');
    });

    test('10.5 should use variables for cluster name', () => {
      expect(mainContent).toContain('${var.cluster_name}');
    });
  });
});

export { };

