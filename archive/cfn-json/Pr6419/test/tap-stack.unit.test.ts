/**
 * Unit Tests for CloudFormation Transaction Processing Infrastructure Template
 *
 * This test suite validates the CloudFormation JSON template structure,
 * resource configurations, and all 10 optimizations implemented.
 */

const fs = require('fs');
const path = require('path');

let template: any;

beforeAll(() => {
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  template = JSON.parse(templateContent);
});

describe('CloudFormation Template Structure', () => {
  test('should have valid template format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have description', () => {
    expect(template.Description).toBeDefined();
    expect(template.Description).toContain('transaction processing');
  });

  test('should have Parameters section', () => {
    expect(template.Parameters).toBeDefined();
    expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
  });

  test('should have Resources section', () => {
    expect(template.Resources).toBeDefined();
    expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
  });

  test('should have Outputs section', () => {
    expect(template.Outputs).toBeDefined();
    expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
  });

  test('should have Conditions section', () => {
    expect(template.Conditions).toBeDefined();
    expect(Object.keys(template.Conditions).length).toBeGreaterThan(0);
  });
});

describe('Parameters Validation', () => {
  test('should have EnvironmentType parameter', () => {
    const param = template.Parameters.EnvironmentType;
    expect(param).toBeDefined();
    expect(param.Type).toBe('String');
    expect(param.AllowedValues).toContain('development');
    expect(param.AllowedValues).toContain('staging');
    expect(param.AllowedValues).toContain('production');
    expect(param.Default).toBe('development');
  });

  test('should have EnvironmentSuffix parameter', () => {
    const param = template.Parameters.EnvironmentSuffix;
    expect(param).toBeDefined();
    expect(param.Type).toBe('String');
    expect(param.MinLength).toBe(1);
    expect(param.MaxLength).toBe(20);
  });

  test('should have LambdaMemorySize parameter with correct values', () => {
    const param = template.Parameters.LambdaMemorySize;
    expect(param).toBeDefined();
    expect(param.Type).toBe('Number');
    expect(param.AllowedValues).toEqual([512, 1024, 2048]);
    expect(param.Default).toBe(1024);
  });

  test('should have DBUsername parameter with NoEcho', () => {
    const param = template.Parameters.DBUsername;
    expect(param).toBeDefined();
    expect(param.Type).toBe('String');
    expect(param.NoEcho).toBe(true);
    expect(param.MinLength).toBe(1);
    expect(param.MaxLength).toBe(16);
  });

  test('should have DBPasswordSecretArn parameter with NoEcho', () => {
    const param = template.Parameters.DBPasswordSecretArn;
    expect(param).toBeDefined();
    expect(param.Type).toBe('String');
    expect(param.NoEcho).toBe(true);
  });

  test('should have VpcId parameter', () => {
    const param = template.Parameters.VpcId;
    expect(param).toBeDefined();
    expect(param.Type).toBe('AWS::EC2::VPC::Id');
  });

  test('should have PrivateSubnetIds parameter', () => {
    const param = template.Parameters.PrivateSubnetIds;
    expect(param).toBeDefined();
    expect(param.Type).toBe('List<AWS::EC2::Subnet::Id>');
  });

  test('should have DBSubnetIds parameter', () => {
    const param = template.Parameters.DBSubnetIds;
    expect(param).toBeDefined();
    expect(param.Type).toBe('List<AWS::EC2::Subnet::Id>');
  });
});

describe('Conditions Validation', () => {
  test('should have IsProduction condition', () => {
    const condition = template.Conditions.IsProduction;
    expect(condition).toBeDefined();
    expect(condition['Fn::Equals']).toBeDefined();
    expect(condition['Fn::Equals'][0]).toEqual({ Ref: 'EnvironmentType' });
    expect(condition['Fn::Equals'][1]).toBe('production');
  });
});

