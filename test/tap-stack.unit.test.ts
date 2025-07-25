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
      expect(template.Description).toContain('This CloudFormation template sets up a basic cloud environment');
    });

    test('should have metadata with interface parameters', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define required parameters', () => {
      const params = ['EnvironmentSuffix', 'VpcId', 'PublicSubnet', 'KeyPairName', 'LatestAmiId'];
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
      const expectedResources = ['SampleBucket', 'WebSecurityGroup', 'WebServerInstance', 'ElasticIP'];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('SampleBucket should be an S3 bucket with versioning', () => {
      const bucket = template.Resources.SampleBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'sample-bucket-${EnvironmentSuffix}-${AWS::AccountId}',
      });
    });

    test('WebSecurityGroup should allow SSH and HTTP from 0.0.0.0/0', () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      const ports = ingress.map((r: { FromPort: number }) => r.FromPort);
      expect(ports).toContain(22);
      expect(ports).toContain(80);
    });

    test('WebServerInstance should be a t2.micro EC2 instance', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t2.micro');
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('ElasticIP should associate with the EC2 instance', () => {
      const eip = template.Resources.ElasticIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.InstanceId).toEqual({ Ref: 'WebServerInstance' });
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

    test('EC2InstancePublicIP output should get public IP from ElasticIP', () => {
      const output = template.Outputs.EC2InstancePublicIP;
      expect(output.Description).toBe('The public IP address of the EC2 instance');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ElasticIP', 'PublicIp'] });
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

    test('should have exactly 5 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(5);
    });

    test('should have exactly 2 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(2);
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
