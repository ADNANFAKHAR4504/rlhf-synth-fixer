import fs from 'fs';
import path from 'path';

// const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unified DynamoDB Multi-Region', () => {
  let template: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeAll(() => {
    // Template should be in JSON format (converted from YAML using cfn-flip)
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
        'Unified DynamoDB table deployment for multi-region with configurable capacity settings'
      );
    });

    test('should have metadata section with interface configuration', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();

      const cfnInterface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(cfnInterface.ParameterGroups).toBeDefined();
      expect(cfnInterface.ParameterLabels).toBeDefined();
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['EnvironmentSuffix'];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
    });
  });

  describe('Conditions', () => {
    test('should have all required conditions', () => {
      const expectedConditions = [
        'IsWest1',
        'IsWest2',
        'EnableStreams',
        'HasCrossRegionReference',
      ];

      expectedConditions.forEach(conditionName => {
        expect(template.Conditions[conditionName]).toBeDefined();
      });
    });

    test('IsWest1 condition should check for us-west-1', () => {
      const condition = template.Conditions.IsWest1;
      expect(condition['Fn::Equals']).toEqual([
        { Ref: 'AWS::Region' },
        'us-west-1',
      ]);
    });

    test('IsWest2 condition should check for us-west-2', () => {
      const condition = template.Conditions.IsWest2;
      expect(condition['Fn::Equals']).toEqual([
        { Ref: 'AWS::Region' },
        'us-west-2',
      ]);
    });

    test('EnableStreams condition should be same as IsWest2', () => {
      const condition = template.Conditions.EnableStreams;
      expect(condition['Fn::Equals']).toEqual([
        { Ref: 'AWS::Region' },
        'us-west-2',
      ]);
    });

    test('HasCrossRegionReference condition should be same as IsWest2', () => {
      const condition = template.Conditions.HasCrossRegionReference;
      expect(condition['Fn::Equals']).toEqual([
        { Ref: 'AWS::Region' },
        'us-west-2',
      ]);
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'DynamoDBTable',
        'DynamoDBAccessRole',
        'CrossRegionLambdaFunction',
        'LambdaExecutionRole',
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    describe('DynamoDBTable Resource', () => {
      let dynamoTable: any; // eslint-disable-line @typescript-eslint/no-explicit-any

      beforeEach(() => {
        dynamoTable = template.Resources.DynamoDBTable;
      });

      test('should be of correct type', () => {
        expect(dynamoTable.Type).toBe('AWS::DynamoDB::Table');
      });

      test('should have correct table name with conditional suffix', () => {
        expect(dynamoTable.Properties.TableName).toEqual({
          'Fn::Sub': [
            '${ApplicationName}-${EnvironmentSuffix}-${RegionSuffix}-table',
            {
              RegionSuffix: {
                'Fn::If': ['IsWest1', 'west1', 'west2'],
              },
            },
          ],
        });
      });

      test('should have provisioned billing mode', () => {
        expect(dynamoTable.Properties.BillingMode).toBe('PROVISIONED');
      });

          test('should have conditional capacity settings', () => {
      const throughput = dynamoTable.Properties.ProvisionedThroughput;
      expect(throughput.ReadCapacityUnits).toEqual({
        'Fn::If': ['IsWest1', 5, { Ref: 'ReadCapacityUnits' }],
      });
      expect(throughput.WriteCapacityUnits).toEqual({
        'Fn::If': ['IsWest1', 5, { Ref: 'WriteCapacityUnits' }],
      });
    });

      test('should have correct attribute definitions', () => {
        const attrs = dynamoTable.Properties.AttributeDefinitions;
        expect(attrs).toContainEqual({
          AttributeName: 'PrimaryKey',
          AttributeType: 'S',
        });
        expect(attrs).toContainEqual({
          AttributeName: 'SortKey',
          AttributeType: 'S',
        });
      });

      test('should have correct key schema', () => {
        const keySchema = dynamoTable.Properties.KeySchema;
        expect(keySchema).toEqual([
          { AttributeName: 'PrimaryKey', KeyType: 'HASH' },
          { AttributeName: 'SortKey', KeyType: 'RANGE' },
        ]);
      });

      test('should have conditional GSI for us-west-2', () => {
        const gsi = dynamoTable.Properties.GlobalSecondaryIndexes;
        expect(gsi['Fn::If']).toBeDefined();
        expect(gsi['Fn::If'][0]).toBe('IsWest2');
      });

      test('should have point-in-time recovery enabled', () => {
        expect(
          dynamoTable.Properties.PointInTimeRecoverySpecification
            .PointInTimeRecoveryEnabled
        ).toBe(true);
      });

      test('should have server-side encryption enabled', () => {
        expect(dynamoTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      });

      test('should have conditional stream specification', () => {
        const streamSpec = dynamoTable.Properties.StreamSpecification;
        expect(streamSpec['Fn::If']).toBeDefined();
        expect(streamSpec['Fn::If'][0]).toBe('EnableStreams');
      });

      test('should have comprehensive tags', () => {
        const tags = dynamoTable.Properties.Tags;
        expect(tags).toContainEqual({
          Key: 'Environment',
          Value: { Ref: 'EnvironmentSuffix' },
        });
        expect(tags).toContainEqual({
          Key: 'Application',
          Value: { Ref: 'ApplicationName' },
        });
        expect(tags).toContainEqual({
          Key: 'ManagedBy',
          Value: 'CloudFormation',
        });
      });
    });

    describe('DynamoDBAccessRole Resource', () => {
      let iamRole: any; // eslint-disable-line @typescript-eslint/no-explicit-any

      beforeEach(() => {
        iamRole = template.Resources.DynamoDBAccessRole;
      });

      test('should be of correct type', () => {
        expect(iamRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have correct assume role policy', () => {
        const policy = iamRole.Properties.AssumeRolePolicyDocument;
        expect(policy.Version).toBe('2012-10-17');
        expect(policy.Statement[0].Effect).toBe('Allow');
        expect(policy.Statement[0].Principal.Service).toBe(
          'lambda.amazonaws.com'
        );
        expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have DynamoDB access policy', () => {
        const policies = iamRole.Properties.Policies;
        expect(policies).toHaveLength(1);
        expect(policies[0].PolicyName).toBe('DynamoDBAccess');

        const statement = policies[0].PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('dynamodb:GetItem');
        expect(statement.Action).toContain('dynamodb:PutItem');
        expect(statement.Action).toContain('dynamodb:Query');
        expect(statement.Action).toContain('dynamodb:Scan');
      });
    });

    describe('CrossRegionLambdaFunction Resource', () => {
      let lambdaFunction: any; // eslint-disable-line @typescript-eslint/no-explicit-any

      beforeEach(() => {
        lambdaFunction = template.Resources.CrossRegionLambdaFunction;
      });

      test('should be of correct type', () => {
        expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
      });

      test('should have IsWest2 condition', () => {
        expect(lambdaFunction.Condition).toBe('IsWest2');
      });

      test('should have correct runtime and handler', () => {
        expect(lambdaFunction.Properties.Runtime).toBe('python3.9');
        expect(lambdaFunction.Properties.Handler).toBe('index.lambda_handler');
      });

      test('should have environment variables for cross-region access', () => {
        const envVars = lambdaFunction.Properties.Environment.Variables;
        expect(envVars.LOCAL_TABLE_NAME).toEqual({ Ref: 'DynamoDBTable' });
        expect(envVars.LOCAL_TABLE_ARN).toEqual({
          'Fn::GetAtt': ['DynamoDBTable', 'Arn'],
        });
        expect(envVars.REMOTE_TABLE_NAME['Fn::If']).toBeDefined();
        expect(envVars.REMOTE_TABLE_NAME['Fn::If'][0]).toBe('IsWest2');
        expect(envVars.REMOTE_TABLE_NAME['Fn::If'][1]['Fn::ImportValue']).toEqual({
          'Fn::Sub': 'TapStack${EnvironmentSuffix}-TableName',
        });
        expect(envVars.REMOTE_TABLE_NAME['Fn::If'][2]).toBe('no-remote-table');
      });

      test('should have inline code', () => {
        expect(lambdaFunction.Properties.Code.ZipFile).toBeDefined();
        expect(lambdaFunction.Properties.Code.ZipFile).toContain(
          'lambda_handler'
        );
      });
    });

    describe('LambdaExecutionRole Resource', () => {
      let lambdaRole: any; // eslint-disable-line @typescript-eslint/no-explicit-any

      beforeEach(() => {
        lambdaRole = template.Resources.LambdaExecutionRole;
      });

      test('should be of correct type', () => {
        expect(lambdaRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have IsWest2 condition', () => {
        expect(lambdaRole.Condition).toBe('IsWest2');
      });

      test('should have managed policy for basic execution', () => {
        expect(lambdaRole.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });

      test('should have DynamoDB cross-region access policy', () => {
        const policies = lambdaRole.Properties.Policies;
        expect(policies).toHaveLength(1);
        expect(policies[0].PolicyName).toBe('DynamoDBCrossRegionAccess');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TableName',
        'TableArn',
        'TableStreamArn',
        'GSIArn',
        'IAMRoleArn',
        'CrossRegionConfig',
        'LambdaFunctionArn',
        'CapacityConfiguration',
        'TableDetails',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TableName output should be correct', () => {
      const output = template.Outputs.TableName;
      expect(output.Description).toBe('DynamoDB Table Name');
      expect(output.Value).toEqual({ Ref: 'DynamoDBTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TableName',
      });
    });

    test('TableArn output should be correct', () => {
      const output = template.Outputs.TableArn;
      expect(output.Description).toBe('DynamoDB Table ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DynamoDBTable', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TableArn',
      });
    });

    test('TableStreamArn output should have EnableStreams condition', () => {
      const output = template.Outputs.TableStreamArn;
      expect(output.Condition).toBe('EnableStreams');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DynamoDBTable', 'StreamArn'],
      });
    });

    test('GSIArn output should have IsWest2 condition', () => {
      const output = template.Outputs.GSIArn;
      expect(output.Condition).toBe('IsWest2');
      expect(output.Value).toEqual({
        'Fn::Sub': '${DynamoDBTable.Arn}/index/GSI1',
      });
    });

    test('CrossRegionConfig output should have HasCrossRegionReference condition', () => {
      const output = template.Outputs.CrossRegionConfig;
      expect(output.Condition).toBe('HasCrossRegionReference');
      expect(output.Value['Fn::Sub']).toBeDefined();
    });

    test('LambdaFunctionArn output should have IsWest2 condition', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Condition).toBe('IsWest2');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['CrossRegionLambdaFunction', 'Arn'],
      });
    });

    test('CapacityConfiguration output should have conditional values', () => {
      const output = template.Outputs.CapacityConfiguration;
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Value['Fn::If'][0]).toBe('IsWest1');
      expect(output.Value['Fn::If'][1]).toBe('Read: 5, Write: 5 (Fixed)');
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

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(4); // DynamoDBTable, DynamoDBAccessRole, CrossRegionLambdaFunction, LambdaExecutionRole
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // EnvironmentSuffix, ApplicationName, ReadCapacityUnits, WriteCapacityUnits
    });

    test('should have correct condition count', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(4); // IsWest1, IsWest2, EnableStreams, HasCrossRegionReference
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13); // 9 original outputs + 4 placeholder VPC outputs for post-deployment fix script
    });
  });

  describe('CloudFormation Intrinsic Functions Usage', () => {
    test('should use Ref function correctly', () => {
      // Check in DynamoDB table capacity configuration
      const dynamoTable = template.Resources.DynamoDBTable;
      const readCapacity =
        dynamoTable.Properties.ProvisionedThroughput.ReadCapacityUnits;

      expect(readCapacity['Fn::If'][2]).toEqual({ Ref: 'ReadCapacityUnits' });
    });

    test('should use Fn::GetAtt correctly', () => {
      // Check in outputs
      const tableArnOutput = template.Outputs.TableArn;
      expect(tableArnOutput.Value).toEqual({
        'Fn::GetAtt': ['DynamoDBTable', 'Arn'],
      });
    });

    test('should use Fn::Sub correctly', () => {
      // Check in table name
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(dynamoTable.Properties.TableName['Fn::Sub']).toBeDefined();
    });

    test('should use Fn::Join correctly', () => {
      // Check in outputs
      const tableDetails = template.Outputs.TableDetails;
      expect(tableDetails.Value['Fn::Join']).toBeDefined();
    });

    test('should use Fn::ImportValue correctly', () => {
      // Check in Lambda environment variables (now conditional)
      const lambdaFunction = template.Resources.CrossRegionLambdaFunction;
      const remoteTableName =
        lambdaFunction.Properties.Environment.Variables.REMOTE_TABLE_NAME;
      expect(remoteTableName['Fn::If']).toBeDefined();
      expect(remoteTableName['Fn::If'][1]['Fn::ImportValue']).toBeDefined();
    });

    test('should use Fn::If correctly for conditional resources', () => {
      // Check in DynamoDB table GSI
      const dynamoTable = template.Resources.DynamoDBTable;
      const gsi = dynamoTable.Properties.GlobalSecondaryIndexes;
      expect(gsi['Fn::If']).toBeDefined();
      expect(gsi['Fn::If'][0]).toBe('IsWest2');
    });

    test('should use Fn::Equals in conditions correctly', () => {
      // Check all conditions use Fn::Equals
      Object.keys(template.Conditions).forEach(conditionName => {
        const condition = template.Conditions[conditionName];
        expect(condition['Fn::Equals']).toBeDefined();
      });
    });
  });

  describe('Cross-Region Configuration', () => {
    test('should have ImportValue references for cross-region access', () => {
      const lambdaFunction = template.Resources.CrossRegionLambdaFunction;
      const envVars = lambdaFunction.Properties.Environment.Variables;

      expect(envVars.REMOTE_TABLE_NAME['Fn::If']).toBeDefined();
      expect(envVars.REMOTE_TABLE_NAME['Fn::If'][1]['Fn::ImportValue']).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-TableName',
      });
      expect(envVars.REMOTE_TABLE_ARN['Fn::If']).toBeDefined();
      expect(envVars.REMOTE_TABLE_ARN['Fn::If'][1]['Fn::ImportValue']).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-TableArn',
      });
    });

    test('should have export names for cross-stack references', () => {
      // Only check outputs that have Export properties (placeholder outputs don't have exports)
      const outputsWithExports = Object.keys(template.Outputs).filter(outputKey => {
        return template.Outputs[outputKey].Export !== undefined;
      });
      
      expect(outputsWithExports.length).toBeGreaterThan(0);
      
      outputsWithExports.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Region-Specific Behavior', () => {
    test('should have different configurations for different regions', () => {
      const dynamoTable = template.Resources.DynamoDBTable;

      // Table name should have region suffix
      expect(
        dynamoTable.Properties.TableName['Fn::Sub'][1].RegionSuffix['Fn::If']
      ).toEqual(['IsWest1', 'west1', 'west2']);

      // Capacity should be different for each region
      expect(
        dynamoTable.Properties.ProvisionedThroughput.ReadCapacityUnits['Fn::If']
      ).toEqual(['IsWest1', 5, { Ref: 'ReadCapacityUnits' }]);
    });

    test('should have conditional resources only for us-west-2', () => {
      expect(template.Resources.CrossRegionLambdaFunction.Condition).toBe(
        'IsWest2'
      );
      expect(template.Resources.LambdaExecutionRole.Condition).toBe('IsWest2');
    });

    test('should have conditional outputs only for us-west-2', () => {
      expect(template.Outputs.TableStreamArn.Condition).toBe('EnableStreams');
      expect(template.Outputs.GSIArn.Condition).toBe('IsWest2');
      expect(template.Outputs.LambdaFunctionArn.Condition).toBe('IsWest2');
      expect(template.Outputs.CrossRegionConfig.Condition).toBe(
        'HasCrossRegionReference'
      );
    });
  });
});
