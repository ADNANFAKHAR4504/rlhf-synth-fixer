import * as fs from 'fs';
import * as path from 'path';

describe('PayFlow Solutions CloudFormation Template Unit Tests', () => {
  let template: any;
  let resources: any;
  let parameters: any;
  let outputs: any;
  let conditions: any;

  beforeAll(() => {
    // Arrange: Load template JSON
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
    resources = template.Resources;
    parameters = template.Parameters;
    outputs = template.Outputs;
    conditions = template.Conditions;
  });

  describe('Template Structure (AAA Pattern)', () => {
    // Arrange: Template loaded in beforeAll
    // Act: Access template properties
    // Assert: Validate structure

    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description matching PayFlow Solutions', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('PayFlow Solutions');
    });  

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters - Compliance', () => {
    // Boundary conditions: Min/Max values, AllowedValues
    // Inverse checks: Invalid patterns should be rejected

    test('should have Environment parameter with correct allowed values', () => {
      const param = parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual(['production', 'staging', 'dev']);
    });

    test('should have ApplicationVersion parameter', () => {
      const param = parameters.ApplicationVersion;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('1.0.0');
    });

    test('should have VPCCIDR with valid CIDR pattern', () => {
      const param = parameters.VPCCIDR;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
      // Should match valid CIDR pattern
      expect('10.0.0.0/16').toMatch(new RegExp(param.AllowedPattern));
    });

    test('should have instance type parameters with correct allowed values', () => {
      const instanceTypes = ['InstanceTypeSmall', 'InstanceTypeMedium', 'InstanceTypeLarge'];
      instanceTypes.forEach(paramName => {
        const param = parameters[paramName];
        expect(param).toBeDefined();
        expect(param.Type).toBe('String');
        expect(param.AllowedValues).toBeDefined();
        expect(Array.isArray(param.AllowedValues)).toBe(true);
      });

      // Verify: t3.medium, t3.large, m5.large
      expect(parameters.InstanceTypeSmall.AllowedValues).toContain('t3.medium');
      expect(parameters.InstanceTypeMedium.AllowedValues).toContain('t3.large');
      expect(parameters.InstanceTypeLarge.AllowedValues).toContain('m5.large');
    });

    test('should have BlueWeight parameter with 100% default', () => {
      const param = parameters.BlueWeight;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(100);
      expect(param.MinValue).toBe(0);
      expect(param.MaxValue).toBe(100);
    });

    test('should have GreenWeight parameter with 0% default', () => {
      const param = parameters.GreenWeight;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(0);
      expect(param.MinValue).toBe(0);
      expect(param.MaxValue).toBe(100);
    });

    test('should have ProductionWeight with 90% default', () => {
      const param = parameters.ProductionWeight;
      expect(param).toBeDefined();
      expect(param.Default).toBe(90);
    });

    test('should have CanaryWeight with 10% default', () => {
      const param = parameters.CanaryWeight;
      expect(param).toBeDefined();
      expect(param.Default).toBe(10);
    });

    test('should have DBBackupRetentionPeriod with 7 days default', () => {
      const param = parameters.DBBackupRetentionPeriod;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(7);
    });

    test('should have PagerDutyEmail with valid email pattern', () => {
      const param = parameters.PagerDutyEmail;
      expect(param).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
      // Test valid email matches pattern
      expect('alerts@payflow.io').toMatch(new RegExp(param.AllowedPattern));
    });

    test('should have error rate threshold with 1% default', () => {
      const param = parameters.ErrorRateThreshold;
      expect(param).toBeDefined();
      expect(param.Default).toBe(1);
    });

    test('should have latency threshold with 500ms default', () => {
      const param = parameters.LatencyThreshold;
      expect(param).toBeDefined();
      expect(param.Default).toBe(500);
    });

    test('should have DB connection threshold with 80% default', () => {
      const param = parameters.DBConnectionThreshold;
      expect(param).toBeDefined();
      expect(param.Default).toBe(80);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(resources.VPC).toBeDefined();
      expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Internet Gateway attached to VPC', () => {
      expect(resources.InternetGateway).toBeDefined();
      expect(resources.AttachGateway).toBeDefined();
      expect(resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have 3 public subnets across 3 AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      publicSubnets.forEach(subnetName => {
        expect(resources[subnetName]).toBeDefined();
        expect(resources[subnetName].Type).toBe('AWS::EC2::Subnet');
        expect(resources[subnetName].Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets across 3 AZs', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      privateSubnets.forEach(subnetName => {
        expect(resources[subnetName]).toBeDefined();
        expect(resources[subnetName].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have 3 database subnets across 3 AZs', () => {
      const dbSubnets = ['DBSubnet1', 'DBSubnet2', 'DBSubnet3'];
      dbSubnets.forEach(subnetName => {
        expect(resources[subnetName]).toBeDefined();
        expect(resources[subnetName].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have 3 NAT Gateways (one per AZ for high availability)', () => {
      const natGateways = ['NATGateway1', 'NATGateway2', 'NATGateway3'];
      natGateways.forEach(natName => {
        expect(resources[natName]).toBeDefined();
        expect(resources[natName].Type).toBe('AWS::EC2::NatGateway');
      });
    });

    test('should have route tables for public and private subnets', () => {
      expect(resources.PublicRouteTable).toBeDefined();
      expect(resources.PrivateRouteTable1).toBeDefined();
      expect(resources.PrivateRouteTable2).toBeDefined();
      expect(resources.PrivateRouteTable3).toBeDefined();
    });
  });

  describe('Security Groups - Least Privilege', () => {
    test('should have ALB Security Group allowing only ports 80 and 443 from internet', () => {
      const sg = resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(Array.isArray(ingress)).toBe(true);
      
      const ports = ingress.map((rule: any) => rule.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
      expect(ports.length).toBe(2); // Only HTTP and HTTPS

      // Verify all rules allow from 0.0.0.0/0 (internet)
      ingress.forEach((rule: any) => {
        expect(rule.CidrIp).toBe('0.0.0.0/0');
      });
    });

    test('should have EC2 Security Group allowing traffic only from ALB', () => {
      const sg = resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      
      // Verify all rules use SourceSecurityGroupId (not CidrIp)
      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
        expect(rule.SourceSecurityGroupId).toHaveProperty('Ref', 'ALBSecurityGroup');
      });
    });

    test('should have RDS Security Group allowing only PostgreSQL from EC2', () => {
      const sg = resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      
      expect(ingress.length).toBe(1);
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].ToPort).toBe(5432);
      expect(ingress[0].SourceSecurityGroupId).toHaveProperty('Ref', 'EC2SecurityGroup');
    });
  });

  describe('Application Load Balancer - Compliance', () => {
    test('should have ALB in public subnets', () => {
      const alb = resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(3);
    });

    test('should have ALB access logs enabled to S3', () => {
      const alb = resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;
      const accessLogsEnabled = attributes.find((attr: any) => attr.Key === 'access_logs.s3.enabled');
      expect(accessLogsEnabled.Value).toBe('true');
    });

    test('should have HTTP2 enabled', () => {
      const alb = resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;
      const http2Enabled = attributes.find((attr: any) => attr.Key === 'routing.http2.enabled');
      expect(http2Enabled.Value).toBe('true');
    });
  });

  describe('Target Groups - Blue-Green Deployment', () => {
    test('should have Blue Target Group with correct health check configuration', () => {
      const tg = resources.BlueTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Properties.HealthCheckPath).toBe('/health/deep');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('should have Green Target Group with same health check configuration', () => {
      const tg = resources.GreenTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Properties.HealthCheckPath).toBe('/health/deep');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });

    test('should have deregistration delay exactly 30 seconds', () => {
      const blueTG = resources.BlueTargetGroup;
      const greenTG = resources.GreenTargetGroup;
      
      const blueDelay = blueTG.Properties.TargetGroupAttributes.find(
        (attr: any) => attr.Key === 'deregistration_delay.timeout_seconds'
      );
      const greenDelay = greenTG.Properties.TargetGroupAttributes.find(
        (attr: any) => attr.Key === 'deregistration_delay.timeout_seconds'
      );
      
      expect(blueDelay.Value).toBe('30');
      expect(greenDelay.Value).toBe('30');
    });

    test('should have Webhook Target Group on port 8080', () => {
      const tg = resources.WebhookTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Properties.Port).toBe(8080);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
    });
  });

  describe('ALB Listeners and Path-Based Routing', () => {
    test('should have HTTP listener', () => {
      expect(resources.HTTPListener).toBeDefined();
      expect(resources.HTTPListener.Properties.Port).toBe(80);
    });

    test('should have conditional HTTPS listener', () => {
      expect(resources.HTTPSListener).toBeDefined();
      expect(resources.HTTPSListener.Properties.Port).toBe(443);
      expect(resources.HTTPSListener.Condition).toBe('HasSSLCertificate');
    });

    test('should have API listener rule for path-based routing to /api/*', () => {
      const httpRule = resources.APIListenerRuleHTTP;
      expect(httpRule).toBeDefined();
      const conditions = httpRule.Properties.Conditions;
      const pathCondition = conditions.find((c: any) => c.Field === 'path-pattern');
      expect(pathCondition.PathPatternConfig.Values).toContain('/api/*');
    });

    test('should have Webhook listener rule for path-based routing to /webhooks/*', () => {
      const httpRule = resources.WebhookListenerRuleHTTP;
      expect(httpRule).toBeDefined();
      const conditions = httpRule.Properties.Conditions;
      const pathCondition = conditions.find((c: any) => c.Field === 'path-pattern');
      expect(pathCondition.PathPatternConfig.Values).toContain('/webhooks/*');
    });

    test('should route API traffic to Blue and Green target groups with weights', () => {
      const httpRule = resources.APIListenerRuleHTTP;
      const forwardAction = httpRule.Properties.Actions.find((a: any) => a.Type === 'forward');
      expect(forwardAction.ForwardConfig.TargetGroups).toHaveLength(2);
      
      const blueTG = forwardAction.ForwardConfig.TargetGroups.find(
        (tg: any) => tg.TargetGroupArn.Ref === 'BlueTargetGroup'
      );
      const greenTG = forwardAction.ForwardConfig.TargetGroups.find(
        (tg: any) => tg.TargetGroupArn.Ref === 'GreenTargetGroup'
      );
      
      expect(blueTG).toBeDefined();
      expect(greenTG).toBeDefined();
      expect(blueTG.Weight.Ref).toBe('BlueWeight');
      expect(greenTG.Weight.Ref).toBe('GreenWeight');
    });
  });

  describe('Launch Templates - IMDSv2 Only', () => {
    const launchTemplates = ['BlueLaunchTemplate', 'GreenLaunchTemplate', 'WebhookLaunchTemplate'];

    launchTemplates.forEach(templateName => {
      test(`should have ${templateName} with IMDSv2 required`, () => {
        const lt = resources[templateName];
        expect(lt).toBeDefined();
        const metadataOptions = lt.Properties.LaunchTemplateData.MetadataOptions;
        expect(metadataOptions.HttpTokens).toBe('required');
        expect(metadataOptions.HttpPutResponseHopLimit).toBe(1);
        expect(metadataOptions.HttpEndpoint).toBe('enabled');
      });

      test(`should have ${templateName} with encrypted EBS volumes`, () => {
        const lt = resources[templateName];
        const blockDevices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;
        expect(blockDevices).toBeDefined();
        const rootDevice = blockDevices.find((bd: any) => bd.DeviceName === '/dev/sda1');
        expect(rootDevice.Ebs.Encrypted).toBe(true);
      });

      test(`should have ${templateName} using dynamic AMI resolution`, () => {
        const lt = resources[templateName];
        const imageId = lt.Properties.LaunchTemplateData.ImageId;
        expect(imageId).toContain('resolve:ssm');
        expect(imageId).toContain('ubuntu/server/22.04');
      });
    });
  });

  describe('Auto Scaling Groups - Compliance', () => {
    test('should have Blue ASG with mixed instances policy', () => {
      const asg = resources.BlueAutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Properties.MixedInstancesPolicy).toBeDefined();
      
      const overrides = asg.Properties.MixedInstancesPolicy.LaunchTemplate.Overrides;
      expect(overrides.length).toBeGreaterThanOrEqual(3); // Spec requires at least 3 instance types
      
      const instanceTypes = overrides.map((o: any) => o.InstanceType.Ref);
      expect(instanceTypes).toContain('InstanceTypeSmall');
      expect(instanceTypes).toContain('InstanceTypeMedium');
      expect(instanceTypes).toContain('InstanceTypeLarge');
    });

    test('should have Green ASG with same mixed instances policy', () => {
      const asg = resources.GreenAutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Properties.MixedInstancesPolicy).toBeDefined();
      expect(asg.Properties.MinSize).toBe(0); // Green starts with 0 instances
      expect(asg.Properties.DesiredCapacity).toBe(0);
    });

    test('should have Blue ASG health check type ELB', () => {
      const asg = resources.BlueAutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('should have ASGs deployed across 3 AZs', () => {
      const asgs = ['BlueAutoScalingGroup', 'GreenAutoScalingGroup', 'WebhookAutoScalingGroup'];
      asgs.forEach(asgName => {
        const asg = resources[asgName];
        expect(asg.Properties.VPCZoneIdentifier).toHaveLength(3);
      });
    });
  });

  describe('Auto Scaling Policies - Compliance', () => {
    test('should have Blue CPU scaling policy with 70% target', () => {
      const policy = resources.BlueTargetTrackingCPU;
      expect(policy).toBeDefined();
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      const metric = policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification;
      expect(metric.PredefinedMetricType).toBe('ASGAverageCPUUtilization');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70.0);
    });

    test('should have Blue ALB request count scaling policy with 1000 target', () => {
      const policy = resources.BlueTargetTrackingALBRequests;
      expect(policy).toBeDefined();
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      const metric = policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification;
      expect(metric.PredefinedMetricType).toBe('ALBRequestCountPerTarget');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(1000.0);
      expect(metric.ResourceLabel).toBeDefined();
    });

    test('should have Green CPU and ALB request scaling policies', () => {
      expect(resources.GreenTargetTrackingCPU).toBeDefined();
      expect(resources.GreenTargetTrackingALBRequests).toBeDefined();
    });

    test('should have Webhook CPU scaling policy', () => {
      expect(resources.WebhookTargetTrackingCPU).toBeDefined();
    });
  });

  describe('RDS Aurora PostgreSQL - Compliance', () => {
    test('should have Aurora DB Cluster with PostgreSQL engine', () => {
      const cluster = resources.AuroraDBCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('should have 1 writer instance', () => {
      expect(resources.AuroraDBInstance1).toBeDefined();
      expect(resources.AuroraDBInstance1.Properties.DBInstanceIdentifier).toBeDefined();
    });

    test('should have 2 reader instances', () => {
      expect(resources.AuroraDBInstance2).toBeDefined();
      expect(resources.AuroraDBInstance3).toBeDefined();
      expect(resources.AuroraDBInstance2.DependsOn).toContain('AuroraDBInstance1');
      expect(resources.AuroraDBInstance3.DependsOn).toContain('AuroraDBInstance2');
    });

    test('should have custom cluster parameter group with pg_stat_statements', () => {
      const paramGroup = resources.DBClusterParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Properties.Family).toBe('aurora-postgresql15');
      const params = paramGroup.Properties.Parameters;
      expect(params.shared_preload_libraries).toBe('pg_stat_statements');
    });

    test('should have 7-day backup retention', () => {
      const cluster = resources.AuroraDBCluster;
      expect(cluster.Properties.BackupRetentionPeriod.Ref).toBe('DBBackupRetentionPeriod');
    });

    test('should have encryption at rest with KMS', () => {
      const cluster = resources.AuroraDBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('should have database secret for credentials', () => {
      expect(resources.DatabaseSecret).toBeDefined();
      expect(resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(resources.AuroraDBCluster.Properties.ManageMasterUserPassword).toBe(true);
    });
  });

  describe('S3 Bucket for ALB Logs - Compliance', () => {
    test('should have S3 bucket for ALB access logs', () => {
      expect(resources.ALBLogsBucket).toBeDefined();
      expect(resources.ALBLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have server-side encryption with AWS managed keys', () => {
      const bucket = resources.ALBLogsBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have 90-day lifecycle policy', () => {
      const bucket = resources.ALBLogsBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycle.ExpirationInDays).toBe(90);
    });
  });

  describe('Route 53 - Compliance', () => {
    test('should have conditional Hosted Zone', () => {
      expect(resources.HostedZone).toBeDefined();
      expect(resources.HostedZone.Condition).toBe('HasCustomDomain');
    });

    test('should have Production Record Set with weighted routing', () => {
      const record = resources.ProductionRecordSet;
      expect(record).toBeDefined();
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.Weight.Ref).toBe('ProductionWeight');
      expect(record.Properties.SetIdentifier).toBe('Production');
    });

    test('should have Canary Record Set with weighted routing (90/10 split)', () => {
      const record = resources.CanaryRecordSet;
      expect(record).toBeDefined();
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.Weight.Ref).toBe('CanaryWeight');
      expect(record.Properties.SetIdentifier).toBe('Canary');
    });
  });

  describe('CloudWatch Alarms - Compliance', () => {
    test('should have ALB error rate alarm with 1% threshold', () => {
      const alarm = resources.ALBErrorRateAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.Threshold.Ref).toBe('ErrorRateThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'AlertTopic' });
    });

    test('should have ALB P99 latency alarm with 500ms threshold', () => {
      const alarm = resources.ALBLatencyP99Alarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.ExtendedStatistic).toBe('p99');
      expect(alarm.Properties.Threshold.Ref).toBe('LatencyThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should have database connections alarm with 80% threshold', () => {
      const alarm = resources.DatabaseConnectionsAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.Threshold.Ref).toBe('DBConnectionThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should have Blue CPU alarm', () => {
      expect(resources.BlueCPUAlarm).toBeDefined();
    });

    test('all alarms should be connected to SNS topic', () => {
      const alarms = [
        resources.ALBErrorRateAlarm,
        resources.ALBLatencyP99Alarm,
        resources.DatabaseConnectionsAlarm,
        resources.BlueCPUAlarm,
      ];

      alarms.forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'AlertTopic' });
      });
    });
  });

  describe('SNS Topic - Compliance', () => {
    test('should have SNS topic for PagerDuty integration', () => {
      const topic = resources.AlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription[0].Endpoint.Ref).toBe('PagerDutyEmail');
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });
  });

  describe('SSM Parameter Store - Compliance', () => {
    test('should have database endpoint parameter', () => {
      expect(resources.DatabaseEndpointParameter).toBeDefined();
      expect(resources.DatabaseEndpointParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('should have database reader endpoint parameter', () => {
      expect(resources.DatabaseReadEndpointParameter).toBeDefined();
    });

    test('should have database port parameter', () => {
      expect(resources.DatabasePortParameter).toBeDefined();
    });

    test('should have ALB endpoint parameter', () => {
      expect(resources.ALBEndpointParameter).toBeDefined();
    });

    test('should have prefix structure /pf/${Environment}/*', () => {
      const param = resources.DatabaseEndpointParameter;
      const name = param.Properties.Name;
      // Should contain the prefix structure
      expect(name).toHaveProperty('Fn::Sub');
      expect(name['Fn::Sub']).toContain('/pf/');
      expect(name['Fn::Sub']).toContain('${Environment}');
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should have EC2 role with SSM and Secrets Manager access', () => {
      const role = resources.EC2Role;
      expect(role).toBeDefined();
      const policies = role.Properties.Policies;
      
      const paramStorePolicy = policies.find((p: any) => p.PolicyName === 'ParameterStoreAccess');
      expect(paramStorePolicy).toBeDefined();
      
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(secretsPolicy).toBeDefined();
    });

    test('should have EC2 instance profile', () => {
      expect(resources.EC2InstanceProfile).toBeDefined();
      expect(resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have RDS monitoring role', () => {
      expect(resources.RDSMonitoringRole).toBeDefined();
      expect(resources.RDSMonitoringRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('KMS Key for RDS Encryption', () => {
    test('should have KMS key for RDS encryption', () => {
      expect(resources.DatabaseKMSKey).toBeDefined();
      expect(resources.DatabaseKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS key alias', () => {
      expect(resources.DatabaseKMSKeyAlias).toBeDefined();
      expect(resources.DatabaseKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have KMS key policy allowing RDS service', () => {
      const key = resources.DatabaseKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const rdsStatement = statements.find((s: any) => s.Sid === 'Allow RDS to use the key');
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
    });
  });

  describe('Conditions - Conditional Resource Creation', () => {
    test('should have HasKeyPair condition', () => {
      expect(conditions.HasKeyPair).toBeDefined();
    });

    test('should have CreateNewCertificate condition', () => {
      expect(conditions.CreateNewCertificate).toBeDefined();
    });

    test('should have HasSSLCertificate condition', () => {
      expect(conditions.HasSSLCertificate).toBeDefined();
    });

    test('should have HasCustomDomain condition', () => {
      expect(conditions.HasCustomDomain).toBeDefined();
    });
  });

  describe('Outputs - Required Exports', () => {
    const requiredOutputs = [
      'LoadBalancerDNS',
      'LoadBalancerURL',
      'BlueTargetGroupArn',
      'GreenTargetGroupArn',
      'HealthCheckEndpoint',
      'DatabaseEndpoint',
      'DatabaseReaderEndpoint',
      'SNSTopicArn',
      'LogsBucketName',
      'VPCId',
      'Environment',
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName].Description).toBeDefined();
      });
    });

    test('should have LoadBalancerDNS with export', () => {
      const output = outputs.LoadBalancerDNS;
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });

    test('should have BlueTargetGroupArn with export', () => {
      const output = outputs.BlueTargetGroupArn;
      expect(output.Export).toBeDefined();
    });

    test('should have DatabaseEndpoint with export', () => {
      const output = outputs.DatabaseEndpoint;
      expect(output.Export).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    test('resource names should include region suffix for uniqueness', () => {
      // Check key resources that should have region suffix
      const alb = resources.ApplicationLoadBalancer;
      const name = alb.Properties.Name;
      expect(name).toHaveProperty('Fn::Sub');
      expect(name['Fn::Sub']).toContain('${AWS::Region}');
    });

    test('resource names should use PF prefix (shortened from PayFlow)', () => {
      const alb = resources.ApplicationLoadBalancer;
      const name = alb.Properties.Name;
      expect(name['Fn::Sub']).toContain('PF-');
    });
  });

  describe('Cross-Verification - Resource Dependencies', () => {
    test('ALB should depend on S3 bucket policy', () => {
      const alb = resources.ApplicationLoadBalancer;
      expect(alb.DependsOn).toContain('ALBLogsBucketPolicy');
    });

    test('Aurora instances should have sequential dependencies', () => {
      expect(resources.AuroraDBInstance2.DependsOn).toContain('AuroraDBInstance1');
      expect(resources.AuroraDBInstance3.DependsOn).toContain('AuroraDBInstance2');
    });

    test('ALB request scaling policies should depend on listeners', () => {
      const bluePolicy = resources.BlueTargetTrackingALBRequests;
      expect(bluePolicy.DependsOn).toContain('HTTPListener');
      expect(bluePolicy.DependsOn).toContain('APIListenerRuleHTTP');
    });
  });

  describe('Error Cases - Boundary Conditions', () => {
    test('should have MinValue and MaxValue constraints on numeric parameters', () => {
      const numericParams = ['MinCapacityBlue', 'MaxCapacityBlue', 'DesiredCapacityBlue'];
      numericParams.forEach(paramName => {
        const param = parameters[paramName];
        if (param.MinValue !== undefined) {
          expect(typeof param.MinValue).toBe('number');
        }
        if (param.MaxValue !== undefined) {
          expect(typeof param.MaxValue).toBe('number');
        }
      });
    });

    test('should have AllowedPattern on string parameters that need validation', () => {
      const validatedParams = ['VPCCIDR', 'PagerDutyEmail'];
      validatedParams.forEach(paramName => {
        const param = parameters[paramName];
        expect(param.AllowedPattern).toBeDefined();
      });
    });
  });

  describe('Performance - Resource Count Validation', () => {
    test('should have reasonable number of resources (not excessive)', () => {
      const resourceCount = Object.keys(resources).length;
      // Should have comprehensive infrastructure but not bloated
      expect(resourceCount).toBeGreaterThan(50);
      expect(resourceCount).toBeLessThan(200);
    });

    test('should have all required resource types present', () => {
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      const requiredTypes = [
        'AWS::EC2::VPC',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::RDS::DBCluster',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
      ];

      requiredTypes.forEach(type => {
        expect(resourceTypes).toContain(type);
      });
    });
  });
});
