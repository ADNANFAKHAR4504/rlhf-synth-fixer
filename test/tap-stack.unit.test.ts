import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Comprehensive Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template generated from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure Web Application Infrastructure');
      expect(template.Description).toContain('VPC, EC2, RDS, and ALB');
      expect(template.Description).toContain('security best practices');
      expect(template.Description).toContain('us-east-1');
    });

    test('should have metadata section with interface configuration', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterLabels).toBeDefined();
    });

    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter with correct configuration', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix for resource naming');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toContain('Must contain only alphanumeric characters');
    });

    test('should have InstanceType parameter with allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
      expect(param.Description).toContain('EC2 instance type');
    });

    test('should have InstanceCount parameter with proper constraints', () => {
      const param = template.Parameters.InstanceCount;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(2);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(10);
      expect(param.Description).toContain('Number of EC2 instances');
    });

    test('should have DBInstanceClass parameter with allowed values', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.micro');
      expect(param.AllowedValues).toEqual(['db.t3.micro', 'db.t3.small', 'db.t3.medium']);
      expect(param.Description).toContain('RDS instance class');
    });

  });

  describe('Conditions', () => {
    test('should have EnableHighAvailabilityNATCondition for NAT Gateway configuration', () => {
      const condition = template.Conditions.EnableHighAvailabilityNATCondition;
      expect(condition).toBeDefined();
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]).toEqual({ Ref: 'EnableHighAvailabilityNAT' });
      expect(condition['Fn::Equals'][1]).toBe('true');
    });

    test('should have EnableHTTPSCondition for SSL/TLS configuration', () => {
      const condition = template.Conditions.EnableHTTPSCondition;
      expect(condition).toBeDefined();
      expect(condition['Fn::And']).toBeDefined();
    });

    test('should have SupportsPerformanceInsights condition for RDS', () => {
      const condition = template.Conditions.SupportsPerformanceInsights;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
    });

    test('should have HasMultipleCIDRs condition for ALB security group rules', () => {
      const condition = template.Conditions.HasMultipleCIDRs;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals'][0]['Fn::Select'][0]).toBe(1);
      expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe("");
    });

    test('should have HasThreeCIDRs condition for ALB security group rules', () => {
      const condition = template.Conditions.HasThreeCIDRs;
      expect(condition).toBeDefined();
      expect(condition['Fn::And']).toBeDefined();
      expect(condition['Fn::And'][0]['Condition']).toBe('HasMultipleCIDRs');
      expect(condition['Fn::And'][1]['Fn::Not']).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should create KMS key with comprehensive policy', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(5);
      
      // Check root access statement
      const rootStatement = kmsKey.Properties.KeyPolicy.Statement[0];
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS).toEqual({ 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' });
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('should create KMS key alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({ 'Fn::Sub': 'alias/tapstack-229157-${EnvironmentSuffix}' });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('should have proper tags on KMS key', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.Tags).toBeDefined();
      expect(kmsKey.Properties.Tags).toHaveLength(7);
      
      const tagNames = kmsKey.Properties.Tags.map((tag: any) => tag.Key);
      expect(tagNames).toContain('Name');
      expect(tagNames).toContain('Environment');
      expect(tagNames).toContain('Project');
      expect(tagNames).toContain('Purpose');
      expect(tagNames).toContain('DataClassification');
      expect(tagNames).toContain('Owner');
      expect(tagNames).toContain('CostCenter');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should create VPC with correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway and attachment', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should create private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should create NAT Gateway with Elastic IP', () => {
      const eip1 = template.Resources.NatGateway1EIP;
      const eip2 = template.Resources.NatGateway2EIP;
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;

      expect(eip1).toBeDefined();
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip1.DependsOn).toBe('InternetGatewayAttachment');

      // Second EIP is conditional for high availability
      expect(eip2).toBeDefined();
      expect(eip2.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Condition).toBe('EnableHighAvailabilityNATCondition');

      expect(nat1).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });

      // Second NAT Gateway is conditional for high availability
      expect(nat2).toBeDefined();
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Condition).toBe('EnableHighAvailabilityNATCondition');
    });

    test('should create route tables with proper routes', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT1 = template.Resources.PrivateRouteTable1;
      const privateRT2 = template.Resources.PrivateRouteTable2;
      const publicRoute = template.Resources.DefaultPublicRoute;
      const privateRoute1 = template.Resources.DefaultPrivateRoute1;
      const privateRoute2 = template.Resources.DefaultPrivateRoute2;

      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT1.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT2.Type).toBe('AWS::EC2::RouteTable');

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      expect(privateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });

      expect(privateRoute2.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      // PrivateRoute2 uses conditional logic for high availability NAT Gateway
      expect(privateRoute2.Properties.NatGatewayId).toEqual({
        'Fn::If': [
          'EnableHighAvailabilityNATCondition',
          { Ref: 'NatGateway2' },
          { Ref: 'NatGateway1' }
        ]
      });
    });
  });

  describe('Network ACLs', () => {
    test('should create public Network ACL with proper rules', () => {
      const nacl = template.Resources.PublicNetworkACL;
      expect(nacl).toBeDefined();
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');

      const httpRule = template.Resources.PublicNetworkACLEntryInboundHTTP;
      const httpsRule = template.Resources.PublicNetworkACLEntryInboundHTTPS;
      const ephemeralRule = template.Resources.PublicNetworkACLEntryInboundEphemeral;
      const outboundRule = template.Resources.PublicNetworkACLEntryOutbound;

      expect(httpRule.Properties.Protocol).toBe(6);
      expect(httpRule.Properties.RuleAction).toBe('allow');
      expect(httpRule.Properties.PortRange.From).toBe(80);
      expect(httpRule.Properties.PortRange.To).toBe(80);

      expect(httpsRule.Properties.Protocol).toBe(6);
      expect(httpsRule.Properties.PortRange.From).toBe(443);
      expect(httpsRule.Properties.PortRange.To).toBe(443);

      expect(ephemeralRule.Properties.PortRange.From).toBe(1024);
      expect(ephemeralRule.Properties.PortRange.To).toBe(65535);

      expect(outboundRule.Properties.Egress).toBe(true);
      expect(outboundRule.Properties.Protocol).toBe(-1);
    });

    test('should create private Network ACL with VPC-only inbound access', () => {
      const nacl = template.Resources.PrivateNetworkACL;
      const inboundRule = template.Resources.PrivateNetworkACLEntryInboundVPC;
      const outboundRule = template.Resources.PrivateNetworkACLEntryOutbound;

      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(inboundRule.Properties.Protocol).toBe(-1);
      expect(inboundRule.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(outboundRule.Properties.Egress).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP and HTTPS ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      // Check separate ingress rule resources - now with indexed names for multiple CIDRs
      const httpRule0 = template.Resources.ALBSecurityGroupHTTPRule0;
      const httpsRule0 = template.Resources.ALBSecurityGroupHTTPSRule0;
      const httpRule1 = template.Resources.ALBSecurityGroupHTTPRule1;
      const httpsRule1 = template.Resources.ALBSecurityGroupHTTPSRule1;
      const httpRule2 = template.Resources.ALBSecurityGroupHTTPRule2;
      const httpsRule2 = template.Resources.ALBSecurityGroupHTTPSRule2;

      // First set of rules (always created)
      expect(httpRule0).toBeDefined();
      expect(httpRule0.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(httpRule0.Properties.FromPort).toBe(80);
      expect(httpRule0.Properties.ToPort).toBe(80);
      expect(httpRule0.Properties.IpProtocol).toBe('tcp');
      expect(httpRule0.Properties.Description).toContain('CIDR 0');

      expect(httpsRule0).toBeDefined();
      expect(httpsRule0.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(httpsRule0.Properties.FromPort).toBe(443);
      expect(httpsRule0.Properties.ToPort).toBe(443);
      expect(httpsRule0.Properties.IpProtocol).toBe('tcp');
      expect(httpsRule0.Properties.Description).toContain('CIDR 0');

      // Second set of rules (conditional)
      expect(httpRule1).toBeDefined();
      expect(httpRule1.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(httpRule1.Condition).toBe('HasMultipleCIDRs');
      expect(httpRule1.Properties.Description).toContain('CIDR 1');

      expect(httpsRule1).toBeDefined();
      expect(httpsRule1.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(httpsRule1.Condition).toBe('HasMultipleCIDRs');
      expect(httpsRule1.Properties.Description).toContain('CIDR 1');

      // Third set of rules (conditional)
      expect(httpRule2).toBeDefined();
      expect(httpRule2.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(httpRule2.Condition).toBe('HasThreeCIDRs');
      expect(httpRule2.Properties.Description).toContain('CIDR 2');

      expect(httpsRule2).toBeDefined();
      expect(httpsRule2.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(httpsRule2.Condition).toBe('HasThreeCIDRs');
      expect(httpsRule2.Properties.Description).toContain('CIDR 2');
    });

    test('should create EC2 security group with outbound rules', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('EC2 instances');

      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(2);

      const httpsRule = egress.find((rule: any) => rule.FromPort === 443);
      const httpRule = egress.find((rule: any) => rule.FromPort === 80);

      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should create RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('RDS database');
    });

    test('should create security group rules for communication between tiers', () => {
      const albToEc2 = template.Resources.ALBToEC2SecurityGroupRule;
      const ec2FromAlb = template.Resources.EC2FromALBSecurityGroupRule;
      const ec2ToRds = template.Resources.EC2ToRDSSecurityGroupRule;
      const rdsFromEc2 = template.Resources.RDSFromEC2SecurityGroupRule;

      expect(albToEc2.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(ec2FromAlb.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ec2ToRds.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(rdsFromEc2.Type).toBe('AWS::EC2::SecurityGroupIngress');

      expect(ec2ToRds.Properties.FromPort).toBe(3306);
      expect(rdsFromEc2.Properties.FromPort).toBe(3306);
    });
  });

  describe('IAM Resources', () => {
    test('should create EC2 role with required managed policies', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should create EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('should create RDS monitoring role', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('Compute Resources', () => {

    test('should create Auto Scaling Group with proper configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      
      expect(asg.Properties.MinSize).toEqual({ Ref: 'InstanceCount' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'InstanceCount' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'InstanceCount' });
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Database Resources', () => {
    test('should create DB parameter group with SSL enforcement', () => {
      const pg = template.Resources.DBParameterGroup;
      expect(pg).toBeDefined();
      expect(pg.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(pg.Properties.Family).toBe('mysql8.0');
      expect(pg.Properties.Parameters.require_secure_transport).toBe('ON');
      expect(pg.Properties.Parameters.slow_query_log).toBe(1);
    });

    test('should create DB subnet group', () => {
      const sg = template.Resources.DBSubnetGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(sg.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('should create RDS instance with security configurations', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.37');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should create Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
    });

    test('should create target group', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('should create HTTP listener', () => {
      const listener = template.Resources.ALBHTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Monitoring and Logging Resources', () => {
    test('should create VPC Flow Logs', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      const logGroup = template.Resources.VPCFlowLogsGroup;
      const role = template.Resources.VPCFlowLogsRole;

      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.ResourceType).toBe('VPC');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');

      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);

      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should create CloudWatch alarms', () => {
      const cpuAlarm = template.Resources.HighCPUAlarm;
      const rdsAlarm = template.Resources.RDSCPUAlarm;

      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Properties.Threshold).toBe(80);

      expect(rdsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(rdsAlarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('should create SNS topic for alerts', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('Security and Compliance Resources', () => {
    test('should create CloudTrail with S3 bucket', () => {
      const trail = template.Resources.CloudTrail;
      const bucket = template.Resources.CloudTrailBucket;
      const policy = template.Resources.CloudTrailBucketPolicy;

      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'KMSKey' });

      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);

      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should create AWS Config S3 bucket and service role', () => {
      const bucket = template.Resources.ConfigBucket;
      const role = template.Resources.ConfigServiceRole;

      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(role.Type).toBe('AWS::IAM::Role');
      // Note: ConfigurationRecorder and ConfigDeliveryChannel removed to avoid account-level conflicts
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.Outputs;
      
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.RDSInstanceEndpoint).toBeDefined();
      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.LaunchTemplateId).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('should have export names for cross-stack references', () => {
      const outputs = template.Outputs;
      
      Object.values(outputs).forEach((output: any) => {
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Security Best Practices Validation', () => {
    test('should not have hardcoded credentials', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      // More specific pattern that avoids false positives from legitimate CloudFormation content
      expect(templateStr).not.toMatch(/(?:secret|password|key)[\s"':=]+[A-Za-z0-9+/]{40}(?:[^A-Za-z0-9]|$)/i); // AWS Secret Key pattern
    });

    test('should have encryption enabled for storage resources', () => {
      const rds = template.Resources.RDSInstance;
      const s3Buckets = Object.values(template.Resources).filter((resource: any) => 
        resource.Type === 'AWS::S3::Bucket'
      );

      expect(rds.Properties.StorageEncrypted).toBe(true);
      
      s3Buckets.forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('should block public access on S3 buckets', () => {
      const s3Buckets = Object.values(template.Resources).filter((resource: any) => 
        resource.Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach((bucket: any) => {
        const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
        expect(blockConfig.BlockPublicAcls).toBe(true);
        expect(blockConfig.BlockPublicPolicy).toBe(true);
        expect(blockConfig.IgnorePublicAcls).toBe(true);
        expect(blockConfig.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should have lifecycle policies on S3 buckets', () => {
      const s3Buckets = Object.values(template.Resources).filter((resource: any) => 
        resource.Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach((bucket: any) => {
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      });
    });

    test('should have VPC Flow Logs enabled', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs).toBeDefined();
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
    });

    test('should have Config S3 bucket for compliance monitoring', () => {
      const configBucket = template.Resources.ConfigBucket;
      expect(configBucket).toBeDefined();
      expect(configBucket.Type).toBe('AWS::S3::Bucket');
      // Note: ConfigurationRecorder omitted to avoid account-level conflicts
    });

    test('should have CloudTrail enabled with log file validation', () => {
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail).toBeDefined();
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('High Availability and Resilience', () => {
    test('should deploy resources across multiple availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(privateSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(privateSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have Multi-AZ RDS deployment', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should have conditional NAT Gateway configuration for cost optimization', () => {
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;
      
      expect(nat1).toBeDefined();
      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      
      // Second NAT Gateway is conditional for high availability
      expect(nat2).toBeDefined();
      expect(nat2.Condition).toBe('EnableHighAvailabilityNATCondition');
      
      // Private route tables handle both single and dual NAT Gateway scenarios
      const privateRoute1 = template.Resources.DefaultPrivateRoute1;
      const privateRoute2 = template.Resources.DefaultPrivateRoute2;
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      
      // PrivateRoute2 conditionally uses NatGateway2 or falls back to NatGateway1
      expect(privateRoute2.Properties.NatGatewayId).toEqual({
        'Fn::If': [
          'EnableHighAvailabilityNATCondition',
          { Ref: 'NatGateway2' },
          { Ref: 'NatGateway1' }
        ]
      });
    });
  });

  describe('Performance and Scalability', () => {
    test('should use appropriate instance types', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('should have Auto Scaling configured', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toEqual({ Ref: 'InstanceCount' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'InstanceCount' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'InstanceCount' });
    });

    test('should have ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Cost Optimization', () => {
    test('should have lifecycle policies on S3 buckets', () => {
      const s3Buckets = Object.values(template.Resources).filter((resource: any) => 
        resource.Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach((bucket: any) => {
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
        expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      });
    });

    test('should use GP3 storage for EC2 instances', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      const blockDeviceMapping = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDeviceMapping.Ebs.VolumeType).toBe('gp3');
    });

    test('should have appropriate log retention periods', () => {
      const logGroup = template.Resources.VPCFlowLogsGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });
  });

  describe('Tagging Strategy', () => {
    test('should have comprehensive tags on KMS key', () => {
      const kmsKey = template.Resources.KMSKey;
      const tags = kmsKey.Properties.Tags;
      
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Purpose');
      expect(tagKeys).toContain('DataClassification');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
    });

    test('should have consistent tagging across resources', () => {
      const vpc = template.Resources.VPC;
      const alb = template.Resources.ApplicationLoadBalancer;
      
      expect(vpc.Properties.Tags).toBeDefined();
      expect(alb.Properties.Tags).toBeDefined();
    });
  });

  describe('Security Configuration Tests', () => {
    test('should have KMS encryption for all applicable resources', () => {
      // RDS should use KMS encryption
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });

      // S3 buckets should use KMS encryption
      const cloudTrailBucket = template.Resources.CloudTrailBucket;
      expect(cloudTrailBucket.Properties.BucketEncryption).toBeDefined();
      expect(cloudTrailBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      const configBucket = template.Resources.ConfigBucket;
      expect(configBucket.Properties.BucketEncryption).toBeDefined();
      expect(configBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      // CloudWatch Logs should use KMS encryption
      const flowLogsGroup = template.Resources.VPCFlowLogsGroup;
      expect(flowLogsGroup.Properties.KmsKeyId).toBeDefined();

      // SNS should use KMS encryption
      const snsTopic = template.Resources.SNSTopic;
      expect(snsTopic.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('should have secure S3 bucket configurations', () => {
      const buckets = ['CloudTrailBucket', 'ConfigBucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket).toBeDefined();
        
        // Public access should be blocked
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
        
        // Versioning should be enabled
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
        
        // Lifecycle policies should be defined
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
        expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
        expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
      });
    });

    test('should have proper security group configurations', () => {
      // ALB Security Group should only allow HTTP/HTTPS
      const albSecurityGroup = template.Resources.ALBSecurityGroup;
      expect(albSecurityGroup).toBeDefined();
      
      // Check the primary HTTP and HTTPS rules (always created)
      const httpRule0 = template.Resources.ALBSecurityGroupHTTPRule0;
      expect(httpRule0).toBeDefined();
      expect(httpRule0.Properties.FromPort).toBe(80);
      expect(httpRule0.Properties.ToPort).toBe(80);
      expect(httpRule0.Properties.IpProtocol).toBe('tcp');
      
      const httpsRule0 = template.Resources.ALBSecurityGroupHTTPSRule0;
      expect(httpsRule0).toBeDefined();
      expect(httpsRule0.Properties.FromPort).toBe(443);
      expect(httpsRule0.Properties.ToPort).toBe(443);
      expect(httpsRule0.Properties.IpProtocol).toBe('tcp');

      // Check conditional rules exist but have proper conditions
      const httpRule1 = template.Resources.ALBSecurityGroupHTTPRule1;
      expect(httpRule1).toBeDefined();
      expect(httpRule1.Condition).toBe('HasMultipleCIDRs');
      
      const httpsRule1 = template.Resources.ALBSecurityGroupHTTPSRule1;
      expect(httpsRule1).toBeDefined();
      expect(httpsRule1.Condition).toBe('HasMultipleCIDRs');

      // EC2 Security Group should only allow traffic from ALB
      const ec2FromAlbRule = template.Resources.EC2FromALBSecurityGroupRule;
      expect(ec2FromAlbRule.Properties.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });

      // RDS Security Group should only allow traffic from EC2
      const rdsFromEc2Rule = template.Resources.RDSFromEC2SecurityGroupRule;
      expect(rdsFromEc2Rule.Properties.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(rdsFromEc2Rule.Properties.FromPort).toBe(3306);
      expect(rdsFromEc2Rule.Properties.ToPort).toBe(3306);
    });

    test('should have WAF protection configured', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf).toBeDefined();
      expect(waf.Properties.Scope).toBe('REGIONAL');
      expect(waf.Properties.Rules).toBeDefined();
      expect(waf.Properties.Rules.length).toBeGreaterThan(0);
      
      // Check for managed rule sets
      const ruleNames = waf.Properties.Rules.map((rule: any) => rule.Name);
      expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
      expect(ruleNames).toContain('RateLimitRule');
      
      // WAF should be associated with ALB
      const wafAssociation = template.Resources.WAFWebACLAssociation;
      expect(wafAssociation.Properties.ResourceArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });

    test('should have monitoring and logging configured', () => {
      // CloudTrail should be enabled
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.IncludeGlobalServiceEvents).toBe(true);

      // VPC Flow Logs should be enabled
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(flowLogs.Properties.LogDestinationType).toBe('cloud-watch-logs');

      // Config S3 bucket should be available for compliance monitoring
      const configBucket = template.Resources.ConfigBucket;
      expect(configBucket).toBeDefined();
      expect(configBucket.Type).toBe('AWS::S3::Bucket');
      // Note: ConfigurationRecorder omitted to avoid account-level conflicts
    });

    test('should have CloudWatch alarms configured', () => {
      const alarms = [
        'HighCPUAlarm',
        'RDSCPUAlarm',
        'WAFBlockedRequestsAlarm',
        'ALBTargetResponseTimeAlarm',
        'UnhealthyTargetsAlarm'
      ];
      
      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm).toBeDefined();
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
        expect(alarm.Properties.ComparisonOperator).toBeDefined();
        expect(alarm.Properties.Threshold).toBeDefined();
        expect(alarm.Properties.MetricName).toBeDefined();
      });
    });
  });

  describe('High Availability and Resilience Tests', () => {
    test('should deploy across multiple availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      expect(publicSubnet1.Properties.AvailabilityZone).not.toEqual(publicSubnet2.Properties.AvailabilityZone);
      expect(privateSubnet1.Properties.AvailabilityZone).not.toEqual(privateSubnet2.Properties.AvailabilityZone);
    });

    test('should have RDS Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('should have Auto Scaling Group in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('should have Application Load Balancer in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });
  });

  describe('Performance and Scalability Tests', () => {
    test('should have appropriate instance types and storage', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
      
      // Check for GP3 storage type for better performance
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageType).toBe('gp3');
      
      // Check for Performance Insights on supported instances
      expect(rds.Properties.EnablePerformanceInsights).toBeDefined();
    });

    test('should have target group health checks configured properly', () => {
      const targetGroup = template.Resources.TargetGroup;
      expect(targetGroup.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup.Properties.HealthyThresholdCount).toBe(2);
      expect(targetGroup.Properties.UnhealthyThresholdCount).toBe(5);
    });

    test('should have enhanced monitoring enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MonitoringInterval).toBe(60);
      expect(rds.Properties.MonitoringRoleArn).toBeDefined();
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });
  });

  describe('Compliance and Best Practices Tests', () => {
    test('should follow AWS Well-Architected Framework principles', () => {
      // Security pillar - encryption at rest and in transit
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      
      // Reliability pillar - multi-AZ deployment
      expect(rds.Properties.MultiAZ).toBe(true);
      
      // Performance efficiency pillar - appropriate storage types
      expect(rds.Properties.StorageType).toBe('gp3');
      
      // Cost optimization pillar - lifecycle policies for S3
      const cloudTrailBucket = template.Resources.CloudTrailBucket;
      expect(cloudTrailBucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });

    test('should have proper resource naming conventions', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/); // PascalCase
      });
    });

    test('should have consistent environment suffix usage', () => {
      const resourcesWithEnvironmentSuffix = [
        'EC2LaunchTemplate',
        'AutoScalingGroup',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'WAFWebACL',
        'SNSTopic'
      ];
      
      resourcesWithEnvironmentSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.Name || 
                            resource.Properties.LaunchTemplateName ||
                            resource.Properties.AutoScalingGroupName ||
                            resource.Properties.TopicName;
        
        if (nameProperty && typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('should have proper deletion policies for critical resources', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete'); // Verify this matches your requirements
      
      const buckets = ['CloudTrailBucket', 'ConfigBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.DeletionPolicy).toBe('Delete'); // Verify this matches your requirements
      });
    });
  });

  describe('Network Security Tests', () => {
    test('should have Network ACLs configured properly', () => {
      const publicNacl = template.Resources.PublicNetworkACL;
      const privateNacl = template.Resources.PrivateNetworkACL;
      
      expect(publicNacl).toBeDefined();
      expect(privateNacl).toBeDefined();
      
      // Check NACL associations
      expect(template.Resources.PublicSubnet1NetworkACLAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2NetworkACLAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1NetworkACLAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2NetworkACLAssociation).toBeDefined();
    });

    test('should have NAT Gateway for outbound traffic from private subnets', () => {
      const natGateway = template.Resources.NatGateway1;
      expect(natGateway).toBeDefined();
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      
      // NAT Gateway should be in public subnet
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      
      // Private route table should route through NAT Gateway
      const privateRoute = template.Resources.DefaultPrivateRoute1;
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
    });

    test('should have proper CIDR block configurations', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toMatch(/^10\./); // Assuming RFC 1918 private addressing
      
      // Subnets should be within VPC CIDR
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.CidrBlock).toMatch(/^10\./);
      });
    });
  });
});
