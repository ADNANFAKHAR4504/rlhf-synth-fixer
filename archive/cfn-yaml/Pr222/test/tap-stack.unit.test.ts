import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
      expect(template.Description).toContain('Highly available web application infrastructure');
    });
  });

  describe('Parameters', () => {
    test('should have ACMCertificateARN parameter', () => {
      expect(template.Parameters.ACMCertificateARN).toBeDefined();
      expect(template.Parameters.ACMCertificateARN.Type).toBe('String');
      expect(template.Parameters.ACMCertificateARN.Description).toContain('ARN of the ACM certificate');
    });

    test('should have HostedZoneId parameter', () => {
      expect(template.Parameters.HostedZoneId).toBeDefined();
      expect(template.Parameters.HostedZoneId.Type).toBe('String');
      expect(template.Parameters.HostedZoneId.Description).toContain('Route 53 Hosted Zone ID');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
      expect(template.Parameters.DomainName.Description).toContain('Custom domain name');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets for RDS', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');

      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');

      expect(template.Resources.IGWAttachment).toBeDefined();
      expect(template.Resources.IGWAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have route table and routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');

      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with HTTPS ingress', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
      expect(ingress.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have ASG security group with HTTP ingress from ALB', () => {
      expect(template.Resources.ASGSecurityGroup).toBeDefined();
      expect(template.Resources.ASGSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = template.Resources.ASGSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(80);
      expect(ingress.ToPort).toBe(80);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should have RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');

      expect(template.Resources.RDSIngressRule).toBeDefined();
      expect(template.Resources.RDSIngressRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB with correct configuration', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('should have HTTPS listener with ACM certificate', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.ALBListener.Properties.Port).toBe(443);
      expect(template.Resources.ALBListener.Properties.Protocol).toBe('HTTPS');
      expect(template.Resources.ALBListener.Properties.Certificates).toBeDefined();
    });

    test('should have target group', () => {
      expect(template.Resources.WebAppTargetGroup).toBeDefined();
      expect(template.Resources.WebAppTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(template.Resources.WebAppTargetGroup.Properties.Port).toBe(80);
      expect(template.Resources.WebAppTargetGroup.Properties.Protocol).toBe('HTTP');
      expect(template.Resources.WebAppTargetGroup.Properties.HealthCheckPath).toBe('/health');
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(template.Resources.LaunchTemplate.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
    });

    test('should have auto scaling group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(template.Resources.AutoScalingGroup.Properties.MinSize).toBe(2);
      expect(template.Resources.AutoScalingGroup.Properties.MaxSize).toBe(4);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with Multi-AZ', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.RDSInstance.Properties.Engine).toBe('mysql');
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
      expect(template.Resources.RDSInstance.Properties.DBInstanceClass).toBe('db.t3.micro');
    });
  });

  describe('S3 Buckets', () => {
    test('should have ALB logs bucket', () => {
      expect(template.Resources.ALBLogsBucket).toBeDefined();
      expect(template.Resources.ALBLogsBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.ALBLogsBucket.Properties.OwnershipControls).toBeDefined();
      expect(template.Resources.ALBLogsBucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerPreferred');
    });

    test('should have ALB logs bucket policy', () => {
      expect(template.Resources.ALBLogsBucketPolicy).toBeDefined();
      expect(template.Resources.ALBLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have static assets bucket', () => {
      expect(template.Resources.StaticAssetsBucket).toBeDefined();
      expect(template.Resources.StaticAssetsBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.StaticAssetsBucket.Properties.WebsiteConfiguration).toBeDefined();
    });
  });

  describe('Route 53', () => {
    test('should have DNS record', () => {
      expect(template.Resources.DNSRecord).toBeDefined();
      expect(template.Resources.DNSRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(template.Resources.DNSRecord.Properties.Type).toBe('A');
      expect(template.Resources.DNSRecord.Properties.AliasTarget).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have ALB DNS name output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      expect(template.Outputs.ALBDNSName.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('should have static assets URL output', () => {
      expect(template.Outputs.StaticAssetsURL).toBeDefined();
    });

    test('should have Route53 record output', () => {
      expect(template.Outputs.Route53Record).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(3);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have Environment tag', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
    });

    test('subnets should have Environment tag', () => {
      const subnet1Tags = template.Resources.PublicSubnet1.Properties.Tags;
      const subnet2Tags = template.Resources.PublicSubnet2.Properties.Tags;
      expect(subnet1Tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
      expect(subnet2Tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
    });
  });

  describe('High Availability', () => {
    test('should deploy across multiple availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      
      expect(subnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('RDS should be Multi-AZ', () => {
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
    });

    test('Auto Scaling Group should span multiple subnets', () => {
      const asgSubnets = template.Resources.AutoScalingGroup.Properties.VPCZoneIdentifier;
      expect(asgSubnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(asgSubnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });
  });
});