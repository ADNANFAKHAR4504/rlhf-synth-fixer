/**
 * Integration tests for EKS infrastructure
 * These tests validate the EKS cluster and associated resources
 */

import * as fs from 'fs';
import * as path from 'path';

describe('EKS Infrastructure Integration Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');

  describe('Terraform Configuration Files', () => {
    test('should have all required EKS Terraform files', () => {
      const requiredFiles = [
        'eks-cluster.tf',
        'eks-node-groups.tf',
        'eks-addons.tf',
        'vpc.tf',
        'security-groups.tf',
        'iam-eks-cluster.tf',
        'iam-node-groups.tf',
        'iam-irsa.tf',
        'cloudwatch.tf',
        'variables.tf',
        'outputs.tf',
        'provider.tf',
        'terraform.tfvars'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have kubernetes manifests directory', () => {
      const manifestsPath = path.join(libPath, 'kubernetes-manifests');
      expect(fs.existsSync(manifestsPath)).toBe(true);
      expect(fs.statSync(manifestsPath).isDirectory()).toBe(true);
    });

    test('should have userdata directory for node initialization', () => {
      const userdataPath = path.join(libPath, 'userdata');
      expect(fs.existsSync(userdataPath)).toBe(true);
      expect(fs.statSync(userdataPath).isDirectory()).toBe(true);
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should define EKS cluster resource', () => {
      const eksClusterPath = path.join(libPath, 'eks-cluster.tf');
      const content = fs.readFileSync(eksClusterPath, 'utf-8');

      expect(content).toContain('resource "aws_eks_cluster"');
      expect(content).toContain('vpc_config');
      expect(content).toContain('enabled_cluster_log_types');
    });

    test('should configure EKS node groups', () => {
      const nodeGroupsPath = path.join(libPath, 'eks-node-groups.tf');
      const content = fs.readFileSync(nodeGroupsPath, 'utf-8');

      expect(content).toContain('resource "aws_eks_node_group"');
      expect(content).toContain('scaling_config');
      expect(content).toContain('desired_size');
      expect(content).toContain('max_size');
      expect(content).toContain('min_size');
    });

    test('should configure EKS addons', () => {
      const addonsPath = path.join(libPath, 'eks-addons.tf');
      const content = fs.readFileSync(addonsPath, 'utf-8');

      expect(content).toContain('resource "aws_eks_addon"');
      // Common EKS addons
      expect(content.toLowerCase()).toMatch(/vpc-cni|kube-proxy|coredns/);
    });
  });

  describe('VPC Configuration', () => {
    test('should configure VPC with proper CIDR blocks', () => {
      const vpcPath = path.join(libPath, 'vpc.tf');
      const content = fs.readFileSync(vpcPath, 'utf-8');

      expect(content).toContain('resource "aws_vpc"');
      expect(content).toContain('cidr_block');
      expect(content).toContain('enable_dns_support');
      expect(content).toContain('enable_dns_hostnames');
    });

    test('should configure public and private subnets', () => {
      const vpcPath = path.join(libPath, 'vpc.tf');
      const content = fs.readFileSync(vpcPath, 'utf-8');

      expect(content).toContain('resource "aws_subnet"');
      expect(content).toMatch(/public.*subnet|subnet.*public/i);
      expect(content).toMatch(/private.*subnet|subnet.*private/i);
    });

    test('should configure internet and NAT gateways', () => {
      const vpcPath = path.join(libPath, 'vpc.tf');
      const content = fs.readFileSync(vpcPath, 'utf-8');

      expect(content).toContain('resource "aws_internet_gateway"');
      expect(content).toContain('resource "aws_nat_gateway"');
      expect(content).toContain('resource "aws_eip"');
    });
  });

  describe('IAM Configuration', () => {
    test('should configure EKS cluster IAM role', () => {
      const iamPath = path.join(libPath, 'iam-eks-cluster.tf');
      const content = fs.readFileSync(iamPath, 'utf-8');

      expect(content).toContain('resource "aws_iam_role"');
      expect(content).toContain('eks.amazonaws.com');
      expect(content).toContain('AmazonEKSClusterPolicy');
    });

    test('should configure node group IAM roles', () => {
      const iamPath = path.join(libPath, 'iam-node-groups.tf');
      const content = fs.readFileSync(iamPath, 'utf-8');

      expect(content).toContain('resource "aws_iam_role"');
      expect(content).toContain('ec2.amazonaws.com');
      expect(content).toContain('AmazonEKSWorkerNodePolicy');
      expect(content).toContain('AmazonEKS_CNI_Policy');
    });

    test('should configure IRSA (IAM Roles for Service Accounts)', () => {
      const irsaPath = path.join(libPath, 'iam-irsa.tf');
      const content = fs.readFileSync(irsaPath, 'utf-8');

      expect(content).toContain('oidc');
      expect(content).toMatch(/resource.*iam.*role|data.*iam.*policy/);
    });
  });

  describe('Security Groups', () => {
    test('should configure cluster security groups', () => {
      const sgPath = path.join(libPath, 'security-groups.tf');
      const content = fs.readFileSync(sgPath, 'utf-8');

      expect(content).toContain('resource "aws_security_group"');
      expect(content).toContain('ingress');
      expect(content).toContain('egress');
      expect(content).toMatch(/cluster.*security.*group|security.*group.*cluster/i);
    });

    test('should allow HTTPS traffic', () => {
      const sgPath = path.join(libPath, 'security-groups.tf');
      const content = fs.readFileSync(sgPath, 'utf-8');

      expect(content).toContain('443');
      expect(content).toContain('from_port');
      expect(content).toContain('to_port');
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should configure CloudWatch log groups', () => {
      const cwPath = path.join(libPath, 'cloudwatch.tf');
      const content = fs.readFileSync(cwPath, 'utf-8');

      expect(content).toContain('resource "aws_cloudwatch_log_group"');
      expect(content).toContain('retention_in_days');
      expect(content).toMatch(/eks|cluster/i);
    });

    test('should configure log streams or metrics', () => {
      const cwPath = path.join(libPath, 'cloudwatch.tf');
      const content = fs.readFileSync(cwPath, 'utf-8');

      // Check for either log streams or metric configurations
      const hasLogStreams = content.includes('aws_cloudwatch_log_stream');
      const hasMetrics = content.includes('aws_cloudwatch_metric');
      const hasAlarms = content.includes('aws_cloudwatch_metric_alarm');

      expect(hasLogStreams || hasMetrics || hasAlarms).toBe(true);
    });
  });

  describe('Variables and Outputs', () => {
    test('should define required variables', () => {
      const varsPath = path.join(libPath, 'variables.tf');
      const content = fs.readFileSync(varsPath, 'utf-8');

      // Common EKS variables
      expect(content).toContain('variable');
      expect(content).toMatch(/cluster.*name|eks.*name/i);
      expect(content).toMatch(/region|aws.*region/i);
      expect(content).toMatch(/vpc.*cidr|cidr.*block/i);
    });

    test('should define outputs for cluster access', () => {
      const outputsPath = path.join(libPath, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf-8');

      expect(content).toContain('output');
      expect(content).toMatch(/cluster.*endpoint|endpoint/i);
      expect(content).toMatch(/cluster.*name|eks.*name/i);
      expect(content).toMatch(/certificate|kubeconfig/i);
    });

    test('should have terraform.tfvars with configurations', () => {
      const tfvarsPath = path.join(libPath, 'terraform.tfvars');
      const content = fs.readFileSync(tfvarsPath, 'utf-8');

      // Should have some variable assignments
      expect(content.length).toBeGreaterThan(10);
      expect(content).toMatch(/=|{|}|\[|\]/); // Has assignment operators or structures
    });
  });

  describe('Provider Configuration', () => {
    test('should configure AWS provider', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf-8');

      expect(content).toContain('provider "aws"');
      expect(content).toMatch(/region|profile/);
    });

    test('should configure Terraform version requirements', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf-8');

      expect(content).toContain('terraform');
      expect(content).toContain('required_version');
    });

    test('should specify required providers', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf-8');

      expect(content).toContain('required_providers');
      expect(content).toContain('aws');
      expect(content).toMatch(/source.*hashicorp\/aws/);
    });
  });

  describe('Documentation Files', () => {
    test('should have PROMPT.md documentation', () => {
      const promptPath = path.join(libPath, 'PROMPT.md');
      expect(fs.existsSync(promptPath)).toBe(true);

      const content = fs.readFileSync(promptPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
      expect(content).toMatch(/eks|kubernetes|cluster/i);
    });

    test('should have MODEL_RESPONSE.md file', () => {
      const responsePath = path.join(libPath, 'MODEL_RESPONSE.md');
      expect(fs.existsSync(responsePath)).toBe(true);

      const content = fs.readFileSync(responsePath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });

    test('should have IDEAL_RESPONSE.md file', () => {
      const idealPath = path.join(libPath, 'IDEAL_RESPONSE.md');
      expect(fs.existsSync(idealPath)).toBe(true);

      const content = fs.readFileSync(idealPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });
  });

  describe('AWS Region Configuration', () => {
    test('should have AWS_REGION file', () => {
      const regionPath = path.join(libPath, 'AWS_REGION');
      expect(fs.existsSync(regionPath)).toBe(true);

      const content = fs.readFileSync(regionPath, 'utf-8').trim();
      // Should be a valid AWS region format
      expect(content).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    });
  });
});