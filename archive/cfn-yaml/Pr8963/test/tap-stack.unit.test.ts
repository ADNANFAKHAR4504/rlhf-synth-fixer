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

    test('should define Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define ProjectXDataProcessorFunctionName parameter', () => {
      expect(template.Parameters.ProjectXDataProcessorFunctionName).toBeDefined();
    });

    test('should define ProjectXResponseHandlerFunctionName parameter', () => {
      expect(template.Parameters.ProjectXResponseHandlerFunctionName).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should define DataProcessorLogGroup with correct name and retention', () => {
      const logGroup = template.Resources.DataProcessorLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/${ProjectXDataProcessorFunctionName}',
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should define ResponseHandlerLogGroup with correct name and retention', () => {
      const logGroup = template.Resources.ResponseHandlerLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/${ProjectXResponseHandlerFunctionName}',
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Lambda Resources', () => {
    test('should define ProjectXDataProcessorFunction Lambda function', () => {
      const lambda = template.Resources.ProjectXDataProcessorFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName).toEqual({
        Ref: 'ProjectXDataProcessorFunctionName',
      });
    });

    test('should define ProjectXResponseHandlerFunction Lambda function', () => {
      const lambda = template.Resources.ProjectXResponseHandlerFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName).toEqual({
        Ref: 'ProjectXResponseHandlerFunctionName',
      });
    });
  });

  describe('Outputs', () => {
    test('should output DataProcessorFunctionName correctly', () => {
      const output = template.Outputs.DataProcessorFunctionName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Lambda Function Name for dataProcessor');
      expect(output.Value).toEqual({
        Ref: 'ProjectXDataProcessorFunction',
      });
    });

    test('should output ResponseHandlerFunctionName correctly', () => {
      const output = template.Outputs.ResponseHandlerFunctionName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Lambda Function Name for responseHandler');
      expect(output.Value).toEqual({
        Ref: 'ProjectXResponseHandlerFunction',
      });
    });
  });

  describe('Template Validation', () => {
    test('template must be a valid JSON object', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any missing top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});
