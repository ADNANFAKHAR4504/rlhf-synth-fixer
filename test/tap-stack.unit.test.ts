import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('EKS Cluster CloudFormation Template', () => {
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
      expect(template.Description).toContain('EKS Cluster');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have KubernetesVersion parameter', () => {
      const k8sParam = template.Parameters.KubernetesVersion;
      expect(k8sParam).toBeDefined();
      expect(k8sParam.Type).toBe('String');
      expect(k8sParam.Default).toBe('1.28');
      expect(k8sParam.AllowedValues).toContain('1.28');
    });

    test('should have node group scaling parameters', () => {
      expect(template.Parameters.NodeGroupMinSize).toBeDefined();
      expect(template.Parameters.NodeGroupDesiredSize).toBeDefined();
      expect(template.Parameters.NodeGroupMaxSize).toBeDefined();

      expect(template.Parameters.NodeGroupMinSize.Type).toBe('Number');
      expect(template.Parameters.NodeGroupMinSize.Default).toBe(2);
    });

    test('should have NodeInstanceType parameter', () => {
      const instanceParam = template.Parameters.NodeInstanceType;
      expect(instanceParam).toBeDefined();
      expect(instanceParam.Type).toBe('String');
      expect(instanceParam.AllowedValues).toContain('t3.medium');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have EnvironmentSuffix in name tag', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have 2 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have 2 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have different CIDR blocks', () => {
      const subnet1 = template.Resources.PublicSubnet1.Properties;
      const subnet2 = template.Resources.PublicSubnet2.Properties;

      expect(subnet1.CidrBlock).toBe('10.0.0.0/24');
      expect(subnet2.CidrBlock).toBe('10.0.1.0/24');
    });

    test('private subnets should have different CIDR blocks', () => {
      const subnet1 = template.Resources.PrivateSubnet1.Properties;
      const subnet2 = template.Resources.PrivateSubnet2.Properties;

      expect(subnet1.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet2.CidrBlock).toBe('10.0.11.0/24');
    });

    test('public subnets should auto-assign public IPs', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('subnets should be in different availability zones', () => {
      const pub1Az = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const pub2Az = template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(pub1Az['Fn::Select'][0]).toBe(0);
      expect(pub2Az['Fn::Select'][0]).toBe(1);
    });

    test('public subnets should have kubernetes ELB tag', () => {
      const subnet1Tags = template.Resources.PublicSubnet1.Properties.Tags;
      const elbTag = subnet1Tags.find((tag: any) => tag.Key === 'kubernetes.io/role/elb');
      expect(elbTag).toBeDefined();
      expect(elbTag.Value).toBe('1');
    });

    test('private subnets should have kubernetes internal ELB tag', () => {
      const subnet1Tags = template.Resources.PrivateSubnet1.Properties.Tags;
      const elbTag = subnet1Tags.find((tag: any) => tag.Key === 'kubernetes.io/role/internal-elb');
      expect(elbTag).toBeDefined();
      expect(elbTag.Value).toBe('1');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway EIP', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('should have NAT Gateway', () => {
      const nat = template.Resources.NATGateway;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('NAT Gateway should have EnvironmentSuffix in name', () => {
      const nat = template.Resources.NATGateway;
      const nameTag = nat.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public route table', () => {
      const rt = template.Resources.PublicRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route table', () => {
      const rt = template.Resources.PrivateRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
    });

    test('public route should point to internet gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('private route should point to NAT gateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 VPC endpoint', () => {
      const endpoint = template.Resources.S3VPCEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('S3 endpoint should be associated with route tables', () => {
      const endpoint = template.Resources.S3VPCEndpoint;
      expect(endpoint.Properties.RouteTableIds).toHaveLength(2);
      expect(endpoint.Properties.RouteTableIds).toContainEqual({ Ref: 'PrivateRouteTable' });
      expect(endpoint.Properties.RouteTableIds).toContainEqual({ Ref: 'PublicRouteTable' });
    });
  });

  describe('Security Groups', () => {
    test('should have EKS cluster security group', () => {
      const sg = template.Resources.EKSClusterSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('EKS cluster');
    });

    test('should have EKS node security group', () => {
      const sg = template.Resources.EKSNodeSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('worker nodes');
    });

    test('security groups should have EnvironmentSuffix in names', () => {
      const clusterSg = template.Resources.EKSClusterSecurityGroup;
      const nodeSg = template.Resources.EKSNodeSecurityGroup;

      expect(clusterSg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(nodeSg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have security group ingress rules', () => {
      expect(template.Resources.NodeSecurityGroupIngress).toBeDefined();
      expect(template.Resources.NodeSecurityGroupFromClusterIngress).toBeDefined();
      expect(template.Resources.ClusterSecurityGroupIngressFromNodes).toBeDefined();
    });

    test('node-to-node communication should allow all traffic', () => {
      const rule = template.Resources.NodeSecurityGroupIngress;
      expect(rule.Properties.IpProtocol).toBe('-1');
      expect(rule.Properties.SourceSecurityGroupId).toEqual({ Ref: 'EKSNodeSecurityGroup' });
    });

    test('cluster-node communication should use port 443', () => {
      const rule = template.Resources.NodeSecurityGroupFromClusterIngress;
      expect(rule.Properties.IpProtocol).toBe('tcp');
      expect(rule.Properties.FromPort).toBe(443);
      expect(rule.Properties.ToPort).toBe(443);
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key for EKS encryption', () => {
      const key = template.Resources.KMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should allow EKS service to use it', () => {
      const key = template.Resources.KMSKey;
      const policy = key.Properties.KeyPolicy;
      const eksStatement = policy.Statement.find((s: any) => s.Sid === 'Allow EKS to use the key');

      expect(eksStatement).toBeDefined();
      expect(eksStatement.Principal.Service).toBe('eks.amazonaws.com');
      expect(eksStatement.Action).toContain('kms:Encrypt');
      expect(eksStatement.Action).toContain('kms:Decrypt');
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('IAM Roles', () => {
    test('should have EKS cluster IAM role', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('EKS cluster role should have correct trust policy', () => {
      const role = template.Resources.EKSClusterRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Statement[0].Principal.Service).toBe('eks.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EKS cluster role should have required managed policies', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('should have EKS node IAM role', () => {
      const role = template.Resources.EKSNodeRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EKS node role should have correct trust policy', () => {
      const role = template.Resources.EKSNodeRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EKS node role should have required managed policies', () => {
      const role = template.Resources.EKSNodeRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have CloudWatch log group for EKS', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group name should include EnvironmentSuffix', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('log group should have retention policy', () => {
      const logGroup = template.Resources.EKSClusterLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('EKS Cluster', () => {
    test('should have EKS cluster resource', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::EKS::Cluster');
    });

    test('EKS cluster should depend on log group', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.DependsOn).toContain('EKSClusterLogGroup');
    });

    test('EKS cluster name should include EnvironmentSuffix', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('EKS cluster should use Kubernetes version parameter', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.Version).toEqual({ Ref: 'KubernetesVersion' });
    });

    test('EKS cluster should have encryption enabled', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.EncryptionConfig).toBeDefined();
      expect(cluster.Properties.EncryptionConfig[0].Resources).toContain('secrets');
    });

    test('EKS cluster should have all logging types enabled', () => {
      const cluster = template.Resources.EKSCluster;
      const logging = cluster.Properties.Logging.ClusterLogging.EnabledTypes;

      expect(logging).toHaveLength(5);
      expect(logging.map((t: any) => t.Type)).toContain('api');
      expect(logging.map((t: any) => t.Type)).toContain('audit');
      expect(logging.map((t: any) => t.Type)).toContain('authenticator');
      expect(logging.map((t: any) => t.Type)).toContain('controllerManager');
      expect(logging.map((t: any) => t.Type)).toContain('scheduler');
    });

    test('EKS cluster should have both public and private endpoint access', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(true);
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
    });

    test('EKS cluster should use all subnets', () => {
      const cluster = template.Resources.EKSCluster;
      const subnetIds = cluster.Properties.ResourcesVpcConfig.SubnetIds;

      expect(subnetIds).toHaveLength(4);
      expect(subnetIds).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PublicSubnet2' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('EKS Node Group', () => {
    test('should have EKS node group resource', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup).toBeDefined();
      expect(nodeGroup.Type).toBe('AWS::EKS::Nodegroup');
    });

    test('node group name should include EnvironmentSuffix', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.NodegroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('node group should be in private subnets only', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const subnets = nodeGroup.Properties.Subnets;

      expect(subnets).toHaveLength(2);
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('node group should have auto-scaling configuration', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      const scaling = nodeGroup.Properties.ScalingConfig;

      expect(scaling.MinSize).toEqual({ Ref: 'NodeGroupMinSize' });
      expect(scaling.DesiredSize).toEqual({ Ref: 'NodeGroupDesiredSize' });
      expect(scaling.MaxSize).toEqual({ Ref: 'NodeGroupMaxSize' });
    });

    test('node group should use instance type parameter', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.InstanceTypes).toContainEqual({ Ref: 'NodeInstanceType' });
    });

    test('node group should use Amazon Linux 2 AMI', () => {
      const nodeGroup = template.Resources.EKSNodeGroup;
      expect(nodeGroup.Properties.AmiType).toBe('AL2_x86_64');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'EKSClusterName',
        'EKSClusterEndpoint',
        'EKSClusterSecurityGroupId',
        'EKSNodeGroupName',
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'KMSKeyId',
        'EKSClusterArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Description).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Export).toBeDefined();
        expect(template.Outputs[key].Export.Name).toBeDefined();
      });
    });

    test('EKSClusterName output should reference cluster', () => {
      const output = template.Outputs.EKSClusterName;
      expect(output.Value).toEqual({ Ref: 'EKSCluster' });
    });

    test('EKSClusterEndpoint output should get cluster endpoint', () => {
      const output = template.Outputs.EKSClusterEndpoint;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['EKSCluster', 'Endpoint'] });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('at least 80% of named resources should include EnvironmentSuffix', () => {
      const namedResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        const props = resource.Properties;

        return props && (
          props.Name ||
          props.GroupName ||
          props.RoleName ||
          props.TableName ||
          props.LogGroupName ||
          props.NodegroupName ||
          props.ClusterName ||
          props.AliasName
        );
      });

      const resourcesWithSuffix = namedResources.filter(key => {
        const resource = template.Resources[key];
        const props = resource.Properties;
        const nameValue = props.Name || props.GroupName || props.RoleName ||
                         props.TableName || props.LogGroupName || props.NodegroupName ||
                         props.ClusterName || props.AliasName;

        if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
          return nameValue['Fn::Sub'].includes('${EnvironmentSuffix}');
        }
        return false;
      });

      const percentage = (resourcesWithSuffix.length / namedResources.length) * 100;
      expect(percentage).toBeGreaterThanOrEqual(80);
    });

    test('no resources should have hardcoded environment names', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/["\']prod-/i);
      expect(templateStr).not.toMatch(/["\']dev-/i);
      expect(templateStr).not.toMatch(/["\']stage-/i);
      expect(templateStr).not.toMatch(/["\']staging-/i);
    });
  });

  describe('Deletion Policies', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('no resources should have DeletionProtection enabled', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.Properties && resource.Properties.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have exactly 30 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(30);
    });

    test('should have 6 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have 11 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });
});
