import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('EKS CloudFormation Template Unit Tests', () => {
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

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have environmentSuffix parameter', () => {
      expect(template.Parameters.environmentSuffix).toBeDefined();
      expect(template.Parameters.environmentSuffix.Type).toBe('String');
      expect(template.Parameters.environmentSuffix.Default).toBe('dev');
    });

    test('should have KubernetesVersion parameter', () => {
      expect(template.Parameters.KubernetesVersion).toBeDefined();
      expect(template.Parameters.KubernetesVersion.Type).toBe('String');
      expect(template.Parameters.KubernetesVersion.Default).toBe('1.28');
    });

    test('should have NodeInstanceType parameter', () => {
      expect(template.Parameters.NodeInstanceType).toBeDefined();
      expect(template.Parameters.NodeInstanceType.Type).toBe('String');
      expect(template.Parameters.NodeInstanceType.Default).toBe('t3.medium');
    });

    test('should have node group scaling parameters', () => {
      expect(template.Parameters.NodeGroupMinSize).toBeDefined();
      expect(template.Parameters.NodeGroupMaxSize).toBeDefined();
      expect(template.Parameters.NodeGroupDesiredSize).toBeDefined();
    });

    test('should have VpcCIDR parameter', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct properties', () => {
      const vpc = template.Resources.EKSVpc;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should create two public subnets', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create two private subnets', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet2).toBeDefined();
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should create NAT Gateways with EIPs', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;

      expect(nat1).toBeDefined();
      expect(nat2).toBeDefined();
      expect(eip1).toBeDefined();
      expect(eip2).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');
    });

    test('should create route tables for public and private subnets', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT1 = template.Resources.PrivateRouteTable1;
      const privateRT2 = template.Resources.PrivateRouteTable2;

      expect(publicRT).toBeDefined();
      expect(privateRT1).toBeDefined();
      expect(privateRT2).toBeDefined();
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT1.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT2.Type).toBe('AWS::EC2::RouteTable');
    });
  });

  describe('Security Groups', () => {
    test('should create cluster security group', () => {
      const clusterSG = template.Resources.ClusterSecurityGroup;
      expect(clusterSG).toBeDefined();
      expect(clusterSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(clusterSG.Properties.GroupDescription).toContain('cluster control plane');
    });

    test('should create node security group', () => {
      const nodeSG = template.Resources.NodeSecurityGroup;
      expect(nodeSG).toBeDefined();
      expect(nodeSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(nodeSG.Properties.GroupDescription).toContain('worker nodes');
    });

    test('should configure node-to-node communication', () => {
      const nodeIngress = template.Resources.NodeSecurityGroupIngress;
      expect(nodeIngress).toBeDefined();
      expect(nodeIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(nodeIngress.Properties.IpProtocol).toBe(-1);
    });

    test('should configure node-to-cluster communication', () => {
      const clusterIngress = template.Resources.ClusterSecurityGroupFromNodeIngress;
      expect(clusterIngress).toBeDefined();
      expect(clusterIngress.Properties.IpProtocol).toBe('tcp');
      expect(clusterIngress.Properties.FromPort).toBe(443);
    });

    test('should configure cluster-to-node communication', () => {
      const nodeFromCluster = template.Resources.NodeSecurityGroupFromClusterIngress;
      expect(nodeFromCluster).toBeDefined();
      expect(nodeFromCluster.Properties.IpProtocol).toBe('tcp');
      expect(nodeFromCluster.Properties.FromPort).toBe(1025);
      expect(nodeFromCluster.Properties.ToPort).toBe(65535);
    });
  });

  describe('IAM Roles', () => {
    test('should create EKS cluster role', () => {
      const clusterRole = template.Resources.EKSClusterRole;
      expect(clusterRole).toBeDefined();
      expect(clusterRole.Type).toBe('AWS::IAM::Role');

      const managedPolicies = clusterRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('should create EKS node role', () => {
      const nodeRole = template.Resources.EKSNodeRole;
      expect(nodeRole).toBeDefined();
      expect(nodeRole.Type).toBe('AWS::IAM::Role');

      const managedPolicies = nodeRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key for EKS encryption', () => {
      const kmsKey = template.Resources.EKSKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create KMS alias', () => {
      const kmsAlias = template.Resources.EKSKMSKeyAlias;
      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have proper permissions for EKS', () => {
      const kmsKey = template.Resources.EKSKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;

      const eksStatement = statements.find((s: any) =>
        s.Sid === 'Allow EKS to use the key'
      );
      expect(eksStatement).toBeDefined();
      expect(eksStatement.Principal.Service).toBe('eks.amazonaws.com');
    });
  });

  describe('CloudWatch Logging', () => {
    test('should create log group for EKS cluster', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('log group name should include environmentSuffix', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Properties.LogGroupName).toBeDefined();
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${environmentSuffix}');
    });
  });

  describe('EKS Cluster', () => {
    test('should create EKS cluster', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('cluster should have correct version reference', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Version).toEqual({ Ref: 'KubernetesVersion' });
    });

    test('cluster should enable all control plane logging', () => {
      const cluster = template.Resources.EKSCluster;
      const logging = cluster.Properties.Logging.ClusterLogging.EnabledTypes;

      expect(logging).toHaveLength(5);
      expect(logging.find((l: any) => l.Type === 'api')).toBeDefined();
      expect(logging.find((l: any) => l.Type === 'audit')).toBeDefined();
      expect(logging.find((l: any) => l.Type === 'authenticator')).toBeDefined();
      expect(logging.find((l: any) => l.Type === 'controllerManager')).toBeDefined();
      expect(logging.find((l: any) => l.Type === 'scheduler')).toBeDefined();
    });

    test('cluster should enable private and public endpoint access', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(true);
    });

    test('cluster should have encryption configured', () => {
      const cluster = template.Resources.EKSCluster;
      const encryptionConfig = cluster.Properties.EncryptionConfig;

      expect(encryptionConfig).toHaveLength(1);
      expect(encryptionConfig[0].Resources).toContain('secrets');
    });

    test('cluster name should include environmentSuffix', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Name['Fn::Sub']).toContain('${environmentSuffix}');
    });
  });

  describe('EKS Node Group', () => {
    test('should create EKS node group', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup).toBeDefined();
      expect(nodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('node group should depend on EKS cluster', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      // Dependency is implicit through ClusterName reference (better practice than explicit DependsOn)
      expect(nodeGroup.Properties.ClusterName).toBeDefined();
      expect(nodeGroup.Properties.ClusterName.Ref || nodeGroup.Properties.ClusterName['Ref']).toBe('EKSCluster');
    });

    test('node group should have scaling configuration', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const scalingConfig = nodeGroup.Properties.ScalingConfig;

      expect(scalingConfig.MinSize).toEqual({ Ref: 'NodeGroupMinSize' });
      expect(scalingConfig.MaxSize).toEqual({ Ref: 'NodeGroupMaxSize' });
      expect(scalingConfig.DesiredSize).toEqual({ Ref: 'NodeGroupDesiredSize' });
    });

    test('node group should use AL2 AMI type', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_x86_64');
    });

    test('node group should be in private subnets', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const subnets = nodeGroup.Properties.Subnets;

      expect(subnets).toHaveLength(2);
      expect(subnets[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('Resource Naming', () => {
    test('all named resources should include environmentSuffix', () => {
      const namedResources = [
        'EKSVpc',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGateway1',
        'NATGateway2',
        'ClusterSecurityGroup',
        'NodeSecurityGroup',
        'EKSCluster',
        'EKSNodeGroup'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags && Array.isArray(resource.Properties.Tags)) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${environmentSuffix}');
          }
        }
        if (resource.Properties.Name) {
          expect(JSON.stringify(resource.Properties.Name)).toContain('environmentSuffix');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have ClusterName output', () => {
      const output = template.Outputs.ClusterName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'EKSCluster' });
    });

    test('should have ClusterEndpoint output', () => {
      const output = template.Outputs.ClusterEndpoint;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['EKSCluster', 'Endpoint']);
    });

    test('should have VpcId output', () => {
      const output = template.Outputs.VpcId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'EKSVpc' });
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have security and encryption outputs', () => {
      expect(template.Outputs.ClusterSecurityGroupId).toBeDefined();
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.ClusterLogGroupName).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Best Practices', () => {
    test('should not have Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('EKS cluster should use all four subnets for high availability', () => {
      const cluster = template.Resources.EKSCluster;
      const subnets = cluster.Properties.ResourcesVpcConfig.SubnetIds;

      expect(subnets).toHaveLength(4);
    });

    test('should have proper dependencies for NAT Gateway EIPs', () => {
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;

      expect(eip1.DependsOn).toContain('VPCGatewayAttachment');
      expect(eip2.DependsOn).toContain('VPCGatewayAttachment');
    });
  });
});
