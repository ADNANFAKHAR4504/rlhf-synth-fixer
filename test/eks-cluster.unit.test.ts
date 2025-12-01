import * as EKSTemplate from '../lib/eks-cluster';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('EKS Cluster CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    template = EKSTemplate.getTemplate();
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

    test('should pass template validation', () => {
      expect(EKSTemplate.validateTemplate(template)).toBe(true);
    });

    test('should fail validation with incomplete template', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09' };
      expect(EKSTemplate.validateTemplate(invalidTemplate)).toBe(false);
    });

    test('should fail validation without AWSTemplateFormatVersion', () => {
      const invalidTemplate = { Description: 'test', Parameters: {}, Resources: {}, Outputs: {} };
      expect(EKSTemplate.validateTemplate(invalidTemplate)).toBe(false);
    });

    test('should fail validation without Description', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09', Parameters: {}, Resources: {}, Outputs: {} };
      expect(EKSTemplate.validateTemplate(invalidTemplate)).toBe(false);
    });

    test('should fail validation without Parameters', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09', Description: 'test', Resources: {}, Outputs: {} };
      expect(EKSTemplate.validateTemplate(invalidTemplate)).toBe(false);
    });

    test('should fail validation without Resources', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09', Description: 'test', Parameters: {}, Outputs: {} };
      expect(EKSTemplate.validateTemplate(invalidTemplate)).toBe(false);
    });

    test('should fail validation without Outputs', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09', Description: 'test', Parameters: {}, Resources: {} };
      expect(EKSTemplate.validateTemplate(invalidTemplate)).toBe(false);
    });
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

    test('should have VpcId parameter', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('AWS::EC2::VPC::Id');
    });

    test('should have PrivateSubnetIds parameter', () => {
      expect(template.Parameters.PrivateSubnetIds).toBeDefined();
      expect(template.Parameters.PrivateSubnetIds.Type).toBe('List<AWS::EC2::Subnet::Id>');
    });

    test('should have KubernetesVersion parameter', () => {
      expect(template.Parameters.KubernetesVersion).toBeDefined();
      expect(template.Parameters.KubernetesVersion.Type).toBe('String');
      expect(template.Parameters.KubernetesVersion.Default).toBe('1.28');
      expect(template.Parameters.KubernetesVersion.AllowedValues).toContain('1.28');
      expect(template.Parameters.KubernetesVersion.AllowedValues).toContain('1.29');
      expect(template.Parameters.KubernetesVersion.AllowedValues).toContain('1.30');
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

    test('EKSCluster should reference VpcId parameter', () => {
      const sg = template.Resources.ClusterSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VpcId' });
    });

    test('EKSCluster should reference PrivateSubnetIds parameter', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.SubnetIds).toEqual({ Ref: 'PrivateSubnetIds' });
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

    test('GeneralNodeGroup should depend on EKSCluster', () => {
      const nodeGroup = template.Resources.GeneralNodeGroup;
      expect(nodeGroup.DependsOn).toBe('EKSCluster');
    });

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

    test('ComputeNodeGroup should depend on EKSCluster', () => {
      const nodeGroup = template.Resources.ComputeNodeGroup;
      expect(nodeGroup.DependsOn).toBe('EKSCluster');
    });

    test('both node groups should use private subnets', () => {
      const generalNodeGroup = template.Resources.GeneralNodeGroup;
      const computeNodeGroup = template.Resources.ComputeNodeGroup;
      expect(generalNodeGroup.Properties.Subnets).toEqual({ Ref: 'PrivateSubnetIds' });
      expect(computeNodeGroup.Properties.Subnets).toEqual({ Ref: 'PrivateSubnetIds' });
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

    test('FargateProfile should depend on EKSCluster', () => {
      const profile = template.Resources.FargateProfile;
      expect(profile.DependsOn).toBe('EKSCluster');
    });

    test('FargateProfile should have kube-system selector', () => {
      const profile = template.Resources.FargateProfile;
      expect(profile.Properties.Selectors).toBeDefined();
      expect(profile.Properties.Selectors[0].Namespace).toBe('kube-system');
      expect(profile.Properties.Selectors[0].Labels['k8s-app']).toBe('kube-dns');
    });

    test('FargateProfile should use private subnets', () => {
      const profile = template.Resources.FargateProfile;
      expect(profile.Properties.Subnets).toEqual({ Ref: 'PrivateSubnetIds' });
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
    test('should have exactly 11 resources', () => {
      const resourceKeys = Object.keys(template.Resources);
      expect(resourceKeys.length).toBe(11);
      expect(EKSTemplate.getResourceCount(template)).toBe(11);
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
      expect(EKSTemplate.getIAMRoles(template).length).toBe(5);
    });

    test('should have 2 EKS node groups', () => {
      const nodeGroups = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EKS::Nodegroup');
      expect(nodeGroups.length).toBe(2);
      expect(EKSTemplate.getEKSNodeGroups(template).length).toBe(2);
    });

    test('should have 1 security group', () => {
      const securityGroups = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EC2::SecurityGroup');
      expect(securityGroups.length).toBe(1);
      expect(EKSTemplate.getSecurityGroups(template).length).toBe(1);
    });

    test('should have 1 EKS cluster', () => {
      const clusters = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EKS::Cluster');
      expect(clusters.length).toBe(1);
      expect(EKSTemplate.getResourcesByType(template, 'AWS::EKS::Cluster').length).toBe(1);
    });

    test('should have 1 OIDC provider', () => {
      const oidcProviders = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::IAM::OIDCProvider');
      expect(oidcProviders.length).toBe(1);
      expect(EKSTemplate.getResourcesByType(template, 'AWS::IAM::OIDCProvider').length).toBe(1);
    });

    test('should have 1 Fargate profile', () => {
      const fargateProfiles = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EKS::FargateProfile');
      expect(fargateProfiles.length).toBe(1);
      expect(EKSTemplate.getResourcesByType(template, 'AWS::EKS::FargateProfile').length).toBe(1);
    });
  });

  describe('Template Validation Functions', () => {
    test('should validate EnvironmentSuffix usage', () => {
      expect(EKSTemplate.validateEnvironmentSuffix(template)).toBe(true);
    });

    test('should fail validation without EnvironmentSuffix parameter', () => {
      const invalidTemplate = { ...template };
      delete invalidTemplate.Parameters.EnvironmentSuffix;
      expect(EKSTemplate.validateEnvironmentSuffix(invalidTemplate)).toBe(false);
    });

    test('should get all outputs', () => {
      const outputs = EKSTemplate.getOutputs(template);
      expect(outputs.length).toBe(9);
      expect(outputs).toContain('ClusterName');
      expect(outputs).toContain('ClusterEndpoint');
    });

    test('should validate output exports', () => {
      expect(EKSTemplate.validateOutputExports(template)).toBe(true);
    });

    test('should fail validation with missing exports', () => {
      const invalidTemplate = { ...template };
      invalidTemplate.Outputs = {
        TestOutput: {
          Value: 'test'
        }
      };
      expect(EKSTemplate.validateOutputExports(invalidTemplate)).toBe(false);
    });

    test('should fail validation with exports missing Name', () => {
      const invalidTemplate = { ...template };
      invalidTemplate.Outputs = {
        TestOutput: {
          Value: 'test',
          Export: {}
        }
      };
      expect(EKSTemplate.validateOutputExports(invalidTemplate)).toBe(false);
    });

    test('should validate tags for IAM roles', () => {
      expect(EKSTemplate.validateTags(template, 'EKSClusterRole', ['Environment', 'ManagedBy'])).toBe(true);
    });

    test('should fail tag validation with missing tags', () => {
      expect(EKSTemplate.validateTags(template, 'EKSClusterRole', ['NonExistentTag'])).toBe(false);
    });

    test('should fail tag validation for non-existent resource', () => {
      expect(EKSTemplate.validateTags(template, 'NonExistentResource', ['Environment'])).toBe(false);
    });

    test('should get Kubernetes version', () => {
      const version = EKSTemplate.getKubernetesVersion(template);
      expect(version).toBe('1.28');
    });

    test('should validate CloudWatch logging', () => {
      expect(EKSTemplate.validateLogging(template)).toBe(true);
    });

    test('should fail logging validation without logging configuration', () => {
      const invalidTemplate = { ...template };
      invalidTemplate.Resources = {
        EKSCluster: {
          Type: 'AWS::EKS::Cluster',
          Properties: {}
        }
      };
      expect(EKSTemplate.validateLogging(invalidTemplate)).toBe(false);
    });

    test('should fail logging validation with incomplete log types', () => {
      const invalidTemplate = { ...template };
      invalidTemplate.Resources = {
        EKSCluster: {
          Type: 'AWS::EKS::Cluster',
          Properties: {
            Logging: {
              ClusterLogging: {
                EnabledTypes: [
                  { Type: 'api' },
                  { Type: 'audit' }
                ]
              }
            }
          }
        }
      };
      expect(EKSTemplate.validateLogging(invalidTemplate)).toBe(false);
    });

    test('should validate private endpoint configuration', () => {
      expect(EKSTemplate.validatePrivateEndpoint(template)).toBe(true);
    });

    test('should fail private endpoint validation without VPC config', () => {
      const invalidTemplate = { ...template };
      invalidTemplate.Resources = {
        EKSCluster: {
          Type: 'AWS::EKS::Cluster',
          Properties: {}
        }
      };
      expect(EKSTemplate.validatePrivateEndpoint(invalidTemplate)).toBe(false);
    });

    test('should fail private endpoint validation with public access enabled', () => {
      const invalidTemplate = { ...template };
      invalidTemplate.Resources = {
        EKSCluster: {
          Type: 'AWS::EKS::Cluster',
          Properties: {
            ResourcesVpcConfig: {
              EndpointPrivateAccess: true,
              EndpointPublicAccess: true
            }
          }
        }
      };
      expect(EKSTemplate.validatePrivateEndpoint(invalidTemplate)).toBe(false);
    });

    test('should validate node group scaling for GeneralNodeGroup', () => {
      expect(EKSTemplate.validateNodeGroupScaling(template, 'GeneralNodeGroup', 2, 6)).toBe(true);
    });

    test('should validate node group scaling for ComputeNodeGroup', () => {
      expect(EKSTemplate.validateNodeGroupScaling(template, 'ComputeNodeGroup', 1, 4)).toBe(true);
    });

    test('should fail node group scaling validation with wrong values', () => {
      expect(EKSTemplate.validateNodeGroupScaling(template, 'GeneralNodeGroup', 1, 10)).toBe(false);
    });

    test('should fail node group scaling validation for non-existent node group', () => {
      expect(EKSTemplate.validateNodeGroupScaling(template, 'NonExistentNodeGroup', 2, 6)).toBe(false);
    });

    test('should validate OIDC provider configuration', () => {
      expect(EKSTemplate.validateOIDCProvider(template)).toBe(true);
    });

    test('should fail OIDC validation without provider', () => {
      const invalidTemplate = { ...template };
      invalidTemplate.Resources = {};
      expect(EKSTemplate.validateOIDCProvider(invalidTemplate)).toBe(false);
    });

    test('should validate Fargate profile configuration', () => {
      expect(EKSTemplate.validateFargateProfile(template)).toBe(true);
    });

    test('should fail Fargate validation without profile', () => {
      const invalidTemplate = { ...template };
      invalidTemplate.Resources = {};
      expect(EKSTemplate.validateFargateProfile(invalidTemplate)).toBe(false);
    });
  });
});