describe('Optimization 1: RDS Right-Sizing', () => {
  test('should have TransactionDatabase resource', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource).toBeDefined();
    expect(resource.Type).toBe('AWS::RDS::DBInstance');
  });

  test('should use db.t3.large instance class', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource.Properties.DBInstanceClass).toBe('db.t3.large');
  });

  test('should have Multi-AZ enabled', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource.Properties.MultiAZ).toBe(true);
  });

  test('should have MySQL 8.0 engine', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource.Properties.Engine).toBe('mysql');
    expect(resource.Properties.EngineVersion).toMatch(/^8\.0\./);
  });

  test('should have DeletionPolicy Snapshot', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource.DeletionPolicy).toBe('Snapshot');
  });

  test('should have UpdateReplacePolicy Snapshot', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource.UpdateReplacePolicy).toBe('Snapshot');
  });

  test('should have storage encryption enabled', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource.Properties.StorageEncrypted).toBe(true);
  });

  test('should not have DeletionProtection enabled', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource.Properties.DeletionProtection).toBe(false);
  });
});

describe('Optimization 2: Dynamic Region References', () => {
  test('should use Fn::Sub with AWS::Region in IAM policy CloudWatch Logs ARN', () => {
    const policy = template.Resources.LambdaExecutionManagedPolicy;
    const logsStatement = policy.Properties.PolicyDocument.Statement.find(
      s => s.Action.includes('logs:CreateLogGroup')
    );
    expect(logsStatement.Resource['Fn::Sub']).toBeDefined();
    expect(logsStatement.Resource['Fn::Sub']).toContain('${AWS::Region}');
    expect(logsStatement.Resource['Fn::Sub']).toContain('${AWS::AccountId}');
  });

  test('should use Fn::Sub with AWS::Region in DynamoDB ARN', () => {
    const policy = template.Resources.LambdaExecutionManagedPolicy;
    const dynamoStatement = policy.Properties.PolicyDocument.Statement.find(
      s => s.Action.includes('dynamodb:GetItem')
    );
    expect(dynamoStatement.Resource['Fn::Sub']).toBeDefined();
    expect(dynamoStatement.Resource['Fn::Sub']).toContain('${AWS::Region}');
  });

  test('should use Fn::Sub with AWS::Region in RDS ARN', () => {
    const policy = template.Resources.LambdaExecutionManagedPolicy;
    const rdsStatement = policy.Properties.PolicyDocument.Statement.find(
      s => s.Action.includes('rds:DescribeDBInstances')
    );
    expect(rdsStatement.Resource['Fn::Sub']).toBeDefined();
    expect(rdsStatement.Resource['Fn::Sub']).toContain('${AWS::Region}');
  });

  test('should use Fn::Sub with AWS::Region in Secrets Manager ARN', () => {
    const policy = template.Resources.LambdaExecutionManagedPolicy;
    const secretsStatement = policy.Properties.PolicyDocument.Statement.find(
      s => s.Action.includes('secretsmanager:GetSecretValue')
    );
    expect(secretsStatement.Resource['Fn::Sub']).toBeDefined();
    expect(secretsStatement.Resource['Fn::Sub']).toContain('${AWS::Region}');
  });

  test('should use Fn::Sub with AWS::Region in KMS ARN', () => {
    const policy = template.Resources.LambdaExecutionManagedPolicy;
    const kmsStatement = policy.Properties.PolicyDocument.Statement.find(
      s => s.Action.includes('kms:Decrypt')
    );
    expect(kmsStatement.Resource['Fn::Sub']).toBeDefined();
    expect(kmsStatement.Resource['Fn::Sub']).toContain('${AWS::Region}');
  });
});

