import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('Template structure is valid', () => {
    expect(template).toBeDefined();
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Description).toContain(
      'Production-ready VPC infrastructure'
    );
    expect(template.Parameters).toBeDefined();
    expect(template.Mappings).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(template.Outputs).toBeDefined();
  });

  describe('Parameters', () => {
    it('defines all required parameters with correct defaults', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe(
        '^[a-zA-Z0-9-]+$'
      );
      expect(
        template.Parameters.EnvironmentSuffix.ConstraintDescription
      ).toBeDefined();

      expect(template.Parameters.Name).toBeDefined();
      expect(template.Parameters.Name.Default).toBe('tapstack');

      expect(template.Parameters.Team).toBeDefined();
      expect(template.Parameters.Team.Default).toBe('team');

      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.Project.Default).toBe('infrastructure');

      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Default).toBe('devops-team');

      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.CostCenter.Default).toBe('engineering');

      expect(template.Parameters.AllowedSSHCidr).toBeDefined();
      expect(template.Parameters.AllowedSSHCidr.Default).toBe('203.0.113.0/24');
      expect(template.Parameters.AllowedSSHCidr.AllowedPattern).toBeDefined();

      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe(
        'AWS::EC2::KeyPair::KeyName'
      );
    });

    it('all parameter types are correct', () => {
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.Name.Type).toBe('String');
      expect(template.Parameters.Team.Type).toBe('String');
      expect(template.Parameters.Project.Type).toBe('String');
      expect(template.Parameters.Owner.Type).toBe('String');
      expect(template.Parameters.CostCenter.Type).toBe('String');
      expect(template.Parameters.AllowedSSHCidr.Type).toBe('String');
      expect(template.Parameters.KeyPairName.Type).toBe(
        'AWS::EC2::KeyPair::KeyName'
      );
    });

    it('does not allow extra parameters', () => {
      const allowed = [
        'EnvironmentSuffix',
        'Name',
        'Team',
        'Project',
        'Owner',
        'CostCenter',
        'AllowedSSHCidr',
        'KeyPairName',
      ];
      Object.keys(template.Parameters).forEach(key => {
        expect(allowed).toContain(key);
      });
    });

    it('validates EnvironmentSuffix AllowedPattern allows correct values', () => {
      const allowedPattern =
        template.Parameters.EnvironmentSuffix.AllowedPattern;
      expect(allowedPattern).toBe('^[a-zA-Z0-9-]+$');

      // Test that the pattern allows valid values
      const validValues = [
        'dev',
        'prod',
        'staging',
        'pr256',
        'pr265',
        'test-123',
        'feature-branch',
      ];
      const pattern = new RegExp(allowedPattern);

      validValues.forEach(value => {
        expect(pattern.test(value)).toBe(true);
      });

      // Test that the pattern rejects invalid values
      const invalidValues = [
        'dev@',
        'prod#',
        'staging$',
        'test space',
        'test.123',
      ];

      invalidValues.forEach(value => {
        expect(pattern.test(value)).toBe(false);
      });
    });
  });

  describe('Mappings', () => {
    it('defines AZ mapping for us-east-1', () => {
      expect(template.Mappings.AZConfig).toBeDefined();
      expect(template.Mappings.AZConfig['us-east-1']).toBeDefined();
      expect(template.Mappings.AZConfig['us-east-1'].AZ1).toEqual([
        'us-east-1a',
      ]);
      expect(template.Mappings.AZConfig['us-east-1'].AZ2).toEqual([
        'us-east-1b',
      ]);
    });
  });

  describe('VPC Resources', () => {
    it('defines VPC with correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);

      // Check tags
      const tags = vpc.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Name')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Project')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Owner')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Purpose')).toBeDefined();
    });

    it('defines Internet Gateway with proper attachment', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');

      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe(
        'InternetGateway'
      );
    });
  });

  describe('Subnet Resources', () => {
    it('defines PublicSubnet1 with correct properties', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toEqual([
        0,
        { 'Fn::FindInMap': ['AZConfig', 'us-east-1', 'AZ1'] },
      ]);
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    it('defines PublicSubnet2 with correct properties', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toEqual([
        0,
        { 'Fn::FindInMap': ['AZConfig', 'us-east-1', 'AZ2'] },
      ]);
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    it('defines PrivateSubnet1 with correct properties', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
      expect(subnet.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toEqual([
        0,
        { 'Fn::FindInMap': ['AZConfig', 'us-east-1', 'AZ1'] },
      ]);
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    it('defines PrivateSubnet2 with correct properties', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
      expect(subnet.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toEqual([
        0,
        { 'Fn::FindInMap': ['AZConfig', 'us-east-1', 'AZ2'] },
      ]);
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });
  });

  describe('NAT Gateway Resources', () => {
    it('defines NAT Gateway EIP with correct properties', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.DependsOn).toBe('AttachGateway');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    it('defines NAT Gateway with correct properties', () => {
      const natGw = template.Resources.NATGateway;
      expect(natGw).toBeDefined();
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw.Properties.AllocationId['Fn::GetAtt']).toEqual([
        'NATGatewayEIP',
        'AllocationId',
      ]);
      expect(natGw.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    });
  });

  describe('Route Table Resources', () => {
    it('defines PublicRouteTable with correct route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId.Ref).toBe('VPC');

      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.DependsOn).toBe('AttachGateway');
      expect(route.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId.Ref).toBe('InternetGateway');
    });

    it('defines PrivateRouteTable with correct route', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId.Ref).toBe('VPC');

      const route = template.Resources.PrivateRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId.Ref).toBe('PrivateRouteTable');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId.Ref).toBe('NATGateway');
    });

    it('defines route table associations correctly', () => {
      const pubAssoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      expect(pubAssoc1).toBeDefined();
      expect(pubAssoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(pubAssoc1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(pubAssoc1.Properties.RouteTableId.Ref).toBe('PublicRouteTable');

      const pubAssoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
      expect(pubAssoc2).toBeDefined();
      expect(pubAssoc2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
      expect(pubAssoc2.Properties.RouteTableId.Ref).toBe('PublicRouteTable');

      const privAssoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      expect(privAssoc1).toBeDefined();
      expect(privAssoc1.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
      expect(privAssoc1.Properties.RouteTableId.Ref).toBe('PrivateRouteTable');

      const privAssoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(privAssoc2).toBeDefined();
      expect(privAssoc2.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
      expect(privAssoc2.Properties.RouteTableId.Ref).toBe('PrivateRouteTable');
    });
  });

  describe('Security Group Resources', () => {
    it('defines EC2SecurityGroup with SSH access only', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId.Ref).toBe('VPC');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for Auto Scaling Group EC2 instances'
      );

      // SecurityGroupIngress and Egress are now separate resources (not inline)
      expect(sg.Properties.SecurityGroupIngress).toBeUndefined();
      expect(sg.Properties.SecurityGroupEgress).toBeUndefined();

      // Check separate ingress resource
      const ingressRule = template.Resources.EC2SecurityGroupIngressSSH;
      expect(ingressRule).toBeDefined();
      expect(ingressRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingressRule.Properties.GroupId.Ref).toBe('EC2SecurityGroup');
      expect(ingressRule.Properties.IpProtocol).toBe('tcp');
      expect(ingressRule.Properties.FromPort).toBe(22);
      expect(ingressRule.Properties.ToPort).toBe(22);
      expect(ingressRule.Properties.CidrIp.Ref).toBe('AllowedSSHCidr');
      expect(ingressRule.Properties.Description).toBe(
        'SSH access from specified CIDR block'
      );

      // Check separate egress resource
      const egressRule = template.Resources.EC2SecurityGroupEgress;
      expect(egressRule).toBeDefined();
      expect(egressRule.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(egressRule.Properties.GroupId.Ref).toBe('EC2SecurityGroup');
      expect(egressRule.Properties.IpProtocol).toBe(-1);
      expect(egressRule.Properties.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Auto Scaling Group Resources', () => {
    it('defines LaunchTemplate with correct properties', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');

      const ltData = lt.Properties.LaunchTemplateData;

      // Verify SSM parameter usage for AMI instead of hardcoded mappings
      expect(ltData.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );

      expect(ltData.InstanceType).toBe('t3.micro');
      expect(ltData.KeyName.Ref).toBe('KeyPairName');
      expect(ltData.SecurityGroupIds).toEqual([{ Ref: 'EC2SecurityGroup' }]);

      // Check tag specifications
      const tagSpecs = ltData.TagSpecifications;
      expect(tagSpecs).toHaveLength(2);
      expect(tagSpecs[0].ResourceType).toBe('instance');
      expect(tagSpecs[1].ResourceType).toBe('volume');
    });

    it('defines AutoScalingGroup with correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');

      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(2);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('EC2');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);

      expect(asg.Properties.LaunchTemplate.LaunchTemplateId.Ref).toBe(
        'LaunchTemplate'
      );
      // Version should be $Latest (not Fn::GetAtt) for LocalStack compatibility
      expect(asg.Properties.LaunchTemplate.Version).toBe('$Latest');

      // Check VPC Zone Identifier (should be public subnets)
      const zones = asg.Properties.VPCZoneIdentifier;
      expect(zones).toHaveLength(2);
      expect(zones[0].Ref).toBe('PublicSubnet1');
      expect(zones[1].Ref).toBe('PublicSubnet2');

      // Check tags
      const tags = asg.Properties.Tags;
      expect(tags.length).toBeGreaterThan(0);
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag.PropagateAtLaunch).toBe(true);
    });
  });

  describe('Outputs', () => {
    it('outputs VPCId correctly', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Description).toBe('VPC ID for the infrastructure');
      expect(output.Value.Ref).toBe('VPC');
      expect(output.Export.Name['Fn::Sub']).toBe(
        '${EnvironmentSuffix}-${Name}-vpc-id-${Team}'
      );
    });

    it('outputs PublicSubnetIds as comma-separated list', () => {
      const output = template.Outputs.PublicSubnetIds;
      expect(output).toBeDefined();
      expect(output.Description).toBe('List of Public Subnet IDs');
      expect(output.Value['Fn::Join']).toEqual([
        ',',
        [{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }],
      ]);
      expect(output.Export.Name['Fn::Sub']).toBe(
        '${EnvironmentSuffix}-${Name}-public-subnets-${Team}'
      );
    });

    it('outputs PrivateSubnetIds as comma-separated list', () => {
      const output = template.Outputs.PrivateSubnetIds;
      expect(output).toBeDefined();
      expect(output.Description).toBe('List of Private Subnet IDs');
      expect(output.Value['Fn::Join']).toEqual([
        ',',
        [{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }],
      ]);
      expect(output.Export.Name['Fn::Sub']).toBe(
        '${EnvironmentSuffix}-${Name}-private-subnets-${Team}'
      );
    });

    it('outputs individual subnet IDs', () => {
      expect(template.Outputs.PublicSubnet1Id.Value.Ref).toBe('PublicSubnet1');
      expect(template.Outputs.PublicSubnet2Id.Value.Ref).toBe('PublicSubnet2');
      expect(template.Outputs.PrivateSubnet1Id.Value.Ref).toBe(
        'PrivateSubnet1'
      );
      expect(template.Outputs.PrivateSubnet2Id.Value.Ref).toBe(
        'PrivateSubnet2'
      );
    });

    it('outputs Auto Scaling Group resources', () => {
      expect(template.Outputs.AutoScalingGroupName.Value.Ref).toBe(
        'AutoScalingGroup'
      );
      expect(template.Outputs.SecurityGroupId.Value.Ref).toBe(
        'EC2SecurityGroup'
      );
      expect(template.Outputs.LaunchTemplateId.Value.Ref).toBe(
        'LaunchTemplate'
      );
    });

    it('outputs networking resources', () => {
      expect(template.Outputs.NATGatewayId.Value.Ref).toBe('NATGateway');
      expect(template.Outputs.InternetGatewayId.Value.Ref).toBe(
        'InternetGateway'
      );
    });

    it('all outputs reference valid resources', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Value.Ref) {
          expect(template.Resources[output.Value.Ref]).toBeDefined();
        }
        if (output.Value['Fn::GetAtt']) {
          const logicalId = output.Value['Fn::GetAtt'][0];
          expect(template.Resources[logicalId]).toBeDefined();
        }
        if (output.Value['Fn::Join']) {
          const refs = output.Value['Fn::Join'][1];
          refs.forEach((ref: any) => {
            if (ref.Ref) {
              expect(template.Resources[ref.Ref]).toBeDefined();
            }
          });
        }
      });
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    it('has correct dependency chains', () => {
      // NAT Gateway EIP depends on Internet Gateway attachment
      expect(template.Resources.NATGatewayEIP.DependsOn).toBe('AttachGateway');
      // Public Route depends on Internet Gateway attachment
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    it('all resource logical IDs are unique', () => {
      const ids = Object.keys(template.Resources);
      const unique = Array.from(new Set(ids));
      expect(ids.length).toBe(unique.length);
    });

    it('has exactly the expected number of resources', () => {
      const expectedResources = [
        'VPC',
        'InternetGateway',
        'AttachGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGatewayEIP',
        'NATGateway',
        'PublicRouteTable',
        'PublicRoute',
        'PrivateRouteTable',
        'PrivateRoute',
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'EC2SecurityGroup',
        'EC2SecurityGroupIngressSSH',
        'EC2SecurityGroupEgress',
        'LaunchTemplate',
        'AutoScalingGroup',
      ];
      expect(Object.keys(template.Resources)).toHaveLength(
        expectedResources.length
      );
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });
  });

  describe('Tagging Consistency', () => {
    it('all taggable resources have required cost tracking tags', () => {
      const taggableResources = [
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
        'EC2SecurityGroup',
      ];

      const requiredTags = [
        'Environment',
        'Project',
        'Owner',
        'CostCenter',
        'Purpose',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        requiredTags.forEach(tagKey => {
          const tag = resource.Properties.Tags.find(
            (t: any) => t.Key === tagKey
          );
          expect(tag).toBeDefined();
        });
      });
    });

    it('Auto Scaling Group has propagated tags', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;

      const propagatedTags = tags.filter(
        (t: any) => t.PropagateAtLaunch === true
      );
      expect(propagatedTags.length).toBeGreaterThan(0);

      // Verify key tags are propagated
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag.PropagateAtLaunch).toBe(true);
    });
  });

  describe('Edge Cases and Negative Checks', () => {
    it('should not define forbidden or deprecated resources', () => {
      expect(template.Resources.ApiGateway).toBeUndefined();
      expect(template.Resources.LambdaFunction).toBeUndefined();
      expect(template.Resources.DynamoDBTable).toBeUndefined();
      expect(template.Resources.CloudWatchAlarm).toBeUndefined();
    });

    it('should not define web-related security rules', () => {
      // SecurityGroupIngress is now a separate resource
      const ingressSSH = template.Resources.EC2SecurityGroupIngressSSH;

      // Should only have SSH (port 22), not HTTP (80) or HTTPS (443)
      expect(ingressSSH.Properties.FromPort).toBe(22);
      expect(ingressSSH.Properties.ToPort).toBe(22);

      // Should not have any other ingress resources for HTTP/HTTPS
      const resourceKeys = Object.keys(template.Resources);
      const httpIngressResource = resourceKeys.find(key =>
        key.includes('SecurityGroupIngress') &&
        key !== 'EC2SecurityGroupIngressSSH'
      );

      // If there are other ingress resources, verify they're not HTTP/HTTPS
      if (httpIngressResource) {
        const resource = template.Resources[httpIngressResource];
        expect(resource.Properties.FromPort).not.toBe(80);
        expect(resource.Properties.FromPort).not.toBe(443);
      }
    });

    it('should not have IAM roles or instance profiles', () => {
      expect(template.Resources.EC2InstanceRole).toBeUndefined();
      expect(template.Resources.EC2InstanceProfile).toBeUndefined();

      // Launch template should not reference IAM instance profile
      const lt = template.Resources.LaunchTemplate;
      expect(
        lt.Properties.LaunchTemplateData.IamInstanceProfile
      ).toBeUndefined();
    });

    it('fails gracefully if resource is missing', () => {
      expect(template.Resources.NonExistentResource).toBeUndefined();
    });

    it('validates CIDR blocks are within expected ranges', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.0.3.0/24'
      );
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.0.4.0/24'
      );
    });

    it('validates availability zones use dynamic mapping', () => {
      // Check that availability zones use FindInMap and Select instead of hardcoded values
      expect(
        template.Resources.PublicSubnet1.Properties.AvailabilityZone[
          'Fn::Select'
        ]
      ).toEqual([0, { 'Fn::FindInMap': ['AZConfig', 'us-east-1', 'AZ1'] }]);
      expect(
        template.Resources.PublicSubnet2.Properties.AvailabilityZone[
          'Fn::Select'
        ]
      ).toEqual([0, { 'Fn::FindInMap': ['AZConfig', 'us-east-1', 'AZ2'] }]);
      expect(
        template.Resources.PrivateSubnet1.Properties.AvailabilityZone[
          'Fn::Select'
        ]
      ).toEqual([0, { 'Fn::FindInMap': ['AZConfig', 'us-east-1', 'AZ1'] }]);
      expect(
        template.Resources.PrivateSubnet2.Properties.AvailabilityZone[
          'Fn::Select'
        ]
      ).toEqual([0, { 'Fn::FindInMap': ['AZConfig', 'us-east-1', 'AZ2'] }]);
    });
  });
});
