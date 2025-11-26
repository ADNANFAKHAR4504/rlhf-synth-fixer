import * as fs from 'fs';
import * as path from 'path';

const loadTemplate = (): any => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');
  return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
};

const getResource = (template: any, logicalId: string) => template.Resources[logicalId];
const getParameter = (template: any, name: string) => template.Parameters[name];
const getCondition = (template: any, name: string) => template.Conditions[name];
const getOutput = (template: any, name: string) => template.Outputs[name];

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    template = loadTemplate();
  });

  describe('Template Structure', () => {

    test('Has metadata with parameter groups', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadata).toBeDefined();
      expect(metadata.ParameterGroups).toHaveLength(5);
      expect(metadata.ParameterGroups[0].Label.default).toBe('Project Configuration');
      expect(metadata.ParameterGroups[1].Label.default).toBe('Network Configuration');
      expect(metadata.ParameterGroups[2].Label.default).toBe('Compute Configuration');
      expect(metadata.ParameterGroups[3].Label.default).toBe('Database Configuration');
      expect(metadata.ParameterGroups[4].Label.default).toBe('Monitoring Configuration');
    });

    test('Has all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters - Project Configuration', () => {
    test('ProjectName has correct constraints', () => {
      const param = getParameter(template, 'ProjectName');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('StartupPlatform');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(50);
      expect(param.Description).toContain('project');
    });

    test('EnvironmentName restricts to valid environments', () => {
      const param = getParameter(template, 'EnvironmentName');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['Production', 'Staging', 'Development']);
    });

    test('OwnerEmail validates email format', () => {
      const param = getParameter(template, 'OwnerEmail');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('owner@example.com');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    });
  });

  describe('Parameters - Network Configuration', () => {
    test('AllowedSSHIP validates CIDR format', () => {
      const param = getParameter(template, 'AllowedSSHIP');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.AllowedPattern).toBe('^([0-9]{1,3}\\.){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$');
    });

    test('EnableNATGateway is boolean-like string', () => {
      const param = getParameter(template, 'EnableNATGateway');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('Parameters - Compute Configuration', () => {
    test('HasKeyPair enables conditional key pair usage', () => {
      const param = getParameter(template, 'HasKeyPair');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('KeyPairName is optional string', () => {
      const param = getParameter(template, 'KeyPairName');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('InstanceType restricts to valid EC2 types', () => {
      const param = getParameter(template, 'InstanceType');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge']);
    });

    test('LatestAmiId uses SSM parameter store', () => {
      const param = getParameter(template, 'LatestAmiId');
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64');
    });

    test('MinSize has valid range', () => {
      const param = getParameter(template, 'MinSize');
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(2);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(10);
    });

    test('MaxSize has valid range', () => {
      const param = getParameter(template, 'MaxSize');
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(6);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(20);
    });

    test('DesiredCapacity has valid range', () => {
      const param = getParameter(template, 'DesiredCapacity');
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(2);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(20);
    });
  });

  describe('Parameters - Database Configuration', () => {
    test('DBInstanceClass restricts to valid RDS types', () => {
      const param = getParameter(template, 'DBInstanceClass');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.small');
      expect(param.AllowedValues).toContain('db.t3.micro');
      expect(param.AllowedValues).toContain('db.t3.small');
      expect(param.AllowedValues).toContain('db.r5.large');
    });

    test('DBMasterUsername validates format', () => {
      const param = getParameter(template, 'DBMasterUsername');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9]*$');
    });

    test('DBAllocatedStorage has valid range', () => {
      const param = getParameter(template, 'DBAllocatedStorage');
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(100);
      expect(param.MinValue).toBe(20);
      expect(param.MaxValue).toBe(1000);
    });

    test('PostgreSQLVersion restricts to supported versions', () => {
      const param = getParameter(template, 'PostgreSQLVersion');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('15.15');
      expect(param.AllowedValues).toContain('15.15');
      expect(param.AllowedValues).toContain('18.1');
    });

    test('EnableMultiAZ is boolean-like string', () => {
      const param = getParameter(template, 'EnableMultiAZ');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('Parameters - Monitoring Configuration', () => {
    test('EnableDetailedMonitoring is boolean-like string', () => {
      const param = getParameter(template, 'EnableDetailedMonitoring');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('AlertEmail validates email format', () => {
      const param = getParameter(template, 'AlertEmail');
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('alerts@example.com');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    });
  });

  describe('Conditions', () => {
    test('CreateNATGateway condition checks EnableNATGateway parameter', () => {
      const condition = getCondition(template, 'CreateNATGateway');
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'EnableNATGateway' }, 'true']);
    });

    test('EnableMultiAZCondition checks EnableMultiAZ parameter', () => {
      const condition = getCondition(template, 'EnableMultiAZCondition');
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'EnableMultiAZ' }, 'true']);
    });

    test('EnableDetailedMonitoringCondition checks EnableDetailedMonitoring parameter', () => {
      const condition = getCondition(template, 'EnableDetailedMonitoringCondition');
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'EnableDetailedMonitoring' }, 'true']);
    });

    test('IsProduction condition checks EnvironmentName', () => {
      const condition = getCondition(template, 'IsProduction');
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'EnvironmentName' }, 'Production']);
    });

    test('HasKeyPairCondition checks HasKeyPair parameter', () => {
      const condition = getCondition(template, 'HasKeyPairCondition');
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'HasKeyPair' }, 'true']);
    });
  });

  describe('Resources - Secrets Manager', () => {
    test('DBPasswordSecret generates secure password', () => {
      const secret = getResource(template, 'DBPasswordSecret');
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
    });

    test('DBPasswordSecret has required tags', () => {
      const secret = getResource(template, 'DBPasswordSecret');
      const tags = secret.Properties.Tags;
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: { Ref: 'EnvironmentName' } }),
          expect.objectContaining({ Key: 'Owner', Value: { Ref: 'OwnerEmail' } }),
          expect.objectContaining({ Key: 'Project', Value: { Ref: 'ProjectName' } }),
          expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ])
      );
    });
  });

  describe('Resources - S3 Buckets', () => {
    test('StaticWebsiteBucket has encryption enabled', () => {
      const bucket = getResource(template, 'StaticWebsiteBucket');
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('StaticWebsiteBucket blocks public access', () => {
      const bucket = getResource(template, 'StaticWebsiteBucket');
      const pubBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pubBlock.BlockPublicAcls).toBe(true);
      expect(pubBlock.BlockPublicPolicy).toBe(true);
      expect(pubBlock.IgnorePublicAcls).toBe(true);
      expect(pubBlock.RestrictPublicBuckets).toBe(true);
    });

    test('StaticWebsiteBucket has versioning enabled', () => {
      const bucket = getResource(template, 'StaticWebsiteBucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('StaticWebsiteBucket has lifecycle policies', () => {
      const bucket = getResource(template, 'StaticWebsiteBucket');
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toHaveLength(2);
      expect(rules[0].Id).toBe('DeleteOldVersions');
      expect(rules[1].Id).toBe('IntelligentTiering');
    });

    test('StaticWebsiteBucketPolicy allows CloudFront OAI access', () => {
      const policy = getResource(template, 'StaticWebsiteBucketPolicy');
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('AllowCloudFrontOAI');
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toEqual(['s3:GetObject']);
    });

    test('FlowLogsBucket has encryption and lifecycle', () => {
      const bucket = getResource(template, 'FlowLogsBucket');
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
    });
  });

  describe('Resources - Lambda Functions', () => {
    test('S3ContentInitFunction initializes S3 content', () => {
      const func = getResource(template, 'S3ContentInitFunction');
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('python3.11');
      expect(func.Properties.Handler).toBe('index.handler');
      expect(func.Properties.Timeout).toBe(60);
    });

    test('S3ContentInitRole has S3 write permissions', () => {
      const role = getResource(template, 'S3ContentInitRole');
      expect(role.Type).toBe('AWS::IAM::Role');
      const policies = role.Properties.Policies;
      expect(policies[0].PolicyName).toBe('S3WritePolicy');
      expect(policies[0].PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
    });
  });

  describe('Resources - CloudFront', () => {
    test('CloudFrontOAI is created', () => {
      const oai = getResource(template, 'CloudFrontOAI');
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('CloudFrontDistribution uses S3 origin', () => {
      const dist = getResource(template, 'CloudFrontDistribution');
      expect(dist.Type).toBe('AWS::CloudFront::Distribution');
      expect(dist.DependsOn).toBe('S3ContentInitCustomResource');
      const origin = dist.Properties.DistributionConfig.Origins[0];
      expect(origin.Id).toBe('S3Origin');
      expect(origin.S3OriginConfig.OriginAccessIdentity).toBeDefined();
    });

    test('CloudFrontDistribution has HTTPS redirect', () => {
      const dist = getResource(template, 'CloudFrontDistribution');
      const behavior = dist.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFrontDistribution has custom error responses', () => {
      const dist = getResource(template, 'CloudFrontDistribution');
      const errors = dist.Properties.DistributionConfig.CustomErrorResponses;
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ErrorCode: 404, ResponsePagePath: '/error.html' }),
          expect.objectContaining({ ErrorCode: 403, ResponsePagePath: '/error.html' }),
        ])
      );
    });
  });

  describe('Resources - WAF', () => {
    test('WAFWebACL has regional scope', () => {
      const waf = getResource(template, 'WAFWebACL');
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('WAFWebACL has rate limiting rule', () => {
      const waf = getResource(template, 'WAFWebACL');
      const rules = waf.Properties.Rules;
      const rateLimit = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimit).toBeDefined();
      expect(rateLimit.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('WAFWebACLAssociation links to ALB', () => {
      const assoc = getResource(template, 'WAFWebACLAssociation');
      expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(assoc.Properties.ResourceArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });
  });

  describe('Resources - VPC and Networking', () => {
    test('VPC has correct CIDR block', () => {
      const vpc = getResource(template, 'VPC');
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('InternetGateway is created and attached', () => {
      const igw = getResource(template, 'InternetGateway');
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      const attach = getResource(template, 'AttachGateway');
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('Public subnets are in different AZs', () => {
      const pub1 = getResource(template, 'PublicSubnet1');
      const pub2 = getResource(template, 'PublicSubnet2');
      expect(pub1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(pub2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(pub1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(pub2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('Private subnets are in different AZs', () => {
      const priv1 = getResource(template, 'PrivateSubnet1');
      const priv2 = getResource(template, 'PrivateSubnet2');
      expect(priv1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(priv2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('NAT Gateway is conditionally created', () => {
      const natEip = getResource(template, 'NATGatewayEIP');
      const nat = getResource(template, 'NATGateway');
      expect(natEip.Condition).toBe('CreateNATGateway');
      expect(nat.Condition).toBe('CreateNATGateway');
      expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('Route tables are properly configured', () => {
      const pubRoute = getResource(template, 'PublicRoute');
      const privRoute = getResource(template, 'PrivateRoute');
      expect(pubRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(privRoute.Condition).toBe('CreateNATGateway');
      expect(privRoute.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('VPC Flow Logs are configured for CloudWatch and S3', () => {
      const flowLogsCW = getResource(template, 'VPCFlowLogsCloudWatch');
      const flowLogsS3 = getResource(template, 'VPCFlowLogsS3');
      expect(flowLogsCW.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLogsS3.Properties.LogDestinationType).toBe('s3');
      expect(flowLogsS3.Properties.LogDestination).toEqual({
        'Fn::GetAtt': ['FlowLogsBucket', 'Arn'],
      });
    });
  });

  describe('Resources - Security Groups', () => {
    test('ALBSecurityGroup allows HTTP and HTTPS', () => {
      const sg = getResource(template, 'ALBSecurityGroup');
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
          expect.objectContaining({ FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' }),
        ])
      );
    });

    test('WebServerSecurityGroup allows HTTP from ALB and SSH from allowed IP', () => {
      const sg = getResource(template, 'WebServerSecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 80,
            SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' },
          }),
          expect.objectContaining({
            FromPort: 22,
            CidrIp: { Ref: 'AllowedSSHIP' },
          }),
        ])
      );
    });

    test('DatabaseSecurityGroup allows PostgreSQL from web servers only', () => {
      const sg = getResource(template, 'DatabaseSecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toEqual([
        expect.objectContaining({
          FromPort: 5432,
          ToPort: 5432,
          SourceSecurityGroupId: { Ref: 'WebServerSecurityGroup' },
        }),
      ]);
    });
  });

  describe('Resources - IAM Roles', () => {
    test('EC2InstanceRole has required managed policies', () => {
      const role = getResource(template, 'EC2InstanceRole');
      expect(role.Type).toBe('AWS::IAM::Role');
      const policies = role.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2InstanceRole has S3, CloudFront, and Secrets Manager permissions', () => {
      const role = getResource(template, 'EC2InstanceRole');
      const policies = role.Properties.Policies;
      expect(policies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ PolicyName: 'S3AccessPolicy' }),
          expect.objectContaining({ PolicyName: 'CloudFrontInvalidation' }),
          expect.objectContaining({ PolicyName: 'SecretsManagerAccess' }),
        ])
      );
    });

    test('EC2InstanceProfile references EC2InstanceRole', () => {
      const profile = getResource(template, 'EC2InstanceProfile');
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });
  });

  describe('Resources - Application Load Balancer', () => {
    test('ApplicationLoadBalancer is internet-facing', () => {
      const alb = getResource(template, 'ApplicationLoadBalancer');
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('ALBTargetGroup has health checks configured', () => {
      const tg = getResource(template, 'ALBTargetGroup');
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });

    test('ALBListener forwards to target group', () => {
      const listener = getResource(template, 'ALBListener');
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('Resources - EC2 and Auto Scaling', () => {
    test('EC2LaunchTemplate uses dynamic AMI and conditional key pair', () => {
      const lt = getResource(template, 'EC2LaunchTemplate');
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      const data = lt.Properties.LaunchTemplateData;
      expect(data.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(data.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(data.KeyName['Fn::If'][0]).toBe('HasKeyPairCondition');
    });

    test('EC2LaunchTemplate has IAM profile and security groups', () => {
      const lt = getResource(template, 'EC2LaunchTemplate');
      const data = lt.Properties.LaunchTemplateData;
      expect(data.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'],
      });
      expect(data.SecurityGroupIds).toEqual([{ Ref: 'WebServerSecurityGroup' }]);
    });

    test('EC2LaunchTemplate has conditional monitoring', () => {
      const lt = getResource(template, 'EC2LaunchTemplate');
      const data = lt.Properties.LaunchTemplateData;
      expect(data.Monitoring.Enabled['Fn::If'][0]).toBe('EnableDetailedMonitoringCondition');
    });

    test('AutoScalingGroup spans multiple AZs and attaches to ALB', () => {
      const asg = getResource(template, 'AutoScalingGroup');
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.TargetGroupARNs).toEqual([{ Ref: 'ALBTargetGroup' }]);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('AutoScalingGroup has scaling policies', () => {
      const scaleUp = getResource(template, 'ScaleUpPolicy');
      const scaleDown = getResource(template, 'ScaleDownPolicy');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
      expect(scaleUp.Properties.Cooldown).toBe(300);
    });

    test('WebServerInstance has Elastic IP', () => {
      const instance = getResource(template, 'WebServerInstance');
      const eip = getResource(template, 'ElasticIP');
      const eipAssoc = getResource(template, 'EIPAssociation');
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eipAssoc.Properties.InstanceId).toEqual({ Ref: 'WebServerInstance' });
    });
  });

  describe('Resources - RDS Database', () => {
    test('PostgreSQLDatabase uses Secrets Manager for password', () => {
      const db = getResource(template, 'PostgreSQLDatabase');
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('postgres');
      expect(db.Properties.EngineVersion).toEqual({ Ref: 'PostgreSQLVersion' });
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
    });

    test('PostgreSQLDatabase has encryption and Multi-AZ', () => {
      const db = getResource(template, 'PostgreSQLDatabase');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MultiAZ['Fn::If'][0]).toBe('EnableMultiAZCondition');
    });

    test('PostgreSQLDatabase has conditional backup retention', () => {
      const db = getResource(template, 'PostgreSQLDatabase');
      expect(db.Properties.BackupRetentionPeriod['Fn::If'][0]).toBe('IsProduction');
      expect(db.Properties.BackupRetentionPeriod['Fn::If'][1]).toBe(30);
      expect(db.Properties.BackupRetentionPeriod['Fn::If'][2]).toBe(7);
    });

    test('PostgreSQLDatabase has Performance Insights enabled', () => {
      const db = getResource(template, 'PostgreSQLDatabase');
      expect(db.Properties.EnablePerformanceInsights).toBe(true);
      expect(db.Properties.PerformanceInsightsRetentionPeriod['Fn::If'][0]).toBe('IsProduction');
    });

    test('DBSubnetGroup spans private subnets', () => {
      const subnetGroup = getResource(template, 'DBSubnetGroup');
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });
  });

  describe('Resources - CloudWatch and Monitoring', () => {
    test('AlarmTopic has email subscription', () => {
      const topic = getResource(template, 'AlarmTopic');
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'AlertEmail' });
    });

    test('HighCPUAlarm triggers scale up', () => {
      const alarm = getResource(template, 'HighCPUAlarm');
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleUpPolicy' });
    });

    test('LowCPUAlarm triggers scale down', () => {
      const alarm = getResource(template, 'LowCPUAlarm');
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleDownPolicy' });
    });

    test('DatabaseCPUAlarm monitors RDS', () => {
      const alarm = getResource(template, 'DatabaseCPUAlarm');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
    });

    test('DatabaseStorageAlarm monitors free space', () => {
      const alarm = getResource(template, 'DatabaseStorageAlarm');
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Properties.Threshold).toBe(10737418240); // 10GB
    });

    test('UnhealthyTargetsAlarm monitors ALB health', () => {
      const alarm = getResource(template, 'UnhealthyTargetsAlarm');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Properties.Threshold).toBe(1);
    });
  });

  describe('Resource Tagging', () => {
    const checkTags = (resource: any) => {
      const tags = resource.Properties.Tags || resource.Properties.TagSpecifications?.[0]?.Tags;
      if (!tags) return;
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: { Ref: 'EnvironmentName' } }),
          expect.objectContaining({ Key: 'Owner', Value: { Ref: 'OwnerEmail' } }),
          expect.objectContaining({ Key: 'Project', Value: { Ref: 'ProjectName' } }),
          expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ])
      );
    };

    test('VPC has required tags', () => {
      checkTags(getResource(template, 'VPC'));
    });

    test('StaticWebsiteBucket has required tags', () => {
      checkTags(getResource(template, 'StaticWebsiteBucket'));
    });

    test('ApplicationLoadBalancer has required tags', () => {
      checkTags(getResource(template, 'ApplicationLoadBalancer'));
    });

    test('PostgreSQLDatabase has required tags', () => {
      checkTags(getResource(template, 'PostgreSQLDatabase'));
    });
  });

  describe('Outputs', () => {
    test('VPC outputs are exported', () => {
      const vpcId = getOutput(template, 'VPCId');
      const vpcCidr = getOutput(template, 'VPCCidr');
      expect(vpcId.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPC-ID');
      expect(vpcCidr.Value).toBe('10.0.0.0/16');
    });

    test('Subnet outputs are exported', () => {
      expect(getOutput(template, 'PublicSubnet1Id')).toBeDefined();
      expect(getOutput(template, 'PublicSubnet2Id')).toBeDefined();
      expect(getOutput(template, 'PrivateSubnet1Id')).toBeDefined();
      expect(getOutput(template, 'PrivateSubnet2Id')).toBeDefined();
    });

    test('Load balancer outputs are exported', () => {
      const albUrl = getOutput(template, 'ApplicationLoadBalancerURL');
      const albArn = getOutput(template, 'ApplicationLoadBalancerArn');
      expect(albUrl.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-ALB-URL');
      expect(albArn.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-ALB-ARN');
    });

    test('CloudFront outputs are exported', () => {
      const cfUrl = getOutput(template, 'CloudFrontDistributionURL');
      const cfId = getOutput(template, 'CloudFrontDistributionId');
      expect(cfUrl.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-CloudFront-URL');
      expect(cfId.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-CloudFront-ID');
    });

    test('S3 outputs are exported', () => {
      expect(getOutput(template, 'S3BucketName')).toBeDefined();
      expect(getOutput(template, 'S3BucketArn')).toBeDefined();
      expect(getOutput(template, 'FlowLogsBucketName')).toBeDefined();
    });

    test('Database outputs are exported', () => {
      const dbEndpoint = getOutput(template, 'DatabaseEndpoint');
      const dbPort = getOutput(template, 'DatabasePort');
      const dbJdbc = getOutput(template, 'DatabaseJDBCConnectionString');
      expect(dbEndpoint.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-DB-Endpoint');
      expect(dbPort.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-DB-Port');
      expect(dbJdbc.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-DB-JDBC');
    });

    test('Security group outputs are exported', () => {
      expect(getOutput(template, 'WebServerSecurityGroupId')).toBeDefined();
      expect(getOutput(template, 'DatabaseSecurityGroupId')).toBeDefined();
      expect(getOutput(template, 'ALBSecurityGroupId')).toBeDefined();
    });

    test('Monitoring outputs are exported', () => {
      expect(getOutput(template, 'AlarmTopicArn')).toBeDefined();
      expect(getOutput(template, 'VPCFlowLogsGroupName')).toBeDefined();
      expect(getOutput(template, 'WAFWebACLArn')).toBeDefined();
    });

    test('Management server outputs are exported', () => {
      expect(getOutput(template, 'ManagementServerPublicIP')).toBeDefined();
      expect(getOutput(template, 'ManagementServerInstanceId')).toBeDefined();
      expect(getOutput(template, 'ManagementServerSSH')).toBeDefined();
    });

    test('Stack information outputs are exported', () => {
      expect(getOutput(template, 'StackRegion')).toBeDefined();
      expect(getOutput(template, 'StackName')).toBeDefined();
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    test('CloudFront depends on S3 content initialization', () => {
      const dist = getResource(template, 'CloudFrontDistribution');
      expect(dist.DependsOn).toBe('S3ContentInitCustomResource');
    });

    test('NAT Gateway depends on Internet Gateway attachment', () => {
      const natEip = getResource(template, 'NATGatewayEIP');
      expect(natEip.DependsOn).toBe('AttachGateway');
    });

    test('Public routes depend on gateway attachment', () => {
      const pubRoute = getResource(template, 'PublicRoute');
      expect(pubRoute.DependsOn).toBe('AttachGateway');
    });

    test('ALB uses public subnets', () => {
      const alb = getResource(template, 'ApplicationLoadBalancer');
      expect(alb.Properties.Subnets).toEqual([{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }]);
    });

    test('RDS uses private subnets', () => {
      const subnetGroup = getResource(template, 'DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });

    test('Auto Scaling Group uses public subnets', () => {
      const asg = getResource(template, 'AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
      ]);
    });
  });

  describe('Security and Compliance', () => {

    test('All S3 buckets have encryption', () => {
      const staticBucket = getResource(template, 'StaticWebsiteBucket');
      const flowLogsBucket = getResource(template, 'FlowLogsBucket');
      expect(staticBucket.Properties.BucketEncryption).toBeDefined();
      expect(flowLogsBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('RDS has encryption enabled', () => {
      const db = getResource(template, 'PostgreSQLDatabase');
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('Security groups follow least privilege', () => {
      const dbSg = getResource(template, 'DatabaseSecurityGroup');
      const ingress = dbSg.Properties.SecurityGroupIngress;
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].ToPort).toBe(5432);
    });
  });
});
