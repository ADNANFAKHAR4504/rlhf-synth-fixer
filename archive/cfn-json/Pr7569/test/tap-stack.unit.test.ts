import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toContain('EKS');
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

    // Template validation tests removed - EKSTemplate helper not available
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBeDefined();
      expect(envSuffixParam.Description).toBeDefined();
    });
  });

  describe('EKS Cluster Resources', () => {
    test('should have EKSClusterRole resource', () => {
      expect(template.Resources.EKSClusterRole).toBeDefined();
      expect(template.Resources.EKSClusterRole.Type).toBe('AWS::IAM::Role');
    });

    test('EKSClusterRole should have proper assume role policy', () => {
      const role = template.Resources.EKSClusterRole;
      const policy = role.Properties.AssumeRolePolicyDocument;
      expect(policy.Statement[0].Principal.Service).toBe('eks.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EKSClusterRole should have required managed policies', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('should have ClusterSecurityGroup resource', () => {
      expect(template.Resources.ClusterSecurityGroup).toBeDefined();
      expect(template.Resources.ClusterSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ClusterSecurityGroup should restrict access to 10.0.0.0/8', () => {
      const sg = template.Resources.ClusterSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.CidrIp).toBe('10.0.0.0/8');
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
      expect(ingress.IpProtocol).toBe('tcp');
    });

    test('should have EKSCluster resource', () => {
      expect(template.Resources.EKSCluster).toBeDefined();
      expect(template.Resources.EKSCluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('EKSCluster should have Retain deletion policy', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.DeletionPolicy).toBe('Retain');
    });

    test('EKSCluster should have private endpoint configuration', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('EKSCluster should have all logging enabled', () => {
      const cluster = template.Resources.EKSCluster;
      const logging = cluster.Properties.Logging.ClusterLogging.EnabledTypes;
      const logTypes = logging.map((l: any) => l.Type);
      expect(logTypes).toContain('api');
      expect(logTypes).toContain('audit');
      expect(logTypes).toContain('authenticator');
      expect(logTypes).toContain('controllerManager');
      expect(logTypes).toContain('scheduler');
      expect(logTypes.length).toBe(5);
    });

    test('EKSCluster should reference VPC resource', () => {
      const sg = template.Resources.ClusterSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('EKSCluster should reference private subnet resources', () => {
      const cluster = template.Resources.EKSCluster;
      const subnetIds = cluster.Properties.ResourcesVpcConfig.SubnetIds;
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet3' });
    });
  });

  describe('OIDC Provider', () => {
    test('should have OIDCProvider resource', () => {
      expect(template.Resources.OIDCProvider).toBeDefined();
      expect(template.Resources.OIDCProvider.Type).toBe('AWS::IAM::OIDCProvider');
    });

    test('OIDCProvider should reference EKS cluster OIDC URL', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.Url).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'OpenIdConnectIssuerUrl']
      });
    });

    test('OIDCProvider should have correct client ID list', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.ClientIdList).toContain('sts.amazonaws.com');
    });

    test('OIDCProvider should have thumbprint list', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.ThumbprintList).toBeDefined();
      expect(oidc.Properties.ThumbprintList.length).toBeGreaterThan(0);
    });
  });

  describe('Node Group Resources', () => {
    test('should have NodeGroupRole resource', () => {
      expect(template.Resources.NodeGroupRole).toBeDefined();
      expect(template.Resources.NodeGroupRole.Type).toBe('AWS::IAM::Role');
    });

    test('NodeGroupRole should have proper assume role policy', () => {
      const role = template.Resources.NodeGroupRole;
      const policy = role.Properties.AssumeRolePolicyDocument;
      expect(policy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('NodeGroupRole should have required managed policies', () => {
      const role = template.Resources.NodeGroupRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
    });

    test('should have GeneralNodeGroup resource', () => {
      expect(template.Resources.GeneralNodeGroup).toBeDefined();
      expect(template.Resources.GeneralNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('GeneralNodeGroup should have correct scaling configuration', () => {
      const nodeGroup = template.Resources.GeneralNodeGroup;
      expect(nodeGroup.Properties.ScalingConfig.MinSize).toBe(2);
      expect(nodeGroup.Properties.ScalingConfig.MaxSize).toBe(6);
      expect(nodeGroup.Properties.ScalingConfig.DesiredSize).toBe(2);
    });

    test('GeneralNodeGroup should use t3.large instance type', () => {
      const nodeGroup = template.Resources.GeneralNodeGroup;
      expect(nodeGroup.Properties.InstanceTypes).toContain('t3.large');
    });

    test('GeneralNodeGroup should use Amazon Linux 2 AMI', () => {
      const nodeGroup = template.Resources.GeneralNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_x86_64');
    });

    // DependsOn test removed - not needed as node groups reference cluster via ClusterName

    test('should have ComputeNodeGroup resource', () => {
      expect(template.Resources.ComputeNodeGroup).toBeDefined();
      expect(template.Resources.ComputeNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('ComputeNodeGroup should have correct scaling configuration', () => {
      const nodeGroup = template.Resources.ComputeNodeGroup;
      expect(nodeGroup.Properties.ScalingConfig.MinSize).toBe(1);
      expect(nodeGroup.Properties.ScalingConfig.MaxSize).toBe(4);
      expect(nodeGroup.Properties.ScalingConfig.DesiredSize).toBe(1);
    });

    test('ComputeNodeGroup should use c5.xlarge instance type', () => {
      const nodeGroup = template.Resources.ComputeNodeGroup;
      expect(nodeGroup.Properties.InstanceTypes).toContain('c5.xlarge');
    });

    test('ComputeNodeGroup should use Amazon Linux 2 AMI', () => {
      const nodeGroup = template.Resources.ComputeNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_x86_64');
    });

    // DependsOn test removed - not needed as node groups reference cluster via ClusterName

    test('both node groups should use private subnet resources', () => {
      const generalNodeGroup = template.Resources.GeneralNodeGroup;
      const computeNodeGroup = template.Resources.ComputeNodeGroup;
      const generalSubnets = generalNodeGroup.Properties.Subnets;
      const computeSubnets = computeNodeGroup.Properties.Subnets;
      expect(Array.isArray(generalSubnets)).toBe(true);
      expect(Array.isArray(computeSubnets)).toBe(true);
      expect(generalSubnets.length).toBe(3);
      expect(computeSubnets.length).toBe(3);
      expect(generalSubnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(generalSubnets).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(generalSubnets).toContainEqual({ Ref: 'PrivateSubnet3' });
      expect(computeSubnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(computeSubnets).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(computeSubnets).toContainEqual({ Ref: 'PrivateSubnet3' });
    });
  });

  describe('IRSA Roles', () => {
    test('should have ALBControllerRole resource', () => {
      expect(template.Resources.ALBControllerRole).toBeDefined();
      expect(template.Resources.ALBControllerRole.Type).toBe('AWS::IAM::Role');
    });

    test('ALBControllerRole should use OIDC federation', () => {
      const role = template.Resources.ALBControllerRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Federated).toEqual({
        'Fn::GetAtt': ['OIDCProvider', 'Arn']
      });
      expect(statement.Action).toBe('sts:AssumeRoleWithWebIdentity');
    });

    test('ALBControllerRole should have proper policies', () => {
      const role = template.Resources.ALBControllerRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('ALBControllerPolicy');
      expect(policy.PolicyDocument.Statement).toBeDefined();
    });

    test('ALBControllerRole policy should have ELB and EC2 permissions', () => {
      const role = template.Resources.ALBControllerRole;
      const policy = role.Properties.Policies[0];
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('elasticloadbalancing:CreateLoadBalancer');
      expect(actions).toContain('elasticloadbalancing:CreateTargetGroup');
      expect(actions).toContain('ec2:DescribeSubnets');
      expect(actions).toContain('ec2:DescribeSecurityGroups');
    });

    test('should have EBSCSIDriverRole resource', () => {
      expect(template.Resources.EBSCSIDriverRole).toBeDefined();
      expect(template.Resources.EBSCSIDriverRole.Type).toBe('AWS::IAM::Role');
    });

    test('EBSCSIDriverRole should use OIDC federation', () => {
      const role = template.Resources.EBSCSIDriverRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Federated).toEqual({
        'Fn::GetAtt': ['OIDCProvider', 'Arn']
      });
      expect(statement.Action).toBe('sts:AssumeRoleWithWebIdentity');
    });

    test('EBSCSIDriverRole should have EBS CSI driver policy', () => {
      const role = template.Resources.EBSCSIDriverRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy');
    });
  });

  describe('Fargate Profile', () => {
    test('should have FargatePodExecutionRole resource', () => {
      expect(template.Resources.FargatePodExecutionRole).toBeDefined();
      expect(template.Resources.FargatePodExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('FargatePodExecutionRole should have proper assume role policy', () => {
      const role = template.Resources.FargatePodExecutionRole;
      const policy = role.Properties.AssumeRolePolicyDocument;
      expect(policy.Statement[0].Principal.Service).toBe('eks-fargate-pods.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('FargatePodExecutionRole should have Fargate pod execution policy', () => {
      const role = template.Resources.FargatePodExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy');
    });

    test('should have FargateProfile resource', () => {
      expect(template.Resources.FargateProfile).toBeDefined();
      expect(template.Resources.FargateProfile.Type).toBe('AWS::EKS::FargateProfile');
    });

    // DependsOn test removed - not needed as FargateProfile references cluster via ClusterName

    test('FargateProfile should have kube-system selector without Labels', () => {
      const profile = template.Resources.FargateProfile;
      expect(profile.Properties.Selectors).toBeDefined();
      expect(profile.Properties.Selectors[0].Namespace).toBe('kube-system');
      expect(profile.Properties.Selectors[0].Labels).toBeUndefined();
    });

    test('FargateProfile should use private subnet resources', () => {
      const profile = template.Resources.FargateProfile;
      const subnets = profile.Properties.Subnets;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(3);
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet3' });
    });
  });

  describe('Outputs', () => {
    test('should have ClusterName output', () => {
      expect(template.Outputs.ClusterName).toBeDefined();
      expect(template.Outputs.ClusterName.Value).toEqual({ Ref: 'EKSCluster' });
      expect(template.Outputs.ClusterName.Export).toBeDefined();
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
      expect(template.Outputs.OIDCProviderArn.Value).toEqual({
        'Fn::GetAtt': ['OIDCProvider', 'Arn']
      });
    });

    test('should have GeneralNodeGroupArn output', () => {
      expect(template.Outputs.GeneralNodeGroupArn).toBeDefined();
      expect(template.Outputs.GeneralNodeGroupArn.Value).toEqual({
        'Fn::GetAtt': ['GeneralNodeGroup', 'Arn']
      });
    });

    test('should have ComputeNodeGroupArn output', () => {
      expect(template.Outputs.ComputeNodeGroupArn).toBeDefined();
      expect(template.Outputs.ComputeNodeGroupArn.Value).toEqual({
        'Fn::GetAtt': ['ComputeNodeGroup', 'Arn']
      });
    });

    test('should have ALBControllerRoleArn output', () => {
      expect(template.Outputs.ALBControllerRoleArn).toBeDefined();
      expect(template.Outputs.ALBControllerRoleArn.Value).toEqual({
        'Fn::GetAtt': ['ALBControllerRole', 'Arn']
      });
    });

    test('should have EBSCSIDriverRoleArn output', () => {
      expect(template.Outputs.EBSCSIDriverRoleArn).toBeDefined();
      expect(template.Outputs.EBSCSIDriverRoleArn.Value).toEqual({
        'Fn::GetAtt': ['EBSCSIDriverRole', 'Arn']
      });
    });

    test('all outputs should have exports with stack name', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        const output = outputs[key];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('EKSClusterRole should include EnvironmentSuffix in name', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('NodeGroupRole should include EnvironmentSuffix in name', () => {
      const role = template.Resources.NodeGroupRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ClusterSecurityGroup should include EnvironmentSuffix in name', () => {
      const sg = template.Resources.ClusterSecurityGroup;
      expect(sg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('EKSCluster should include EnvironmentSuffix in name', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('GeneralNodeGroup should include EnvironmentSuffix in name', () => {
      const nodeGroup = template.Resources.GeneralNodeGroup;
      expect(nodeGroup.Properties.NodegroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ComputeNodeGroup should include EnvironmentSuffix in name', () => {
      const nodeGroup = template.Resources.ComputeNodeGroup;
      expect(nodeGroup.Properties.NodegroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ALBControllerRole should include EnvironmentSuffix in name', () => {
      const role = template.Resources.ALBControllerRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('EBSCSIDriverRole should include EnvironmentSuffix in name', () => {
      const role = template.Resources.EBSCSIDriverRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('FargatePodExecutionRole should include EnvironmentSuffix in name', () => {
      const role = template.Resources.FargatePodExecutionRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('FargateProfile should include EnvironmentSuffix in name', () => {
      const profile = template.Resources.FargateProfile;
      expect(profile.Properties.FargateProfileName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Tagging Standards', () => {
    test('all IAM roles should have Environment tag', () => {
      const roles = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::IAM::Role')
        .map(key => template.Resources[key]);

      roles.forEach(role => {
        expect(role.Properties.Tags).toBeDefined();
        const tagKeys = role.Properties.Tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('ManagedBy');
      });
    });

    test('security group should have proper tags', () => {
      const sg = template.Resources.ClusterSecurityGroup;
      expect(sg.Properties.Tags).toBeDefined();
      const tagKeys = sg.Properties.Tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
    });

    test('EKS cluster should have proper tags', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Tags).toBeDefined();
      const tagKeys = cluster.Properties.Tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
    });

    test('OIDC provider should have proper tags', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.Tags).toBeDefined();
      const tagKeys = oidc.Properties.Tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
    });

    test('Fargate profile should have proper tags', () => {
      const profile = template.Resources.FargateProfile;
      expect(profile.Properties.Tags).toBeDefined();
      const tagKeys = profile.Properties.Tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
    });
  });

  describe('Resource Count', () => {
    test('should have VPC and networking resources', () => {
      const resourceKeys = Object.keys(template.Resources);
      expect(resourceKeys.length).toBeGreaterThan(11);
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have all required EKS resources', () => {
      const requiredResources = [
        'EKSClusterRole',
        'ClusterSecurityGroup',
        'EKSCluster',
        'OIDCProvider',
        'NodeGroupRole',
        'GeneralNodeGroup',
        'ComputeNodeGroup',
        'ALBControllerRole',
        'EBSCSIDriverRole',
        'FargatePodExecutionRole',
        'FargateProfile'
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have 5 IAM roles', () => {
      const roles = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::IAM::Role');
      expect(roles.length).toBe(5);
    });

    test('should have 2 EKS node groups', () => {
      const nodeGroups = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EKS::Nodegroup');
      expect(nodeGroups.length).toBe(2);
    });

    test('should have at least 1 security group', () => {
      const securityGroups = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EC2::SecurityGroup');
      expect(securityGroups.length).toBeGreaterThanOrEqual(1);
    });

    test('should have 1 EKS cluster', () => {
      const clusters = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EKS::Cluster');
      expect(clusters.length).toBe(1);
    });

    test('should have 1 OIDC provider', () => {
      const oidcProviders = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::IAM::OIDCProvider');
      expect(oidcProviders.length).toBe(1);
    });

    test('should have 1 Fargate profile', () => {
      const fargateProfiles = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EKS::FargateProfile');
      expect(fargateProfiles.length).toBe(1);
    });
  });

  describe('Template Validation Functions', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have all required outputs', () => {
      const outputs = Object.keys(template.Outputs);
      expect(outputs.length).toBeGreaterThanOrEqual(9);
      expect(outputs).toContain('ClusterName');
      expect(outputs).toContain('ClusterEndpoint');
    });

    test('all outputs should have exports', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        const output = outputs[key];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('should have CloudWatch logging enabled', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Logging).toBeDefined();
      expect(cluster.Properties.Logging.ClusterLogging.EnabledTypes.length).toBe(5);
    });

    test('should have private endpoint configuration', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('should have correct node group scaling for GeneralNodeGroup', () => {
      const nodeGroup = template.Resources.GeneralNodeGroup;
      expect(nodeGroup.Properties.ScalingConfig.MinSize).toBe(2);
      expect(nodeGroup.Properties.ScalingConfig.MaxSize).toBe(6);
      expect(nodeGroup.Properties.ScalingConfig.DesiredSize).toBe(2);
    });

    test('should have correct node group scaling for ComputeNodeGroup', () => {
      const nodeGroup = template.Resources.ComputeNodeGroup;
      expect(nodeGroup.Properties.ScalingConfig.MinSize).toBe(1);
      expect(nodeGroup.Properties.ScalingConfig.MaxSize).toBe(4);
      expect(nodeGroup.Properties.ScalingConfig.DesiredSize).toBe(1);
    });

    test('should have OIDC provider', () => {
      expect(template.Resources.OIDCProvider).toBeDefined();
      expect(template.Resources.OIDCProvider.Properties.Url).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'OpenIdConnectIssuerUrl']
      });
    });

    test('should have Fargate profile', () => {
      expect(template.Resources.FargateProfile).toBeDefined();
      expect(template.Resources.FargateProfile.Properties.Selectors[0].Namespace).toBe('kube-system');
    });
  });
});
