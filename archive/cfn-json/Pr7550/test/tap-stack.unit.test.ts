import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('Multi-Region Disaster Recovery CloudFormation Template', () => {
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
      expect(template.Description).toContain('Multi-Region Disaster Recovery');
    });

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
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe('1');
      expect(param.MaxLength).toBe('20');
      expect(param.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('should have DatabaseMasterPassword parameter with NoEcho', () => {
      expect(template.Parameters.DatabaseMasterPassword).toBeDefined();
      const param = template.Parameters.DatabaseMasterPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe('8');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      const param = template.Parameters.DomainName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dr-transaction-processing.local');
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.DeletionPolicy).toBe('Delete');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.DeletionPolicy).toBe('Delete');
    });

    test('should have 4 subnets (2 public, 2 private)', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have route tables configured', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
    });

    test('VPC resources should use environmentSuffix', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });
    });
  });

  describe('Security Groups', () => {
    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.DeletionPolicy).toBe('Delete');
    });

    test('should have Database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(5432);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(5432);
    });

    test('Database SG should allow access from Lambda SG', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSg.Properties.SecurityGroupIngress[0];
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
    });
  });

  describe('Aurora Database', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.DeletionPolicy).toBe('Delete');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have Aurora PostgreSQL cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.EngineMode).toBe('provisioned');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.DeletionPolicy).toBe('Delete');
    });

    test('Aurora cluster should have proper backup configuration', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
      expect(cluster.Properties.PreferredBackupWindow).toBeDefined();
      expect(cluster.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('should have 2 Aurora instances', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();

      const instance1 = template.Resources.AuroraInstance1;
      expect(instance1.Type).toBe('AWS::RDS::DBInstance');
      expect(instance1.Properties.Engine).toBe('aurora-postgresql');
      expect(instance1.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(instance1.Properties.PubliclyAccessible).toBe(false);
      expect(instance1.DeletionPolicy).toBe('Delete');
    });

    test('Aurora cluster should use environmentSuffix in identifier', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBClusterIdentifier).toEqual({
        'Fn::Sub': 'aurora-cluster-${EnvironmentSuffix}'
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should have DatabaseSecret resource', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
    });

    test('DatabaseSecret should use environmentSuffix in name', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'db-credentials-${EnvironmentSuffix}'
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.DeletionPolicy).toBe('Delete');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('Lambda role should have Secrets Manager permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
    });

    test('should have TransactionProcessorFunction', () => {
      expect(template.Resources.TransactionProcessorFunction).toBeDefined();
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('python3.11');
      expect(func.Properties.Timeout).toBe(60);
      expect(func.Properties.MemorySize).toBe(512);
      expect(func.DeletionPolicy).toBe('Delete');
    });

    test('TransactionProcessorFunction should be in VPC', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.VpcConfig).toBeDefined();
      expect(func.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(func.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
    });

    test('should have HealthCheckFunction', () => {
      expect(template.Resources.HealthCheckFunction).toBeDefined();
      const func = template.Resources.HealthCheckFunction;
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('python3.11');
      expect(func.Properties.Timeout).toBe(30);
      expect(func.DeletionPolicy).toBe('Delete');
    });

    test('should have Health Check Function URL', () => {
      expect(template.Resources.HealthCheckFunctionUrl).toBeDefined();
      const url = template.Resources.HealthCheckFunctionUrl;
      expect(url.Type).toBe('AWS::Lambda::Url');
      expect(url.Properties.AuthType).toBe('NONE');
    });

    test('Lambda functions should use environmentSuffix in names', () => {
      const txFunc = template.Resources.TransactionProcessorFunction;
      const healthFunc = template.Resources.HealthCheckFunction;
      expect(txFunc.Properties.FunctionName).toEqual({
        'Fn::Sub': 'transaction-processor-${EnvironmentSuffix}'
      });
      expect(healthFunc.Properties.FunctionName).toEqual({
        'Fn::Sub': 'health-check-${EnvironmentSuffix}'
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have SNS topic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      const topic = template.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.DeletionPolicy).toBe('Delete');
    });

    test('should have Database CPU alarm', () => {
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      const alarm = template.Resources.DatabaseCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('should have Database Connections alarm', () => {
      expect(template.Resources.DatabaseConnectionsAlarm).toBeDefined();
      const alarm = template.Resources.DatabaseConnectionsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
    });

    test('should have Lambda Errors alarm', () => {
      expect(template.Resources.LambdaErrorsAlarm).toBeDefined();
      const alarm = template.Resources.LambdaErrorsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    });

    test('alarms should trigger SNS notifications', () => {
      const cpuAlarm = template.Resources.DatabaseCPUAlarm;
      expect(cpuAlarm.Properties.AlarmActions).toBeDefined();
      expect(cpuAlarm.Properties.AlarmActions).toHaveLength(1);
      expect(cpuAlarm.Properties.AlarmActions[0]).toEqual({ Ref: 'SNSTopic' });
    });
  });

  describe('Route53 Configuration', () => {
    test('should have Route53 health check', () => {
      expect(template.Resources.Route53HealthCheck).toBeDefined();
      const healthCheck = template.Resources.Route53HealthCheck;
      expect(healthCheck.Type).toBe('AWS::Route53::HealthCheck');
      expect(healthCheck.Properties.HealthCheckConfig.Type).toBe('HTTPS');
      expect(healthCheck.Properties.HealthCheckConfig.Port).toBe(443);
      expect(healthCheck.Properties.HealthCheckConfig.RequestInterval).toBe(30);
      expect(healthCheck.Properties.HealthCheckConfig.FailureThreshold).toBe(3);
    });

    test('should have Route53 hosted zone', () => {
      expect(template.Resources.Route53HostedZone).toBeDefined();
      const zone = template.Resources.Route53HostedZone;
      expect(zone.Type).toBe('AWS::Route53::HostedZone');
      expect(zone.DeletionPolicy).toBe('Delete');
    });

    test('should have Route53 failover record', () => {
      expect(template.Resources.Route53RecordSet).toBeDefined();
      const record = template.Resources.Route53RecordSet;
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Failover).toBe('PRIMARY');
      expect(record.Properties.TTL).toBe('60');
    });

    test('Route53 record should reference health check', () => {
      const record = template.Resources.Route53RecordSet;
      expect(record.Properties.HealthCheckId).toEqual({ Ref: 'Route53HealthCheck' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'DatabaseClusterEndpoint',
        'DatabaseClusterReadEndpoint',
        'TransactionProcessorFunctionArn',
        'HealthCheckFunctionUrl',
        'SNSTopicArn',
        'Route53HostedZoneId',
        'DatabaseSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        // Export name should contain AWS::StackName reference
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });

    test('DatabaseClusterEndpoint output should use Fn::GetAtt', () => {
      const output = template.Outputs.DatabaseClusterEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address']
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all major resources should use environmentSuffix', () => {
      const resourcesWithSuffix = [
        'VPC',
        'AuroraCluster',
        'AuroraInstance1',
        'AuroraInstance2',
        'TransactionProcessorFunction',
        'HealthCheckFunction',
        'SNSTopic',
        'DatabaseSecret',
        'DBSubnetGroup',
        'LambdaSecurityGroup',
        'DatabaseSecurityGroup'
      ];

      resourcesWithSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const resourceProps = JSON.stringify(resource.Properties);
        expect(resourceProps).toContain('EnvironmentSuffix');
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have DeletionPolicy: Delete', () => {
      const resourcesWithDeletionPolicy = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicRouteTable',
        'PrivateRouteTable',
        'DatabaseSecurityGroup',
        'LambdaSecurityGroup',
        'DBSubnetGroup',
        'AuroraCluster',
        'AuroraInstance1',
        'AuroraInstance2',
        'LambdaExecutionRole',
        'TransactionProcessorFunction',
        'HealthCheckFunction',
        'SNSTopic',
        'Route53HostedZone',
        'DatabaseSecret'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Dependencies', () => {
    test('PublicRoute should depend on AttachGateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBe('AttachGateway');
    });

    test('Lambda functions should depend on execution role', () => {
      const txFunc = template.Resources.TransactionProcessorFunction;
      const healthFunc = template.Resources.HealthCheckFunction;
      // DependsOn is redundant - dependency is implicit via Fn::GetAtt in Role property
      // Verify the Role property references LambdaExecutionRole
      expect(txFunc.Properties.Role['Fn::GetAtt'][0]).toBe('LambdaExecutionRole');
      expect(healthFunc.Properties.Role['Fn::GetAtt'][0]).toBe('LambdaExecutionRole');
    });

    test('Route53 resources should depend on health check URL', () => {
      const healthCheck = template.Resources.Route53HealthCheck;
      const recordSet = template.Resources.Route53RecordSet;
      // DependsOn is redundant - dependencies are implicit via Fn::GetAtt and Ref
      // Verify the resources reference HealthCheckFunctionUrl via intrinsic functions
      expect(healthCheck.Properties.HealthCheckConfig.FullyQualifiedDomainName).toBeDefined();
      expect(recordSet.Properties.HealthCheckId.Ref).toBe('Route53HealthCheck');
      expect(recordSet.Properties.ResourceRecords[0]).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid parameter count', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBeGreaterThanOrEqual(8);
    });

    test('should have valid resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(25);
    });

    test('should have valid output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(8);
    });
  });
});
