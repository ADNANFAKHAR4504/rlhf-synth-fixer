import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

describe('TapStack CloudFormation Template - Unit Tests', () => {
  describe('Template Structure Validation', () => {
    test('should have valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toContain('Production-ready EKS Cluster');
      expect(template.Description).toContain('Auto Scaling Node Groups');
    });

    test('should have Metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have ParameterGroups in Metadata', () => {
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toHaveLength(3);
      expect(parameterGroups[0].Label.default).toBe('Environment Configuration');
      expect(parameterGroups[1].Label.default).toBe('Network Configuration');
      expect(parameterGroups[2].Label.default).toBe('EKS Configuration');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters)).toHaveLength(8);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources)).toHaveLength(15);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs)).toHaveLength(12);
    });
  });

  describe('Parameter Validation', () => {
    test('EnvironmentSuffix parameter should be properly defined', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toContain('alphanumeric characters');
    });

    test('VpcId parameter should be AWS::EC2::VPC::Id type', () => {
      const param = template.Parameters.VpcId;
      expect(param.Type).toBe('AWS::EC2::VPC::Id');
      expect(param.Description).toContain('VPC ID where EKS cluster will be deployed');
    });

    test('PrivateSubnetIds parameter should be list of subnets', () => {
      const param = template.Parameters.PrivateSubnetIds;
      expect(param.Type).toBe('List<AWS::EC2::Subnet::Id>');
      expect(param.Description).toContain('private subnet IDs across 3 availability zones');
    });

    test('EksVersion parameter should have allowed values', () => {
      const param = template.Parameters.EksVersion;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('1.28');
      expect(param.Description).toContain('EKS cluster version');
      expect(param.AllowedValues).toEqual(['1.28', '1.29', '1.30']);
    });

    test('NodeInstanceType parameter should have default', () => {
      const param = template.Parameters.NodeInstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
      expect(param.Description).toContain('EC2 instance type');
    });

    test('NodeGroupMinSize parameter should have constraints', () => {
      const param = template.Parameters.NodeGroupMinSize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(3);
      expect(param.MinValue).toBe(3);
      expect(param.Description).toContain('Minimum number of nodes');
    });

    test('NodeGroupMaxSize parameter should have constraints', () => {
      const param = template.Parameters.NodeGroupMaxSize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(6);
      expect(param.MinValue).toBe(3);
      expect(param.Description).toContain('Maximum number of nodes');
    });

    test('NodeGroupDesiredSize parameter should have constraints', () => {
      const param = template.Parameters.NodeGroupDesiredSize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(3);
      expect(param.MinValue).toBe(3);
      expect(param.Description).toContain('Desired number of nodes');
    });
  });

  describe('Resource Validation', () => {
    test('EksKmsKey should be KMS key resource', () => {
      const resource = template.Resources.EksKmsKey;
      expect(resource.Type).toBe('AWS::KMS::Key');
      expect(resource.DeletionPolicy).toBe('Delete');
      expect(resource.UpdateReplacePolicy).toBe('Delete');
      expect(resource.Properties.Description['Fn::Sub']).toContain('KMS key for EKS secrets encryption');
      expect(resource.Properties.EnableKeyRotation).toBe(true);
    });

    test('EksKmsKey should have proper key policy', () => {
      const resource = template.Resources.EksKmsKey;
      const policy = resource.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Sid).toBe('Enable IAM User Permissions');
      expect(policy.Statement[1].Sid).toBe('Allow EKS to use the key');
    });

    test('EksKmsKeyAlias should reference the key', () => {
      const resource = template.Resources.EksKmsKeyAlias;
      expect(resource.Type).toBe('AWS::KMS::Alias');
      expect(resource.DeletionPolicy).toBe('Delete');
      expect(resource.Properties.AliasName['Fn::Sub']).toBe('alias/eks-${EnvironmentSuffix}');
      expect(resource.Properties.TargetKeyId.Ref).toBe('EksKmsKey');
    });

    test('EksClusterRole should have EKS cluster policy', () => {
      const resource = template.Resources.EksClusterRole;
      expect(resource.Type).toBe('AWS::IAM::Role');
      expect(resource.Properties.RoleName['Fn::Sub']).toBe('eks-cluster-role-${EnvironmentSuffix}');
      expect(resource.Properties.ManagedPolicyArns).toEqual([
        'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy'
      ]);
    });

    test('EksClusterSecurityGroup should be properly configured', () => {
      const resource = template.Resources.EksClusterSecurityGroup;
      expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
      expect(resource.Properties.GroupName['Fn::Sub']).toBe('eks-cluster-sg-${EnvironmentSuffix}');
      expect(resource.Properties.GroupDescription).toBe('Security group for EKS cluster control plane');
      expect(resource.Properties.VpcId.Ref).toBe('VpcId');
    });

    test('EksNodeSecurityGroup should be properly configured', () => {
      const resource = template.Resources.EksNodeSecurityGroup;
      expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
      expect(resource.Properties.GroupName['Fn::Sub']).toBe('eks-node-sg-${EnvironmentSuffix}');
      expect(resource.Properties.GroupDescription).toBe('Security group for EKS worker nodes');
      expect(resource.Properties.VpcId.Ref).toBe('VpcId');
    });

    test('NodeSecurityGroupIngressHttps should allow HTTPS between nodes', () => {
      const resource = template.Resources.NodeSecurityGroupIngressHttps;
      expect(resource.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(resource.Properties.GroupId.Ref).toBe('EksNodeSecurityGroup');
      expect(resource.Properties.IpProtocol).toBe('tcp');
      expect(resource.Properties.FromPort).toBe(443);
      expect(resource.Properties.ToPort).toBe(443);
      expect(resource.Properties.SourceSecurityGroupId.Ref).toBe('EksNodeSecurityGroup');
    });

    test('NodeSecurityGroupIngressKubelet should allow kubelet communication', () => {
      const resource = template.Resources.NodeSecurityGroupIngressKubelet;
      expect(resource.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(resource.Properties.GroupId.Ref).toBe('EksNodeSecurityGroup');
      expect(resource.Properties.IpProtocol).toBe('tcp');
      expect(resource.Properties.FromPort).toBe(10250);
      expect(resource.Properties.ToPort).toBe(10250);
      expect(resource.Properties.SourceSecurityGroupId.Ref).toBe('EksNodeSecurityGroup');
    });

    test('NodeSecurityGroupIngressDns should allow DNS TCP', () => {
      const resource = template.Resources.NodeSecurityGroupIngressDns;
      expect(resource.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(resource.Properties.GroupId.Ref).toBe('EksNodeSecurityGroup');
      expect(resource.Properties.IpProtocol).toBe('tcp');
      expect(resource.Properties.FromPort).toBe(53);
      expect(resource.Properties.ToPort).toBe(53);
      expect(resource.Properties.SourceSecurityGroupId.Ref).toBe('EksNodeSecurityGroup');
    });

    test('NodeSecurityGroupIngressDnsUdp should allow DNS UDP', () => {
      const resource = template.Resources.NodeSecurityGroupIngressDnsUdp;
      expect(resource.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(resource.Properties.GroupId.Ref).toBe('EksNodeSecurityGroup');
      expect(resource.Properties.IpProtocol).toBe('udp');
      expect(resource.Properties.FromPort).toBe(53);
      expect(resource.Properties.ToPort).toBe(53);
      expect(resource.Properties.SourceSecurityGroupId.Ref).toBe('EksNodeSecurityGroup');
    });

    test('NodeSecurityGroupIngressFromCluster should allow control plane to nodes', () => {
      const resource = template.Resources.NodeSecurityGroupIngressFromCluster;
      expect(resource.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(resource.Properties.GroupId.Ref).toBe('EksNodeSecurityGroup');
      expect(resource.Properties.IpProtocol).toBe('tcp');
      expect(resource.Properties.FromPort).toBe(443);
      expect(resource.Properties.ToPort).toBe(443);
      expect(resource.Properties.SourceSecurityGroupId.Ref).toBe('EksClusterSecurityGroup');
    });

    test('ClusterSecurityGroupIngressFromNodes should allow nodes to control plane', () => {
      const resource = template.Resources.ClusterSecurityGroupIngressFromNodes;
      expect(resource.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(resource.Properties.GroupId.Ref).toBe('EksClusterSecurityGroup');
      expect(resource.Properties.IpProtocol).toBe('tcp');
      expect(resource.Properties.FromPort).toBe(443);
      expect(resource.Properties.ToPort).toBe(443);
      expect(resource.Properties.SourceSecurityGroupId.Ref).toBe('EksNodeSecurityGroup');
    });

    test('EksClusterLogGroup should have proper configuration', () => {
      const resource = template.Resources.EksClusterLogGroup;
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
      expect(resource.Properties.LogGroupName['Fn::Sub']).toBe('/aws/eks/eks-cluster-${EnvironmentSuffix}/cluster');
      expect(resource.Properties.RetentionInDays).toBe(7);
    });

    test('EksCluster should be properly configured', () => {
      const resource = template.Resources.EksCluster;
      expect(resource.Type).toBe('AWS::EKS::Cluster');
      expect(resource.Properties.Name['Fn::Sub']).toBe('eks-cluster-${EnvironmentSuffix}');
      expect(resource.Properties.Version.Ref).toBe('EksVersion');
      expect(resource.Properties.RoleArn['Fn::GetAtt']).toEqual(['EksClusterRole', 'Arn']);
      expect(resource.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
      expect(resource.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(false);
      expect(resource.Properties.EncryptionConfig[0].Resources).toEqual(['secrets']);
    });

    test('EksCluster should have logging enabled', () => {
      const resource = template.Resources.EksCluster;
      const logging = resource.Properties.Logging.ClusterLogging.EnabledTypes;
      expect(logging).toHaveLength(5);
      expect(logging.map((t: any) => t.Type)).toEqual([
        'api', 'audit', 'authenticator', 'controllerManager', 'scheduler'
      ]);
    });

    test('EksNodeRole should have required policies', () => {
      const resource = template.Resources.EksNodeRole;
      expect(resource.Type).toBe('AWS::IAM::Role');
      expect(resource.Properties.RoleName['Fn::Sub']).toBe('eks-node-role-${EnvironmentSuffix}');
      expect(resource.Properties.ManagedPolicyArns).toEqual([
        'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
        'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
        'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
      ]);
    });

    test('EksNodeGroup should be properly configured', () => {
      const resource = template.Resources.EksNodeGroup;
      expect(resource.Type).toBe('AWS::EKS::Nodegroup');
      expect(resource.Properties.NodegroupName['Fn::Sub']).toBe('eks-node-group-${EnvironmentSuffix}');
      expect(resource.Properties.ClusterName.Ref).toBe('EksCluster');
      expect(resource.Properties.NodeRole['Fn::GetAtt']).toEqual(['EksNodeRole', 'Arn']);
      expect(resource.Properties.Subnets.Ref).toBe('PrivateSubnetIds');
      expect(resource.Properties.InstanceTypes).toStrictEqual([{ 'Ref': 'NodeInstanceType' }]);
      expect(resource.Properties.AmiType).toBe('AL2_x86_64');
      expect(resource.Properties.Labels.Environment).toBe('Production');
      expect(resource.Properties.ScalingConfig.MinSize.Ref).toBe('NodeGroupMinSize');
      expect(resource.Properties.ScalingConfig.MaxSize.Ref).toBe('NodeGroupMaxSize');
      expect(resource.Properties.ScalingConfig.DesiredSize.Ref).toBe('NodeGroupDesiredSize');
    });
  });

  describe('Output Validation', () => {
    test('EksClusterName output should be defined', () => {
      const output = template.Outputs.EksClusterName;
      expect(output.Description).toBe('Name of the EKS cluster');
      expect(output.Value.Ref).toBe('EksCluster');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksClusterName-${EnvironmentSuffix}');
    });

    test('EksClusterArn output should be defined', () => {
      const output = template.Outputs.EksClusterArn;
      expect(output.Description).toBe('ARN of the EKS cluster');
      expect(output.Value['Fn::GetAtt']).toEqual(['EksCluster', 'Arn']);
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksClusterArn-${EnvironmentSuffix}');
    });

    test('EksClusterEndpoint output should be defined', () => {
      const output = template.Outputs.EksClusterEndpoint;
      expect(output.Description).toBe('API endpoint of the EKS cluster');
      expect(output.Value['Fn::GetAtt']).toEqual(['EksCluster', 'Endpoint']);
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksClusterEndpoint-${EnvironmentSuffix}');
    });

    test('EksClusterSecurityGroupId output should be defined', () => {
      const output = template.Outputs.EksClusterSecurityGroupId;
      expect(output.Description).toBe('Security group ID for the EKS cluster control plane');
      expect(output.Value.Ref).toBe('EksClusterSecurityGroup');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksClusterSecurityGroupId-${EnvironmentSuffix}');
    });

    test('EksNodeSecurityGroupId output should be defined', () => {
      const output = template.Outputs.EksNodeSecurityGroupId;
      expect(output.Description).toBe('Security group ID for the EKS worker nodes');
      expect(output.Value.Ref).toBe('EksNodeSecurityGroup');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksNodeSecurityGroupId-${EnvironmentSuffix}');
    });

    test('EksKmsKeyId output should be defined', () => {
      const output = template.Outputs.EksKmsKeyId;
      expect(output.Description).toBe('KMS key ID for EKS secrets encryption');
      expect(output.Value.Ref).toBe('EksKmsKey');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksKmsKeyId-${EnvironmentSuffix}');
    });

    test('EksKmsKeyArn output should be defined', () => {
      const output = template.Outputs.EksKmsKeyArn;
      expect(output.Description).toBe('KMS key ARN for EKS secrets encryption');
      expect(output.Value['Fn::GetAtt']).toEqual(['EksKmsKey', 'Arn']);
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksKmsKeyArn-${EnvironmentSuffix}');
    });

    test('EksOidcIssuer output should be defined', () => {
      const output = template.Outputs.EksOidcIssuer;
      expect(output.Description).toBe('OIDC issuer URL for the EKS cluster (for IRSA)');
      expect(output.Value['Fn::GetAtt']).toEqual(['EksCluster', 'OpenIdConnectIssuerUrl']);
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksOidcIssuer-${EnvironmentSuffix}');
    });

    test('EksNodeGroupName output should be defined', () => {
      const output = template.Outputs.EksNodeGroupName;
      expect(output.Description).toBe('Name of the EKS managed node group');
      expect(output.Value.Ref).toBe('EksNodeGroup');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksNodeGroupName-${EnvironmentSuffix}');
    });

    test('EksClusterRoleArn output should be defined', () => {
      const output = template.Outputs.EksClusterRoleArn;
      expect(output.Description).toBe('ARN of the EKS cluster IAM role');
      expect(output.Value['Fn::GetAtt']).toEqual(['EksClusterRole', 'Arn']);
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksClusterRoleArn-${EnvironmentSuffix}');
    });

    test('EksNodeRoleArn output should be defined', () => {
      const output = template.Outputs.EksNodeRoleArn;
      expect(output.Description).toBe('ARN of the EKS node IAM role');
      expect(output.Value['Fn::GetAtt']).toEqual(['EksNodeRole', 'Arn']);
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EksNodeRoleArn-${EnvironmentSuffix}');
    });

    test('EnvironmentSuffix output should be defined', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe('Environment suffix used for this deployment');
      expect(output.Value.Ref).toBe('EnvironmentSuffix');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EnvironmentSuffix');
    });
  });

  describe('Cross-Reference Validation', () => {
    test('all resources should have proper naming with EnvironmentSuffix', () => {
      const resourcesWithNaming = [
        'EksKmsKey', 'EksKmsKeyAlias', 'EksClusterRole', 'EksClusterSecurityGroup',
        'EksNodeSecurityGroup', 'EksClusterLogGroup', 'EksCluster', 'EksNodeRole', 'EksNodeGroup'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.RoleName) {
          expect(resource.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        if (resource.Properties.GroupName) {
          expect(resource.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        if (resource.Properties.LogGroupName) {
          expect(resource.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        if (resource.Properties.Name) {
          expect(resource.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        if (resource.Properties.NodegroupName) {
          expect(resource.Properties.NodegroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        if (resource.Properties.AliasName) {
          expect(resource.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('all resources should have Environment tag set to Production', () => {
      const resourcesWithTags = [
        'EksKmsKey', 'EksKmsKeyAlias', 'EksClusterRole', 'EksClusterSecurityGroup',
        'EksNodeSecurityGroup', 'EksClusterLogGroup', 'EksCluster', 'EksNodeRole'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag.Value).toBe('Production');
        }
      });
    });

    test('all resources should have ManagedBy tag set to CloudFormation', () => {
      const resourcesWithTags = [
        'EksKmsKey', 'EksKmsKeyAlias', 'EksClusterRole', 'EksClusterSecurityGroup',
        'EksNodeSecurityGroup', 'EksClusterLogGroup', 'EksCluster', 'EksNodeRole'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const managedByTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'ManagedBy');
          expect(managedByTag.Value).toBe('CloudFormation');
        }
      });
    });

    test('security groups should reference VpcId parameter', () => {
      const securityGroups = ['EksClusterSecurityGroup', 'EksNodeSecurityGroup'];
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.VpcId.Ref).toBe('VpcId');
      });
    });

    test('EKS cluster should reference all required parameters', () => {
      const cluster = template.Resources.EksCluster;
      expect(cluster.Properties.Version.Ref).toBe('EksVersion');
      expect(cluster.Properties.ResourcesVpcConfig.SubnetIds.Ref).toBe('PrivateSubnetIds');
    });

    test('node group should reference all required parameters', () => {
      const nodeGroup = template.Resources.EksNodeGroup;
      expect(nodeGroup.Properties.Subnets.Ref).toBe('PrivateSubnetIds');
      expect(nodeGroup.Properties.InstanceTypes[0]['Ref']).toBe('NodeInstanceType');
      expect(nodeGroup.Properties.ScalingConfig.MinSize.Ref).toBe('NodeGroupMinSize');
      expect(nodeGroup.Properties.ScalingConfig.MaxSize.Ref).toBe('NodeGroupMaxSize');
      expect(nodeGroup.Properties.ScalingConfig.DesiredSize.Ref).toBe('NodeGroupDesiredSize');
    });
  });
});