describe('Optimization 3: IAM Policy Consolidation', () => {
  test('should have LambdaExecutionManagedPolicy as managed policy', () => {
    const policy = template.Resources.LambdaExecutionManagedPolicy;
    expect(policy).toBeDefined();
    expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
  });

  test('should have consolidated permissions in managed policy', () => {
    const policy = template.Resources.LambdaExecutionManagedPolicy;
    const statements = policy.Properties.PolicyDocument.Statement;

    // Check for CloudWatch Logs permissions
    const logsStatement = statements.find(s => s.Action.includes('logs:CreateLogGroup'));
    expect(logsStatement).toBeDefined();

    // Check for VPC permissions
    const vpcStatement = statements.find(s => s.Action.includes('ec2:CreateNetworkInterface'));
    expect(vpcStatement).toBeDefined();

    // Check for DynamoDB permissions
    const dynamoStatement = statements.find(s => s.Action.includes('dynamodb:GetItem'));
    expect(dynamoStatement).toBeDefined();

    // Check for RDS permissions
    const rdsStatement = statements.find(s => s.Action.includes('rds:DescribeDBInstances'));
    expect(rdsStatement).toBeDefined();

    // Check for Secrets Manager permissions
    const secretsStatement = statements.find(s => s.Action.includes('secretsmanager:GetSecretValue'));
    expect(secretsStatement).toBeDefined();

    // Check for KMS permissions
    const kmsStatement = statements.find(s => s.Action.includes('kms:Decrypt'));
    expect(kmsStatement).toBeDefined();
  });

  test('should reference managed policy in all Lambda roles', () => {
    const roles = ['TransactionProcessorRole', 'PaymentProcessorRole', 'OrderProcessorRole'];

    roles.forEach(roleName => {
      const role = template.Resources[roleName];
      expect(role).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContainEqual({ Ref: 'LambdaExecutionManagedPolicy' });
    });
  });

  test('should not have inline policies in Lambda roles', () => {
    const roles = ['TransactionProcessorRole', 'PaymentProcessorRole', 'OrderProcessorRole'];

    roles.forEach(roleName => {
      const role = template.Resources[roleName];
      expect(role.Properties.Policies).toBeUndefined();
    });
  });
});

describe('Optimization 4: Conditional Logic', () => {
  test('should have TransactionDatabaseReadReplica with IsProduction condition', () => {
    const replica = template.Resources.TransactionDatabaseReadReplica;
    expect(replica).toBeDefined();
    expect(replica.Condition).toBe('IsProduction');
  });

  test('should have read replica referencing primary database', () => {
    const replica = template.Resources.TransactionDatabaseReadReplica;
    expect(replica.Properties.SourceDBInstanceIdentifier).toEqual({ Ref: 'TransactionDatabase' });
  });

  test('should have read replica with same instance class', () => {
    const replica = template.Resources.TransactionDatabaseReadReplica;
    expect(replica.Properties.DBInstanceClass).toBe('db.t3.large');
  });

  test('should have conditional output for read replica endpoint', () => {
    const output = template.Outputs.DatabaseReadReplicaEndpoint;
    expect(output).toBeDefined();
    expect(output.Condition).toBe('IsProduction');
  });
});

describe('Optimization 5: Deletion Policies', () => {
  test('should have DeletionPolicy Snapshot on RDS primary', () => {
    const resource = template.Resources.TransactionDatabase;
    expect(resource.DeletionPolicy).toBe('Snapshot');
  });

  test('should have DeletionPolicy Snapshot on RDS replica', () => {
    const resource = template.Resources.TransactionDatabaseReadReplica;
    expect(resource.DeletionPolicy).toBe('Snapshot');
  });

  test('should have DeletionPolicy Retain on DynamoDB table', () => {
    const resource = template.Resources.SessionTable;
    expect(resource.DeletionPolicy).toBe('Retain');
  });

  test('should have DeletionPolicy Delete on Lambda functions', () => {
    const functions = ['TransactionProcessorFunction', 'PaymentProcessorFunction', 'OrderProcessorFunction'];

    functions.forEach(funcName => {
      const func = template.Resources[funcName];
      expect(func.DeletionPolicy).toBe('Delete');
    });
  });

  test('should have DeletionPolicy Delete on Log Groups', () => {
    const logGroups = ['TransactionProcessorLogGroup', 'PaymentProcessorLogGroup', 'OrderProcessorLogGroup'];

    logGroups.forEach(lgName => {
      const lg = template.Resources[lgName];
      expect(lg.DeletionPolicy).toBe('Delete');
    });
  });
});

