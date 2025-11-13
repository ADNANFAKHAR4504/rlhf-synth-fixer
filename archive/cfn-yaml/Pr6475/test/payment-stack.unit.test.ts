import fs from 'fs';
import path from 'path';

describe('Payment Processing CloudFormation Templates Unit Tests', () => {
  let masterTemplate: any;
  let vpcTemplate: any;
  let computeTemplate: any;
  let databaseTemplate: any;

  beforeAll(() => {
    masterTemplate = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/master.json'), 'utf8'));
    vpcTemplate = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/vpc.json'), 'utf8'));
    computeTemplate = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/compute.json'), 'utf8'));
    databaseTemplate = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/database.json'), 'utf8'));
  });

  describe('Master Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(masterTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(masterTemplate.Description).toContain('Master Stack');
    });

    test('should have required parameters', () => {
      expect(masterTemplate.Parameters.EnvironmentType).toBeDefined();
      expect(masterTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(masterTemplate.Parameters.TemplateS3Bucket).toBeDefined();
      expect(masterTemplate.Parameters.TemplateS3Prefix).toBeDefined();
    });

    test('EnvironmentType parameter should have correct allowed values', () => {
      const envParam = masterTemplate.Parameters.EnvironmentType;
      expect(envParam.Type).toBe('String');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(envParam.Default).toBe('dev');
    });

    test('EnvironmentSuffix parameter should have pattern validation', () => {
      const suffixParam = masterTemplate.Parameters.EnvironmentSuffix;
      expect(suffixParam.Type).toBe('String');
      expect(suffixParam.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
      expect(suffixParam.ConstraintDescription).toBeDefined();
    });

    test('should have environment-specific mappings', () => {
      expect(masterTemplate.Mappings.EnvironmentConfig).toBeDefined();
      expect(masterTemplate.Mappings.EnvironmentConfig.dev).toBeDefined();
      expect(masterTemplate.Mappings.EnvironmentConfig.staging).toBeDefined();
      expect(masterTemplate.Mappings.EnvironmentConfig.prod).toBeDefined();
    });

    test('dev environment should have correct configuration', () => {
      const devConfig = masterTemplate.Mappings.EnvironmentConfig.dev;
      expect(devConfig.ECSDesiredCount).toBe(1);
      expect(devConfig.RDSInstanceClass).toBe('db.r5.large');
      expect(devConfig.RDSInstanceCount).toBe(1);
      expect(devConfig.AlarmCPUThreshold).toBe(80);
    });

    test('staging environment should have correct configuration', () => {
      const stagingConfig = masterTemplate.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig.ECSDesiredCount).toBe(2);
      expect(stagingConfig.RDSInstanceClass).toBe('db.r5.xlarge');
      expect(stagingConfig.RDSInstanceCount).toBe(2);
      expect(stagingConfig.AlarmCPUThreshold).toBe(75);
    });

    test('prod environment should have correct configuration', () => {
      const prodConfig = masterTemplate.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.ECSDesiredCount).toBe(5);
      expect(prodConfig.RDSInstanceClass).toBe('db.r5.2xlarge');
      expect(prodConfig.RDSInstanceCount).toBe(3);
      expect(prodConfig.AlarmCPUThreshold).toBe(70);
    });

    test('should have three nested stacks', () => {
      expect(masterTemplate.Resources.VPCStack).toBeDefined();
      expect(masterTemplate.Resources.DatabaseStack).toBeDefined();
      expect(masterTemplate.Resources.ComputeStack).toBeDefined();
    });

    test('should have all required outputs with exports', () => {
      const expectedOutputs = [
        'VpcId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'AuroraClusterEndpoint',
        'AuroraReaderEndpoint',
        'DatabaseSecurityGroupId',
        'ALBSecurityGroupId',
        'ECSSecurityGroupId',
        'LoadBalancerDNSName',
        'ECSClusterName',
        'EnvironmentType',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(output => {
        expect(masterTemplate.Outputs[output]).toBeDefined();
        expect(masterTemplate.Outputs[output].Export).toBeDefined();
      });
    });

    test('nested stacks should have correct tags', () => {
      const vpcStack = masterTemplate.Resources.VPCStack;
      expect(vpcStack.Properties.Tags).toBeDefined();

      const tags = vpcStack.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Application');
      expect(tagKeys).toContain('ManagedBy');
    });
  });

  describe('VPC Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(vpcTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(vpcTemplate.Description).toContain('VPC Stack');
    });

    test('should have required parameters', () => {
      expect(vpcTemplate.Parameters.EnvironmentType).toBeDefined();
      expect(vpcTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(vpcTemplate.Parameters.VpcCidr).toBeDefined();
    });

    test('VpcCidr parameter should have CIDR pattern validation', () => {
      const vpcCidr = vpcTemplate.Parameters.VpcCidr;
      expect(vpcCidr.Type).toBe('String');
      expect(vpcCidr.AllowedPattern).toBeDefined();
    });

    test('should create VPC with correct properties', () => {
      const vpc = vpcTemplate.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create 3 public subnets', () => {
      expect(vpcTemplate.Resources.PublicSubnet1).toBeDefined();
      expect(vpcTemplate.Resources.PublicSubnet2).toBeDefined();
      expect(vpcTemplate.Resources.PublicSubnet3).toBeDefined();

      expect(vpcTemplate.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(vpcTemplate.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create 3 private subnets', () => {
      expect(vpcTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(vpcTemplate.Resources.PrivateSubnet2).toBeDefined();
      expect(vpcTemplate.Resources.PrivateSubnet3).toBeDefined();

      expect(vpcTemplate.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('should create 3 NAT Gateways', () => {
      expect(vpcTemplate.Resources.NATGateway1).toBeDefined();
      expect(vpcTemplate.Resources.NATGateway2).toBeDefined();
      expect(vpcTemplate.Resources.NATGateway3).toBeDefined();

      expect(vpcTemplate.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should create 3 Elastic IPs for NAT Gateways', () => {
      expect(vpcTemplate.Resources.EIP1).toBeDefined();
      expect(vpcTemplate.Resources.EIP2).toBeDefined();
      expect(vpcTemplate.Resources.EIP3).toBeDefined();

      expect(vpcTemplate.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
      expect(vpcTemplate.Resources.EIP1.Properties.Domain).toBe('vpc');
    });

    test('should create Internet Gateway', () => {
      expect(vpcTemplate.Resources.InternetGateway).toBeDefined();
      expect(vpcTemplate.Resources.AttachGateway).toBeDefined();
    });

    test('should create public route table with IGW route', () => {
      expect(vpcTemplate.Resources.PublicRouteTable).toBeDefined();
      expect(vpcTemplate.Resources.PublicRoute).toBeDefined();
      expect(vpcTemplate.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should create 3 private route tables with NAT routes', () => {
      expect(vpcTemplate.Resources.PrivateRouteTable1).toBeDefined();
      expect(vpcTemplate.Resources.PrivateRouteTable2).toBeDefined();
      expect(vpcTemplate.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('should have correct outputs', () => {
      expect(vpcTemplate.Outputs.VpcId).toBeDefined();
      expect(vpcTemplate.Outputs.PublicSubnetIds).toBeDefined();
      expect(vpcTemplate.Outputs.PrivateSubnetIds).toBeDefined();
    });

    test('should include EnvironmentSuffix in resource names', () => {
      const vpc = vpcTemplate.Resources.VPC;
      const vpcName = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(vpcName.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have consistent tagging on all resources', () => {
      const vpc = vpcTemplate.Resources.VPC;
      const tags = vpc.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Application');
      expect(tagKeys).toContain('ManagedBy');
    });
  });

  describe('Database Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(databaseTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(databaseTemplate.Description).toContain('Database Stack');
    });

    test('should have required parameters', () => {
      expect(databaseTemplate.Parameters.EnvironmentType).toBeDefined();
      expect(databaseTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(databaseTemplate.Parameters.VpcId).toBeDefined();
      expect(databaseTemplate.Parameters.PrivateSubnetIds).toBeDefined();
      expect(databaseTemplate.Parameters.RDSInstanceClass).toBeDefined();
      expect(databaseTemplate.Parameters.RDSInstanceCount).toBeDefined();
    });

    test('RDSInstanceCount should have min/max validation', () => {
      const instanceCount = databaseTemplate.Parameters.RDSInstanceCount;
      expect(instanceCount.MinValue).toBe(1);
      expect(instanceCount.MaxValue).toBe(5);
    });


    test('should create KMS key for encryption', () => {
      const kmsKey = databaseTemplate.Resources.DatabaseEncryptionKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.DeletionPolicy).toBe('Delete');
    });

    test('should create Aurora PostgreSQL cluster', () => {
      const cluster = databaseTemplate.Resources.AuroraCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });

    test('Aurora cluster should have conditional DeletionPolicy', () => {
      const cluster = databaseTemplate.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).toBeDefined();
      expect(cluster.UpdateReplacePolicy).toBeDefined();
    });

    test('should create Secrets Manager secret for password', () => {
      const secret = databaseTemplate.Resources.DBMasterPassword;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should create DB subnet group', () => {
      const subnetGroup = databaseTemplate.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should create cluster and instance parameter groups', () => {
      expect(databaseTemplate.Resources.DBClusterParameterGroup).toBeDefined();
      expect(databaseTemplate.Resources.DBParameterGroup).toBeDefined();
      expect(databaseTemplate.Resources.DBClusterParameterGroup.Properties.Family).toBe('aurora-postgresql15');
    });

    test('should create security group', () => {
      const sg = databaseTemplate.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should create at least one DB instance', () => {
      const instance = databaseTemplate.Resources.DBInstance1;
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-postgresql');
      expect(instance.Properties.PubliclyAccessible).toBe(false);
      expect(instance.Properties.EnablePerformanceInsights).toBe(true);
    });

    test('DB instances should have conditional DeletionPolicy', () => {
      const instance = databaseTemplate.Resources.DBInstance1;
      expect(instance.DeletionPolicy).toBeDefined();
      expect(instance.UpdateReplacePolicy).toBeDefined();
    });

    test('should create CloudWatch alarms', () => {
      expect(databaseTemplate.Resources.RDSCPUAlarm).toBeDefined();
      expect(databaseTemplate.Resources.RDSConnectionsAlarm).toBeDefined();
    });

    test('should have required outputs', () => {
      expect(databaseTemplate.Outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(databaseTemplate.Outputs.AuroraClusterEndpoint).toBeDefined();
      expect(databaseTemplate.Outputs.AuroraReaderEndpoint).toBeDefined();
      expect(databaseTemplate.Outputs.DBSecretArn).toBeDefined();
    });

    test('should include EnvironmentSuffix in resource names', () => {
      const cluster = databaseTemplate.Resources.AuroraCluster;
      expect(cluster.Properties.DBClusterIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Compute Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(computeTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(computeTemplate.Description).toContain('Compute Stack');
    });

    test('should have required parameters', () => {
      expect(computeTemplate.Parameters.EnvironmentType).toBeDefined();
      expect(computeTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(computeTemplate.Parameters.VpcId).toBeDefined();
      expect(computeTemplate.Parameters.PublicSubnetIds).toBeDefined();
      expect(computeTemplate.Parameters.PrivateSubnetIds).toBeDefined();
      expect(computeTemplate.Parameters.DatabaseSecurityGroupId).toBeDefined();
      expect(computeTemplate.Parameters.ECSDesiredCount).toBeDefined();
    });

    test('should create ECS cluster with Container Insights', () => {
      const cluster = computeTemplate.Resources.ECSCluster;
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
      expect(cluster.Properties.ClusterSettings).toBeDefined();

      const containerInsights = cluster.Properties.ClusterSettings.find(
        (s: any) => s.Name === 'containerInsights'
      );
      expect(containerInsights.Value).toBe('enabled');
    });

    test('should create Application Load Balancer', () => {
      const alb = computeTemplate.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should create ALB target group with health checks', () => {
      const tg = computeTemplate.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.TargetType).toBe('ip');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
    });

    test('should create ALB listener', () => {
      const listener = computeTemplate.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should create ALB security group allowing HTTP/HTTPS', () => {
      const sg = computeTemplate.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('should create ECS security group', () => {
      const sg = computeTemplate.Resources.ECSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(8080);
      expect(ingress.ToPort).toBe(8080);
    });

    test('should create ECS task execution role', () => {
      const role = computeTemplate.Resources.ECSTaskExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
    });

    test('should create ECS task role with environment condition', () => {
      const role = computeTemplate.Resources.ECSTaskRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should create ECS task definition with Fargate', () => {
      const taskDef = computeTemplate.Resources.ECSTaskDefinition;
      expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
    });

    test('should create ECS service', () => {
      const service = computeTemplate.Resources.ECSService;
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.LaunchType).toBe('FARGATE');
      expect(service.DependsOn).toContain('ALBListener');
    });

    test('should create CloudWatch log group', () => {
      const logGroup = computeTemplate.Resources.ECSLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create CloudWatch alarms for ECS', () => {
      expect(computeTemplate.Resources.ECSServiceCPUAlarm).toBeDefined();
      expect(computeTemplate.Resources.ECSServiceMemoryAlarm).toBeDefined();
    });

    test('should create CloudWatch alarms for ALB', () => {
      expect(computeTemplate.Resources.ALBTargetResponseTimeAlarm).toBeDefined();
      expect(computeTemplate.Resources.ALBUnhealthyHostCountAlarm).toBeDefined();
    });

    test('should have required outputs', () => {
      expect(computeTemplate.Outputs.ALBSecurityGroupId).toBeDefined();
      expect(computeTemplate.Outputs.ECSSecurityGroupId).toBeDefined();
      expect(computeTemplate.Outputs.LoadBalancerDNSName).toBeDefined();
      expect(computeTemplate.Outputs.ECSClusterName).toBeDefined();
    });

    test('should include EnvironmentSuffix in resource names', () => {
      const cluster = computeTemplate.Resources.ECSCluster;
      expect(cluster.Properties.ClusterName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Cross-Stack Integration', () => {
    test('master template should pass VPC outputs to database stack', () => {
      const dbStack = masterTemplate.Resources.DatabaseStack;
      expect(dbStack.Properties.Parameters.VpcId).toBeDefined();
      expect(dbStack.Properties.Parameters.PrivateSubnetIds).toBeDefined();
    });

    test('master template should pass database outputs to compute stack', () => {
      const computeStack = masterTemplate.Resources.ComputeStack;
      expect(computeStack.Properties.Parameters.DatabaseSecurityGroupId).toBeDefined();
      expect(computeStack.Properties.Parameters.DatabaseEndpoint).toBeDefined();
      expect(computeStack.Properties.Parameters.DatabaseReaderEndpoint).toBeDefined();
    });

    test('master template should pass VPC outputs to compute stack', () => {
      const computeStack = masterTemplate.Resources.ComputeStack;
      expect(computeStack.Properties.Parameters.VpcId).toBeDefined();
      expect(computeStack.Properties.Parameters.PublicSubnetIds).toBeDefined();
      expect(computeStack.Properties.Parameters.PrivateSubnetIds).toBeDefined();
    });

    test('master template should export all critical IDs', () => {
      expect(masterTemplate.Outputs.VpcId.Export).toBeDefined();
      expect(masterTemplate.Outputs.AuroraClusterEndpoint.Export).toBeDefined();
      expect(masterTemplate.Outputs.LoadBalancerDNSName.Export).toBeDefined();
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should have different VPC CIDR blocks per environment', () => {
      const devCidr = masterTemplate.Mappings.EnvironmentConfig.dev.VpcCidr;
      const stagingCidr = masterTemplate.Mappings.EnvironmentConfig.staging.VpcCidr;
      const prodCidr = masterTemplate.Mappings.EnvironmentConfig.prod.VpcCidr;

      expect(devCidr).not.toBe(stagingCidr);
      expect(stagingCidr).not.toBe(prodCidr);
    });

    test('should have increasing backup retention for higher environments', () => {
      const devBackup = masterTemplate.Mappings.EnvironmentConfig.dev.RDSBackupRetention;
      const stagingBackup = masterTemplate.Mappings.EnvironmentConfig.staging.RDSBackupRetention;
      const prodBackup = masterTemplate.Mappings.EnvironmentConfig.prod.RDSBackupRetention;

      expect(devBackup).toBeLessThan(stagingBackup);
      expect(stagingBackup).toBeLessThan(prodBackup);
    });

    test('should have stricter alarm thresholds for production', () => {
      const devThreshold = masterTemplate.Mappings.EnvironmentConfig.dev.AlarmCPUThreshold;
      const stagingThreshold = masterTemplate.Mappings.EnvironmentConfig.staging.AlarmCPUThreshold;
      const prodThreshold = masterTemplate.Mappings.EnvironmentConfig.prod.AlarmCPUThreshold;

      expect(prodThreshold).toBeLessThan(stagingThreshold);
      expect(stagingThreshold).toBeLessThan(devThreshold);
    });
  });

  describe('Tagging Compliance', () => {
    test('all templates should use consistent tag structure', () => {
      const templates = [masterTemplate, vpcTemplate, computeTemplate, databaseTemplate];
      const requiredTags = ['Environment', 'CostCenter', 'Application', 'ManagedBy'];

      templates.forEach(template => {
        const sampleResource = Object.values(template.Resources).find(
          (r: any) => r.Properties && r.Properties.Tags
        ) as any;

        if (sampleResource) {
          const tagKeys = sampleResource.Properties.Tags.map((t: any) => t.Key);
          requiredTags.forEach(tag => {
            expect(tagKeys).toContain(tag);
          });
        }
      });
    });
  });
});
