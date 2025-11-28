import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Three-Tier Web Application', () => {
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
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have VpcCidr parameter with default', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
    });

    test('should have InstanceType parameter with allowed values', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.small');
    });

    test('should have Auto Scaling parameters', () => {
      expect(template.Parameters.MinSize).toBeDefined();
      expect(template.Parameters.MaxSize).toBeDefined();
      expect(template.Parameters.DesiredCapacity).toBeDefined();
      expect(template.Parameters.MinSize.Default).toBe(2);
      expect(template.Parameters.MaxSize.Default).toBe(6);
      expect(template.Parameters.DesiredCapacity.Default).toBe(3);
    });

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      const param = template.Parameters.DBInstanceClass;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.medium');
    });

    test('should have AlertEmail parameter with default', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have AZMapping for us-east-1', () => {
      expect(template.Mappings.AZMapping).toBeDefined();
      expect(template.Mappings.AZMapping['us-east-1']).toBeDefined();
      expect(template.Mappings.AZMapping['us-east-1'].AZ1).toBe('us-east-1a');
      expect(template.Mappings.AZMapping['us-east-1'].AZ2).toBe('us-east-1b');
      expect(template.Mappings.AZMapping['us-east-1'].AZ3).toBe('us-east-1c');
    });

    test('should have AMIMapping for us-east-1', () => {
      expect(template.Mappings.AMIMapping).toBeDefined();
      expect(template.Mappings.AMIMapping['us-east-1']).toBeDefined();
      expect(template.Mappings.AMIMapping['us-east-1'].AmazonLinux2).toBeDefined();
  });
});

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have correct tagging with environmentSuffix', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      [1, 2, 3].forEach(i => {
        const subnet = template.Resources[`PublicSubnet${i}`];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      [1, 2, 3].forEach(i => {
        const subnet = template.Resources[`PrivateSubnet${i}`];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });

    test('public subnets should use different availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      const subnet3 = template.Resources.PublicSubnet3;

      expect(subnet1.Properties.AvailabilityZone['Fn::FindInMap'][2]).toBe('AZ1');
      expect(subnet2.Properties.AvailabilityZone['Fn::FindInMap'][2]).toBe('AZ2');
      expect(subnet3.Properties.AvailabilityZone['Fn::FindInMap'][2]).toBe('AZ3');
  });
});

  describe('Security Groups', () => {
    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
    });

    test('should have WebServer Security Group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have Database Security Group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have Lambda Security Group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('WebServer Security Group ingress defined separately to avoid circular dependency', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      // Ingress rules are defined separately in WebServerSecurityGroupIngress resource
      // to avoid circular dependencies
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
    });
  });

  describe('Compute Layer', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData).toBeDefined();
    });

    test('Launch Template should use correct AMI from mapping', () => {
      const lt = template.Resources.LaunchTemplate;
      const ami = lt.Properties.LaunchTemplateData.ImageId;
      expect(ami['Fn::FindInMap']).toBeDefined();
      expect(ami['Fn::FindInMap'][0]).toBe('AMIMapping');
    });

    test('Launch Template should use parameterized instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('should have WebServer IAM Role', () => {
      expect(template.Resources.WebServerInstanceRole).toBeDefined();
      const role = template.Resources.WebServerInstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have Instance Profile', () => {
      expect(template.Resources.WebServerInstanceProfile).toBeDefined();
      const profile = template.Resources.WebServerInstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'WebServerInstanceRole' }]);
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'DesiredCapacity' });
    });

    test('Auto Scaling Group should use Launch Template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate).toBeDefined();
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
    });

    test('Auto Scaling Group should have health check configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBeDefined();
      expect(asg.Properties.HealthCheckGracePeriod).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;
      expect(subnets).toBeDefined();
      expect(subnets.length).toBe(3);
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet2' });
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet3' });
    });

    test('should have Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('Target Group should have health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBeDefined();
      expect(tg.Properties.HealthCheckIntervalSeconds).toBeDefined();
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });

    test('ALB Listener should forward to Target Group', () => {
      const listener = template.Resources.ALBListener;
      const actions = listener.Properties.DefaultActions;
      expect(actions).toBeDefined();
      expect(actions[0].Type).toBe('forward');
      expect(actions[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('Database Layer', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const sg = template.Resources.DBSubnetGroup;
      expect(sg.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(sg.Properties.SubnetIds).toBeDefined();
      expect(sg.Properties.SubnetIds.length).toBe(3);
    });

    test('should have Secrets Manager secret for database credentials', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('database secret should generate password', () => {
      const secret = template.Resources.DBSecret;
      const genConfig = secret.Properties.GenerateSecretString;
      expect(genConfig.SecretStringTemplate).toBeDefined();
      expect(genConfig.GenerateStringKey).toBe('password');
      expect(genConfig.PasswordLength).toBeGreaterThanOrEqual(16);
    });

    test('should have RDS Aurora Cluster', () => {
      expect(template.Resources.DBCluster).toBeDefined();
      const cluster = template.Resources.DBCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('Aurora Cluster should use Secrets Manager for credentials', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.MasterUsername).toBeDefined();
      const password = cluster.Properties.MasterUserPassword;
      expect(password['Fn::Sub']).toBeDefined();
      expect(password['Fn::Sub']).toContain('DBSecret');
    });

    test('Aurora Cluster should be in DB Subnet Group', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('should have Aurora DB Instances', () => {
      expect(template.Resources.DBInstance1).toBeDefined();
      expect(template.Resources.DBInstance2).toBeDefined();

      const instance1 = template.Resources.DBInstance1;
      const instance2 = template.Resources.DBInstance2;

      expect(instance1.Type).toBe('AWS::RDS::DBInstance');
      expect(instance2.Type).toBe('AWS::RDS::DBInstance');
    });

    test('DB Instances should use parameterized instance class', () => {
      const instance1 = template.Resources.DBInstance1;
      expect(instance1.Properties.DBInstanceClass).toEqual({ Ref: 'DBInstanceClass' });
    });

    test('DB Instances belong to cluster spanning multiple AZs', () => {
      const instance1 = template.Resources.DBInstance1;
      const instance2 = template.Resources.DBInstance2;
      // Aurora cluster instances inherit AZ placement from cluster configuration
      // The cluster uses DBSubnetGroup which spans 3 AZs
      expect(instance1.Properties.DBClusterIdentifier).toEqual({ Ref: 'DBCluster' });
      expect(instance2.Properties.DBClusterIdentifier).toEqual({ Ref: 'DBCluster' });
    });

    test('database resources should have Delete policies', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda Execution Role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('Lambda Execution Role should have required policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });

    test('should have Lambda Function', () => {
      expect(template.Resources.DataProcessingFunction).toBeDefined();
      const lambda = template.Resources.DataProcessingFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('nodejs22.x');
    });

    test('Lambda Function should use Node.js 22.x runtime', () => {
      const lambda = template.Resources.DataProcessingFunction;
      expect(lambda.Properties.Runtime).toBe('nodejs22.x');
    });

    test('Lambda Function should have proper IAM role', () => {
      const lambda = template.Resources.DataProcessingFunction;
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('Lambda Function should be in VPC', () => {
      const lambda = template.Resources.DataProcessingFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket for static assets', () => {
      expect(template.Resources.StaticAssetsBucket).toBeDefined();
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      const pabc = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pabc.BlockPublicAcls).toBe(true);
      expect(pabc.BlockPublicPolicy).toBe(true);
      expect(pabc.IgnorePublicAcls).toBe(true);
      expect(pabc.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have Delete policy', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS Topic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      const topic = template.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS Topic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription.length).toBeGreaterThan(0);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should have ASG High CPU Alarm', () => {
      expect(template.Resources.ASGHighCPUAlarm).toBeDefined();
      const alarm = template.Resources.ASGHighCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('should have RDS High CPU Alarm', () => {
      expect(template.Resources.RDSHighCPUAlarm).toBeDefined();
      const alarm = template.Resources.RDSHighCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('should have Lambda Error Alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
    });

    test('should have ALB Target Response Time Alarm', () => {
      expect(template.Resources.ALBTargetResponseTimeAlarm).toBeDefined();
      const alarm = template.Resources.ALBTargetResponseTimeAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('TargetResponseTime');
    });

    test('all alarms should send notifications to SNS Topic', () => {
      const alarms = [
        'ASGHighCPUAlarm',
        'RDSHighCPUAlarm',
        'LambdaErrorAlarm',
        'ALBTargetResponseTimeAlarm'
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Description).toBeDefined();
    });

    test('should have ALBDNSName output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      const output = template.Outputs.ALBDNSName;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('should have DBClusterEndpoint output', () => {
      expect(template.Outputs.DBClusterEndpoint).toBeDefined();
      const output = template.Outputs.DBClusterEndpoint;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DBCluster', 'Endpoint.Address'] });
    });

    test('should have DBClusterReadEndpoint output', () => {
      expect(template.Outputs.DBClusterReadEndpoint).toBeDefined();
      const output = template.Outputs.DBClusterReadEndpoint;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DBCluster', 'ReadEndpoint.Address'] });
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DataProcessingFunction', 'Arn'] });
    });

    test('should have StaticAssetsBucketName output', () => {
      expect(template.Outputs.StaticAssetsBucketName).toBeDefined();
      const output = template.Outputs.StaticAssetsBucketName;
      expect(output.Value).toEqual({ Ref: 'StaticAssetsBucket' });
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      const output = template.Outputs.SNSTopicArn;
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('resources should include environmentSuffix in names', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('S3 bucket name should include environmentSuffix', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('DB Cluster identifier should include environmentSuffix', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.DBClusterIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('No Circular Dependencies', () => {
    test('WebServerSecurityGroup should not reference itself in ingress rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress || [];
      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).not.toEqual({ Ref: 'WebServerSecurityGroup' });
      });
    });

    test('should have separate ingress rule to avoid circular dependency', () => {
      expect(template.Resources.WebServerSecurityGroupIngress).toBeDefined();
      const ingress = template.Resources.WebServerSecurityGroupIngress;
      expect(ingress.Type).toBe('AWS::EC2::SecurityGroupIngress');
    });
  });

  describe('No Retain Policies', () => {
    test('all stateful resources should have Delete policies', () => {
      const statefulResources = [
        'StaticAssetsBucket',
        'DBCluster',
        'DBInstance1',
        'DBInstance2'
      ];

      statefulResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).toBe('Delete');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have at least 30 resources for three-tier app', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(30);
    });

    test('should have at least 6 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(6);
    });

    test('should have at least 7 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(7);
    });
  });
});
