import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have VpcCidr and DatabaseUsername with correct defaults and constraints', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Type).toBe('String');
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
      const dbParam = template.Parameters.DatabaseUsername;
      expect(dbParam).toBeDefined();
      expect(dbParam.Type).toBe('String');
      expect(dbParam.Default).toBe('dbadmin');
      expect(dbParam.MinLength).toBe(1);
      expect(dbParam.MaxLength).toBe(16);
      expect(dbParam.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });
  });

  describe('Core Resources', () => {
    test('should define KMS key and alias', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should define VPC, public/private subnets, and IGW', () => {
      expect(template.Resources.WebAppVPC).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('should define route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(
        template.Resources.PublicSubnetRouteTableAssociation1
      ).toBeDefined();
      expect(
        template.Resources.PublicSubnetRouteTableAssociation2
      ).toBeDefined();
    });

    test('should define security groups for ALB, EC2, and RDS', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
    });

    test('should define IAM role and instance profile', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
    });

    test('should define S3 bucket for static files', () => {
      expect(template.Resources.StaticFilesBucket).toBeDefined();
      expect(template.Resources.StaticFilesBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should define RDS subnet group and instance', () => {
      expect(template.Resources.RDSSubnetGroup).toBeDefined();
      expect(template.Resources.DatabaseInstance).toBeDefined();
    });

    test('should define ALB, target group, and listener', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBListener).toBeDefined();
    });

    test('should define EC2 launch template and ASG', () => {
      expect(template.Resources.EC2LaunchTemplate).toBeDefined();
      expect(template.Resources.AutoScalingGroup).toBeDefined();
    });
  });

  describe('Logging and Config', () => {
    test('should define CloudTrail bucket, policy, and trail', () => {
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrail).toBeDefined();
    });

    test('should define Config bucket, policy, role, recorder, and delivery channel', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
      expect(template.Resources.ConfigBucketPolicy).toBeDefined();
      expect(template.Resources.ConfigServiceRole).toBeDefined();
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      expect(template.Resources.DeliveryChannel).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs with correct values', () => {
      const outputs = template.Outputs;
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.LoadBalancerDNS.Value).toBeDefined();
      expect(outputs.S3BucketName.Value).toBeDefined();
      expect(outputs.DatabaseEndpoint.Value).toBeDefined();
      expect(outputs.VPCId.Value).toBeDefined();
      expect(outputs.KMSKeyId.Value).toBeDefined();
    });

    test('should have export names following convention', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        const exportName = output.Export.Name;
        if (typeof exportName === 'object' && exportName['Fn::Sub']) {
          expect(exportName['Fn::Sub']).toMatch(/^\${AWS::StackName}-/);
        } else {
          expect(exportName).toMatch(/^\${AWS::StackName}-/);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('VPC should use private CIDR, S3 and RDS should use KMS encryption', () => {
      expect(template.Parameters.VpcCidr.Default).toMatch(
        /^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\./
      );
      expect(
        template.Resources.StaticFilesBucket.Properties.BucketEncryption
      ).toBeDefined();
      expect(
        template.Resources.DatabaseInstance.Properties.StorageEncrypted
      ).toBe(true);
      expect(template.Resources.DatabaseInstance.Properties.KmsKeyId).toEqual({
        Ref: 'KMSKey',
      });
    });

    test('CloudTrail and Config buckets should have encryption and block public access', () => {
      ['CloudTrailBucket', 'ConfigBucket'].forEach(bucket => {
        const props = template.Resources[bucket].Properties;
        expect(props.BucketEncryption).toBeDefined();
        expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(
          true
        );
        expect(props.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(
          true
        );
        expect(props.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(
          true
        );
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have Environment and Owner tags', () => {
      const tagCheck = (tags: any[]) => {
        expect(tags.find(t => t.Key === 'Environment')).toBeDefined();
        expect(tags.find(t => t.Key === 'Owner')).toBeDefined();
      };
      tagCheck(template.Resources.WebAppVPC.Properties.Tags);
      tagCheck(template.Resources.KMSKey.Properties.Tags);
      tagCheck(template.Resources.StaticFilesBucket.Properties.Tags);
    });
  });

  describe('IAM Role Policies', () => {
    test('EC2Role should have S3 and KMS access policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.Policies).toBeDefined();
      const policyNames = role.Properties.Policies.map(
        (p: any) => p.PolicyName
      );
      expect(policyNames).toContain('S3AccessPolicy');
      expect(policyNames).toContain('KMSAccessPolicy');
    });
  });

  describe('Subnet and Security Group Rules', () => {
    test('PublicSubnetRouteTableAssociation1/2 should associate public subnets with public route table', () => {
      expect(
        template.Resources.PublicSubnetRouteTableAssociation1.Properties
          .RouteTableId
      ).toEqual({ Ref: 'PublicRouteTable' });
      expect(
        template.Resources.PublicSubnetRouteTableAssociation2.Properties
          .RouteTableId
      ).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('ALBSecurityGroup should allow HTTP/HTTPS from anywhere', () => {
      const ingress =
        template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          expect.objectContaining({
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ])
      );
    });

    test('EC2SecurityGroup should allow HTTP from ALB', () => {
      const ingress =
        template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 80,
            ToPort: 80,
            SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' },
          }),
        ])
      );
    });

    test('RDSSecurityGroup should allow MySQL from VPC CIDR', () => {
      const ingress =
        template.Resources.RDSSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 3306,
            ToPort: 3306,
            CidrIp: '10.0.0.0/16',
          }),
        ])
      );
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure and required sections', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have proper resource, parameter, and output counts', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(10);
      expect(Object.keys(template.Parameters).length).toBe(2);
      expect(Object.keys(template.Outputs).length).toBe(5);
    });
  });

  describe('Config Service', () => {
    test('should define Config service role', () => {
      expect(template.Resources.ConfigServiceRole).toBeDefined();
      expect(template.Resources.ConfigServiceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should define Config S3 bucket', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
      expect(template.Resources.ConfigBucket.Type).toBe('AWS::S3::Bucket');
      expect(
        template.Resources.ConfigBucket.Properties.BucketEncryption
      ).toBeDefined();
    });

    test('should define Config bucket policy', () => {
      expect(template.Resources.ConfigBucketPolicy).toBeDefined();
      expect(template.Resources.ConfigBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
      expect(template.Resources.ConfigBucketPolicy.Properties.Bucket).toEqual({
        Ref: 'ConfigBucket',
      });
    });

    test('should define Configuration Recorder', () => {
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      expect(template.Resources.ConfigurationRecorder.Type).toBe(
        'AWS::Config::ConfigurationRecorder'
      );
      expect(
        template.Resources.ConfigurationRecorder.Properties.RoleARN
      ).toEqual({ 'Fn::GetAtt': ['ConfigServiceRole', 'Arn'] });
    });

    test('should define Delivery Channel', () => {
      expect(template.Resources.DeliveryChannel).toBeDefined();
      expect(template.Resources.DeliveryChannel.Type).toBe(
        'AWS::Config::DeliveryChannel'
      );
      expect(
        template.Resources.DeliveryChannel.Properties.S3BucketName
      ).toEqual({ Ref: 'ConfigBucket' });
    });
  });

  describe('Resource Existence and Types', () => {
    const resourceTypes = {
      KMSKey: 'AWS::KMS::Key',
      KMSKeyAlias: 'AWS::KMS::Alias',
      WebAppVPC: 'AWS::EC2::VPC',
      PublicSubnet1: 'AWS::EC2::Subnet',
      PublicSubnet2: 'AWS::EC2::Subnet',
      PrivateSubnet1: 'AWS::EC2::Subnet',
      PrivateSubnet2: 'AWS::EC2::Subnet',
      InternetGateway: 'AWS::EC2::InternetGateway',
      AttachGateway: 'AWS::EC2::VPCGatewayAttachment',
      PublicRouteTable: 'AWS::EC2::RouteTable',
      PublicRoute: 'AWS::EC2::Route',
      PublicSubnetRouteTableAssociation1:
        'AWS::EC2::SubnetRouteTableAssociation',
      PublicSubnetRouteTableAssociation2:
        'AWS::EC2::SubnetRouteTableAssociation',
      ALBSecurityGroup: 'AWS::EC2::SecurityGroup',
      EC2SecurityGroup: 'AWS::EC2::SecurityGroup',
      RDSSecurityGroup: 'AWS::EC2::SecurityGroup',
      EC2Role: 'AWS::IAM::Role',
      EC2InstanceProfile: 'AWS::IAM::InstanceProfile',
      StaticFilesBucket: 'AWS::S3::Bucket',
      RDSSubnetGroup: 'AWS::RDS::DBSubnetGroup',
      DatabaseInstance: 'AWS::RDS::DBInstance',
      ApplicationLoadBalancer: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
      ALBTargetGroup: 'AWS::ElasticLoadBalancingV2::TargetGroup',
      ALBListener: 'AWS::ElasticLoadBalancingV2::Listener',
      EC2LaunchTemplate: 'AWS::EC2::LaunchTemplate',
      AutoScalingGroup: 'AWS::AutoScaling::AutoScalingGroup',
      CloudTrailBucket: 'AWS::S3::Bucket',
      CloudTrailBucketPolicy: 'AWS::S3::BucketPolicy',
      CloudTrail: 'AWS::CloudTrail::Trail',
      ConfigServiceRole: 'AWS::IAM::Role',
      ConfigBucket: 'AWS::S3::Bucket',
      ConfigBucketPolicy: 'AWS::S3::BucketPolicy',
      ConfigurationRecorder: 'AWS::Config::ConfigurationRecorder',
      DeliveryChannel: 'AWS::Config::DeliveryChannel',
    };

    Object.entries(resourceTypes).forEach(([logicalId, type]) => {
      test(`should define resource ${logicalId} of type ${type}`, () => {
        expect(template.Resources[logicalId]).toBeDefined();
        expect(template.Resources[logicalId].Type).toBe(type);
      });
    });
  });

  describe('IAM Role Policies', () => {
    test('EC2Role should have S3 and KMS access policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.Policies).toBeDefined();
      const policyNames = role.Properties.Policies.map(
        (p: any) => p.PolicyName
      );
      expect(policyNames).toContain('S3AccessPolicy');
      expect(policyNames).toContain('KMSAccessPolicy');
    });
  });

  describe('AutoScalingGroup', () => {
    test('should use EC2LaunchTemplate', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({
        Ref: 'EC2LaunchTemplate',
      });
    });
    test('should attach to public subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({
        Ref: 'PublicSubnet1',
      });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({
        Ref: 'PublicSubnet2',
      });
    });
  });

  describe('Subnet Associations', () => {
    test('PublicSubnetRouteTableAssociation1 should associate PublicSubnet1 with PublicRouteTable', () => {
      const assoc = template.Resources.PublicSubnetRouteTableAssociation1;
      expect(assoc.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(assoc.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
    });
    test('PublicSubnetRouteTableAssociation2 should associate PublicSubnet2 with PublicRouteTable', () => {
      const assoc = template.Resources.PublicSubnetRouteTableAssociation2;
      expect(assoc.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(assoc.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
    });
  });

  describe('Security Groups', () => {
    test('ALBSecurityGroup should allow HTTP/HTTPS from anywhere', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          expect.objectContaining({
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ])
      );
    });
    test('EC2SecurityGroup should allow HTTP from ALB', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 80,
            ToPort: 80,
            SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' },
          }),
        ])
      );
    });
    test('RDSSecurityGroup should allow MySQL from VPC CIDR', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 3306,
            ToPort: 3306,
            CidrIp: '10.0.0.0/16',
          }),
        ])
      );
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'LoadBalancerDNS',
      'S3BucketName',
      'DatabaseEndpoint',
      'VPCId',
      'KMSKeyId',
    ];
    test('should have all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });
    test('should have correct output values', () => {
      expect(template.Outputs.LoadBalancerDNS.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
      expect(template.Outputs.S3BucketName.Value).toEqual({
        Ref: 'StaticFilesBucket',
      });
      expect(template.Outputs.DatabaseEndpoint.Value).toEqual({
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address'],
      });
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'WebAppVPC' });
      expect(template.Outputs.KMSKeyId.Value).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('Template Validation', () => {
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

    test('should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });

    test('should have proper parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have proper output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });
  });

  describe('Security Best Practices', () => {
    test('VPC should use private CIDR blocks', () => {
      const vpcCidr = template.Parameters.VpcCidr.Default;
      expect(vpcCidr).toMatch(
        /^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\./
      );
    });

    test('RDS instance should have encryption enabled', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should have encryption configured', () => {
      const s3Bucket = template.Resources.StaticFilesBucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should use KMS encryption where applicable', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('resources should have proper tags', () => {
      const vpc = template.Resources.WebAppVPC;
      const tags = vpc.Properties.Tags;

      expect(tags.find((tag: any) => tag.Key === 'Name')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'Environment')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'Owner')).toBeDefined();
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = output.Export.Name;
        if (typeof exportName === 'object' && exportName['Fn::Sub']) {
          expect(exportName['Fn::Sub']).toMatch(/^\${AWS::StackName}-/);
        } else {
          expect(exportName).toMatch(/^\${AWS::StackName}-/);
        }
      });
    });
  });
});
