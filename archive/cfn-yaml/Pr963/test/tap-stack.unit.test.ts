/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive Jest tests for the "Secure AWS Infrastructure - Production-Ready Multi-AZ Deployment"
 * CloudFormation template (TapStack.json only).
 */

import fs from 'fs';
import path from 'path';

/* If the CI pipeline passes ENVIRONMENT, use it; else default to prod */
const environment = process.env.ENVIRONMENT || 'prod';

describe('TapStack CloudFormation Template - Secure Infrastructure', () => {
  let template: any;

  /* -------------------------------------------------------------------- */
  /* Load the template (JSON only) once for all test blocks               */
  /* -------------------------------------------------------------------- */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}. Please ensure TapStack.json exists.`);
    }
    
    try {
      const raw = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(raw);
    } catch (error: any) {
      throw new Error(`Failed to parse template JSON: ${error.message}`);
    }
  });

  /* -------------------------------------------------------------------- */
  /* Basic smoke tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('Basic Template Checks', () => {
    test('template is loaded successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('description matches expected value', () => {
      expect(template.Description).toBe(
        'Secure AWS Infrastructure - Production-Ready Multi-AZ Deployment with Comprehensive Security Controls'
      );
    });

    test('AWSTemplateFormatVersion is correct', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('template has all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Parameter validation                                                  */
  /* -------------------------------------------------------------------- */
  describe('Parameters', () => {
    test('Environment parameter has correct schema', () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('prod');
      expect(p.Description).toBe('Environment name for resource tagging and configuration');
    });

    test('KeyPairName parameter has correct schema', () => {
      const p = template.Parameters.KeyPairName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('');
      expect(p.Description).toBe('Optional: EC2 Key Pair name for emergency access');
    });

    test('DBUsername parameter has correct constraints', () => {
      const p = template.Parameters.DBUsername;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('admin');
      expect(p.MinLength).toBe(1);
      expect(p.MaxLength).toBe(16);
      expect(p.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9]*$');
    });

    test('InstanceType parameter has correct schema', () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('t3.medium');
      expect(p.Description).toBe('EC2 instance type for web servers');
    });

    test('AmiId parameter uses SSM parameter', () => {
      const p = template.Parameters.AmiId;
      expect(p.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(p.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('template defines exactly 5 parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(5);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Conditions validation                                                 */
  /* -------------------------------------------------------------------- */
  describe('Conditions', () => {
    test('HasKeyPair condition exists and has correct logic', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition).toEqual({
        'Fn::Not': [
          {
            'Fn::Equals': [
              { 'Ref': 'KeyPairName' },
              ''
            ]
          }
        ]
      });
    });

    test('IsProduction condition exists and has correct logic', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition).toEqual({
        'Fn::Equals': [
          { 'Ref': 'Environment' },
          'prod'
        ]
      });
    });

    test('template defines exactly 2 conditions', () => {
      expect(Object.keys(template.Conditions)).toHaveLength(2);
    });
  });

  /* -------------------------------------------------------------------- */
  /* KMS & Encryption Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('KMS & Encryption', () => {
    test('MasterEncryptionKey has comprehensive key policy', () => {
      const key = template.Resources.MasterEncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      
      const statements = key.Properties.KeyPolicy.Statement;
      expect(statements).toHaveLength(4);
      
      // Check for IAM root permissions
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
      });

      // Check for service permissions
      const services = ['logs.amazonaws.com', 'autoscaling.amazonaws.com', 'ec2.amazonaws.com'];
      services.forEach(service => {
        const serviceStatement = statements.find((s: any) => 
          s.Principal && s.Principal.Service === service
        );
        expect(serviceStatement).toBeDefined();
      });
    });

    test('MasterKeyAlias is properly configured', () => {
      const alias = template.Resources.MasterKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/${AWS::StackName}-master-key'
      });
      expect(alias.Properties.TargetKeyId).toEqual({ 'Ref': 'MasterEncryptionKey' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* VPC & Networking Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('VPC & Networking', () => {
    test('VPC has correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets are configured correctly', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Check AZ selection
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('private subnets are configured correctly', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('Internet Gateway is properly configured', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('NAT Gateways have EIPs and correct subnet placement', () => {
      const natGw1 = template.Resources.NatGateway1;
      const natGw2 = template.Resources.NatGateway2;
      const eip1 = template.Resources.NatGateway1EIP;
      const eip2 = template.Resources.NatGateway2EIP;

      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip2.Properties.Domain).toBe('vpc');

      expect(natGw1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw2.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGw2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('route tables are properly configured', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      const privateRoute1 = template.Resources.DefaultPrivateRoute1;
      const privateRoute2 = template.Resources.DefaultPrivateRoute2;

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      expect(privateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });

    test('route table associations are correct', () => {
      const pubAssoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const pubAssoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
      const privAssoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const privAssoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(pubAssoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(pubAssoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(privAssoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(privAssoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Security Groups Tests                                                */
  /* -------------------------------------------------------------------- */
  describe('Security Groups', () => {
    test('WebServer security group allows traffic from ALB only', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const httpRule = webSG.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = webSG.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'LoadBalancerSecurityGroup' });
      expect(httpsRule.SourceSecurityGroupId).toEqual({ Ref: 'LoadBalancerSecurityGroup' });
    });

    test('LoadBalancer security group allows HTTP/HTTPS from internet', () => {
      const albSG = template.Resources.LoadBalancerSecurityGroup;
      const ingress = albSG.Properties.SecurityGroupIngress;
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Database security group restricts access to web servers only', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSG.Properties.SecurityGroupIngress[0];
      
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('security groups have proper descriptions', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const albSG = template.Resources.LoadBalancerSecurityGroup;
      const dbSG = template.Resources.DatabaseSecurityGroup;

      expect(webSG.Properties.GroupDescription).toBe('Security group for web servers - allows HTTP/HTTPS only');
      expect(albSG.Properties.GroupDescription).toBe('Security group for Application Load Balancer');
      expect(dbSG.Properties.GroupDescription).toBe('Security group for RDS database - allows access from web servers only');
    });

    test('WebServer security group has proper egress rules', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const egress = webSG.Properties.SecurityGroupEgress;

      const httpEgress = egress.find((rule: any) => rule.FromPort === 80);
      const httpsEgress = egress.find((rule: any) => rule.FromPort === 443);
      const dnsEgress = egress.find((rule: any) => rule.FromPort === 53 && rule.IpProtocol === 'tcp');

      expect(httpEgress.CidrIp).toBe('0.0.0.0/0');
      expect(httpsEgress.CidrIp).toBe('0.0.0.0/0');
      expect(dnsEgress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  /* -------------------------------------------------------------------- */
  /* IAM Roles & Policies Tests                                          */
  /* -------------------------------------------------------------------- */
  describe('IAM Roles & Policies', () => {
    test('WebServerRole has correct assume role policy', () => {
      const role = template.Resources.WebServerRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('WebServerRole has required managed policies', () => {
      const role = template.Resources.WebServerRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('WebServerRole has inline policies for S3 and Logging', () => {
      const role = template.Resources.WebServerRole;
      const policies = role.Properties.Policies;
      
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      const logPolicy = policies.find((p: any) => p.PolicyName === 'LoggingPolicy');
      
      expect(s3Policy).toBeDefined();
      expect(logPolicy).toBeDefined();
    });

    test('WebServerInstanceProfile is properly configured', () => {
      const profile = template.Resources.WebServerInstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'WebServerRole' }]);
    });

    test('WebServerGroup has management policies', () => {
      const group = template.Resources.WebServerGroup;
      expect(group.Type).toBe('AWS::IAM::Group');
    });
  });

  /* -------------------------------------------------------------------- */
  /* S3 Buckets Tests                                                    */
  /* -------------------------------------------------------------------- */
  describe('S3 Buckets', () => {
    test('SecureS3Bucket has proper encryption configuration', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        Ref: 'MasterEncryptionKey'
      });
    });

    test('SecureS3Bucket blocks all public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('SecureS3Bucket has versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('AccessLogsBucket has lifecycle configuration', () => {
      const bucket = template.Resources.AccessLogsBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      
      expect(lifecycle.Status).toBe('Enabled');
      expect(lifecycle.ExpirationInDays).toBe(90);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Database Tests                                                       */
  /* -------------------------------------------------------------------- */
  describe('Database Infrastructure', () => {
    test('DatabaseSubnetGroup uses private subnets', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('DatabaseSecret uses KMS encryption', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'MasterEncryptionKey' });
      
      const generateString = secret.Properties.GenerateSecretString;
      expect(generateString.PasswordLength).toBe(16);
      expect(generateString.ExcludeCharacters).toBe('"@/\\');
    });

    test('SecureDatabase has proper configuration', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.small');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.42');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('SecureDatabase has proper deletion policies', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.DeletionPolicy).toBe('Snapshot');
      expect(db.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('SecureDatabase uses conditional deletion protection', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.Properties.DeletionProtection).toEqual({
        'Fn::If': ['IsProduction', true, false]
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Load Balancer Tests                                                 */
  /* -------------------------------------------------------------------- */
  describe('Application Load Balancer', () => {
    test('ApplicationLoadBalancer is properly configured', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
    });

    test('TargetGroup has proper health check configuration', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('LoadBalancerListener forwards to TargetGroup', () => {
      const listener = template.Resources.LoadBalancerListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  /* -------------------------------------------------------------------- */
  /* WAF Tests                                                           */
  /* -------------------------------------------------------------------- */
  describe('WAF Configuration', () => {
    test('WebACL has managed rule sets', () => {
      const acl = template.Resources.WebACL;
      expect(acl.Type).toBe('AWS::WAFv2::WebACL');
      expect(acl.Properties.Scope).toBe('REGIONAL');
      
      const rules = acl.Properties.Rules;
      expect(rules).toHaveLength(3);
      
      const commonRuleSet = rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');
      const badInputsRuleSet = rules.find((r: any) => r.Name === 'AWSManagedRulesKnownBadInputsRuleSet');
      const rateLimitRule = rules.find((r: any) => r.Name === 'RateLimitRule');
      
      expect(commonRuleSet).toBeDefined();
      expect(badInputsRuleSet).toBeDefined();
      expect(rateLimitRule).toBeDefined();
    });

    test('WebACL has rate limiting configured', () => {
      const acl = template.Resources.WebACL;
      const rateLimitRule = acl.Properties.Rules.find((r: any) => r.Name === 'RateLimitRule');
      
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
      expect(rateLimitRule.Action.Block).toEqual({});
    });

    test('WebACLAssociation connects WAF to ALB', () => {
      const association = template.Resources.WebACLAssociation;
      expect(association.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(association.Properties.ResourceArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
      expect(association.Properties.WebACLArn).toEqual({ 'Fn::GetAtt': ['WebACL', 'Arn'] });
    });
  });

  /* -------------------------------------------------------------------- */
  /* CloudWatch Monitoring Tests                                         */
  /* -------------------------------------------------------------------- */
  describe('CloudWatch Monitoring', () => {
    test('Log groups use KMS encryption', () => {
      const webServerLogs = template.Resources.WebServerLogGroup;
      const databaseLogs = template.Resources.DatabaseLogGroup;
      const s3Logs = template.Resources.S3LogGroup;

      [webServerLogs, databaseLogs, s3Logs].forEach(logGroup => {
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.KmsKeyId).toEqual({
          'Fn::GetAtt': ['MasterEncryptionKey', 'Arn']
        });
      });
    });

    test('Log groups have conditional retention periods', () => {
      const webServerLogs = template.Resources.WebServerLogGroup;
      expect(webServerLogs.Properties.RetentionInDays).toEqual({
        'Fn::If': ['IsProduction', 30, 7]
      });
    });

    test('CloudWatch alarms are properly configured', () => {
      const cpuAlarm = template.Resources.HighCPUAlarm;
      const dbAlarm = template.Resources.DatabaseConnectionAlarm;

      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Properties.Threshold).toBe(80);

      expect(dbAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(dbAlarm.Properties.MetricName).toBe('DatabaseConnections');
      expect(dbAlarm.Properties.Threshold).toBe(20);
    });

    test('SNS Topic uses KMS encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'MasterEncryptionKey' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Launch Template & Auto Scaling Tests                                */
  /* -------------------------------------------------------------------- */
  describe('Launch Template & Auto Scaling', () => {
    test('LaunchTemplate has correct configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;
      
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(data.ImageId).toEqual({ Ref: 'AmiId' });
      expect(data.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(data.SecurityGroupIds).toContainEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('LaunchTemplate uses conditional KeyName', () => {
      const lt = template.Resources.LaunchTemplate;
      const keyName = lt.Properties.LaunchTemplateData.KeyName;
      
      expect(keyName).toEqual({
        'Fn::If': [
          'HasKeyPair',
          { 'Ref': 'KeyPairName' },
          { 'Ref': 'AWS::NoValue' }
        ]
      });
    });

    test('LaunchTemplate has proper EBS configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      
      expect(blockDevice.DeviceName).toBe('/dev/xvda');
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.VolumeSize).toBe(20);
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('AutoScalingGroup is configured for high availability', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('AutoScalingGroup spans multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
    });

    test('AutoScalingGroup has CreationPolicy', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.CreationPolicy.ResourceSignal.Count).toBe(2);
      expect(asg.CreationPolicy.ResourceSignal.Timeout).toBe('PT15M');
    });
  });

  /* -------------------------------------------------------------------- */
  /* Outputs Tests                                                       */
  /* -------------------------------------------------------------------- */
  describe('Outputs', () => {
    test('VPCId output is properly configured', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID'
      });
    });

    test('LoadBalancer outputs are properly configured', () => {
      const dnsOutput = template.Outputs.LoadBalancerDNS;
      const urlOutput = template.Outputs.LoadBalancerURL;
      
      expect(dnsOutput.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
      expect(urlOutput.Value).toEqual({
        'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}'
      });
    });

    test('Database and S3 outputs are properly configured', () => {
      const dbOutput = template.Outputs.DatabaseEndpoint;
      const s3Output = template.Outputs.S3BucketName;
      
      expect(dbOutput.Value).toEqual({
        'Fn::GetAtt': ['SecureDatabase', 'Endpoint.Address']
      });
      expect(s3Output.Value).toEqual({ Ref: 'SecureS3Bucket' });
    });

    test('Security-related outputs are included', () => {
      const kmsOutput = template.Outputs.KMSKeyId;
      const wafOutput = template.Outputs.WebACLId;
      
      expect(kmsOutput.Value).toEqual({ Ref: 'MasterEncryptionKey' });
      expect(wafOutput.Value).toEqual({
        'Fn::GetAtt': ['WebACL', 'Id']
      });
    });

    test('Subnet outputs list all subnets', () => {
      const publicOutput = template.Outputs.PublicSubnets;
      const privateOutput = template.Outputs.PrivateSubnets;
      
      expect(publicOutput.Value).toEqual({
        'Fn::Join': [',', [
          { Ref: 'PublicSubnet1' },
          { Ref: 'PublicSubnet2' }
        ]]
      });
      expect(privateOutput.Value).toEqual({
        'Fn::Join': [',', [
          { Ref: 'PrivateSubnet1' },
          { Ref: 'PrivateSubnet2' }
        ]]
      });
    });

    test('all outputs have proper export names', () => {
      const outputKeys = Object.keys(template.Outputs);
      outputKeys.forEach(key => {
        const output = template.Outputs[key];
        if (output.Export) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': expect.stringMatching(/^\$\{AWS::StackName\}-.+$/)
          });
        }
      });
    });

    test('template defines exactly 9 outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(9);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Resource Tagging Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('Resource Tagging', () => {
    test('key resources have Environment tags', () => {
      const resourcesWithTags = [
        'VPC', 'MasterEncryptionKey', 'PublicSubnet1', 'PrivateSubnet1',
        'WebServerSecurityGroup', 'WebServerRole', 'SecureS3Bucket',
        'SecureDatabase', 'ApplicationLoadBalancer'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });

    test('key resources have Name tags with stack reference', () => {
      const resourcesWithNameTags = [
        'VPC', 'MasterEncryptionKey', 'InternetGateway', 'PublicSubnet1',
        'PrivateSubnet1', 'WebServerSecurityGroup', 'LoadBalancerSecurityGroup'
      ];

      resourcesWithNameTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toEqual({
          'Fn::Sub': expect.stringMatching(/^\$\{AWS::StackName\}-.+$/)
        });
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Security Compliance Tests                                            */
  /* -------------------------------------------------------------------- */
  describe('Security Compliance', () => {
    test('all storage resources use encryption', () => {
      const s3Bucket = template.Resources.SecureS3Bucket;
      const database = template.Resources.SecureDatabase;
      const logGroups = [
        template.Resources.WebServerLogGroup,
        template.Resources.DatabaseLogGroup,
        template.Resources.S3LogGroup
      ];

      // S3 encryption
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
      
      // RDS encryption
      expect(database.Properties.StorageEncrypted).toBe(true);
      expect(database.Properties.KmsKeyId).toBeDefined();
      
      // CloudWatch Logs encryption
      logGroups.forEach(logGroup => {
        expect(logGroup.Properties.KmsKeyId).toBeDefined();
      });
    });

    test('network resources follow security best practices', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const dbSG = template.Resources.DatabaseSecurityGroup;

      // Web servers only accept traffic from ALB
      const webIngress = webSG.Properties.SecurityGroupIngress;
      webIngress.forEach((rule: any) => {
        if (rule.FromPort === 80 || rule.FromPort === 443) {
          expect(rule.SourceSecurityGroupId).toBeDefined();
        }
      });

      // Database only accepts traffic from web servers
      const dbIngress = dbSG.Properties.SecurityGroupIngress[0];
      expect(dbIngress.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('IAM policies follow least privilege principle', () => {
      const webServerRole = template.Resources.WebServerRole;
      const s3Policy = webServerRole.Properties.Policies.find((p: any) => 
        p.PolicyName === 'S3AccessPolicy'
      );

      // S3 policy should only allow access to specific bucket
      const s3Statement = s3Policy.PolicyDocument.Statement.find((s: any) => 
        s.Resource && s.Resource['Fn::Sub']
      );
      expect(s3Statement.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${SecureS3Bucket}/*'
      });
    });
  });
});
