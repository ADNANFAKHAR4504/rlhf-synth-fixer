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

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure data processing infrastructure for PCI-DSS compliant financial transaction processing'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Unique suffix for resource naming to prevent conflicts'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DataBucketName',
        'DataBucketArn',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'KMSKeyId',
        'KMSKeyArn',
        'VPCFlowLogsLogGroupName',
        'LambdaSecurityGroupId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID');
      expect(output.Value).toEqual({ Ref: 'KMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMSKeyId',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Lambda Function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DataProcessorFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunctionArn',
      });
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBe('Lambda Function Name');
      expect(output.Value).toEqual({ Ref: 'DataProcessorFunction' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunctionName',
      });
    });

    test('DataBucketName output should be correct', () => {
      const output = template.Outputs.DataBucketName;
      expect(output.Description).toBe(
        'S3 Bucket Name for secure data storage'
      );
      expect(output.Value).toEqual({ Ref: 'DataBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DataBucketName',
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

    test('should have exactly one resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(16);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
