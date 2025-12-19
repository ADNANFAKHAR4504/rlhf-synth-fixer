import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - EKS Cluster', () => {
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

    test('should have a description for EKS cluster', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('EKS');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have VPC and Subnet parameters', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.PrivateSubnetIds).toBeDefined();
    });

    test('should have instance type parameters', () => {
      expect(template.Parameters.LinuxInstanceType).toBeDefined();
      expect(template.Parameters.WindowsInstanceType).toBeDefined();
      expect(template.Parameters.LinuxInstanceType.Default).toBe('t3.medium');
      expect(template.Parameters.WindowsInstanceType.Default).toBe('t3.large');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.AllowedPattern).toBe('[a-z0-9-]+');
    });
  });

  describe('EKS Cluster Resources', () => {
    test('should have EKS cluster resource', () => {
      expect(template.Resources.EksCluster).toBeDefined();
      expect(template.Resources.EksCluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('EKS cluster should have private endpoint configuration', () => {
      const cluster = template.Resources.EksCluster;
      const resourcesVpcConfig = cluster.Properties.ResourcesVpcConfig;

      expect(resourcesVpcConfig.EndpointPrivateAccess).toBe(true);
      expect(resourcesVpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('EKS cluster should have all control plane log types enabled', () => {
      const cluster = template.Resources.EksCluster;
      const enabledTypes = cluster.Properties.Logging.ClusterLogging.EnabledTypes;

      const types = enabledTypes.map((t: any) => t.Type);
      expect(types).toContain('api');
      expect(types).toContain('audit');
      expect(types).toContain('authenticator');
      expect(types).toContain('controllerManager');
      expect(types).toContain('scheduler');
      expect(types).toHaveLength(5);
    });

    test('EKS cluster should have KMS encryption configured', () => {
      const cluster = template.Resources.EksCluster;
      expect(cluster.Properties.EncryptionConfig).toBeDefined();
      expect(cluster.Properties.EncryptionConfig[0].Resources).toContain('secrets');
      expect(cluster.Properties.EncryptionConfig[0].Provider.KeyArn).toEqual({
        'Fn::GetAtt': ['EksKmsKey', 'Arn']
      });
    });

    test('EKS cluster should use correct Kubernetes version', () => {
      const cluster = template.Resources.EksCluster;
      const version = cluster.Properties.Version;
      expect(version).toEqual({ Ref: 'EksVersion' });
    });

    test('EKS cluster should have correct deletion policy', () => {
      const cluster = template.Resources.EksCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.EksKmsKey).toBeDefined();
      expect(template.Resources.EksKmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have correct deletion policy', () => {
      const kmsKey = template.Resources.EksKmsKey;
      expect(kmsKey.DeletionPolicy).toBe('Delete');
    });

    test('KMS key should have key policy for EKS', () => {
      const kmsKey = template.Resources.EksKmsKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeDefined();
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.EksKmsKeyAlias).toBeDefined();
      expect(template.Resources.EksKmsKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('IAM Resources', () => {
    test('should have EKS cluster IAM role', () => {
      expect(template.Resources.EksClusterRole).toBeDefined();
      expect(template.Resources.EksClusterRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have node group IAM role', () => {
      expect(template.Resources.NodeGroupRole).toBeDefined();
      expect(template.Resources.NodeGroupRole.Type).toBe('AWS::IAM::Role');
    });

    test('node group role should have required managed policies', () => {
      const nodeRole = template.Resources.NodeGroupRole;
      const policies = nodeRole.Properties.ManagedPolicyArns;

      expect(policies).toContainEqual('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(policies).toContainEqual('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(policies).toContainEqual('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
    });
  });

  describe('OIDC Provider', () => {
    test('should have OIDC provider for IRSA', () => {
      expect(template.Resources.EksOidcProvider).toBeDefined();
      expect(template.Resources.EksOidcProvider.Type).toBe('AWS::IAM::OIDCProvider');
    });

    test('OIDC provider should reference EKS cluster', () => {
      const oidcProvider = template.Resources.EksOidcProvider;
      expect(oidcProvider.Properties.Url).toEqual({
        'Fn::GetAtt': ['EksCluster', 'OpenIdConnectIssuerUrl']
      });
    });
  });

  describe('Launch Templates', () => {
    test('should have Linux launch template', () => {
      expect(template.Resources.LinuxLaunchTemplate).toBeDefined();
      expect(template.Resources.LinuxLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have Windows launch template', () => {
      expect(template.Resources.WindowsLaunchTemplate).toBeDefined();
      expect(template.Resources.WindowsLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Linux launch template should enforce IMDSv2', () => {
      const launchTemplate = template.Resources.LinuxLaunchTemplate;
      const metadata = launchTemplate.Properties.LaunchTemplateData.MetadataOptions;

      expect(metadata.HttpTokens).toBe('required');
      expect(metadata.HttpPutResponseHopLimit).toBe(1);
    });

    test('Windows launch template should enforce IMDSv2', () => {
      const launchTemplate = template.Resources.WindowsLaunchTemplate;
      const metadata = launchTemplate.Properties.LaunchTemplateData.MetadataOptions;

      expect(metadata.HttpTokens).toBe('required');
      expect(metadata.HttpPutResponseHopLimit).toBe(1);
    });
  });

  describe('Node Groups', () => {
    test('should have Linux node group', () => {
      expect(template.Resources.LinuxNodeGroup).toBeDefined();
      expect(template.Resources.LinuxNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('should have Windows node group', () => {
      expect(template.Resources.WindowsNodeGroup).toBeDefined();
      expect(template.Resources.WindowsNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('Linux node group should have correct configuration', () => {
      const nodeGroup = template.Resources.LinuxNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_x86_64');
      expect(nodeGroup.Properties.ScalingConfig.MinSize).toBe(2);
      expect(nodeGroup.Properties.ScalingConfig.MaxSize).toBe(10);
      expect(nodeGroup.Properties.CapacityType).toBe('SPOT');
    });

    test('Windows node group should have correct configuration', () => {
      const nodeGroup = template.Resources.WindowsNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('WINDOWS_CORE_2022_x86_64');
      expect(nodeGroup.Properties.ScalingConfig.MinSize).toBe(1);
      expect(nodeGroup.Properties.ScalingConfig.MaxSize).toBe(5);
      expect(nodeGroup.Properties.CapacityType).toBe('SPOT');
    });

    test('Windows node group should depend on Linux node group', () => {
      const nodeGroup = template.Resources.WindowsNodeGroup;
      expect(nodeGroup.DependsOn).toContain('LinuxNodeGroup');
    });

    test('both node groups should have deletion policy Delete', () => {
      expect(template.Resources.LinuxNodeGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.WindowsNodeGroup.DeletionPolicy).toBe('Delete');
    });

    test('both node groups should use launch templates', () => {
      const linuxNodeGroup = template.Resources.LinuxNodeGroup;
      const windowsNodeGroup = template.Resources.WindowsNodeGroup;

      expect(linuxNodeGroup.Properties.LaunchTemplate).toBeDefined();
      expect(windowsNodeGroup.Properties.LaunchTemplate).toBeDefined();
    });
  });

  describe('EKS Addons', () => {
    test('should have VPC CNI addon', () => {
      expect(template.Resources.VpcCniAddon).toBeDefined();
      expect(template.Resources.VpcCniAddon.Type).toBe('AWS::EKS::Addon');
      expect(template.Resources.VpcCniAddon.Properties.AddonName).toBe('vpc-cni');
    });

    test('VPC CNI addon should have prefix delegation enabled', () => {
      const addon = template.Resources.VpcCniAddon;
      const config = JSON.parse(addon.Properties.ConfigurationValues);
      expect(config.env.ENABLE_PREFIX_DELEGATION).toBe('true');
    });

    test('should have kube-proxy addon', () => {
      expect(template.Resources.KubeProxyAddon).toBeDefined();
      expect(template.Resources.KubeProxyAddon.Type).toBe('AWS::EKS::Addon');
      expect(template.Resources.KubeProxyAddon.Properties.AddonName).toBe('kube-proxy');
    });

    test('should have CoreDNS addon', () => {
      expect(template.Resources.CoreDnsAddon).toBeDefined();
      expect(template.Resources.CoreDnsAddon.Type).toBe('AWS::EKS::Addon');
      expect(template.Resources.CoreDnsAddon.Properties.AddonName).toBe('coredns');
    });

    test('CoreDNS addon should depend on Linux node group', () => {
      const addon = template.Resources.CoreDnsAddon;
      expect(addon.DependsOn).toContain('LinuxNodeGroup');
    });
  });

  describe('Security Group', () => {
    test('should have cluster security group', () => {
      expect(template.Resources.EksClusterSecurityGroup).toBeDefined();
      expect(template.Resources.EksClusterSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Resource Tagging', () => {
    test('EKS cluster should have required tags', () => {
      const cluster = template.Resources.EksCluster;
      const tags = cluster.Properties.Tags;

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const managedByTag = tags.find((t: any) => t.Key === 'ManagedBy');

      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
      expect(managedByTag).toBeDefined();
      expect(managedByTag.Value).toBe('CloudFormation');
    });

    test('node groups should have required tags', () => {
      const linuxNodeGroup = template.Resources.LinuxNodeGroup;
      expect(linuxNodeGroup.Properties.Tags.Environment).toBe('Production');
      expect(linuxNodeGroup.Properties.Tags.ManagedBy).toBe('CloudFormation');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ClusterName',
        'ClusterEndpoint',
        'ClusterArn',
        'OidcIssuerUrl',
        'OidcProviderArn',
        'LinuxNodeGroupArn',
        'WindowsNodeGroupArn',
        'KmsKeyArn',
        'ClusterSecurityGroupId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ClusterEndpoint output should reference EKS cluster', () => {
      const output = template.Outputs.ClusterEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EksCluster', 'Endpoint']
      });
    });

    test('OidcIssuerUrl output should reference EKS cluster', () => {
      const output = template.Outputs.OidcIssuerUrl;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EksCluster', 'OpenIdConnectIssuerUrl']
      });
    });

    test('node group outputs should reference correct resources', () => {
      const linuxOutput = template.Outputs.LinuxNodeGroupArn;
      const windowsOutput = template.Outputs.WindowsNodeGroupArn;

      expect(linuxOutput.Value).toEqual({
        'Fn::GetAtt': ['LinuxNodeGroup', 'Arn']
      });
      expect(windowsOutput.Value).toEqual({
        'Fn::GetAtt': ['WindowsNodeGroup', 'Arn']
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(14); // EKS cluster + node groups + addons + IAM + KMS + SG + Launch templates + OIDC
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6); // EnvironmentSuffix + VpcId + PrivateSubnetIds + LinuxInstanceType + WindowsInstanceType + EksVersion
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9); // All EKS-related outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('cluster name should follow naming convention with environment suffix', () => {
      const cluster = template.Resources.EksCluster;
      const clusterName = cluster.Properties.Name;

      expect(clusterName).toEqual({
        'Fn::Sub': 'eks-cluster-${EnvironmentSuffix}',
      });
    });

    test('node group names should include environment suffix', () => {
      const linuxNodeGroup = template.Resources.LinuxNodeGroup;
      const windowsNodeGroup = template.Resources.WindowsNodeGroup;

      expect(linuxNodeGroup.Properties.NodegroupName).toEqual({
        'Fn::Sub': 'linux-nodegroup-${EnvironmentSuffix}'
      });
      expect(windowsNodeGroup.Properties.NodegroupName).toEqual({
        'Fn::Sub': 'windows-nodegroup-${EnvironmentSuffix}'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
          });
        }
      });
    });
  });

  describe('Security Compliance', () => {
    test('all resources should be destroyable (no Retain policies)', () => {
      const resourcesWithDeletionPolicy = [
        'EksCluster',
        'LinuxNodeGroup',
        'WindowsNodeGroup',
        'EksKmsKey'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('IMDSv2 should be enforced on all launch templates', () => {
      const launchTemplates = ['LinuxLaunchTemplate', 'WindowsLaunchTemplate'];

      launchTemplates.forEach(templateName => {
        const lt = template.Resources[templateName];
        const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
        expect(metadata.HttpTokens).toBe('required');
        expect(metadata.HttpPutResponseHopLimit).toBe(1);
      });
    });

    test('Spot instances should be used for cost optimization', () => {
      expect(template.Resources.LinuxNodeGroup.Properties.CapacityType).toBe('SPOT');
      expect(template.Resources.WindowsNodeGroup.Properties.CapacityType).toBe('SPOT');
    });
  });
});
