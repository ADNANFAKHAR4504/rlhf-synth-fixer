import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Payment Processing Infrastructure', () => {
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
      expect(template.Description).toContain('High Availability');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      expect(template.Parameters.AlertEmail.Type).toBe('String');
      expect(template.Parameters.AlertEmail.Default).toBe('ops@example.com');
    });

    test('should have ContainerImage parameter', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.ContainerImage.Default).toBe('nginx:latest');
    });
  });

  describe('KMS Encryption Resources', () => {
    test('should have KMS encryption key', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have key rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key alias should include environmentSuffix', () => {
      const alias = template.Resources.EncryptionKeyAlias;
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/payment-processing-${EnvironmentSuffix}'
      });
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have DB credentials secret', () => {
      expect(template.Resources.DBCredentialsSecret).toBeDefined();
      expect(template.Resources.DBCredentialsSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DB credentials secret should generate password', () => {
      const secret = template.Resources.DBCredentialsSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
    });

    test('DB credentials secret should have environmentSuffix in name', () => {
      const secret = template.Resources.DBCredentialsSecret;
      expect(secret.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnetAZ1).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2).toBeDefined();
      expect(template.Resources.PublicSubnetAZ3).toBeDefined();
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnetAZ1).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3).toBeDefined();
    });

    test('public subnets should be in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnetAZ1;
      const subnet2 = template.Resources.PublicSubnetAZ2;
      const subnet3 = template.Resources.PublicSubnetAZ3;

      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(subnet3.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [2, { 'Fn::GetAZs': '' }] });
    });

    test('private subnets should be in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnetAZ1;
      const subnet2 = template.Resources.PrivateSubnetAZ2;
      const subnet3 = template.Resources.PrivateSubnetAZ3;

      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(subnet3.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [2, { 'Fn::GetAZs': '' }] });
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have EIP for NAT Gateway', () => {
      expect(template.Resources.EIPForNATGateway).toBeDefined();
      expect(template.Resources.EIPForNATGateway.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ECS security group should allow traffic from ALB', () => {
      const sg = template.Resources.ECSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should have RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS security group should allow PostgreSQL from ECS', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ECSSecurityGroup' });
    });
  });

  describe('Aurora PostgreSQL Resources', () => {
    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB subnet group should include all 3 private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('should have Aurora cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora cluster should use PostgreSQL engine', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('Aurora cluster should have correct deletion policy', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });

    test('Aurora cluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('Aurora cluster should have backup retention configured', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(1);
    });

    test('should have 3 DB instances (writer + 2 readers)', () => {
      expect(template.Resources.AuroraInstanceWriter).toBeDefined();
      expect(template.Resources.AuroraInstanceReader1).toBeDefined();
      expect(template.Resources.AuroraInstanceReader2).toBeDefined();
    });

    test('DB instances should be in different AZs', () => {
      const writer = template.Resources.AuroraInstanceWriter;
      const reader1 = template.Resources.AuroraInstanceReader1;
      const reader2 = template.Resources.AuroraInstanceReader2;

      expect(writer.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(reader1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(reader2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [2, { 'Fn::GetAZs': '' }] });
    });

    test('all DB instances should have deletion policy Delete', () => {
      expect(template.Resources.AuroraInstanceWriter.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraInstanceReader1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraInstanceReader2.DeletionPolicy).toBe('Delete');
    });
  });

  describe('ECS Resources', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should have container insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      const settings = cluster.Properties.ClusterSettings;

      expect(settings).toHaveLength(1);
      expect(settings[0].Name).toBe('containerInsights');
      expect(settings[0].Value).toBe('enabled');
    });

    test('should have ECS task execution role', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECS task role', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
      expect(template.Resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECS task definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('task definition should be Fargate compatible', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('task definition should have correct resource limits', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.Cpu).toBe('256');
      expect(taskDef.Properties.Memory).toBe('512');
    });

    test('should have ECS service', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should have desired count of 6', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DesiredCount).toBe(6);
    });

    test('ECS service should use Fargate launch type', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECS service should have correct deployment configuration', () => {
      const service = template.Resources.ECSService;
      const deployConfig = service.Properties.DeploymentConfiguration;

      expect(deployConfig.MinimumHealthyPercent).toBe(100);
      expect(deployConfig.MaximumPercent).toBe(200);
    });

    test('ECS service should have circuit breaker enabled', () => {
      const service = template.Resources.ECSService;
      const circuitBreaker = service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker;

      expect(circuitBreaker.Enable).toBe(true);
      expect(circuitBreaker.Rollback).toBe(true);
    });

    test('ECS service should be deployed across 3 subnets', () => {
      const service = template.Resources.ECSService;
      const subnets = service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;

      expect(subnets).toHaveLength(3);
    });

    test('should have CloudWatch log group for ECS', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should span 3 subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(3);
    });

    test('ALB should have cross-zone load balancing enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attrs = alb.Properties.LoadBalancerAttributes;

      const crossZoneAttr = attrs.find((a: any) => a.Key === 'load_balancing.cross_zone.enabled');
      expect(crossZoneAttr.Value).toBe('true');
    });

    test('should have target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should have health checks every 5 seconds', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(5);
    });

    test('target group should have connection draining configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      const attrs = tg.Properties.TargetGroupAttributes;

      const deregAttr = attrs.find((a: any) => a.Key === 'deregistration_delay.timeout_seconds');
      expect(deregAttr.Value).toBe('30');
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have auto scaling role', () => {
      expect(template.Resources.ServiceAutoScalingRole).toBeDefined();
      expect(template.Resources.ServiceAutoScalingRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have auto scaling target', () => {
      expect(template.Resources.ServiceAutoScalingTarget).toBeDefined();
      expect(template.Resources.ServiceAutoScalingTarget.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
    });

    test('auto scaling target should maintain 6 tasks', () => {
      const target = template.Resources.ServiceAutoScalingTarget;
      expect(target.Properties.MinCapacity).toBe(6);
      expect(target.Properties.MaxCapacity).toBe(6);
    });

    test('should have scaling policy', () => {
      expect(template.Resources.ServiceScalingPolicy).toBeDefined();
      expect(template.Resources.ServiceScalingPolicy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have SNS alert topic', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should have RDS failover alarm', () => {
      expect(template.Resources.RDSFailoverAlarm).toBeDefined();
      expect(template.Resources.RDSFailoverAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('RDS alarm should trigger within 60 seconds', () => {
      const alarm = template.Resources.RDSFailoverAlarm;
      expect(alarm.Properties.Period).toBe(60);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
    });

    test('should have ECS task failure alarm', () => {
      expect(template.Resources.ECSTaskFailureAlarm).toBeDefined();
      expect(template.Resources.ECSTaskFailureAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('ECS alarm should alert when tasks drop below 6', () => {
      const alarm = template.Resources.ECSTaskFailureAlarm;
      expect(alarm.Properties.Threshold).toBe(6);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should have ALB unhealthy target alarm', () => {
      expect(template.Resources.ALBUnhealthyTargetAlarm).toBeDefined();
      expect(template.Resources.ALBUnhealthyTargetAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ALB high response time alarm', () => {
      expect(template.Resources.ALBHighResponseTimeAlarm).toBeDefined();
      expect(template.Resources.ALBHighResponseTimeAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.FailoverDashboard).toBeDefined();
      expect(template.Resources.FailoverDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('all alarms should publish to SNS topic', () => {
      const alarms = [
        template.Resources.RDSFailoverAlarm,
        template.Resources.ECSTaskFailureAlarm,
        template.Resources.ALBUnhealthyTargetAlarm,
        template.Resources.ALBHighResponseTimeAlarm
      ];

      alarms.forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'AlertTopic' });
      });
    });
  });

  describe('Systems Manager Parameters', () => {
    test('should have SSM parameter for DB endpoint', () => {
      expect(template.Resources.SSMParameterDBEndpoint).toBeDefined();
      expect(template.Resources.SSMParameterDBEndpoint.Type).toBe('AWS::SSM::Parameter');
    });

    test('should have SSM parameter for DB reader endpoint', () => {
      expect(template.Resources.SSMParameterDBReaderEndpoint).toBeDefined();
      expect(template.Resources.SSMParameterDBReaderEndpoint.Type).toBe('AWS::SSM::Parameter');
    });

    test('should have SSM parameter for DB credentials secret ARN', () => {
      expect(template.Resources.SSMParameterDBCredentialsSecret).toBeDefined();
      expect(template.Resources.SSMParameterDBCredentialsSecret.Type).toBe('AWS::SSM::Parameter');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'AuroraClusterEndpoint',
        'AuroraReaderEndpoint',
        'LoadBalancerDNS',
        'ECSClusterName',
        'ECSServiceName',
        'CloudWatchDashboard',
        'KMSKeyId',
        'SNSTopicArn'
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (outputKey !== 'CloudWatchDashboard') {
          expect(output.Export).toBeDefined();
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include environmentSuffix', () => {
      const resourcesToCheck = [
        'EncryptionKeyAlias',
        'VPC',
        'InternetGateway',
        'PublicSubnetAZ1',
        'DBSubnetGroup',
        'AuroraCluster',
        'AuroraInstanceWriter',
        'ECSCluster',
        'ECSTaskExecutionRole',
        'ECSTaskRole',
        'ApplicationLoadBalancer',
        'AlertTopic'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const props = JSON.stringify(resource.Properties);
        expect(props).toContain('EnvironmentSuffix');
      });
    });
  });

  describe('Deletion Policies', () => {
    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('Aurora resources should have Delete deletion policy', () => {
      expect(template.Resources.AuroraCluster.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraInstanceWriter.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraInstanceReader1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraInstanceReader2.DeletionPolicy).toBe('Delete');
    });
  });

  describe('High Availability Configuration', () => {
    test('should span 3 availability zones', () => {
      // Verify that resources use GetAZs function for dynamic AZ selection
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::GetAZs');
      expect(templateStr).toContain('Fn::Select');

      // Verify multiple AZ selections (0, 1, 2)
      expect(templateStr).toMatch(/\"Fn::Select\":\s*\[\s*0/);
      expect(templateStr).toMatch(/\"Fn::Select\":\s*\[\s*1/);
      expect(templateStr).toMatch(/\"Fn::Select\":\s*\[\s*2/);
    });

    test('should have multi-AZ database configuration', () => {
      const writer = template.Resources.AuroraInstanceWriter;
      const reader1 = template.Resources.AuroraInstanceReader1;
      const reader2 = template.Resources.AuroraInstanceReader2;

      expect(writer.Properties.AvailabilityZone).toBeDefined();
      expect(reader1.Properties.AvailabilityZone).toBeDefined();
      expect(reader2.Properties.AvailabilityZone).toBeDefined();
    });

    test('should have multi-AZ ECS deployment', () => {
      const service = template.Resources.ECSService;
      const subnets = service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;
      expect(subnets).toHaveLength(3);
    });

    test('should have multi-AZ load balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(3);
    });
  });

  describe('Security Configuration', () => {
    test('should have encryption at rest for Aurora', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should use customer managed KMS keys', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['EncryptionKey', 'Arn']
      });
    });

    test('should have proper IAM roles for ECS', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskRole).toBeDefined();
    });

    test('should follow principle of least privilege for security groups', () => {
      const ecsSecurityGroup = template.Resources.ECSSecurityGroup;
      const rdsSecurityGroup = template.Resources.RDSSecurityGroup;

      // ECS should only accept from ALB
      expect(ecsSecurityGroup.Properties.SecurityGroupIngress).toHaveLength(1);

      // RDS should only accept from ECS
      expect(rdsSecurityGroup.Properties.SecurityGroupIngress).toHaveLength(1);
    });
  });
});
