import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - EKS Cluster', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template
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
      expect(template.Description).toContain('EKS cluster');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    // VpcId and PrivateSubnetIds parameters removed - using VPC resources instead

    test('should have KubernetesVersion parameter with valid versions', () => {
      const kubernetesVersion = template.Parameters.KubernetesVersion;
      expect(kubernetesVersion).toBeDefined();
      expect(kubernetesVersion.Type).toBe('String');
      expect(kubernetesVersion.Default).toBe('1.28');
      expect(kubernetesVersion.AllowedValues).toContain('1.28');
      expect(kubernetesVersion.AllowedValues).toContain('1.29');
      expect(kubernetesVersion.AllowedValues).toContain('1.30');
    });

    test('should have NodeInstanceType parameter with Graviton2 instances', () => {
      const nodeInstanceType = template.Parameters.NodeInstanceType;
      expect(nodeInstanceType).toBeDefined();
      expect(nodeInstanceType.Type).toBe('String');
      expect(nodeInstanceType.Default).toBe('t4g.medium');
      expect(nodeInstanceType.AllowedValues).toContain('t4g.medium');
      expect(nodeInstanceType.AllowedValues).toContain('t4g.large');
      expect(nodeInstanceType.AllowedValues).toContain('c6g.medium');
      expect(nodeInstanceType.AllowedValues).toContain('m6g.medium');
      // Should NOT contain x86 instances
      expect(nodeInstanceType.AllowedValues).not.toContain('t3.medium');
      expect(nodeInstanceType.AllowedValues).not.toContain('m5.large');
    });

    test('should have scaling parameters', () => {
      expect(template.Parameters.MinNodes).toBeDefined();
      expect(template.Parameters.MinNodes.Type).toBe('Number');
      expect(template.Parameters.MinNodes.Default).toBe(2);

      expect(template.Parameters.MaxNodes).toBeDefined();
      expect(template.Parameters.MaxNodes.Type).toBe('Number');
      expect(template.Parameters.MaxNodes.Default).toBe(10);

      expect(template.Parameters.DesiredNodes).toBeDefined();
      expect(template.Parameters.DesiredNodes.Type).toBe('Number');
      expect(template.Parameters.DesiredNodes.Default).toBe(2);
    });
  });

  describe('KMS Encryption Resources', () => {
    test('should have KMS key for EKS encryption', () => {
      expect(template.Resources.EKSEncryptionKey).toBeDefined();
      expect(template.Resources.EKSEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const kmsKey = template.Resources.EKSEncryptionKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.EKSEncryptionKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement.length).toBeGreaterThanOrEqual(2);

      // Check for EKS service permissions
      const eksStatement = kmsKey.Properties.KeyPolicy.Statement.find(
        (s: any) => s.Principal?.Service === 'eks.amazonaws.com'
      );
      expect(eksStatement).toBeDefined();
      expect(eksStatement.Action).toContain('kms:Decrypt');
      expect(eksStatement.Action).toContain('kms:DescribeKey');
      expect(eksStatement.Action).toContain('kms:CreateGrant');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.EKSEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EKSEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
      const alias = template.Resources.EKSEncryptionKeyAlias;
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/eks-${EnvironmentSuffix}',
      });
    });

    test('KMS resources should have EnvironmentSuffix in naming', () => {
      const kmsKey = template.Resources.EKSEncryptionKey;
      expect(kmsKey.Properties.Description).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });
  });

  describe('EKS Cluster IAM Role', () => {
    test('should have EKS cluster IAM role', () => {
      expect(template.Resources.EKSClusterRole).toBeDefined();
      expect(template.Resources.EKSClusterRole.Type).toBe('AWS::IAM::Role');
    });

    test('EKS cluster role should have explicit name with EnvironmentSuffix', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      expect(clusterRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'eks-cluster-role-${EnvironmentSuffix}',
      });
    });

    test('EKS cluster role should have correct assume role policy', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      expect(clusterRole.Properties.AssumeRolePolicyDocument).toBeDefined();
      const statement = clusterRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('eks.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('EKS cluster role should have AmazonEKSClusterPolicy', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      expect(clusterRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy'
      );
    });

    test('EKS cluster role should have tags', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      expect(clusterRole.Properties.Tags).toBeDefined();
      expect(clusterRole.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('EKS Cluster Security Group', () => {
    test('should have security group for EKS cluster', () => {
      expect(template.Resources.EKSClusterSecurityGroup).toBeDefined();
      expect(template.Resources.EKSClusterSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should have EnvironmentSuffix in name', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      expect(sg.Properties.GroupName).toEqual({
        'Fn::Sub': 'eks-cluster-sg-${EnvironmentSuffix}',
      });
    });

    test('security group should reference VPC resource', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should have EKS cluster resource', () => {
      expect(template.Resources.EKSCluster).toBeDefined();
      expect(template.Resources.EKSCluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('cluster should have name with EnvironmentSuffix', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Name).toEqual({
        'Fn::Sub': 'eks-cluster-${EnvironmentSuffix}',
      });
    });

    test('cluster should reference Kubernetes version parameter', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Version).toEqual({ Ref: 'KubernetesVersion' });
    });

    test('cluster should have private endpoint access only', () => {
      const cluster = template.Resources.EKSCluster;
      const vpcConfig = cluster.Properties.ResourcesVpcConfig;
      expect(vpcConfig.EndpointPrivateAccess).toBe(true);
      expect(vpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('cluster should use private subnet resources', () => {
      const cluster = template.Resources.EKSCluster;
      const vpcConfig = cluster.Properties.ResourcesVpcConfig;
      // Check that it uses subnet references
      expect(vpcConfig.SubnetIds).toBeDefined();
      expect(Array.isArray(vpcConfig.SubnetIds)).toBe(true);
    });

    test('cluster should have security group attached', () => {
      const cluster = template.Resources.EKSCluster;
      const vpcConfig = cluster.Properties.ResourcesVpcConfig;
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
      expect(vpcConfig.SecurityGroupIds.length).toBeGreaterThan(0);
    });

    test('cluster should have KMS encryption configured', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.EncryptionConfig).toBeDefined();
      expect(cluster.Properties.EncryptionConfig.length).toBe(1);
      expect(cluster.Properties.EncryptionConfig[0].Resources).toContain('secrets');
      expect(cluster.Properties.EncryptionConfig[0].Provider.KeyArn).toEqual({
        'Fn::GetAtt': ['EKSEncryptionKey', 'Arn'],
      });
    });

    test('cluster should have comprehensive logging enabled', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Logging).toBeDefined();
      expect(cluster.Properties.Logging.ClusterLogging).toBeDefined();
      const enabledTypes = cluster.Properties.Logging.ClusterLogging.EnabledTypes;
      expect(enabledTypes).toBeDefined();
      expect(enabledTypes.length).toBe(5);

      const logTypes = enabledTypes.map((t: any) => t.Type);
      expect(logTypes).toContain('api');
      expect(logTypes).toContain('audit');
      expect(logTypes).toContain('authenticator');
      expect(logTypes).toContain('controllerManager');
      expect(logTypes).toContain('scheduler');
    });
  });

  describe('OIDC Provider for IRSA', () => {
    test('should have OIDC provider resource', () => {
      expect(template.Resources.EKSOIDCProvider).toBeDefined();
      expect(template.Resources.EKSOIDCProvider.Type).toBe('AWS::IAM::OIDCProvider');
    });

    // DependsOn is implicit through Fn::GetAtt reference

    test('OIDC provider should use cluster OIDC issuer URL', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Properties.Url).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'OpenIdConnectIssuerUrl'],
      });
    });

    test('OIDC provider should have correct client ID list', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Properties.ClientIdList).toContain('sts.amazonaws.com');
    });

    test('OIDC provider should have valid thumbprint', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Properties.ThumbprintList).toBeDefined();
      expect(oidc.Properties.ThumbprintList.length).toBeGreaterThan(0);
    });
  });

  describe('EKS Node Group IAM Role', () => {
    test('should have node group IAM role', () => {
      expect(template.Resources.EKSNodeRole).toBeDefined();
      expect(template.Resources.EKSNodeRole.Type).toBe('AWS::IAM::Role');
    });

    test('node role should have explicit name with EnvironmentSuffix', () => {
      const nodeRole = template.Resources.EKSNodeRole;
      expect(nodeRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'eks-node-role-${EnvironmentSuffix}',
      });
    });

    test('node role should have correct assume role policy', () => {
      const nodeRole = template.Resources.EKSNodeRole;
      const statement = nodeRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('node role should have all required managed policies', () => {
      const nodeRole = template.Resources.EKSNodeRole;
      const policies = nodeRole.Properties.ManagedPolicyArns;

      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(policies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('node role should specifically have CloudWatch policy for Container Insights', () => {
      const nodeRole = template.Resources.EKSNodeRole;
      expect(nodeRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });
  });

  describe('EKS Managed Node Group', () => {
    test('should have EKS node group resource', () => {
      expect(template.Resources.EKSNodeGroup).toBeDefined();
      expect(template.Resources.EKSNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('node group should depend on OIDC provider', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.DependsOn).toBe('EKSOIDCProvider');
    });

    test('node group should have name with EnvironmentSuffix', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.NodegroupName).toEqual({
        'Fn::Sub': 'eks-nodegroup-${EnvironmentSuffix}',
      });
    });

    test('node group should use ARM64 AMI type (Graviton2)', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_ARM_64');
    });

    test('node group should use instance type parameter', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.InstanceTypes).toEqual([{ Ref: 'NodeInstanceType' }]);
    });

    test('node group should use private subnet resources', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      // Check that it uses subnet references
      expect(nodeGroup.Properties.Subnets).toBeDefined();
      expect(Array.isArray(nodeGroup.Properties.Subnets)).toBe(true);
    });

    test('node group should have auto-scaling configuration', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const scalingConfig = nodeGroup.Properties.ScalingConfig;

      expect(scalingConfig.MinSize).toEqual({ Ref: 'MinNodes' });
      expect(scalingConfig.MaxSize).toEqual({ Ref: 'MaxNodes' });
      expect(scalingConfig.DesiredSize).toEqual({ Ref: 'DesiredNodes' });
    });

    test('node group should have update configuration', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.UpdateConfig).toBeDefined();
      expect(nodeGroup.Properties.UpdateConfig.MaxUnavailable).toBe(1);
    });

    test('node group should have labels with EnvironmentSuffix', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.Labels).toBeDefined();
      expect(nodeGroup.Properties.Labels.Environment).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('CloudWatch Container Insights', () => {
    test('should have CloudWatch log group for cluster logs', () => {
      expect(template.Resources.EKSContainerInsightsLogGroup).toBeDefined();
      expect(template.Resources.EKSContainerInsightsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CloudWatch log group for application logs', () => {
      expect(template.Resources.EKSApplicationLogGroup).toBeDefined();
      expect(template.Resources.EKSApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CloudWatch log group for dataplane logs', () => {
      expect(template.Resources.EKSDataPlaneLogGroup).toBeDefined();
      expect(template.Resources.EKSDataPlaneLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have retention period', () => {
      const logGroups = [
        template.Resources.EKSContainerInsightsLogGroup,
        template.Resources.EKSApplicationLogGroup,
        template.Resources.EKSDataPlaneLogGroup,
      ];

      logGroups.forEach((logGroup) => {
        expect(logGroup.Properties.RetentionInDays).toBeDefined();
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });
    });

    test('log groups should have unique names with environment suffix', () => {
      const logGroup = template.Resources.EKSContainerInsightsLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/containerinsights/eks-cluster-${EnvironmentSuffix}/performance',
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'ClusterName',
        'ClusterEndpoint',
        'ClusterArn',
        'OIDCIssuerUrl',
        'OIDCProviderArn',
        'NodeGroupArn',
        'NodeGroupName',
        'KMSKeyId',
        'KMSKeyArn',
        'ClusterSecurityGroupId',
        'ContainerInsightsLogGroup',
        'EnvironmentSuffix',
        'StackName',
      ];

      requiredOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ClusterEndpoint output should reference cluster endpoint', () => {
      const output = template.Outputs.ClusterEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'Endpoint'],
      });
    });

    test('OIDCIssuerUrl output should reference cluster OIDC issuer', () => {
      const output = template.Outputs.OIDCIssuerUrl;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'OpenIdConnectIssuerUrl'],
      });
    });

    test('OIDCProviderArn output should reference OIDC provider', () => {
      const output = template.Outputs.OIDCProviderArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EKSOIDCProvider', 'Arn'],
      });
    });

    test('NodeGroupArn output should reference node group', () => {
      const output = template.Outputs.NodeGroupArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EKSNodeGroup', 'Arn'],
      });
    });

    test('KMSKeyId output should reference KMS key', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Value).toEqual({ Ref: 'EKSEncryptionKey' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should use EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'EKSEncryptionKey',
        'EKSClusterRole',
        'EKSClusterSecurityGroup',
        'EKSCluster',
        'EKSNodeRole',
        'EKSNodeGroup',
      ];

      resourcesWithNames.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        // Check if any property uses EnvironmentSuffix in Fn::Sub
        const resourceString = JSON.stringify(resource);
        expect(resourceString).toContain('${EnvironmentSuffix}');
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
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

    test('should have at least 10 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(10);
    });

    test('should have at least 6 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(6);
    });

    test('should have at least 13 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(13);
    });
  });

  describe('Security Best Practices', () => {
    test('cluster should not have public endpoint access', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('cluster should have private endpoint access enabled', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
    });

    test('KMS key should have rotation enabled', () => {
      const kmsKey = template.Resources.EKSEncryptionKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('node group should use ARM64 architecture', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_ARM_64');
    });

    test('all IAM roles should have tags', () => {
      const roles = ['EKSClusterRole', 'EKSNodeRole'];
      roles.forEach((roleName) => {
        const role = template.Resources[roleName];
        expect(role.Properties.Tags).toBeDefined();
        expect(role.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('All 9 Requirements Validation', () => {
    test('Requirement 1: EKS cluster with Kubernetes 1.28+ and private endpoint', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Type).toBe('AWS::EKS::Cluster');
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(false);
      expect(template.Parameters.KubernetesVersion.AllowedValues).toContain('1.28');
    });

    test('Requirement 2: KMS encryption for Kubernetes secrets', () => {
      const cluster = template.Resources.EKSCluster;
      const kmsKey = template.Resources.EKSEncryptionKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(cluster.Properties.EncryptionConfig[0].Resources).toContain('secrets');
    });

    test('Requirement 3: OIDC provider for IRSA', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Type).toBe('AWS::IAM::OIDCProvider');
      expect(oidc.Properties.ClientIdList).toContain('sts.amazonaws.com');
    });

    test('Requirement 4: Managed node group with Graviton2 (t4g.medium)', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Type).toBe('AWS::EKS::Nodegroup');
      expect(nodeGroup.Properties.AmiType).toBe('AL2_ARM_64');
      expect(template.Parameters.NodeInstanceType.Default).toBe('t4g.medium');
    });

    test('Requirement 5: Auto-scaling (min 2, max 10)', () => {
      expect(template.Parameters.MinNodes.Default).toBe(2);
      expect(template.Parameters.MaxNodes.Default).toBe(10);
    });

    test('Requirement 6: CloudWatch Container Insights', () => {
      expect(template.Resources.EKSContainerInsightsLogGroup).toBeDefined();
      expect(template.Resources.EKSApplicationLogGroup).toBeDefined();
      expect(template.Resources.EKSDataPlaneLogGroup).toBeDefined();
      const nodeRole = template.Resources.EKSNodeRole;
      expect(nodeRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('Requirement 7: Least-privilege IAM roles', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      const nodeRole = template.Resources.EKSNodeRole;
      expect(clusterRole.Properties.ManagedPolicyArns.length).toBeLessThanOrEqual(2);
      expect(nodeRole.Properties.ManagedPolicyArns.length).toBeLessThanOrEqual(5);
    });

    test('Requirement 8: Private subnets only', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      // Check that it uses subnet references (private subnets)
      expect(nodeGroup.Properties.Subnets).toBeDefined();
      expect(Array.isArray(nodeGroup.Properties.Subnets)).toBe(true);
      // Check that we have private subnet resources (A, B, C naming)
      expect(template.Resources.PrivateSubnetA).toBeDefined();
      expect(template.Resources.PrivateSubnetB).toBeDefined();
      expect(template.Resources.PrivateSubnetC).toBeDefined();
    });

    test('Requirement 9: Required outputs (endpoint, OIDC issuer, node group ARN)', () => {
      expect(template.Outputs.ClusterEndpoint).toBeDefined();
      expect(template.Outputs.OIDCIssuerUrl).toBeDefined();
      expect(template.Outputs.NodeGroupArn).toBeDefined();
    });
  });
});
