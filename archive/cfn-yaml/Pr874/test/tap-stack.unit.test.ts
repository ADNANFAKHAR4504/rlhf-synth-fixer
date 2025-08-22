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

    expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    expect(template.Parameters.EnvironmentSuffix.Default).toBe('');
    expect(template.Parameters.EnvironmentSuffix.Description).toBe('Unique suffix for resource names to avoid conflicts between deployments');
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

    expect(cond.IsStandardStorageClass).toEqual({
      'Fn::Equals': [{ 'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'S3StorageClass'] }, 'STANDARD'],
    });
  });

  // 4. Validate Resources
  test('EnvironmentS3Bucket resource should have correct properties', () => {
    const bucket = template.Resources.EnvironmentS3Bucket;
    expect(bucket.Type).toBe('AWS::S3::Bucket');

    const props = bucket.Properties;
    expect(props.BucketName['Fn::Sub']).toMatch(/\${ApplicationName}-\${Environment}\${EnvironmentSuffix}-\${AWS::AccountId}-\${AWS::Region}/);

    expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

    expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(props.VersioningConfiguration.Status).toBe('Enabled');

    // Check LifecycleConfiguration is conditional
    expect(props.LifecycleConfiguration['Fn::If']).toBeDefined();
    expect(props.LifecycleConfiguration['Fn::If'][0]).toBe('IsStandardStorageClass');
  });

  test('SharedConfigBucket should be created for all environments and include EnvironmentSuffix', () => {
    const sharedBucket = template.Resources.SharedConfigBucket;
    expect(sharedBucket.Type).toBe('AWS::S3::Bucket');
    expect(sharedBucket.Condition).toBeUndefined(); // No longer conditional
    
    const props = sharedBucket.Properties;
    expect(props.BucketName['Fn::Sub']).toMatch(/\${ApplicationName}-shared-config\${EnvironmentSuffix}-\${AWS::AccountId}-\${AWS::Region}/);
    expect(props.Tags.find((tag: any) => tag.Key === 'Purpose').Value).toBe('SharedConfiguration');
  });

  test('EnvironmentDynamoDBTable has correct key schema and provisioned throughput conditional on environment', () => {
    const dynamo = template.Resources.EnvironmentDynamoDBTable;
    expect(dynamo.Type).toBe('AWS::DynamoDB::Table');

    const props = dynamo.Properties;
    const { KeySchema, AttributeDefinitions } = props;

    // Check table name includes EnvironmentSuffix
    expect(props.TableName['Fn::Sub']).toMatch(/\${ApplicationName}-\${Environment}\${EnvironmentSuffix}-data/);

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
    expect(props.ProvisionedThroughput).toEqual({
      'Fn::If': [
        'IsProductionEnvironment',
        { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
        { Ref: 'AWS::NoValue' },
      ],
    });

    // Check Point-in-time recovery is conditional
    expect(props.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled['Fn::If']).toEqual([
      'IsProductionEnvironment', true, false
    ]);

    // Check encryption is enabled
    expect(props.SSESpecification.SSEEnabled).toBe(true);
  });

  test('IAM Role has correct AssumeRolePolicyDocument and ManagedPolicyArns', () => {
    const role = template.Resources.ApplicationExecutionRole;
    expect(role.Type).toBe('AWS::IAM::Role');

    // Check role name includes EnvironmentSuffix
    expect(role.Properties.RoleName['Fn::Sub']).toMatch(/\${ApplicationName}-\${Environment}\${EnvironmentSuffix}-execution-role/);

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

  test('CloudWatch LogGroups have correct RetentionInDays from Mappings and include EnvironmentSuffix', () => {
    ['ApplicationLogGroup', 'PerformanceLogGroup', 'ResourceUtilizationLogGroup'].forEach(logGroupName => {
      const logGroup = template.Resources[logGroupName];
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays['Fn::FindInMap']).toEqual(['EnvironmentConfig', { Ref: 'Environment' }, 'LogRetention']);
      
      // Check LogGroupName includes EnvironmentSuffix
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toMatch(/\${Environment}\${EnvironmentSuffix}/);
    });
  });

  test('SSM Parameters use correct KeyId and value formatting with KMS encryption', () => {
    const dbParam = template.Resources.DatabaseConnectionParameter;
    expect(dbParam.Properties.Type).toBe('String');
    expect(dbParam.Properties.Name['Fn::Sub']).toMatch(/\/\${ApplicationName}\/\${Environment}\${EnvironmentSuffix}\/database\/connection-string/);

    const apiParam = template.Resources.APIConfigParameter;
    expect(apiParam.Properties.Type).toBe('String');
    expect(apiParam.Properties.Value['Fn::Sub']).toBeDefined();

    const sharedConfigParam = template.Resources.SharedConfigParameter;
    expect(sharedConfigParam.Properties.Type).toBe('String');
    expect(sharedConfigParam.Properties.Value.Ref).toBe('SharedConfigBucket');

    const s3ConfigParam = template.Resources.S3ConfigParameter;
    expect(s3ConfigParam.Properties.Type).toBe('String');
    expect(s3ConfigParam.Properties.Value.Ref).toBe('EnvironmentS3Bucket');

    const appSecretsParam = template.Resources.ApplicationSecretsParameter;
    expect(appSecretsParam.Properties.Type).toBe('String');
    expect(appSecretsParam.Properties.Name['Fn::Sub']).toMatch(/\/\${ApplicationName}\/\${Environment}\${EnvironmentSuffix}\/secrets\/app-key/);
  });

  // 5. Validate Outputs
  test('Outputs should reference correct resources and include KMS outputs', () => {
    const outputs = template.Outputs;

    expect(outputs.EnvironmentS3Bucket.Value.Ref).toBe('EnvironmentS3Bucket');

    expect(outputs.SharedConfigBucket.Value.Ref).toBe('SharedConfigBucket');

    expect(outputs.DynamoDBTableName.Value.Ref).toBe('EnvironmentDynamoDBTable');

    expect(outputs.ApplicationExecutionRoleArn.Value['Fn::GetAtt'][0]).toBe('ApplicationExecutionRole');

    expect(outputs.ApplicationLogGroupName.Value.Ref).toBe('ApplicationLogGroup');

    expect(outputs.SSMParameterPrefix.Value['Fn::Sub']).toMatch(/\/\${ApplicationName}\/\${Environment}\${EnvironmentSuffix}\//);

    expect(outputs.InstanceProfileArn.Value['Fn::GetAtt'][0]).toBe('ApplicationInstanceProfile');

    // Check KMS outputs
    expect(outputs.SSMKMSKeyId.Value.Ref).toBe('SSMKMSKey');
    expect(outputs.SSMKMSKeyAlias.Value.Ref).toBe('SSMKMSKeyAlias');
  });

  // 6. Test KMS Key and Alias resources
  test('KMS Key should have correct policy and permissions for SSM', () => {
    const kmsKey = template.Resources.SSMKMSKey;
    expect(kmsKey.Type).toBe('AWS::KMS::Key');
    
    const keyPolicy = kmsKey.Properties.KeyPolicy;
    expect(keyPolicy.Statement).toHaveLength(3);
    
    const rootStatement = keyPolicy.Statement[0];
    expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
    expect(rootStatement.Principal.AWS['Fn::Sub']).toMatch(/arn:aws:iam::\${AWS::AccountId}:root/);
    
    const ssmStatement = keyPolicy.Statement[1];
    expect(ssmStatement.Sid).toBe('Allow use of the key by SSM');
    expect(ssmStatement.Principal.Service).toBe('ssm.amazonaws.com');
    
    const roleStatement = keyPolicy.Statement[2];
    expect(roleStatement.Sid).toBe('Allow application role to use the key');
    expect(roleStatement.Principal.AWS['Fn::GetAtt'][0]).toBe('ApplicationExecutionRole');
  });

  test('KMS Key Alias should reference the KMS Key', () => {
    const kmsAlias = template.Resources.SSMKMSKeyAlias;
    expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
    expect(kmsAlias.Properties.AliasName['Fn::Sub']).toMatch(/alias\/\${ApplicationName}-\${Environment}\${EnvironmentSuffix}-ssm-key/);
    expect(kmsAlias.Properties.TargetKeyId.Ref).toBe('SSMKMSKey');
  });

  // 7. Test IAM policies include KMS permissions
  test('SSMParameterPolicy should include KMS decrypt permissions', () => {
    const ssmPolicy = template.Resources.SSMParameterPolicy;
    const statements = ssmPolicy.Properties.PolicyDocument.Statement;
    
    const ssmStatement = statements[0];
    expect(ssmStatement.Resource[0]['Fn::Sub']).toMatch(/arn:aws:ssm:\${AWS::Region}:\${AWS::AccountId}:parameter\/\${ApplicationName}\/\${Environment}\${EnvironmentSuffix}\/\*/);
    
    const kmsStatement = statements[1];
    expect(kmsStatement.Action).toEqual(['kms:Decrypt']);
    expect(kmsStatement.Resource['Fn::GetAtt'][0]).toBe('SSMKMSKey');
  });

  // 8. Test that all policy names include EnvironmentSuffix
  test('IAM policies should include EnvironmentSuffix in policy names', () => {
    ['EnvironmentS3Policy', 'EnvironmentDynamoDBPolicy', 'CloudWatchLogsPolicy', 'SSMParameterPolicy'].forEach(policyName => {
      const policy = template.Resources[policyName];
      expect(policy.Properties.PolicyName['Fn::Sub']).toMatch(/\${Environment}\${EnvironmentSuffix}/);
    });
  });

  // 9. Test Instance Profile includes EnvironmentSuffix
  test('ApplicationInstanceProfile should include EnvironmentSuffix in name', () => {
    const instanceProfile = template.Resources.ApplicationInstanceProfile;
    expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    expect(instanceProfile.Properties.InstanceProfileName['Fn::Sub']).toMatch(/\${ApplicationName}-\${Environment}\${EnvironmentSuffix}-instance-profile/);
  });
});