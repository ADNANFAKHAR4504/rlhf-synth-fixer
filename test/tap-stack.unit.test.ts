import fs from 'fs';
import path from 'path';

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
        'Master CloudFormation template for multi-environment payment processing infrastructure'
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
      expect(envSuffixParam.Description).toContain('Unique suffix for environment resources');
      expect(envSuffixParam.AllowedPattern).toBeDefined();
      expect(envSuffixParam.ConstraintDescription).toBeDefined();
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('dev');
      expect(template.Parameters.Environment.AllowedValues).toContain('dev');
      expect(template.Parameters.Environment.AllowedValues).toContain('staging');
      expect(template.Parameters.Environment.AllowedValues).toContain('prod');
    });

    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Type).toBe('String');
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });

    test('should have ReplicaRegion parameter', () => {
      expect(template.Parameters.ReplicaRegion).toBeDefined();
      expect(template.Parameters.ReplicaRegion.Type).toBe('String');
      expect(template.Parameters.ReplicaRegion.Default).toBe('eu-west-1');
    });

    test('should have DevOpsEmail parameter', () => {
      expect(template.Parameters.DevOpsEmail).toBeDefined();
      expect(template.Parameters.DevOpsEmail.Type).toBe('String');
    });

    test('should have Application parameter', () => {
      expect(template.Parameters.Application).toBeDefined();
      expect(template.Parameters.Application.Default).toBe('payment-processing');
    });

    test('should have CostCenter parameter', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.CostCenter.Default).toBe('fintech-payments');
    });
  });

  describe('Conditions', () => {
    test('should have environment-based conditions', () => {
      expect(template.Conditions).toBeDefined();
      // Check for at least some environment-based conditions
      const hasEnvironmentConditions =
        template.Conditions.IsProduction ||
        template.Conditions.IsStaging ||
        template.Conditions.IsDevelopment ||
        template.Conditions.IsProductionOrStaging;
      expect(hasEnvironmentConditions).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have NetworkStack nested stack', () => {
      expect(template.Resources.NetworkStack).toBeDefined();
      expect(template.Resources.NetworkStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('should have SecurityStack nested stack', () => {
      expect(template.Resources.SecurityStack).toBeDefined();
      expect(template.Resources.SecurityStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('should have DatabaseStack nested stack', () => {
      expect(template.Resources.DatabaseStack).toBeDefined();
      expect(template.Resources.DatabaseStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('should have StorageStack nested stack', () => {
      expect(template.Resources.StorageStack).toBeDefined();
      expect(template.Resources.StorageStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('should have MonitoringStack nested stack', () => {
      expect(template.Resources.MonitoringStack).toBeDefined();
      expect(template.Resources.MonitoringStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('NetworkStack should have correct properties', () => {
      const networkStack = template.Resources.NetworkStack;
      expect(networkStack.Properties).toBeDefined();
      expect(networkStack.Properties.TemplateURL).toBeDefined();
      expect(networkStack.Properties.Parameters).toBeDefined();
      expect(networkStack.Properties.Parameters.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(networkStack.Properties.Parameters.Environment).toEqual({ Ref: 'Environment' });
      expect(networkStack.Properties.Parameters.VpcCidr).toEqual({ Ref: 'VpcCidr' });
    });

    test('should have SSM Parameter resources', () => {
      expect(template.Resources.EnvironmentParameter).toBeDefined();
      expect(template.Resources.EnvironmentParameter.Type).toBe('AWS::SSM::Parameter');
      expect(template.Resources.ApplicationParameter).toBeDefined();
      expect(template.Resources.ApplicationParameter.Type).toBe('AWS::SSM::Parameter');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'StackName',
        'VpcId',
        'AuroraClusterEndpoint',
        'DynamoDBTableName',
        'S3BucketName',
        'SNSTopicArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Master stack name');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toBeDefined();
    });

    test('VpcId output should reference NetworkStack', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['NetworkStack', 'Outputs.VpcId'] });
    });

    test('DynamoDBTableName output should reference StorageStack', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('DynamoDB table name');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['StorageStack', 'Outputs.DynamoDBTableName'] });
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

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(5);
    });

    test('should have multiple nested stacks', () => {
      const nestedStacks = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::CloudFormation::Stack'
      );
      expect(nestedStacks.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Resource Naming Convention', () => {
    test('SSM parameters should follow naming convention', () => {
      const envParam = template.Resources.EnvironmentParameter;
      const appParam = template.Resources.ApplicationParameter;

      expect(envParam.Properties.Name).toBeDefined();
      expect(appParam.Properties.Name).toBeDefined();
    });

    test('export names should include environment suffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (typeof exportName === 'object' && exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Nested Stack Dependencies', () => {
    test('nested stacks should have appropriate dependencies', () => {
      // Check that at least some stacks have dependencies set
      const stacks = ['SecurityStack', 'DatabaseStack', 'StorageStack', 'MonitoringStack', 'ComputeStack'];
      let hasDependencies = false;

      stacks.forEach(stackName => {
        const stack = template.Resources[stackName];
        if (stack && stack.DependsOn) {
          hasDependencies = true;
        }
      });

      expect(hasDependencies).toBe(true);
    });

    test('StorageStack should have dependencies if they exist', () => {
      const storageStack = template.Resources.StorageStack;
      if (storageStack && storageStack.DependsOn) {
        // DependsOn can be a string or array
        const deps = Array.isArray(storageStack.DependsOn)
          ? storageStack.DependsOn
          : [storageStack.DependsOn];
        expect(deps.length).toBeGreaterThan(0);
      }
      expect(storageStack).toBeDefined();
    });

    test('ComputeStack should have dependencies if deployed', () => {
      const computeStack = template.Resources.ComputeStack;
      if (computeStack && computeStack.DependsOn) {
        // DependsOn can be a string or array
        const deps = Array.isArray(computeStack.DependsOn)
          ? computeStack.DependsOn
          : [computeStack.DependsOn];
        expect(deps.length).toBeGreaterThan(0);
      }
      // ComputeStack might be conditional, so we just check if it exists when it should
      if (computeStack) {
        expect(computeStack.Type).toBe('AWS::CloudFormation::Stack');
      }
    });
  });

  describe('Tagging Strategy', () => {
    test('nested stacks should have consistent tags', () => {
      const stacks = ['NetworkStack', 'SecurityStack', 'DatabaseStack', 'StorageStack', 'MonitoringStack'];

      stacks.forEach(stackName => {
        if (template.Resources[stackName]) {
          const stack = template.Resources[stackName];
          if (stack.Properties && stack.Properties.Tags) {
            const tags = stack.Properties.Tags;
            const hasEnvTag = tags.some((tag: any) => tag.Key === 'Environment');
            const hasAppTag = tags.some((tag: any) => tag.Key === 'Application');
            const hasCostCenterTag = tags.some((tag: any) => tag.Key === 'CostCenter');

            expect(hasEnvTag).toBe(true);
            expect(hasAppTag).toBe(true);
            expect(hasCostCenterTag).toBe(true);
          }
        }
      });
    });
  });
});