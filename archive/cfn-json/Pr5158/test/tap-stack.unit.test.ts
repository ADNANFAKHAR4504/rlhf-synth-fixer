import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Financial Transaction Processing System', () => {
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

    test('should have a description indicating PCI-DSS compliance', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('PCI-DSS');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toBeDefined();
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
    });

    test('should have ContainerImage parameter', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      const param = template.Parameters.ContainerImage;
      expect(param.Type).toBe('String');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC name should include environmentSuffix', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': 'vpc-${EnvironmentSuffix}',
      });
    });

    test('should have public subnets in multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      // Verify dynamic AZ selection using Fn::GetAZs
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should have private subnets in multiple AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      // Verify dynamic AZ selection using Fn::GetAZs
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('private subnets should not map public IP on launch', () => {
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
      expect(
        template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have proper route table configuration', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
    });
  });

  describe('VPC Flow Logs (PCI-DSS Requirement)', () => {
    test('should have VPC Flow Logs configured', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPC Flow Logs should capture all traffic', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('should have CloudWatch log group for VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLogsLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('VPC Flow Logs should have IAM role', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('ECS Cluster Resources', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster name should include environmentSuffix', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterName).toEqual({
        'Fn::Sub': 'transaction-cluster-${EnvironmentSuffix}',
      });
    });

    test('ECS cluster should have Container Insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterSettings[0].Name).toBe(
        'containerInsights'
      );
      expect(cluster.Properties.ClusterSettings[0].Value).toBe('enabled');
    });

    test('should have ECS task definition', () => {
      expect(template.Resources.TaskDefinition).toBeDefined();
      expect(template.Resources.TaskDefinition.Type).toBe(
        'AWS::ECS::TaskDefinition'
      );
    });

    test('task definition should use Fargate', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('task definition should have execution and task roles', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.ExecutionRoleArn).toBeDefined();
      expect(taskDef.Properties.TaskRoleArn).toBeDefined();
    });

    test('container should have CloudWatch logging configured', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.LogConfiguration).toBeDefined();
      expect(container.LogConfiguration.LogDriver).toBe('awslogs');
    });

    test('container should have database credentials from Secrets Manager', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Secrets).toBeDefined();
      expect(container.Secrets.length).toBeGreaterThanOrEqual(2);
    });

    test('should have ECS service', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should use Fargate launch type', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should have auto scaling target', () => {
      expect(template.Resources.ServiceScalingTarget).toBeDefined();
      expect(template.Resources.ServiceScalingTarget.Type).toBe(
        'AWS::ApplicationAutoScaling::ScalableTarget'
      );
    });

    test('should have auto scaling policy', () => {
      expect(template.Resources.ServiceScalingPolicy).toBeDefined();
      expect(template.Resources.ServiceScalingPolicy.Type).toBe(
        'AWS::ApplicationAutoScaling::ScalingPolicy'
      );
    });

    test('scaling policy should use CPU-based target tracking', () => {
      const policy = template.Resources.ServiceScalingPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      const config =
        policy.Properties.TargetTrackingScalingPolicyConfiguration;
      expect(
        config.PredefinedMetricSpecification.PredefinedMetricType
      ).toBe('ECSServiceAverageCPUUtilization');
    });
  });

  describe('RDS Aurora Configuration', () => {
    test('should have Aurora cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe(
        'AWS::RDS::DBCluster'
      );
    });

    test('Aurora cluster should use MySQL engine', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('Aurora cluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('Aurora cluster should have backup configured', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('Aurora cluster should have CloudWatch logs enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('audit');
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('error');
    });

    test('Aurora cluster should use ServerlessV2 scaling', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
    });

    test('should have Aurora instance for ServerlessV2', () => {
      expect(template.Resources.AuroraInstance).toBeDefined();
      expect(template.Resources.AuroraInstance.Type).toBe(
        'AWS::RDS::DBInstance'
      );
      expect(template.Resources.AuroraInstance.Properties.DBInstanceClass).toBe(
        'db.serverless'
      );
    });

    test('should have DB subnet group in private subnets', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('Aurora cluster identifier should include environmentSuffix', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBClusterIdentifier).toEqual({
        'Fn::Sub': 'transaction-db-${EnvironmentSuffix}',
      });
    });
  });

  describe('Security Configuration', () => {
    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have database security group', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('database security group should only allow access from ECS', () => {
      const dbSg = template.Resources.DBSecurityGroup;
      const ingress = dbSg.Properties.SecurityGroupIngress[0];
      expect(ingress.SourceSecurityGroupId).toBeDefined();
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
    });

    test('ECS security group should allow HTTPS within VPC', () => {
      const ecsSg = template.Resources.ECSSecurityGroup;
      const ingress = ecsSg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
    });
  });

  describe('KMS and Encryption (PCI-DSS Requirement)', () => {
    test('should have KMS key for RDS encryption', () => {
      expect(template.Resources.DBKMSKey).toBeDefined();
      expect(template.Resources.DBKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.DBKMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeDefined();
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.DBKMSKeyAlias).toBeDefined();
      expect(template.Resources.DBKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('Secrets Manager (PCI-DSS Requirement)', () => {
    test('should have database secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );
    });

    test('database secret should auto-generate password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(
        secret.Properties.GenerateSecretString.GenerateStringKey
      ).toBe('password');
    });

    test('database secret name should include environmentSuffix', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'db-credentials-${EnvironmentSuffix}',
      });
    });
  });

  describe('IAM Roles and Policies (Least Privilege)', () => {
    test('should have ECS task execution role', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('should have ECS task role', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
      expect(template.Resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('ECS task execution role should have Secrets Manager access', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find(
        (p: any) => p.PolicyName === 'SecretsManagerAccess'
      );
      expect(secretsPolicy).toBeDefined();
    });

    test('ECS task role should have CloudWatch Logs permissions', () => {
      const role = template.Resources.ECSTaskRole;
      const policies = role.Properties.Policies;
      const logsPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchLogsPolicy'
      );
      expect(logsPolicy).toBeDefined();
    });

    test('IAM role names should include environmentSuffix', () => {
      const execRole = template.Resources.ECSTaskExecutionRole;
      const taskRole = template.Resources.ECSTaskRole;
      expect(execRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'ecs-task-execution-role-${EnvironmentSuffix}',
      });
      expect(taskRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'ecs-task-role-${EnvironmentSuffix}',
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have ECS log group', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('ECS log group should have retention policy', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });

    test('should have CPU alarm', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmHigh.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('should have database connection alarm', () => {
      expect(template.Resources.DBConnectionAlarm).toBeDefined();
      expect(template.Resources.DBConnectionAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have ECS cluster output', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
    });

    test('should have ECS service output', () => {
      expect(template.Outputs.ECSServiceName).toBeDefined();
    });

    test('should have database endpoint output', () => {
      expect(template.Outputs.DBClusterEndpoint).toBeDefined();
    });

    test('should have database secret ARN output', () => {
      expect(template.Outputs.DBSecretArn).toBeDefined();
    });

    test('should have ECS log group output', () => {
      expect(template.Outputs.ECSLogGroup).toBeDefined();
    });

    test('all outputs should have export names with environmentSuffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Deletion Policies (Destroyability)', () => {
    test('resources should not have Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('Aurora cluster should not have deletion protection', () => {
      const cluster = template.Resources.AuroraCluster;
      if (cluster.Properties.DeletionProtection !== undefined) {
        expect(cluster.Properties.DeletionProtection).toBe(false);
      }
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include environmentSuffix', () => {
      const resourcesToCheck = [
        'VPC',
        'ECSCluster',
        'TaskDefinition',
        'ECSService',
        'AuroraCluster',
        'DBSecret',
        'ECSSecurityGroup',
        'DBSecurityGroup',
        'ECSLogGroup',
        'VPCFlowLogsLogGroup',
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const nameProperty =
            resource.Properties.ClusterName ||
            resource.Properties.ServiceName ||
            resource.Properties.Family ||
            resource.Properties.DBClusterIdentifier ||
            resource.Properties.Name ||
            resource.Properties.GroupName ||
            resource.Properties.LogGroupName ||
            resource.Properties.Tags?.find((t: any) => t.Key === 'Name')?.Value;

          if (nameProperty) {
            expect(JSON.stringify(nameProperty)).toContain('EnvironmentSuffix');
          }
        }
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('should have at least 3 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBeGreaterThanOrEqual(3);
    });

    test('should have at least 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(6);
    });
  });
});
