import fs from 'fs';
import path from 'path';

describe('CloudFormation Template for Dev/Prod Environments', () => {
  let template: any;

  beforeAll(() => {
    // Path to the JSON version of your CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('CloudFormation template to create a secure and scalable infrastructure');
    });

    test('should not have any parameters', () => {
        expect(template.Parameters).toBeUndefined();
    });
  });

  describe('Development Environment Resources', () => {
    test('should define a Development VPC with the correct CIDR block', () => {
      const devVPC = template.Resources.DevVPC;
      expect(devVPC).toBeDefined();
      expect(devVPC.Type).toBe('AWS::EC2::VPC');
      expect(devVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

test('should define public and private subnets for the Dev VPC', () => {
      const devPublicSubnet = template.Resources.DevPublicSubnet;
      const devPrivateSubnet = template.Resources.DevPrivateSubnet;
      
      expect(devPublicSubnet).toBeDefined();
      expect(devPublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(devPublicSubnet.Properties.VpcId).toEqual({ Ref: 'DevVPC' });
      expect(devPublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(devPublicSubnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });


      expect(devPrivateSubnet).toBeDefined();
      expect(devPrivateSubnet.Type).toBe('AWS::EC2::Subnet');
      // Corrected line below
      expect(devPrivateSubnet.Properties.VpcId).toEqual({ Ref: 'DevVPC' });
      expect(devPrivateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(devPrivateSubnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should define a Security Group for Dev with SSH access', () => {
        const devSg = template.Resources.DevSecurityGroup;
        expect(devSg).toBeDefined();
        expect(devSg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(devSg.Properties.VpcId).toEqual({ Ref: 'DevVPC' });
        expect(devSg.Properties.SecurityGroupIngress).toEqual([
            {
                IpProtocol: 'tcp',
                FromPort: 22,
                ToPort: 22,
                CidrIp: '10.0.0.5/32',
            }
        ]);
    });
  });

  describe('Production Environment Resources', () => {
    test('should define a Production VPC with the correct CIDR block', () => {
      const prodVPC = template.Resources.ProdVPC;
      expect(prodVPC).toBeDefined();
      expect(prodVPC.Type).toBe('AWS::EC2::VPC');
      expect(prodVPC.Properties.CidrBlock).toBe('192.168.0.0/16');
    });

    test('should define a NAT Gateway for the Prod VPC', () => {
        const natGateway = template.Resources.ProdNatGateway;
        expect(natGateway).toBeDefined();
        expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
        expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'ProdPublicSubnet' });
    });

    test('should define a Security Group for Prod with Web access', () => {
        const prodSg = template.Resources.ProdSecurityGroup;
        expect(prodSg).toBeDefined();
        expect(prodSg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(prodSg.Properties.VpcId).toEqual({ Ref: 'ProdVPC' });
        expect(prodSg.Properties.SecurityGroupIngress).toContainEqual({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
        });
        expect(prodSg.Properties.SecurityGroupIngress).toContainEqual({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
        });
    });
  });

  // --- UPDATED SECTION ---
  describe('Production Auto Scaling', () => {
    test('should define a Launch Template for Prod', () => {
        // Check for the new logical ID: ProdLaunchTemplateV2
        const lt = template.Resources.ProdLaunchTemplateV2;
        expect(lt).toBeDefined();
        expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
        
        // Check the new physical name
        expect(lt.Properties.LaunchTemplateName).toBe('ProdWebServersLaunchTemplateV2');

        // Check for the dynamic SSM parameter instead of a hardcoded AMI ID
        expect(lt.Properties.LaunchTemplateData.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
        
        expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t2.micro');
        expect(lt.Properties.LaunchTemplateData.SecurityGroupIds).toEqual([{ Ref: 'ProdSecurityGroup' }]);
    });

    test('should define an Auto Scaling Group for Prod using a Launch Template', () => {
        const asg = template.Resources.ProdAutoScalingGroup;
        expect(asg).toBeDefined();
        expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
        expect(asg.Properties.MinSize).toBe('1');
        expect(asg.Properties.MaxSize).toBe('3');
        expect(asg.Properties.VPCZoneIdentifier).toEqual([{ Ref: 'ProdPrivateSubnet' }]);
        
        // Verify it uses the Launch Template, not a Launch Configuration
        expect(asg.Properties.LaunchConfigurationName).toBeUndefined();
        
        // Verify it references the new launch template logical ID
        expect(asg.Properties.LaunchTemplate).toEqual({
            LaunchTemplateId: { Ref: 'ProdLaunchTemplateV2' },
            Version: { 'Fn::GetAtt': ['ProdLaunchTemplateV2', 'LatestVersionNumber'] },
        });
    });
  });
  // --- END UPDATED SECTION ---

  describe('Outputs', () => {
    const expectedOutputs = [
        'DevelopmentVPCID',
        'ProductionVPCID',
        'ProductionPublicSubnetIDs',
        'ProductionPrivateSubnetIDs',
        'ProductionAutoScalingGroupName',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('DevelopmentVPCID output should be correct', () => {
        const output = template.Outputs.DevelopmentVPCID;
        expect(output.Value).toEqual({ Ref: 'DevVPC' });
        expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-DevVPCID' });
    });

    test('ProductionVPCID output should be correct', () => {
        const output = template.Outputs.ProductionVPCID;
        expect(output.Value).toEqual({ Ref: 'ProdVPC' });
        expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ProdVPCID' });
    });

    test('ProductionAutoScalingGroupName output should be correct', () => {
        const output = template.Outputs.ProductionAutoScalingGroupName;
        expect(output.Value).toEqual({ Ref: 'ProdAutoScalingGroup' });
        expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ProdASGName' });
    });
  });
});