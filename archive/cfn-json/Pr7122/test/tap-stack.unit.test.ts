import fs from 'fs';
import path from 'path';

describe('TapStack EKS Cluster CloudFormation Template', () => {
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
      expect(template.Description).toContain('EKS cluster');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBe(3);
    });

    test('should have Resources section with multiple resources', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(40);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBe(9);
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter should have validation', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('VpcCidr parameter should be defined', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toBeDefined();
    });

    test('EKSVersion parameter should be defined', () => {
      const param = template.Parameters.EKSVersion;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('1.28');
      expect(param.Description).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS Key with proper configuration', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
    });

    test('KMS Key should have proper tags', () => {
      const tags = template.Resources.KMSKey.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Name')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
    });

    test('should have KMS Key Alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('alias/eks-');
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock.Ref).toBe('VpcCidr');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('eks-vpc-');
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
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
    });
  });

  describe('Subnets', () => {
    const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
    const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];

    test('should have 3 private subnets', () => {
      privateSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have 3 public subnets', () => {
      publicSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('private subnets should have correct CIDRs', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('public subnets should have correct CIDRs', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.101.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.102.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.103.0/24');
    });

    test('private subnets should not auto-assign public IPs', () => {
      privateSubnets.forEach(subnet => {
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('public subnets should auto-assign public IPs', () => {
      publicSubnets.forEach(subnet => {
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should have kubernetes internal-elb tag', () => {
      privateSubnets.forEach(subnet => {
        const tags = template.Resources[subnet].Properties.Tags;
        const elbTag = tags.find((t: any) => t.Key === 'kubernetes.io/role/internal-elb');
        expect(elbTag).toBeDefined();
        expect(elbTag.Value).toBe('1');
      });
    });
  });

  describe('NAT Gateways', () => {
    const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];
    const eips = ['NATGateway1EIP', 'NATGateway2EIP', 'NATGateway3EIP'];

    test('should have 3 NAT Gateways', () => {
      natGateways.forEach(nat => {
        expect(template.Resources[nat]).toBeDefined();
        expect(template.Resources[nat].Type).toBe('AWS::EC2::NatGateway');
      });
    });

    test('should have 3 Elastic IPs', () => {
      eips.forEach(eip => {
        expect(template.Resources[eip]).toBeDefined();
        expect(template.Resources[eip].Type).toBe('AWS::EC2::EIP');
      });
    });

    test('EIPs should have DependsOn VPCGatewayAttachment', () => {
      eips.forEach(eip => {
        expect(template.Resources[eip].DependsOn).toBe('VPCGatewayAttachment');
      });
    });

    test('EIPs should be VPC domain', () => {
      eips.forEach(eip => {
        expect(template.Resources[eip].Properties.Domain).toBe('vpc');
      });
    });

    test('NAT Gateways should be in corresponding public subnets', () => {
      expect(template.Resources.NATGateway1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(template.Resources.NATGateway2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
      expect(template.Resources.NATGateway3.Properties.SubnetId.Ref).toBe('PublicSubnet3');
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have 3 private route tables', () => {
      ['PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'].forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('public route should point to IGW with DependsOn', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.GatewayId.Ref).toBe('InternetGateway');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('private routes should point to respective NAT Gateways', () => {
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId.Ref).toBe('NATGateway1');
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId.Ref).toBe('NATGateway2');
      expect(template.Resources.PrivateRoute3.Properties.NatGatewayId.Ref).toBe('NATGateway3');
    });

    test('should have route table associations for all subnets', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PublicSubnet3RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'PrivateSubnet3RouteTableAssociation'
      ];
      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have Cluster Security Group', () => {
      const sg = template.Resources.ClusterSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('EKS cluster control plane');
    });

    test('should have Node Security Group', () => {
      const sg = template.Resources.NodeSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('EKS nodes');
    });

    test('should have security group ingress rules', () => {
      expect(template.Resources.ClusterSecurityGroupIngressFromNodes).toBeDefined();
      expect(template.Resources.NodeSecurityGroupIngressFromCluster).toBeDefined();
      expect(template.Resources.NodeSecurityGroupIngressFromSelf).toBeDefined();
    });
  });

  describe('EKS Cluster Resources', () => {
    test('should have EKS Cluster Role', () => {
      const role = template.Resources.EKSClusterRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
    });

    test('should have CloudWatch Log Group', () => {
      const logGroup = template.Resources.CloudWatchLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have EKS Cluster', () => {
      const cluster = template.Resources.EKSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::EKS::Cluster');
      expect(cluster.Properties.Version.Ref).toBe('EKSVersion');
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPrivateAccess).toBe(true);
      expect(cluster.Properties.ResourcesVpcConfig.EndpointPublicAccess).toBe(false);
      expect(cluster.Properties.EncryptionConfig).toBeDefined();
      expect(cluster.Properties.Logging).toBeDefined();
      expect(cluster.DependsOn).toContain('CloudWatchLogGroup');
    });

    test('should have OIDC Provider', () => {
      const oidc = template.Resources.OIDCProvider;
      expect(oidc).toBeDefined();
      expect(oidc.Type).toBe('AWS::IAM::OIDCProvider');
      expect(oidc.Properties.ClientIdList).toEqual(['sts.amazonaws.com']);
    });
  });

  describe('Node Resources', () => {
    test('should have Node Instance Role', () => {
      const role = template.Resources.NodeInstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
    });

    test('should have Node Instance Profile', () => {
      const profile = template.Resources.NodeInstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have Managed Node Group', () => {
      const ng = template.Resources.ManagedNodeGroup;
      expect(ng).toBeDefined();
      expect(ng.Type).toBe('AWS::EKS::Nodegroup');
      expect(ng.Properties.ScalingConfig.MinSize).toBe(2);
      expect(ng.Properties.ScalingConfig.MaxSize).toBe(6);
      expect(ng.Properties.InstanceTypes).toEqual(['t3.large']);
    });

    test('should have Launch Templates', () => {
      expect(template.Resources.ManagedNodeLaunchTemplate).toBeDefined();
      expect(template.Resources.SelfManagedNodeLaunchTemplate).toBeDefined();
    });

    test('should have Self-Managed Node Auto Scaling Group', () => {
      const asg = template.Resources.SelfManagedNodeAutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe('1');
      expect(asg.Properties.MaxSize).toBe('4');
      expect(asg.Properties.DesiredCapacity).toBe('2');
    });
  });

  describe('Outputs', () => {
    test('should have ClusterName output with export', () => {
      const output = template.Outputs.ClusterName;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('EKSCluster');
      expect(output.Export).toBeDefined();
    });

    test('should have ClusterArn output', () => {
      const output = template.Outputs.ClusterArn;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['EKSCluster', 'Arn']);
    });

    test('should have ClusterEndpoint output', () => {
      const output = template.Outputs.ClusterEndpoint;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['EKSCluster', 'Endpoint']);
    });

    test('should have VpcId output', () => {
      const output = template.Outputs.VpcId;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('VPC');
    });

    test('should have PrivateSubnetIds output', () => {
      const output = template.Outputs.PrivateSubnetIds;
      expect(output).toBeDefined();
      expect(output.Value['Fn::Join']).toBeDefined();
    });

    test('should have NodeSecurityGroupId output', () => {
      const output = template.Outputs.NodeSecurityGroupId;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('NodeSecurityGroup');
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Description).toBeDefined();
        expect(template.Outputs[key].Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Tagging', () => {
    const taggedResources = ['VPC', 'InternetGateway', 'PrivateSubnet1', 'PublicSubnet1', 'NATGateway1', 'EKSCluster'];

    const hasTag = (tags: any, key: string) => {
      if (Array.isArray(tags)) {
        return tags.find((t: any) => t.Key === key);
      } else {
        return tags[key];
      }
    };

    test('resources should have Environment and CostCenter tags', () => {
      taggedResources.forEach(resource => {
        const tags = template.Resources[resource].Properties.Tags;
        expect(hasTag(tags, 'Environment')).toBeDefined();
        expect(hasTag(tags, 'CostCenter')).toBeDefined();
      });
    });

    test('resources should have Name tag with EnvironmentSuffix', () => {
      taggedResources.forEach(resource => {
        const tags = template.Resources[resource].Properties.Tags;
        const nameTag = hasTag(tags, 'Name');
        expect(nameTag).toBeDefined();
        if (Array.isArray(tags)) {
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        } else {
          expect(nameTag['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });
});
