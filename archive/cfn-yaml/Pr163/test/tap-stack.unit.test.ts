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
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toContain('basic cloud environment');
    });

    test('should have metadata with interface parameters', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define required parameters', () => {
      const params = ['EnvironmentSuffix', 'KeyPairName'];
      params.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix should have proper constraints', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('Resources', () => {
    test('should include all expected resources', () => {
      const expectedResources = [
        'SampleBucket',
        'DevVPC',
        'DevInternetGateway',
        'DevAttachGateway',
        'DevPublicSubnet',
        'DevRouteTable',
        'DevRoute',
        'DevSubnetRouteTableAssociation',
        'DevSecurityGroup',
        'DevEIP',
        'DevEC2Instance',
        'DevEIPAssociation'
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('SampleBucket should be an S3 bucket with versioning', () => {
      const bucket = template.Resources.SampleBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'sample-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('DevSecurityGroup should allow SSH and HTTP from 0.0.0.0/0', () => {
      const sg = template.Resources.DevSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      const ports = ingress.map((r: any) => r.FromPort);
      expect(ports).toContain(22);
      expect(ports).toContain(80);
    });

    test('DevEC2Instance should be a t2.micro EC2 instance', () => {
      const instance = template.Resources.DevEC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t2.micro');
      expect(instance.Properties.ImageId).toEqual({ 'Fn::FindInMap': ['RegionMap', 'us-west-2', 'AMI'] });
    });

    test('DevEIPAssociation should associate EIP with EC2', () => {
      const assoc = template.Resources.DevEIPAssociation;
      expect(assoc.Type).toBe('AWS::EC2::EIPAssociation');
      expect(assoc.Properties.InstanceId).toEqual({ Ref: 'DevEC2Instance' });
      expect(assoc.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['DevEIP', 'AllocationId'] });
    });
  });

  describe('Outputs', () => {
    test('should include required outputs', () => {
      const expectedOutputs = ['S3BucketName', 'EC2InstancePublicIP'];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('S3BucketName output should reference SampleBucket', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('The name of the S3 bucket');
      expect(output.Value).toEqual({ Ref: 'SampleBucket' });
    });

    test('EC2InstancePublicIP output should reference DevEIP', () => {
      const output = template.Outputs.EC2InstancePublicIP;
      expect(output.Description).toBe('The public IP address of the EC2 instance');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DevEIP', 'PublicIp'] });
    });
  });

  describe('Template Validation', () => {
    test('should be a valid object', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have at least 4 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(4);
    });

    test('should have exactly 2 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(2);
    });

    test('should have exactly 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Tagging Convention', () => {
    test('all resources should include Project and Environment tags', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        const tags = resource.Properties?.Tags;
        if (tags) {
          const keys = tags.map((t: any) => t.Key);
          expect(keys).toContain('Project');
          expect(keys).toContain('Environment');
        }
      });
    });
  });
});
