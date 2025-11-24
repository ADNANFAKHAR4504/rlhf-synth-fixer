import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template;

  beforeAll(() => {
    const templatePath = join(__dirname, '../lib/TapStack.json');
    const templateContent = readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Description).toBeDefined();
    });

    test('EnvironmentSuffix should have MinLength constraint', () => {
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(1);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have environmentSuffix in tags', () => {
      const nameTag = template.Resources.VPC.Properties.Tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'eks-vpc-${EnvironmentSuffix}' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have PrivateSubnet1', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have PrivateSubnet2', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have PrivateSubnet3', () => {
      expect(template.Resources.PrivateSubnet3).toBeDefined();
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('PrivateSubnet1 should have correct CIDR and dynamic AZ', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': { 'Ref': 'AWS::Region' } }]
      });
    });

    test('PrivateSubnet2 should have correct CIDR and dynamic AZ', () => {
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': { 'Ref': 'AWS::Region' } }]
      });
    });

    test('PrivateSubnet3 should have correct CIDR and dynamic AZ', () => {
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [2, { 'Fn::GetAZs': { 'Ref': 'AWS::Region' } }]
      });
    });

    test('all subnets should have MapPublicIpOnLaunch set to false', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('all subnets should have environmentSuffix in name tags', () => {
      const subnet1Tag = template.Resources.PrivateSubnet1.Properties.Tags.find(tag => tag.Key === 'Name');
      expect(subnet1Tag.Value).toEqual({ 'Fn::Sub': 'private-subnet-1-${EnvironmentSuffix}' });

      const subnet2Tag = template.Resources.PrivateSubnet2.Properties.Tags.find(tag => tag.Key === 'Name');
      expect(subnet2Tag.Value).toEqual({ 'Fn::Sub': 'private-subnet-2-${EnvironmentSuffix}' });

      const subnet3Tag = template.Resources.PrivateSubnet3.Properties.Tags.find(tag => tag.Key === 'Name');
      expect(subnet3Tag.Value).toEqual({ 'Fn::Sub': 'private-subnet-3-${EnvironmentSuffix}' });
    });
  });

  describe('Route Table Resources', () => {
    test('should have PrivateRouteTable', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have route table associations for all private subnets', () => {
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation3).toBeDefined();
    });

    test('route table associations should reference correct subnets', () => {
      expect(template.Resources.PrivateSubnetRouteTableAssociation1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(template.Resources.PrivateSubnetRouteTableAssociation2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(template.Resources.PrivateSubnetRouteTableAssociation3.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet3' });
    });
  });

  describe('Security Group Resources', () => {
    test('should have ClusterSecurityGroup', () => {
      expect(template.Resources.ClusterSecurityGroup).toBeDefined();
      expect(template.Resources.ClusterSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have NodeSecurityGroup', () => {
      expect(template.Resources.NodeSecurityGroup).toBeDefined();
      expect(template.Resources.NodeSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ClusterSecurityGroup should allow HTTPS from VPC CIDR', () => {
      const ingress = template.Resources.ClusterSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.length).toBeGreaterThan(0);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(443);
      expect(ingress[0].ToPort).toBe(443);
      expect(ingress[0].CidrIp).toBe('10.0.0.0/16');
    });

    test('NodeSecurityGroup should have kubernetes cluster tags', () => {
      const tags = template.Resources.NodeSecurityGroup.Properties.Tags;
      const k8sTag = tags.find(tag => typeof tag.Key === 'object' && tag.Key['Fn::Sub']);
      expect(k8sTag).toBeDefined();
      expect(k8sTag.Value).toBe('owned');
    });

    test('should have NodeSecurityGroupSelfIngress', () => {
      expect(template.Resources.NodeSecurityGroupSelfIngress).toBeDefined();
      expect(template.Resources.NodeSecurityGroupSelfIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
    });

    test('should have ClusterToNodeSecurityGroupIngress', () => {
      expect(template.Resources.ClusterToNodeSecurityGroupIngress).toBeDefined();
      expect(template.Resources.ClusterToNodeSecurityGroupIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
    });
  });

  describe('KMS Resources', () => {
    test('should have EncryptionKey', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('EncryptionKey should have key rotation enabled', () => {
      expect(template.Resources.EncryptionKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('EncryptionKey should have proper key policy', () => {
      const policy = template.Resources.EncryptionKey.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
      expect(policy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('should have EncryptionKeyAlias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.EncryptionKeyAlias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/eks-encryption-${EnvironmentSuffix}'
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have ClusterRole', () => {
      expect(template.Resources.ClusterRole).toBeDefined();
      expect(template.Resources.ClusterRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have NodeRole', () => {
      expect(template.Resources.NodeRole).toBeDefined();
      expect(template.Resources.NodeRole.Type).toBe('AWS::IAM::Role');
    });

    test('ClusterRole should have environmentSuffix in name', () => {
      expect(template.Resources.ClusterRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'eks-cluster-role-${EnvironmentSuffix}'
      });
    });

    test('NodeRole should have environmentSuffix in name', () => {
      expect(template.Resources.NodeRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'eks-node-role-${EnvironmentSuffix}'
      });
    });

    test('ClusterRole should have correct managed policies', () => {
      const policies = template.Resources.ClusterRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('NodeRole should have correct managed policies', () => {
      const policies = template.Resources.NodeRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have NodeInstanceProfile', () => {
      expect(template.Resources.NodeInstanceProfile).toBeDefined();
      expect(template.Resources.NodeInstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.NodeInstanceProfile.Properties.InstanceProfileName).toEqual({
        'Fn::Sub': 'eks-node-profile-${EnvironmentSuffix}'
      });
    });
  });

  describe('EKS Cluster Resources', () => {
    test('should have EKSCluster', () => {
      expect(template.Resources.EKSCluster).toBeDefined();
      expect(template.Resources.EKSCluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('EKSCluster should have environmentSuffix in name', () => {
      expect(template.Resources.EKSCluster.Properties.Name).toEqual({
        'Fn::Sub': 'eks-cluster-${EnvironmentSuffix}'
      });
    });

    test('EKSCluster should have correct version', () => {
      expect(template.Resources.EKSCluster.Properties.Version).toBe('1.28');
    });

    test('EKSCluster should have private endpoint access enabled', () => {
      const vpcConfig = template.Resources.EKSCluster.Properties.ResourcesVpcConfig;
      expect(vpcConfig.EndpointPrivateAccess).toBe(true);
    });

    test('EKSCluster should have public endpoint access disabled', () => {
      const vpcConfig = template.Resources.EKSCluster.Properties.ResourcesVpcConfig;
      expect(vpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('EKSCluster should have encryption config', () => {
      const encryptionConfig = template.Resources.EKSCluster.Properties.EncryptionConfig;
      expect(encryptionConfig).toBeDefined();
      expect(Array.isArray(encryptionConfig)).toBe(true);
      expect(encryptionConfig[0].Resources).toContain('secrets');
    });

    test('EKSCluster should have logging enabled', () => {
      const logging = template.Resources.EKSCluster.Properties.Logging;
      expect(logging).toBeDefined();
      expect(logging.ClusterLogging).toBeDefined();
      expect(logging.ClusterLogging.EnabledTypes).toBeDefined();
      expect(logging.ClusterLogging.EnabledTypes.length).toBeGreaterThan(0);
    });

    test('should have OIDCProvider', () => {
      expect(template.Resources.OIDCProvider).toBeDefined();
      expect(template.Resources.OIDCProvider.Type).toBe('AWS::IAM::OIDCProvider');
    });
  });

  describe('Node Group Resources', () => {
    test('should have ManagedNodeGroup', () => {
      expect(template.Resources.ManagedNodeGroup).toBeDefined();
      expect(template.Resources.ManagedNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('ManagedNodeGroup should depend on OIDCProvider', () => {
      expect(template.Resources.ManagedNodeGroup.DependsOn).toContain('OIDCProvider');
    });

    test('ManagedNodeGroup should have environmentSuffix in name', () => {
      expect(template.Resources.ManagedNodeGroup.Properties.NodegroupName).toEqual({
        'Fn::Sub': 'managed-nodes-${EnvironmentSuffix}'
      });
    });

    test('ManagedNodeGroup should have correct scaling config', () => {
      const scaling = template.Resources.ManagedNodeGroup.Properties.ScalingConfig;
      expect(scaling.MinSize).toBe(2);
      expect(scaling.MaxSize).toBe(6);
      expect(scaling.DesiredSize).toBe(2);
    });

    test('should have SelfManagedLaunchTemplate', () => {
      expect(template.Resources.SelfManagedLaunchTemplate).toBeDefined();
      expect(template.Resources.SelfManagedLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('SelfManagedLaunchTemplate should have IMDSv2 required', () => {
      const metadata = template.Resources.SelfManagedLaunchTemplate.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
      expect(metadata.HttpPutResponseHopLimit).toBe(1);
    });

    test('should have SelfManagedAutoScalingGroup', () => {
      expect(template.Resources.SelfManagedAutoScalingGroup).toBeDefined();
      expect(template.Resources.SelfManagedAutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('SelfManagedAutoScalingGroup should depend on OIDCProvider', () => {
      expect(template.Resources.SelfManagedAutoScalingGroup.DependsOn).toContain('OIDCProvider');
    });
  });

  describe('Outputs', () => {
    test('should have ClusterName output', () => {
      expect(template.Outputs.ClusterName).toBeDefined();
      expect(template.Outputs.ClusterName.Description).toBeDefined();
      expect(template.Outputs.ClusterName.Value).toEqual({ Ref: 'EKSCluster' });
    });

    test('should have ClusterEndpoint output', () => {
      expect(template.Outputs.ClusterEndpoint).toBeDefined();
      expect(template.Outputs.ClusterEndpoint.Description).toBeDefined();
    });

    test('should have ClusterArn output', () => {
      expect(template.Outputs.ClusterArn).toBeDefined();
      expect(template.Outputs.ClusterArn.Description).toBeDefined();
    });

    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have PrivateSubnetIds output', () => {
      expect(template.Outputs.PrivateSubnetIds).toBeDefined();
      expect(template.Outputs.PrivateSubnetIds.Description).toBeDefined();
    });

    test('should have OIDCProviderArn output', () => {
      expect(template.Outputs.OIDCProviderArn).toBeDefined();
      expect(template.Outputs.OIDCProviderArn.Value).toEqual({ Ref: 'OIDCProvider' });
    });

    test('should have NodeRoleArn output', () => {
      expect(template.Outputs.NodeRoleArn).toBeDefined();
    });

    test('should have EncryptionKeyArn output', () => {
      expect(template.Outputs.EncryptionKeyArn).toBeDefined();
    });

    test('all outputs should have Export names with environmentSuffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('EKSCluster should reference ClusterRole', () => {
      expect(template.Resources.EKSCluster.Properties.RoleArn).toEqual({
        'Fn::GetAtt': ['ClusterRole', 'Arn']
      });
    });

    test('ManagedNodeGroup should reference EKSCluster', () => {
      expect(template.Resources.ManagedNodeGroup.Properties.ClusterName).toEqual({
        Ref: 'EKSCluster'
      });
    });

    test('ManagedNodeGroup should reference NodeRole', () => {
      expect(template.Resources.ManagedNodeGroup.Properties.NodeRole).toEqual({
        'Fn::GetAtt': ['NodeRole', 'Arn']
      });
    });

    test('OIDCProvider should reference EKSCluster endpoint', () => {
      expect(template.Resources.OIDCProvider.Properties.Url).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'OpenIdConnectIssuerUrl']
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources should have DeletionPolicy Retain', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('KMS key should have key rotation enabled', () => {
      expect(template.Resources.EncryptionKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('EKS cluster should have private endpoint', () => {
      const vpcConfig = template.Resources.EKSCluster.Properties.ResourcesVpcConfig;
      expect(vpcConfig.EndpointPrivateAccess).toBe(true);
    });

    test('Launch template should require IMDSv2', () => {
      const metadata = template.Resources.SelfManagedLaunchTemplate.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
    });
  });

  describe('Naming Conventions', () => {
    test('all IAM roles should include environmentSuffix', () => {
      expect(template.Resources.ClusterRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(template.Resources.NodeRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('EKS cluster should include environmentSuffix', () => {
      expect(template.Resources.EKSCluster.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('node groups should include environmentSuffix', () => {
      expect(template.Resources.ManagedNodeGroup.Properties.NodegroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('all tagged resources should include environmentSuffix in name', () => {
      ['VPC', 'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3', 'ClusterSecurityGroup', 'NodeSecurityGroup', 'PrivateRouteTable'].forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find(tag => tag.Key === 'Name');
          if (nameTag && typeof nameTag.Value === 'object') {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });
});
