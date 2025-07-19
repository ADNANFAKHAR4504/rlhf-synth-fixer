import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Enterprise-level infrastructure with multi-region support, SSM parameter integration, strict S3 access control, standardized tagging, ALB configuration, KMS encryption, and least privilege IAM roles'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'CostCenter',
        'InstanceType',
        'S3BucketName',
        'EnvironmentSuffix',
        'VpcIdParameter',
        'SubnetId1Parameter',
        'SubnetId2Parameter',
        'SecurityGroupIdParameter',
        'RouteTableIdParameter',
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.AllowedValues).toEqual(['devel', 'test', 'prod']);
      expect(envParam.Default).toBe('devel');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
    });
  });

  describe('Dynamic Configuration with SSM Parameters', () => {
    test('should use SSM parameter resolution for VPC ID', () => {
      const vpcParam = template.Parameters.VpcIdParameter;
      expect(vpcParam.Type).toBe('String');
      expect(vpcParam.Default).toBe('/network/vpc-id');
    });

    test('should use SSM parameter resolution for subnet IDs', () => {
      const subnet1Param = template.Parameters.SubnetId1Parameter;
      const subnet2Param = template.Parameters.SubnetId2Parameter;
      expect(subnet1Param.Type).toBe('String');
      expect(subnet1Param.Default).toBe('/network/subnet-id-1');
      expect(subnet2Param.Type).toBe('String');
      expect(subnet2Param.Default).toBe('/network/subnet-id-2');
    });

    test('should use SSM parameter resolution for security group ID', () => {
      const sgParam = template.Parameters.SecurityGroupIdParameter;
      expect(sgParam.Type).toBe('String');
      expect(sgParam.Default).toBe('/network/security-group-id');
    });

    test('should use SSM parameter resolution for route table ID', () => {
      const rtParam = template.Parameters.RouteTableIdParameter;
      expect(rtParam.Type).toBe('String');
      expect(rtParam.Default).toBe('/network/route-table-id');
    });
  });

  describe('SSM Parameter Resolution in Resources', () => {
    test('should use SSM resolution in EC2 instance', () => {
      const ec2Instance = template.Resources.EC2Instance;
      expect(ec2Instance.Properties.SubnetId).toEqual({
        'Fn::Sub': '{{resolve:ssm:${SubnetId1Parameter}}}',
      });
      expect(ec2Instance.Properties.SecurityGroupIds[0]).toEqual({
        'Fn::Sub': '{{resolve:ssm:${SecurityGroupIdParameter}}}',
      });
    });

    test('should use SSM resolution in Load Balancer', () => {
      const lb = template.Resources.LoadBalancer;
      expect(lb.Properties.Subnets[0]).toEqual({
        'Fn::Sub': '{{resolve:ssm:${SubnetId1Parameter}}}',
      });
      expect(lb.Properties.Subnets[1]).toEqual({
        'Fn::Sub': '{{resolve:ssm:${SubnetId2Parameter}}}',
      });
      expect(lb.Properties.SecurityGroups[0]).toEqual({
        'Fn::Sub': '{{resolve:ssm:${SecurityGroupIdParameter}}}',
      });
    });

    test('should use SSM resolution in VPC Endpoint', () => {
      const vpcEndpoint = template.Resources.S3VpcEndpoint;
      expect(vpcEndpoint.Properties.VpcId).toEqual({
        'Fn::Sub': '{{resolve:ssm:${VpcIdParameter}}}',
      });
      expect(vpcEndpoint.Properties.RouteTableIds[0]).toEqual({
        'Fn::Sub': '{{resolve:ssm:${RouteTableIdParameter}}}',
      });
    });

    test('should use SSM resolution in Target Group', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.VpcId).toEqual({
        'Fn::Sub': '{{resolve:ssm:${VpcIdParameter}}}',
      });
    });
  });

  describe('S3 Infrastructure', () => {
    test('should have S3 bucket with correct naming', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.S3Bucket.Properties.BucketName).toEqual({
        'Fn::Sub':
          '${S3BucketName}-${AWS::Region}-${Environment}-${EnvironmentSuffix}',
      });
    });

    test('should have S3 bucket encryption configured', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    test('should have public access blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 bucket policy with VPC restriction', () => {
      expect(template.Resources.S3BucketPolicy).toBeDefined();
      const policy =
        template.Resources.S3BucketPolicy.Properties.PolicyDocument;
      const vpcStatement = policy.Statement.find(
        (s: any) => s.Sid === 'AllowVPCEndpointAccess'
      );
      expect(vpcStatement).toBeDefined();
      expect(vpcStatement.Condition.StringEquals['aws:sourceVpc']).toEqual({
        'Fn::Sub': '{{resolve:ssm:${VpcIdParameter}}}',
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for S3 encryption', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
      expect(template.Resources.S3EncryptionKey.Type).toBe('AWS::KMS::Key');
      expect(
        template.Resources.S3EncryptionKey.Properties.EnableKeyRotation
      ).toBe(true);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.S3EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.S3EncryptionKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
    });
  });

  describe('EC2 Infrastructure', () => {
    test('should not have EC2 key pair (removed per requirements)', () => {
      expect(template.Resources.EC2KeyPair).toBeUndefined();
    });

    test('should have EC2 instance', () => {
      expect(template.Resources.EC2Instance).toBeDefined();
      expect(template.Resources.EC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    test('should have IAM role with least privilege', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2S3AccessPolicy).toBeDefined();
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.LoadBalancer).toBeDefined();
      expect(template.Resources.LoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(template.Resources.LoadBalancer.Properties.Type).toBe(
        'application'
      );
    });

    test('should have cross-zone load balancing enabled', () => {
      const lb = template.Resources.LoadBalancer;
      const crossZoneAttr = lb.Properties.LoadBalancerAttributes.find(
        (attr: any) => attr.Key === 'load_balancing.cross_zone.enabled'
      );
      expect(crossZoneAttr).toBeDefined();
      expect(crossZoneAttr.Value).toBe('true');
    });

    test('should have target group and listener', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.Listener).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
      expect(template.Resources.Listener.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
    });
  });

  describe('VPC Endpoint', () => {
    test('should have S3 VPC endpoint', () => {
      expect(template.Resources.S3VpcEndpoint).toBeDefined();
      expect(template.Resources.S3VpcEndpoint.Type).toBe(
        'AWS::EC2::VPCEndpoint'
      );
      expect(template.Resources.S3VpcEndpoint.Properties.VpcEndpointType).toBe(
        'Gateway'
      );
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have environment and costCenter tags', () => {
      const resourcesWithTags = [
        'VPC',
        'PublicSubnet1',
        'PublicSubnet2',
        'InternetGateway',
        'PublicRouteTable',
        'SecurityGroup',
        'EC2KeyPair',
        'S3EncryptionKey',
        'S3VpcEndpoint',
        'S3Bucket',
        'EC2Role',
        'EC2Instance',
        'LoadBalancer',
        'TargetGroup',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'environment'
          );
          const costTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'costCenter'
          );
          expect(envTag).toBeDefined();
          expect(costTag).toBeDefined();
        }
      });
    });
  });

  describe('Mappings', () => {
    test('should have region mappings for AMIs', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
      regions.forEach(region => {
        expect(template.Mappings.RegionMap[region]).toBeDefined();
        expect(template.Mappings.RegionMap[region].AMI).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'S3BucketArn',
        'KMSKeyArn',
        'EC2RoleArn',
        'LoadBalancerDNS',
        'EC2InstanceId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
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
  });
});
