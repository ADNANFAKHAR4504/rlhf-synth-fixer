import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // 1. Validate Parameters
  test('Parameters should be correctly defined with expected defaults and allowed values', () => {
    expect(template.Parameters.Environment.Type).toBe('String');
    expect(template.Parameters.Environment.Default).toBe('development');
    expect(template.Parameters.Environment.AllowedValues).toEqual(['development', 'testing', 'production']);

    expect(template.Parameters.ApplicationName.Type).toBe('String');
    expect(template.Parameters.ApplicationName.Default).toBe('webapp');
  });

  // 2. Validate Mappings presence and keys
  test('Mappings "EnvironmentConfig" should contain all environments with required keys', () => {
    const mapping = template.Mappings.EnvironmentConfig;
    expect(mapping).toBeDefined();

    ['development', 'testing', 'production'].forEach(env => {
      expect(mapping[env]).toHaveProperty('LogRetention');
      expect(mapping[env]).toHaveProperty('DynamoDBBillingMode');
      expect(mapping[env]).toHaveProperty('S3StorageClass');
    });
  });

  // 3. Validate Conditions are correct
  test('Conditions for environment checks should be defined properly', () => {
    const cond = template.Conditions;

    expect(cond.IsProductionEnvironment).toEqual({
      'Fn::Equals': [{ Ref: 'Environment' }, 'production'],
    });
  });

  // 4. Validate Resources
  test('EnvironmentS3Bucket resource should have correct properties', () => {
    const bucket = template.Resources.EnvironmentS3Bucket;
    expect(bucket.Type).toBe('AWS::S3::Bucket');

    const props = bucket.Properties;
    expect(props.BucketName['Fn::Sub']).toMatch(/\${ApplicationName}-\${Environment}-\${AWS::AccountId}-\${AWS::Region}/);

    expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

    expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(props.VersioningConfiguration.Status).toBe('Enabled');

    // Check LifecycleConfiguration rules for transition
    const transitionRule = props.LifecycleConfiguration.Rules.find((rule: { Id: string; }) => rule.Id === 'TransitionToIA');
    expect(transitionRule).toBeDefined();
    expect(transitionRule.Status).toBe('Enabled');
    expect(transitionRule.Transitions[0].StorageClass['Fn::FindInMap'][0]).toBe('EnvironmentConfig');
  });

  test('SharedConfigBucket should have Condition "IsProductionEnvironment"', () => {
    const sharedBucket = template.Resources.SharedConfigBucket;
    expect(sharedBucket.Condition).toBe('IsProductionEnvironment');
  });

  test('EnvironmentDynamoDBTable has correct key schema and provisioned throughput conditional on environment', () => {
    const dynamo = template.Resources.EnvironmentDynamoDBTable;
    expect(dynamo.Type).toBe('AWS::DynamoDB::Table');

    const { KeySchema, AttributeDefinitions } = dynamo.Properties;

    expect(KeySchema).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
        expect.objectContaining({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
      ])
    );

    expect(AttributeDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ AttributeName: 'id', AttributeType: 'S' }),
        expect.objectContaining({ AttributeName: 'timestamp', AttributeType: 'N' }),
      ])
    );

    // ProvisionedThroughput should be conditional
    expect(dynamo.Properties.ProvisionedThroughput).toEqual({
      'Fn::If': [
        'IsProductionEnvironment',
        { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
        { Ref: 'AWS::NoValue' },
      ],
    });
  });

  test('IAM Role has correct AssumeRolePolicyDocument and ManagedPolicyArns', () => {
    const role = template.Resources.ApplicationExecutionRole;
    expect(role.Type).toBe('AWS::IAM::Role');

    const assumePolicy = role.Properties.AssumeRolePolicyDocument.Statement[0];
    expect(assumePolicy.Effect).toBe('Allow');
    expect(assumePolicy.Principal.Service).toEqual(
      expect.arrayContaining(['ec2.amazonaws.com', 'lambda.amazonaws.com', 'ecs-tasks.amazonaws.com'])
    );

    expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy');
  });

  test('IAM Policies are attached to the ApplicationExecutionRole', () => {
    const s3Policy = template.Resources.EnvironmentS3Policy;
    expect(s3Policy.Properties.Roles).toEqual([ { Ref: 'ApplicationExecutionRole' } ]);

    const dynamoPolicy = template.Resources.EnvironmentDynamoDBPolicy;
    expect(dynamoPolicy.Properties.Roles).toEqual([ { Ref: 'ApplicationExecutionRole' } ]);

    const cwPolicy = template.Resources.CloudWatchLogsPolicy;
    expect(cwPolicy.Properties.Roles).toEqual([ { Ref: 'ApplicationExecutionRole' } ]);

    const ssmPolicy = template.Resources.SSMParameterPolicy;
    expect(ssmPolicy.Properties.Roles).toEqual([ { Ref: 'ApplicationExecutionRole' } ]);
  });

  test('CloudWatch LogGroups have correct RetentionInDays from Mappings', () => {
    ['ApplicationLogGroup', 'PerformanceLogGroup', 'ResourceUtilizationLogGroup'].forEach(logGroupName => {
      const logGroup = template.Resources[logGroupName];
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays['Fn::FindInMap']).toEqual(['EnvironmentConfig', { Ref: 'Environment' }, 'LogRetention']);
    });
  });

  test('SSM Parameters use correct KeyId and value formatting', () => {
    const dbParam = template.Resources.DatabaseConnectionParameter;
    expect(dbParam.Properties.Type).toBe('String');
    expect(dbParam.Properties.Name['Fn::Sub']).toMatch(/\/\$\{ApplicationName\}\/\$\{Environment\}\/database\/connection-string/);

    const apiParam = template.Resources.APIConfigParameter;
    expect(apiParam.Properties.Type).toBe('String');
    expect(apiParam.Properties.Value['Fn::Sub']).toBeDefined();

    const sharedConfigParam = template.Resources.SharedConfigParameter;
    expect(sharedConfigParam.Properties.Value['Fn::If'][0]).toBe('IsProductionEnvironment');
  });

  // 5. Validate Outputs
  test('Outputs should reference correct resources and conditional values', () => {
    const outputs = template.Outputs;

    expect(outputs.EnvironmentS3Bucket.Value.Ref).toBe('EnvironmentS3Bucket');

    expect(outputs.SharedConfigBucket.Value['Fn::If'][0]).toBe('IsProductionEnvironment');

    expect(outputs.DynamoDBTableName.Value.Ref).toBe('EnvironmentDynamoDBTable');

    expect(outputs.ApplicationExecutionRoleArn.Value['Fn::GetAtt'][0]).toBe('ApplicationExecutionRole');

    expect(outputs.ApplicationLogGroupName.Value.Ref).toBe('ApplicationLogGroup');

    expect(outputs.SSMParameterPrefix.Value['Fn::Sub']).toMatch(/\/\$\{ApplicationName\}\/\$\{Environment\}\//);

    expect(outputs.InstanceProfileArn.Value['Fn::GetAtt'][0]).toBe('ApplicationInstanceProfile');
  });
});
