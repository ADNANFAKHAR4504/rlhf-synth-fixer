import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests (73 total)', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // 1-4 Template basics
  describe('Template Structure', () => {
    test('01 - has valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('02 - has a description', () => {
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(10);
    });

    test('03 - has Parameters, Resources, Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('04 - has Conditions section with UseVPC', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.UseVPC).toBeDefined();
      expect(template.Conditions.UseVPC['Fn::Equals']).toBeDefined();
    });
  });

  // 5-14 Parameters
  describe('Parameters', () => {
    test('05 - EnvironmentSuffix parameter exists', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('06 - EnvironmentSuffix parameter type', () => {
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('07 - EnvironmentSuffix default is dev', () => {
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('08 - EnvironmentSuffix description set', () => {
      expect(template.Parameters.EnvironmentSuffix.Description).toContain(
        'Environment suffix'
      );
    });

    test('09 - EnvironmentSuffix allowed pattern', () => {
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe(
        '^[a-zA-Z0-9]+$'
      );
    });

    test('10 - EnableVPC parameter exists', () => {
      expect(template.Parameters.EnableVPC).toBeDefined();
    });

    test('11 - EnableVPC default false', () => {
      expect(template.Parameters.EnableVPC.Default).toBe('false');
    });

    test('12 - EnableVPC allowed values', () => {
      expect(template.Parameters.EnableVPC.AllowedValues).toEqual([
        'true',
        'false',
      ]);
    });

    test('13 - VpcId parameter default placeholder', () => {
      expect(template.Parameters.VpcId.Default).toBe('vpc-00000000');
    });

    test('14 - PrivateSubnetIds parameter default placeholders', () => {
      expect(template.Parameters.PrivateSubnetIds.Default).toBe(
        'subnet-00000000,subnet-00000001'
      );
    });
  });

  // 15-30 Resources existence
  describe('Resources - existence', () => {
    const expectedResources = [
      'DynamoDBTable',
      'LambdaSecurityGroup',
      'LambdaExecutionRole',
      'CreateFunction',
      'ReadFunction',
      'UpdateFunction',
      'DeleteFunction',
      'ApiGateway',
      'ItemsResource',
      'ItemResource',
      'PostMethod',
      'GetItemsMethod',
      'GetItemMethod',
      'PutMethod',
      'DeleteMethod',
      'CreateFunctionPermission',
      'ReadFunctionPermission',
      'UpdateFunctionPermission',
      'DeleteFunctionPermission',
      'ApiDeployment',
    ];

    expectedResources.forEach((r, i) => {
      test(`${15 + i} - resource exists: ${r}`, () => {
        expect(template.Resources[r]).toBeDefined();
      });
    });
  });

  // 31-43 DynamoDB table specifics
  describe('DynamoDBTable', () => {
    test('31 - type is AWS::DynamoDB::Table', () => {
      expect(template.Resources.DynamoDBTable.Type).toBe(
        'AWS::DynamoDB::Table'
      );
    });

    test('32 - Deletion policies are Delete', () => {
      const r = template.Resources.DynamoDBTable;
      expect(r.DeletionPolicy).toBe('Delete');
      expect(r.UpdateReplacePolicy).toBe('Delete');
    });

    test('33 - billing mode PAY_PER_REQUEST', () => {
      expect(template.Resources.DynamoDBTable.Properties.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('34 - SSE enabled', () => {
      expect(
        template.Resources.DynamoDBTable.Properties.SSESpecification.SSEEnabled
      ).toBe(true);
    });

    test('35 - PITR enabled', () => {
      expect(
        template.Resources.DynamoDBTable.Properties
          .PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('36 - attribute definitions include id:S', () => {
      const defs =
        template.Resources.DynamoDBTable.Properties.AttributeDefinitions;
      expect(defs).toEqual([{ AttributeName: 'id', AttributeType: 'S' }]);
    });

    test('37 - key schema HASH id', () => {
      const ks = template.Resources.DynamoDBTable.Properties.KeySchema;
      expect(ks).toEqual([{ AttributeName: 'id', KeyType: 'HASH' }]);
    });

    test('38 - table name uses EnvironmentSuffix', () => {
      const tn = template.Resources.DynamoDBTable.Properties.TableName;
      expect(tn['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('39 - tags include Application', () => {
      const tags = template.Resources.DynamoDBTable.Properties.Tags;
      const application = tags.find((t: any) => t.Key === 'Application');
      expect(application).toBeDefined();
    });

    test('40 - tags include Environment (suffix)', () => {
      const tags = template.Resources.DynamoDBTable.Properties.Tags;
      const env = tags.find((t: any) => t.Key === 'Environment');
      expect(env).toBeDefined();
      expect(env.Value.Ref || env.Value).toBeDefined();
    });

    test('41 - tags include Name', () => {
      const tags = template.Resources.DynamoDBTable.Properties.Tags;
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });
  });

  // 44-50 IAM role specifics
  describe('LambdaExecutionRole', () => {
    test('44 - type is AWS::IAM::Role', () => {
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('45 - role is not explicitly named (no RoleName)', () => {
      expect(
        template.Resources.LambdaExecutionRole.Properties.RoleName
      ).toBeUndefined();
    });

    test('46 - has VPCAccess managed policy', () => {
      const mp =
        template.Resources.LambdaExecutionRole.Properties.ManagedPolicyArns;
      expect(mp).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('47 - has DynamoDBAccess inline policy', () => {
      const pol =
        template.Resources.LambdaExecutionRole.Properties.Policies.find(
          (p: any) => p.PolicyName === 'DynamoDBAccess'
        );
      expect(pol).toBeDefined();
    });

    test('48 - logs policy allows basic log actions', () => {
      const logs =
        template.Resources.LambdaExecutionRole.Properties.Policies.find(
          (p: any) => p.PolicyName === 'CloudWatchLogs'
        );
      const actions = logs.PolicyDocument.Statement[0].Action;
      expect(actions).toEqual(
        expect.arrayContaining([
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ])
      );
    });

    test('49 - logs policy resource includes suffix in log group name', () => {
      const logs =
        template.Resources.LambdaExecutionRole.Properties.Policies.find(
          (p: any) => p.PolicyName === 'CloudWatchLogs'
        );
      const res = logs.PolicyDocument.Statement[0].Resource['Fn::Sub'];
      expect(res).toContain('${EnvironmentSuffix}');
    });
  });

  // 51-61 Lambda functions
  describe('Lambda Functions', () => {
    const fns = [
      'CreateFunction',
      'ReadFunction',
      'UpdateFunction',
      'DeleteFunction',
    ];
    fns.forEach((fnName, idx) => {
      test(`${51 + idx * 3} - ${fnName} name contains suffix`, () => {
        const nameSub =
          template.Resources[fnName].Properties.FunctionName['Fn::Sub'];
        expect(nameSub).toContain('${EnvironmentSuffix}');
      });

      test(`${52 + idx * 3} - ${fnName} runtime is python3.12`, () => {
        expect(template.Resources[fnName].Properties.Runtime).toBe(
          'python3.12'
        );
      });

      test(`${53 + idx * 3} - ${fnName} VpcConfig is conditional (Fn::If)`, () => {
        const vc = template.Resources[fnName].Properties.VpcConfig;
        expect(vc['Fn::If']).toBeDefined();
        expect(Array.isArray(vc['Fn::If'])).toBe(true);
        expect(vc['Fn::If'].length).toBe(3);
      });
    });
  });

  // 62-66 API Gateway
  describe('API Gateway', () => {
    test('62 - RestApi name contains suffix', () => {
      expect(
        template.Resources.ApiGateway.Properties.Name['Fn::Sub']
      ).toContain('${EnvironmentSuffix}');
    });

    test('63 - ItemsResource exists with path part items', () => {
      expect(template.Resources.ItemsResource.Properties.PathPart).toBe(
        'items'
      );
    });

    test('64 - ItemResource path part {id}', () => {
      expect(template.Resources.ItemResource.Properties.PathPart).toBe('{id}');
    });

    test('65 - Methods configured (POST, GETs, PUT, DELETE)', () => {
      [
        'PostMethod',
        'GetItemsMethod',
        'GetItemMethod',
        'PutMethod',
        'DeleteMethod',
      ].forEach(key => expect(template.Resources[key]).toBeDefined());
    });

    test('66 - ApiDeployment for stage prod', () => {
      expect(template.Resources.ApiDeployment.Properties.StageName).toBe(
        'prod'
      );
    });
  });

  // 67-69 Lambda permissions
  describe('Lambda Permissions', () => {
    test('67 - CreateFunction permission present', () => {
      expect(
        template.Resources.CreateFunctionPermission.Properties.FunctionName.Ref
      ).toBe('CreateFunction');
    });
    test('68 - ReadFunction permission present', () => {
      expect(
        template.Resources.ReadFunctionPermission.Properties.FunctionName.Ref
      ).toBe('ReadFunction');
    });
    test('69 - Update/Delete permissions present', () => {
      expect(template.Resources.UpdateFunctionPermission).toBeDefined();
      expect(template.Resources.DeleteFunctionPermission).toBeDefined();
    });
  });

  // 70-73 Outputs
  describe('Outputs', () => {
    test('70 - includes ApiGatewayUrl', () => {
      expect(template.Outputs.ApiGatewayUrl).toBeDefined();
      expect(template.Outputs.ApiGatewayUrl.Export.Name['Fn::Sub']).toContain(
        '${AWS::StackName}-'
      );
    });

    test('71 - includes DynamoDBTableName', () => {
      expect(template.Outputs.DynamoDBTableName.Value.Ref).toBe(
        'DynamoDBTable'
      );
    });

    test('72 - includes DynamoDBTableArn', () => {
      expect(template.Outputs.DynamoDBTableArn.Value['Fn::GetAtt']).toEqual([
        'DynamoDBTable',
        'Arn',
      ]);
    });

    test('73 - includes EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix.Value.Ref).toBe(
        'EnvironmentSuffix'
      );
    });
  });
});
