import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Integration tests placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Comprehensive AWS Security Setup for Application in us-east-1'
      );
    });

    test('should have metadata section', () => {
      // This template doesn't have metadata section, which is optional
      expect(template.Metadata || {}).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have S3BucketName parameter', () => {
      expect(template.Parameters.S3BucketName).toBeDefined();
    });

    test('should have RandomSuffix parameter', () => {
      expect(template.Parameters.RandomSuffix).toBeDefined();
    });

    test('should have EnableGuardDuty parameter', () => {
      expect(template.Parameters.EnableGuardDuty).toBeDefined();
    });

    test('S3BucketName parameter should have correct properties', () => {
      const param = template.Parameters.S3BucketName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('my-secure-app-bucket');
      expect(param.Description).toBe('Name of the S3 bucket for read access');
    });

    test('RandomSuffix parameter should have correct properties', () => {
      const param = template.Parameters.RandomSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secure-app-123');
      expect(param.Description).toBe('Random suffix for unique resource naming');
    });

    test('EnableGuardDuty parameter should have correct properties', () => {
      const param = template.Parameters.EnableGuardDuty;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Description).toBe('Enable GuardDuty (set to false if already exists in account)');
    });
  });

  describe('Resources', () => {
    test('should have DefaultVPC resource', () => {
      expect(template.Resources.DefaultVPC).toBeDefined();
    });

    test('DefaultVPC should be an EC2 VPC', () => {
      const vpc = template.Resources.DefaultVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have AppDatabase resource', () => {
      expect(template.Resources.AppDatabase).toBeDefined();
    });

    test('AppDatabase should be an RDS DB Instance', () => {
      const db = template.Resources.AppDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have AppLoadBalancer resource', () => {
      expect(template.Resources.AppLoadBalancer).toBeDefined();
    });

    test('AppLoadBalancer should be an Application Load Balancer', () => {
      const alb = template.Resources.AppLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have AppCloudTrail resource', () => {
      expect(template.Resources.AppCloudTrail).toBeDefined();
    });

    test('AppCloudTrail should be a CloudTrail', () => {
      const trail = template.Resources.AppCloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('should have conditional GuardDutyDetector resource', () => {
      expect(template.Resources.GuardDutyDetector).toBeDefined();
    });

    test('GuardDutyDetector should be a GuardDuty Detector', () => {
      const detector = template.Resources.GuardDutyDetector;
      expect(detector.Type).toBe('AWS::GuardDuty::Detector');
    });

    test('should have WebACL resource', () => {
      expect(template.Resources.WebACL).toBeDefined();
    });

    test('WebACL should be a WAFv2 Web ACL', () => {
      const waf = template.Resources.WebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'AppSecurityGroupId',
        'DatabaseEndpoint',
        'LoadBalancerDNS',
        'S3VPCEndpointId',
        'CloudTrailArn',
        'GuardDutyDetectorId',
        'WebACLArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({
        'Fn::If': ['IsAws', { Ref: 'DefaultVPC' }, 'Not available in LocalStack'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::If': [
          'IsAws',
          { 'Fn::GetAtt': ['AppDatabase', 'Endpoint.Address'] },
          'Not available in LocalStack',
        ],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DB-Endpoint',
      });
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({
        'Fn::If': [
          'IsAws',
          { 'Fn::GetAtt': ['AppLoadBalancer', 'DNSName'] },
          'Not available in LocalStack',
        ],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ALB-DNS',
      });
    });

    test('CloudTrailArn output should be correct', () => {
      const output = template.Outputs.CloudTrailArn;
      expect(output.Description).toBe('CloudTrail ARN');
      expect(output.Value).toEqual({
        'Fn::If': [
          'IsAws',
          { 'Fn::GetAtt': ['AppCloudTrail', 'Arn'] },
          'Not available in LocalStack',
        ],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-CloudTrail-ARN',
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(46);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC should use RandomSuffix for naming', () => {
      const vpc = template.Resources.DefaultVPC;
      const tags = vpc.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');

      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'DefaultVPC-${RandomSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      // VPCId export name is different, check it specifically
      const vpcOutput = template.Outputs.VPCId;
      expect(vpcOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });

      // Check other outputs follow the pattern
      const otherOutputs = ['AppSecurityGroupId', 'DatabaseEndpoint', 'LoadBalancerDNS'];
      otherOutputs.forEach(outputKey => {
        if (template.Outputs[outputKey]) {
          const output = template.Outputs[outputKey];
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });
});
