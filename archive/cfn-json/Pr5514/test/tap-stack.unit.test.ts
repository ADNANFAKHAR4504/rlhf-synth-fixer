import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Multi-Environment Infrastructure', () => {
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
      expect(template.Description).toContain('Multi-environment');
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentName',
        'EnvironmentSuffix',
        'VpcCidr',
        'InstanceType',
        'DBInstanceClass',
        'DBUsername',
        'ACMCertificateArn',
        'AlarmEmail'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentName should have correct allowed values', () => {
      const envParam = template.Parameters.EnvironmentName;
      expect(envParam.Type).toBe('String');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(envParam.Default).toBe('dev');
    });

    test('EnvironmentSuffix should have correct validation pattern', () => {
      const suffixParam = template.Parameters.EnvironmentSuffix;
      expect(suffixParam.Type).toBe('String');
      expect(suffixParam.MinLength).toBe(4);
      expect(suffixParam.MaxLength).toBe(20);
      expect(suffixParam.AllowedPattern).toMatch(/^\[a-z0-9-\]/);
    });

    test('DBPasswordSecret resource should exist', () => {
      const dbPasswordSecret = template.Resources.DBPasswordSecret;
      expect(dbPasswordSecret).toBeDefined();
      expect(dbPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('AlarmEmail should have email validation pattern', () => {
      const emailParam = template.Parameters.AlarmEmail;
      expect(emailParam.AllowedPattern).toContain('@');
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals']).toEqual([
        { Ref: 'EnvironmentName' },
        'prod'
      ]);
    });

    test('should have HasCertificate condition', () => {
      expect(template.Conditions.HasCertificate).toBeDefined();
      expect(template.Conditions.HasCertificate['Fn::Not']).toBeDefined();
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPCGatewayAttachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have two public subnets', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateway and EIP', () => {
      const eip = template.Resources.NatGatewayEIP;
      const nat = template.Resources.NatGateway;

      expect(eip).toBeDefined();
      expect(nat).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should have public and private route tables', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT = template.Resources.PrivateRouteTable;

      expect(publicRT).toBeDefined();
      expect(privateRT).toBeDefined();
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT.Type).toBe('AWS::EC2::RouteTable');
    });

    test('public route should point to Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private route should point to NAT Gateway', () => {
      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute).toBeDefined();
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway' });
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2 security group should only allow traffic from ALB', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ingress[0].FromPort).toBe(80);
    });

    test('should have RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS security group should only allow traffic from EC2', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(ingress[0].FromPort).toBe(3306);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
    });

    test('should have ALB Target Group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
    });

    test('should have ALB Listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });

    test('ALB Listener should use conditional port based on certificate', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.Port['Fn::If']).toBeDefined();
      expect(listener.Properties.Protocol['Fn::If']).toBeDefined();
    });
  });

  describe('Compute Resources', () => {
    test('should have IAM role for EC2', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('IAM role should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;

      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
    });

    test('should have instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });

    test('should have Launch Template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should use SSM parameter for AMI', () => {
      const lt = template.Resources.LaunchTemplate;
      const imageId = lt.Properties.LaunchTemplateData.ImageId;
      expect(imageId).toContain('resolve:ssm');
      expect(imageId).toContain('ami-amazon-linux-latest');
    });

    test('Launch Template should include user data', () => {
      const lt = template.Resources.LaunchTemplate;
      const userData = lt.Properties.LaunchTemplateData.UserData;
      expect(userData).toBeDefined();
      expect(userData['Fn::Base64']).toBeDefined();
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.DependsOn).toBe('NatGateway');
    });

    test('ASG should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('ASG should have environment-specific capacity', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MaxSize['Fn::If']).toEqual(['IsProduction', '4', '2']);
      expect(asg.Properties.DesiredCapacity['Fn::If']).toEqual(['IsProduction', '2', '1']);
    });

    test('ASG should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Database Resources', () => {
    test('should have DB Subnet Group', () => {
      const dbsg = template.Resources.DBSubnetGroup;
      expect(dbsg).toBeDefined();
      expect(dbsg.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB Subnet Group should span private subnets', () => {
      const dbsg = template.Resources.DBSubnetGroup;
      expect(dbsg.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('should have RDS instance', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Delete');
    });

    test('RDS should be MySQL', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toMatch(/^8\.0/);
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should have conditional Multi-AZ based on environment', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ['Fn::If']).toEqual(['IsProduction', true, false]);
    });

    test('RDS should have 7-day backup retention', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('Storage Resources', () => {
    test('should have logs S3 bucket', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('logs bucket should have versioning enabled', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('logs bucket should have encryption', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const sse = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(sse.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('logs bucket should have lifecycle policies', () => {
      const bucket = template.Resources.LogsBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);

      const transitionRule = rules.find((r: any) => r.Id === 'TransitionToIA');
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Status).toBe('Enabled');
    });

    test('should have static content S3 bucket', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('static content bucket should have versioning and encryption', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('Monitoring Resources', () => {
    test('should have SNS topic', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      const subscriptions = topic.Properties.Subscription;

      expect(subscriptions).toBeDefined();
      expect(subscriptions[0].Protocol).toBe('email');
      expect(subscriptions[0].Endpoint).toEqual({ Ref: 'AlarmEmail' });
    });

    test('should have CPU alarm', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('CPU alarm should publish to SNS topic', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'SNSTopic' }]);
    });

    test('should have target tracking scaling policy', () => {
      const policy = template.Resources.TargetTrackingScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGatewayEIP',
        'NatGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'ALBSecurityGroup',
        'EC2SecurityGroup',
        'RDSSecurityGroup',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'EC2InstanceRole',
        'EC2InstanceProfile',
        'LaunchTemplate',
        'AutoScalingGroup',
        'DBSubnetGroup',
        'RDSInstance',
        'LogsBucket',
        'StaticContentBucket',
        'SNSTopic',
        'CPUAlarmHigh'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties?.Tags || [];
        const nameTag = tags.find((t: any) => t.Key === 'Name');

        if (nameTag) {
          const nameValue = nameTag.Value;
          if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
            expect(nameValue['Fn::Sub']).toContain('EnvironmentSuffix');
          }
        }

        const nameProp = resource.Properties?.Name
          || resource.Properties?.BucketName
          || resource.Properties?.DBInstanceIdentifier
          || resource.Properties?.TopicName
          || resource.Properties?.RoleName
          || resource.Properties?.InstanceProfileName;

        if (nameProp && typeof nameProp === 'object' && nameProp['Fn::Sub']) {
          expect(nameProp['Fn::Sub']).toContain('EnvironmentSuffix');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'ALBDNSName',
        'RDSEndpoint',
        'LogsBucketName',
        'StaticContentBucketName',
        'SNSTopicArn'
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('ALB DNS name output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
    });

    test('RDS endpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Value['Fn::GetAtt']).toEqual(['RDSInstance', 'Endpoint.Address']);
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Deletion Policies', () => {
    test('RDS instance should have Delete policy', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
    });

    test('S3 buckets should have Delete policy', () => {
      const logsBucket = template.Resources.LogsBucket;
      const staticBucket = template.Resources.StaticContentBucket;

      expect(logsBucket.DeletionPolicy).toBe('Delete');
      expect(staticBucket.DeletionPolicy).toBe('Delete');
    });

    test('no resources should have Retain policy', () => {
      const resourcesWithRetain = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.DeletionPolicy === 'Retain';
      });

      expect(resourcesWithRetain).toHaveLength(0);
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway EIP should depend on Gateway Attachment', () => {
      const eip = template.Resources.NatGatewayEIP;
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('Public Route should depend on Gateway Attachment', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('Auto Scaling Group should depend on NAT Gateway', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.DependsOn).toBe('NatGateway');
    });

    test('ALB should depend on Gateway Attachment', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DependsOn).toBe('AttachGateway');
    });
  });

  describe('Template Resource Count', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(35);
    });

    test('should have correct number of parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(8);
    });

    test('should have correct number of conditions', () => {
      const condCount = Object.keys(template.Conditions).length;
      expect(condCount).toBe(2);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });
});
