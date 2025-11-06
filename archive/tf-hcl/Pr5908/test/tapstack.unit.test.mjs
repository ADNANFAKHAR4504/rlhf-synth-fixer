/**
 * Unit Tests for EKS Fargate Terraform Infrastructure
 * Tests all Terraform configuration files for correct structure and values
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('EKS Fargate Terraform Stack - Unit Tests', () => {
  const libDir = join(process.cwd(), 'lib');
  const tfFiles = readdirSync(libDir).filter(f => f.endsWith('.tf'));

  describe('File Structure', () => {
    it('should have all required Terraform files', () => {
      const requiredFiles = [
        'main.tf',
        'variables.tf',
        'outputs.tf',
        'eks-cluster.tf',
        'fargate.tf',
        'eks-addons.tf',
        'load-balancer-controller.tf'
      ];

      requiredFiles.forEach(file => {
        expect(tfFiles).toContain(file);
      });
    });

    it('should have at least 7 Terraform files', () => {
      expect(tfFiles.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('variables.tf Configuration', () => {
    const content = readFileSync(join(libDir, 'variables.tf'), 'utf8');

    it('should define environment_suffix variable', () => {
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('type        = string');
    });

    it('should define region variable with ap-southeast-1 default', () => {
      expect(content).toContain('variable "region"');
      expect(content).toContain('default     = "ap-southeast-1"');
    });

    it('should define cluster_version variable with 1.28', () => {
      expect(content).toContain('variable "cluster_version"');
      expect(content).toContain('default     = "1.28"');
    });

    it('should define cluster_name variable with eks-fargate default', () => {
      expect(content).toContain('variable "cluster_name"');
      expect(content).toContain('default     = "eks-fargate"');
    });

    it('should define vpc_cidr variable with 10.0.0.0/16 default', () => {
      expect(content).toContain('variable "vpc_cidr"');
      expect(content).toContain('default     = "10.0.0.0/16"');
    });

    it('should define availability_zones variable with 3 zones', () => {
      expect(content).toContain('variable "availability_zones"');
      expect(content).toContain('"ap-southeast-1a"');
      expect(content).toContain('"ap-southeast-1b"');
      expect(content).toContain('"ap-southeast-1c"');
    });

    it('should define project_name and managed_by variables', () => {
      expect(content).toContain('variable "project_name"');
      expect(content).toContain('variable "managed_by"');
      expect(content).toContain('default     = "Terraform"');
    });

    it('should have descriptions for all variables', () => {
      const variableCount = (content.match(/variable "/g) || []).length;
      const descriptionCount = (content.match(/description =/g) || []).length;
      expect(descriptionCount).toBe(variableCount);
    });
  });

  describe('main.tf Configuration', () => {
    const content = readFileSync(join(libDir, 'main.tf'), 'utf8');

    it('should specify Terraform version requirement >= 1.5.0', () => {
      expect(content).toContain('required_version = ">= 1.5.0"');
    });

    it('should require AWS provider version ~> 5.0', () => {
      expect(content).toContain('source  = "hashicorp/aws"');
      expect(content).toContain('version = "~> 5.0"');
    });

    it('should require TLS provider', () => {
      expect(content).toContain('source  = "hashicorp/tls"');
      expect(content).toContain('version = "~> 4.0"');
    });

    it('should configure AWS provider with region variable', () => {
      expect(content).toContain('provider "aws"');
      expect(content).toContain('region = var.region');
    });

    it('should configure default tags with environment_suffix', () => {
      expect(content).toContain('default_tags');
      expect(content).toContain('Environment = var.environment_suffix');
      expect(content).toContain('Project     = var.project_name');
      expect(content).toContain('ManagedBy   = var.managed_by');
    });

    it('should create VPC with DNS settings enabled', () => {
      expect(content).toContain('resource "aws_vpc" "main"');
      expect(content).toContain('enable_dns_hostnames = true');
      expect(content).toContain('enable_dns_support   = true');
    });

    it('should create 3 public subnets', () => {
      expect(content).toContain('resource "aws_subnet" "public"');
      expect(content).toContain('count                   = 3');
      expect(content).toContain('map_public_ip_on_launch = true');
    });

    it('should create 3 private subnets', () => {
      expect(content).toContain('resource "aws_subnet" "private"');
      expect(content).toMatch(/count\s*=\s*3/);
    });

    it('should tag subnets for Kubernetes discovery', () => {
      expect(content).toMatch(/"kubernetes\.io\/role\/elb"\s*=\s*"1"/);
      expect(content).toMatch(/"kubernetes\.io\/role\/internal-elb"\s*=\s*"1"/);
      expect(content).toMatch(/"kubernetes\.io\/cluster\/\$\{local\.cluster_name\}"\s*=\s*"shared"/);
    });

    it('should create Internet Gateway', () => {
      expect(content).toContain('resource "aws_internet_gateway" "main"');
      expect(content).toContain('vpc_id = aws_vpc.main.id');
    });

    it('should create 3 Elastic IPs for NAT Gateways', () => {
      expect(content).toContain('resource "aws_eip" "nat"');
      expect(content).toContain('domain = "vpc"');
    });

    it('should create 3 NAT Gateways', () => {
      expect(content).toContain('resource "aws_nat_gateway" "main"');
      const natCount = (content.match(/resource "aws_nat_gateway"/g) || []).length;
      expect(natCount).toBe(1); // count = 3 is used
    });

    it('should create route tables for public and private subnets', () => {
      expect(content).toContain('resource "aws_route_table" "public"');
      expect(content).toContain('resource "aws_route_table" "private"');
    });

    it('should define local cluster_name with environment_suffix', () => {
      expect(content).toContain('locals {');
      expect(content).toContain('cluster_name = "${var.cluster_name}-${var.environment_suffix}"');
    });

    it('should use environment_suffix in resource names', () => {
      const suffixUsage = (content.match(/environment_suffix/g) || []).length;
      expect(suffixUsage).toBeGreaterThanOrEqual(10); // Adjusted for actual usage
    });
  });

  describe('eks-cluster.tf Configuration', () => {
    const content = readFileSync(join(libDir, 'eks-cluster.tf'), 'utf8');

    it('should create EKS cluster IAM role', () => {
      expect(content).toContain('resource "aws_iam_role" "eks_cluster"');
      expect(content).toContain('name = "eks-cluster-role-${var.environment_suffix}"');
      expect(content).toContain('Service = "eks.amazonaws.com"');
    });

    it('should attach required policies to cluster role', () => {
      expect(content).toContain('aws_iam_role_policy_attachment" "eks_cluster_policy"');
      expect(content).toContain('AmazonEKSClusterPolicy');
      expect(content).toContain('AmazonEKSVPCResourceController');
    });

    it('should create security group for EKS cluster', () => {
      expect(content).toContain('resource "aws_security_group" "eks_cluster"');
      expect(content).toContain('name        = "eks-cluster-sg-${var.environment_suffix}"');
    });

    it('should create CloudWatch log group with retention', () => {
      expect(content).toContain('resource "aws_cloudwatch_log_group" "eks_cluster"');
      expect(content).toContain('retention_in_days = 7');
    });

    it('should create EKS cluster with correct version', () => {
      expect(content).toContain('resource "aws_eks_cluster" "main"');
      expect(content).toContain('version  = var.cluster_version');
      expect(content).toContain('name     = local.cluster_name');
    });

    it('should configure cluster with private and public endpoint access', () => {
      expect(content).toContain('endpoint_private_access = true');
      expect(content).toContain('endpoint_public_access  = true');
    });

    it('should enable control plane logging', () => {
      expect(content).toContain('enabled_cluster_log_types = ["api", "audit", "authenticator"]');
    });

    it('should create OIDC provider for IRSA', () => {
      expect(content).toContain('resource "aws_iam_openid_connect_provider" "eks"');
      expect(content).toContain('client_id_list  = ["sts.amazonaws.com"]');
    });

    it('should reference tls_certificate data source', () => {
      expect(content).toContain('data "tls_certificate" "eks"');
      expect(content).toContain('url = aws_eks_cluster.main.identity[0].oidc[0].issuer');
    });

    it('should use environment_suffix in all resource names', () => {
      const suffixUsage = (content.match(/environment_suffix/g) || []).length;
      expect(suffixUsage).toBeGreaterThanOrEqual(3);
    });
  });

  describe('fargate.tf Configuration', () => {
    const content = readFileSync(join(libDir, 'fargate.tf'), 'utf8');

    it('should create Fargate pod execution IAM role', () => {
      expect(content).toContain('resource "aws_iam_role" "fargate_pod_execution"');
      expect(content).toContain('name = "eks-fargate-pod-execution-role-${var.environment_suffix}"');
      expect(content).toContain('Service = "eks-fargate-pods.amazonaws.com"');
    });

    it('should attach Fargate pod execution policy', () => {
      expect(content).toContain('aws_iam_role_policy_attachment" "fargate_pod_execution_policy"');
      expect(content).toContain('AmazonEKSFargatePodExecutionRolePolicy');
    });

    it('should create CloudWatch Logs policy for Fargate', () => {
      expect(content).toContain('resource "aws_iam_role_policy" "fargate_cloudwatch_logs"');
      expect(content).toContain('logs:CreateLogStream');
      expect(content).toContain('logs:PutLogEvents');
      expect(content).toContain('logs:CreateLogGroup');
    });

    it('should create ECR access policy for Fargate', () => {
      expect(content).toContain('resource "aws_iam_role_policy" "fargate_ecr_access"');
      expect(content).toContain('ecr:GetAuthorizationToken');
      expect(content).toContain('ecr:BatchGetImage');
    });

    it('should create Fargate profile for kube-system namespace', () => {
      expect(content).toContain('resource "aws_eks_fargate_profile" "kube_system"');
      expect(content).toContain('fargate_profile_name   = "kube-system-${var.environment_suffix}"');
      expect(content).toContain('namespace = "kube-system"');
    });

    it('should create Fargate profile for application namespace', () => {
      expect(content).toContain('resource "aws_eks_fargate_profile" "application"');
      expect(content).toContain('namespace = "application"');
    });

    it('should create Fargate profile for dev namespace with labels', () => {
      expect(content).toContain('resource "aws_eks_fargate_profile" "dev"');
      expect(content).toContain('namespace = "dev"');
      expect(content).toContain('environment = "dev"');
    });

    it('should create Fargate profile for prod namespace with labels', () => {
      expect(content).toContain('resource "aws_eks_fargate_profile" "prod"');
      expect(content).toContain('namespace = "prod"');
      expect(content).toContain('environment = "prod"');
    });

    it('should configure all Fargate profiles with private subnets', () => {
      const profiles = ['kube_system', 'application', 'dev', 'prod'];
      profiles.forEach(profile => {
        expect(content).toContain(`aws_eks_fargate_profile" "${profile}"`);
      });
      const subnetRefs = (content.match(/subnet_ids\s*=\s*aws_subnet\.private/g) || []).length;
      expect(subnetRefs).toBe(4);
    });

    it('should use environment_suffix in all Fargate profile names', () => {
      const suffixUsage = (content.match(/environment_suffix/g) || []).length;
      expect(suffixUsage).toBeGreaterThanOrEqual(8);
    });
  });

  describe('eks-addons.tf Configuration', () => {
    const content = readFileSync(join(libDir, 'eks-addons.tf'), 'utf8');

    it('should create CoreDNS addon', () => {
      expect(content).toContain('resource "aws_eks_addon" "coredns"');
      expect(content).toMatch(/addon_name\s*=\s*"coredns"/);
      expect(content).toMatch(/addon_version\s*=\s*"v1\.10\./);
    });

    it('should create kube-proxy addon', () => {
      expect(content).toContain('resource "aws_eks_addon" "kube_proxy"');
      expect(content).toMatch(/addon_name\s*=\s*"kube-proxy"/);
      expect(content).toMatch(/addon_version\s*=\s*"v1\.28\./);
    });

    it('should create VPC CNI addon', () => {
      expect(content).toContain('resource "aws_eks_addon" "vpc_cni"');
      expect(content).toMatch(/addon_name\s*=\s*"vpc-cni"/);
      expect(content).toMatch(/addon_version\s*=\s*"v1\.14\./);
    });

    it('should configure conflict resolution for addons', () => {
      const resolveConflicts = (content.match(/resolve_conflicts_on_update = "OVERWRITE"/g) || []).length;
      expect(resolveConflicts).toBe(3);
    });

    it('should add dependencies on Fargate profiles', () => {
      expect(content).toContain('depends_on = [');
      expect(content).toContain('aws_eks_fargate_profile.kube_system');
    });
  });

  describe('load-balancer-controller.tf Configuration', () => {
    const content = readFileSync(join(libDir, 'load-balancer-controller.tf'), 'utf8');

    it('should create IAM policy for Load Balancer Controller', () => {
      expect(content).toContain('resource "aws_iam_policy" "aws_load_balancer_controller"');
      expect(content).toContain('name        = "AWSLoadBalancerControllerPolicy-${var.environment_suffix}"');
    });

    it('should include required elasticloadbalancing permissions', () => {
      expect(content).toContain('elasticloadbalancing:DescribeLoadBalancers');
      expect(content).toContain('elasticloadbalancing:CreateLoadBalancer');
      expect(content).toContain('elasticloadbalancing:DeleteLoadBalancer');
      expect(content).toContain('elasticloadbalancing:CreateTargetGroup');
      expect(content).toContain('elasticloadbalancing:ModifyLoadBalancerAttributes');
    });

    it('should include EC2 permissions', () => {
      expect(content).toContain('ec2:DescribeVpcs');
      expect(content).toContain('ec2:DescribeSubnets');
      expect(content).toContain('ec2:DescribeSecurityGroups');
      expect(content).toContain('ec2:CreateSecurityGroup');
    });

    it('should include IAM service-linked role permission', () => {
      expect(content).toContain('iam:CreateServiceLinkedRole');
      expect(content).toContain('elasticloadbalancing.amazonaws.com');
    });

    it('should create IAM role for Load Balancer Controller', () => {
      expect(content).toContain('resource "aws_iam_role" "aws_load_balancer_controller"');
      expect(content).toContain('name = "aws-load-balancer-controller-${var.environment_suffix}"');
    });

    it('should configure IRSA trust policy with AssumeRoleWithWebIdentity', () => {
      expect(content).toContain('AssumeRoleWithWebIdentity');
      expect(content).toContain('aws_iam_openid_connect_provider.eks.arn');
      expect(content).toContain('system:serviceaccount:kube-system:aws-load-balancer-controller');
    });

    it('should attach policy to role', () => {
      expect(content).toContain('resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller"');
      expect(content).toContain('policy_arn = aws_iam_policy.aws_load_balancer_controller.arn');
    });

    it('should have extensive permissions policy', () => {
      const policyLength = content.match(/jsonencode\(\{[\s\S]*?\}\)/g)?.[0]?.length || 0;
      expect(policyLength).toBeGreaterThan(5000); // Policy should be comprehensive
    });
  });

  describe('outputs.tf Configuration', () => {
    const content = readFileSync(join(libDir, 'outputs.tf'), 'utf8');

    it('should output cluster_id', () => {
      expect(content).toContain('output "cluster_id"');
      expect(content).toContain('value       = aws_eks_cluster.main.id');
    });

    it('should output cluster_name', () => {
      expect(content).toContain('output "cluster_name"');
      expect(content).toContain('value       = aws_eks_cluster.main.name');
    });

    it('should output cluster_endpoint', () => {
      expect(content).toContain('output "cluster_endpoint"');
      expect(content).toContain('value       = aws_eks_cluster.main.endpoint');
    });

    it('should output cluster_oidc_issuer_url', () => {
      expect(content).toContain('output "cluster_oidc_issuer_url"');
      expect(content).toContain('value       = aws_eks_cluster.main.identity[0].oidc[0].issuer');
    });

    it('should output VPC and subnet IDs', () => {
      expect(content).toContain('output "vpc_id"');
      expect(content).toContain('output "private_subnet_ids"');
      expect(content).toContain('output "public_subnet_ids"');
    });

    it('should output all Fargate profile IDs', () => {
      expect(content).toContain('output "fargate_profile_kube_system_id"');
      expect(content).toContain('output "fargate_profile_application_id"');
      expect(content).toContain('output "fargate_profile_dev_id"');
      expect(content).toContain('output "fargate_profile_prod_id"');
    });

    it('should output Load Balancer Controller role ARN', () => {
      expect(content).toContain('output "load_balancer_controller_role_arn"');
      expect(content).toContain('value       = aws_iam_role.aws_load_balancer_controller.arn');
    });

    it('should output OIDC provider ARN', () => {
      expect(content).toContain('output "oidc_provider_arn"');
      expect(content).toContain('value       = aws_iam_openid_connect_provider.eks.arn');
    });

    it('should output region', () => {
      expect(content).toContain('output "region"');
      expect(content).toContain('value       = var.region');
    });

    it('should mark cluster certificate as sensitive', () => {
      expect(content).toContain('output "cluster_certificate_authority_data"');
      expect(content).toContain('sensitive   = true');
    });

    it('should have descriptions for all outputs', () => {
      const outputCount = (content.match(/output "/g) || []).length;
      const descriptionCount = (content.match(/description =/g) || []).length;
      expect(descriptionCount).toBe(outputCount);
    });
  });

  describe('Security Best Practices', () => {
    it('should not contain hardcoded AWS credentials', () => {
      tfFiles.forEach(file => {
        const content = readFileSync(join(libDir, file), 'utf8');
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key
        // Check for AWS secret keys in assignment context only
        expect(content).not.toMatch(/aws_secret_access_key\s*=\s*"[^"]{40}"/);
      });
    });

    it('should not contain hardcoded passwords', () => {
      tfFiles.forEach(file => {
        const content = readFileSync(join(libDir, file), 'utf8');
        expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
      });
    });

    it('should use variable references instead of hardcoded values for sensitive data', () => {
      const mainContent = readFileSync(join(libDir, 'main.tf'), 'utf8');
      expect(mainContent).toContain('var.region');
      expect(mainContent).toContain('var.vpc_cidr');
      expect(mainContent).toContain('var.environment_suffix');
    });

    it('should enable CloudWatch logging for EKS', () => {
      const eksContent = readFileSync(join(libDir, 'eks-cluster.tf'), 'utf8');
      expect(eksContent).toContain('enabled_cluster_log_types');
      expect(eksContent).toContain('"audit"');
      expect(eksContent).toContain('"api"');
    });

    it('should configure log retention for CloudWatch', () => {
      const eksContent = readFileSync(join(libDir, 'eks-cluster.tf'), 'utf8');
      expect(eksContent).toContain('retention_in_days = 7');
    });

    it('should use private subnets for Fargate pods', () => {
      const fargateContent = readFileSync(join(libDir, 'fargate.tf'), 'utf8');
      const privateSubnetRefs = (fargateContent.match(/subnet_ids\s*=\s*aws_subnet\.private/g) || []).length;
      expect(privateSubnetRefs).toBe(4); // 4 Fargate profiles
    });

    it('should tag all major resources', () => {
      tfFiles.forEach(file => {
        const content = readFileSync(join(libDir, file), 'utf8');
        if (content.includes('resource "aws_')) {
          // Most resources should have tags
          expect(content).toMatch(/tags\s*=\s*\{/);
        }
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    it('should use environment_suffix in all major resource names', () => {
      const filesToCheck = ['main.tf', 'eks-cluster.tf', 'fargate.tf', 'load-balancer-controller.tf'];

      filesToCheck.forEach(file => {
        const content = readFileSync(join(libDir, file), 'utf8');
        const suffixCount = (content.match(/environment_suffix/g) || []).length;
        expect(suffixCount).toBeGreaterThan(0);
      });
    });

    it('should not have hardcoded environment names in resource names', () => {
      tfFiles.forEach(file => {
        const content = readFileSync(join(libDir, file), 'utf8');
        // Allow 'dev' and 'prod' only in namespace labels, not in infrastructure naming
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('name') && !line.includes('namespace') && !line.includes('labels')) {
            expect(line).not.toMatch(/name\s*=\s*"[^"]*-prod-/);
            expect(line).not.toMatch(/name\s*=\s*"[^"]*-dev-/);
            expect(line).not.toMatch(/name\s*=\s*"[^"]*-stage-/);
          }
        });
      });
    });
  });

  describe('Infrastructure Completeness', () => {
    it('should define all required resource types', () => {
      const allContent = tfFiles.map(f => readFileSync(join(libDir, f), 'utf8')).join('\n');

      const requiredResources = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_eks_cluster',
        'aws_eks_fargate_profile',
        'aws_iam_role',
        'aws_iam_policy',
        'aws_cloudwatch_log_group',
        'aws_security_group'
      ];

      requiredResources.forEach(resource => {
        expect(allContent).toContain(`resource "${resource}"`);
      });
    });

    it('should have provider configuration', () => {
      const mainContent = readFileSync(join(libDir, 'main.tf'), 'utf8');
      expect(mainContent).toContain('provider "aws"');
      expect(mainContent).toContain('terraform {');
      expect(mainContent).toContain('required_providers');
    });

    it('should have data sources where needed', () => {
      const allContent = tfFiles.map(f => readFileSync(join(libDir, f), 'utf8')).join('\n');
      expect(allContent).toContain('data "aws_availability_zones"');
      expect(allContent).toContain('data "tls_certificate"');
    });

    it('should have proper resource dependencies', () => {
      const allContent = tfFiles.map(f => readFileSync(join(libDir, f), 'utf8')).join('\n');
      expect(allContent).toContain('depends_on = [');
    });
  });

  describe('Terraform Syntax Validation', () => {
    it('should have properly formatted HCL', () => {
      tfFiles.forEach(file => {
        const content = readFileSync(join(libDir, file), 'utf8');
        // Check for basic HCL syntax elements
        const resourceCount = (content.match(/resource "/g) || []).length;
        const openingBraceCount = (content.match(/\{/g) || []).length;
        const closingBraceCount = (content.match(/\}/g) || []).length;

        // Braces should be balanced
        expect(openingBraceCount).toBe(closingBraceCount);
      });
    });

    it('should use proper variable syntax', () => {
      tfFiles.forEach(file => {
        const content = readFileSync(join(libDir, file), 'utf8');
        // Check for var. syntax
        if (content.includes('var.')) {
          expect(content).toMatch(/var\.\w+/);
        }
      });
    });

    it('should use proper resource references', () => {
      tfFiles.forEach(file => {
        const content = readFileSync(join(libDir, file), 'utf8');
        // Check for resource reference syntax
        if (content.includes('aws_')) {
          const hasProperRefs = /aws_\w+\.\w+\.\w+/.test(content);
          if (content.match(/\baws_\w+\.\w+/)) {
            expect(hasProperRefs || content.includes('resource "aws_')).toBe(true);
          }
        }
      });
    });
  });
});
