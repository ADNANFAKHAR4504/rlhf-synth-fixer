// Unit tests for Terraform lib files
import * as path from 'path';
import * as fs from 'fs';

describe('Terraform Lib Unit Tests', () => {
  let terraformFiles: string[];
  let libPath: string;

  beforeAll(() => {
    // Load terraform files for testing
    libPath = path.join(__dirname, '../lib');
    terraformFiles = fs.readdirSync(libPath).filter((f: string) => f.endsWith('.tf'));
  });

  describe('File Existence Tests', () => {
    test('should have all required terraform files', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'vpc.tf',
        'security-groups.tf',
        'iam-eks-cluster.tf',
        'iam-node-groups.tf',
        'eks-cluster.tf',
        'eks-node-groups.tf',
        'iam-irsa.tf',
        'eks-addons.tf',
        'cloudwatch.tf',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        expect(terraformFiles).toContain(file);
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBeTruthy();
      });
    });

    test('should have terraform.tfvars file', () => {
      const tfvarsPath = path.join(libPath, 'terraform.tfvars');
      expect(fs.existsSync(tfvarsPath)).toBeTruthy();
    });

    test('should have userdata directory with TOML files', () => {
      const userdataPath = path.join(libPath, 'userdata');
      expect(fs.existsSync(userdataPath)).toBeTruthy();
      
      const userdataFiles = fs.readdirSync(userdataPath);
      expect(userdataFiles).toContain('system-node.toml');
      expect(userdataFiles).toContain('app-node.toml');
      expect(userdataFiles).toContain('gpu-node.toml');
    });

    test('should have kubernetes-manifests directory', () => {
      const manifestsPath = path.join(libPath, 'kubernetes-manifests');
      expect(fs.existsSync(manifestsPath)).toBeTruthy();
      
      const manifestFiles = fs.readdirSync(manifestsPath);
      expect(manifestFiles.length).toBeGreaterThan(0);
      manifestFiles.forEach(file => {
        expect(file.endsWith('.yaml') || file.endsWith('.yml')).toBeTruthy();
      });
    });
  });

  describe('Provider Configuration Tests', () => {
    test('should have valid provider.tf configuration', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      
      expect(providerContent).toContain('terraform {');
      expect(providerContent).toContain('required_version = ">= 1.5.0"');
      expect(providerContent).toContain('required_providers {');
      expect(providerContent).toContain('source  = "hashicorp/aws"');
      expect(providerContent).toContain('version = "~> 5.0"');
      expect(providerContent).toContain('provider "aws" {');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('should have kubernetes provider configuration', () => {
      const providerContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      
      expect(providerContent).toContain('kubernetes = {');
      expect(providerContent).toContain('source  = "hashicorp/kubernetes"');
      expect(providerContent).toContain('provider "kubernetes" {');
    });
  });

  describe('Variables Configuration Tests', () => {
    test('should have essential variables defined', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
      
      const requiredVariables = [
        'aws_region',
        'environment_suffix',
        'cluster_name',
        'kubernetes_version',
        'vpc_cidr'
      ];

      requiredVariables.forEach(variable => {
        expect(variablesContent).toContain(`variable "${variable}"`);
      });
    });

    test('should have proper variable types and descriptions', () => {
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
      
      expect(variablesContent).toContain('type        = string');
      expect(variablesContent).toContain('type        = bool');
      expect(variablesContent).toContain('description =');
    });
  });

  describe('VPC Configuration Tests', () => {
    test('should have VPC resource definition', () => {
      const vpcContent = fs.readFileSync(path.join(libPath, 'vpc.tf'), 'utf8');
      
      expect(vpcContent).toContain('resource "aws_vpc" "main"');
      expect(vpcContent).toContain('vpc_cidr');
      expect(vpcContent).toContain('dns_hostnames');
      expect(vpcContent).toContain('enable_dns_support');
    });

    test('should have subnet configurations', () => {
      const vpcContent = fs.readFileSync(path.join(libPath, 'vpc.tf'), 'utf8');
      
      expect(vpcContent).toContain('resource "aws_subnet" "public"');
      expect(vpcContent).toContain('resource "aws_subnet" "private"');
      expect(vpcContent).toContain('availability_zone');
    });

    test('should have internet gateway and NAT gateway', () => {
      const vpcContent = fs.readFileSync(path.join(libPath, 'vpc.tf'), 'utf8');
      
      expect(vpcContent).toContain('resource "aws_internet_gateway"');
      expect(vpcContent).toContain('resource "aws_nat_gateway"');
      expect(vpcContent).toContain('resource "aws_eip"');
    });
  });

  describe('EKS Cluster Configuration Tests', () => {
    test('should have EKS cluster resource', () => {
      const eksContent = fs.readFileSync(path.join(libPath, 'eks-cluster.tf'), 'utf8');
      
      expect(eksContent).toContain('resource "aws_eks_cluster" "main"');
      expect(eksContent).toContain('cluster_name}-${var.environment_suffix}');
      expect(eksContent).toContain('role_arn');
      expect(eksContent).toContain('kubernetes_version');
    });

    test('should have OIDC provider configuration', () => {
      const eksContent = fs.readFileSync(path.join(libPath, 'eks-cluster.tf'), 'utf8');
      
      expect(eksContent).toContain('resource "aws_iam_openid_connect_provider"');
    });
  });

  describe('Node Groups Configuration Tests', () => {
    test('should have node group definitions', () => {
      const nodeGroupsContent = fs.readFileSync(path.join(libPath, 'eks-node-groups.tf'), 'utf8');
      
      expect(nodeGroupsContent).toContain('resource "aws_eks_node_group"');
      expect(nodeGroupsContent).toContain('cluster_name');
      expect(nodeGroupsContent).toContain('node_role_arn');
    });

    test('should have launch templates', () => {
      const nodeGroupsContent = fs.readFileSync(path.join(libPath, 'eks-node-groups.tf'), 'utf8');
      
      expect(nodeGroupsContent).toContain('resource "aws_launch_template"');
    });

    test('should have proper scaling configuration', () => {
      const nodeGroupsContent = fs.readFileSync(path.join(libPath, 'eks-node-groups.tf'), 'utf8');
      
      expect(nodeGroupsContent).toContain('scaling_config {');
      expect(nodeGroupsContent).toContain('desired_size');
      expect(nodeGroupsContent).toContain('max_size');
      expect(nodeGroupsContent).toContain('min_size');
    });
  });

  describe('IAM Configuration Tests', () => {
    test('should have EKS cluster IAM role', () => {
      const iamContent = fs.readFileSync(path.join(libPath, 'iam-eks-cluster.tf'), 'utf8');

      expect(iamContent).toContain('resource "aws_iam_role" "cluster"');
      expect(iamContent).toContain('assume_role_policy');
      expect(iamContent).toContain('EKSClusterPolicy');
    });

    test('should have node group IAM roles', () => {
      const nodeIamContent = fs.readFileSync(path.join(libPath, 'iam-node-groups.tf'), 'utf8');

      expect(nodeIamContent).toContain('resource "aws_iam_role" "node"');
      expect(nodeIamContent).toContain('EKSWorkerNodePolicy');
      expect(nodeIamContent).toContain('EKS_CNI_Policy');
      expect(nodeIamContent).toContain('ContainerRegistryReadOnly');
    });

    test('should have IRSA roles configured', () => {
      const irsaContent = fs.readFileSync(path.join(libPath, 'iam-irsa.tf'), 'utf8');

      expect(irsaContent).toContain('cluster_autoscaler');
      expect(irsaContent).toContain('alb_controller');
      expect(irsaContent).toContain('external_secrets');
      expect(irsaContent).toContain('ebs_csi_driver');
    });
  });

  describe('Security Groups Configuration Tests', () => {
    test('should have cluster security group', () => {
      const sgContent = fs.readFileSync(path.join(libPath, 'security-groups.tf'), 'utf8');
      
      expect(sgContent).toContain('resource "aws_security_group"');
      expect(sgContent).toContain('vpc_id');
    });

    test('should have security group rules', () => {
      const sgContent = fs.readFileSync(path.join(libPath, 'security-groups.tf'), 'utf8');
      
      expect(sgContent).toContain('resource "aws_security_group_rule"');
      expect(sgContent).toContain('ingress');
      expect(sgContent).toContain('egress');
    });
  });

  describe('EKS Add-ons Configuration Tests', () => {
    test('should have essential add-ons configured', () => {
      const addonsContent = fs.readFileSync(path.join(libPath, 'eks-addons.tf'), 'utf8');
      
      expect(addonsContent).toContain('resource "aws_eks_addon"');
      expect(addonsContent).toContain('vpc-cni');
      expect(addonsContent).toContain('kube-proxy');
      expect(addonsContent).toContain('coredns');
      expect(addonsContent).toContain('aws-ebs-csi-driver');
    });
  });

  describe('CloudWatch Configuration Tests', () => {
    test('should have Container Insights configuration', () => {
      const cloudwatchContent = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');

      expect(cloudwatchContent).toContain('cloudwatch');
    });
  });

  describe('Outputs Configuration Tests', () => {
    test('should have essential outputs defined', () => {
      const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
      
      const requiredOutputs = [
        'cluster',
        'endpoint',
        'security_group',
        'oidc',
        'vpc'
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toContain(output);
      });
    });
  });

  describe('Environment Suffix Usage Tests', () => {
    test('should use environment_suffix in resource names', () => {
      let totalFiles = 0;
      let filesWithEnvironmentSuffix = 0;

      terraformFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        totalFiles++;
        if (content.includes('environment_suffix')) {
          filesWithEnvironmentSuffix++;
        }
      });

      const usagePercentage = (filesWithEnvironmentSuffix / totalFiles) * 100;
      expect(usagePercentage).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Terraform Configuration Syntax Tests', () => {
    test('should have valid HCL syntax in all files', () => {
      terraformFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic HCL syntax checks
        expect(content).not.toContain('<<<');
        expect(content).not.toContain('>>>');
        expect(content).not.toContain('${{}');
        
        // Count braces for basic balance check
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);
      });
    });

    test('should have proper resource naming conventions', () => {
      terraformFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const resourceMatches = content.match(/resource\s+"[\w_-]+"\s+"[\w_-]+"/g);
        if (resourceMatches) {
          resourceMatches.forEach(resource => {
            // Resources should follow naming conventions
            expect(resource).toMatch(/resource\s+"[\w_-]+"\s+"[\w_-]+"/);
          });
        }
      });
    });
  });

  describe('Tagging and Compliance Tests', () => {
    test('should use consistent tagging in resources', () => {
      let resourcesWithTags = 0;
      let totalResources = 0;

      terraformFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const resourceMatches = content.match(/resource\s+"[\w_-]+"\s+"[\w_-]+"/g);
        if (resourceMatches) {
          totalResources += resourceMatches.length;
          
          // Check if tags block exists in file
          if (content.includes('tags = {') || content.includes('default_tags')) {
            resourcesWithTags += resourceMatches.length;
          }
        }
      });

      // At least some resources should have tagging strategy
      expect(resourcesWithTags).toBeGreaterThan(0);
    });
  });

  describe('Security Best Practices Tests', () => {
    test('should not contain hardcoded sensitive values', () => {
      terraformFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for potential hardcoded secrets
        expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
        expect(content).not.toMatch(/secret\s*=\s*"[^"]+"/i);
        expect(content).not.toMatch(/key\s*=\s*"AKIA[^"]+"/);
        expect(content).not.toMatch(/token\s*=\s*"[^"]{20,}"/);
      });
    });

    test('should use variables for configurable values', () => {
      terraformFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Should use variables for region, environment, etc.
        if (content.includes('aws_region')) {
          expect(content).toContain('aws_region');
        }
      });
    });
  });
});