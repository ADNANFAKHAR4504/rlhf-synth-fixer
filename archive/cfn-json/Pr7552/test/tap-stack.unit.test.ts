import fs from 'fs';
import path from 'path';

describe('EKS Cluster CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBeDefined();
      expect(envSuffixParam.MinLength).toBe(1);
      expect(envSuffixParam.MaxLength).toBe(20);
      expect(envSuffixParam.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('should have VPC-related parameters', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('AWS::EC2::VPC::Id');

      expect(template.Parameters.PrivateSubnetIds).toBeDefined();
      expect(template.Parameters.PrivateSubnetIds.Type).toBe('List<AWS::EC2::Subnet::Id>');

      expect(template.Parameters.ControlPlaneSubnetIds).toBeDefined();
      expect(template.Parameters.ControlPlaneSubnetIds.Type).toBe('List<AWS::EC2::Subnet::Id>');
    });

    test('should have tag parameters with defaults', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Default).toBe('production');
      expect(template.Parameters.Environment.AllowedValues).toContain('production');
      expect(template.Parameters.Environment.AllowedValues).toContain('staging');
      expect(template.Parameters.Environment.AllowedValues).toContain('development');

      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Default).toBe('platform-team');

      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.CostCenter.Default).toBe('engineering');
    });
  });

  describe('EKS Cluster Security Group', () => {
    test('should have security group resource', () => {
      expect(template.Resources.EKSClusterSecurityGroup).toBeDefined();
      expect(template.Resources.EKSClusterSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should have correct properties', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      expect(sg.Properties.GroupDescription).toBeDefined();
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VpcId' });
    });

    test('security group should have egress rules', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      expect(Array.isArray(sg.Properties.SecurityGroupEgress)).toBe(true);
      expect(sg.Properties.SecurityGroupEgress.length).toBeGreaterThan(0);
    });

    test('security group should have tags with EnvironmentSuffix', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      expect(sg.Properties.Tags).toBeDefined();
      expect(Array.isArray(sg.Properties.Tags)).toBe(true);

      const nameTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'eks-cluster-sg-${EnvironmentSuffix}' });
    });

    test('security group should have all required tags', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      const tags = sg.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('EKS Cluster IAM Role', () => {
    test('should have cluster role resource', () => {
      expect(template.Resources.EKSClusterRole).toBeDefined();
      expect(template.Resources.EKSClusterRole.Type).toBe('AWS::IAM::Role');
    });

    test('cluster role should have name with EnvironmentSuffix', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'eks-cluster-role-${EnvironmentSuffix}'
      });
    });

    test('cluster role should have correct assume role policy', () => {
      const role = template.Resources.EKSClusterRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('eks.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('cluster role should have required managed policies', () => {
      const role = template.Resources.EKSClusterRole;
      const policies = role.Properties.ManagedPolicyArns;

      expect(Array.isArray(policies)).toBe(true);
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('cluster role should have all required tags', () => {
      const role = template.Resources.EKSClusterRole;
      const tags = role.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('EKS Cluster', () => {
    test('should have EKS cluster resource', () => {
      expect(template.Resources.EKSCluster).toBeDefined();
      expect(template.Resources.EKSCluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('cluster should have name with EnvironmentSuffix', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Name).toEqual({
        'Fn::Sub': 'eks-cluster-${EnvironmentSuffix}'
      });
    });

    test('cluster should use version 1.28', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Version).toBe('1.28');
    });

    test('cluster should reference cluster role', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.RoleArn).toEqual({
        'Fn::GetAtt': ['EKSClusterRole', 'Arn']
      });
    });

    test('cluster should have private endpoint only', () => {
      const cluster = template.Resources.EKSCluster;
      const vpcConfig = cluster.Properties.ResourcesVpcConfig;

      expect(vpcConfig.EndpointPrivateAccess).toBe(true);
      expect(vpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('cluster should reference control plane subnets', () => {
      const cluster = template.Resources.EKSCluster;
      const vpcConfig = cluster.Properties.ResourcesVpcConfig;

      expect(vpcConfig.SubnetIds).toEqual({ Ref: 'ControlPlaneSubnetIds' });
    });

    test('cluster should reference security group', () => {
      const cluster = template.Resources.EKSCluster;
      const vpcConfig = cluster.Properties.ResourcesVpcConfig;

      expect(vpcConfig.SecurityGroupIds).toBeDefined();
      expect(Array.isArray(vpcConfig.SecurityGroupIds)).toBe(true);
      expect(vpcConfig.SecurityGroupIds[0]).toEqual({ Ref: 'EKSClusterSecurityGroup' });
    });

    test('cluster should have all control plane logs enabled', () => {
      const cluster = template.Resources.EKSCluster;
      const logging = cluster.Properties.Logging;

      expect(logging.ClusterLogging).toBeDefined();
      expect(logging.ClusterLogging.EnabledTypes).toBeDefined();
      expect(Array.isArray(logging.ClusterLogging.EnabledTypes)).toBe(true);

      const logTypes = logging.ClusterLogging.EnabledTypes.map((type: any) => type.Type);
      expect(logTypes).toContain('api');
      expect(logTypes).toContain('audit');
      expect(logTypes).toContain('authenticator');
      expect(logTypes).toContain('controllerManager');
      expect(logTypes).toContain('scheduler');
      expect(logTypes.length).toBe(5);
    });

    test('cluster should have all required tags', () => {
      const cluster = template.Resources.EKSCluster;
      const tags = cluster.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
    });

    test('cluster should not have DeletionPolicy Retain', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should have log group resource', () => {
      expect(template.Resources.EKSClusterLogGroup).toBeDefined();
      expect(template.Resources.EKSClusterLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have name with EnvironmentSuffix', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/eks/eks-cluster-${EnvironmentSuffix}/cluster'
      });
    });

    test('log group should have 30-day retention', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('log group should not have DeletionPolicy Retain', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('OIDC Provider', () => {
    test('should have OIDC provider resource', () => {
      expect(template.Resources.OIDCProvider).toBeDefined();
      expect(template.Resources.OIDCProvider.Type).toBe('AWS::IAM::OIDCProvider');
    });

    test('OIDC provider should reference cluster OIDC issuer URL', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.Url).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'OpenIdConnectIssuerUrl']
      });
    });

    test('OIDC provider should have sts.amazonaws.com client ID', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.ClientIdList).toContain('sts.amazonaws.com');
    });

    test('OIDC provider should have thumbprint list', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.ThumbprintList).toBeDefined();
      expect(Array.isArray(oidc.Properties.ThumbprintList)).toBe(true);
      expect(oidc.Properties.ThumbprintList.length).toBeGreaterThan(0);
    });

    test('OIDC provider should not have DeletionPolicy Retain', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Node Instance IAM Role', () => {
    test('should have node instance role resource', () => {
      expect(template.Resources.NodeInstanceRole).toBeDefined();
      expect(template.Resources.NodeInstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('node role should have name with EnvironmentSuffix', () => {
      const role = template.Resources.NodeInstanceRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'eks-node-role-${EnvironmentSuffix}'
      });
    });

    test('node role should have correct assume role policy', () => {
      const role = template.Resources.NodeInstanceRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('node role should have all required managed policies', () => {
      const role = template.Resources.NodeInstanceRole;
      const policies = role.Properties.ManagedPolicyArns;

      expect(Array.isArray(policies)).toBe(true);
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(policies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('node role should have all required tags', () => {
      const role = template.Resources.NodeInstanceRole;
      const tags = role.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
    });

    test('node role should not have DeletionPolicy Retain', () => {
      const role = template.Resources.NodeInstanceRole;
      expect(role.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Managed Node Group', () => {
    test('should have node group resource', () => {
      expect(template.Resources.NodeGroup).toBeDefined();
      expect(template.Resources.NodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('node group should have name with EnvironmentSuffix', () => {
      const nodeGroup = template.Resources.NodeGroup;
      expect(nodeGroup.Properties.NodegroupName).toEqual({
        'Fn::Sub': 'eks-nodegroup-${EnvironmentSuffix}'
      });
    });

    test('node group should reference EKS cluster', () => {
      const nodeGroup = template.Resources.NodeGroup;
      expect(nodeGroup.Properties.ClusterName).toEqual({ Ref: 'EKSCluster' });
    });

    test('node group should reference node instance role', () => {
      const nodeGroup = template.Resources.NodeGroup;
      expect(nodeGroup.Properties.NodeRole).toEqual({
        'Fn::GetAtt': ['NodeInstanceRole', 'Arn']
      });
    });

    test('node group should reference private subnets', () => {
      const nodeGroup = template.Resources.NodeGroup;
      expect(nodeGroup.Properties.Subnets).toEqual({ Ref: 'PrivateSubnetIds' });
    });

    test('node group should have correct scaling configuration', () => {
      const nodeGroup = template.Resources.NodeGroup;
      const scalingConfig = nodeGroup.Properties.ScalingConfig;

      expect(scalingConfig.MinSize).toBe(2);
      expect(scalingConfig.MaxSize).toBe(10);
      expect(scalingConfig.DesiredSize).toBe(4);
    });

    test('node group should use t3.large instance type', () => {
      const nodeGroup = template.Resources.NodeGroup;
      expect(nodeGroup.Properties.InstanceTypes).toEqual(['t3.large']);
    });

    test('node group should use Amazon Linux 2 AMI', () => {
      const nodeGroup = template.Resources.NodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_x86_64');
    });

    test('node group should have all required tags', () => {
      const nodeGroup = template.Resources.NodeGroup;
      const tags = nodeGroup.Properties.Tags;

      expect(tags.Environment).toEqual({ Ref: 'Environment' });
      expect(tags.Owner).toEqual({ Ref: 'Owner' });
      expect(tags.CostCenter).toEqual({ Ref: 'CostCenter' });
      expect(tags.Name).toEqual({ 'Fn::Sub': 'eks-nodegroup-${EnvironmentSuffix}' });
    });

    test('node group should not have DeletionPolicy Retain', () => {
      const nodeGroup = template.Resources.NodeGroup;
      expect(nodeGroup.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Outputs', () => {
    test('should have ClusterName output', () => {
      expect(template.Outputs.ClusterName).toBeDefined();
      expect(template.Outputs.ClusterName.Value).toEqual({ Ref: 'EKSCluster' });
      expect(template.Outputs.ClusterName.Description).toBeDefined();
    });

    test('should have ClusterEndpoint output', () => {
      expect(template.Outputs.ClusterEndpoint).toBeDefined();
      expect(template.Outputs.ClusterEndpoint.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'Endpoint']
      });
    });

    test('should have ClusterArn output', () => {
      expect(template.Outputs.ClusterArn).toBeDefined();
      expect(template.Outputs.ClusterArn.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'Arn']
      });
    });

    test('should have OIDCIssuerURL output', () => {
      expect(template.Outputs.OIDCIssuerURL).toBeDefined();
      expect(template.Outputs.OIDCIssuerURL.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'OpenIdConnectIssuerUrl']
      });
    });

    test('should have OIDCProviderArn output', () => {
      expect(template.Outputs.OIDCProviderArn).toBeDefined();
      expect(template.Outputs.OIDCProviderArn.Value).toEqual({ Ref: 'OIDCProvider' });
    });

    test('should have NodeGroupArn output', () => {
      expect(template.Outputs.NodeGroupArn).toBeDefined();
      expect(template.Outputs.NodeGroupArn.Value).toEqual({
        'Fn::GetAtt': ['NodeGroup', 'Arn']
      });
    });

    test('should have NodeInstanceRoleArn output', () => {
      expect(template.Outputs.NodeInstanceRoleArn).toBeDefined();
      expect(template.Outputs.NodeInstanceRoleArn.Value).toEqual({
        'Fn::GetAtt': ['NodeInstanceRole', 'Arn']
      });
    });

    test('should have ClusterSecurityGroupId output', () => {
      expect(template.Outputs.ClusterSecurityGroupId).toBeDefined();
      expect(template.Outputs.ClusterSecurityGroupId.Value).toEqual({
        Ref: 'EKSClusterSecurityGroup'
      });
    });

    test('all outputs should have exports', () => {
      const outputKeys = Object.keys(template.Outputs);
      outputKeys.forEach(key => {
        const output = template.Outputs[key];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Deployment Validation', () => {
    test('should not have any resources with DeletionPolicy Retain', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('all IAM roles should include EnvironmentSuffix in name', () => {
      const roles = ['EKSClusterRole', 'NodeInstanceRole'];
      roles.forEach(roleKey => {
        const role = template.Resources[roleKey];
        expect(role.Properties.RoleName).toEqual(
          expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
        );
      });
    });

    test('all resources with names should include EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'EKSCluster',
        'NodeGroup',
        'EKSClusterLogGroup'
      ];

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const nameProperty = resource.Properties.Name ||
          resource.Properties.NodegroupName ||
          resource.Properties.LogGroupName;

        expect(nameProperty).toBeDefined();
        if (typeof nameProperty === 'object') {
          expect(JSON.stringify(nameProperty)).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(7); // SG, ClusterRole, Cluster, LogGroup, OIDC, NodeRole, NodeGroup
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7); // EnvironmentSuffix, VpcId, PrivateSubnetIds, ControlPlaneSubnetIds, Environment, Owner, CostCenter
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('template should be parseable as JSON', () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(() => JSON.parse(templateContent)).not.toThrow();
    });
  });
});
