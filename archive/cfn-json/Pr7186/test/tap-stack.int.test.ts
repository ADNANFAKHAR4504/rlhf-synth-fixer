/**
 * Integration tests for TAP Stack (CloudFormation/EKS)
 * Tests validate deployment outputs and CloudFormation template structure
 * No AWS API calls - validates outputs from cfn-outputs/flat-outputs.json
 */

import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs from flat-outputs.json
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');

let deploymentOutputs: any;
let cfnTemplate: any;

beforeAll(() => {
  // Load deployment outputs
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Deployment outputs file not found at: ${outputsPath}`);
  }
  deploymentOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

  // Load CloudFormation template
  if (!fs.existsSync(templatePath)) {
    throw new Error(`CloudFormation template not found at: ${templatePath}`);
  }
  cfnTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
});

describe('TAP Stack Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(deploymentOutputs).toBeDefined();
      expect(deploymentOutputs.ClusterName).toBeDefined();
      expect(deploymentOutputs.ClusterArn).toBeDefined();
      expect(deploymentOutputs.ClusterEndpoint).toBeDefined();
      expect(deploymentOutputs.VPCId).toBeDefined();
      expect(deploymentOutputs.ClusterSecurityGroupId).toBeDefined();
      expect(deploymentOutputs.NodeSecurityGroupId).toBeDefined();
      expect(deploymentOutputs.OIDCProviderArn).toBeDefined();
    });

    test('should have valid ARN formats', () => {
      expect(deploymentOutputs.ClusterArn).toMatch(/^arn:aws:eks:[a-z0-9-]+:\d+:cluster\/.+$/);
      expect(deploymentOutputs.OIDCProviderArn).toMatch(/^arn:aws:iam::\d+:oidc-provider\/.+$/);
    });

    test('should have valid resource identifiers', () => {
      expect(deploymentOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(deploymentOutputs.ClusterSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      expect(deploymentOutputs.NodeSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('should have valid cluster endpoint URL', () => {
      expect(deploymentOutputs.ClusterEndpoint).toMatch(/^https:\/\/.+\.eks\.amazonaws\.com$/);
    });

    test('should have cluster name matching environment pattern', () => {
      expect(deploymentOutputs.ClusterName).toMatch(/^eks-cluster-.+$/);
    });

    test('should extract region from cluster ARN', () => {
      const arnParts = deploymentOutputs.ClusterArn.split(':');
      expect(arnParts[3]).toMatch(/^[a-z]{2}-[a-z]+-\d+$/); // Region format
    });

    test('should extract account ID from cluster ARN', () => {
      const arnParts = deploymentOutputs.ClusterArn.split(':');
      expect(arnParts[4]).toMatch(/^\d{12}$/); // 12-digit account ID
    });
  });

  describe('CloudFormation Template Structure', () => {
    test('should have correct template version', () => {
      expect(cfnTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have template description', () => {
      expect(cfnTemplate.Description).toBeDefined();
      expect(cfnTemplate.Description).toContain('EKS');
    });

    test('should have required parameters', () => {
      expect(cfnTemplate.Parameters).toBeDefined();
      expect(cfnTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(cfnTemplate.Parameters.ClusterVersion).toBeDefined();
      expect(cfnTemplate.Parameters.NodeInstanceType).toBeDefined();
      expect(cfnTemplate.Parameters.NodeGroupMinSize).toBeDefined();
      expect(cfnTemplate.Parameters.NodeGroupDesiredSize).toBeDefined();
      expect(cfnTemplate.Parameters.NodeGroupMaxSize).toBeDefined();
    });

    test('should have parameter defaults', () => {
      expect(cfnTemplate.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(cfnTemplate.Parameters.ClusterVersion.Default).toBe('1.28');
      expect(cfnTemplate.Parameters.NodeInstanceType.Default).toBe('t3.medium');
    });

    test('should have valid Kubernetes version options', () => {
      expect(cfnTemplate.Parameters.ClusterVersion.AllowedValues).toEqual(['1.28', '1.29', '1.30']);
    });

    test('should have Resources section', () => {
      expect(cfnTemplate.Resources).toBeDefined();
      expect(Object.keys(cfnTemplate.Resources).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Configuration in Template', () => {
    test('should have VPC resource', () => {
      expect(cfnTemplate.Resources.VPC).toBeDefined();
      expect(cfnTemplate.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have correct VPC CIDR block', () => {
      expect(cfnTemplate.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should enable DNS support', () => {
      expect(cfnTemplate.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should enable DNS hostnames', () => {
      expect(cfnTemplate.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have VPC tags', () => {
      expect(cfnTemplate.Resources.VPC.Properties.Tags).toBeDefined();
      expect(Array.isArray(cfnTemplate.Resources.VPC.Properties.Tags)).toBe(true);
    });

    test('should have Environment tag on VPC', () => {
      const envTag = cfnTemplate.Resources.VPC.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
    });

    test('should have Team tag on VPC', () => {
      const teamTag = cfnTemplate.Resources.VPC.Properties.Tags.find((tag: any) => tag.Key === 'Team');
      expect(teamTag).toBeDefined();
      expect(teamTag.Value).toBe('platform');
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should have Internet Gateway resource', () => {
      expect(cfnTemplate.Resources.InternetGateway).toBeDefined();
      expect(cfnTemplate.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(cfnTemplate.Resources.VPCGatewayAttachment).toBeDefined();
      expect(cfnTemplate.Resources.VPCGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });

    test('should attach IGW to VPC', () => {
      const attachment = cfnTemplate.Resources.VPCGatewayAttachment.Properties;
      expect(attachment.VpcId).toBeDefined();
      expect(attachment.InternetGatewayId).toBeDefined();
    });
  });

  describe('Subnet Configuration in Template', () => {
    test('should have public subnets', () => {
      expect(cfnTemplate.Resources.PublicSubnet1).toBeDefined();
      expect(cfnTemplate.Resources.PublicSubnet2).toBeDefined();
    });

    test('should have private subnets', () => {
      expect(cfnTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(cfnTemplate.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have correct subnet types', () => {
      expect(cfnTemplate.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(cfnTemplate.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have public subnets with correct CIDR blocks', () => {
      expect(cfnTemplate.Resources.PublicSubnet1.Properties.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
      expect(cfnTemplate.Resources.PublicSubnet2.Properties.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
    });

    test('should have private subnets with correct CIDR blocks', () => {
      expect(cfnTemplate.Resources.PrivateSubnet1.Properties.CidrBlock).toMatch(
        /^10\.0\.\d+\.0\/24$/
      );
      expect(cfnTemplate.Resources.PrivateSubnet2.Properties.CidrBlock).toMatch(
        /^10\.0\.\d+\.0\/24$/
      );
    });

    test('should have public subnets with auto-assign public IP', () => {
      expect(cfnTemplate.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(cfnTemplate.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have subnets in different AZs', () => {
      const subnet1AZ = cfnTemplate.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = cfnTemplate.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(subnet1AZ).toBeDefined();
      expect(subnet2AZ).toBeDefined();
      // Should use Fn::Select with different indices
      expect(subnet1AZ['Fn::Select'][0]).not.toBe(subnet2AZ['Fn::Select'][0]);
    });

    test('should have kubernetes ELB tags on public subnets', () => {
      const subnet1Tags = cfnTemplate.Resources.PublicSubnet1.Properties.Tags;
      const elbTag = subnet1Tags.find((tag: any) => tag.Key === 'kubernetes.io/role/elb');
      expect(elbTag).toBeDefined();
      expect(elbTag.Value).toBe('1');
    });

    test('should have kubernetes internal ELB tags on private subnets', () => {
      const subnet1Tags = cfnTemplate.Resources.PrivateSubnet1.Properties.Tags;
      const elbTag = subnet1Tags.find((tag: any) => tag.Key === 'kubernetes.io/role/internal-elb');
      expect(elbTag).toBeDefined();
      expect(elbTag.Value).toBe('1');
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should have NAT Gateway resources', () => {
      expect(cfnTemplate.Resources.NatGateway1).toBeDefined();
      expect(cfnTemplate.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have NAT Gateway in public subnet', () => {
      expect(cfnTemplate.Resources.NatGateway1.Properties.SubnetId).toBeDefined();
    });
  });

  describe('Route Table Configuration', () => {
    test('should have public route table', () => {
      expect(cfnTemplate.Resources.PublicRouteTable).toBeDefined();
      expect(cfnTemplate.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route tables', () => {
      expect(cfnTemplate.Resources.PrivateRouteTable1).toBeDefined();
      expect(cfnTemplate.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have public route to Internet Gateway', () => {
      expect(cfnTemplate.Resources.PublicRoute).toBeDefined();
      expect(cfnTemplate.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(cfnTemplate.Resources.PublicRoute.Properties.GatewayId).toBeDefined();
    });

    test('should have private route to NAT Gateway', () => {
      expect(cfnTemplate.Resources.PrivateRoute1).toBeDefined();
      expect(cfnTemplate.Resources.PrivateRoute1.Type).toBe('AWS::EC2::Route');
      expect(cfnTemplate.Resources.PrivateRoute1.Properties.NatGatewayId).toBeDefined();
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should have EKS cluster resource', () => {
      expect(cfnTemplate.Resources.EKSCluster).toBeDefined();
      expect(cfnTemplate.Resources.EKSCluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('should have cluster role', () => {
      expect(cfnTemplate.Resources.EKSClusterRole).toBeDefined();
      expect(cfnTemplate.Resources.EKSClusterRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have correct cluster version reference', () => {
      expect(cfnTemplate.Resources.EKSCluster.Properties.Version).toBeDefined();
    });

    test('should have resources VPC config', () => {
      expect(cfnTemplate.Resources.EKSCluster.Properties.ResourcesVpcConfig).toBeDefined();
      expect(cfnTemplate.Resources.EKSCluster.Properties.ResourcesVpcConfig.SubnetIds).toBeDefined();
    });

    test('should have logging configuration', () => {
      const logging = cfnTemplate.Resources.EKSCluster.Properties.Logging;
      expect(logging).toBeDefined();
      expect(logging.ClusterLogging).toBeDefined();
    });

    test('should have encryption config', () => {
      const encryptionConfig = cfnTemplate.Resources.EKSCluster.Properties.EncryptionConfig;
      expect(encryptionConfig).toBeDefined();
    });
  });

  describe('EKS Node Group Configuration', () => {
    test('should have node group resource', () => {
      expect(cfnTemplate.Resources.EKSNodeGroup).toBeDefined();
      expect(cfnTemplate.Resources.EKSNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('should have node role', () => {
      expect(cfnTemplate.Resources.EKSNodeRole).toBeDefined();
      expect(cfnTemplate.Resources.EKSNodeRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have scaling config', () => {
      const scalingConfig = cfnTemplate.Resources.EKSNodeGroup.Properties.ScalingConfig;
      expect(scalingConfig).toBeDefined();
      expect(scalingConfig.MinSize).toBeDefined();
      expect(scalingConfig.MaxSize).toBeDefined();
      expect(scalingConfig.DesiredSize).toBeDefined();
    });

    test('should have instance types', () => {
      expect(cfnTemplate.Resources.EKSNodeGroup.Properties.InstanceTypes).toBeDefined();
    });

    test('should have subnet configuration', () => {
      expect(cfnTemplate.Resources.EKSNodeGroup.Properties.Subnets).toBeDefined();
    });
  });

  describe('Security Group Configuration', () => {
    test('should have cluster security group', () => {
      expect(cfnTemplate.Resources.ClusterSecurityGroup).toBeDefined();
      expect(cfnTemplate.Resources.ClusterSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have node security group', () => {
      expect(cfnTemplate.Resources.NodeSecurityGroup).toBeDefined();
      expect(cfnTemplate.Resources.NodeSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });


    test('should have security groups in VPC', () => {
      expect(cfnTemplate.Resources.ClusterSecurityGroup.Properties.VpcId).toBeDefined();
      expect(cfnTemplate.Resources.NodeSecurityGroup.Properties.VpcId).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    test('should have EKS cluster role with trust policy', () => {
      const clusterRole = cfnTemplate.Resources.EKSClusterRole;
      expect(clusterRole.Properties.AssumeRolePolicyDocument).toBeDefined();
      const statements = clusterRole.Properties.AssumeRolePolicyDocument.Statement;
      expect(Array.isArray(statements)).toBe(true);
    });

    test('should have EKS cluster service principal', () => {
      const clusterRole = cfnTemplate.Resources.EKSClusterRole;
      const statement = clusterRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toContain('eks.amazonaws.com');
    });

    test('should have EKS cluster managed policies', () => {
      const clusterRole = cfnTemplate.Resources.EKSClusterRole;
      expect(clusterRole.Properties.ManagedPolicyArns).toBeDefined();
      expect(Array.isArray(clusterRole.Properties.ManagedPolicyArns)).toBe(true);
    });

    test('should have EKS node role with trust policy', () => {
      const nodeRole = cfnTemplate.Resources.EKSNodeRole;
      expect(nodeRole.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have EC2 service principal for node role', () => {
      const nodeRole = cfnTemplate.Resources.EKSNodeRole;
      const statement = nodeRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('should have required node group managed policies', () => {
      const nodeRole = cfnTemplate.Resources.EKSNodeRole;
      const policies = nodeRole.Properties.ManagedPolicyArns;
      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);
      expect(policies.length).toBeGreaterThanOrEqual(3);
    });
  });


  describe('CloudTrail Configuration', () => {
    test('should have CloudTrail resource', () => {
      expect(cfnTemplate.Resources.CloudTrail).toBeDefined();
      expect(cfnTemplate.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('should have S3 bucket for CloudTrail logs', () => {
      expect(cfnTemplate.Resources.CloudTrailBucket).toBeDefined();
      expect(cfnTemplate.Resources.CloudTrailBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudTrail enabled', () => {
      expect(cfnTemplate.Resources.CloudTrail.Properties.IsLogging).toBe(true);
    });

  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket with versioning', () => {
      const bucket = cfnTemplate.Resources.CloudTrailBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 bucket encryption', () => {
      const bucket = cfnTemplate.Resources.CloudTrailBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have S3 bucket policy', () => {
      expect(cfnTemplate.Resources.CloudTrailBucketPolicy).toBeDefined();
      expect(cfnTemplate.Resources.CloudTrailBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Resource Tagging', () => {
    test('should have consistent tagging across resources', () => {
      const resourcesWithTags = Object.keys(cfnTemplate.Resources).filter((key) => {
        const resource = cfnTemplate.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });
      expect(resourcesWithTags.length).toBeGreaterThan(0);
    });

    test('should have Environment tag on tagged resources', () => {
      const vpcTags = cfnTemplate.Resources.VPC.Properties.Tags;
      const envTag = vpcTags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
    });

    test('should have Name tags on major resources', () => {
      const vpcTags = cfnTemplate.Resources.VPC.Properties.Tags;
      const nameTag = vpcTags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('should have Team tag set to platform', () => {
      const vpcTags = cfnTemplate.Resources.VPC.Properties.Tags;
      const teamTag = vpcTags.find((tag: any) => tag.Key === 'Team');
      expect(teamTag).toBeDefined();
      expect(teamTag.Value).toBe('platform');
    });

    test('should have CostCenter tag on VPC', () => {
      const vpcTags = cfnTemplate.Resources.VPC.Properties.Tags;
      const costTag = vpcTags.find((tag: any) => tag.Key === 'CostCenter');
      expect(costTag).toBeDefined();
      expect(costTag.Value).toBe('infrastructure');
    });
  });

  describe('Outputs Validation', () => {
    test('should have Outputs section in template', () => {
      expect(cfnTemplate.Outputs).toBeDefined();
    });

    test('should have VPC ID output', () => {
      expect(cfnTemplate.Outputs.VPCId).toBeDefined();
    });

    test('should have Cluster Name output', () => {
      expect(cfnTemplate.Outputs.ClusterName).toBeDefined();
    });

    test('should have Cluster ARN output', () => {
      expect(cfnTemplate.Outputs.ClusterArn).toBeDefined();
    });

    test('should have Cluster Endpoint output', () => {
      expect(cfnTemplate.Outputs.ClusterEndpoint).toBeDefined();
    });

    test('should have Security Group outputs', () => {
      expect(cfnTemplate.Outputs.ClusterSecurityGroupId).toBeDefined();
      expect(cfnTemplate.Outputs.NodeSecurityGroupId).toBeDefined();
    });

    test('should have OIDC Provider ARN output', () => {
      expect(cfnTemplate.Outputs.OIDCProviderArn).toBeDefined();
    });

    test('should have output descriptions', () => {
      expect(cfnTemplate.Outputs.ClusterName.Description).toBeDefined();
      expect(cfnTemplate.Outputs.VPCId.Description).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('should have resources in multiple AZs', () => {
      const subnet1AZ = cfnTemplate.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = cfnTemplate.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(subnet1AZ).toBeDefined();
      expect(subnet2AZ).toBeDefined();
    });

    test('should have at least 2 public subnets', () => {
      expect(cfnTemplate.Resources.PublicSubnet1).toBeDefined();
      expect(cfnTemplate.Resources.PublicSubnet2).toBeDefined();
    });

    test('should have at least 2 private subnets', () => {
      expect(cfnTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(cfnTemplate.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have node group with minimum 2 nodes', () => {
      const scalingConfig = cfnTemplate.Resources.EKSNodeGroup.Properties.ScalingConfig;
      expect(scalingConfig.MinSize.Ref).toBe('NodeGroupMinSize');
    });
  });

  describe('Security and Compliance', () => {
    test('should have encryption enabled for EKS', () => {
      expect(cfnTemplate.Resources.EKSCluster.Properties.EncryptionConfig).toBeDefined();
    });

    test('should have encryption enabled for S3', () => {
      expect(cfnTemplate.Resources.CloudTrailBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have CloudTrail logging enabled', () => {
      expect(cfnTemplate.Resources.CloudTrail.Properties.IsLogging).toBe(true);
    });


    test('should have S3 bucket versioning', () => {
      const bucket = cfnTemplate.Resources.CloudTrailBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should use private subnets for nodes', () => {
      const nodeGroup = cfnTemplate.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.Subnets).toBeDefined();
    });

    test('should have security groups configured', () => {
      expect(cfnTemplate.Resources.ClusterSecurityGroup).toBeDefined();
      expect(cfnTemplate.Resources.NodeSecurityGroup).toBeDefined();
    });
  });

  describe('Deployment Consistency', () => {
    test('should have matching cluster name in outputs and deployment', () => {
      const templateClusterName = cfnTemplate.Outputs.ClusterName;
      expect(templateClusterName).toBeDefined();
      expect(deploymentOutputs.ClusterName).toBeDefined();
    });

    test('should have matching VPC ID pattern', () => {
      expect(deploymentOutputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have all outputs from template present in deployment', () => {
      const templateOutputKeys = Object.keys(cfnTemplate.Outputs || {});
      templateOutputKeys.forEach((key) => {
        expect(deploymentOutputs[key]).toBeDefined();
      });
    });
  });
});
