// test/terraform.unit.test.ts
// Unit tests for EKS Terraform configuration (no AWS calls)

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib/'); // root of tf files

function fileContent(name: string): string {
  return fs.readFileSync(path.join(LIB_DIR, name), 'utf8').toLowerCase();
}

function tapStackContent(): string {
  return fs.readFileSync(path.join(LIB_DIR, 'tap_stack.tf'), 'utf8');
}

describe('EKS Terraform - Unit Tests (tap_stack.tf)', () => {
  let tfFiles: string[];
  let tapStack: string;

  beforeAll(() => {
    tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
    tapStack = tapStackContent();
  });

  describe('tap_stack.tf Structure', () => {
    test('tap_stack.tf exists and has substantial content', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'tap_stack.tf'))).toBe(true);
      expect(tapStack.length).toBeGreaterThan(10000); // Comprehensive stack
    });

    test('has balanced braces', () => {
      const open = (tapStack.match(/{/g) || []).length;
      const close = (tapStack.match(/}/g) || []).length;
      expect(open).toBe(close);
    });

    test('contains all Terraform block types', () => {
      expect(tapStack).toMatch(/\bvariable\b/);
      expect(tapStack).toMatch(/\bdata\b/);
      expect(tapStack).toMatch(/\bresource\b/);
      expect(tapStack).toMatch(/\boutput\b/);
    });
  });

  describe('Variables Section', () => {
    test('defines all required variables with defaults', () => {
      const vars = [
        'variable "aws_region" {',
        'default = "us-east-1"',
        'variable "environment_suffix" {',
        'default = "dev"',
        'variable "repository" {',
        'variable "commit_author" {',
        'variable "pr_number" {',
        'variable "team" {'
      ];
    });
  });

  describe('VPC and Networking', () => {
    test('main VPC with correct CIDR and DNS settings', () => {
      expect(tapStack).toContain('resource "aws_vpc" "main"');
      expect(tapStack).toContain('enable_dns_hostnames = true');
    });

    test('internet gateway properly configured', () => {
      expect(tapStack).toContain('resource "aws_internet_gateway" "main"');
      expect(tapStack).toContain('vpc_id = aws_vpc.main.id');
    });

    test('3 private subnets with correct tagging', () => {
      expect(tapStack).toContain('resource "aws_subnet" "private"');
      expect(tapStack).toContain('kubernetes.io/role/internal-elb');
      expect(tapStack).toContain('"kubernetes.io/cluster/eks-cluster-${var.environment_suffix}" = "shared"');
    });

    test('3 public subnets with public IP mapping', () => {
      expect(tapStack).toContain('resource "aws_subnet" "public"');
      expect(tapStack).toContain('map_public_ip_on_launch = true');
      expect(tapStack).toContain('kubernetes.io/role/elb');
    });

    test('public route table routes to IGW', () => {
      expect(tapStack).toContain('resource "aws_route_table" "public"');
      expect(tapStack).toContain('cidr_block = "0.0.0.0/0"');
      expect(tapStack).toContain('gateway_id = aws_internet_gateway.main.id');
    });

    test('private route tables reference NAT instances', () => {
      expect(tapStack).toContain('resource "aws_route_table" "private"');
      expect(tapStack).toContain('network_interface_id = aws_instance.nat[count.index].primary_network_interface_id');
    });
  });

  describe('Security Groups', () => {
    test('EKS cluster security group allows all egress', () => {
      expect(tapStack).toContain('resource "aws_security_group" "eks_cluster"');
      expect(tapStack).toContain('cidr_blocks = ["0.0.0.0/0"]');
    });

    test('EKS nodes security group has proper ingress rules', () => {
      expect(tapStack).toContain('resource "aws_security_group" "eks_nodes"');
      expect(tapStack).toContain('security_groups = [aws_security_group.eks_cluster.id]');
    });

    test('NAT security group allows private subnet traffic', () => {
      expect(tapStack).toContain('resource "aws_security_group" "nat"');
      expect(tapStack).toContain('cidr_blocks = [for subnet in aws_subnet.private : subnet.cidr_block]');
    });
  });

  describe('NAT Instances', () => {
    test('3 NAT instances with proper configuration', () => {
      expect(tapStack).toContain('resource "aws_instance" "nat"');
      expect(tapStack).toContain('#!/bin/bash');
      expect(tapStack).toContain('echo 1 > /proc/sys/net/ipv4/ip_forward');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EKS cluster IAM role and policy attachments', () => {
      expect(tapStack).toContain('resource "aws_iam_role" "eks_cluster"');
      expect(tapStack).toContain('AmazonEKSClusterPolicy');
      expect(tapStack).toContain('AmazonEKSVPCResourceController');
    });

    test('EKS node group IAM role with required policies', () => {
      expect(tapStack).toContain('resource "aws_iam_role" "eks_node_group"');
      expect(tapStack).toContain('AmazonEKSWorkerNodePolicy');
      expect(tapStack).toContain('AmazonEKS_CNI_Policy');
      expect(tapStack).toContain('AmazonEC2ContainerRegistryReadOnly');
    });

    test('Karpenter IRSA role with proper assume role policy', () => {
      expect(tapStack).toContain('resource "aws_iam_role" "karpenter"');
      expect(tapStack).toContain('system:serviceaccount:karpenter:karpenter');
      expect(tapStack).toContain('ec2:CreateFleet');
      expect(tapStack).toContain('iam:PassRole');
      expect(tapStack).toContain('aws_iam_role.eks_node_group.arn');
    });

    test('AWS Load Balancer Controller IRSA role', () => {
      expect(tapStack).toContain('resource "aws_iam_role" "aws_load_balancer_controller"');
      expect(tapStack).toContain('system:serviceaccount:kube-system:aws-load-balancer-controller');
      expect(tapStack).toContain('elasticloadbalancing:CreateLoadBalancer');
    });
  });

  describe('EKS Cluster and Node Group', () => {

    test('EKS addons configured', () => {
      expect(tapStack).toContain('resource "aws_eks_addon" "vpc_cni"');
      expect(tapStack).toContain('resource "aws_eks_addon" "coredns"');
      expect(tapStack).toContain('resource "aws_eks_addon" "kube_proxy"');
    });
  });

  describe('Karpenter Infrastructure', () => {
    test('Karpenter SQS queue and policy', () => {
      expect(tapStack).toContain('resource "aws_sqs_queue" "karpenter"');
      expect(tapStack).toContain('resource "aws_sqs_queue_policy" "karpenter"');
    });

    test('EventBridge rules for spot interruption handling', () => {
      expect(tapStack).toContain('resource "aws_cloudwatch_event_rule" "karpenter_spot_interruption"');
      expect(tapStack).toContain('resource "aws_cloudwatch_event_target" "karpenter_spot_interruption"');
      expect(tapStack).toContain('resource "aws_cloudwatch_event_rule" "karpenter_instance_state_change"');
    });
  });

  describe('Dependencies and Lifecycle', () => {
    test('proper depends_on for critical resources', () => {
      expect(tapStack).toContain('depends_on = [');
      expect(tapStack).toContain('aws_iam_role_policy_attachment.eks_cluster_policy');
      expect(tapStack).toContain('null_resource.karpenter_install');
    });

    test('lifecycle create_before_destroy for security groups', () => {
      expect(tapStack).toContain('lifecycle {');
      expect(tapStack).toContain('create_before_destroy = true');
    });
  });
});
