import fs from 'fs';
import path from 'path';

describe('VPC Stack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, 'utf8');

    try {
      template = JSON.parse(content);
    } catch (err) {
      throw new Error(`Invalid JSON in CloudFormation template: ${err}`);
    }
  });

  describe('Template Basics', () => {
    test('has correct format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has a description', () => {
      expect(template.Description).toBeDefined();
    });

    test('contains Resources section', () => {
      expect(template.Resources).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('defines a VPC resource', () => {
      expect(template.Resources.MyVPC).toBeDefined();
      expect(template.Resources.MyVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('defines a public subnet with mapping enabled', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('defines an internet gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('attaches IGW to the VPC', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
    });

    test('defines a public route table with default route', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('associates public subnet with the public route table', () => {
      const assoc = template.Resources.PublicSubnetRouteTableAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('defines a security group for HTTP and SSH', () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80 }),
          expect.objectContaining({ FromPort: 22, ToPort: 22 }),
        ])
      );
    });
  });

  describe('Tags', () => {
    test('all tagged resources include Environment=Production', () => {
      const keys = Object.keys(template.Resources);
      keys.forEach((key) => {
        const resource = template.Resources[key];
        const tags = resource?.Properties?.Tags || [];
        const envTag = tags.find(
          (t: any) => t.Key === 'Environment' && t.Value === 'Production'
        );
        if (tags.length > 0) {
          expect(envTag).toBeDefined();
        }
      });
    });
  });

  describe('Outputs', () => {
    test('outputs include VPCId, PublicSubnetId, and WebSecurityGroupId', () => {
      const outputs = template.Outputs;
      expect(outputs).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnetId).toBeDefined();
      expect(outputs.WebSecurityGroupId).toBeDefined();
    });

    test('output VPCId should reference MyVPC', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'MyVPC' });
    });

    test('output PublicSubnetId should reference PublicSubnet', () => {
      expect(template.Outputs.PublicSubnetId.Value).toEqual({ Ref: 'PublicSubnet' });
    });

    test('output WebSecurityGroupId should reference WebSecurityGroup', () => {
      expect(template.Outputs.WebSecurityGroupId.Value).toEqual({ Ref: 'WebSecurityGroup' });
    });
  });
});
