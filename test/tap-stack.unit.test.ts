/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive Jest tests for the "secure, highly available AWS infrastructure" 
 * CloudFormation template (TapStack.json) - Updated for enhanced template
 */

import fs from 'fs';
import path from 'path';

const environment = process.env.ENVIRONMENT || 'prod';

describe('TapStack CloudFormation Template', () => {
  let template: any;

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

  describe('Basic Template Checks', () => {
    test('template is loaded successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('description matches expected value', () => {
      expect(template.Description).toBe(
        'Secure, highly available AWS infrastructure for web application with VPC, subnets, ALB, EC2, and S3 in us-west-2'
      );
    });

    test('template has all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('template defines exactly six parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(6);
    });

    test('core parameters exist with correct schema', () => {
      const params = template.Parameters;
      
      // Environment
      expect(params.Environment.Type).toBe('String');
      expect(params.Environment.Default).toBe('Production');
      expect(params.Environment.Description).toBe('Environment name for tagging');

      // KeyPairName
      expect(params.KeyPairName.Type).toBe('String');
      expect(params.KeyPairName.Default).toBe('');
      expect(params.KeyPairName.Description).toBe('Optional EC2 KeyPair name for SSH access (leave empty to disable)');

      // AmiId
      expect(params.AmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(params.AmiId.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');

      // InstanceType
      expect(params.InstanceType.Type).toBe('String');
      expect(params.InstanceType.Default).toBe('t3.micro');
      expect(params.InstanceType.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);

      // EnableVPCFlowLogs
      expect(params.EnableVPCFlowLogs.Type).toBe('String');
      expect(params.EnableVPCFlowLogs.Default).toBe('true');
      expect(params.EnableVPCFlowLogs.AllowedValues).toEqual(['true', 'false']);

      // EnableALBAccessLogs
      expect(params.EnableALBAccessLogs.Type).toBe('String');
      expect(params.EnableALBAccessLogs.Default).toBe('true');
      expect(params.EnableALBAccessLogs.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('Conditions', () => {
    test('all conditions exist with correct logic', () => {
      const conditions = template.Conditions;
      
      expect(conditions.HasKeyPair).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ 'Ref': 'KeyPairName' }, ''] }]
      });

      expect(conditions.EnableFlowLogs).toEqual({
        'Fn::Equals': [{ 'Ref': 'EnableVPCFlowLogs' }, 'true']
      });

      expect(conditions.EnableAccessLogs).toEqual({
        'Fn::Equals': [{ 'Ref': 'EnableALBAccessLogs' }, 'true']
      });
    });
  });

  describe('VPC & Networking', () => {
    test('VPC has correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('subnets are configured correctly', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      // Public subnets
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Private subnets
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('VPC Flow Logs are conditionally created', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLog).toBeDefined();
      
      // Check conditions
      expect(template.Resources.VPCFlowLogRole.Condition).toBe('EnableFlowLogs');
      expect(template.Resources.VPCFlowLogGroup.Condition).toBe('EnableFlowLogs');
      expect(template.Resources.VPCFlowLog.Condition).toBe('EnableFlowLogs');
    });
  });

  describe('Security Groups', () => {
    test('all security groups exist with proper configuration', () => {
      const defaultSG = template.Resources.DefaultSecurityGroup;
      const albSG = template.Resources.ApplicationLoadBalancerSG;
      const ec2SG = template.Resources.EC2SecurityGroup;
      
      expect(defaultSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(ec2SG.Type).toBe('AWS::EC2::SecurityGroup');
      
      // Check descriptions
      expect(defaultSG.Properties.GroupDescription).toBe('Default security group allowing internal VPC traffic only');
      expect(albSG.Properties.GroupDescription).toBe('Load balancer security group allowing HTTP and HTTPS');
      expect(ec2SG.Properties.GroupDescription).toBe('Security group for EC2 instances allowing ALB traffic');
    });

    test('security group ingress rules are separate resources', () => {
      expect(template.Resources.DefaultSecurityGroupIngress).toBeDefined();
      expect(template.Resources.EC2SecurityGroupIngress).toBeDefined();
      
      expect(template.Resources.DefaultSecurityGroupIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(template.Resources.EC2SecurityGroupIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
    });
  });

  describe('Enhanced S3 Configuration', () => {
    test('KMS key for S3 encryption exists', () => {
      const kmsKey = template.Resources.S3KMSKey;
      const kmsAlias = template.Resources.S3KMSKeyAlias;
      
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
      expect(kmsAlias.Properties.TargetKeyId).toEqual({ Ref: 'S3KMSKey' });
    });

    test('S3 bucket uses KMS encryption', () => {
      const s3Bucket = template.Resources.S3Bucket;
      
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'S3KMSKey' });
    });

    test('S3 bucket has versioning and lifecycle policies', () => {
      const s3Bucket = template.Resources.S3Bucket;
      
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(s3Bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('ALB access logs bucket is conditionally created', () => {
      const accessLogsBucket = template.Resources.ALBAccessLogsBucket;
      const bucketPolicy = template.Resources.ALBAccessLogsBucketPolicy;
      
      expect(accessLogsBucket.Condition).toBe('EnableAccessLogs');
      expect(bucketPolicy.Condition).toBe('EnableAccessLogs');
    });
  });

  describe('Auto Scaling Group', () => {
    test('Launch Template exists with proper configuration', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'AmiId' });
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds).toContainEqual({ Ref: 'DefaultSecurityGroup' });
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds).toContainEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('Auto Scaling Group has correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
      expect(asg.Properties.TargetGroupARNs).toEqual([{ Ref: 'TargetGroup' }]);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('Scaling Policies exist', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;
      
      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch Alarms exist for auto scaling', () => {
      const cpuHighAlarm = template.Resources.CPUHighAlarm;
      const cpuLowAlarm = template.Resources.CPULowAlarm;
      const albUnhealthyAlarm = template.Resources.ALBUnhealthyHostsAlarm;
      
      expect(cpuHighAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuLowAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(albUnhealthyAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      
      // Check thresholds
      expect(cpuHighAlarm.Properties.Threshold).toBe(70);
      expect(cpuLowAlarm.Properties.Threshold).toBe(20);
      expect(albUnhealthyAlarm.Properties.Threshold).toBe(0);
    });

    test('Alarms are connected to scaling policies', () => {
      const cpuHighAlarm = template.Resources.CPUHighAlarm;
      const cpuLowAlarm = template.Resources.CPULowAlarm;
      
      expect(cpuHighAlarm.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleUpPolicy' });
      expect(cpuLowAlarm.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleDownPolicy' });
    });
  });

  describe('Load Balancer Enhancements', () => {
    test('Load Balancer has enhanced attributes', () => {
      const alb = template.Resources.LoadBalancer;
      
      expect(alb.Properties.LoadBalancerAttributes).toBeDefined();
      
      const accessLogsEnabled = alb.Properties.LoadBalancerAttributes.find(
        (attr: any) => attr.Key === 'access_logs.s3.enabled'
      );
      expect(accessLogsEnabled).toBeDefined();
      
      const idleTimeout = alb.Properties.LoadBalancerAttributes.find(
        (attr: any) => attr.Key === 'idle_timeout.timeout_seconds'
      );
      expect(idleTimeout.Value).toBe('60');
    });

    test('Target Group has enhanced attributes', () => {
      const tg = template.Resources.TargetGroup;
      
      expect(tg.Properties.TargetGroupAttributes).toBeDefined();
      
      const deregDelay = tg.Properties.TargetGroupAttributes.find(
        (attr: any) => attr.Key === 'deregistration_delay.timeout_seconds'
      );
      expect(deregDelay.Value).toBe('30');
    });
  });

  describe('IAM Role Enhancements', () => {
    test('EC2 role has CloudWatch Agent permissions', () => {
      const role = template.Resources.Ec2InstanceRole;
      
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });
  });

  describe('Key Resources Existence', () => {
    const criticalResources = [
      // Original resources
      'VPC', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
      'InternetGateway', 'VPCGatewayAttachment', 'NatGateway1', 'NatGateway2',
      'NatEIP1', 'NatEIP2', 'PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2',
      'DefaultSecurityGroup', 'ApplicationLoadBalancerSG', 'EC2SecurityGroup',
      'LoadBalancer', 'TargetGroup', 'Listener', 'S3Bucket',
      'Ec2InstanceRole', 'EC2InstanceProfile',
      
      // Enhanced resources
      'LaunchTemplate', 'AutoScalingGroup', 'ScaleUpPolicy', 'ScaleDownPolicy',
      'CPUHighAlarm', 'CPULowAlarm', 'ALBUnhealthyHostsAlarm',
      'S3KMSKey', 'S3KMSKeyAlias', 'ALBAccessLogsBucket', 'ALBAccessLogsBucketPolicy',
      'VPCFlowLogRole', 'VPCFlowLogGroup', 'VPCFlowLog'
    ];

    criticalResources.forEach(id =>
      test(`resource ${id} exists`, () => {
        expect(template.Resources[id]).toBeDefined();
      })
    );

    test('template has expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(criticalResources.length);
      expect(resourceCount).toBeLessThanOrEqual(60); // Updated upper bound for enhanced template
    });
  });

  describe('Outputs', () => {
    test('template exposes expected outputs', () => {
      const expectedOutputs = ['VPCId', 'PublicSubnetId', 'LoadBalancerURL', 'AutoScalingGroupName', 'S3BucketName', 'KMSKeyId'];
      
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('conditional outputs exist when conditions are met', () => {
      if (template.Resources.VPCFlowLogGroup) {
        expect(template.Outputs.VPCFlowLogGroup).toBeDefined();
        expect(template.Outputs.VPCFlowLogGroup.Condition).toBe('EnableFlowLogs');
      }
    });

    test('outputs have proper export names', () => {
      expect(template.Outputs.VPCId.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPC-ID' });
      expect(template.Outputs.PublicSubnetId.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PublicSubnet1-ID' });
      expect(template.Outputs.AutoScalingGroupName.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ASG-Name' });
    });

    test('outputs reference correct resources', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.PublicSubnetId.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Outputs.LoadBalancerURL.Value).toEqual({ 'Fn::Sub': 'http://${LoadBalancer.DNSName}' });
      expect(template.Outputs.AutoScalingGroupName.Value).toEqual({ Ref: 'AutoScalingGroup' });
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'S3Bucket' });
      expect(template.Outputs.KMSKeyId.Value).toEqual({ Ref: 'S3KMSKey' });
    });
  });

  describe('Template Structure & Best Practices', () => {
    test('all resources have proper tagging', () => {
      const taggableResourceTypes = [
        'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::InternetGateway',
        'AWS::EC2::RouteTable', 'AWS::EC2::NatGateway', 'AWS::EC2::EIP',
        'AWS::EC2::SecurityGroup', 'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup', 'AWS::S3::Bucket',
        'AWS::IAM::Role', 'AWS::KMS::Key'
      ];
      
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (taggableResourceTypes.includes(resource.Type)) {
          // Only check tags if the resource has a Tags property
          if (resource.Properties.Tags) {
            const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
            expect(envTag).toBeDefined();
            expect(envTag.Value).toEqual({ Ref: 'Environment' });
          }
        }
      });
    });

    test('CIDR blocks follow specification', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('high availability through multi-AZ deployment', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier.length).toBe(2);
      expect(asg.Properties.MinSize).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket blocks public access', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('Launch Template instances are in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('security groups follow least privilege', () => {
      const ec2SGIngress = template.Resources.EC2SecurityGroupIngress;
      expect(ec2SGIngress.Properties.FromPort).toBe(80);
      expect(ec2SGIngress.Properties.ToPort).toBe(80);
      expect(ec2SGIngress.Properties.SourceSecurityGroupId).toEqual({ Ref: 'ApplicationLoadBalancerSG' });
    });
  });
});
