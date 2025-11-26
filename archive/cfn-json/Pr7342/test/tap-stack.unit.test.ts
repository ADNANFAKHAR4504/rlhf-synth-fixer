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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-Ready Amazon EKS Cluster with Managed Node Groups'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Type).toBe('String');
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
    });

    test('should have subnet CIDR parameters', () => {
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet3CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet3CIDR).toBeDefined();
    });

    test('should have EKS configuration parameters', () => {
      expect(template.Parameters.KubernetesVersion).toBeDefined();
      expect(template.Parameters.KubernetesVersion.Default).toBe('1.28');
      expect(template.Parameters.NodeInstanceType).toBeDefined();
      expect(template.Parameters.NodeInstanceType.Default).toBe('m5.large');
      expect(template.Parameters.NodeGroupMinSize).toBeDefined();
      expect(template.Parameters.NodeGroupMinSize.Default).toBe(2);
      expect(template.Parameters.NodeGroupMaxSize).toBeDefined();
      expect(template.Parameters.NodeGroupMaxSize.Default).toBe(10);
      expect(template.Parameters.NodeGroupDesiredSize).toBeDefined();
      expect(template.Parameters.NodeGroupDesiredSize.Default).toBe(3);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(13);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct deletion policy', () => {
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should include environment suffix in name', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGateway.DeletionPolicy).toBe('Delete');
    });

    test('should have Internet Gateway Attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnet Resources', () => {
    test('should have three public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('public subnets should have kubernetes.io/role/elb tag', () => {
      const checkTag = (subnet: any) => {
        const elbTag = subnet.Properties.Tags.find((tag: any) => tag.Key === 'kubernetes.io/role/elb');
        expect(elbTag).toBeDefined();
        expect(elbTag.Value).toBe('1');
      };
      checkTag(template.Resources.PublicSubnet1);
      checkTag(template.Resources.PublicSubnet2);
      checkTag(template.Resources.PublicSubnet3);
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have MapPublicIpOnLaunch disabled', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('private subnets should have kubernetes.io/role/internal-elb tag', () => {
      const checkTag = (subnet: any) => {
        const elbTag = subnet.Properties.Tags.find((tag: any) => tag.Key === 'kubernetes.io/role/internal-elb');
        expect(elbTag).toBeDefined();
        expect(elbTag.Value).toBe('1');
      };
      checkTag(template.Resources.PrivateSubnet1);
      checkTag(template.Resources.PrivateSubnet2);
      checkTag(template.Resources.PrivateSubnet3);
    });

    test('all subnets should have deletion policy Delete', () => {
      expect(template.Resources.PublicSubnet1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PublicSubnet2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PublicSubnet3.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateSubnet1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateSubnet2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateSubnet3.DeletionPolicy).toBe('Delete');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have three Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.EIPNatGateway1).toBeDefined();
      expect(template.Resources.EIPNatGateway2).toBeDefined();
      expect(template.Resources.EIPNatGateway3).toBeDefined();
      expect(template.Resources.EIPNatGateway1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIPNatGateway2.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIPNatGateway3.Type).toBe('AWS::EC2::EIP');
    });

    test('Elastic IPs should have domain vpc', () => {
      expect(template.Resources.EIPNatGateway1.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIPNatGateway2.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIPNatGateway3.Properties.Domain).toBe('vpc');
    });

    test('Elastic IPs should depend on Internet Gateway Attachment', () => {
      expect(template.Resources.EIPNatGateway1.DependsOn).toBe('InternetGatewayAttachment');
      expect(template.Resources.EIPNatGateway2.DependsOn).toBe('InternetGatewayAttachment');
      expect(template.Resources.EIPNatGateway3.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have three NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway3.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NatGateway1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(template.Resources.NatGateway2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
      expect(template.Resources.NatGateway3.Properties.SubnetId.Ref).toBe('PublicSubnet3');
    });

    test('NAT Gateways should use correct Elastic IPs', () => {
      expect(template.Resources.NatGateway1.Properties.AllocationId['Fn::GetAtt']).toEqual(['EIPNatGateway1', 'AllocationId']);
      expect(template.Resources.NatGateway2.Properties.AllocationId['Fn::GetAtt']).toEqual(['EIPNatGateway2', 'AllocationId']);
      expect(template.Resources.NatGateway3.Properties.AllocationId['Fn::GetAtt']).toEqual(['EIPNatGateway3', 'AllocationId']);
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have default public route to Internet Gateway', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.DefaultPublicRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
    });

    test('should have three private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('should have default private routes to NAT Gateways', () => {
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1.Properties.NatGatewayId.Ref).toBe('NatGateway1');
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2.Properties.NatGatewayId.Ref).toBe('NatGateway2');
      expect(template.Resources.DefaultPrivateRoute3).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute3.Properties.NatGatewayId.Ref).toBe('NatGateway3');
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet3RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have EKS Cluster Role', () => {
      expect(template.Resources.EKSClusterRole).toBeDefined();
      expect(template.Resources.EKSClusterRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EKSClusterRole.DeletionPolicy).toBe('Delete');
    });

    test('EKS Cluster Role should have correct assume role policy', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('eks.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EKS Cluster Role should have correct managed policies', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('EKS Cluster Role should include environment suffix in name', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Node Group Role', () => {
      expect(template.Resources.NodeGroupRole).toBeDefined();
      expect(template.Resources.NodeGroupRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.NodeGroupRole.DeletionPolicy).toBe('Delete');
    });

    test('Node Group Role should have correct assume role policy', () => {
      const role = template.Resources.NodeGroupRole;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('Node Group Role should have correct managed policies', () => {
      const role = template.Resources.NodeGroupRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('Node Group Role should include environment suffix in name', () => {
      const role = template.Resources.NodeGroupRole;
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('EKS Cluster Resources', () => {
    test('should have EKS Cluster Security Group', () => {
      expect(template.Resources.EKSClusterSecurityGroup).toBeDefined();
      expect(template.Resources.EKSClusterSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EKS Cluster Security Group should allow all outbound traffic', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe('-1');
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EKS Cluster', () => {
      expect(template.Resources.EKSCluster).toBeDefined();
      expect(template.Resources.EKSCluster.Type).toBe('AWS::EKS::Cluster');
      expect(template.Resources.EKSCluster.DeletionPolicy).toBe('Delete');
    });

    test('EKS Cluster should use correct Kubernetes version', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Version.Ref).toBe('KubernetesVersion');
    });

    test('EKS Cluster should include environment suffix in name', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('EKS Cluster should have correct VPC configuration', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.SubnetIds).toHaveLength(6);
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(true);
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
    });

    test('EKS Cluster should have all logging types enabled', () => {
      const cluster = template.Resources.EKSCluster;
      const enabledTypes = cluster.Properties.Logging.ClusterLogging.EnabledTypes;
      expect(enabledTypes).toHaveLength(5);
      const types = enabledTypes.map((t: any) => t.Type);
      expect(types).toContain('api');
      expect(types).toContain('audit');
      expect(types).toContain('authenticator');
      expect(types).toContain('controllerManager');
      expect(types).toContain('scheduler');
    });

    test('should have OIDC Provider', () => {
      expect(template.Resources.OIDCProvider).toBeDefined();
      expect(template.Resources.OIDCProvider.Type).toBe('AWS::IAM::OIDCProvider');
      expect(template.Resources.OIDCProvider.DeletionPolicy).toBe('Delete');
    });

    test('OIDC Provider should have correct client ID', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.ClientIdList).toContain('sts.amazonaws.com');
    });

    test('OIDC Provider should have thumbprint', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc.Properties.ThumbprintList).toHaveLength(1);
      expect(oidc.Properties.ThumbprintList[0]).toBe('9e99a48a9960b14926bb7f3b02e22da2b0ab7280');
    });
  });

  describe('Launch Template and Node Group', () => {
    test('should have Node Launch Template', () => {
      expect(template.Resources.NodeLaunchTemplate).toBeDefined();
      expect(template.Resources.NodeLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(template.Resources.NodeLaunchTemplate.DeletionPolicy).toBe('Delete');
    });

    test('Launch Template should enforce IMDSv2', () => {
      const lt = template.Resources.NodeLaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpPutResponseHopLimit).toBe(1);
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpEndpoint).toBe('enabled');
    });

    test('Launch Template should have EBS configuration', () => {
      const lt = template.Resources.NodeLaunchTemplate;
      const blockDevices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;
      expect(blockDevices).toHaveLength(1);
      expect(blockDevices[0].DeviceName).toBe('/dev/xvda');
      expect(blockDevices[0].Ebs.VolumeSize).toBe(20);
      expect(blockDevices[0].Ebs.VolumeType).toBe('gp3');
      expect(blockDevices[0].Ebs.DeleteOnTermination).toBe(true);
    });

    test('Launch Template should have instance and volume tag specifications', () => {
      const lt = template.Resources.NodeLaunchTemplate;
      const tagSpecs = lt.Properties.LaunchTemplateData.TagSpecifications;
      expect(tagSpecs).toHaveLength(2);
      const resourceTypes = tagSpecs.map((ts: any) => ts.ResourceType);
      expect(resourceTypes).toContain('instance');
      expect(resourceTypes).toContain('volume');
    });

    test('should have EKS Node Group', () => {
      expect(template.Resources.EKSNodeGroup).toBeDefined();
      expect(template.Resources.EKSNodeGroup.Type).toBe('AWS::EKS::Nodegroup');
      expect(template.Resources.EKSNodeGroup.DeletionPolicy).toBe('Delete');
    });

    test('Node Group should include environment suffix in name', () => {
      const ng = template.Resources.EKSNodeGroup;
      expect(ng.Properties.NodegroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Node Group should use private subnets', () => {
      const ng = template.Resources.EKSNodeGroup;
      expect(ng.Properties.Subnets).toHaveLength(3);
      expect(ng.Properties.Subnets[0].Ref).toBe('PrivateSubnet1');
      expect(ng.Properties.Subnets[1].Ref).toBe('PrivateSubnet2');
      expect(ng.Properties.Subnets[2].Ref).toBe('PrivateSubnet3');
    });

    test('Node Group should have correct scaling configuration', () => {
      const ng = template.Resources.EKSNodeGroup;
      expect(ng.Properties.ScalingConfig.MinSize.Ref).toBe('NodeGroupMinSize');
      expect(ng.Properties.ScalingConfig.MaxSize.Ref).toBe('NodeGroupMaxSize');
      expect(ng.Properties.ScalingConfig.DesiredSize.Ref).toBe('NodeGroupDesiredSize');
    });

    test('Node Group should use AL2 AMI type', () => {
      const ng = template.Resources.EKSNodeGroup;
      expect(ng.Properties.AmiType).toBe('AL2_x86_64');
    });

    test('Node Group should use launch template', () => {
      const ng = template.Resources.EKSNodeGroup;
      expect(ng.Properties.LaunchTemplate.Id.Ref).toBe('NodeLaunchTemplate');
    });

    test('Node Group should have update configuration', () => {
      const ng = template.Resources.EKSNodeGroup;
      expect(ng.Properties.UpdateConfig.MaxUnavailable).toBe(1);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnets',
        'PrivateSubnets',
        'EKSClusterName',
        'EKSClusterEndpoint',
        'EKSClusterArn',
        'OIDCProviderArn',
        'OIDCIssuerURL',
        'NodeGroupArn',
        'NodeGroupName',
        'ClusterSecurityGroupId',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have exactly 12 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value.Ref).toBe('VPC');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPCId');
    });

    test('EKSClusterName output should be correct', () => {
      const output = template.Outputs.EKSClusterName;
      expect(output.Description).toBe('EKS Cluster Name');
      expect(output.Value.Ref).toBe('EKSCluster');
    });

    test('EKSClusterEndpoint output should be correct', () => {
      const output = template.Outputs.EKSClusterEndpoint;
      expect(output.Description).toBe('EKS Cluster Endpoint');
      expect(output.Value['Fn::GetAtt']).toEqual(['EKSCluster', 'Endpoint']);
    });

    test('OIDCIssuerURL output should be correct', () => {
      const output = template.Outputs.OIDCIssuerURL;
      expect(output.Description).toBe('OIDC Issuer URL');
      expect(output.Value['Fn::GetAtt']).toEqual(['EKSCluster', 'OpenIdConnectIssuerUrl']);
    });

    test('NodeGroupArn output should be correct', () => {
      const output = template.Outputs.NodeGroupArn;
      expect(output.Description).toBe('EKS Node Group ARN');
      expect(output.Value['Fn::GetAtt']).toEqual(['EKSNodeGroup', 'Arn']);
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe('Environment suffix used for this deployment');
      expect(output.Value.Ref).toBe('EnvironmentSuffix');
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should include environment suffix in names', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'EKSClusterRole',
        'EKSClusterSecurityGroup',
        'EKSCluster',
        'NodeGroupRole',
        'NodeLaunchTemplate',
        'EKSNodeGroup',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.Name ||
          resource.Properties.RoleName ||
          resource.Properties.NodegroupName ||
          resource.Properties.LaunchTemplateName ||
          resource.Properties.GroupName;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('all resources should have Production and CloudFormation tags', () => {
      const resourcesWithTags = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'EKSClusterRole',
        'EKSClusterSecurityGroup',
        'EKSCluster',
        'NodeGroupRole',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        expect(tags).toBeDefined();

        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        const managedByTag = tags.find((tag: any) => tag.Key === 'ManagedBy');

        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
        expect(managedByTag).toBeDefined();
        expect(managedByTag.Value).toBe('CloudFormation');
      });
    });
  });

  describe('Deletion Policy', () => {
    test('all resources should have DeletionPolicy Delete', () => {
      const criticalResources = [
        'VPC',
        'InternetGateway',
        'InternetGatewayAttachment',
        'PublicSubnet1',
        'PrivateSubnet1',
        'EIPNatGateway1',
        'NatGateway1',
        'PublicRouteTable',
        'DefaultPublicRoute',
        'PrivateRouteTable1',
        'DefaultPrivateRoute1',
        'EKSClusterRole',
        'EKSClusterSecurityGroup',
        'EKSCluster',
        'OIDCProvider',
        'NodeGroupRole',
        'NodeLaunchTemplate',
        'EKSNodeGroup',
      ];

      criticalResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('no resources should have Retain policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // VPC(1) + IGW(1) + IGWAttach(1) + Subnets(6) + EIPs(3) + NATs(3) +
      // RouteTables(4) + Routes(4) + RTAssociations(6) +
      // IAM Roles(2) + SG(1) + EKS(1) + OIDC(1) + LaunchTemplate(1) + NodeGroup(1)
      expect(resourceCount).toBe(36);
    });

    test('should have correct IAM resource count', () => {
      const iamResources = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type.startsWith('AWS::IAM::')
      );
      expect(iamResources).toHaveLength(3); // 2 Roles + 1 OIDC Provider
    });

    test('should have correct EC2 resource count', () => {
      const ec2Resources = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type.startsWith('AWS::EC2::')
      );
      expect(ec2Resources).toHaveLength(31); // VPC, IGW, IGWAttach, 6 Subnets, 3 EIPs, 3 NATs, 4 RTs, 4 Routes, 6 RTAssociations, 1 SG, 1 LaunchTemplate
    });

    test('should have correct EKS resource count', () => {
      const eksResources = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type.startsWith('AWS::EKS::')
      );
      expect(eksResources).toHaveLength(2); // Cluster + NodeGroup
    });
  });
});
