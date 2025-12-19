import fs from 'fs';
import {
  CloudFormationClient,
  ValidateTemplateCommand,
} from '@aws-sdk/client-cloudformation';

// Load CloudFormation template
const template = JSON.parse(
  fs.readFileSync('lib/TapStack.json', 'utf8')
);

const REGION = process.env.AWS_REGION || 'us-east-1';
const cfnClient = new CloudFormationClient({ region: REGION });

describe('Financial Transaction Processing System - Integration Tests', () => {
  describe('Template Validation', () => {
    test('should be valid CloudFormation template', async () => {
      const command = new ValidateTemplateCommand({
        TemplateBody: JSON.stringify(template),
      });

      const response = await cfnClient.send(command);
      expect(response.Parameters).toBeDefined();
      expect(response.Description).toContain('PCI-DSS');
    });

    test('should have correct template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  describe('Infrastructure Components', () => {
    test('should define VPC with proper configuration', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should define subnets with dynamic AZs', () => {
      // Public subnets
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });

      // Private subnets
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should define Internet Gateway and routing', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
    });
  });

  describe('ECS Configuration', () => {
    test('should define ECS cluster with Container Insights', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      const settings = template.Resources.ECSCluster.Properties.ClusterSettings;
      expect(settings).toBeDefined();
      expect(settings[0].Name).toBe('containerInsights');
      expect(settings[0].Value).toBe('enabled');
    });

    test('should define ECS task definition with Fargate', () => {
      expect(template.Resources.TaskDefinition).toBeDefined();
      expect(template.Resources.TaskDefinition.Properties.NetworkMode).toBe('awsvpc');
      expect(template.Resources.TaskDefinition.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(template.Resources.TaskDefinition.Properties.Cpu).toBe('256');
      expect(template.Resources.TaskDefinition.Properties.Memory).toBe('512');
    });

    test('should define ECS service with proper configuration', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Properties.LaunchType).toBe('FARGATE');
      expect(template.Resources.ECSService.Properties.DesiredCount).toBe(1);
    });

    test('should have IAM roles for ECS', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskRole).toBeDefined();
    });

    test('should define CloudWatch log group for ECS', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Properties.RetentionInDays).toBe(90);
    });
  });

  describe('RDS Aurora Configuration', () => {
    test('should define Aurora cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
      expect(template.Resources.AuroraCluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('should have encryption enabled', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.AuroraCluster.Properties.KmsKeyId).toEqual({ Ref: 'DBKMSKey' });
    });

    test('should have backup configured', () => {
      expect(template.Resources.AuroraCluster.Properties.BackupRetentionPeriod).toBe(7);
      expect(template.Resources.AuroraCluster.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('should have CloudWatch logs enabled', () => {
      const logExports = template.Resources.AuroraCluster.Properties.EnableCloudwatchLogsExports;
      expect(logExports).toBeDefined();
      expect(logExports).toContain('audit');
      expect(logExports).toContain('error');
      expect(logExports).toContain('slowquery');
    });

    test('should have ServerlessV2 scaling', () => {
      const scaling = template.Resources.AuroraCluster.Properties.ServerlessV2ScalingConfiguration;
      expect(scaling).toBeDefined();
      expect(scaling.MinCapacity).toBe(0.5);
      expect(scaling.MaxCapacity).toBe(1);
    });

    test('should define Aurora instance', () => {
      expect(template.Resources.AuroraInstance).toBeDefined();
      expect(template.Resources.AuroraInstance.Properties.DBInstanceClass).toBe('db.serverless');
      expect(template.Resources.AuroraInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('should define DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('Security Configuration', () => {
    test('should define security groups', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup).toBeDefined();
    });

    test('should restrict database access to ECS only', () => {
      const dbSg = template.Resources.DBSecurityGroup;
      const ingressRule = dbSg.Properties.SecurityGroupIngress[0];

      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(3306);
      expect(ingressRule.ToPort).toBe(3306);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'ECSSecurityGroup' });
    });

    test('should define KMS key for encryption', () => {
      expect(template.Resources.DBKMSKey).toBeDefined();
      expect(template.Resources.DBKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.DBKMSKeyAlias).toBeDefined();
    });

    test('should define Secrets Manager secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      const secretConfig = template.Resources.DBSecret.Properties.GenerateSecretString;
      expect(secretConfig.PasswordLength).toBe(32);
    });
  });

  describe('Auto Scaling', () => {
    test('should define auto scaling target', () => {
      expect(template.Resources.ServiceScalingTarget).toBeDefined();
      expect(template.Resources.ServiceScalingTarget.Properties.MinCapacity).toBe(1);
      expect(template.Resources.ServiceScalingTarget.Properties.MaxCapacity).toBe(4);
    });

    test('should define auto scaling policy', () => {
      expect(template.Resources.ServiceScalingPolicy).toBeDefined();
      const config = template.Resources.ServiceScalingPolicy.Properties.TargetTrackingScalingPolicyConfiguration;
      expect(config.TargetValue).toBe(70.0);
      expect(config.PredefinedMetricSpecification.PredefinedMetricType).toBe('ECSServiceAverageCPUUtilization');
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should define CloudWatch alarms', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.DBConnectionAlarm).toBeDefined();
    });

    test('should configure CPU alarm properly', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('should configure database connection alarm', () => {
      const alarm = template.Resources.DBConnectionAlarm;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should export ECS cluster name', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
      expect(template.Outputs.ECSClusterName.Value).toEqual({ Ref: 'ECSCluster' });
    });

    test('should export ECS service name', () => {
      expect(template.Outputs.ECSServiceName).toBeDefined();
    });

    test('should export database endpoint', () => {
      expect(template.Outputs.DBClusterEndpoint).toBeDefined();
    });

    test('should export database secret ARN', () => {
      expect(template.Outputs.DBSecretArn).toBeDefined();
      expect(template.Outputs.DBSecretArn.Value).toEqual({ Ref: 'DBSecret' });
    });

    test('should export ECS log group', () => {
      expect(template.Outputs.ECSLogGroup).toBeDefined();
    });

    test('all outputs should have export names with environmentSuffix', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBUsername.NoEcho).toBe(true);
    });

    test('should have ContainerImage parameter', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.ContainerImage.Default).toBe('nginx:latest');
    });
  });

  describe('Resource Naming', () => {
    test('resources should use environmentSuffix in naming', () => {
      const namedResources = ['VPC', 'ECSCluster', 'AuroraCluster'];

      namedResources.forEach((resource) => {
        const tags = template.Resources[resource].Properties.Tags;
        if (tags) {
          const nameTag = tags.find((t: any) => t.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Compliance Features', () => {
    test('should have VPC Flow Logs for audit', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
      expect(template.Resources.VPCFlowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('should use private subnets for database', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      const subnets = subnetGroup.Properties.SubnetIds;
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have proper IAM policies', () => {
      const executionRole = template.Resources.ECSTaskExecutionRole;
      expect(executionRole.Properties.Policies).toBeDefined();
      expect(executionRole.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('should have log retention configured', () => {
      expect(template.Resources.ECSLogGroup.Properties.RetentionInDays).toBe(90);
      expect(template.Resources.VPCFlowLogsLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });
});
