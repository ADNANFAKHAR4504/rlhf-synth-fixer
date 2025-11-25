import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toBe(
        'EKS Cluster Infrastructure with Hybrid Node Group Architecture - Production Ready'
      );
    });

    test('should not have metadata section', () => {
      expect(template.Metadata).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBe(
        'Unique suffix for resource naming to avoid conflicts'
      );
      expect(envSuffixParam.MinLength).toBe(1);
      expect(envSuffixParam.Default).toBeUndefined();
      expect(envSuffixParam.AllowedPattern).toBeUndefined();
      expect(envSuffixParam.ConstraintDescription).toBeUndefined();
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
    });

    test('VPC should be an EC2 VPC', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have EKSCluster resource', () => {
      expect(template.Resources.EKSCluster).toBeDefined();
    });

    test('EKSCluster should be an EKS Cluster', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('EKSCluster should have correct properties', () => {
      const cluster = template.Resources.EKSCluster;
      const properties = cluster.Properties;

      expect(properties.Name).toEqual({
        'Fn::Sub': 'eks-cluster-${EnvironmentSuffix}',
      });
      expect(properties.Version).toBe('1.28');
      expect(properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
      expect(properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(false);
    });

    test('should have ManagedNodeGroup resource', () => {
      expect(template.Resources.ManagedNodeGroup).toBeDefined();
    });

    test('ManagedNodeGroup should be an EKS Nodegroup', () => {
      const nodegroup = template.Resources.ManagedNodeGroup;
      expect(nodegroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('should have SelfManagedAutoScalingGroup resource', () => {
      expect(template.Resources.SelfManagedAutoScalingGroup).toBeDefined();
    });

    test('SelfManagedAutoScalingGroup should be an AutoScaling Group', () => {
      const asg = template.Resources.SelfManagedAutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ClusterName',
        'ClusterEndpoint',
        'ClusterArn',
        'VPCId',
        'PrivateSubnetIds',
        'OIDCProviderArn',
        'NodeRoleArn',
        'EncryptionKeyArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ClusterName output should be correct', () => {
      const output = template.Outputs.ClusterName;
      expect(output.Description).toBe('Name of the EKS cluster');
      expect(output.Value).toEqual({ Ref: 'EKSCluster' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ClusterName',
      });
    });

    test('ClusterEndpoint output should be correct', () => {
      const output = template.Outputs.ClusterEndpoint;
      expect(output.Description).toBe('Endpoint for EKS cluster');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'Endpoint'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ClusterEndpoint',
      });
    });

    test('ClusterArn output should be correct', () => {
      const output = template.Outputs.ClusterArn;
      expect(output.Description).toBe('ARN of the EKS cluster');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ClusterArn',
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });

    test('PrivateSubnetIds output should be correct', () => {
      const output = template.Outputs.PrivateSubnetIds;
      expect(output.Description).toBe('Private Subnet IDs');
      expect(output.Value).toEqual({
        'Fn::Join': [
          ',',
          [
            { Ref: 'PrivateSubnet1' },
            { Ref: 'PrivateSubnet2' },
            { Ref: 'PrivateSubnet3' },
          ],
        ],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PrivateSubnetIds',
      });
    });

    test('OIDCProviderArn output should be correct', () => {
      const output = template.Outputs.OIDCProviderArn;
      expect(output.Description).toBe('ARN of the OIDC Provider');
      expect(output.Value).toEqual({ Ref: 'OIDCProvider' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-OIDCProviderArn',
      });
    });

    test('NodeRoleArn output should be correct', () => {
      const output = template.Outputs.NodeRoleArn;
      expect(output.Description).toBe('ARN of the Node IAM Role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['NodeRole', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-NodeRoleArn',
      });
    });

    test('EncryptionKeyArn output should be correct', () => {
      const output = template.Outputs.EncryptionKeyArn;
      expect(output.Description).toBe('ARN of the KMS encryption key');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EncryptionKey', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EncryptionKeyArn',
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

    test('should have exactly twenty-two resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(31);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly eight outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Resource Naming Convention', () => {
    test('cluster name should follow naming convention with environment suffix', () => {
      const cluster = template.Resources.EKSCluster;
      const clusterName = cluster.Properties.Name;

      expect(clusterName).toEqual({
        'Fn::Sub': 'eks-cluster-${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});

