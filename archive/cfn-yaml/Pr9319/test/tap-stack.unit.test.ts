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
        'TAP Stack - Secure Serverless API with AWS WAF and Lambda'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const parameterGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toHaveLength(3);
      expect(parameterGroups[0].Label.default).toBe(
        'Environment Configuration'
      );
      expect(parameterGroups[1].Label.default).toBe('Security Configuration');
      expect(parameterGroups[2].Label.default).toBe('Logging Configuration');
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasSecretsManager).toBeDefined();
      expect(template.Conditions.HasSecretsManager['Fn::Not']).toBeDefined();
      expect(
        template.Conditions.HasSecretsManager['Fn::Not'][0]['Fn::Equals']
      ).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'StageName',
        'SecretsManagerSecretArn',
        'LogRetentionInDays',
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('StageName parameter should have correct properties', () => {
      const stageParam = template.Parameters.StageName;
      expect(stageParam.Type).toBe('String');
      expect(stageParam.Default).toBe('prod');
      expect(stageParam.Description).toBe('API Gateway stage name');
      expect(stageParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(stageParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('SecretsManagerSecretArn parameter should have correct properties', () => {
      const secretParam = template.Parameters.SecretsManagerSecretArn;
      expect(secretParam.Type).toBe('String');
      expect(secretParam.Default).toBe('');
      expect(secretParam.Description).toBe(
        'ARN of the Secrets Manager secret containing environment variables (optional)'
      );
      expect(secretParam.AllowedPattern).toBe('^(arn:aws:secretsmanager:.*|)$');
      expect(secretParam.ConstraintDescription).toBe(
        'Must be a valid Secrets Manager ARN or empty string'
      );
    });

    test('LogRetentionInDays parameter should have correct properties', () => {
      const logParam = template.Parameters.LogRetentionInDays;
      expect(logParam.Type).toBe('Number');
      expect(logParam.Default).toBe(14);
      expect(logParam.Description).toBe(
        'CloudWatch Logs retention period in days'
      );
      expect(logParam.AllowedValues).toContain(1);
      expect(logParam.AllowedValues).toContain(14);
      expect(logParam.AllowedValues).toContain(365);
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'LambdaExecutionRole',
        'LambdaLogGroup',
        'TapStackFunction',
        'LambdaInvokePermission',
        'TapStackApi',
        'ApiResource',
        'ApiMethod',
        'ApiDeployment',
        'ApiStage',
        'ApiLogGroup',
        'ApiGatewayAccount',
        'ApiGatewayCloudWatchRole',
        'WebACL',
        'WebACLAssociation',
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    describe('Lambda Function Resources', () => {
      test('LambdaExecutionRole should have correct properties', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.RoleName).toEqual({
          'Fn::Sub': 'TapStack-LambdaRole-${EnvironmentSuffix}',
        });
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });

      test('TapStackFunction should have correct properties', () => {
        const func = template.Resources.TapStackFunction;
        expect(func.Type).toBe('AWS::Lambda::Function');
        expect(func.Properties.FunctionName).toEqual({
          'Fn::Sub': 'TapStack-Function-${EnvironmentSuffix}',
        });
        expect(func.Properties.Runtime).toBe('python3.9');
        expect(func.Properties.Handler).toBe('index.lambda_handler');
        expect(func.Properties.Timeout).toBe(30);
        expect(func.Properties.MemorySize).toBe(128);
      });

      test('LambdaLogGroup should have correct properties', () => {
        const logGroup = template.Resources.LambdaLogGroup;
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.LogGroupName).toEqual({
          'Fn::Sub': '/aws/lambda/TapStack-Function-${EnvironmentSuffix}',
        });
        expect(logGroup.Properties.RetentionInDays).toEqual({
          Ref: 'LogRetentionInDays',
        });
      });
    });

    describe('API Gateway Resources', () => {
      test('TapStackApi should have correct properties', () => {
        const api = template.Resources.TapStackApi;
        expect(api.Type).toBe('AWS::ApiGateway::RestApi');
        expect(api.Properties.Name).toEqual({
          'Fn::Sub': 'TapStack-API-${EnvironmentSuffix}',
        });
        expect(api.Properties.EndpointConfiguration.Types).toContain(
          'REGIONAL'
        );
      });

      test('ApiResource should have correct properties', () => {
        const resource = template.Resources.ApiResource;
        expect(resource.Type).toBe('AWS::ApiGateway::Resource');
        expect(resource.Properties.PathPart).toBe('api');
        expect(resource.Properties.RestApiId).toEqual({
          Ref: 'TapStackApi',
        });
      });

      test('ApiMethod should have correct properties', () => {
        const method = template.Resources.ApiMethod;
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.Properties.HttpMethod).toBe('GET');
        expect(method.Properties.AuthorizationType).toBe('NONE');
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      });

      test('ApiStage should have correct properties', () => {
        const stage = template.Resources.ApiStage;
        expect(stage.Type).toBe('AWS::ApiGateway::Stage');
        expect(stage.Properties.StageName).toEqual({
          Ref: 'StageName',
        });
        expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
        expect(stage.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
        expect(stage.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
      });
    });

    describe('WAF Resources', () => {
      test('WebACL should have correct properties', () => {
        const webACL = template.Resources.WebACL;
        expect(webACL.Type).toBe('AWS::WAFv2::WebACL');
        expect(webACL.Properties.Scope).toBe('REGIONAL');
        expect(webACL.Properties.DefaultAction.Allow).toBeDefined();
        expect(webACL.Properties.Rules).toHaveLength(2);
      });

      test('WebACL should have rate limiting rule', () => {
        const webACL = template.Resources.WebACL;
        const rateLimitRule = webACL.Properties.Rules.find(
          (rule: any) => rule.Name === 'RateLimitRule'
        );
        expect(rateLimitRule).toBeDefined();
        expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
        expect(rateLimitRule.Action.Block).toBeDefined();
      });

      test('WebACL should have common rule set', () => {
        const webACL = template.Resources.WebACL;
        const commonRule = webACL.Properties.Rules.find(
          (rule: any) => rule.Name === 'CommonRuleSet'
        );
        expect(commonRule).toBeDefined();
        expect(commonRule.Statement.ManagedRuleGroupStatement.Name).toBe(
          'AWSManagedRulesCommonRuleSet'
        );
      });

      test('WebACLAssociation should have correct properties', () => {
        const association = template.Resources.WebACLAssociation;
        expect(association.Type).toBe('AWS::WAFv2::WebACLAssociation');
        expect(association.Properties.ResourceArn).toEqual({
          'Fn::Sub':
            'arn:aws:apigateway:${AWS::Region}::/restapis/${TapStackApi}/stages/${StageName}',
        });
      });
    });

    describe('Resource Tagging', () => {
      test('all resources should have consistent tags', () => {
        const taggedResources = [
          'LambdaExecutionRole',
          'LambdaLogGroup',
          'TapStackFunction',
          'TapStackApi',
          'ApiStage',
          'ApiLogGroup',
          'ApiGatewayCloudWatchRole',
          'WebACL',
        ];

        taggedResources.forEach(resourceName => {
          const resource = template.Resources[resourceName];
          if (resource.Properties.Tags) {
            const environmentTag = resource.Properties.Tags.find(
              (tag: any) => tag.Key === 'Environment'
            );
            const projectTag = resource.Properties.Tags.find(
              (tag: any) => tag.Key === 'Project'
            );

            expect(environmentTag).toBeDefined();
            expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
            expect(projectTag).toBeDefined();
            expect(projectTag.Value).toBe('TapStack');
          }
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiInvokeUrl',
        'WebACLArn',
        'LambdaFunctionArn',
        'ApiGatewayRestApiId',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiInvokeUrl output should be correct', () => {
      const output = template.Outputs.ApiInvokeUrl;
      expect(output.Description).toBe('API Gateway invoke URL');
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://${TapStackApi}.execute-api.${AWS::Region}.amazonaws.com/${StageName}',
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApiInvokeUrl',
      });
    });

    test('WebACLArn output should be correct', () => {
      const output = template.Outputs.WebACLArn;
      expect(output.Description).toBe('WAF Web ACL ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WebACL', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-WebACLArn',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Lambda function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TapStackFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaFunctionArn',
      });
    });

    test('ApiGatewayRestApiId output should be correct', () => {
      const output = template.Outputs.ApiGatewayRestApiId;
      expect(output.Description).toBe('API Gateway REST API ID');
      expect(output.Value).toEqual({ Ref: 'TapStackApi' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApiGatewayRestApiId',
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
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
      expect(template.Conditions).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(14); // All serverless stack resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // All required parameters
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6); // All serverless stack outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const resourcesWithEnvSuffix = [
        {
          name: 'LambdaExecutionRole',
          property: 'RoleName',
          expected: 'TapStack-LambdaRole-${EnvironmentSuffix}',
        },
        {
          name: 'TapStackFunction',
          property: 'FunctionName',
          expected: 'TapStack-Function-${EnvironmentSuffix}',
        },
        {
          name: 'TapStackApi',
          property: 'Name',
          expected: 'TapStack-API-${EnvironmentSuffix}',
        },
        {
          name: 'WebACL',
          property: 'Name',
          expected: 'TapStack-WebACL-${EnvironmentSuffix}',
        },
      ];

      resourcesWithEnvSuffix.forEach(({ name, property, expected }) => {
        const resource = template.Resources[name];
        expect(resource.Properties[property]).toEqual({
          'Fn::Sub': expected,
        });
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Security Configuration', () => {
    test('Lambda function should have environment variables for secrets', () => {
      const func = template.Resources.TapStackFunction;
      expect(func.Properties.Environment.Variables.SECRET_ARN).toEqual({
        Ref: 'SecretsManagerSecretArn',
      });
      expect(func.Properties.Environment.Variables.ENVIRONMENT).toEqual({
        Ref: 'EnvironmentSuffix',
      });
    });

    test('Lambda execution role should have conditional Secrets Manager permissions', () => {
      const role = template.Resources.LambdaExecutionRole;

      // The Policies property is now conditional using CloudFormation !If
      expect(role.Properties.Policies).toBeDefined();

      // Check that it's a CloudFormation !If condition
      expect(role.Properties.Policies['Fn::If']).toBeDefined();
      expect(role.Properties.Policies['Fn::If'][0]).toBe('HasSecretsManager');

      // Check the policy structure when condition is true
      const policiesWhenTrue = role.Properties.Policies['Fn::If'][1];
      expect(Array.isArray(policiesWhenTrue)).toBe(true);
      expect(policiesWhenTrue[0].PolicyName).toBe('SecretsManagerAccess');
      expect(policiesWhenTrue[0].PolicyDocument.Statement[0].Action).toContain(
        'secretsmanager:GetSecretValue'
      );

      // Check that when condition is false, it returns AWS::NoValue
      const policiesWhenFalse = role.Properties.Policies['Fn::If'][2];
      expect(policiesWhenFalse).toEqual({ Ref: 'AWS::NoValue' });
    });

    test('WAF should be properly associated with API Gateway', () => {
      const association = template.Resources.WebACLAssociation;
      expect(association.Properties.WebACLArn).toEqual({
        'Fn::GetAtt': ['WebACL', 'Arn'],
      });
    });
  });

  describe('Cleanup and Retention Policies', () => {
    test('resources should not have retention policies that prevent cleanup', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        // Check that no resource has Retain deletion policy
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        // Check that no resource has Retain update replace policy
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });

    test('log groups should have configurable retention', () => {
      const logGroups = ['LambdaLogGroup', 'ApiLogGroup'];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.RetentionInDays).toEqual({
          Ref: 'LogRetentionInDays',
        });
      });
    });
  });
});
