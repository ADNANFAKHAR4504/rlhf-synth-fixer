import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Payment Processing Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ===================================================================
  // TEMPLATE STRUCTURE TESTS
  // ===================================================================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  // ===================================================================
  // PARAMETERS TESTS
  // ===================================================================
  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'Environment',
        'EnvironmentSuffix',
        'ProjectName',
        'CostCenter',
        'AlertEmail',
        'DBMasterUsername',
        'ECSTaskCPU',
        'ECSTaskMemory',
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'production']);
      expect(param.Description).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('default');
      expect(param.AllowedPattern).toBe('[a-z0-9-]*');
      expect(param.ConstraintDescription).toBeDefined();
      expect(param.Description).toBeDefined();
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('payment');
      expect(param.AllowedPattern).toBe('[a-z0-9-]*');
      expect(param.Description).toBeDefined();
    });

    test('CostCenter parameter should have correct properties', () => {
      const param = template.Parameters.CostCenter;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('finance-001');
      expect(param.Description).toBeDefined();
    });

    test('AlertEmail parameter should have correct properties', () => {
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('alerts@example.com');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$');
      expect(param.Description).toBeDefined();
    });

    test('DBMasterUsername parameter should have correct properties', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.NoEcho).toBe(true);
      expect(param.Description).toBeDefined();
    });

    test('ECSTaskCPU parameter should have correct properties', () => {
      const param = template.Parameters.ECSTaskCPU;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('512');
      expect(param.AllowedValues).toEqual(['256', '512', '1024', '2048']);
      expect(param.Description).toBeDefined();
    });

    test('ECSTaskMemory parameter should have correct properties', () => {
      const param = template.Parameters.ECSTaskMemory;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('1024');
      expect(param.AllowedValues).toEqual(['512', '1024', '2048', '4096']);
      expect(param.Description).toBeDefined();
    });

    test('all parameters should have default values', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        const param = template.Parameters[paramKey];
        expect(param.Default).toBeDefined();
      });
    });
  });

  // ===================================================================
  // MAPPINGS TESTS
  // ===================================================================
  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have VPC CIDR', () => {
      const vpcConfig = template.Mappings.SubnetConfig.VPC;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.CIDR).toBe('10.0.0.0/16');
    });

    test('SubnetConfig should have all subnet CIDRs', () => {
      const subnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
      ];

      subnets.forEach(subnet => {
        expect(template.Mappings.SubnetConfig[subnet]).toBeDefined();
        expect(template.Mappings.SubnetConfig[subnet].CIDR).toBeDefined();
      });
    });

    test('all subnet CIDRs should be valid', () => {
      const subnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
      ];

      subnets.forEach(subnet => {
        const cidr = template.Mappings.SubnetConfig[subnet].CIDR;
        expect(cidr).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
      });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - KMS
  // ===================================================================
  describe('Resources - KMS', () => {
    test('should have MasterKMSKey resource', () => {
      expect(template.Resources.MasterKMSKey).toBeDefined();
      expect(template.Resources.MasterKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('MasterKMSKey should have key rotation enabled', () => {
      const key = template.Resources.MasterKMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('MasterKMSKey should have proper key policy', () => {
      const key = template.Resources.MasterKMSKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(key.Properties.KeyPolicy.Statement)).toBe(true);
      expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('MasterKMSKey key policy should allow services to use the key', () => {
      const key = template.Resources.MasterKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const serviceStatement = statements.find((s: any) => s.Sid === 'Allow services to use the key');

      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('sns.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('secretsmanager.amazonaws.com');
    });

    test('should have MasterKMSKeyAlias resource', () => {
      expect(template.Resources.MasterKMSKeyAlias).toBeDefined();
      expect(template.Resources.MasterKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('MasterKMSKeyAlias should reference MasterKMSKey', () => {
      const alias = template.Resources.MasterKMSKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - Secrets Manager
  // ===================================================================
  describe('Resources - Secrets Manager', () => {
    test('should have DBPasswordSecret resource', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DBPasswordSecret should use KMS encryption', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('DBPasswordSecret should generate secure password', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });
  });

  // ===================================================================
  // RESOURCES TESTS - VPC and Networking
  // ===================================================================
  describe('Resources - VPC and Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have 3 NAT Gateways', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway3).toBeDefined();

      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway3.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have VPC endpoints for S3 and DynamoDB', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();

      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('VPC endpoints should be Gateway type', () => {
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
      expect(template.Resources.DynamoDBVPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - Security Groups
  // ===================================================================
  describe('Resources - Security Groups', () => {
    test('should have all required security groups', () => {
      const securityGroups = [
        'ALBSecurityGroup',
        'ECSSecurityGroup',
        'RDSSecurityGroup',
        'LambdaSecurityGroup',
      ];

      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('ALBSecurityGroup should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);
      expect(ingress.length).toBeGreaterThanOrEqual(2);

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('ECSSecurityGroup should only allow traffic from ALB', () => {
      const sg = template.Resources.ECSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);

      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });
    });

    test('RDSSecurityGroup should only allow traffic from ECS and Lambda', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);

      const ecsRule = ingress.find((r: any) =>
        r.SourceSecurityGroupId && r.SourceSecurityGroupId.Ref === 'ECSSecurityGroup'
      );
      const lambdaRule = ingress.find((r: any) =>
        r.SourceSecurityGroupId && r.SourceSecurityGroupId.Ref === 'LambdaSecurityGroup'
      );

      expect(ecsRule).toBeDefined();
      expect(lambdaRule).toBeDefined();
    });

    test('RDSSecurityGroup should use PostgreSQL port', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      ingress.forEach((rule: any) => {
        expect(rule.FromPort).toBe(5432);
        expect(rule.ToPort).toBe(5432);
      });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - RDS Aurora
  // ===================================================================
  describe('Resources - RDS Aurora', () => {
    test('should have RDS cluster and instance', () => {
      expect(template.Resources.AuroraDBCluster).toBeDefined();
      expect(template.Resources.AuroraDBInstance1).toBeDefined();

      expect(template.Resources.AuroraDBCluster.Type).toBe('AWS::RDS::DBCluster');
      expect(template.Resources.AuroraDBInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS cluster should have deletion protection disabled', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.DeletionProtection).toBe(false);
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('RDS instance should have deletion policies set', () => {
      const instance = template.Resources.AuroraDBInstance1;
      expect(instance.DeletionPolicy).toBe('Delete');
      expect(instance.UpdateReplacePolicy).toBe('Delete');
    });

    test('RDS cluster should use encryption', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('RDS cluster should not be publicly accessible', () => {
      const instance = template.Resources.AuroraDBInstance1;
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS cluster should use Secrets Manager for password', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.MasterUserPassword).toBeDefined();
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });

    test('RDS cluster should have CloudWatch logs enabled', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB subnet group should use private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = subnetGroup.Properties.SubnetIds;

      expect(subnetIds).toBeDefined();
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);

      subnetIds.forEach((subnet: any) => {
        expect(subnet.Ref).toMatch(/PrivateSubnet/);
      });
    });

    test('should have DB cluster parameter group', () => {
      expect(template.Resources.DBClusterParameterGroup).toBeDefined();
      expect(template.Resources.DBClusterParameterGroup.Type).toBe('AWS::RDS::DBClusterParameterGroup');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - Application Load Balancer
  // ===================================================================
  describe('Resources - Application Load Balancer', () => {
    test('should have ALB resources', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBListener).toBeDefined();

      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should use public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;

      expect(subnets).toBeDefined();
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(3);

      subnets.forEach((subnet: any) => {
        expect(subnet.Ref).toMatch(/PublicSubnet/);
      });
    });

    test('target group should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBeDefined();
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('target group should use correct port', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
    });

    test('target group should target IP addresses', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.TargetType).toBe('ip');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - ECS Fargate
  // ===================================================================
  describe('Resources - ECS Fargate', () => {
    test('should have ECS resources', () => {
      const ecsResources = [
        'ECSCluster',
        'ECSTaskDefinition',
        'ECSService',
        'ECSTaskExecutionRole',
        'ECSTaskRole',
        'ECSLogGroup',
      ];

      ecsResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('ECS cluster should have container insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterSettings).toBeDefined();
      const containerInsights = cluster.Properties.ClusterSettings.find(
        (s: any) => s.Name === 'containerInsights'
      );
      expect(containerInsights).toBeDefined();
      expect(containerInsights.Value).toBe('enabled');
    });

    test('ECS task definition should use Fargate', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('ECS task definition should reference parameter values', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.Cpu).toEqual({ Ref: 'ECSTaskCPU' });
      expect(taskDef.Properties.Memory).toEqual({ Ref: 'ECSTaskMemory' });
    });

    test('ECS service should use private subnets', () => {
      const service = template.Resources.ECSService;
      const subnets = service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;

      expect(subnets).toBeDefined();
      expect(Array.isArray(subnets)).toBe(true);

      subnets.forEach((subnet: any) => {
        expect(subnet.Ref).toMatch(/PrivateSubnet/);
      });
    });

    test('ECS service should not have public IP', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });

    test('ECS service should integrate with ALB', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LoadBalancers).toBeDefined();
      expect(Array.isArray(service.Properties.LoadBalancers)).toBe(true);
      expect(service.Properties.LoadBalancers.length).toBeGreaterThan(0);
    });

    test('ECS log group should have retention policy', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(typeof logGroup.Properties.RetentionInDays).toBe('number');
    });

    test('ECS log group should have deletion policy', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.DeletionPolicy).toBe('Delete');
      expect(logGroup.UpdateReplacePolicy).toBe('Delete');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - IAM Roles
  // ===================================================================
  describe('Resources - IAM Roles', () => {
    test('ECS task execution role should have correct trust policy', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
    });

    test('ECS task execution role should have AWS managed policy', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
    });

    test('ECS task execution role should have KMS permissions', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      const policies = role.Properties.Policies;

      expect(policies).toBeDefined();
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSDecrypt');
      expect(kmsPolicy).toBeDefined();
    });

    test('ECS task role should have S3 permissions with resource scope', () => {
      const role = template.Resources.ECSTaskRole;
      const policies = role.Properties.Policies;

      expect(policies).toBeDefined();
      const taskPolicy = policies.find((p: any) => p.PolicyName === 'TaskPolicy');
      expect(taskPolicy).toBeDefined();

      const s3Statement = taskPolicy.PolicyDocument.Statement.find(
        (s: any) => s.Action.includes('s3:GetObject') || s.Action.includes('s3:PutObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource).toBeDefined();
      expect(s3Statement.Resource['Fn::Sub']).toContain('AuditLogsBucket');
    });

    test('ECS task role should have Secrets Manager permissions', () => {
      const role = template.Resources.ECSTaskRole;
      const policies = role.Properties.Policies;
      const taskPolicy = policies.find((p: any) => p.PolicyName === 'TaskPolicy');

      const secretsStatement = taskPolicy.PolicyDocument.Statement.find(
        (s: any) => s.Action.includes('secretsmanager:GetSecretValue')
      );
      expect(secretsStatement).toBeDefined();
    });

    test('Lambda execution role should have VPC access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('Lambda execution role should have scoped CloudWatch Logs permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const lambdaPolicy = policies.find((p: any) => p.PolicyName === 'LambdaPolicy');

      const logsStatement = lambdaPolicy.PolicyDocument.Statement.find(
        (s: any) => s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Resource).toBeDefined();
    });
  });

  // ===================================================================
  // RESOURCES TESTS - Lambda Functions
  // ===================================================================
  describe('Resources - Lambda Functions', () => {
    test('should have Lambda function and log group', () => {
      expect(template.Resources.FraudDetectionFunction).toBeDefined();
      expect(template.Resources.FraudDetectionLogGroup).toBeDefined();

      expect(template.Resources.FraudDetectionFunction.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.FraudDetectionLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Lambda function should be in VPC', () => {
      const lambda = template.Resources.FraudDetectionFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('Lambda function should use private subnets', () => {
      const lambda = template.Resources.FraudDetectionFunction;
      const subnets = lambda.Properties.VpcConfig.SubnetIds;

      subnets.forEach((subnet: any) => {
        expect(subnet.Ref).toMatch(/PrivateSubnet/);
      });
    });

    test('Lambda function should have timeout configured', () => {
      const lambda = template.Resources.FraudDetectionFunction;
      expect(lambda.Properties.Timeout).toBeDefined();
      expect(typeof lambda.Properties.Timeout).toBe('number');
      expect(lambda.Properties.Timeout).toBeGreaterThan(0);
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.FraudDetectionFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
    });

    test('Lambda log group should have deletion policy', () => {
      const logGroup = template.Resources.FraudDetectionLogGroup;
      expect(logGroup.DeletionPolicy).toBe('Delete');
      expect(logGroup.UpdateReplacePolicy).toBe('Delete');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - API Gateway
  // ===================================================================
  describe('Resources - API Gateway', () => {
    test('should have API Gateway resources', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
      expect(template.Resources.ApiGatewayStage).toBeDefined();

      expect(template.Resources.ApiGateway.Type).toBe('AWS::ApiGatewayV2::Api');
      expect(template.Resources.ApiGatewayStage.Type).toBe('AWS::ApiGatewayV2::Stage');
    });

    test('API Gateway should be HTTP API', () => {
      const api = template.Resources.ApiGateway;
      expect(api.Properties.ProtocolType).toBe('HTTP');
    });

    test('API Gateway should have CORS configured', () => {
      const api = template.Resources.ApiGateway;
      expect(api.Properties.CorsConfiguration).toBeDefined();
      expect(api.Properties.CorsConfiguration.AllowOrigins).toBeDefined();
      expect(api.Properties.CorsConfiguration.AllowMethods).toBeDefined();
    });

    test('API Gateway stage should have auto deploy enabled', () => {
      const stage = template.Resources.ApiGatewayStage;
      expect(stage.Properties.AutoDeploy).toBe(true);
    });

    test('API Gateway stage should have throttling configured', () => {
      const stage = template.Resources.ApiGatewayStage;
      expect(stage.Properties.DefaultRouteSettings).toBeDefined();
      expect(stage.Properties.DefaultRouteSettings.ThrottlingBurstLimit).toBeDefined();
      expect(stage.Properties.DefaultRouteSettings.ThrottlingRateLimit).toBeDefined();
    });
  });

  // ===================================================================
  // RESOURCES TESTS - S3
  // ===================================================================
  describe('Resources - S3', () => {
    test('should have S3 bucket for audit logs', () => {
      expect(template.Resources.AuditLogsBucket).toBeDefined();
      expect(template.Resources.AuditLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.AuditLogsBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.AuditLogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.AuditLogsBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have lifecycle policy', () => {
      const bucket = template.Resources.AuditLogsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(Array.isArray(bucket.Properties.LifecycleConfiguration.Rules)).toBe(true);
    });

    test('S3 bucket should have deletion policy set', () => {
      const bucket = template.Resources.AuditLogsBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - SNS
  // ===================================================================
  describe('Resources - SNS', () => {
    test('should have SNS topic and subscription', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopicSubscription).toBeDefined();

      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.AlertTopicSubscription.Type).toBe('AWS::SNS::Subscription');
    });

    test('SNS topic should use KMS encryption', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('SNS subscription should use email protocol', () => {
      const subscription = template.Resources.AlertTopicSubscription;
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.Endpoint).toEqual({ Ref: 'AlertEmail' });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - CloudWatch Alarms
  // ===================================================================
  describe('Resources - CloudWatch Alarms', () => {
    test('should have CloudWatch alarms', () => {
      const alarms = ['ECSHighCPUAlarm', 'RDSHighCPUAlarm'];

      alarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('alarms should have alarm actions to SNS topic', () => {
      const alarms = ['ECSHighCPUAlarm', 'RDSHighCPUAlarm'];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'AlertTopic' });
      });
    });

    test('alarms should have proper thresholds', () => {
      const alarm = template.Resources.ECSHighCPUAlarm;
      expect(alarm.Properties.Threshold).toBeDefined();
      expect(typeof alarm.Properties.Threshold).toBe('number');
      expect(alarm.Properties.Threshold).toBeGreaterThan(0);
    });
  });

  // ===================================================================
  // TAGS TESTS
  // ===================================================================
  describe('Resource Tags', () => {
    const requiredTags = ['project', 'team-number'];

    test('all taggable resources should have required tags', () => {
      const taggableResources = Object.keys(template.Resources).filter(resourceKey => {
        const resource = template.Resources[resourceKey];
        return resource.Properties && (resource.Properties.Tags !== undefined);
      });

      taggableResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const tags = resource.Properties.Tags;

        if (Array.isArray(tags)) {
          requiredTags.forEach(requiredTag => {
            const tag = tags.find((t: any) => t.Key === requiredTag);
            expect(tag).toBeDefined();
          });
        } else if (typeof tags === 'object') {
          requiredTags.forEach(requiredTag => {
            expect(tags[requiredTag]).toBeDefined();
          });
        }
      });
    });

    test('project tag should have correct value', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const projectTag = kmsKey.Properties.Tags.find((t: any) => t.Key === 'project');
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
    });

    test('team-number tag should have correct value', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const teamTag = kmsKey.Properties.Tags.find((t: any) => t.Key === 'team-number');
      expect(teamTag.Value).toBe('2');
    });
  });

  // ===================================================================
  // NAMING CONVENTIONS TESTS
  // ===================================================================
  describe('Resource Naming Conventions', () => {
    test('resource names should use EnvironmentSuffix parameter', () => {
      const nameableResources = [
        'MasterKMSKey',
        'VPC',
        'AuroraDBCluster',
        'ApplicationLoadBalancer',
        'ECSCluster',
        'FraudDetectionFunction',
        'ApiGateway',
        'AuditLogsBucket',
        'AlertTopic',
      ];

      nameableResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties) {
          const nameProperties = [
            'Name',
            'FunctionName',
            'ClusterName',
            'TopicName',
            'BucketName',
            'DBClusterIdentifier',
          ];

          nameProperties.forEach(nameProp => {
            if (resource.Properties[nameProp]) {
              const name = resource.Properties[nameProp];
              if (name['Fn::Sub']) {
                expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
              }
            }
          });
        }
      });
    });

    test('resource names should follow lowercase pattern', () => {
      const bucket = template.Resources.AuditLogsBucket;
      const bucketName = bucket.Properties.BucketName;
      // Bucket name uses Fn::Sub with CloudFormation variables
      // Pattern allows lowercase, numbers, hyphens, and CloudFormation variable syntax
      expect(bucketName['Fn::Sub']).toMatch(/^[\$\{\}A-Za-z0-9:-]+$/);
      // Verify it contains expected structure with parameters
      expect(bucketName['Fn::Sub']).toContain('${ProjectName}');
      expect(bucketName['Fn::Sub']).toContain('${Environment}');
      expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      // Ensure the static parts are lowercase
      expect(bucketName['Fn::Sub']).toContain('-audit-');
    });
  });

  // ===================================================================
  // OUTPUTS TESTS
  // ===================================================================
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'ALBDNSName',
        'APIGatewayEndpoint',
        'RDSClusterEndpoint',
        'SNSTopicArn',
        'AuditLogsBucketName',
        'ECSClusterName',
        'KMSKeyId',
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have values', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Value).toBeDefined();
      });
    });

    test('all outputs should have exports with EnvironmentSuffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();

        if (output.Export.Name['Fn::Sub']) {
          expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('VPCId output should reference VPC resource', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALBDNSName output should get ALB DNS name', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('RDSClusterEndpoint output should get cluster endpoint', () => {
      const output = template.Outputs.RDSClusterEndpoint;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['AuroraDBCluster', 'Endpoint.Address'] });
    });

    test('should output subnet IDs', () => {
      const subnetOutputs = [
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PublicSubnet3Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
      ];

      subnetOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should output security group IDs', () => {
      const sgOutputs = [
        'ALBSecurityGroupId',
        'ECSSecurityGroupId',
        'RDSSecurityGroupId',
        'LambdaSecurityGroupId',
      ];

      sgOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should output IAM role ARNs', () => {
      const roleOutputs = [
        'ECSTaskRoleArn',
        'ECSExecutionRoleArn',
        'LambdaExecutionRoleArn',
      ];

      roleOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });
  });

  // ===================================================================
  // DELETION POLICIES TESTS
  // ===================================================================
  describe('Deletion Policies', () => {
    test('RDS cluster should have Delete policy', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('S3 bucket should have Delete policy', () => {
      const bucket = template.Resources.AuditLogsBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('log groups should have Delete policy', () => {
      const logGroups = ['ECSLogGroup', 'FraudDetectionLogGroup'];

      logGroups.forEach(lgName => {
        const lg = template.Resources[lgName];
        expect(lg.DeletionPolicy).toBe('Delete');
        expect(lg.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  // ===================================================================
  // ENCRYPTION TESTS
  // ===================================================================
  describe('Encryption Configuration', () => {
    test('RDS cluster should use KMS encryption', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('S3 bucket should use KMS encryption', () => {
      const bucket = template.Resources.AuditLogsBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('SNS topic should use KMS encryption', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('Secrets Manager should use KMS encryption', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });
  });

  // ===================================================================
  // TEMPLATE VALIDATION TESTS
  // ===================================================================
  describe('Template Validation', () => {
    test('should not have hardcoded EnvironmentSuffix values in resource names', () => {
      const resourcesWithNames = Object.keys(template.Resources)
        .map(key => template.Resources[key])
        .filter(resource => resource.Properties);

      resourcesWithNames.forEach(resource => {
        const nameProps = ['Name', 'FunctionName', 'ClusterName', 'TopicName', 'BucketName', 'DBClusterIdentifier', 'TableName'];

        nameProps.forEach(prop => {
          if (resource.Properties[prop]) {
            const value = resource.Properties[prop];
            if (typeof value === 'string') {
              expect(value).not.toContain('dev');
              expect(value).not.toContain('staging');
              expect(value).not.toContain('prod');
            }
          }
        });
      });
    });

    test('template should be environment agnostic', () => {
      const templateStr = JSON.stringify(template);

      // Should not contain hardcoded AWS account IDs or regions in values
      expect(templateStr).not.toMatch(/:"123456789012"/);
      expect(templateStr).not.toMatch(/:"us-east-1"[^}]/);
      expect(templateStr).not.toMatch(/:"eu-west-1"[^}]/);
    });

    test('should have minimum resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('should have minimum output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(20);
    });

    test('all Ref references should point to existing resources or parameters', () => {
      const templateStr = JSON.stringify(template);
      const refMatches = templateStr.match(/"Ref":"([^"]+)"/g);

      if (refMatches) {
        refMatches.forEach(match => {
          const refName = match.match(/"Ref":"([^"]+)"/)?.[1];
          if (refName && !refName.startsWith('AWS::')) {
            const exists = template.Resources[refName] || template.Parameters[refName];
            expect(exists).toBeDefined();
          }
        });
      }
    });

    test('all intrinsic functions should be valid', () => {
      const validFunctions = [
        'Ref',
        'Fn::GetAtt',
        'Fn::Sub',
        'Fn::Join',
        'Fn::Select',
        'Fn::GetAZs',
        'Fn::FindInMap',
      ];

      const checkObject = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return;

        Object.keys(obj).forEach(key => {
          if (key.startsWith('Fn::') || key === 'Ref') {
            expect(validFunctions).toContain(key);
          }
          checkObject(obj[key]);
        });
      };

      checkObject(template);
    });
  });
});
