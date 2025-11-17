import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - EKS Infrastructure', () => {
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

    test('should have a description for EKS infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('EKS');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have ClusterVersion parameter with allowed values', () => {
      expect(template.Parameters.ClusterVersion).toBeDefined();
      expect(template.Parameters.ClusterVersion.Type).toBe('String');
      expect(template.Parameters.ClusterVersion.AllowedValues).toContain('1.28');
      expect(template.Parameters.ClusterVersion.AllowedValues).toContain('1.29');
      expect(template.Parameters.ClusterVersion.AllowedValues).toContain('1.30');
    });

    test('should have NodeInstanceType parameter', () => {
      expect(template.Parameters.NodeInstanceType).toBeDefined();
      expect(template.Parameters.NodeInstanceType.Type).toBe('String');
      expect(template.Parameters.NodeInstanceType.Default).toBe('t3.medium');
    });

    test('should have NodeGroupMinSize parameter', () => {
      expect(template.Parameters.NodeGroupMinSize).toBeDefined();
      expect(template.Parameters.NodeGroupMinSize.Type).toBe('Number');
      expect(template.Parameters.NodeGroupMinSize.Default).toBe(2);
      expect(template.Parameters.NodeGroupMinSize.MinValue).toBe(1);
    });

    test('should have NodeGroupMaxSize parameter', () => {
      expect(template.Parameters.NodeGroupMaxSize).toBeDefined();
      expect(template.Parameters.NodeGroupMaxSize.Type).toBe('Number');
      expect(template.Parameters.NodeGroupMaxSize.Default).toBe(4);
    });

    test('should have NodeGroupDesiredSize parameter', () => {
      expect(template.Parameters.NodeGroupDesiredSize).toBeDefined();
      expect(template.Parameters.NodeGroupDesiredSize.Type).toBe('Number');
      expect(template.Parameters.NodeGroupDesiredSize.Default).toBe(2);
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

    test('VPC should enable DNS hostnames and support', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have name tag with environment suffix', () => {
      const nameTag = template.Resources.VPC.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Internet Gateway', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have VPC gateway attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
      expect(template.Resources.AttachGateway.Properties.VpcId).toEqual({
        Ref: 'VPC',
      });
      expect(
        template.Resources.AttachGateway.Properties.InternetGatewayId
      ).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnets', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );
    });

    test('public subnets should map public IP on launch', () => {
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('public subnets should have ELB tag', () => {
      const subnet1Tag = template.Resources.PublicSubnet1.Properties.Tags.find(
        (tag: any) => tag.Key === 'kubernetes.io/role/elb'
      );
      const subnet2Tag = template.Resources.PublicSubnet2.Properties.Tags.find(
        (tag: any) => tag.Key === 'kubernetes.io/role/elb'
      );
      expect(subnet1Tag).toBeDefined();
      expect(subnet2Tag).toBeDefined();
      expect(subnet1Tag.Value).toBe('1');
      expect(subnet2Tag.Value).toBe('1');
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.0.10.0/24'
      );
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.0.11.0/24'
      );
    });

    test('private subnets should have internal ELB tag', () => {
      const subnet1Tag =
        template.Resources.PrivateSubnet1.Properties.Tags.find(
          (tag: any) => tag.Key === 'kubernetes.io/role/internal-elb'
        );
      const subnet2Tag =
        template.Resources.PrivateSubnet2.Properties.Tags.find(
          (tag: any) => tag.Key === 'kubernetes.io/role/internal-elb'
        );
      expect(subnet1Tag).toBeDefined();
      expect(subnet2Tag).toBeDefined();
      expect(subnet1Tag.Value).toBe('1');
      expect(subnet2Tag.Value).toBe('1');
    });
  });

  describe('NAT Gateway', () => {
    test('should have NAT Gateway EIP', () => {
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NATGatewayEIP.Properties.Domain).toBe('vpc');
    });

    test('NAT Gateway EIP should depend on gateway attachment', () => {
      expect(template.Resources.NATGatewayEIP.DependsOn).toBe(
        'AttachGateway'
      );
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateway should reference EIP and public subnet', () => {
      expect(
        template.Resources.NATGateway.Properties.AllocationId
      ).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'],
      });
      expect(template.Resources.NATGateway.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have public route to internet gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(
        template.Resources.PublicRoute.Properties.DestinationCidrBlock
      ).toBe('0.0.0.0/0');
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('should have route table associations for public subnets', () => {
      expect(
        template.Resources.PublicSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PublicSubnet2RouteTableAssociation
      ).toBeDefined();
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have private route to NAT gateway', () => {
      expect(template.Resources.PrivateRoute).toBeDefined();
      expect(template.Resources.PrivateRoute.Type).toBe('AWS::EC2::Route');
      expect(
        template.Resources.PrivateRoute.Properties.DestinationCidrBlock
      ).toBe('0.0.0.0/0');
      expect(template.Resources.PrivateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'NATGateway',
      });
    });

    test('should have route table associations for private subnets', () => {
      expect(
        template.Resources.PrivateSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet2RouteTableAssociation
      ).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for EKS encryption', () => {
      expect(template.Resources.EKSEncryptionKey).toBeDefined();
      expect(template.Resources.EKSEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper key policy', () => {
      const keyPolicy =
        template.Resources.EKSEncryptionKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);
    });

    test('KMS key policy should allow IAM root', () => {
      const keyPolicy =
        template.Resources.EKSEncryptionKey.Properties.KeyPolicy;
      const rootStatement = keyPolicy.Statement.find(
        (stmt: any) => stmt.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS key policy should allow EKS service', () => {
      const keyPolicy =
        template.Resources.EKSEncryptionKey.Properties.KeyPolicy;
      const eksStatement = keyPolicy.Statement.find(
        (stmt: any) => stmt.Sid === 'Allow EKS to use the key'
      );
      expect(eksStatement).toBeDefined();
      expect(eksStatement.Principal.Service).toBe('eks.amazonaws.com');
      expect(eksStatement.Action).toContain('kms:Decrypt');
      expect(eksStatement.Action).toContain('kms:CreateGrant');
    });

    test('should have KMS key alias with environment suffix', () => {
      expect(template.Resources.EKSEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EKSEncryptionKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
      expect(
        template.Resources.EKSEncryptionKeyAlias.Properties.AliasName
      ).toEqual({
        'Fn::Sub': 'alias/eks-${EnvironmentSuffix}',
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('should have CloudWatch log group for EKS', () => {
      expect(template.Resources.EKSClusterLogGroup).toBeDefined();
      expect(template.Resources.EKSClusterLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('log group should have correct name with environment suffix', () => {
      expect(
        template.Resources.EKSClusterLogGroup.Properties.LogGroupName
      ).toEqual({
        'Fn::Sub': '/aws/eks/cluster-${EnvironmentSuffix}/cluster',
      });
    });

    test('log group should have retention policy', () => {
      expect(
        template.Resources.EKSClusterLogGroup.Properties.RetentionInDays
      ).toBe(7);
    });
  });

  describe('IAM Roles', () => {
    test('should have EKS cluster role', () => {
      expect(template.Resources.EKSClusterRole).toBeDefined();
      expect(template.Resources.EKSClusterRole.Type).toBe('AWS::IAM::Role');
    });

    test('cluster role should have correct assume role policy', () => {
      const assumePolicy =
        template.Resources.EKSClusterRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'eks.amazonaws.com'
      );
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('cluster role should have required managed policies', () => {
      const policies =
        template.Resources.EKSClusterRole.Properties.ManagedPolicyArns;
      expect(policies).toContain(
        'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy'
      );
      expect(policies).toContain(
        'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController'
      );
    });

    test('should have EKS node role', () => {
      expect(template.Resources.EKSNodeRole).toBeDefined();
      expect(template.Resources.EKSNodeRole.Type).toBe('AWS::IAM::Role');
    });

    test('node role should have correct assume role policy', () => {
      const assumePolicy =
        template.Resources.EKSNodeRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
    });

    test('node role should have required managed policies', () => {
      const policies =
        template.Resources.EKSNodeRole.Properties.ManagedPolicyArns;
      expect(policies).toContain(
        'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy'
      );
      expect(policies).toContain(
        'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy'
      );
      expect(policies).toContain(
        'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
      );
      expect(policies).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });
  });

  describe('Security Groups', () => {
    test('should have EKS cluster security group', () => {
      expect(template.Resources.EKSClusterSecurityGroup).toBeDefined();
      expect(template.Resources.EKSClusterSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('security group should have name with environment suffix', () => {
      expect(
        template.Resources.EKSClusterSecurityGroup.Properties.GroupName
      ).toEqual({
        'Fn::Sub': 'eks-cluster-sg-${EnvironmentSuffix}',
      });
    });

    test('security group should allow all outbound traffic', () => {
      const egress =
        template.Resources.EKSClusterSecurityGroup.Properties
          .SecurityGroupEgress;
      expect(egress).toHaveLength(1);
      expect(egress[0].IpProtocol).toBe(-1);
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('EKS Cluster', () => {
    test('should have EKS cluster resource', () => {
      expect(template.Resources.EKSCluster).toBeDefined();
      expect(template.Resources.EKSCluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('cluster should have name with environment suffix', () => {
      expect(template.Resources.EKSCluster.Properties.Name).toEqual({
        'Fn::Sub': 'eks-cluster-${EnvironmentSuffix}',
      });
    });

    test('cluster should reference version parameter', () => {
      expect(template.Resources.EKSCluster.Properties.Version).toEqual({
        Ref: 'ClusterVersion',
      });
    });

    test('cluster should have correct VPC configuration', () => {
      const vpcConfig =
        template.Resources.EKSCluster.Properties.ResourcesVpcConfig;
      expect(vpcConfig.SubnetIds).toHaveLength(4);
      expect(vpcConfig.EndpointPublicAccess).toBe(true);
      expect(vpcConfig.EndpointPrivateAccess).toBe(true);
    });

    test('cluster should have encryption enabled', () => {
      const encryptionConfig =
        template.Resources.EKSCluster.Properties.EncryptionConfig;
      expect(encryptionConfig).toHaveLength(1);
      expect(encryptionConfig[0].Resources).toContain('secrets');
      expect(encryptionConfig[0].Provider.KeyArn).toEqual({
        'Fn::GetAtt': ['EKSEncryptionKey', 'Arn'],
      });
    });

    test('cluster should have all logging types enabled', () => {
      const logging =
        template.Resources.EKSCluster.Properties.Logging.ClusterLogging;
      expect(logging.EnabledTypes).toHaveLength(5);

      const logTypes = logging.EnabledTypes.map((lt: any) => lt.Type);
      expect(logTypes).toContain('api');
      expect(logTypes).toContain('audit');
      expect(logTypes).toContain('authenticator');
      expect(logTypes).toContain('controllerManager');
      expect(logTypes).toContain('scheduler');
    });
  });

  describe('EKS Node Group', () => {
    test('should have EKS node group resource', () => {
      expect(template.Resources.EKSNodeGroup).toBeDefined();
      expect(template.Resources.EKSNodeGroup.Type).toBe(
        'AWS::EKS::Nodegroup'
      );
    });

    test('node group should have name with environment suffix', () => {
      expect(template.Resources.EKSNodeGroup.Properties.NodegroupName).toEqual(
        {
          'Fn::Sub': 'eks-nodegroup-${EnvironmentSuffix}',
        }
      );
    });

    test('node group should reference cluster name', () => {
      expect(template.Resources.EKSNodeGroup.Properties.ClusterName).toEqual({
        Ref: 'EKSCluster',
      });
    });

    test('node group should be in private subnets', () => {
      const subnets = template.Resources.EKSNodeGroup.Properties.Subnets;
      expect(subnets).toHaveLength(2);
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('node group should have correct scaling configuration', () => {
      const scalingConfig =
        template.Resources.EKSNodeGroup.Properties.ScalingConfig;
      expect(scalingConfig.MinSize).toEqual({ Ref: 'NodeGroupMinSize' });
      expect(scalingConfig.MaxSize).toEqual({ Ref: 'NodeGroupMaxSize' });
      expect(scalingConfig.DesiredSize).toEqual({
        Ref: 'NodeGroupDesiredSize',
      });
    });

    test('node group should use correct AMI type', () => {
      expect(template.Resources.EKSNodeGroup.Properties.AmiType).toBe(
        'AL2_x86_64'
      );
    });

    test('node group should reference instance type parameter', () => {
      const instanceTypes =
        template.Resources.EKSNodeGroup.Properties.InstanceTypes;
      expect(instanceTypes).toHaveLength(1);
      expect(instanceTypes[0]).toEqual({ Ref: 'NodeInstanceType' });
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ClusterName',
        'ClusterArn',
        'ClusterEndpoint',
        'ClusterSecurityGroupId',
        'NodeGroupName',
        'KMSKeyId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ClusterLogGroupName',
      ];

      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('ClusterName output should be correct', () => {
      expect(template.Outputs.ClusterName.Value).toEqual({
        Ref: 'EKSCluster',
      });
    });

    test('ClusterArn output should be correct', () => {
      expect(template.Outputs.ClusterArn.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'Arn'],
      });
    });

    test('ClusterEndpoint output should be correct', () => {
      expect(template.Outputs.ClusterEndpoint.Value).toEqual({
        'Fn::GetAtt': ['EKSCluster', 'Endpoint'],
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with names should include environment suffix', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGatewayEIP',
        'NATGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'EKSEncryptionKeyAlias',
        'EKSClusterLogGroup',
        'EKSClusterRole',
        'EKSClusterSecurityGroup',
        'EKSCluster',
        'EKSNodeRole',
        'EKSNodeGroup',
      ];

      resourcesWithNames.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        const resourceStr = JSON.stringify(resource);
        expect(resourceStr).toMatch(/EnvironmentSuffix/);
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach((resourceKey) => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('VPC should span multiple availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should use appropriate CIDR blocks for cluster growth', () => {
      // VPC uses /16 which provides 65,536 IPs
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');

      // Subnets use /24 which provides 256 IPs each
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toMatch(/\/24$/);
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toMatch(/\/24$/);
    });

    test('nodes should be deployed in private subnets', () => {
      const nodeSubnets = template.Resources.EKSNodeGroup.Properties.Subnets;
      expect(nodeSubnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(nodeSubnets).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(nodeSubnets).not.toContainEqual({ Ref: 'PublicSubnet1' });
      expect(nodeSubnets).not.toContainEqual({ Ref: 'PublicSubnet2' });
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
      expect(resourceCount).toBe(25);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });
});
