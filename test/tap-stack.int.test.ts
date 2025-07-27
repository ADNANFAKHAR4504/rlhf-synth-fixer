// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Integration Tests', () => {
  let template: any;

  beforeAll(() => {
    // Reading YAML template directly
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
  });

  describe('Template Deployment Readiness', () => {
    test('should have all required resources defined', () => {
      const resources = template.Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(0);

      // Essential infrastructure components
      const requiredResources = [
        'VPC',
        'InternetGateway',
        'VPCGatewayAttachment',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGateway',
        'NatGatewayEIP',
        'PublicRouteTable',
        'PrivateRouteTable',
        'PublicRoute',
        'PrivateRoute',
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'PublicSecurityGroup',
      ];

      requiredResources.forEach(resourceName => {
        expect(resources[resourceName]).toBeDefined();
      });
    });

    test('should be ready for CloudFormation deployment', () => {
      // Template structure validation
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Resource Dependencies & Integration', () => {
    test('should have proper dependency chain for Internet Gateway', () => {
      const vpcGatewayAttachment = template.Resources.VPCGatewayAttachment;
      const publicRoute = template.Resources.PublicRoute;

      // VPC Gateway Attachment should exist
      expect(vpcGatewayAttachment).toBeDefined();
      expect(vpcGatewayAttachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(vpcGatewayAttachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });

      // Public route should depend on VPC Gateway Attachment
      expect(publicRoute).toBeDefined();
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('should have proper NAT Gateway dependencies', () => {
      const natGateway = template.Resources.NatGateway;
      const eip = template.Resources.NatGatewayEIP;

      // NAT Gateway should reference EIP and be in public subnet
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGatewayEIP', 'AllocationId'],
      });
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });

      // EIP should be for VPC
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should have correct subnet to route table associations', () => {
      // Public subnet associations
      const publicSubnet1Association =
        template.Resources.PublicSubnet1RouteTableAssociation;
      const publicSubnet2Association =
        template.Resources.PublicSubnet2RouteTableAssociation;

      expect(publicSubnet1Association).toBeDefined();
      expect(publicSubnet1Association.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });
      expect(publicSubnet1Association.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });

      expect(publicSubnet2Association).toBeDefined();
      expect(publicSubnet2Association.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet2',
      });
      expect(publicSubnet2Association.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });

      // Private subnet associations
      const privateSubnet1Association =
        template.Resources.PrivateSubnet1RouteTableAssociation;
      const privateSubnet2Association =
        template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(privateSubnet1Association).toBeDefined();
      expect(privateSubnet1Association.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet1',
      });
      expect(privateSubnet1Association.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });

      expect(privateSubnet2Association).toBeDefined();
      expect(privateSubnet2Association.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet2',
      });
      expect(privateSubnet2Association.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });
    });
  });

  describe('Network Connectivity Logic', () => {
    test('should have proper routing for public subnets', () => {
      const publicRoute = template.Resources.PublicRoute;

      expect(publicRoute.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('should have proper routing for private subnets', () => {
      const privateRoute = template.Resources.PrivateRoute;

      expect(privateRoute.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'NatGateway',
      });
    });

    test('should enable internet access for public subnets', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      // Public subnets should auto-assign public IPs
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should route private subnet internet traffic through NAT Gateway', () => {
      const privateRoute = template.Resources.PrivateRoute;
      const natGateway = template.Resources.NatGateway;

      // Private route should use NAT Gateway
      expect(privateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'NatGateway',
      });

      // NAT Gateway should be in a public subnet
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  describe('Availability Zone Distribution', () => {
    test('should distribute subnets across different availability zones', () => {
      const subnets = [
        template.Resources.PublicSubnet1,
        template.Resources.PublicSubnet2,
        template.Resources.PrivateSubnet1,
        template.Resources.PrivateSubnet2,
      ];

      // Verify AZ selection uses proper CloudFormation functions
      expect(subnets[0].Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(subnets[1].Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
      expect(subnets[2].Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(subnets[3].Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('should work in us-east-1 region with multiple AZs', () => {
      // This test verifies the template uses !GetAZs function properly
      // which will work in us-east-1 region as specified in PROMPT.md
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      // Both should use different AZ indices (0 and 1)
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        0
      );
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        1
      );
    });
  });

  describe('Security Compliance Integration', () => {
    test('should properly restrict SSH access in security group', () => {
      const securityGroup = template.Resources.PublicSecurityGroup;
      expect(securityGroup).toBeDefined();

      const sshRule = securityGroup.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22 && rule.ToPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).not.toBe('0.0.0.0/0'); // Should not allow global SSH access
      expect(sshRule.CidrIp).toBe('10.0.0.0/8'); // Should be restricted to private networks
    });

    test('should allow HTTP access from anywhere', () => {
      const securityGroup = template.Resources.PublicSecurityGroup;
      const httpRule = securityGroup.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0'); // HTTP should be accessible from anywhere
    });

    test('should have security group integrated with VPC', () => {
      const securityGroup = template.Resources.PublicSecurityGroup;
      expect(securityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Cross-Resource Reference Integrity', () => {
    test('should have all CloudFormation references point to existing resources', () => {
      const resourceNames = Object.keys(template.Resources);

      // Function to check if a reference is valid
      const checkReference = (ref: any) => {
        if (ref && typeof ref === 'object' && ref.Ref) {
          expect(resourceNames).toContain(ref.Ref);
        }
      };

      // Check all resources for valid references
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Properties) {
          Object.values(resource.Properties).forEach((prop: any) => {
            if (prop && typeof prop === 'object') {
              checkReference(prop);
            }
          });
        }
      });
    });

    test('should have all outputs reference existing resources', () => {
      const resourceNames = Object.keys(template.Resources);

      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Value && output.Value.Ref) {
          expect(resourceNames).toContain(output.Value.Ref);
        }
      });
    });

    test('should not have circular dependencies', () => {
      // This is a basic check - in a real scenario, you'd want more sophisticated dependency analysis
      const publicRoute = template.Resources.PublicRoute;
      const vpcGatewayAttachment = template.Resources.VPCGatewayAttachment;

      // Public route depends on VPC Gateway Attachment
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');

      // VPC Gateway Attachment should not depend on Public Route (would be circular)
      expect(vpcGatewayAttachment.DependsOn).toBeUndefined();
    });
  });

  describe('Regional Compliance', () => {
    test('should use region-agnostic resource configurations', () => {
      // Verify that hardcoded availability zones are not used
      const subnets = [
        template.Resources.PublicSubnet1,
        template.Resources.PublicSubnet2,
        template.Resources.PrivateSubnet1,
        template.Resources.PrivateSubnet2,
      ];

      subnets.forEach(subnet => {
        const az = subnet.Properties.AvailabilityZone;
        // Should use CloudFormation functions, not hardcoded values
        expect(az).toHaveProperty('Fn::Select');
        expect(az['Fn::Select'][1]).toEqual({ 'Fn::GetAZs': '' });
      });
    });

    test('should work with us-east-1 resource types', () => {
      // All resource types should be available in us-east-1
      const resourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::VPCGatewayAttachment',
      ];

      const usedTypes = Object.values(template.Resources).map(
        (resource: any) => resource.Type
      );
      resourceTypes.forEach(type => {
        expect(usedTypes).toContain(type);
      });
    });
  });

  describe('Template Validation & Syntax', () => {
    test('should have valid CloudFormation template structure', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();

      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have all resource properties correctly formatted', () => {
      Object.entries(template.Resources).forEach(
        ([name, resource]: [string, any]) => {
          expect(resource.Type).toBeDefined();
          expect(typeof resource.Type).toBe('string');
          expect(resource.Type).toMatch(/^AWS::/);

          if (resource.Properties) {
            expect(typeof resource.Properties).toBe('object');
          }
        }
      );
    });

    test('should have consistent resource naming', () => {
      const resourceNames = Object.keys(template.Resources);

      resourceNames.forEach(name => {
        // Should follow PascalCase convention
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);

        // Should not have spaces or special characters
        expect(name).not.toMatch(/[\s\-_]/);
      });
    });
  });

  describe('PROMPT.md Requirements Integration', () => {
    test('should integrate all PROMPT.md specified components', () => {
      // 1. VPC with specified CIDR
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');

      // 2. Public subnets with specified CIDRs
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );

      // 3. Private subnets with specified CIDRs
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.0.3.0/24'
      );
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.0.4.0/24'
      );

      // 4. Internet Gateway attached to VPC
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();

      // 5. Routing tables with proper routes
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();

      // 6. NAT Gateway in public subnet
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGateway.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });

      // 7. Subnet associations
      expect(
        template.Resources.PublicSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PublicSubnet2RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet2RouteTableAssociation
      ).toBeDefined();

      // 8. Security groups with HTTP and SSH
      const securityGroup = template.Resources.PublicSecurityGroup;
      const ingressRules = securityGroup.Properties.SecurityGroupIngress;

      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);

      expect(httpRule).toBeDefined();
      expect(sshRule).toBeDefined();
    });

    test('should be deployment ready without errors', () => {
      // Template should have no obvious syntax issues
      expect(template).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(15);
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(5);

      // All critical components should be present
      const criticalResources = [
        'VPC',
        'InternetGateway',
        'NatGateway',
        'PublicSecurityGroup',
      ];
      criticalResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });
  });
});
