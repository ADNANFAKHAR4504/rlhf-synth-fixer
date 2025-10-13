import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Real Estate Property Listing Platform Infrastructure'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('LatestAmiId parameter should have correct properties', () => {
      const amiParam = template.Parameters.LatestAmiId;
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toBe(
        '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64'
      );
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.90.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.90.1.0/24'
      );
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.90.2.0/24'
      );
    });

    test('public subnets should map public IP on launch', () => {
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.90.10.0/24'
      );
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.90.11.0/24'
      );
    });
  });

  describe('NAT Gateway and Route Tables', () => {
    test('should have NAT Gateway EIP', () => {
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
    });

    test('public route should point to Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('private route should point to NAT Gateway', () => {
      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'NatGateway',
      });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('ALB security group should allow HTTPS from anywhere', () => {
      const sgIngress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      const httpsRule = sgIngress.find(
        (rule: any) => rule.FromPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('EC2 security group should allow traffic from ALB', () => {
      const sgIngress = template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      const httpFromAlb = sgIngress.find(
        (rule: any) => rule.FromPort === 80 && rule.SourceSecurityGroupId
      );
      expect(httpFromAlb).toBeDefined();
      expect(httpFromAlb.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
    });

    test('EC2 security group should allow SSH from VPC only', () => {
      const sgIngress = template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      const sshRule = sgIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('10.90.0.0/16');
    });

    test('should have Redis security group', () => {
      expect(template.Resources.RedisSecurityGroup).toBeDefined();
      expect(template.Resources.RedisSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('Redis security group should allow traffic from EC2 only', () => {
      const sgIngress = template.Resources.RedisSecurityGroup.Properties.SecurityGroupIngress;
      expect(sgIngress).toHaveLength(1);
      expect(sgIngress[0].FromPort).toBe(6379);
      expect(sgIngress[0].SourceSecurityGroupId).toEqual({
        Ref: 'EC2SecurityGroup',
      });
    });
  });

  describe('ElastiCache Resources', () => {
    test('should have Redis subnet group', () => {
      expect(template.Resources.RedisSubnetGroup).toBeDefined();
      expect(template.Resources.RedisSubnetGroup.Type).toBe(
        'AWS::ElastiCache::SubnetGroup'
      );
    });

    test('should have Redis replication group', () => {
      expect(template.Resources.RedisReplicationGroup).toBeDefined();
      expect(template.Resources.RedisReplicationGroup.Type).toBe(
        'AWS::ElastiCache::ReplicationGroup'
      );
    });

    test('Redis should have cluster mode enabled', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.NumNodeGroups).toBe(2);
      expect(redis.Properties.ReplicasPerNodeGroup).toBe(1);
    });

    test('Redis should have encryption at rest enabled', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('Redis should have automatic failover enabled', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.AutomaticFailoverEnabled).toBe(true);
      expect(redis.Properties.MultiAZEnabled).toBe(true);
    });

    test('Redis snapshot retention should be zero for test cleanup', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.SnapshotRetentionLimit).toBe(0);
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket for property images', () => {
      expect(template.Resources.PropertyImagesBucket).toBeDefined();
      expect(template.Resources.PropertyImagesBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have deletion policy set to Delete', () => {
      expect(template.Resources.PropertyImagesBucket.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.PropertyImagesBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.PropertyImagesBucket;
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.PropertyImagesBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2 role should have CloudWatch and SSM policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('EC2 role should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const s3Policy = role.Properties.Policies[0];
      expect(s3Policy.PolicyName).toBe('S3AccessPolicy');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
    });

    test('target group should have sticky sessions enabled', () => {
      const tg = template.Resources.TargetGroup;
      const stickinessAttr = tg.Properties.TargetGroupAttributes.find(
        (attr: any) => attr.Key === 'stickiness.enabled'
      );
      expect(stickinessAttr).toBeDefined();
      expect(stickinessAttr.Value).toBe('true');
    });

    test('target group should have correct health check configuration', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
    });

    test('should have path-based routing rules', () => {
      expect(template.Resources.ListenerRuleImages).toBeDefined();
      expect(template.Resources.ListenerRuleSearch).toBeDefined();
    });

    test('listener rules should have correct path patterns', () => {
      const imagesRule = template.Resources.ListenerRuleImages;
      const searchRule = template.Resources.ListenerRuleSearch;
      expect(imagesRule.Properties.Conditions[0].Values).toContain('/images/*');
      expect(searchRule.Properties.Conditions[0].Values).toContain('/search/*');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );
    });

    test('launch template should use t3.small instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.small');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('ASG should have correct capacity settings', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('ASG should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('should have scaling policy', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe(
        'AWS::AutoScaling::ScalingPolicy'
      );
    });

    test('scaling policy should target 70% CPU utilization', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(
        policy.Properties.TargetTrackingConfiguration.TargetValue
      ).toBe(70.0);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have high CPU alarm', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.HighCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('high CPU alarm should trigger at 70%', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have unhealthy host alarm', () => {
      expect(template.Resources.UnhealthyHostAlarm).toBeDefined();
      expect(template.Resources.UnhealthyHostAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('unhealthy host alarm should monitor target group', () => {
      const alarm = template.Resources.UnhealthyHostAlarm;
      expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'RedisEndpoint',
        'S3BucketName',
        'AutoScalingGroupName',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALBDNSName output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('RedisEndpoint output should be correct', () => {
      const output = template.Outputs.RedisEndpoint;
      expect(output.Description).toBe('Redis cluster configuration endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RedisReplicationGroup', 'ConfigurationEndPoint.Address'],
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('S3 bucket for property images');
      expect(output.Value).toEqual({ Ref: 'PropertyImagesBucket' });
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should use EnvironmentSuffix parameter', () => {
      const vpcName = template.Resources.VPC.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(vpcName.Value).toEqual({
        'Fn::Sub': 'property-listing-vpc-${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
