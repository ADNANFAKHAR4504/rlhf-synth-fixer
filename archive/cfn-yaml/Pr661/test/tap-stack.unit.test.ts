import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Highly Available VPC', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toBe(
        'Highly Available VPC with public and private subnets across two AZs, NAT Gateways, Security Groups, and IAM roles for EC2 S3 access'
      );
    });

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
  });

  describe('Parameters', () => {
    test('VpcCidr parameter should have correct properties', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toBe('CIDR block for the VPC');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('AvailabilityZone parameters should use correct type', () => {
      expect(template.Parameters.AvailabilityZoneA.Type).toBe(
        'AWS::EC2::AvailabilityZone::Name'
      );
      expect(template.Parameters.AvailabilityZoneB.Type).toBe(
        'AWS::EC2::AvailabilityZone::Name'
      );
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.AllowedValues).toContain('Development');
      expect(param.AllowedValues).toContain('Staging');
      expect(param.AllowedValues).toContain('Production');
    });
  });

  describe('Resources', () => {
    test('should have all required VPC resources', () => {
      const requiredResources = [
        'MyVPC',
        'InternetGateway',
        'InternetGatewayAttachment',
        'PublicSubnetA',
        'PublicSubnetB',
        'PrivateSubnetA',
        'PrivateSubnetB',
        'NatGatewayAEIP',
        'NatGatewayBEIP',
        'NatGatewayA',
        'NatGatewayB',
        'PublicRouteTable',
        'DefaultPublicRoute',
        'PublicSubnetARouteTableAssociation',
        'PublicSubnetBRouteTableAssociation',
        'PrivateRouteTableA',
        'DefaultPrivateRouteA',
        'PrivateSubnetARouteTableAssociation',
        'PrivateRouteTableB',
        'DefaultPrivateRouteB',
        'PrivateSubnetBRouteTableAssociation',
        'PublicSecurityGroup',
        'PrivateSecurityGroup',
        'EC2S3AccessRole',
        'EC2S3AccessInstanceProfile',
      ];

      requiredResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('MyVPC should be configured correctly', () => {
      const vpc = template.Resources.MyVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toBeDefined();
    });

    test('Public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(
        template.Resources.PublicSubnetA.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnetB.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('Private subnets should not have MapPublicIpOnLaunch', () => {
      expect(
        template.Resources.PrivateSubnetA.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
      expect(
        template.Resources.PrivateSubnetB.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
    });

    test('NAT Gateways should have Elastic IPs', () => {
      expect(template.Resources.NatGatewayA.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGatewayAEIP', 'AllocationId'],
      });
      expect(template.Resources.NatGatewayB.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGatewayBEIP', 'AllocationId'],
      });
    });

    test('Public Security Group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.PublicSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Private Security Group should allow traffic from Public Security Group', () => {
      const sg = template.Resources.PrivateSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];

      expect(ingress.SourceSecurityGroupId).toEqual({
        Ref: 'PublicSecurityGroup',
      });
      expect(ingress.IpProtocol).toBe(-1);
    });

    test('EC2 IAM Role should have S3 permissions', () => {
      const role = template.Resources.EC2S3AccessRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const s3Policy = role.Properties.Policies.find(
        (policy: any) => policy.PolicyName === 'S3AccessPolicy'
      );
      expect(s3Policy).toBeDefined();

      const actions = s3Policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:PutObject');
      expect(actions).toContain('s3:DeleteObject');
      expect(actions).toContain('s3:ListBucket');
    });

    test('Instance Profile should reference the IAM Role', () => {
      const instanceProfile = template.Resources.EC2S3AccessInstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toContainEqual({
        Ref: 'EC2S3AccessRole',
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetAId',
        'PublicSubnetBId',
        'PrivateSubnetAId',
        'PrivateSubnetBId',
        'PublicSecurityGroupId',
        'PrivateSecurityGroupId',
        'EC2S3AccessRoleArn',
        'EC2S3AccessInstanceProfileArn',
        'InternetGatewayId',
        'NatGatewayAId',
        'NatGatewayBId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the created VPC');
      expect(output.Value).toEqual({ Ref: 'MyVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('Subnet outputs should reference correct resources', () => {
      expect(template.Outputs.PublicSubnetAId.Value).toEqual({
        Ref: 'PublicSubnetA',
      });
      expect(template.Outputs.PublicSubnetBId.Value).toEqual({
        Ref: 'PublicSubnetB',
      });
      expect(template.Outputs.PrivateSubnetAId.Value).toEqual({
        Ref: 'PrivateSubnetA',
      });
      expect(template.Outputs.PrivateSubnetBId.Value).toEqual({
        Ref: 'PrivateSubnetB',
      });
    });

    test('Security Group outputs should reference correct resources', () => {
      expect(template.Outputs.PublicSecurityGroupId.Value).toEqual({
        Ref: 'PublicSecurityGroup',
      });
      expect(template.Outputs.PrivateSecurityGroupId.Value).toEqual({
        Ref: 'PrivateSecurityGroup',
      });
    });

    test('IAM outputs should use GetAtt for ARNs', () => {
      expect(template.Outputs.EC2S3AccessRoleArn.Value).toEqual({
        'Fn::GetAtt': ['EC2S3AccessRole', 'Arn'],
      });
      expect(template.Outputs.EC2S3AccessInstanceProfileArn.Value).toEqual({
        'Fn::GetAtt': ['EC2S3AccessInstanceProfile', 'Arn'],
      });
    });

    test('Gateway outputs should reference correct resources', () => {
      expect(template.Outputs.InternetGatewayId.Value).toEqual({
        Ref: 'InternetGateway',
      });
      expect(template.Outputs.NatGatewayAId.Value).toEqual({
        Ref: 'NatGatewayA',
      });
      expect(template.Outputs.NatGatewayBId.Value).toEqual({
        Ref: 'NatGatewayB',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have appropriate number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(9);
    });

    test('should have all VPC infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(25);
    });

    test('should have all required outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });

    test('all resources should have proper tagging', () => {
      const taggedResources = [
        'MyVPC',
        'InternetGateway',
        'PublicSubnetA',
        'PublicSubnetB',
        'PrivateSubnetA',
        'PrivateSubnetB',
        'NatGatewayAEIP',
        'NatGatewayBEIP',
        'NatGatewayA',
        'NatGatewayB',
        'PublicRouteTable',
        'PrivateRouteTableA',
        'PrivateRouteTableB',
        'PublicSecurityGroup',
        'PrivateSecurityGroup',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const tags = resource.Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        const projectTag = tags.find((tag: any) => tag.Key === 'Project');

        expect(nameTag).toBeDefined();
        expect(envTag).toBeDefined();
        expect(projectTag).toBeDefined();
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('should span two availability zones', () => {
      expect(
        template.Resources.PublicSubnetA.Properties.AvailabilityZone
      ).toEqual({ Ref: 'AvailabilityZoneA' });
      expect(
        template.Resources.PublicSubnetB.Properties.AvailabilityZone
      ).toEqual({ Ref: 'AvailabilityZoneB' });
      expect(
        template.Resources.PrivateSubnetA.Properties.AvailabilityZone
      ).toEqual({ Ref: 'AvailabilityZoneA' });
      expect(
        template.Resources.PrivateSubnetB.Properties.AvailabilityZone
      ).toEqual({ Ref: 'AvailabilityZoneB' });
    });

    test('should have NAT Gateway in each public subnet', () => {
      expect(template.Resources.NatGatewayA.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnetA',
      });
      expect(template.Resources.NatGatewayB.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnetB',
      });
    });

    test('private subnets should route to their respective NAT Gateway', () => {
      expect(
        template.Resources.DefaultPrivateRouteA.Properties.NatGatewayId
      ).toEqual({ Ref: 'NatGatewayA' });
      expect(
        template.Resources.DefaultPrivateRouteB.Properties.NatGatewayId
      ).toEqual({ Ref: 'NatGatewayB' });
    });
  });

  describe('Resource Dependencies', () => {
    test('Elastic IPs should depend on Internet Gateway Attachment', () => {
      expect(template.Resources.NatGatewayAEIP.DependsOn).toBe(
        'InternetGatewayAttachment'
      );
      expect(template.Resources.NatGatewayBEIP.DependsOn).toBe(
        'InternetGatewayAttachment'
      );
    });

    test('Default Public Route should depend on Internet Gateway Attachment', () => {
      expect(template.Resources.DefaultPublicRoute.DependsOn).toBe(
        'InternetGatewayAttachment'
      );
    });
  });
});