describe('Optimization 6: Function Modernization (Fn::Sub)', () => {
  test('should use Fn::Sub for resource names', () => {
    const resources = [
      'LambdaExecutionManagedPolicy',
      'TransactionProcessorRole',
      'PaymentProcessorRole',
      'OrderProcessorRole',
      'DBSecurityGroup',
      'LambdaSecurityGroup',
      'DBSubnetGroup',
      'TransactionDatabase',
      'SessionTable',
      'TransactionProcessorFunction',
      'PaymentProcessorFunction',
      'OrderProcessorFunction'
    ];

    let fnSubCount = 0;

    resources.forEach(resourceName => {
      const resource = template.Resources[resourceName];
      const props = resource.Properties;

      // Check various name properties
      const nameKeys = ['ManagedPolicyName', 'RoleName', 'GroupName', 'DBSubnetGroupName',
        'DBInstanceIdentifier', 'TableName', 'FunctionName', 'LogGroupName'];

      nameKeys.forEach(key => {
        if (props && props[key] && props[key]['Fn::Sub']) {
          fnSubCount++;
        }
      });
    });

    // Should have at least 10 Fn::Sub usages as per requirement
    expect(fnSubCount).toBeGreaterThanOrEqual(10);
  });

  test('should use Fn::Sub with EnvironmentSuffix in resource names', () => {
    const resources = Object.keys(template.Resources);

    resources.forEach(resourceName => {
      const resource = template.Resources[resourceName];
      const props = resource.Properties;

      if (!props) return;

      const nameKeys = ['ManagedPolicyName', 'RoleName', 'GroupName', 'DBSubnetGroupName',
        'DBInstanceIdentifier', 'TableName', 'FunctionName', 'LogGroupName'];

      nameKeys.forEach(key => {
        if (props[key] && props[key]['Fn::Sub']) {
          expect(props[key]['Fn::Sub']).toContain('EnvironmentSuffix');
        }
      });
    });
  });

  test('should not use Fn::Join for string concatenation', () => {
    const templateStr = JSON.stringify(template);
    expect(templateStr).not.toContain('Fn::Join');
  });
});

