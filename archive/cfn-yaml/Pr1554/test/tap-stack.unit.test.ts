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
      expect(template.Description).toContain('Highly Available, Secure, and PCI-DSS Compliant');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParameters = [
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'InstanceType',
        'KeyPairName',
        'SSLCertificateArn',
        'DBInstanceClass',
        'DBUsername',
        'DBPasswordSecretArn'
      ];

      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('VpcCidr parameter should have correct properties', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBe('^(\\d{1,3}\\.){3}\\d{1,3}\\/\\d{1,2}$');
    });

    test('InstanceType parameter should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
      expect(param.AllowedValues).toContain('t3.small');
      expect(param.AllowedValues).toContain('t3.medium');
      expect(param.AllowedValues).toContain('t3.large');
      expect(param.AllowedValues).toContain('m5.large');
      expect(param.AllowedValues).toContain('m5.xlarge');
    });

    test('DBInstanceClass parameter should have allowed values', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.micro');
      expect(param.AllowedValues).toContain('db.t3.micro');
      expect(param.AllowedValues).toContain('db.t3.small');
      expect(param.AllowedValues).toContain('db.t3.medium');
      expect(param.AllowedValues).toContain('db.r5.large');
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock.Ref).toBe('VpcCidr');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB Security Group should allow HTTP and HTTPS from internet', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      const ingress = albSg.Properties.SecurityGroupIngress;
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Web Server Security Group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Database Security Group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Database Security Group should allow PostgreSQL from web servers', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSg.Properties.SecurityGroupIngress;
      
      const postgresRule = ingress.find((rule: any) => rule.FromPort === 5432);
      expect(postgresRule).toBeDefined();
      expect(postgresRule.SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
    });
  });

  describe('Compute Resources', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should have correct properties', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const data = launchTemplate.Properties.LaunchTemplateData;
      
      expect(data.ImageId.Ref).toBe('AmiId');
      expect(data.InstanceType.Ref).toBe('InstanceType');
      expect(data.KeyName.Ref).toBe('KeyPairName');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('Auto Scaling Group should have correct properties', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(10);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('Auto Scaling Group should use private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const vpcZoneIdentifier = asg.Properties.VPCZoneIdentifier;
      
      expect(vpcZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should use public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;
      
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('Target Group should have correct health check settings', () => {
      const targetGroup = template.Resources.TargetGroup;
      
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup.Properties.HealthyThresholdCount).toBe(2);
      expect(targetGroup.Properties.UnhealthyThresholdCount).toBe(2);
    });

    test('should have HTTPS Listener', () => {
      expect(template.Resources.HTTPSListener).toBeDefined();
      expect(template.Resources.HTTPSListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('HTTPS Listener should use SSL certificate', () => {
      const httpsListener = template.Resources.HTTPSListener;
      expect(httpsListener.Properties.Port).toBe(443);
      expect(httpsListener.Properties.Protocol).toBe('HTTPS');
      expect(httpsListener.Properties.Certificates[0].CertificateArn.Ref).toBe('SSLCertificateArn');
    });
  });

  describe('Database Resources', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB Subnet Group should use private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have RDS Database', () => {
      expect(template.Resources.Database).toBeDefined();
      expect(template.Resources.Database.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Database should have correct properties', () => {
      const database = template.Resources.Database;
      
      expect(database.Properties.Engine).toBe('postgres');
      expect(database.Properties.EngineVersion).toBe('13.21');
      expect(database.Properties.AllocatedStorage).toBe(20);
      expect(database.Properties.StorageType).toBe('gp2');
      expect(database.Properties.StorageEncrypted).toBe(true);
      expect(database.Properties.MultiAZ).toBe(true);
      expect(database.Properties.DBName).toBe('webapp');
    });

    test('Database should use security group', () => {
      const database = template.Resources.Database;
      expect(database.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'DatabaseSecurityGroup' });
    });
  });

  describe('Storage and CDN', () => {
    test('should have S3 Bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 Bucket should have encryption enabled', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const encryption = s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 Bucket should have versioning enabled', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 Bucket should block public access', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have CloudFront Distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });
  });

  describe('CloudFront and CDN', () => {
    test('should have CloudFront Origin Access Identity', () => {
      expect(template.Resources.CloudFrontOriginAccessIdentity).toBeDefined();
      expect(template.Resources.CloudFrontOriginAccessIdentity.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should have CloudFront Distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront Distribution should have ALB origin', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origins = distribution.Properties.DistributionConfig.Origins;
      
      const albOrigin = origins.find((origin: any) => origin.Id === 'ALBOrigin');
      expect(albOrigin).toBeDefined();
      expect(albOrigin.DomainName['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
    });

    test('CloudFront Distribution should have correct cache behavior', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const defaultCacheBehavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      
      expect(defaultCacheBehavior.TargetOriginId).toBe('ALBOrigin');
      expect(defaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'CloudFrontDomain',
        'DatabaseEndpoint',
        'BastionHostPublicIP',
        'S3BucketName',
        'AutoScalingGroupName',
        'DatabaseSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value.Ref).toBe('VPC');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPC-ID');
    });

    test('LoadBalancerDNS output should reference ALB', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
    });

    test('DatabaseEndpoint output should reference database', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Value['Fn::GetAtt']).toEqual(['Database', 'Endpoint.Address']);
    });
  });

  describe('Security Best Practices', () => {
    test('database should have encryption enabled', () => {
      const database = template.Resources.Database;
      expect(database.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('web servers should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const vpcZoneIdentifier = asg.Properties.VPCZoneIdentifier;
      
      expect(vpcZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('database should be in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('High Availability', () => {
    test('Auto Scaling Group should have minimum 2 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBeGreaterThanOrEqual(2);
    });

    test('database should have Multi-AZ enabled', () => {
      const database = template.Resources.Database;
      expect(database.Properties.MultiAZ).toBe(true);
    });

    test('load balancer should be in multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });
  });

  describe('Template Validation', () => {
    test('should have valid structure', () => {
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

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources for a complete stack
    });

    test('should have reasonable number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(5); // Should have several parameters
    });

    test('should have reasonable number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(5); // Should have several outputs
    });
  });
});
