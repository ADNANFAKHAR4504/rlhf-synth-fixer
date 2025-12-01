import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Loan Processing Application', () => {
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
      expect(template.Description).toContain('Loan Processing Application Infrastructure');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have exactly 52 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(52);
    });

    test('should have exactly 9 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(9);
    });

    test('should have exactly 11 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have ContainerImage parameter', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.ContainerImage.Type).toBe('String');
      expect(template.Parameters.ContainerImage.Default).toBe('nginx:latest');
    });

    test('should have CertificateArn parameter', () => {
      expect(template.Parameters.CertificateArn).toBeDefined();
      expect(template.Parameters.CertificateArn.Type).toBe('String');
    });

    test('should have DBMasterUsername parameter with NoEcho', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.NoEcho).toBe(true);
      expect(template.Parameters.DBMasterUsername.Default).toBe('dbadmin');
    });

    test('should have DBMasterPassword parameter with NoEcho and MinLength', () => {
      expect(template.Parameters.DBMasterPassword).toBeDefined();
      expect(template.Parameters.DBMasterPassword.NoEcho).toBe(true);
      expect(template.Parameters.DBMasterPassword.MinLength).toBe(8);
    });

    test('should have task count parameters', () => {
      expect(template.Parameters.DesiredTaskCount).toBeDefined();
      expect(template.Parameters.MinTaskCount).toBeDefined();
      expect(template.Parameters.MaxTaskCount).toBeDefined();
      expect(template.Parameters.DesiredTaskCount.Default).toBe(2);
      expect(template.Parameters.MinTaskCount.Default).toBe(2);
      expect(template.Parameters.MaxTaskCount.Default).toBe(10);
    });
  });

  describe('Conditions', () => {
    test('should have HasCertificate condition', () => {
      expect(template.Conditions.HasCertificate).toBeDefined();
      expect(template.Conditions.HasCertificate['Fn::Not']).toBeDefined();
    });

    test('should have UseSecretsManager condition', () => {
      expect(template.Conditions.UseSecretsManager).toBeDefined();
      expect(template.Conditions.UseSecretsManager['Fn::Not']).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });

    test('should have 3 NAT Gateways with Elastic IPs', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway3EIP).toBeDefined();
    });

    test('NAT Gateway EIPs should have correct domain', () => {
      expect(template.Resources.NatGateway1EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NatGateway2EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NatGateway3EIP.Properties.Domain).toBe('vpc');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443)).toBe(true);
    });

    test('should have ECS Task security group', () => {
      const sg = template.Resources.ECSTaskSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS security group should allow PostgreSQL port 5432', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].ToPort).toBe(5432);
      expect(ingress[0].IpProtocol).toBe('tcp');
    });
  });

  describe('Aurora Database Resources', () => {
    test('should have DB Subnet Group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have KMS key for database encryption', () => {
      const kmsKey = template.Resources.DBEncryptionKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.DBEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have Aurora cluster', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora cluster should use aurora-postgresql engine', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.EngineMode).toBe('provisioned');
    });

    test('Aurora cluster should use correct engine version', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.EngineVersion).toBe('15.13');
    });

    test('Aurora cluster should have Serverless v2 scaling configuration', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.Properties.ServerlessV2ScalingConfiguration.MinCapacity).toBe(0.5);
      expect(cluster.Properties.ServerlessV2ScalingConfiguration.MaxCapacity).toBe(4);
    });

    test('Aurora cluster should use KMS encryption for backups', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('Aurora cluster should have backup retention enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('Aurora cluster should have MasterUsername configured', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.MasterUsername).toBeDefined();
      expect(cluster.Properties.MasterUsername.Ref).toBe('DBMasterUsername');
    });

    test('Aurora cluster should have ManageMasterUserPassword enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.ManageMasterUserPassword).toBe(true);
    });

    test('Aurora cluster should have MasterUserSecret configured', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.MasterUserSecret).toBeDefined();
      expect(cluster.Properties.MasterUserSecret['Fn::If']).toBeDefined();
      // Verify the structure has SecretArn in both branches
      const ifCondition = cluster.Properties.MasterUserSecret['Fn::If'];
      expect(ifCondition[1].SecretArn).toBeDefined();
      expect(ifCondition[2].SecretArn).toBeDefined();
    });

    test('should have two Aurora instances for Multi-AZ', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();
      expect(template.Resources.AuroraInstance1.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.AuroraInstance2.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Aurora instances should use db.serverless class', () => {
      expect(template.Resources.AuroraInstance1.Properties.DBInstanceClass).toBe('db.serverless');
      expect(template.Resources.AuroraInstance2.Properties.DBInstanceClass).toBe('db.serverless');
    });
  });

  describe('S3 Document Storage', () => {
    test('should have S3 bucket for documents', () => {
      const bucket = template.Resources.DocumentBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.DocumentBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.DocumentBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('S3 bucket should have lifecycle configuration', () => {
      const bucket = template.Resources.DocumentBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.DocumentBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });
  });

  describe('ECS Fargate Resources', () => {
    test('should have ECS cluster', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should have CloudWatch log group with 365-day retention', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });

    test('should have ECS task definition', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef).toBeDefined();
      expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('ECS task definition should use Fargate', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('ECS task definition should have correct CPU and memory', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.Cpu).toBe('512');
      expect(taskDef.Properties.Memory).toBe('1024');
    });

    test('should have ECS task execution role', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECS task role with S3 access', () => {
      const role = template.Resources.ECSTaskRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECS service', () => {
      const service = template.Resources.ECSService;
      expect(service).toBeDefined();
      expect(service.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should use Fargate launch type', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECS service should have load balancer configuration', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LoadBalancers).toBeDefined();
      expect(service.Properties.LoadBalancers.length).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have target group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBeDefined();
    });

    test('target group should use IP target type for Fargate', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.TargetType).toBe('ip');
    });

    test('should have HTTP listener', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
    });

    test('should have conditional HTTPS listener', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Condition).toBe('HasCertificate');
      expect(listener.Properties.Port).toBe(443);
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have auto scaling target', () => {
      const target = template.Resources.AutoScalingTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
    });

    test('auto scaling target should have min and max capacity', () => {
      const target = template.Resources.AutoScalingTarget;
      expect(target.Properties.MinCapacity).toEqual({ Ref: 'MinTaskCount' });
      expect(target.Properties.MaxCapacity).toEqual({ Ref: 'MaxTaskCount' });
    });

    test('should have auto scaling policy', () => {
      const policy = template.Resources.AutoScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
    });

    test('auto scaling policy should use target tracking', () => {
      const policy = template.Resources.AutoScalingPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('auto scaling policy should use ALB request count metric', () => {
      const policy = template.Resources.AutoScalingPolicy;
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ALBRequestCountPerTarget');
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('VPC should include EnvironmentSuffix in name', () => {
      const vpc = template.Resources.VPC;
      const name = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(name).toBeDefined();
      expect(name.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ECS cluster should include EnvironmentSuffix in name', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('S3 bucket should include EnvironmentSuffix in name', () => {
      const bucket = template.Resources.DocumentBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('CloudWatch log group should include EnvironmentSuffix', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have PublicSubnets output', () => {
      expect(template.Outputs.PublicSubnets).toBeDefined();
    });

    test('should have PrivateSubnets output', () => {
      expect(template.Outputs.PrivateSubnets).toBeDefined();
    });

    test('should have ECS cluster outputs', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
      expect(template.Outputs.ECSServiceName).toBeDefined();
    });

    test('should have Aurora cluster outputs', () => {
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.AuroraClusterReadEndpoint).toBeDefined();
    });

    test('should have S3 bucket output', () => {
      expect(template.Outputs.DocumentBucketName).toBeDefined();
    });

    test('should have ALB outputs', () => {
      expect(template.Outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(template.Outputs.ApplicationLoadBalancerURL).toBeDefined();
    });

    test('should have CloudWatch log group output', () => {
      expect(template.Outputs.LogGroupName).toBeDefined();
    });
  });

  describe('Compliance and Security Requirements', () => {
    test('should NOT have any Retain deletion policies', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(key => {
        const resource = resources[key];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('should NOT have DeletionProtection enabled on Aurora', () => {
      const cluster = template.Resources.AuroraCluster;
      if (cluster.Properties.DeletionProtection !== undefined) {
        expect(cluster.Properties.DeletionProtection).toBe(false);
      }
    });

    test('CloudWatch logs should have exactly 365-day retention for compliance', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });

    test('all compute resources should run in private subnets', () => {
      const service = template.Resources.ECSService;
      const subnets = service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;
      expect(subnets).toBeDefined();
      // Verify references to private subnets
      expect(JSON.stringify(subnets)).toContain('PrivateSubnet');
    });
  });

  describe('Template Validation', () => {
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

    test('all resources should have a Type property', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(key => {
        expect(resources[key].Type).toBeDefined();
        expect(resources[key].Type).toMatch(/^AWS::/);
      });
    });

    test('all parameters should have a Type property', () => {
      const params = template.Parameters;
      Object.keys(params).forEach(key => {
        expect(params[key].Type).toBeDefined();
      });
    });

    test('all outputs should have a Value property', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        expect(outputs[key].Value).toBeDefined();
      });
    });
  });
});