describe('Optimization 7: Lambda Parameterization', () => {
  test('should reference LambdaMemorySize parameter in all Lambda functions', () => {
    const functions = ['TransactionProcessorFunction', 'PaymentProcessorFunction', 'OrderProcessorFunction'];

    functions.forEach(funcName => {
      const func = template.Resources[funcName];
      expect(func.Properties.MemorySize).toEqual({ Ref: 'LambdaMemorySize' });
    });
  });

  test('Lambda functions should have appropriate timeout', () => {
    const functions = ['TransactionProcessorFunction', 'PaymentProcessorFunction', 'OrderProcessorFunction'];

    functions.forEach(funcName => {
      const func = template.Resources[funcName];
      expect(func.Properties.Timeout).toBeDefined();
      expect(func.Properties.Timeout).toBeGreaterThanOrEqual(30);
    });
  });

  test('Lambda functions should be in VPC', () => {
    const functions = ['TransactionProcessorFunction', 'PaymentProcessorFunction', 'OrderProcessorFunction'];

    functions.forEach(funcName => {
      const func = template.Resources[funcName];
      expect(func.Properties.VpcConfig).toBeDefined();
      expect(func.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(func.Properties.VpcConfig.SubnetIds).toBeDefined();
    });
  });
});

describe('Optimization 8: Update Policies', () => {
  test('should have UpdateReplacePolicy Snapshot on RDS resources', () => {
    expect(template.Resources.TransactionDatabase.UpdateReplacePolicy).toBe('Snapshot');
    expect(template.Resources.TransactionDatabaseReadReplica.UpdateReplacePolicy).toBe('Snapshot');
  });

  test('should have UpdateReplacePolicy Retain on DynamoDB table', () => {
    expect(template.Resources.SessionTable.UpdateReplacePolicy).toBe('Retain');
  });

  test('should have UpdateReplacePolicy Delete on Lambda functions', () => {
    const functions = ['TransactionProcessorFunction', 'PaymentProcessorFunction', 'OrderProcessorFunction'];

    functions.forEach(funcName => {
      expect(template.Resources[funcName].UpdateReplacePolicy).toBe('Delete');
    });
  });

  test('should have UpdateReplacePolicy Delete on Log Groups', () => {
    const logGroups = ['TransactionProcessorLogGroup', 'PaymentProcessorLogGroup', 'OrderProcessorLogGroup'];

    logGroups.forEach(lgName => {
      expect(template.Resources[lgName].UpdateReplacePolicy).toBe('Delete');
    });
  });
});

describe('Resource Configuration', () => {
  test('should have DynamoDB table with PAY_PER_REQUEST billing', () => {
    const table = template.Resources.SessionTable;
    expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('should have DynamoDB table with encryption enabled', () => {
    const table = template.Resources.SessionTable;
    expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
  });

  test('should have DynamoDB table with point-in-time recovery', () => {
    const table = template.Resources.SessionTable;
    expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
  });

  test('should have DynamoDB table with TTL enabled', () => {
    const table = template.Resources.SessionTable;
    expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
    expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
  });

  test('should have security groups with appropriate rules', () => {
    const dbSg = template.Resources.DBSecurityGroup;
    expect(dbSg.Properties.SecurityGroupIngress).toBeDefined();
    expect(dbSg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
    expect(dbSg.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
  });

  test('should have Lambda functions with appropriate runtime', () => {
    const functions = ['TransactionProcessorFunction', 'PaymentProcessorFunction', 'OrderProcessorFunction'];

    functions.forEach(funcName => {
      const func = template.Resources[funcName];
      expect(func.Properties.Runtime).toMatch(/python3\.\d+/);
    });
  });

  test('should have Lambda functions with environment variables', () => {
    const functions = ['TransactionProcessorFunction', 'PaymentProcessorFunction', 'OrderProcessorFunction'];

    functions.forEach(funcName => {
      const func = template.Resources[funcName];
      expect(func.Properties.Environment.Variables).toBeDefined();
      expect(func.Properties.Environment.Variables.DB_HOST).toBeDefined();
      expect(func.Properties.Environment.Variables.REGION).toEqual({ Ref: 'AWS::Region' });
    });
  });

  test('should have Lambda log groups created before functions', () => {
    const functions = [
      { func: 'TransactionProcessorFunction', log: 'TransactionProcessorLogGroup' },
      { func: 'PaymentProcessorFunction', log: 'PaymentProcessorLogGroup' },
      { func: 'OrderProcessorFunction', log: 'OrderProcessorLogGroup' }
    ];

    functions.forEach(({ func, log }) => {
      const funcResource = template.Resources[func];
      expect(funcResource.DependsOn).toContain(log);
    });
  });
});

describe('Outputs Validation', () => {
  test('should have DatabaseEndpoint output', () => {
    const output = template.Outputs.DatabaseEndpoint;
    expect(output).toBeDefined();
    expect(output.Description).toContain('RDS');
    expect(output.Value['Fn::GetAtt']).toEqual(['TransactionDatabase', 'Endpoint.Address']);
  });

  test('should have DatabasePort output', () => {
    const output = template.Outputs.DatabasePort;
    expect(output).toBeDefined();
    expect(output.Value['Fn::GetAtt']).toEqual(['TransactionDatabase', 'Endpoint.Port']);
  });

  test('should have SessionTableName output', () => {
    const output = template.Outputs.SessionTableName;
    expect(output).toBeDefined();
    expect(output.Value['Fn::Sub']).toContain('session-table-${EnvironmentSuffix}');
  });

  test('should have Lambda function ARN outputs', () => {
    const lambdaOutputs = [
      'TransactionProcessorArn',
      'PaymentProcessorArn',
      'OrderProcessorArn'
    ];

    lambdaOutputs.forEach(outputName => {
      const output = template.Outputs[outputName];
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toBeDefined();
    });
  });

  test('should have StackRegion output using AWS::Region', () => {
    const output = template.Outputs.StackRegion;
    expect(output).toBeDefined();
    expect(output.Value).toEqual({ Ref: 'AWS::Region' });
  });

  test('should have EnvironmentType output', () => {
    const output = template.Outputs.EnvironmentType;
    expect(output).toBeDefined();
    expect(output.Value).toEqual({ Ref: 'EnvironmentType' });
  });

  test('should have EnvironmentSuffix output', () => {
    const output = template.Outputs.EnvironmentSuffix;
    expect(output).toBeDefined();
    expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
  });

  test('should have exports for cross-stack references', () => {
    const outputsWithExports = [
      'DatabaseEndpoint',
      'DatabasePort',
      'SessionTableName',
      'TransactionProcessorArn',
      'PaymentProcessorArn',
      'OrderProcessorArn',
      'LambdaExecutionPolicyArn'
    ];

    outputsWithExports.forEach(outputName => {
      const output = template.Outputs[outputName];
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });
  });
});

describe('Security and Best Practices', () => {
  test('should have RDS with encryption at rest', () => {
    const rds = template.Resources.TransactionDatabase;
    expect(rds.Properties.StorageEncrypted).toBe(true);
  });

  test('should have RDS with backup retention', () => {
    const rds = template.Resources.TransactionDatabase;
    expect(rds.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
  });

  test('should have RDS with CloudWatch log exports', () => {
    const rds = template.Resources.TransactionDatabase;
    expect(rds.Properties.EnableCloudwatchLogsExports).toBeDefined();
    expect(rds.Properties.EnableCloudwatchLogsExports.length).toBeGreaterThan(0);
  });

  test('should have RDS not publicly accessible', () => {
    const rds = template.Resources.TransactionDatabase;
    expect(rds.Properties.PubliclyAccessible).toBe(false);
  });

  test('should use Secrets Manager for database password', () => {
    const rds = template.Resources.TransactionDatabase;
    expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
  });

  test('should have IAM roles with proper trust policies', () => {
    const roles = ['TransactionProcessorRole', 'PaymentProcessorRole', 'OrderProcessorRole'];

    roles.forEach(roleName => {
      const role = template.Resources[roleName];
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });
  });

  test('should have all resources with tags', () => {
    const taggedResources = [
      'TransactionProcessorRole',
      'PaymentProcessorRole',
      'OrderProcessorRole',
      'DBSecurityGroup',
      'LambdaSecurityGroup',
      'DBSubnetGroup',
      'TransactionDatabase',
      'SessionTable',
      'TransactionProcessorFunction',
      'PaymentProcessorFunction',
      'OrderProcessorFunction'
    ];

    taggedResources.forEach(resourceName => {
      const resource = template.Resources[resourceName];
      expect(resource.Properties.Tags).toBeDefined();

      const envTag = resource.Properties.Tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const suffixTag = resource.Properties.Tags.find(t => t.Key === 'EnvironmentSuffix');
      expect(suffixTag).toBeDefined();
    });
  });
});

describe('Resource Count Validation', () => {
  test('should have exactly 16 resources', () => {
    expect(Object.keys(template.Resources).length).toBe(16);
  });

  test('should have expected resource types', () => {
    const resourceTypes = Object.values(template.Resources).map(r => r.Type);

    expect(resourceTypes).toContain('AWS::IAM::ManagedPolicy');
    expect(resourceTypes).toContain('AWS::IAM::Role');
    expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
    expect(resourceTypes).toContain('AWS::RDS::DBSubnetGroup');
    expect(resourceTypes).toContain('AWS::RDS::DBInstance');
    expect(resourceTypes).toContain('AWS::DynamoDB::Table');
    expect(resourceTypes).toContain('AWS::Lambda::Function');
    expect(resourceTypes).toContain('AWS::Logs::LogGroup');
  });
});

describe('Multi-Region Compatibility', () => {
  test('should not contain hardcoded region values', () => {
    const templateStr = JSON.stringify(template);
    expect(templateStr).not.toContain('eu-east-1');
    expect(templateStr).not.toContain('eu-west-1');
    expect(templateStr).not.toContain('ap-southeast-1');
  });

  test('should use AWS::Region pseudo parameter', () => {
    const templateStr = JSON.stringify(template);
    expect(templateStr).toContain('AWS::Region');
  });

  test('should use AWS::AccountId pseudo parameter', () => {
    const templateStr = JSON.stringify(template);
    expect(templateStr).toContain('AWS::AccountId');
  });

  test('should use AWS::StackName pseudo parameter in exports', () => {
    const templateStr = JSON.stringify(template);
    expect(templateStr).toContain('AWS::StackName');
  });
});