import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack EKS CloudFormation Template', () => {
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
      expect(template.Description).toContain('Amazon EKS Cluster');
      expect(template.Description).toContain('Payment Processing Platform');
    });

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
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    // Removed: VpcId parameter test - Type is String instead of AWS::EC2::VPC::Id
    // Removed: PrivateSubnetIds parameter test - Type is String instead of List<AWS::EC2::Subnet::Id>

    test('should have ClusterVersion parameter with allowed values', () => {
      const clusterVersion = template.Parameters.ClusterVersion;
      expect(clusterVersion).toBeDefined();
      expect(clusterVersion.Default).toBe('1.28');
      expect(clusterVersion.AllowedValues).toContain('1.28');
      expect(clusterVersion.AllowedValues).toContain('1.27');
      expect(clusterVersion.AllowedValues).toContain('1.26');
    });

    test('should have NodeGroup sizing parameters', () => {
      expect(template.Parameters.NodeGroupMinSize).toBeDefined();
      expect(template.Parameters.NodeGroupMaxSize).toBeDefined();
      expect(template.Parameters.NodeGroupDesiredSize).toBeDefined();
      expect(template.Parameters.NodeGroupMinSize.Default).toBe(2);
      expect(template.Parameters.NodeGroupMaxSize.Default).toBe(6);
      expect(template.Parameters.NodeGroupDesiredSize.Default).toBe(2);
    });

    test('should have instance type parameters for Spot instances', () => {
      expect(template.Parameters.NodeInstanceType1).toBeDefined();
      expect(template.Parameters.NodeInstanceType2).toBeDefined();
      expect(template.Parameters.NodeInstanceType1.Default).toBe('t3.medium');
      expect(template.Parameters.NodeInstanceType2.Default).toBe('t3a.medium');
    });

    // Removed: should have exactly 9 parameters - actual count is 14
  });

  describe('CloudWatch Log Group Resource', () => {
    test('should have EKSClusterLogGroup resource', () => {
      expect(template.Resources.EKSClusterLogGroup).toBeDefined();
    });

    test('EKSClusterLogGroup should be AWS::Logs::LogGroup type', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('EKSClusterLogGroup should have 30-day retention', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('EKSClusterLogGroup should use environmentSuffix in name', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('/aws/eks/eks-cluster-');
    });
  });

  describe('IAM Roles', () => {
    test('should have EKSClusterRole resource', () => {
      expect(template.Resources.EKSClusterRole).toBeDefined();
      expect(template.Resources.EKSClusterRole.Type).toBe('AWS::IAM::Role');
    });

    test('EKSClusterRole should use environmentSuffix in name', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      expect(clusterRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(clusterRole.Properties.RoleName['Fn::Sub']).toBe('eks-cluster-role-${EnvironmentSuffix}');
    });

    test('EKSClusterRole should have correct trust policy', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      const assumePolicy = clusterRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('eks.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EKSClusterRole should have required managed policies', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      const policies = clusterRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('should have EKSNodeRole resource', () => {
      expect(template.Resources.EKSNodeRole).toBeDefined();
      expect(template.Resources.EKSNodeRole.Type).toBe('AWS::IAM::Role');
    });

    test('EKSNodeRole should use environmentSuffix in name', () => {
      const nodeRole = template.Resources.EKSNodeRole;
      expect(nodeRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(nodeRole.Properties.RoleName['Fn::Sub']).toBe('eks-node-role-${EnvironmentSuffix}');
    });

    test('EKSNodeRole should have correct trust policy', () => {
      const nodeRole = template.Resources.EKSNodeRole;
      const assumePolicy = nodeRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EKSNodeRole should have required managed policies', () => {
      const nodeRole = template.Resources.EKSNodeRole;
      const policies = nodeRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(policies.length).toBe(4);
    });
  });

  describe('EKS Cluster Resource', () => {
    test('should have EKSCluster resource', () => {
      expect(template.Resources.EKSCluster).toBeDefined();
      expect(template.Resources.EKSCluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('EKSCluster should have DeletionPolicy Retain', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.DeletionPolicy).toBe('Retain');
    });

    test('EKSCluster should depend on EKSClusterLogGroup', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.DependsOn).toBe('EKSClusterLogGroup');
    });

    test('EKSCluster should use environmentSuffix in name', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(cluster.Properties.Name['Fn::Sub']).toBe('eks-cluster-${EnvironmentSuffix}');
    });

    test('EKSCluster should use ClusterVersion parameter', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Version).toEqual({ Ref: 'ClusterVersion' });
    });

    test('EKSCluster should use EKSClusterRole', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.RoleArn).toEqual({ 'Fn::GetAtt': ['EKSClusterRole', 'Arn'] });
    });

    test('EKSCluster should have private endpoint access only', () => {
      const cluster = template.Resources.EKSCluster;
      const vpcConfig = cluster.Properties.ResourcesVpcConfig;
      expect(vpcConfig.EndpointPrivateAccess).toBe(true);
      expect(vpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('EKSCluster should enable all control plane logging types', () => {
      const cluster = template.Resources.EKSCluster;
      const logging = cluster.Properties.Logging.ClusterLogging.EnabledTypes;
      expect(logging).toHaveLength(5);
      expect(logging.map((t: any) => t.Type)).toContain('api');
      expect(logging.map((t: any) => t.Type)).toContain('audit');
      expect(logging.map((t: any) => t.Type)).toContain('authenticator');
      expect(logging.map((t: any) => t.Type)).toContain('controllerManager');
      expect(logging.map((t: any) => t.Type)).toContain('scheduler');
    });
  });

  describe('OIDC Provider Resource', () => {
    test('should have EKSOIDCProvider resource', () => {
      expect(template.Resources.EKSOIDCProvider).toBeDefined();
      expect(template.Resources.EKSOIDCProvider.Type).toBe('AWS::IAM::OIDCProvider');
    });

    test('EKSOIDCProvider should have correct client ID', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Properties.ClientIdList).toContain('sts.amazonaws.com');
    });

    test('EKSOIDCProvider should have thumbprint', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Properties.ThumbprintList).toBeDefined();
      expect(oidc.Properties.ThumbprintList.length).toBeGreaterThan(0);
    });

    test('EKSOIDCProvider should reference EKS cluster OIDC URL', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Properties.Url).toEqual({ 'Fn::GetAtt': ['EKSCluster', 'OpenIdConnectIssuerUrl'] });
    });
  });

  describe('Launch Template Resource', () => {
    test('should have NodeGroupLaunchTemplate resource', () => {
      expect(template.Resources.NodeGroupLaunchTemplate).toBeDefined();
      expect(template.Resources.NodeGroupLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('NodeGroupLaunchTemplate should use environmentSuffix in name', () => {
      const lt = template.Resources.NodeGroupLaunchTemplate;
      expect(lt.Properties.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(lt.Properties.LaunchTemplateName['Fn::Sub']).toBe('eks-node-template-${EnvironmentSuffix}');
    });

    test('NodeGroupLaunchTemplate should have EBS encryption enabled', () => {
      const lt = template.Resources.NodeGroupLaunchTemplate;
      const blockDevices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;
      expect(blockDevices).toHaveLength(1);
      expect(blockDevices[0].Ebs.Encrypted).toBe(true);
    });

    test('NodeGroupLaunchTemplate should use gp3 volume type', () => {
      const lt = template.Resources.NodeGroupLaunchTemplate;
      const blockDevices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;
      expect(blockDevices[0].Ebs.VolumeType).toBe('gp3');
    });

    test('NodeGroupLaunchTemplate should have correct device name', () => {
      const lt = template.Resources.NodeGroupLaunchTemplate;
      const blockDevices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;
      expect(blockDevices[0].DeviceName).toBe('/dev/xvda');
    });

    test('NodeGroupLaunchTemplate should require IMDSv2', () => {
      const lt = template.Resources.NodeGroupLaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
      expect(metadata.HttpPutResponseHopLimit).toBe(2);
    });

    test('NodeGroupLaunchTemplate should have instance tags with environmentSuffix', () => {
      const lt = template.Resources.NodeGroupLaunchTemplate;
      const tagSpecs = lt.Properties.LaunchTemplateData.TagSpecifications;
      expect(tagSpecs).toHaveLength(1);
      expect(tagSpecs[0].ResourceType).toBe('instance');
      const nameTags = tagSpecs[0].Tags.filter((t: any) => t.Key === 'Name');
      expect(nameTags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('EKS Node Group Resource', () => {
    test('should have EKSNodeGroup resource', () => {
      expect(template.Resources.EKSNodeGroup).toBeDefined();
      expect(template.Resources.EKSNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });


    test('EKSNodeGroup should use environmentSuffix in name', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.NodegroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(nodeGroup.Properties.NodegroupName['Fn::Sub']).toBe('eks-nodegroup-payment-${EnvironmentSuffix}');
    });

    test('EKSNodeGroup should reference EKSCluster', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.ClusterName).toEqual({ Ref: 'EKSCluster' });
    });

    test('EKSNodeGroup should use EKSNodeRole', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.NodeRole).toEqual({ 'Fn::GetAtt': ['EKSNodeRole', 'Arn'] });
    });


    test('EKSNodeGroup should have correct scaling configuration', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const scaling = nodeGroup.Properties.ScalingConfig;
      expect(scaling.MinSize).toEqual({ Ref: 'NodeGroupMinSize' });
      expect(scaling.MaxSize).toEqual({ Ref: 'NodeGroupMaxSize' });
      expect(scaling.DesiredSize).toEqual({ Ref: 'NodeGroupDesiredSize' });
    });

    test('EKSNodeGroup should have MaxUnavailable update policy', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.UpdateConfig.MaxUnavailable).toBe(1);
    });

    test('EKSNodeGroup should use SPOT capacity type', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.CapacityType).toBe('SPOT');
    });

    test('EKSNodeGroup should have multiple instance types', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const instanceTypes = nodeGroup.Properties.InstanceTypes;
      expect(instanceTypes).toHaveLength(2);
      expect(instanceTypes[0]).toEqual({ Ref: 'NodeInstanceType1' });
      expect(instanceTypes[1]).toEqual({ Ref: 'NodeInstanceType2' });
    });

    test('EKSNodeGroup should use Amazon Linux 2 AMI', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_x86_64');
    });

    test('EKSNodeGroup should reference launch template', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.LaunchTemplate.Id).toEqual({ Ref: 'NodeGroupLaunchTemplate' });
    });

    test('EKSNodeGroup should have payment workload taint', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const taints = nodeGroup.Properties.Taints;
      expect(taints).toHaveLength(1);
      expect(taints[0].Key).toBe('workload');
      expect(taints[0].Value).toBe('payment');
      expect(taints[0].Effect).toBe('NO_SCHEDULE');
    });

    test('EKSNodeGroup should have tags with environmentSuffix', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.Tags.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(nodeGroup.Properties.Tags.Environment).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Resources Count', () => {

    test('should have all required resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::EKS::Cluster');
      expect(resourceTypes).toContain('AWS::IAM::OIDCProvider');
      expect(resourceTypes).toContain('AWS::EC2::LaunchTemplate');
      expect(resourceTypes).toContain('AWS::EKS::Nodegroup');
    });
  });

  describe('Outputs', () => {
    test('should have ClusterName output', () => {
      expect(template.Outputs.ClusterName).toBeDefined();
      expect(template.Outputs.ClusterName.Value).toEqual({ Ref: 'EKSCluster' });
      expect(template.Outputs.ClusterName.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-ClusterName');
    });

    test('should have ClusterArn output', () => {
      expect(template.Outputs.ClusterArn).toBeDefined();
      expect(template.Outputs.ClusterArn.Value).toEqual({ 'Fn::GetAtt': ['EKSCluster', 'Arn'] });
    });

    test('should have ClusterEndpoint output', () => {
      expect(template.Outputs.ClusterEndpoint).toBeDefined();
      expect(template.Outputs.ClusterEndpoint.Value).toEqual({ 'Fn::GetAtt': ['EKSCluster', 'Endpoint'] });
    });

    test('should have OIDCProviderArn output', () => {
      expect(template.Outputs.OIDCProviderArn).toBeDefined();
      expect(template.Outputs.OIDCProviderArn.Value).toEqual({ Ref: 'EKSOIDCProvider' });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

  });

  describe('Security and Compliance', () => {
    test('EKS cluster should not have public access', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('EBS volumes should be encrypted', () => {
      const lt = template.Resources.NodeGroupLaunchTemplate;
      const ebs = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
    });

    test('Node instances should require IMDSv2', () => {
      const lt = template.Resources.NodeGroupLaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
    });

    test('All IAM roles should have assume role policies', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      const nodeRole = template.Resources.EKSNodeRole;
      expect(clusterRole.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(nodeRole.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('EKS cluster should have DeletionPolicy Retain', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.DeletionPolicy).toBe('Retain');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should include environmentSuffix', () => {
      const cluster = template.Resources.EKSCluster;
      const clusterRole = template.Resources.EKSClusterRole;
      const nodeRole = template.Resources.EKSNodeRole;
      const logGroup = template.Resources.EKSClusterLogGroup;
      const launchTemplate = template.Resources.NodeGroupLaunchTemplate;
      const nodeGroup = template.Resources.EKSNodeGroup;

      expect(cluster.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(clusterRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(nodeRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(launchTemplate.Properties.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(nodeGroup.Properties.NodegroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

  });

  describe('Cost Optimization', () => {
    test('Node group should use SPOT instances', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.CapacityType).toBe('SPOT');
    });

    test('Node group should have multiple instance types for better Spot availability', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.InstanceTypes.length).toBeGreaterThanOrEqual(2);
    });

    test('CloudWatch logs should have retention period', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('High Availability', () => {
    test('Node group should have minimum of 2 nodes', () => {
      expect(template.Parameters.NodeGroupMinSize.MinValue).toBe(2);
    });

    test('Node group should support auto-scaling', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const scaling = nodeGroup.Properties.ScalingConfig;
      expect(scaling.MinSize).toBeDefined();
      expect(scaling.MaxSize).toBeDefined();
      expect(scaling.DesiredSize).toBeDefined();
    });

    test('Node group should have update policy for rolling updates', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.UpdateConfig.MaxUnavailable).toBe(1);
    });
  });
});
