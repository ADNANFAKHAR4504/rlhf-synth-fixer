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
      expect(template.Description).toBeDefined();
    });
    test('should have Parameters, Resources, and Outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });
    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });
    test('should have S3Bucket resource', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });
    test('should have DatabaseInstance resource', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });
    test('should have WebServerInstance resource', () => {
      expect(template.Resources.WebServerInstance).toBeDefined();
      expect(template.Resources.WebServerInstance.Type).toBe('AWS::EC2::Instance');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'WebServerInstanceId',
      'WebServerPublicIP',
      'WebServerElasticIP',
      'S3BucketName',
      'DatabaseEndpoint',
      'DatabasePort',
    ];
    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });
    test('VPCId output should reference VPC', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });
    test('WebServerInstanceId output should reference WebServerInstance', () => {
      expect(template.Outputs.WebServerInstanceId.Value).toEqual({ Ref: 'WebServerInstance' });
    });
    test('WebServerPublicIP output should reference WebServerInstance.PublicIp', () => {
      expect(template.Outputs.WebServerPublicIP.Value).toEqual({ 'Fn::GetAtt': ['WebServerInstance', 'PublicIp'] });
    });
    test('S3BucketName output should reference S3Bucket', () => {
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'S3Bucket' });
    });
    test('DatabaseEndpoint output should reference DatabaseInstance.Endpoint.Address', () => {
      expect(template.Outputs.DatabaseEndpoint.Value).toEqual({ 'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address'] });
    });
    test('DatabasePort output should reference DatabaseInstance.Endpoint.Port', () => {
      expect(template.Outputs.DatabasePort.Value).toEqual({ 'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Port'] });
    });
  });
});
