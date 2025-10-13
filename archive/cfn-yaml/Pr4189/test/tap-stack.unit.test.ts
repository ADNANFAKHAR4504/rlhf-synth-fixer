import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read JSON version of template (converted from YAML using cfn-flip)
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
        'Secure and scalable AWS infrastructure for web application'
      );
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'ProjectName',
        'Environment',
        'Owner',
        'SSHAllowedIP',
        'DBUsername',
        'InstanceType',
        'AmiId',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('myapp');
      expect(param.Description).toBe('Project name for resource naming');
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.AllowedValues).toContain('dev');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('prod');
      expect(param.Default).toBe('prod');
    });

    test('AmiId parameter should resolve via SSM public parameter', () => {
      const param = template.Parameters.AmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64');
    });

    test('InstanceType parameter should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.small');
      expect(param.AllowedValues).toContain('t3.medium');
    });
  });

  describe('Mappings', () => {
    test('should not use static RegionAMI mapping (uses SSM instead)', () => {
      expect(template.Mappings).toBeUndefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
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

    test('should have database subnets', () => {
      expect(template.Resources.DBSubnet1).toBeDefined();
      expect(template.Resources.DBSubnet2).toBeDefined();
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
    });

    test('should have route tables configured correctly', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('BastionSecurityGroup should restrict SSH access', () => {
      const sg = template.Resources.BastionSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp.Ref).toBe('SSHAllowedIP');
    });

    test('ALBSecurityGroup should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      const httpsRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443
      );
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('DatabaseSecurityGroup should only allow access from web servers', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
        expect(rule.CidrIp).toBeUndefined();
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM role', () => {
      expect(template.Resources.EC2S3Role).toBeDefined();
      expect(template.Resources.EC2S3Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('EC2 role should have assume role policy for EC2 service', () => {
      const role = template.Resources.EC2S3Role;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toContain(
        'ec2.amazonaws.com'
      );
    });

    test('EC2 role should have S3 access policy', () => {
      const role = template.Resources.EC2S3Role;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find(
        (p: any) => p.PolicyName['Fn::Sub'].includes('s3-limited-access')
      );
      expect(s3Policy).toBeDefined();
    });
  });

  describe('KMS and S3 Resources', () => {
    test('should have KMS key for S3 encryption', () => {
      expect(template.Resources.S3KMSKey).toBeDefined();
      expect(template.Resources.S3KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.S3KMSKeyAlias).toBeDefined();
      expect(template.Resources.S3KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have S3 bucket with encryption', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('should have Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });
  });

  describe('EC2 and Auto Scaling Resources', () => {
    test('should have SSH Key Pair', () => {
      expect(template.Resources.SSHKeyPair).toBeDefined();
      expect(template.Resources.SSHKeyPair.Type).toBe('AWS::EC2::KeyPair');
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('Auto Scaling Group should have correct LaunchTemplate version', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate.Version).toEqual({
        'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber'],
      });
    });

    test('should have Scaling Policy', () => {
      expect(template.Resources.ScalingPolicy).toBeDefined();
      expect(template.Resources.ScalingPolicy.Type).toBe(
        'AWS::AutoScaling::ScalingPolicy'
      );
    });

    test('should have Private EC2 Instance', () => {
      expect(template.Resources.PrivateEC2Instance).toBeDefined();
      expect(template.Resources.PrivateEC2Instance.Type).toBe(
        'AWS::EC2::Instance'
      );
    });

    test('Auto Scaling Group should have correct capacity settings', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(4);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });
  });

  describe('RDS Database Resources', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe(
        'AWS::RDS::DBSubnetGroup'
      );
    });

    test('should have RDS Database Instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should have correct deletion policies', () => {
      const db = template.Resources.RDSInstance;
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.UpdateReplacePolicy).toBe('Delete');
    });

    test('database should have encryption enabled', () => {
      const db = template.Resources.RDSInstance.Properties;
      expect(db.StorageEncrypted).toBe(true);
    });

    test('database should have automated backups disabled', () => {
      const db = template.Resources.RDSInstance.Properties;
      expect(db.BackupRetentionPeriod).toBe(0);
      expect(db.DeleteAutomatedBackups).toBe(true);
    });

    test('database should not be publicly accessible', () => {
      const db = template.Resources.RDSInstance.Properties;
      expect(db.PubliclyAccessible).toBe(false);
    });

    test('RDS should manage master user password via Secrets Manager', () => {
      const db = template.Resources.RDSInstance;
      expect(db.Properties.ManageMasterUserPassword).toBe(true);
      expect(db.Properties.MasterUserPassword).toBeUndefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch alarms', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmLow).toBeDefined();
    });

    test('CPU alarms should monitor EC2 instance', () => {
      const highAlarm = template.Resources.CPUAlarmHigh;
      const lowAlarm = template.Resources.CPUAlarmLow;
      expect(highAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(lowAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(highAlarm.Properties.Namespace).toBe('AWS/EC2');
      expect(lowAlarm.Properties.Namespace).toBe('AWS/EC2');
    });
  });

  describe('CloudFront Resources', () => {
    test('should have CloudFront Origin Access Identity', () => {
      expect(template.Resources.CloudFrontOriginAccessIdentity).toBeDefined();
      expect(template.Resources.CloudFrontOriginAccessIdentity.Type).toBe(
        'AWS::CloudFront::CloudFrontOriginAccessIdentity'
      );
    });

    test('should have CloudFront Distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe(
        'AWS::CloudFront::Distribution'
      );
    });

    test('CloudFront distribution should be enabled', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFront should redirect HTTP to HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const cacheBehavior =
        distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(cacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have consistent tagging', () => {
      const resourcesWithTags = [
        'VPC',
        'SSHKeyPair',
        'S3Bucket',
        'ApplicationLoadBalancer',
        'RDSInstance',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((tag: any) => tag.Key);
          expect(tagKeys).toContain('Project');
          expect(tagKeys).toContain('Owner');
          expect(tagKeys).toContain('Environment');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all essential outputs', () => {
      const essentialOutputs = [
        'VPCId',
        'ALBDNSName',
        'CloudFrontURL',
        'S3BucketName',
        'RDSEndpoint',
        'PrivateInstanceId',
        'SSHKeyPairName',
      ];

      essentialOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('VPCId output should reference VPC resource', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value.Ref).toBe('VPC');
    });

    test('ALBDNSName output should get ALB DNS name', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value['Fn::GetAtt']).toEqual([
        'ApplicationLoadBalancer',
        'DNSName',
      ]);
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

    test('should have sufficient number of resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Security Best Practices', () => {
    test('EC2 instances should have security groups attached', () => {
      expect(
        template.Resources.PrivateEC2Instance.Properties.SecurityGroupIds
      ).toBeDefined();
    });

    test('RDS should not be publicly accessible', () => {
      const db = template.Resources.RDSInstance.Properties;
      expect(db.PubliclyAccessible).toBe(false);
    });

    test('S3 buckets should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('database should have encryption enabled', () => {
      const db = template.Resources.RDSInstance.Properties;
      expect(db.StorageEncrypted).toBe(true);
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway EIP should depend on Internet Gateway attachment', () => {
      const natEip = template.Resources.NATGatewayEIP;
      expect(natEip.DependsOn).toBe('AttachGateway');
    });

    test('Public routes should depend on Internet Gateway attachment', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBe('AttachGateway');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all nameable resources should include project and environment', () => {
      const namedResources = [
        'VPC',
        'SSHKeyPair',
        'S3Bucket',
        'ApplicationLoadBalancer',
        'RDSInstance',
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const props = resource.Properties;
          const nameProps = [
            props.KeyName,
            props.BucketName,
            props.Name,
            props.DBInstanceIdentifier,
          ].filter(p => p !== undefined);

          if (nameProps.length > 0) {
            const hasProjectEnv = nameProps.some(prop => {
              if (prop && prop['Fn::Sub']) {
                return (
                  prop['Fn::Sub'].includes('${ProjectName}') &&
                  prop['Fn::Sub'].includes('${Environment}')
                );
              }
              return false;
            });
            expect(hasProjectEnv).toBe(true);
          }
        }
      });
    });
  });
});