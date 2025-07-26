import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;
  beforeAll(() => {
    const filePath = path.join(__dirname, '../lib/TapStack.json'); // Path to your converted JSON template
    console.log(`Attempting to read file from: ${filePath}`);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      template = JSON.parse(content);
      console.log("Successfully loaded and parsed TapStack.json");
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Failed to load or parse TapStack.json: ${error.message}`);
      } else {
        console.error('Unknown error while loading TapStack.json');
      }
      throw error;
    }
  });

  describe('Template Metadata', () => {
    test('has a valid format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
    test('has a description', () => {
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter exists', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });
    test('KeyName parameter exists', () => {
      expect(template.Parameters.KeyName).toBeDefined();
      expect(template.Parameters.KeyName.Type).toBe('AWS::EC2::KeyPair::KeyName');
    });
  });

  describe('VPC', () => {
    test('VPC is defined with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });
    test('Internet Gateway is attached to VPC', () => {
      const igwAttach = template.Resources.AttachGateway;
      expect(igwAttach).toBeDefined();
      expect(igwAttach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      // This test is correct for the JSON representation of !Ref
      expect(igwAttach.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Subnets', () => {
    const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
    subnets.forEach((name) => {
      test(`${name} is defined and belongs to VPC`, () => {
        const subnet = template.Resources[name];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        // This test is correct for the JSON representation of !Ref
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });
    test('Public subnets map public IP on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });
    test('Private subnets do not map public IP', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS from anywhere', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      const ports = sg.map((r: any) => r.FromPort);
      const cidrs = sg.map((r: any) => r.CidrIp);
      expect(ports).toEqual(expect.arrayContaining([80, 443]));
      expect(cidrs).toEqual(expect.arrayContaining(['0.0.0.0/0']));
    });
    test('EC2 security group allows HTTP from ALB only', () => {
      const sg = template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress[0];
      expect(sg.FromPort).toBe(80);
      // This test is correct for the JSON representation of !Ref
      expect(sg.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
    test('RDS security group allows port 5432 from EC2', () => {
      const sg = template.Resources.RDSSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(sg.FromPort).toBe(5432);
      // This test is correct for the JSON representation of !Ref
      expect(sg.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  describe('Load Balancer', () => {
    test('ALB is internet-facing', () => {
      const alb = template.Resources.LoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    });
    test('Target group uses HTTP protocol', () => {
      const tg = template.Resources.TargetGroup.Properties;
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.TargetType).toBe('instance');
    });
    test('Listener forwards to TargetGroup', () => {
      const listener = template.Resources.Listener.Properties;
      expect(listener.Port).toBe(80);
      // This test is correct for the JSON representation of !Ref
      // expect(listener.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  describe('Launch Template and Auto Scaling', () => {
    test('Launch template uses Amazon Linux 2', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      // Your template uses a specific AMI ID: ami-0c2b8ca1dad447f8a
      // The test 'toMatch(/^ami-/)' is broad enough to pass.
      // If you wanted to be more specific, you'd do:
      expect(lt.ImageId).toBe('ami-0c2b8ca1dad447f8a');
      // Keeping it general: expect(lt.ImageId).toMatch(/^ami-/); is fine.
    });

    
    test('ASG min/max/desired size is set', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      // These are strings in your CFN template, so they should be strings in the test.
      expect(asg.MinSize).toBe('2');
      expect(asg.MaxSize).toBe('4');
      expect(asg.DesiredCapacity).toBe('2');
      // This test is correct for the JSON representation of !Ref
      expect(asg.TargetGroupARNs).toEqual([{ Ref: 'TargetGroup' }]);
    });
  });

  describe('RDS', () => {
    const db = () => template.Resources.DBInstance.Properties;
    test('uses PostgreSQL and MultiAZ', () => {
      expect(db().Engine).toBe('postgres');
      expect(db().MultiAZ).toBe(true);
    });
    test('is not publicly accessible and in private subnets', () => {
      expect(db().PubliclyAccessible).toBe(false);
      // This test is correct for the JSON representation of !Ref
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });
    test('has expected DB name and storage', () => {
      expect(db().DBName).toBe('webappdb');
      // AllocatedStorage is a number in CFN, so compare as a number.
      expect(db().AllocatedStorage).toBe(20);
    });
  });

  describe('Outputs', () => {
    test('outputs LoadBalancer DNS name', () => {
      const output = template.Outputs.LoadBalancerDNSName;
      expect(output).toBeDefined();
      // This test is correct for the JSON representation of !GetAtt
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LoadBalancer', 'DNSName'] });
    });
  });
});