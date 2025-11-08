// eks-infrastructure.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { expect, describe, it, beforeAll } from '@jest/globals';

// Assuming main.tf is in the same directory as the test file
// Adjust path as needed for your project structure
const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');

describe('EKS Infrastructure Terraform Tests', () => {
  let tfContent: string;
  
  beforeAll(() => {
    // Read the Terraform file once before all tests
    tfContent = fs.readFileSync(MAIN_TF, 'utf8');
  });
  
  // Helper function to check if pattern exists in the file
  const has = (pattern: RegExp): boolean => pattern.test(tfContent);
  
  // Helper function to count occurrences
  const count = (pattern: RegExp): number => {
    const matches = tfContent.match(pattern);
    return matches ? matches.length : 0;
  };

  describe('File Structure and Basic Configuration', () => {
    it('should have main.tf file with substantial content', () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
      expect(tfContent.length).toBeGreaterThan(5000);
    });

    it('should not contain hardcoded AWS credentials', () => {
      expect(has(/aws_access_key_id\s*=/)).toBe(false);
      expect(has(/aws_secret_access_key\s*=/)).toBe(false);
      expect(has(/aws_access_key\s*=/)).toBe(false);
      expect(has(/aws_secret_key\s*=/)).toBe(false);
    });
  });

  describe('Variable Definitions', () => {
    it('should define aws_region variable with us-west-2 default', () => {
      expect(has(/variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"us-west-2"/)).toBe(true);
      expect(has(/variable\s+"aws_region"\s*{[\s\S]*?type\s*=\s*string/)).toBe(true);
      expect(has(/variable\s+"aws_region"\s*{[\s\S]*?description\s*=\s*"AWS region for resources"/)).toBe(true);
    });

    it('should define cluster_name variable with proper defaults', () => {
      expect(has(/variable\s+"cluster_name"\s*{[\s\S]*?default\s*=\s*"platform-migration-eks-new"/)).toBe(true);
      expect(has(/variable\s+"cluster_name"\s*{[\s\S]*?type\s*=\s*string/)).toBe(true);
    });

    it('should define cluster_version variable for Kubernetes version', () => {
      expect(has(/variable\s+"cluster_version"\s*{[\s\S]*?default\s*=\s*"1\.33"/)).toBe(true);
      expect(has(/variable\s+"cluster_version"\s*{[\s\S]*?description\s*=\s*"Kubernetes version/)).toBe(true);
    });

    it('should define vpc_cidr variable with 10.0.0.0/16 default', () => {
      expect(has(/variable\s+"vpc_cidr"\s*{[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
      expect(has(/variable\s+"vpc_cidr"\s*{[\s\S]*?type\s*=\s*string/)).toBe(true);
    });
  });

  describe('Local Variables Configuration', () => {
    it('should define common_tags with required fields', () => {
      expect(has(/locals\s*{[\s\S]*?common_tags\s*=\s*{/)).toBe(true);
      expect(has(/Environment\s*=\s*"production"/)).toBe(true);
      expect(has(/Project\s*=\s*"platform-migration"/)).toBe(true);
      expect(has(/Owner\s*=\s*"devops-team"/)).toBe(true);
    });

    it('should define availability zones reference', () => {
      expect(has(/azs\s*=\s*data\.aws_availability_zones\.available\.names/)).toBe(true);
    });

    it('should define public subnet CIDRs', () => {
      expect(has(/"10\.0\.1\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.2\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.3\.0\/24"/)).toBe(true);
    });

    it('should define private subnet CIDRs', () => {
      expect(has(/"10\.0\.10\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.11\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.12\.0\/24"/)).toBe(true);
    });
  });

  describe('Data Sources', () => {
    it('should configure aws_availability_zones data source', () => {
      expect(has(/data\s+"aws_availability_zones"\s+"available"\s*{[\s\S]*?state\s*=\s*"available"/)).toBe(true);
    });

    it('should configure aws_caller_identity data source', () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"\s*{}/)).toBe(true);
    });

    it('should configure aws_eks_cluster_auth data source', () => {
      expect(has(/data\s+"aws_eks_cluster_auth"\s+"cluster"\s*{[\s\S]*?name\s*=\s*aws_eks_cluster\.main\.name/)).toBe(true);
    });

  describe('VPC and Core Networking', () => {
    it('should create VPC with DNS support enabled', () => {
      expect(has(/resource\s+"aws_vpc"\s+"main"\s*{/)).toBe(true);
      expect(has(/cidr_block\s*=\s*var\.vpc_cidr/)).toBe(true);
      expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
      expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
    });

    it('should tag VPC with Kubernetes cluster tags', () => {
      expect(has(/"kubernetes\.io\/cluster\/\$\{var\.cluster_name\}"\s*=\s*"shared"/)).toBe(true);
    });

    it('should create Internet Gateway attached to VPC', () => {
      expect(has(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
    });

    it('should create three public subnets with proper configuration', () => {
      expect(has(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
      expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(true);
      expect(has(/"kubernetes\.io\/role\/elb"\s*=\s*"1"/)).toBe(true);
    });

    it('should create three private subnets', () => {
      expect(has(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
      expect(has(/"kubernetes\.io\/role\/internal-elb"\s*=\s*"1"/)).toBe(true);
    });

    it('should create Elastic IPs for NAT Gateways', () => {
      expect(has(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
      expect(has(/domain\s*=\s*"vpc"/)).toBe(true);
    });

    it('should create NAT Gateways in each AZ', () => {
      expect(has(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
    });

    it('should create public route table with internet gateway route', () => {
      expect(has(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/)).toBe(true);
      expect(has(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id/)).toBe(true);
    });

    it('should create private route tables with NAT gateway routes', () => {
      expect(has(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
    });

    it('should associate route tables with subnets', () => {
      expect(has(/resource\s+"aws_route_table_association"\s+"public"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
      expect(has(/resource\s+"aws_route_table_association"\s+"private"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
    });
  });

  describe('EKS Security Groups', () => {
    it('should create EKS cluster security group', () => {
      expect(has(/resource\s+"aws_security_group"\s+"eks_cluster"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\$\{var\.cluster_name\}-cluster-sg"/)).toBe(true);
      expect(has(/description\s*=\s*"Security group for EKS cluster control plane"/)).toBe(true);
    });

    it('should create EKS nodes security group', () => {
      expect(has(/resource\s+"aws_security_group"\s+"eks_nodes"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\$\{var\.cluster_name\}-nodes-sg"/)).toBe(true);
      expect(has(/"kubernetes\.io\/cluster\/\$\{var\.cluster_name\}"\s*=\s*"owned"/)).toBe(true);
    });

    it('should configure cluster security group rules', () => {
      expect(has(/resource\s+"aws_security_group_rule"\s+"eks_cluster_ingress_nodes"/)).toBe(true);
      expect(has(/resource\s+"aws_security_group_rule"\s+"eks_cluster_egress"/)).toBe(true);
      expect(has(/from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/)).toBe(true);
    });

    it('should configure nodes security group rules for inter-node communication', () => {
      expect(has(/resource\s+"aws_security_group_rule"\s+"eks_nodes_ingress_self"\s*{[\s\S]*?self\s*=\s*true/)).toBe(true);
      expect(has(/resource\s+"aws_security_group_rule"\s+"eks_nodes_ingress_cluster"/)).toBe(true);
      expect(has(/resource\s+"aws_security_group_rule"\s+"eks_nodes_ingress_https"/)).toBe(true);
      expect(has(/resource\s+"aws_security_group_rule"\s+"eks_nodes_egress"/)).toBe(true);
    });

    it('should create ALB security group', () => {
      expect(has(/resource\s+"aws_security_group"\s+"alb"\s*{/)).toBe(true);
      expect(has(/ingress\s*{[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/)).toBe(true);
      expect(has(/ingress\s*{[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/)).toBe(true);
    });

    it('should allow ALB to communicate with nodes on NodePort range', () => {
      expect(has(/resource\s+"aws_security_group_rule"\s+"nodes_ingress_alb"\s*{[\s\S]*?from_port\s*=\s*30000[\s\S]*?to_port\s*=\s*32767/)).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create IAM role for EKS cluster', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"eks_cluster"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\$\{var\.cluster_name\}-cluster-role-new"/)).toBe(true);
      expect(has(/Service\s*=\s*"eks\.amazonaws\.com"/)).toBe(true);
    });

    it('should attach required policies to EKS cluster role', () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_cluster_policy"\s*{[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonEKSClusterPolicy"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_service_policy"\s*{[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonEKSServicePolicy"/)).toBe(true);
    });

    it('should create IAM role for EKS node groups', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"eks_nodes"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\$\{var\.cluster_name\}-node-role-new"/)).toBe(true);
      expect(has(/Service\s*=\s*"ec2\.amazonaws\.com"/)).toBe(true);
    });

    it('should attach required policies to EKS nodes role', () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_nodes_policy"\s*{[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonEKSWorkerNodePolicy"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_nodes_cni_policy"\s*{[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonEKS_CNI_Policy"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_nodes_registry_policy"\s*{[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonEC2ContainerRegistryReadOnly"/)).toBe(true);
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"eks_nodes_ssm_policy"\s*{[\s\S]*?policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/)).toBe(true);
    });
  });

  describe('KMS Encryption', () => {
    it('should create KMS key for EKS encryption', () => {
      expect(has(/resource\s+"aws_kms_key"\s+"eks"\s*{/)).toBe(true);
      expect(has(/description\s*=\s*"KMS key for EKS cluster/)).toBe(true);
      expect(has(/deletion_window_in_days\s*=\s*10/)).toBe(true);
      expect(has(/enable_key_rotation\s*=\s*true/)).toBe(true);
    });

    it('should configure KMS key policy for CloudWatch Logs', () => {
      expect(has(/Allow CloudWatch Logs to use the key/)).toBe(true);
      expect(has(/Service\s*=\s*"logs\.\$\{var\.aws_region\}\.amazonaws\.com"/)).toBe(true);
    });

    it('should configure KMS key policy for EC2 and EBS', () => {
      expect(has(/Allow EC2 to use the key for EBS/)).toBe(true);
      expect(has(/Service\s*=\s*"ec2\.amazonaws\.com"/)).toBe(true);
    });

    it('should configure KMS key policy for EKS nodes', () => {
      expect(has(/Allow EKS nodes to use the key/)).toBe(true);
      expect(has(/AWS\s*=\s*aws_iam_role\.eks_nodes\.arn/)).toBe(true);
    });

    it('should create KMS key alias', () => {
      expect(has(/resource\s+"aws_kms_alias"\s+"eks"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"alias\/\$\{var\.cluster_name\}-eks-new"/)).toBe(true);
      expect(has(/target_key_id\s*=\s*aws_kms_key\.eks\.key_id/)).toBe(true);
    });
  });

  describe('CloudWatch Logging', () => {
    it('should create CloudWatch log group for EKS cluster', () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"eks"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\/aws\/eks\/\$\{var\.cluster_name\}\/cluster-new"/)).toBe(true);
      expect(has(/retention_in_days\s*=\s*30/)).toBe(true);
      expect(has(/kms_key_id\s*=\s*aws_kms_key\.eks\.arn/)).toBe(true);
    });
  });

  describe('EKS Cluster Configuration', () => {
    it('should create EKS cluster with proper configuration', () => {
      expect(has(/resource\s+"aws_eks_cluster"\s+"main"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*var\.cluster_name/)).toBe(true);
      expect(has(/role_arn\s*=\s*aws_iam_role\.eks_cluster\.arn/)).toBe(true);
    });

    it('should configure VPC settings for EKS cluster', () => {
      expect(has(/vpc_config\s*{/)).toBe(true);
      expect(has(/endpoint_private_access\s*=\s*true/)).toBe(true);
      expect(has(/endpoint_public_access\s*=\s*false/)).toBe(true);
    });

    it('should enable encryption for EKS secrets', () => {
      expect(has(/encryption_config\s*{[\s\S]*?provider\s*{[\s\S]*?key_arn\s*=\s*aws_kms_key\.eks\.arn/)).toBe(true);
    });

    it('should enable all cluster log types', () => {
      expect(has(/"api"/)).toBe(true);
      expect(has(/"audit"/)).toBe(true);
      expect(has(/"authenticator"/)).toBe(true);
      expect(has(/"controllerManager"/)).toBe(true);
      expect(has(/"scheduler"/)).toBe(true);
    });

    it('should have proper dependencies for EKS cluster', () => {
      expect(has(/aws_iam_role_policy_attachment\.eks_service_policy/)).toBe(true);
      expect(has(/aws_cloudwatch_log_group\.eks/)).toBe(true);
    });
  });

  describe('Launch Templates', () => {
    it('should create launch template for x86 nodes', () => {
      expect(has(/resource\s+"aws_launch_template"\s+"x86_nodes"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.cluster_name\}-x86-"/)).toBe(true);
      expect(has(/description\s*=\s*"Launch template for x86 EKS nodes"/)).toBe(true);
    });

    it('should create launch template for ARM64 nodes', () => {
      expect(has(/resource\s+"aws_launch_template"\s+"arm64_nodes"\s*{/)).toBe(true);
      expect(has(/name_prefix\s*=\s*"\$\{var\.cluster_name\}-arm64-"/)).toBe(true);
      expect(has(/description\s*=\s*"Launch template for ARM64 EKS nodes"/)).toBe(true);
    });

    it('should configure encrypted EBS volumes in launch templates', () => {
      expect(has(/block_device_mappings\s*{[\s\S]*?device_name\s*=\s*"\/dev\/xvda"/)).toBe(true);
      expect(has(/volume_size\s*=\s*100/)).toBe(true);
      expect(has(/volume_type\s*=\s*"gp3"/)).toBe(true);
      expect(has(/iops\s*=\s*3000/)).toBe(true);
      expect(has(/throughput\s*=\s*125/)).toBe(true);
      expect(has(/encrypted\s*=\s*true/)).toBe(true);
      expect(has(/delete_on_termination\s*=\s*true/)).toBe(true);
    });

    it('should enable IMDSv2 in launch templates', () => {
      expect(has(/metadata_options\s*{[\s\S]*?http_endpoint\s*=\s*"enabled"/)).toBe(true);
      expect(has(/http_tokens\s*=\s*"required"/)).toBe(true);
      expect(has(/http_put_response_hop_limit\s*=\s*2/)).toBe(true);
      expect(has(/instance_metadata_tags\s*=\s*"enabled"/)).toBe(true);
    });

    it('should enable monitoring in launch templates', () => {
      expect(has(/monitoring\s*{[\s\S]*?enabled\s*=\s*true/)).toBe(true);
    });

    it('should configure tag specifications for instances and volumes', () => {
      expect(has(/tag_specifications\s*{[\s\S]*?resource_type\s*=\s*"instance"/)).toBe(true);
      expect(has(/tag_specifications\s*{[\s\S]*?resource_type\s*=\s*"volume"/)).toBe(true);
      expect(has(/Architecture\s*=\s*"x86_64"/)).toBe(true);
      expect(has(/Architecture\s*=\s*"arm64"/)).toBe(true);
    });
  });

  describe('EKS Node Groups', () => {
    it('should create x86 node group with proper configuration', () => {
      expect(has(/resource\s+"aws_eks_node_group"\s+"x86"\s*{/)).toBe(true);
      expect(has(/cluster_name\s*=\s*aws_eks_cluster\.main\.name/)).toBe(true);
      expect(has(/node_group_name\s*=\s*"\$\{var\.cluster_name\}-x86-nodes"/)).toBe(true);
      expect(has(/node_role_arn\s*=\s*aws_iam_role\.eks_nodes\.arn/)).toBe(true);
    });

    it('should configure x86 node group instance types and AMI', () => {
      expect(has(/capacity_type\s*=\s*"ON_DEMAND"/)).toBe(true);
      expect(has(/ami_type\s*=\s*"AL2023_x86_64_STANDARD"/)).toBe(true);
    });

    it('should create ARM64 node group with proper configuration', () => {
      expect(has(/resource\s+"aws_eks_node_group"\s+"arm64"\s*{/)).toBe(true);
      expect(has(/node_group_name\s*=\s*"\$\{var\.cluster_name\}-arm64-nodes"/)).toBe(true);
      expect(has(/ami_type\s*=\s*"AL2023_ARM_64_STANDARD"/)).toBe(true);
    });

    it('should configure scaling settings for node groups', () => {
      expect(has(/scaling_config\s*{[\s\S]*?desired_size\s*=\s*3/)).toBe(true);
      expect(has(/max_size\s*=\s*10/)).toBe(true);
      expect(has(/min_size\s*=\s*2/)).toBe(true);
    });

    it('should configure update settings for node groups', () => {
      expect(has(/update_config\s*{[\s\S]*?max_unavailable_percentage\s*=\s*33/)).toBe(true);
    });

    it('should apply appropriate labels to node groups', () => {
      expect(has(/labels\s*=\s*{[\s\S]*?architecture\s*=\s*"x86_64"/)).toBe(true);
      expect(has(/labels\s*=\s*{[\s\S]*?architecture\s*=\s*"arm64"/)).toBe(true);
      expect(has(/node-type\s*=\s*"x86"/)).toBe(true);
      expect(has(/node-type\s*=\s*"arm"/)).toBe(true);
    });

    it('should reference launch templates in node groups', () => {
      expect(has(/launch_template\s*{[\s\S]*?id\s*=\s*aws_launch_template\.x86_nodes\.id/)).toBe(true);
      expect(has(/launch_template\s*{[\s\S]*?id\s*=\s*aws_launch_template\.arm64_nodes\.id/)).toBe(true);
      expect(has(/version\s*=\s*aws_launch_template\.x86_nodes\.latest_version/)).toBe(true);
      expect(has(/version\s*=\s*aws_launch_template\.arm64_nodes\.latest_version/)).toBe(true);
    });
  });

  describe('Application Load Balancer', () => {
    it('should create Application Load Balancer', () => {
      expect(has(/resource\s+"aws_lb"\s+"main"\s*{/)).toBe(true);
      expect(has(/name\s*=\s*"\$\{var\.cluster_name\}-alb1"/)).toBe(true);
      expect(has(/internal\s*=\s*false/)).toBe(true);
      expect(has(/load_balancer_type\s*=\s*"application"/)).toBe(true);
    });

    it('should configure ALB with proper settings', () => {
      expect(has(/enable_deletion_protection\s*=\s*false/)).toBe(true);
      expect(has(/enable_http2\s*=\s*true/)).toBe(true);
      expect(has(/enable_cross_zone_load_balancing\s*=\s*true/)).toBe(true);
    });
  });

  describe('Outputs Configuration', () => {
    it('should output cluster endpoint', () => {
      expect(has(/output\s+"cluster_endpoint"\s*{/)).toBe(true);
      expect(has(/value\s*=\s*aws_eks_cluster\.main\.endpoint/)).toBe(true);
      expect(has(/description\s*=\s*"Endpoint for EKS control plane"/)).toBe(true);
    });

    it('should output cluster certificate authority data as sensitive', () => {
      expect(has(/output\s+"cluster_certificate_authority_data"\s*{/)).toBe(true);
      expect(has(/sensitive\s*=\s*true/)).toBe(true);
    });

    it('should output cluster security group ID', () => {
      expect(has(/output\s+"cluster_security_group_id"\s*{/)).toBe(true);
      expect(has(/value\s*=\s*aws_security_group\.eks_cluster\.id/)).toBe(true);
    });

    it('should output cluster name', () => {
      expect(has(/output\s+"cluster_name"\s*{/)).toBe(true);
      expect(has(/value\s*=\s*aws_eks_cluster\.main\.name/)).toBe(true);
    });

    it('should output OIDC issuer URL', () => {
      expect(has(/output\s+"cluster_oidc_issuer_url"\s*{/)).toBe(true);
     });

    it('should output VPC ID', () => {
      expect(has(/output\s+"vpc_id"\s*{/)).toBe(true);
      expect(has(/value\s*=\s*aws_vpc\.main\.id/)).toBe(true);
      expect(has(/description\s*=\s*"ID of the VPC where the cluster is deployed"/)).toBe(true);
    });

    it('should output ALB DNS name', () => {
      expect(has(/output\s+"alb_dns_name"\s*{/)).toBe(true);
      expect(has(/value\s*=\s*aws_lb\.main\.dns_name/)).toBe(true);
      expect(has(/description\s*=\s*"DNS name of the Application Load Balancer"/)).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    it('should include Environment tag', () => {
      expect(has(/Environment\s*=\s*"production"/)).toBe(true);
    });

    it('should include Project tag', () => {
      expect(has(/Project\s*=\s*"platform-migration"/)).toBe(true);
    });

    it('should include Owner tag', () => {
      expect(has(/Owner\s*=\s*"devops-team"/)).toBe(true);
    });

    it('should tag resources with Name tag', () => {
      const nameTagCount = count(/Name\s*=\s*"\$\{var\.cluster_name\}/g);
      expect(nameTagCount).toBeGreaterThan(10);
    });
  });

  describe('Security Best Practices', () => {
    it('should enable encryption at rest for all storage resources', () => {
      const encryptedCount = count(/encrypted\s*=\s*true/g);
      expect(encryptedCount).toBeGreaterThanOrEqual(2);
    });

    it('should enable KMS key rotation', () => {
      expect(has(/enable_key_rotation\s*=\s*true/)).toBe(true);
    });

    it('should use IMDSv2 for EC2 metadata service', () => {
      expect(has(/http_tokens\s*=\s*"required"/)).toBe(true);
    });

    it('should configure private endpoint access for EKS API', () => {
      expect(has(/endpoint_private_access\s*=\s*true/)).toBe(true);
      expect(has(/endpoint_public_access\s*=\s*false/)).toBe(true);
    });

    it('should use specific CIDR blocks for subnets', () => {
      expect(has(/10\.0\.1\.0\/24/)).toBe(true);
      expect(has(/10\.0\.10\.0\/24/)).toBe(true);
    });

    it('should enable CloudWatch logging for EKS cluster', () => {
      const logTypes = count(/"api"|"audit"|"authenticator"|"controllerManager"|"scheduler"/g);
      expect(logTypes).toBe(5);
    });

    it('should configure log retention for CloudWatch logs', () => {
      expect(has(/retention_in_days\s*=\s*30/)).toBe(true);
    });
  });

  describe('High Availability and Resilience', () => {
    it('should deploy resources across multiple availability zones', () => {
      expect(has(/count\s*=\s*3/)).toBe(true);
    });

    it('should create NAT gateways in each AZ for HA', () => {
      expect(has(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?count\s*=\s*3/)).toBe(true);
    });

    it('should configure both x86 and ARM64 node groups', () => {
      expect(has(/resource\s+"aws_eks_node_group"\s+"x86"/)).toBe(true);
      expect(has(/resource\s+"aws_eks_node_group"\s+"arm64"/)).toBe(true);
    });

    it('should configure auto-scaling with appropriate min/max values', () => {
      expect(has(/min_size\s*=\s*2/)).toBe(true);
      expect(has(/max_size\s*=\s*10/)).toBe(true);
    });

    it('should enable cross-zone load balancing for ALB', () => {
      expect(has(/enable_cross_zone_load_balancing\s*=\s*true/)).toBe(true);
    });

    it('should configure max_unavailable_percentage for rolling updates', () => {
      expect(has(/max_unavailable_percentage\s*=\s*33/)).toBe(true);
    });
  });

  describe('Network Architecture', () => {
    it('should separate public and private subnets', () => {
      expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
    });

    it('should configure proper CIDR blocks for network segmentation', () => {
      expect(has(/"10\.0\.1\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.2\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.3\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.10\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.11\.0\/24"/)).toBe(true);
      expect(has(/"10\.0\.12\.0\/24"/)).toBe(true);
    });

    it('should configure route tables for all subnet types', () => {
      expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
      expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    });
  });

  describe('Compliance and Dependencies', () => {
    it('should use latest Amazon Linux 2023 AMI for nodes', () => {
      expect(has(/AL2023_x86_64_STANDARD/)).toBe(true);
      expect(has(/AL2023_ARM_64_STANDARD/)).toBe(true);
    });

    it('should configure all required EKS addons policies', () => {
      expect(has(/AmazonEKSWorkerNodePolicy/)).toBe(true);
      expect(has(/AmazonEKS_CNI_Policy/)).toBe(true);
      expect(has(/AmazonEC2ContainerRegistryReadOnly/)).toBe(true);
      expect(has(/AmazonSSMManagedInstanceCore/)).toBe(true);
    });
  });
})
});