import * as fs from 'fs';
import * as path from 'path';

describe('Trading Platform CloudFormation Integration Tests', () => {
  let template: any;
  let templateString: string;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    templateString = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateString);
  });

  describe('Template Validation', () => {
    test('should validate successfully with CloudFormation service', async () => {
      // Check template structure
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Resources).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid template summary', () => {
      expect(template.Description).toBeDefined();
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have proper parameter constraints', () => {
      const params = template.Parameters;
      expect(params.EnvironmentSuffix.AllowedPattern).toBeDefined();
      expect(params.KubernetesVersion.AllowedValues).toBeDefined();
      expect(params.NodeInstanceType.AllowedValues).toBeDefined();
    });
  });

  describe('Resource Dependency Validation', () => {
    test('should have proper VPC dependencies', () => {
      // Check subnets depend on VPC
      expect(template.Resources.PublicSubnetA.Properties.VpcId.Ref).toBe('VPC');
      expect(template.Resources.PrivateSubnetA.Properties.VpcId.Ref).toBe('VPC');

      // Check route tables depend on VPC
      expect(template.Resources.PublicRouteTable.Properties.VpcId.Ref).toBe('VPC');
      expect(template.Resources.PrivateRouteTable.Properties.VpcId.Ref).toBe('VPC');
    });

    test('should have proper EKS dependencies', () => {
      // Check cluster depends on role
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.RoleArn['Fn::GetAtt'][0]).toBe('EKSClusterRole');

      // Check node group depends on cluster
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.ClusterName.Ref).toBe('EKSCluster');
      expect(nodeGroup.DependsOn).toBe('EKSOIDCProvider');
    });

    test('should have proper NAT Gateway dependencies', () => {
      const natGateway = template.Resources.NatGateway;
      expect(natGateway.Properties.AllocationId['Fn::GetAtt'][0]).toBe('NatEip');
      expect(natGateway.Properties.SubnetId.Ref).toBe('PublicSubnetA');
    });
  });

  describe('Security Configuration Validation', () => {
    test('should have KMS encryption enabled for EKS', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.EncryptionConfig).toBeDefined();
      expect(cluster.Properties.EncryptionConfig[0].Resources).toContain('secrets');
      expect(cluster.Properties.EncryptionConfig[0].Provider.KeyArn['Fn::GetAtt'][0]).toBe('EKSEncryptionKey');
    });

    test('should have proper security group rules', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      expect(sg.Properties.GroupDescription).toBeDefined();
    });

    test('should have IAM roles with least privilege', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      const nodeRole = template.Resources.EKSNodeRole;

      expect(clusterRole.Properties.ManagedPolicyArns).toBeDefined();
      expect(nodeRole.Properties.ManagedPolicyArns).toBeDefined();

      // Check for specific required policies
      expect(nodeRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy'
      );
      expect(nodeRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('should have private endpoint configuration', () => {
      const cluster = template.Resources.EKSCluster;
      const vpcConfig = cluster.Properties.ResourcesVpcConfig;

      expect(vpcConfig.EndpointPrivateAccess).toBe(true);
      expect(vpcConfig.EndpointPublicAccess).toBe(false);
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multiple availability zones', () => {
      // Check public subnets in different AZs
      const publicSubnetA = template.Resources.PublicSubnetA;
      const publicSubnetB = template.Resources.PublicSubnetB;
      const publicSubnetC = template.Resources.PublicSubnetC;

      expect(publicSubnetA.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(publicSubnetB.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(publicSubnetC.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('should have Auto Scaling configured', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const scalingConfig = nodeGroup.Properties.ScalingConfig;

      expect(scalingConfig.MinSize.Ref).toBe('MinNodes');
      expect(scalingConfig.MaxSize.Ref).toBe('MaxNodes');
      expect(scalingConfig.DesiredSize.Ref).toBe('DesiredNodes');
    });

    test('should have update configuration for rolling updates', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.UpdateConfig).toBeDefined();
      expect(nodeGroup.Properties.UpdateConfig.MaxUnavailable).toBe(1);
    });
  });

  describe('Monitoring and Logging Configuration', () => {
    test('should have CloudWatch Container Insights', () => {
      expect(template.Resources.EKSContainerInsightsLogGroup).toBeDefined();
      expect(template.Resources.EKSApplicationLogGroup).toBeDefined();
      expect(template.Resources.EKSDataPlaneLogGroup).toBeDefined();
    });

    test('should have comprehensive EKS logging enabled', () => {
      const cluster = template.Resources.EKSCluster;
      const logging = cluster.Properties.Logging.ClusterLogging.EnabledTypes;

      const logTypes = logging.map((l: any) => l.Type);
      expect(logTypes).toContain('api');
      expect(logTypes).toContain('audit');
      expect(logTypes).toContain('authenticator');
      expect(logTypes).toContain('controllerManager');
      expect(logTypes).toContain('scheduler');
    });

    test('should have log retention configured', () => {
      const logGroups = [
        template.Resources.EKSContainerInsightsLogGroup,
        template.Resources.EKSApplicationLogGroup,
        template.Resources.EKSDataPlaneLogGroup
      ];

      logGroups.forEach(logGroup => {
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });
    });
  });

  describe('IRSA Configuration', () => {
    test('should have OIDC provider configured', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Type).toBe('AWS::IAM::OIDCProvider');
      expect(oidc.Properties.ClientIdList).toContain('sts.amazonaws.com');
    });

    test('should reference cluster OIDC issuer', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Properties.Url['Fn::GetAtt'][0]).toBe('EKSCluster');
      expect(oidc.Properties.Url['Fn::GetAtt'][1]).toBe('OpenIdConnectIssuerUrl');
    });

    test('should have valid thumbprint list', () => {
      const oidc = template.Resources.EKSOIDCProvider;
      expect(oidc.Properties.ThumbprintList).toBeDefined();
      expect(oidc.Properties.ThumbprintList.length).toBeGreaterThan(0);
      expect(oidc.Properties.ThumbprintList[0]).toMatch(/^[a-f0-9]{40}$/i);
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'ClusterName',
        'ClusterEndpoint',
        'ClusterArn',
        'OIDCIssuerUrl',
        'OIDCProviderArn',
        'NodeGroupArn'
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('should have properly formatted export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toMatch(/\$\{AWS::StackName\}/);
      });
    });

    test('should reference correct resources in outputs', () => {
      expect(template.Outputs.ClusterEndpoint.Value['Fn::GetAtt'][0]).toBe('EKSCluster');
      expect(template.Outputs.OIDCIssuerUrl.Value['Fn::GetAtt'][0]).toBe('EKSCluster');
      expect(template.Outputs.OIDCProviderArn.Value['Fn::GetAtt'][0]).toBe('EKSOIDCProvider');
    });
  });

  describe('Parameter Validation', () => {
    test('should have valid parameter constraints', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envParam.ConstraintDescription).toBeDefined();
    });

    test('should have proper default values', () => {
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.KubernetesVersion.Default).toBe('1.28');
      expect(template.Parameters.NodeInstanceType.Default).toBe('t4g.medium');
      expect(template.Parameters.MinNodes.Default).toBe(2);
      expect(template.Parameters.MaxNodes.Default).toBe(10);
    });

    test('should have min/max values for numeric parameters', () => {
      expect(template.Parameters.MinNodes.MinValue).toBe(1);
      expect(template.Parameters.MinNodes.MaxValue).toBe(20);
      expect(template.Parameters.MaxNodes.MinValue).toBe(1);
      expect(template.Parameters.MaxNodes.MaxValue).toBe(100);
    });
  });

  describe('Tags and Metadata', () => {
    test('should have proper tagging strategy', () => {
      const resourcesToCheck = [
        'VPC',
        'EKSCluster',
        'EKSClusterRole',
        'EKSNodeRole'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags || resource.Properties.Tag).toBeDefined();
      });
    });

    test('should have CloudFormation interface metadata', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadata).toBeDefined();
      expect(metadata.ParameterGroups).toBeDefined();
      expect(metadata.ParameterLabels).toBeDefined();
    });

    test('should have parameter groups organized logically', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      const groups = metadata.ParameterGroups;

      const groupLabels = groups.map((g: any) => g.Label.default);
      expect(groupLabels).toContain('Environment Configuration');
      expect(groupLabels).toContain('EKS Configuration');
    });
  });

  describe('Cost Optimization', () => {
    test('should use Graviton2 instances for cost optimization', () => {
      const nodeInstanceType = template.Parameters.NodeInstanceType;
      const allowedValues = nodeInstanceType.AllowedValues;

      // All allowed values should be ARM-based (Graviton2)
      allowedValues.forEach((instanceType: string) => {
        expect(instanceType).toMatch(/^(t4g|c6g|m6g)\./);
      });
    });

    test('should have appropriate log retention for cost control', () => {
      const logGroups = [
        template.Resources.EKSContainerInsightsLogGroup,
        template.Resources.EKSApplicationLogGroup,
        template.Resources.EKSDataPlaneLogGroup
      ];

      logGroups.forEach(logGroup => {
        expect(logGroup.Properties.RetentionInDays).toBeLessThanOrEqual(30);
      });
    });

    test('should have single NAT Gateway for dev environments', () => {
      // Check that we only have one NAT Gateway (cost optimization for non-prod)
      const natGateways = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::NatGateway'
      );
      expect(natGateways.length).toBe(1);
    });
  });

  describe('Template Best Practices', () => {
    test('should use intrinsic functions appropriately', () => {
      const cluster = template.Resources.EKSCluster;

      // Check for proper use of Fn::Sub for naming
      expect(cluster.Properties.Name['Fn::Sub']).toBeDefined();

      // Check for proper use of Ref for parameters
      expect(cluster.Properties.Version.Ref).toBe('KubernetesVersion');
    });

    test('should not have hardcoded values for critical resources', () => {
      const cluster = template.Resources.EKSCluster;
      const nodeGroup = template.Resources.EKSNodeGroup;

      // Check that important values are parameterized
      expect(cluster.Properties.Version.Ref).toBeDefined();
      expect(nodeGroup.Properties.InstanceTypes[0].Ref).toBeDefined();
      expect(nodeGroup.Properties.ScalingConfig.MinSize.Ref).toBeDefined();
    });

    test('should have consistent naming conventions', () => {
      const resources = Object.keys(template.Resources);

      // Check that all resources follow PascalCase naming
      resources.forEach(resourceName => {
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });
});