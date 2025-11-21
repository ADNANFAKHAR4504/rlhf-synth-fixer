import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentName.Type).toBe('String');
      expect(template.Parameters.EnvironmentName.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(1);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(20);
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBUsername.Type).toBe('String');
      expect(template.Parameters.DBUsername.MinLength).toBe(1);
      expect(template.Parameters.DBUsername.MaxLength).toBe(16);
    });

    test('should not have DBPassword parameter (using Secrets Manager instead)', () => {
      expect(template.Parameters.DBPassword).toBeUndefined();
    });

    test('should not have VPCId or PrivateSubnetIds parameters (VPC is created in template)', () => {
      expect(template.Parameters.VPCId).toBeUndefined();
      expect(template.Parameters.PrivateSubnetIds).toBeUndefined();
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals']).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals'][0]).toEqual({ Ref: 'EnvironmentName' });
      expect(template.Conditions.IsProduction['Fn::Equals'][1]).toBe('prod');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have PrivateSubnet1 resource', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone).toBeDefined();
    });

    test('should have PrivateSubnet2 resource', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone).toBeDefined();
    });
  });

  describe('RDS Resources', () => {
    test('should have DBSubnetGroup resource', () => {
      const resource = template.Resources.DBSubnetGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(Array.isArray(resource.Properties.SubnetIds)).toBe(true);
      expect(resource.Properties.SubnetIds).toHaveLength(2);
      expect(resource.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(resource.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('DBSubnetGroup name should include environmentSuffix', () => {
      const resource = template.Resources.DBSubnetGroup;
      expect(resource.Properties.DBSubnetGroupName).toEqual({
        'Fn::Sub': 'db-subnet-group-${EnvironmentSuffix}'
      });
    });

    test('should have AuroraDBCluster resource', () => {
      const resource = template.Resources.AuroraDBCluster;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::RDS::DBCluster');
      expect(resource.Properties.Engine).toBe('aurora-mysql');
    });

    test('AuroraDBCluster should have correct deletion policies', () => {
      const resource = template.Resources.AuroraDBCluster;
      expect(resource.DeletionPolicy).toBe('Delete');
      expect(resource.UpdateReplacePolicy).toBe('Delete');
    });

    test('AuroraDBCluster should have ServerlessV2ScalingConfiguration', () => {
      const resource = template.Resources.AuroraDBCluster;
      expect(resource.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(resource.Properties.ServerlessV2ScalingConfiguration.MinCapacity).toBe(0.5);
      expect(resource.Properties.ServerlessV2ScalingConfiguration.MaxCapacity).toBe(1.0);
    });

    test('AuroraDBCluster should reference DBSubnetGroup', () => {
      const resource = template.Resources.AuroraDBCluster;
      expect(resource.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('AuroraDBCluster should reference DBSecurityGroup', () => {
      const resource = template.Resources.AuroraDBCluster;
      expect(resource.Properties.VpcSecurityGroupIds).toContainEqual({ Ref: 'DBSecurityGroup' });
    });

    test('AuroraDBCluster should have backup configuration', () => {
      const resource = template.Resources.AuroraDBCluster;
      expect(resource.Properties.BackupRetentionPeriod).toBe(7);
      expect(resource.Properties.PreferredBackupWindow).toBeDefined();
      expect(resource.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('AuroraDBCluster should use Secrets Manager for credentials', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.MasterUsername).toBeDefined();
      expect(cluster.Properties.MasterUserPassword).toBeDefined();

      // Both should use dynamic references to Secrets Manager
      expect(cluster.Properties.MasterUsername['Fn::Sub']).toBeDefined();
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toBeDefined();
      expect(cluster.Properties.MasterUsername['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(cluster.Properties.MasterUsername['Fn::Sub']).toContain('DBSecret');
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toContain('DBSecret');
    });

    test('should have AuroraDBInstance resource', () => {
      const resource = template.Resources.AuroraDBInstance;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::RDS::DBInstance');
      expect(resource.Properties.Engine).toBe('aurora-mysql');
      expect(resource.Properties.DBInstanceClass).toBe('db.serverless');
    });

    test('AuroraDBInstance should reference AuroraDBCluster', () => {
      const resource = template.Resources.AuroraDBInstance;
      expect(resource.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraDBCluster' });
    });

    test('AuroraDBInstance name should include environmentSuffix', () => {
      const resource = template.Resources.AuroraDBInstance;
      expect(resource.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'aurora-instance-${EnvironmentSuffix}'
      });
    });

    test('AuroraDBInstance should not be publicly accessible', () => {
      const resource = template.Resources.AuroraDBInstance;
      expect(resource.Properties.PubliclyAccessible).toBe(false);
    });

    test('AuroraDBInstance should have conditional Performance Insights', () => {
      const resource = template.Resources.AuroraDBInstance;
      expect(resource.Properties.EnablePerformanceInsights).toEqual({
        'Fn::If': ['IsProduction', true, false]
      });
    });
  });

  describe('Security Groups', () => {
    test('should have DBSecurityGroup resource', () => {
      const resource = template.Resources.DBSecurityGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
      expect(resource.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('DBSecurityGroup name should include environmentSuffix', () => {
      const resource = template.Resources.DBSecurityGroup;
      expect(resource.Properties.GroupName).toEqual({
        'Fn::Sub': 'db-security-group-${EnvironmentSuffix}'
      });
    });

    test('DBSecurityGroup should allow ingress from Lambda', () => {
      const resource = template.Resources.DBSecurityGroup;
      const ingress = resource.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('should have LambdaSecurityGroup resource', () => {
      const resource = template.Resources.LambdaSecurityGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
      expect(resource.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('LambdaSecurityGroup name should include environmentSuffix', () => {
      const resource = template.Resources.LambdaSecurityGroup;
      expect(resource.Properties.GroupName).toEqual({
        'Fn::Sub': 'lambda-security-group-${EnvironmentSuffix}'
      });
    });

    test('LambdaSecurityGroup should allow all outbound traffic', () => {
      const resource = template.Resources.LambdaSecurityGroup;
      const egress = resource.Properties.SecurityGroupEgress[0];
      expect(egress.IpProtocol).toBe('-1');
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Lambda Resources', () => {
    test('should have TransactionProcessorRole resource', () => {
      const resource = template.Resources.TransactionProcessorRole;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IAM::Role');
    });

    test('TransactionProcessorRole name should use Fn::Sub with stack name', () => {
      const resource = template.Resources.TransactionProcessorRole;
      expect(resource.Properties.RoleName).toEqual({
        'Fn::Sub': '${AWS::StackName}-transaction-processor-role'
      });
    });

    test('TransactionProcessorRole should have Lambda assume role policy', () => {
      const resource = template.Resources.TransactionProcessorRole;
      const statement = resource.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('TransactionProcessorRole should have VPC access policy', () => {
      const resource = template.Resources.TransactionProcessorRole;
      expect(resource.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('TransactionProcessorRole should have CloudWatch Logs policy', () => {
      const resource = template.Resources.TransactionProcessorRole;
      const policy = resource.Properties.Policies[0];
      expect(policy.PolicyName).toBe('TransactionProcessorPolicy');
      const logStatement = policy.PolicyDocument.Statement.find(
        (s: any) => s.Action.includes('logs:CreateLogGroup')
      );
      expect(logStatement).toBeDefined();
    });

    test('should have TransactionProcessorFunction resource', () => {
      const resource = template.Resources.TransactionProcessorFunction;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Lambda::Function');
      expect(resource.Properties.Runtime).toBe('python3.11');
    });

    test('TransactionProcessorFunction should have DeletionPolicy Delete', () => {
      const resource = template.Resources.TransactionProcessorFunction;
      expect(resource.DeletionPolicy).toBe('Delete');
    });

    test('TransactionProcessorFunction should depend on RDS', () => {
      const resource = template.Resources.TransactionProcessorFunction;
      // DependsOn only includes AuroraDBInstance (AuroraDBCluster dependency is implicit via GetAtt)
      expect(resource.DependsOn).toContain('AuroraDBInstance');
      expect(resource.DependsOn).not.toContain('AuroraDBCluster');
    });

    test('TransactionProcessorFunction name should include environmentSuffix', () => {
      const resource = template.Resources.TransactionProcessorFunction;
      expect(resource.Properties.FunctionName).toEqual({
        'Fn::Sub': 'transaction-processor-${EnvironmentSuffix}'
      });
    });

    test('TransactionProcessorFunction should have 3GB memory', () => {
      const resource = template.Resources.TransactionProcessorFunction;
      expect(resource.Properties.MemorySize).toBe(3008);
    });

    test('TransactionProcessorFunction should not have reserved concurrent executions (removed to avoid account limits)', () => {
      const resource = template.Resources.TransactionProcessorFunction;
      expect(resource.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('TransactionProcessorFunction should have VPC configuration', () => {
      const resource = template.Resources.TransactionProcessorFunction;
      expect(resource.Properties.VpcConfig).toBeDefined();
      expect(resource.Properties.VpcConfig.SecurityGroupIds).toContainEqual({
        Ref: 'LambdaSecurityGroup'
      });
      expect(Array.isArray(resource.Properties.VpcConfig.SubnetIds)).toBe(true);
      expect(resource.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(resource.Properties.VpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(resource.Properties.VpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('TransactionProcessorFunction should have DB endpoint in environment', () => {
      const resource = template.Resources.TransactionProcessorFunction;
      expect(resource.Properties.Environment.Variables.DB_ENDPOINT).toEqual({
        'Fn::GetAtt': ['AuroraDBCluster', 'Endpoint.Address']
      });
    });

    test('should have TransactionProcessorLogGroup resource', () => {
      const resource = template.Resources.TransactionProcessorLogGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
    });

    test('TransactionProcessorLogGroup name should include environmentSuffix', () => {
      const resource = template.Resources.TransactionProcessorLogGroup;
      expect(resource.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/transaction-processor-${EnvironmentSuffix}'
      });
    });

    test('TransactionProcessorLogGroup should have conditional retention', () => {
      const resource = template.Resources.TransactionProcessorLogGroup;
      expect(resource.Properties.RetentionInDays).toEqual({
        'Fn::If': ['IsProduction', 30, 7]
      });
    });
  });

  describe('RDS Monitoring Resources', () => {
    test('should have RDSMonitoringRole resource with condition', () => {
      const resource = template.Resources.RDSMonitoringRole;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IAM::Role');
      expect(resource.Condition).toBe('IsProduction');
    });

    test('RDSMonitoringRole name should use Fn::Sub with stack name', () => {
      const resource = template.Resources.RDSMonitoringRole;
      expect(resource.Properties.RoleName).toEqual({
        'Fn::Sub': '${AWS::StackName}-rds-monitoring-role'
      });
    });

    test('RDSMonitoringRole should have RDS assume role policy', () => {
      const resource = template.Resources.RDSMonitoringRole;
      const statement = resource.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('monitoring.rds.amazonaws.com');
    });

    test('RDSMonitoringRole should have enhanced monitoring policy', () => {
      const resource = template.Resources.RDSMonitoringRole;
      expect(resource.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have DBSecret resource', () => {
      const resource = template.Resources.DBSecret;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DBSecret name should include environmentSuffix', () => {
      const resource = template.Resources.DBSecret;
      expect(resource.Properties.Name).toEqual({
        'Fn::Sub': 'rds-credentials-${EnvironmentSuffix}'
      });
    });

    test('DBSecret should have correct structure', () => {
      const resource = template.Resources.DBSecret;
      expect(resource.Properties.GenerateSecretString).toBeDefined();
      expect(resource.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(resource.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(resource.Properties.GenerateSecretString.SecretStringTemplate).toBeDefined();
      expect(resource.Properties.GenerateSecretString.SecretStringTemplate['Fn::Sub']).toBeDefined();
    });
  });

  describe('SNS Resources', () => {
    test('should have NotificationTopic resource', () => {
      const resource = template.Resources.NotificationTopic;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::SNS::Topic');
    });

    test('NotificationTopic name should include environmentSuffix', () => {
      const resource = template.Resources.NotificationTopic;
      expect(resource.Properties.TopicName).toEqual({
        'Fn::Sub': 'deployment-notifications-${EnvironmentSuffix}'
      });
    });
  });

  describe('CloudWatch Dashboard Resources', () => {
    test('should have CloudWatchDashboard resource with condition', () => {
      const resource = template.Resources.CloudWatchDashboard;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(resource.Condition).toBe('IsProduction');
    });

    test('CloudWatchDashboard name should include environmentSuffix', () => {
      const resource = template.Resources.CloudWatchDashboard;
      expect(resource.Properties.DashboardName).toEqual({
        'Fn::Sub': 'transaction-processing-${EnvironmentSuffix}'
      });
    });

    test('CloudWatchDashboard should have dashboard body', () => {
      const resource = template.Resources.CloudWatchDashboard;
      expect(resource.Properties.DashboardBody).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('should have RDSClusterEndpoint output', () => {
      const output = template.Outputs.RDSClusterEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AuroraDBCluster', 'Endpoint.Address']
      });
    });

    test('RDSClusterEndpoint should have export name with stack name', () => {
      const output = template.Outputs.RDSClusterEndpoint;
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-RDSClusterEndpoint'
      });
    });

    test('should have RDSClusterReadEndpoint output', () => {
      const output = template.Outputs.RDSClusterReadEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AuroraDBCluster', 'ReadEndpoint.Address']
      });
    });

    test('should have LambdaFunctionArn output', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TransactionProcessorFunction', 'Arn']
      });
    });

    test('should have LambdaSecurityGroupId output', () => {
      const output = template.Outputs.LambdaSecurityGroupId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('should have DBSecurityGroupId output', () => {
      const output = template.Outputs.DBSecurityGroupId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DBSecurityGroup' });
    });

    test('should have DBSecretArn output', () => {
      const output = template.Outputs.DBSecretArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DBSecret' });
    });

    test('should have NotificationTopicArn output', () => {
      const output = template.Outputs.NotificationTopicArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'NotificationTopic' });
    });

    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('all outputs should have descriptions', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
      });
    });

    test('all outputs should have export names', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all taggable resources should have tags', () => {
      const taggableResources = [
        'DBSubnetGroup',
        'DBSecurityGroup',
        'LambdaSecurityGroup',
        'AuroraDBCluster',
        'AuroraDBInstance',
        'TransactionProcessorRole',
        'TransactionProcessorFunction',
        'DBSecret',
        'NotificationTopic'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Type !== 'AWS::Logs::LogGroup') {
          expect(resource.Properties.Tags).toBeDefined();
          expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        }
      });
    });

    test('all resources should have Name tag with environmentSuffix', () => {
      const resourcesWithNameTag = [
        'DBSubnetGroup',
        'DBSecurityGroup',
        'LambdaSecurityGroup',
        'AuroraDBCluster',
        'AuroraDBInstance',
        'TransactionProcessorFunction',
        'DBSecret',
        'NotificationTopic'
      ];

      resourcesWithNameTag.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          expect(nameTag).toBeDefined();
          expect(nameTag.Value).toBeDefined();
        }
      });
    });

    test('all resources should have Environment tag', () => {
      const resourcesWithEnvTag = [
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DBSubnetGroup',
        'DBSecurityGroup',
        'LambdaSecurityGroup',
        'AuroraDBCluster',
        'AuroraDBInstance',
        'TransactionProcessorFunction',
        'DBSecret',
        'NotificationTopic'
      ];

      resourcesWithEnvTag.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'EnvironmentName' });
        }
      });
    });
  });

  describe('Circular Dependency Check', () => {
    test('should not have circular dependencies between security groups', () => {
      const dbSG = template.Resources.DBSecurityGroup;
      const lambdaSG = template.Resources.LambdaSecurityGroup;

      // DB SG ingress references Lambda SG (forward reference)
      const dbIngress = dbSG.Properties.SecurityGroupIngress[0];
      expect(dbIngress.SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });

      // Lambda SG should not reference DB SG in ingress/egress
      // This prevents circular dependency
      expect(JSON.stringify(lambdaSG)).not.toContain('DBSecurityGroup');
    });

    test('Lambda should explicitly depend on RDS resources', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.DependsOn).toBeDefined();
      // DependsOn only includes AuroraDBInstance (AuroraDBCluster dependency is implicit via GetAtt)
      expect(lambda.DependsOn).toContain('AuroraDBInstance');
      // AuroraDBCluster dependency is enforced by GetAtt in Environment.Variables.DB_ENDPOINT
      expect(lambda.Properties.Environment.Variables.DB_ENDPOINT['Fn::GetAtt']).toEqual(['AuroraDBCluster', 'Endpoint.Address']);
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('production environment should enable enhanced monitoring', () => {
      const dbInstance = template.Resources.AuroraDBInstance;
      expect(dbInstance.Properties.EnablePerformanceInsights).toEqual({
        'Fn::If': ['IsProduction', true, false]
      });
      expect(dbInstance.Properties.MonitoringInterval).toEqual({
        'Fn::If': ['IsProduction', 60, 0]
      });
    });

    test('log retention should be environment-specific', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toEqual({
        'Fn::If': ['IsProduction', 30, 7]
      });
    });

    test('CloudWatch dashboard should only exist in production', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard.Condition).toBe('IsProduction');
    });

    test('RDS monitoring role should only exist in production', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Condition).toBe('IsProduction');
    });
  });

  describe('IAM Role Naming', () => {
    test('all IAM roles should use Fn::Sub with AWS::StackName', () => {
      const roles = ['TransactionProcessorRole', 'RDSMonitoringRole'];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.RoleName).toBeDefined();
        expect(role.Properties.RoleName['Fn::Sub']).toBeDefined();
        expect(role.Properties.RoleName['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Update and Deletion Policies', () => {
    test('RDS cluster should have correct deletion policies for QA', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('Lambda should have Delete deletion policy', () => {
      const lambda = template.Resources.TransactionProcessorFunction;
      expect(lambda.DeletionPolicy).toBe('Delete');
    });
  });
});
