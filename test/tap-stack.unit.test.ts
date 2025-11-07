import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure (FIRST Principles)', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a descriptive description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Metadata).toBeDefined();
    });

    test('should have valid JSON structure (no null/undefined required sections)', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Metadata and Parameter Groups', () => {
    test('should have CloudFormation Interface metadata', () => {
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      const cfnInterface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(cfnInterface.ParameterGroups).toBeDefined();
      expect(Array.isArray(cfnInterface.ParameterGroups)).toBe(true);
    });

    test('should have parameter groups for all configuration categories', () => {
      const groups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      const groupLabels = groups.map((g: any) => g.Label.default);
      
      expect(groupLabels).toContain('Environment Configuration');
      expect(groupLabels).toContain('Network Configuration');
      expect(groupLabels).toContain('Compute Configuration');
      expect(groupLabels).toContain('Database Configuration');
      expect(groupLabels).toContain('DNS & SSL Configuration');
      expect(groupLabels).toContain('Monitoring Configuration');
    });
  });

  describe('Parameters (Right-BICEP: Right Results, Boundary Conditions)', () => {
    const requiredParameters = [
      'EnvironmentName',
      'InstanceType',
      'VPCCIDR',
      'PublicSubnet1CIDR',
      'PublicSubnet2CIDR',
      'PrivateSubnet1CIDR',
      'PrivateSubnet2CIDR',
      'MinSize',
      'MaxSize',
      'DesiredCapacity',
      'TargetCPUUtilization',
      'DBInstanceClass',
      'DBUsername',
      'DBAllocatedStorage',
      'DBBackupRetention',
      'OwnerTag',
      'ApplicationName',
      'DomainName',
      'NotificationEmail',
      'EnableDetailedMonitoring',
      'LogRetentionDays',
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentName should have correct properties and allowed values', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
      expect(param.Description).toBeDefined();
    });

    test('InstanceType should have correct properties and allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
      expect(param.AllowedValues).toContain('t3.small');
      expect(param.AllowedValues).toContain('t3.medium');
      expect(param.AllowedValues).toContain('t3.large');
      expect(param.AllowedValues).toContain('t3.xlarge');
    });

    test('VPCCIDR should have CIDR pattern validation', () => {
      const param = template.Parameters.VPCCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
      // Verify it's a valid CIDR regex pattern (should match IP address with subnet mask)
      // The pattern is stored as an escaped string, so check for the subnet mask portion
      expect(param.AllowedPattern).toContain('\\/([0-9]|[1-2][0-9]|3[0-2])');
    });

    test('KeyName should be optional with empty default', () => {
      const param = template.Parameters.KeyName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('Auto Scaling parameters should have numeric constraints', () => {
      const minSize = template.Parameters.MinSize;
      expect(minSize.Type).toBe('Number');
      expect(minSize.MinValue).toBe(1);
      expect(minSize.MaxValue).toBe(10);
      expect(minSize.Default).toBe(2);

      const maxSize = template.Parameters.MaxSize;
      expect(maxSize.Type).toBe('Number');
      expect(maxSize.MinValue).toBe(1);
      expect(maxSize.MaxValue).toBe(20);
      expect(maxSize.Default).toBe(6);

      const desiredCapacity = template.Parameters.DesiredCapacity;
      expect(desiredCapacity.Type).toBe('Number');
      expect(desiredCapacity.MinValue).toBe(1);
      expect(desiredCapacity.MaxValue).toBe(20);
      expect(desiredCapacity.Default).toBe(3);
    });

    test('TargetCPUUtilization should have valid range', () => {
      const param = template.Parameters.TargetCPUUtilization;
      expect(param.Type).toBe('Number');
      expect(param.MinValue).toBe(10);
      expect(param.MaxValue).toBe(90);
      expect(param.Default).toBe(70);
    });

    test('Database parameters should have correct constraints', () => {
      const dbStorage = template.Parameters.DBAllocatedStorage;
      expect(dbStorage.Type).toBe('Number');
      expect(dbStorage.MinValue).toBe(20);
      expect(dbStorage.MaxValue).toBe(1000);
      expect(dbStorage.Default).toBe(100);

      const dbBackup = template.Parameters.DBBackupRetention;
      expect(dbBackup.Type).toBe('Number');
      expect(dbBackup.MinValue).toBe(1);
      expect(dbBackup.MaxValue).toBe(35);
      expect(dbBackup.Default).toBe(7);
    });

    test('DBUsername should have pattern validation', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('NotificationEmail should have email pattern validation', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toMatch(/@/);
      expect(param.Default).toBeDefined();
    });

    test('LogRetentionDays should have valid allowed values', () => {
      const param = template.Parameters.LogRetentionDays;
      expect(param.Type).toBe('Number');
      expect(param.AllowedValues).toContain(1);
      expect(param.AllowedValues).toContain(30);
      expect(param.AllowedValues).toContain(365);
    });

    test('Optional parameters should have empty defaults', () => {
      const hostedZone = template.Parameters.HostedZoneId;
      expect(hostedZone.Default).toBe('');

      const certificate = template.Parameters.CertificateArn;
      expect(certificate.Default).toBe('');
    });
  });

  describe('Conditions (Inverse Checks, Cross-verification)', () => {
    test('should have all required conditions', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.EnableDetailedMonitoringCondition).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.HasKeyName).toBeDefined();
      expect(template.Conditions.HasHostedZone).toBeDefined();
      expect(template.Conditions.HasCertificate).toBeDefined();
    });

    test('IsProduction condition should check EnvironmentName', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('EnvironmentName');
      expect(condition['Fn::Equals'][1]).toBe('Production');
    });

    test('HasKeyName condition should check for non-empty KeyName', () => {
      const condition = template.Conditions.HasKeyName;
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
    });
  });

  describe('Network Resources (VPC, Subnets, Routing)', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBeDefined();
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public and private subnets in two AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const pubSub1 = template.Resources.PublicSubnet1;
      expect(pubSub1.Properties.MapPublicIpOnLaunch).toBe(true);
      
      const privSub1 = template.Resources.PrivateSubnet1;
      expect(privSub1.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have NAT Gateways in public subnets', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
    });

    test('public route should use Internet Gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.Properties.GatewayId).toBeDefined();
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private routes should use NAT Gateways', () => {
      const route1 = template.Resources.DefaultPrivateRoute1;
      expect(route1.Properties.NatGatewayId).toBeDefined();
      expect(route1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Groups (Layered Security Architecture)', () => {
    test('should have ALB security group allowing HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group allowing HTTP from ALB only', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      
      const ingress = template.Resources.EC2SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.Properties.FromPort).toBe(80);
      expect(ingress.Properties.SourceSecurityGroupId).toBeDefined();
    });

    test('should have RDS security group allowing PostgreSQL from EC2 only', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
      expect(ingress.ToPort).toBe(5432);
      expect(ingress.SourceSecurityGroupId).toBeDefined();
    });
  });

  describe('Database Resources (RDS, Secrets Manager)', () => {
    test('should have RDS instance with Multi-AZ', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('should have DB subnet group in private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have Secrets Manager secret for database password', () => {
      const secret = template.Resources.DBPassword;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should use dynamic reference for RDS password', () => {
      const rds = template.Resources.RDSInstance;
      const password = rds.Properties.MasterUserPassword;
      expect(password['Fn::Sub']).toBeDefined();
      expect(password['Fn::Sub']).toContain('secretsmanager');
    });

    test('should have RDS parameter group', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Properties.Family).toBe('postgres13');
    });

    test('should have RDS log group', () => {
      const logGroup = template.Resources.RDSLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('should have Application Load Balancer in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have target group with health checks', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.Port).toBe(80);
    });

    test('should have HTTP listener with conditional redirect', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.DefaultActions).toBeDefined();
    });

    test('should have HTTPS listener conditionally created', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      expect(listener).toBeDefined();
      expect(listener.Condition).toBe('HasCertificate');
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.Certificates).toBeDefined();
    });
  });

  describe('Auto Scaling Group and Launch Template', () => {
    test('should have Launch Template with user data', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have conditional KeyName in Launch Template', () => {
      const lt = template.Resources.LaunchTemplate;
      const keyName = lt.Properties.LaunchTemplateData.KeyName;
      expect(keyName['Fn::If']).toBeDefined();
      expect(keyName['Fn::If'][0]).toBe('HasKeyName');
    });

    test('should have Auto Scaling Group with correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('should have CreationPolicy requiring success signals', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.CreationPolicy).toBeDefined();
      expect(asg.CreationPolicy.ResourceSignal.Count).toBeDefined();
      expect(asg.CreationPolicy.ResourceSignal.Timeout).toBe('PT15M');
    });

    test('should have target tracking scaling policy', () => {
      const policy = template.Resources.TargetTrackingScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType)
        .toBe('ASGAverageCPUUtilization');
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should have SNS topic for notifications', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toBeDefined();
    });

    test('should have CloudWatch alarms for critical metrics', () => {
      expect(template.Resources.UnHealthyHostAlarm).toBeDefined();
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.HighLatencyAlarm).toBeDefined();
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseStorageSpaceAlarm).toBeDefined();
    });

    test('alarms should have correct thresholds and actions', () => {
      const unhealthyAlarm = template.Resources.UnHealthyHostAlarm;
      expect(unhealthyAlarm.Properties.Threshold).toBe(1);
      expect(unhealthyAlarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(unhealthyAlarm.Properties.AlarmActions).toBeDefined();

      const cpuAlarm = template.Resources.HighCPUAlarm;
      expect(cpuAlarm.Properties.Threshold).toBe(80);
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
    });
  });

  describe('DNS and Route53', () => {
    test('should have conditional DNS record', () => {
      const dns = template.Resources.DNSRecord;
      expect(dns).toBeDefined();
      expect(dns.Condition).toBe('HasHostedZone');
      expect(dns.Type).toBe('AWS::Route53::RecordSet');
      expect(dns.Properties.Type).toBe('A');
      expect(dns.Properties.AliasTarget).toBeDefined();
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should have EC2 role with required policies', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Log resources', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLog).toBeDefined();
    });

    test('VPC Flow Log should have correct configuration', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Backup Resources (Production Only)', () => {
    test('should have conditional backup resources', () => {
      const vault = template.Resources.BackupVault;
      expect(vault).toBeDefined();
      expect(vault.Condition).toBe('IsProduction');

      const plan = template.Resources.BackupPlan;
      expect(plan).toBeDefined();
      expect(plan.Condition).toBe('IsProduction');
    });
  });

  describe('Outputs (Cross-verification)', () => {
    const expectedOutputs = [
      'VPCId',
      'VPCCIDR',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'ALBDNSName',
      'ALBArn',
      'ALBTargetGroupArn',
      'APIDomainName',
      'APIEndpoint',
      'RDSEndpoint',
      'RDSPort',
      'DBSecretArn',
      'AutoScalingGroupName',
      'LaunchTemplateId',
      'LaunchTemplateVersion',
      'ALBSecurityGroupId',
      'EC2SecurityGroupId',
      'RDSSecurityGroupId',
      'SNSTopicArn',
      'ApplicationLogGroupName',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('outputs should have export names with environment prefix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toBeDefined();
        }
      });
    });

    test('critical outputs should reference correct resources', () => {
      expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
      expect(template.Outputs.ALBDNSName.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
      expect(template.Outputs.RDSEndpoint.Value['Fn::GetAtt']).toEqual(['RDSInstance', 'Endpoint.Address']);
    });
  });

  describe('Resource Tagging Strategy', () => {
    test('resources should have consistent tagging', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Application');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('iac-rlhf-amazon');
    });

    test('tags should use parameter references', () => {
      const vpc = template.Resources.VPC;
      const envTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Environment');
      expect(envTag.Value.Ref).toBe('EnvironmentName');
    });
  });

  describe('Error Cases and Edge Conditions', () => {
    test('should handle optional parameters gracefully', () => {
      // KeyName, HostedZoneId, CertificateArn are optional
      expect(template.Parameters.KeyName.Default).toBe('');
      expect(template.Parameters.HostedZoneId.Default).toBe('');
      expect(template.Parameters.CertificateArn.Default).toBe('');
    });

    test('should have conditions for optional resources', () => {
      expect(template.Conditions.HasKeyName).toBeDefined();
      expect(template.Conditions.HasHostedZone).toBeDefined();
      expect(template.Conditions.HasCertificate).toBeDefined();
    });

    test('should validate parameter constraints', () => {
      // MinSize should be <= MaxSize (validated at runtime)
      const minSize = template.Parameters.MinSize.Default;
      const maxSize = template.Parameters.MaxSize.Default;
      expect(minSize).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Performance and Best Practices', () => {
    test('should use Multi-AZ for RDS high availability', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should have auto scaling configured for elasticity', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
      expect(asg.Properties.DesiredCapacity).toBeDefined();
    });

    test('should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBeDefined();
    });

    test('should have encryption enabled for sensitive resources', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });
  });
});
