import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have at least 11 resources for complete VPC setup', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(11);
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toContain('alphanumeric');
    });
  });

  describe('VPC Resource Validation', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have correct tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const envTag = vpc.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });
  });

  describe('Internet Gateway Validation', () => {
    test('should have Internet Gateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });

    test('VPC Gateway Attachment should reference correct resources', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe(
        'InternetGateway'
      );
    });

    test('Internet Gateway should have correct tags', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Properties.Tags).toBeDefined();
      const envTag = igw.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });
  });

  describe('Subnet Resources Validation', () => {
    const expectedSubnets = [
      { name: 'PublicSubnet1', cidr: '10.0.1.0/24', isPublic: true },
      { name: 'PublicSubnet2', cidr: '10.0.2.0/24', isPublic: true },
      { name: 'PrivateSubnet1', cidr: '10.0.101.0/24', isPublic: false },
      { name: 'PrivateSubnet2', cidr: '10.0.102.0/24', isPublic: false },
    ];

    expectedSubnets.forEach(subnet => {
      test(`should have ${subnet.name} resource`, () => {
        expect(template.Resources[subnet.name]).toBeDefined();
        expect(template.Resources[subnet.name].Type).toBe('AWS::EC2::Subnet');
      });

      test(`${subnet.name} should have correct CIDR block`, () => {
        const subnetResource = template.Resources[subnet.name];
        expect(subnetResource.Properties.CidrBlock).toBe(subnet.cidr);
      });

      test(`${subnet.name} should reference VPC`, () => {
        const subnetResource = template.Resources[subnet.name];
        expect(subnetResource.Properties.VpcId.Ref).toBe('VPC');
      });

      test(`${subnet.name} should use dynamic AZ selection`, () => {
        const subnetResource = template.Resources[subnet.name];
        expect(
          subnetResource.Properties.AvailabilityZone['Fn::Select']
        ).toBeDefined();
        expect(
          subnetResource.Properties.AvailabilityZone['Fn::Select'][1][
            'Fn::GetAZs'
          ]
        ).toBe('us-east-1');
      });

      test(`${subnet.name} should have correct tags`, () => {
        const subnetResource = template.Resources[subnet.name];
        expect(subnetResource.Properties.Tags).toBeDefined();
        const envTag = subnetResource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Environment'
        );
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
      });

      if (subnet.isPublic) {
        test(`${subnet.name} should have MapPublicIpOnLaunch enabled`, () => {
          const subnetResource = template.Resources[subnet.name];
          expect(subnetResource.Properties.MapPublicIpOnLaunch).toBe(true);
        });
      } else {
        test(`${subnet.name} should not have MapPublicIpOnLaunch enabled`, () => {
          const subnetResource = template.Resources[subnet.name];
          expect(subnetResource.Properties.MapPublicIpOnLaunch).toBeUndefined();
        });
      }
    });

    test('should distribute subnets across different AZs', () => {
      const subnet1AZ =
        template.Resources.PublicSubnet1.Properties.AvailabilityZone[
          'Fn::Select'
        ][0];
      const subnet2AZ =
        template.Resources.PublicSubnet2.Properties.AvailabilityZone[
          'Fn::Select'
        ][0];
      expect(subnet1AZ).not.toBe(subnet2AZ);
    });
  });

  describe('Route Table Validation', () => {
    test('should have Public Route Table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('Route Tables should reference VPC', () => {
      expect(template.Resources.PublicRouteTable.Properties.VpcId.Ref).toBe(
        'VPC'
      );
    });

    test('should have Public Route to Internet Gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');

      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('Route Tables should have correct tags', () => {
      const publicRT = template.Resources.PublicRouteTable;

      expect(publicRT.Properties.Tags).toBeDefined();
      const envTag = publicRT.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });
  });

  describe('Route Table Associations Validation', () => {
    const expectedAssociations = [
      {
        name: 'PublicSubnet1RouteTableAssociation',
        subnet: 'PublicSubnet1',
        routeTable: 'PublicRouteTable',
      },
      {
        name: 'PublicSubnet2RouteTableAssociation',
        subnet: 'PublicSubnet2',
        routeTable: 'PublicRouteTable',
      },
    ];

    expectedAssociations.forEach(association => {
      test(`should have ${association.name}`, () => {
        expect(template.Resources[association.name]).toBeDefined();
        expect(template.Resources[association.name].Type).toBe(
          'AWS::EC2::SubnetRouteTableAssociation'
        );
      });

      test(`${association.name} should reference correct subnet and route table`, () => {
        const assoc = template.Resources[association.name];
        expect(assoc.Properties.SubnetId.Ref).toBe(association.subnet);
        expect(assoc.Properties.RouteTableId.Ref).toBe(association.routeTable);
      });
    });
  });

  describe('Security and Best Practices Validation', () => {
    test('should not have hardcoded availability zones', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Type === 'AWS::EC2::Subnet') {
          expect(typeof resource.Properties.AvailabilityZone).not.toBe(
            'string'
          );
          expect(
            resource.Properties.AvailabilityZone['Fn::Select']
          ).toBeDefined();
          expect(
            resource.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']
          ).toBe('us-east-1');
        }
      });
    });

    test('should have proper resource dependencies', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe(
        'VPCGatewayAttachment'
      );
    });

    test('all taggable resources should have Environment tag', () => {
      const taggableResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::RouteTable',
      ];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (taggableResourceTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
      });
    });

    test('should not expose unnecessary resources publicly', () => {
      // Verify only public subnets have MapPublicIpOnLaunch
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
      expect(
        template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
    });
  });

  describe('Template Completeness', () => {
    test('should have all required resources for functional VPC', () => {
      const requiredResources = [
        'VPC',
        'InternetGateway',
        'VPCGatewayAttachment',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicRouteTable',
        'PublicRoute',
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should not have unnecessary resources', () => {
      // Verify we don't have NAT Gateways, EC2 instances, etc. as per requirements
      const unnecessaryResources = [
        'NATGateway',
        'Instance',
        'LaunchTemplate',
        'AutoScalingGroup',
        'LoadBalancer',
      ];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        unnecessaryResources.forEach(unnecessaryType => {
          expect(resource.Type).not.toContain(unnecessaryType);
        });
      });
    });

    test('should have exactly 11 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(11);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('template should have Outputs section with required outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.VpcId).toBeDefined();
      expect(template.Outputs.InternetGatewayId).toBeDefined();
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PublicRouteTableId).toBeDefined();
    });

    test('VpcId output should reference VPC resource', () => {
      expect(template.Outputs.VpcId.Value.Ref).toBe('VPC');
      expect(template.Outputs.VpcId.Description).toContain('VPC');
    });

    test('subnet outputs should reference correct resources', () => {
      expect(template.Outputs.PublicSubnet1Id.Value.Ref).toBe('PublicSubnet1');
      expect(template.Outputs.PublicSubnet2Id.Value.Ref).toBe('PublicSubnet2');
      expect(template.Outputs.PrivateSubnet1Id.Value.Ref).toBe('PrivateSubnet1');
      expect(template.Outputs.PrivateSubnet2Id.Value.Ref).toBe('PrivateSubnet2');
    });
  });
});
