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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
    });

    test('should be valid JSON', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
    });

    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.MaxLength).toBe(10);
      expect(param.AllowedPattern).toBe('^[a-z0-9-]*$');
    });

    test('should have VpcCIDR parameter with valid pattern', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      const param = template.Parameters.VpcCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have subnet CIDR parameters', () => {
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();

      expect(template.Parameters.PublicSubnet1CIDR.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2CIDR.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PrivateSubnet1CIDR.Default).toBe('10.0.10.0/24');
      expect(template.Parameters.PrivateSubnet2CIDR.Default).toBe('10.0.11.0/24');
    });

    test('should have InstanceType parameter with allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.small');
      expect(param.AllowedValues).toContain('t3.medium');
    });

    test('should have Auto Scaling parameters with constraints', () => {
      const minSize = template.Parameters.MinSize;
      expect(minSize).toBeDefined();
      expect(minSize.Type).toBe('Number');
      expect(minSize.MinValue).toBe(1);
      expect(minSize.MaxValue).toBe(10);
      expect(minSize.Default).toBe(2);

      const maxSize = template.Parameters.MaxSize;
      expect(maxSize).toBeDefined();
      expect(maxSize.Type).toBe('Number');
      expect(maxSize.MinValue).toBe(1);
      expect(maxSize.MaxValue).toBe(20);
      expect(maxSize.Default).toBe(6);

      const desiredCapacity = template.Parameters.DesiredCapacity;
      expect(desiredCapacity).toBeDefined();
      expect(desiredCapacity.Type).toBe('Number');
      expect(desiredCapacity.Default).toBe(2);
    });

    test('should have scaling threshold parameters with valid ranges', () => {
      const scaleUpThreshold = template.Parameters.ScaleUpThreshold;
      expect(scaleUpThreshold).toBeDefined();
      expect(scaleUpThreshold.Type).toBe('Number');
      expect(scaleUpThreshold.Default).toBe(70);
      expect(scaleUpThreshold.MinValue).toBe(50);
      expect(scaleUpThreshold.MaxValue).toBe(100);

      const scaleDownThreshold = template.Parameters.ScaleDownThreshold;
      expect(scaleDownThreshold).toBeDefined();
      expect(scaleDownThreshold.Type).toBe('Number');
      expect(scaleDownThreshold.Default).toBe(30);
      expect(scaleDownThreshold.MinValue).toBe(10);
      expect(scaleDownThreshold.MaxValue).toBe(50);
    });

    test('should have CertificateArn parameter', () => {
      const param = template.Parameters.CertificateArn;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });
  });

  describe('Conditions', () => {
    test('should have UseHTTPS condition', () => {
      expect(template.Conditions.UseHTTPS).toBeDefined();
      expect(template.Conditions.UseHTTPS['Fn::Not']).toBeDefined();
    });

    test('should have HasEnvironmentSuffix condition', () => {
      expect(template.Conditions.HasEnvironmentSuffix).toBeDefined();
      expect(template.Conditions.HasEnvironmentSuffix['Fn::Not']).toBeDefined();
    });

    test('conditions should check for empty strings', () => {
      const useHTTPS = template.Conditions.UseHTTPS['Fn::Not'][0]['Fn::Equals'];
      expect(useHTTPS).toEqual([{ Ref: 'CertificateArn' }, '']);

      const hasSuffix = template.Conditions.HasEnvironmentSuffix['Fn::Not'][0]['Fn::Equals'];
      expect(hasSuffix).toEqual([{ Ref: 'EnvironmentSuffix' }, '']);
    });
  });

  describe('Mappings', () => {
    test('should have ELBAccountId mapping', () => {
      expect(template.Mappings.ELBAccountId).toBeDefined();
    });

    test('should have account IDs for major regions', () => {
      const mapping = template.Mappings.ELBAccountId;
      expect(mapping['us-east-1']).toBeDefined();
      expect(mapping['us-east-2']).toBeDefined();
      expect(mapping['us-west-1']).toBeDefined();
      expect(mapping['us-west-2']).toBeDefined();
      expect(mapping['eu-west-1']).toBeDefined();
      expect(mapping['eu-central-1']).toBeDefined();
      expect(mapping['ap-southeast-1']).toBeDefined();
      expect(mapping['ap-northeast-1']).toBeDefined();
    });

    test('should have valid account ID format', () => {
      const accountId = template.Mappings.ELBAccountId['us-east-1'].AccountId;
      expect(accountId).toMatch(/^\d{12}$/);
    });

    test('all mapped regions should have valid account IDs', () => {
      const regions = Object.keys(template.Mappings.ELBAccountId);
      expect(regions.length).toBeGreaterThan(0);

      regions.forEach(region => {
        const accountId = template.Mappings.ELBAccountId[region].AccountId;
        expect(accountId).toMatch(/^\d{12}$/);
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('VPC should reference VpcCIDR parameter', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('VPC should have proper tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'ManagedBy')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'project')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'team-number')).toBeDefined();
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have InternetGatewayAttachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
    });

    test('subnets should reference correct CIDR parameters', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
    });

    test('subnets should have proper tags', () => {
      const publicTags = template.Resources.PublicSubnet1.Properties.Tags;
      expect(publicTags.find((t: any) => t.Key === 'Type' && t.Value === 'Public')).toBeDefined();

      const privateTags = template.Resources.PrivateSubnet1.Properties.Tags;
      expect(privateTags.find((t: any) => t.Key === 'Type' && t.Value === 'Private')).toBeDefined();
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway EIPs', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('EIPs should depend on InternetGatewayAttachment', () => {
      expect(template.Resources.NatGateway1EIP.DependsOn).toBe('InternetGatewayAttachment');
      expect(template.Resources.NatGateway2EIP.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('EIPs should have vpc domain', () => {
      expect(template.Resources.NatGateway1EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NatGateway2EIP.Properties.Domain).toBe('vpc');
    });

    test('should have NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NatGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NatGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('NAT Gateways should reference correct EIPs', () => {
      const nat1 = template.Resources.NatGateway1.Properties.AllocationId;
      expect(nat1).toEqual({ 'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId'] });

      const nat2 = template.Resources.NatGateway2.Properties.AllocationId;
      expect(nat2).toEqual({ 'Fn::GetAtt': ['NatGateway2EIP', 'AllocationId'] });
    });
  });

  describe('Security Group Resources', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      const ingress = sg.SecurityGroupIngress;

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have WebServer security group', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServer should only allow traffic from ALB', () => {
      const ingress = template.Resources.WebServerSecurityGroupIngress.Properties;
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ingress.FromPort).toBe(80);
      expect(ingress.ToPort).toBe(80);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM role', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have assume role policy for EC2', () => {
      const role = template.Resources.EC2Role.Properties;
      const assumePolicy = role.AssumeRolePolicyDocument;

      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toContain('sts:AssumeRole');
    });

    test('EC2 role should have managed policies for CloudWatch and SSM', () => {
      const role = template.Resources.EC2Role.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2 role should have inline policies', () => {
      const role = template.Resources.EC2Role.Properties;
      expect(role.Policies).toBeDefined();
      expect(role.Policies.length).toBeGreaterThan(0);

      const s3Policy = role.Policies.find((p: any) => p.PolicyName === 'S3LoggingAccess');
      expect(s3Policy).toBeDefined();

      const cwPolicy = role.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(cwPolicy).toBeDefined();
    });

    test('IAM policies should follow least privilege', () => {
      const role = template.Resources.EC2Role.Properties;
      const s3Policy = role.Policies.find((p: any) => p.PolicyName === 'S3LoggingAccess');

      const statements = s3Policy.PolicyDocument.Statement;
      statements.forEach((stmt: any) => {
        expect(stmt.Resource).toBeDefined();
        expect(Array.isArray(stmt.Resource) || typeof stmt.Resource === 'object').toBe(true);
      });
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key', () => {
      const key = template.Resources.KMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper key policy', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      expect(keyPolicy).toBeDefined();
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('KMS key policy should allow root account access', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const rootStmt = keyPolicy.Statement.find((s: any) =>
        s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStmt).toBeDefined();
      expect(rootStmt.Effect).toBe('Allow');
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have logging bucket', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('logging bucket should have versioning enabled', () => {
      const bucket = template.Resources.LoggingBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('logging bucket should have encryption enabled', () => {
      const bucket = template.Resources.LoggingBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('logging bucket should block public access', () => {
      const bucket = template.Resources.LoggingBucket.Properties;
      const publicAccess = bucket.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('logging bucket should have lifecycle rules', () => {
      const bucket = template.Resources.LoggingBucket.Properties;
      expect(bucket.LifecycleConfiguration).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources.ApacheAccessLogGroup).toBeDefined();
      expect(template.Resources.ApacheErrorLogGroup).toBeDefined();
    });

    test('log groups should have retention period', () => {
      const accessLog = template.Resources.ApacheAccessLogGroup.Properties;
      expect(accessLog.RetentionInDays).toBe(7);

      const errorLog = template.Resources.ApacheErrorLogGroup.Properties;
      expect(errorLog.RetentionInDays).toBe(7);
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.LowCPUAlarm).toBeDefined();
      expect(template.Resources.TargetResponseTimeAlarm).toBeDefined();
      expect(template.Resources.UnhealthyHostsAlarm).toBeDefined();
    });

    test('CPU alarms should reference scaling policies', () => {
      const highCPU = template.Resources.HighCPUAlarm.Properties;
      expect(highCPU.AlarmActions).toEqual([{ Ref: 'ScaleUpPolicy' }]);

      const lowCPU = template.Resources.LowCPUAlarm.Properties;
      expect(lowCPU.AlarmActions).toEqual([{ Ref: 'ScaleDownPolicy' }]);
    });
  });

  describe('EC2 Launch Template', () => {
    test('should have launch template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should reference instance type parameter', () => {
      const ltData = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(ltData.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('launch template should have encrypted EBS volumes', () => {
      const ltData = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      const blockDevice = ltData.BlockDeviceMappings[0];

      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.KmsKeyId).toEqual({ Ref: 'KMSKey' });
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    });

    test('should have Target Group', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('Target Group should have health check configured', () => {
      const tg = template.Resources.TargetGroup.Properties;
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('ASG should reference sizing parameters', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.DesiredCapacity).toEqual({ Ref: 'DesiredCapacity' });
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PublicSubnets).toBeDefined();
      expect(template.Outputs.PrivateSubnets).toBeDefined();
      expect(template.Outputs.LoadBalancerURL).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoggingBucketName).toBeDefined();
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
    });

    test('VPCId output should export correctly', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export).toBeDefined();
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all EBS volumes should be encrypted', () => {
      const ltData = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      ltData.BlockDeviceMappings.forEach((bd: any) => {
        if (bd.Ebs) {
          expect(bd.Ebs.Encrypted).toBe(true);
        }
      });
    });

    test('S3 bucket should have encryption', () => {
      const bucket = template.Resources.LoggingBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
    });

    test('security groups should not allow unrestricted access to sensitive ports', () => {
      const webSGIngress = template.Resources.WebServerSecurityGroupIngress.Properties;
      expect(webSGIngress.CidrIp).toBeUndefined();
      expect(webSGIngress.SourceSecurityGroupId).toBeDefined();
    });
  });

  describe('Template Completeness', () => {
    test('should have sufficient resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('should have sufficient parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(10);
    });

    test('all resources should have valid types', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });
  });
});
