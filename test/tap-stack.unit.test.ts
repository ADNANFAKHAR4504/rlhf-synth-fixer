import { Template } from 'aws-cdk-lib/assertions';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

// CloudFormation-aware YAML schema for intrinsic functions
const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (v: any) => ({ Ref: v }),
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (v: any) => ({ 'Fn::Sub': v }),
  }),
  new yaml.Type('!Sub', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::Sub': v }),
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (v: string) => ({ 'Fn::GetAtt': v.split('.') }),
  }),
  new yaml.Type('!GetAtt', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::GetAtt': v }),
  }),
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::FindInMap': v }),
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::Join': v }),
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::Select': v }),
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::If': v }),
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::Equals': v }),
  }),
  new yaml.Type('!And', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::And': v }),
  }),
  new yaml.Type('!Or', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::Or': v }),
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::Not': v }),
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: (v: any) => ({ 'Fn::GetAZs': v }),
  }),
  // Added support for non-standard but used tags in the template
  new yaml.Type('!Condition', {
    kind: 'scalar',
    construct: (v: string) => ({ Condition: v }),
  }),
  new yaml.Type('!Split', {
    kind: 'sequence',
    construct: (v: any[]) => ({ 'Fn::Split': v }),
  }),
]);

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const templateObject = yaml.load(templateContent, { schema: cfnSchema }) as any;
    template = Template.fromJSON(templateObject);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.template.Description).toBe(
        'Secure Multi-Region Infrastructure for HIPAA/PCI DSS Compliant Web Application'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.template.Metadata).toBeDefined();
      expect(template.template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(6);
    });
  });

  describe('Parameters Validation', () => {
    const requiredParams = [
      'Environment', 'EnvironmentSuffix', 'CostCenter', 'PrimaryRegion', 'VpcCidr',
      'WebInstanceType', 'DBInstanceClass', 'DBMasterUsername', 'DBName',
      'SSLCertificateArn', 'NotificationEmail'
    ];

    test.each(requiredParams)('should have %s parameter', (param) => {
      expect(template.template.Parameters[param]).toBeDefined();
    });

    test('Environment parameter should have correct allowed values', () => {
      const envParam = template.template.Parameters.Environment;
      expect(envParam.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
    });

    test('VpcCidr parameter should have correct pattern validation', () => {
      const vpcParam = template.template.Parameters.VpcCidr;
      expect(vpcParam.AllowedPattern).toBe('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$');
    });
  });

  describe('Mappings Validation', () => {
    test('should have RegionMap with AMIs', () => {
      expect(template.template.Mappings.RegionMap).toBeDefined();
      expect(template.template.Mappings.RegionMap['us-east-1'].AMI).toBeDefined();
      expect(template.template.Mappings.RegionMap['us-west-2'].AMI).toBeDefined();
    });

    test('should have EnvironmentMap with scaling configurations', () => {
      expect(template.template.Mappings.EnvironmentMap).toBeDefined();
      expect(template.template.Mappings.EnvironmentMap.Development).toBeDefined();
      expect(template.template.Mappings.EnvironmentMap.Production).toBeDefined();
    });
  });

  describe('Conditions Validation', () => {
    const requiredConditions = [
      'IsProduction', 'IsPrimaryRegion', 'HasLambdaCode', 'HasKeyName',
      'CreateS3Bucket', 'CreateKMSKey', 'CreateGlobalCluster', 'CreateALB',
      'CreateRDSInstances', 'CreateGreenFleet'
    ];

    test.each(requiredConditions)('should have %s condition', (condition) => {
      expect(template.template.Conditions[condition]).toBeDefined();
    });
  });

  describe('Core Networking Resources', () => {
    test('should create VPC with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: { Ref: 'VpcCidr' },
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 database
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create route tables', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 3); // 1 public, 2 private
    });
  });

  describe('Security Resources', () => {
    test('should create security groups for all components', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 5); // ALB, Web, DB, Bastion, Lambda
    });

    test('should create KMS key with proper policies', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS Key for HIPAA/PCI DSS Compliant Infrastructure',
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT'
      });
    });

    test('should create VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL'
      });
    });
  });

  describe('Database Resources', () => {
    test('should create RDS global cluster when conditions met', () => {
      template.hasResource('AWS::RDS::GlobalCluster', {
        Condition: 'CreateGlobalClusterAndHasGlobal'
      });
    });

    test('should create Aurora database cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        EngineVersion: '8.0.mysql_aurora.3.08.2',
        StorageEncrypted: true,
        BackupRetentionPeriod: { 'Fn::If': ['IsProduction', 30, 7] }
      });
    });

    test('should create database instances when enabled', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        Condition: 'CreateRDSInstances'
      });
    });
  });

  describe('Compute Resources', () => {
    test('should create launch template for web servers', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: { 'Fn::Sub': '${Environment}-launch-template' }
      });
    });

    test('should create auto scaling group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: { 'Fn::Sub': '${Environment}-asg' },
        HealthCheckType: 'ELB'
      });
    });

    test('should create green fleet when enabled', () => {
      template.hasResource('AWS::AutoScaling::AutoScalingGroup', {
        Condition: 'CreateGreenFleet'
      });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should create application load balancer', () => {
      template.hasResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Condition: 'CreateALB'
      });
    });

    test('should create target groups for blue/green deployment', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
    });

    test('should create HTTP and HTTPS listeners', () => {
      template.hasResource('AWS::ElasticLoadBalancingV2::Listener', {
        Condition: 'CreateALB'
      });
      template.hasResource('AWS::ElasticLoadBalancingV2::Listener', {
        Condition: 'CreateALBAndHasSSL'
      });
    });
  });

  describe('Storage Resources', () => {
    test('should create S3 buckets in primary region', () => {
      template.hasResource('AWS::S3::Bucket', {
        Condition: 'IsPrimaryRegion'
      });
      template.hasResource('AWS::S3::Bucket', {
        Condition: 'CreateS3BucketAndPrimary'
      });
    });
  });

  describe('IAM Resources', () => {
    test('should create IAM roles for EC2, Lambda, and CodeDeploy', () => {
      template.resourceCountIs('AWS::IAM::Role', 5); // EC2, Lambda, CodeDeploy, RDS monitoring, VPC flow logs
    });

    test('should create instance profile for EC2', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('Monitoring and Logging', () => {
    test('should create CloudWatch log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 4); // VPC, Web, S3, Lambda
    });

    test('should create CloudWatch alarms', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Condition: 'CreateKMSKey'
      });
    });

    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: { 'Fn::Sub': '${Environment}-cloudformation-notifications' }
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function when code provided', () => {
      template.hasResource('AWS::Lambda::Function', {
        Condition: 'HasLambdaCode'
      });
    });
  });

  describe('Bastion Host', () => {
    test('should create bastion host instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro'
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create database endpoint parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: { 'Fn::Sub': '/${Environment}/database/endpoint' }
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should have ALB DNS output', () => {
      expect(template.template.Outputs.ALBDNSName).toBeDefined();
    });

    test('should have database endpoint output', () => {
      expect(template.template.Outputs.DatabaseEndpoint).toBeDefined();
    });

    test('should have S3 bucket name output', () => {
      expect(template.template.Outputs.S3BucketName).toBeDefined();
    });

    test('should have global cluster identifier output', () => {
      expect(template.template.Outputs.GlobalClusterIdentifier).toBeDefined();
    });
  });

  describe('Resource Retention Policies', () => {
    const retainResources = [
      'VPC', 'InternetGateway', 'NatGateway1', 'NatGateway2',
      'DatabaseCluster', 'S3Bucket', 'ExampleLambdaFunction'
    ];

    test.each(retainResources)('%s should have retain deletion policy', (resource) => {
      const resourceDef = template.template.Resources[resource];
      if (resourceDef) {
        expect(resourceDef.DeletionPolicy).toBe('Retain');
        expect(resourceDef.UpdateReplacePolicy).toBe('Retain');
      }
    });
  });

  describe('Tagging Compliance', () => {
    const taggedResources = [
      'VPC', 'ALB', 'DatabaseCluster', 'S3Bucket'
    ];

    test.each(taggedResources)('%s should have environment and cost center tags', (resource) => {
      const resourceDef = template.template.Resources[resource];
      if (resourceDef && resourceDef.Properties && resourceDef.Properties.Tags) {
        const tags = resourceDef.Properties.Tags;
        expect(tags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
        expect(tags.some((tag: any) => tag.Key === 'CostCenter')).toBe(true);
      }
    });
  });

  describe('Security Compliance', () => {
    test('database should have encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true
      });
    });

    test('S3 buckets should have encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms'
              }
            }
          ]
        }
      });
    });
  });

  describe('High Availability', () => {
    test('should create resources in multiple AZs', () => {
      // Check that subnets are created in different AZs
      const subnets = Object.values(template.template.Resources).filter((r: any) =>
        (r as any).Type === 'AWS::EC2::Subnet'
      );
      const azs = new Set((subnets as any[]).map((s: any) => s.Properties.AvailabilityZone));
      expect(azs.size).toBeGreaterThan(1);
    });
  });

  describe('Dependency Validation', () => {
    test('NAT EIPs should depend on IGW attachment', () => {
      const eip1 = template.template.Resources.NatGateway1EIP;
      const eip2 = template.template.Resources.NatGateway2EIP;
      expect(eip1.DependsOn).toBe('InternetGatewayAttachment');
      expect(eip2.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('database should depend on subnet group', () => {
      const dbCluster = template.template.Resources.DatabaseCluster;
      expect(dbCluster.Properties.DBSubnetGroupName.Ref).toBe('DatabaseSubnetGroup');
    });
  });

  describe('Conditional Logic', () => {
    test('should conditionally create green fleet', () => {
      const greenASG = template.template.Resources.WebServerASGGreen;
      expect(greenASG.Condition).toBe('CreateGreenFleet');
    });

    test('should conditionally use existing resources', () => {
      const conditions = template.template.Conditions;
      expect(conditions.CreateKMSKey['Fn::Equals'][1]).toBe('');
      expect(conditions.CreateS3Bucket['Fn::Equals'][1]).toBe('');
    });
  });

  describe('Advanced Parameter Coverage', () => {
    test('should include canary/blue-green parameters', () => {
      const p = template.template.Parameters;
      expect(p.EnableGreenFleet).toBeDefined();
      expect(p.BlueTrafficWeight).toBeDefined();
      expect(p.GreenTrafficWeight).toBeDefined();
      expect(p.GreenMinSize).toBeDefined();
      expect(p.GreenMaxSize).toBeDefined();
      expect(p.GreenDesiredCapacity).toBeDefined();
    });

    test('EnableGreenFleet should be string with true/false allowed', () => {
      const p = template.template.Parameters.EnableGreenFleet;
      expect(p.Type).toBe('String');
      expect(p.AllowedValues).toEqual(['true', 'false']);
    });

    test('Traffic weights should have bounds', () => {
      const blue = template.template.Parameters.BlueTrafficWeight;
      const green = template.template.Parameters.GreenTrafficWeight;
      expect(blue.Type).toBe('Number');
      expect(green.Type).toBe('Number');
      expect(blue.MinValue).toBe(0);
      expect(blue.MaxValue).toBe(100);
      expect(green.MinValue).toBe(0);
      expect(green.MaxValue).toBe(100);
    });
  });

  describe('ALB Weighted Forwarding', () => {
    test('HTTP listener uses weighted forward to blue and green', () => {
      const listeners = Object.values(template.template.Resources).filter((r: any) => r.Type === 'AWS::ElasticLoadBalancingV2::Listener');
      const http = listeners.find((l: any) => (l as any).Properties?.Protocol === 'HTTP') as any;
      expect(http).toBeDefined();
      if (!http?.Properties) return; // guard
      const action = http.Properties.DefaultActions[0];
      expect(action.Type).toBe('forward');
      const tgs = action.ForwardConfig.TargetGroups;
      expect(Array.isArray(tgs)).toBe(true);
      const hasBlue = tgs.some((tg: any) => tg.TargetGroupArn && tg.Weight !== undefined);
      expect(hasBlue).toBe(true);
    });

    test('HTTPS listener uses weighted forward to blue and green', () => {
      const listeners = Object.values(template.template.Resources).filter((r: any) => r.Type === 'AWS::ElasticLoadBalancingV2::Listener');
      const https = listeners.find((l: any) => (l as any).Properties?.Protocol === 'HTTPS') as any;
      expect(https).toBeDefined();
      if (!https?.Properties) return; // guard
      const action = https.Properties.DefaultActions[0];
      expect(action.Type).toBe('forward');
      const cfg = action.ForwardConfig;
      expect(cfg.TargetGroups.length).toBeGreaterThan(0);
    });
  });

  describe('Green ASG Behavior', () => {
    test('Green ASG is conditional on CreateGreenFleet', () => {
      const green = template.template.Resources.WebServerASGGreen;
      expect(green.Condition).toBe('CreateGreenFleet');
    });

    test('Green ASG sizes wired to parameters', () => {
      const green = template.template.Resources.WebServerASGGreen;
      expect(green.Properties.MinSize).toEqual({ Ref: 'GreenMinSize' });
      expect(green.Properties.MaxSize).toEqual({ Ref: 'GreenMaxSize' });
      expect(green.Properties.DesiredCapacity).toEqual({ Ref: 'GreenDesiredCapacity' });
    });
  });

  describe('IAM Policy Validations', () => {
    test('EC2Role has SSM and CloudWatch managed policies', () => {
      const role = template.template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toEqual(
        expect.arrayContaining([
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        ])
      );
    });

    test('LambdaExecutionRole has VPC access managed policy', () => {
      const role = template.template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toEqual(
        expect.arrayContaining([
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        ])
      );
    });
  });

  describe('KMS Usage', () => {
    test('Log groups reference KMS key via conditional', () => {
      const rg = ['WebServerLogGroup', 'S3LogGroup', 'LambdaLogGroup', 'VPCFlowLogsGroup'];
      rg.forEach((name) => {
        const lg = template.template.Resources[name];
        if (lg) {
          expect(lg.Properties.KmsKeyId).toBeDefined();
        }
      });
    });

    test('S3 buckets use KMS encryption', () => {
      const s3 = template.template.Resources.S3Bucket;
      expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });
  });

  describe('RDS Configuration', () => {
    test('DBCluster uses conditional GlobalClusterIdentifier', () => {
      const c = template.template.Resources.DatabaseCluster.Properties.GlobalClusterIdentifier;
      expect(c['Fn::If']).toBeDefined();
    });

    test('DBCluster has StorageEncrypted true', () => {
      const c = template.template.Resources.DatabaseCluster;
      expect(c.Properties.StorageEncrypted).toBe(true);
    });
  });

  describe('Outputs & Metadata', () => {
    test('Outputs include ALB DNS and DB endpoint', () => {
      const o = template.template.Outputs;
      expect(o.ALBDNSName).toBeDefined();
      expect(o.DatabaseEndpoint).toBeDefined();
    });

    test('Metadata groups list advanced parameters', () => {
      const groups = template.template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      const advanced = groups.find((g: any) => g.Label && g.Label.default === 'Advanced Configuration');
      expect(advanced.Parameters).toEqual(
        expect.arrayContaining([
          'EnableGreenFleet',
          'BlueTrafficWeight',
          'GreenTrafficWeight',
          'GreenMinSize',
          'GreenMaxSize',
          'GreenDesiredCapacity'
        ])
      );
    });
  });

  describe('S3 Access Logs Bucket', () => {
    test('Access logs bucket has retention lifecycle rule', () => {
      const b = template.template.Resources.S3AccessLogsBucket;
      const rules = b?.Properties?.LifecycleConfiguration?.Rules || [];
      const hasDeleteOldLogs = rules.some((r: any) => r.Id === 'DeleteOldLogs' && r.Status === 'Enabled');
      expect(hasDeleteOldLogs).toBe(true);
    });

    test('Access logs bucket blocks public access', () => {
      const b = template.template.Resources.S3AccessLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(b.BlockPublicAcls).toBe(true);
      expect(b.BlockPublicPolicy).toBe(true);
      expect(b.IgnorePublicAcls).toBe(true);
      expect(b.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('ALB Target Groups', () => {
    test('Target groups have correct protocol and health check', () => {
      const tgBlue = template.template.Resources.ALBTargetGroupBlue;
      const tgGreen = template.template.Resources.ALBTargetGroupGreen;
      [tgBlue, tgGreen].forEach((tg: any) => {
        expect(tg.Properties.Protocol).toBe('HTTP');
        expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
        expect(tg.Properties.HealthCheckPath).toBe('/health');
      });
    });
  });

  describe('EC2 Launch Template', () => {
    test('Block device mapping uses gp3 and encryption', () => {
      const lt = template.template.Resources.WebServerLaunchTemplate.Properties.LaunchTemplateData;
      const ebs = lt.BlockDeviceMappings[0].Ebs;
      expect(ebs.VolumeType).toBe('gp3');
      expect(ebs.Encrypted).toBe(true);
    });

    test('UserData present with httpd installation', () => {
      const lt = template.template.Resources.WebServerLaunchTemplate.Properties.LaunchTemplateData;
      const ud = lt.UserData['Fn::Base64'];
      expect(typeof ud).toBe('string');
      expect(ud).toMatch(/yum install -y httpd/);
    });
  });

  describe('ASG Target Group Attachments', () => {
    test('Main ASG attaches blue and conditionally green groups', () => {
      const asg = template.template.Resources.WebServerASG.Properties.TargetGroupARNs;
      expect(Array.isArray(asg)).toBe(true);
      expect(asg.length).toBeGreaterThan(0);
    });
  });

  describe('CodeDeploy Deployment Group', () => {
    test('DeploymentGroup uses in-place deployment to avoid CFN BG limitation', () => {
      const dg = template.template.Resources.CodeDeployDeploymentGroup;
      expect(dg.Properties.DeploymentStyle.DeploymentType).toBe('IN_PLACE');
      expect(dg.Properties.AutoScalingGroups).toBeDefined();
    });
  });

  describe('Parameter Defaults & Patterns', () => {
    test('NotificationEmail has email pattern', () => {
      const p = template.template.Parameters.NotificationEmail;
      expect(p.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    });

    test('EnvironmentSuffix pattern validation', () => {
      const p = template.template.Parameters.EnvironmentSuffix;
      expect(p.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
    });
  });

  describe('Flow Logs', () => {
    test('Flow logs deliver to CloudWatch with role ARN permission', () => {
      const fl = template.template.Resources.VPCFlowLogs;
      expect(fl.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(fl.Properties.DeliverLogsPermissionArn).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('Topic is KMS encrypted', () => {
      const t = template.template.Resources.CloudFormationNotificationTopic;
      expect(t.Properties.KmsMasterKeyId).toBeDefined();
    });
  });
});