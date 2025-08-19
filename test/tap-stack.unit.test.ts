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
      expect(template.Description).toBe(
        'Secure AWS infrastructure for financial application with high availability, encryption, and strict security controls'
      );
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentName.Type).toBe('String');
      expect(template.Parameters.EnvironmentName.Default).toBe('FinApp-Prod');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.medium');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('m5.large');
    });

    test('should have SSHLocation parameter', () => {
      expect(template.Parameters.SSHLocation).toBeDefined();
      expect(template.Parameters.SSHLocation.Type).toBe('String');
      expect(template.Parameters.SSHLocation.Default).toBe('10.0.0.0/8');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with AMI mappings', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1'].AMI).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
      expect(template.Mappings.RegionMap['eu-west-1']).toBeDefined();
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
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have public subnets in two AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in two AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');

      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway1EIP).toBeDefined();

      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });

    test('should have route tables configured correctly', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();

      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();

      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have LoadBalancer security group', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.LoadBalancerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = template.Resources.LoadBalancerSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443)).toBe(true);
    });

    test('should have WebServer security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Bastion security group', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = template.Resources.BastionSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(22);
    });

    test('should have security group rules to avoid circular dependencies', () => {
      expect(template.Resources.LoadBalancerToWebServerEgress).toBeDefined();
      expect(template.Resources.WebServerFromLoadBalancerIngress).toBeDefined();
      expect(template.Resources.WebServerFromBastionIngress).toBeDefined();
      expect(template.Resources.BastionToWebServerEgress).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('should have ApplicationDataBucket with encryption', () => {
      expect(template.Resources.ApplicationDataBucket).toBeDefined();
      expect(template.Resources.ApplicationDataBucket.Type).toBe('AWS::S3::Bucket');
      
      const props = template.Resources.ApplicationDataBucket.Properties;
      expect(props.BucketEncryption).toBeDefined();
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have LoggingBucket with encryption', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
      
      const props = template.Resources.LoggingBucket.Properties;
      expect(props.BucketEncryption).toBeDefined();
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(props.LifecycleConfiguration).toBeDefined();
      expect(props.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have bucket policies enforcing TLS', () => {
      expect(template.Resources.ApplicationDataBucketPolicy).toBeDefined();
      expect(template.Resources.ApplicationDataBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      
      const appPolicy = template.Resources.ApplicationDataBucketPolicy.Properties.PolicyDocument.Statement[0];
      expect(appPolicy.Effect).toBe('Deny');
      expect(appPolicy.Condition.Bool['aws:SecureTransport']).toBe('false');

      expect(template.Resources.LoggingBucketPolicy).toBeDefined();
      expect(template.Resources.LoggingBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.FinAppKMSKey).toBeDefined();
      expect(template.Resources.FinAppKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.FinAppKMSKey.Properties.Description).toBe('KMS Key for Financial Application encryption');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.FinAppKMSKeyAlias).toBeDefined();
      expect(template.Resources.FinAppKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      
      const policies = template.Resources.EC2InstanceRole.Properties.Policies;
      expect(policies).toHaveLength(2);
      expect(policies.some((p: any) => p.PolicyName === 'S3AccessPolicy')).toBe(true);
      expect(policies.some((p: any) => p.PolicyName === 'CloudWatchLogsPolicy')).toBe(true);
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should follow least privilege principle', () => {
      const s3Policy = template.Resources.EC2InstanceRole.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      const s3Statement = s3Policy.PolicyDocument.Statement[0];
      
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).not.toContain('s3:*');
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const launchData = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(launchData.ImageId).toBeDefined();
      expect(launchData.InstanceType).toBeDefined();
      expect(launchData.UserData).toBeDefined();
      expect(launchData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      
      const props = template.Resources.AutoScalingGroup.Properties;
      expect(props.MinSize).toBe(2);
      expect(props.MaxSize).toBe(6);
      expect(props.DesiredCapacity).toBe(2);
      expect(props.HealthCheckType).toBe('ELB');
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(template.Resources.ScaleUpPolicy.Properties.ScalingAdjustment).toBe(1);

      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(template.Resources.ScaleDownPolicy.Properties.ScalingAdjustment).toBe(-1);
    });

    test('should have CloudWatch alarms for scaling', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmHigh.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.CPUAlarmHigh.Properties.Threshold).toBe(70);

      expect(template.Resources.CPUAlarmLow).toBeDefined();
      expect(template.Resources.CPUAlarmLow.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.CPUAlarmLow.Properties.Threshold).toBe(25);
    });
  });

  describe('Load Balancing', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.ApplicationLoadBalancer.Properties.Type).toBe('application');
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('should have Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(template.Resources.TargetGroup.Properties.Port).toBe(80);
      expect(template.Resources.TargetGroup.Properties.Protocol).toBe('HTTP');
      expect(template.Resources.TargetGroup.Properties.HealthCheckPath).toBe('/');
    });

    test('should have Load Balancer Listener', () => {
      expect(template.Resources.LoadBalancerListener).toBeDefined();
      expect(template.Resources.LoadBalancerListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.LoadBalancerListener.Properties.Port).toBe(80);
      expect(template.Resources.LoadBalancerListener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Bastion Host', () => {
    test('should have Bastion Host instance', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.BastionHost.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.BastionHost.Properties.InstanceType).toBe('t3.micro');
      expect(template.Resources.BastionHost.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix in names', () => {
      const resourcesWithNames = [
        'ApplicationDataBucket',
        'LoggingBucket',
        'EC2InstanceProfile',
        'LaunchTemplate',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'AutoScalingGroup',
        'CPUAlarmHigh',
        'CPUAlarmLow'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const nameProps = ['BucketName', 'InstanceProfileName', 'LaunchTemplateName', 'Name', 'AutoScalingGroupName', 'AlarmName'];
          
          nameProps.forEach(prop => {
            if (resource.Properties[prop]) {
              const value = JSON.stringify(resource.Properties[prop]);
              expect(value).toContain('EnvironmentSuffix');
            }
          });
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerURL',
        'ApplicationDataBucket',
        'LoggingBucket',
        'KMSKeyId',
        'BastionHostIP',
        'PrivateSubnets',
        'PublicSubnets'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('all outputs should have Export names with EnvironmentSuffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        const exportName = JSON.stringify(output.Export.Name);
        expect(exportName).toContain('EnvironmentSuffix');
      });
    });
  });

  describe('High Availability', () => {
    test('resources should be deployed across multiple AZs', () => {
      // Check public subnets are in different AZs
      const publicSubnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
      const publicSubnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
      expect(publicSubnet1AZ).not.toBe(publicSubnet2AZ);

      // Check private subnets are in different AZs
      const privateSubnet1AZ = template.Resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
      const privateSubnet2AZ = template.Resources.PrivateSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
      expect(privateSubnet1AZ).not.toBe(privateSubnet2AZ);

      // Check Auto Scaling Group uses both private subnets
      const asgSubnets = template.Resources.AutoScalingGroup.Properties.VPCZoneIdentifier;
      expect(asgSubnets).toHaveLength(2);
    });

    test('should have redundant NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should block public access', () => {
      const buckets = ['ApplicationDataBucket', 'LoggingBucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('EBS volumes should be encrypted', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const ebsConfig = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebsConfig.Encrypted).toBe(true);
      expect(ebsConfig.KmsKeyId).toBeDefined();

      const bastionHost = template.Resources.BastionHost;
      const bastionEbs = bastionHost.Properties.BlockDeviceMappings[0].Ebs;
      expect(bastionEbs.Encrypted).toBe(true);
    });

    test('should not have any resources with Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('all Fn::Sub references should be valid', () => {
      const jsonString = JSON.stringify(template);
      const subMatches = jsonString.match(/\$\{[^}]+\}/g) || [];
      
      subMatches.forEach(match => {
        const variable = match.replace('${', '').replace('}', '');
        // Check if it's a parameter or pseudo parameter
        const isParameter = template.Parameters && template.Parameters[variable] !== undefined;
        const isPseudoParam = ['AWS::AccountId', 'AWS::Region', 'AWS::StackName'].includes(variable);
        const isResourceRef = template.Resources && Object.keys(template.Resources).includes(variable.split('.')[0]);
        
        expect(isParameter || isPseudoParam || isResourceRef).toBe(true);
      });
    });

    test('all resource references should be valid', () => {
      const jsonString = JSON.stringify(template);
      const refMatches = jsonString.match(/"Ref":\s*"([^"]+)"/g) || [];
      
      refMatches.forEach(match => {
        const resourceName = match.match(/"Ref":\s*"([^"]+)"/)?.[1];
        if (resourceName && !resourceName.startsWith('AWS::')) {
          const isParameter = template.Parameters && template.Parameters[resourceName] !== undefined;
          const isResource = template.Resources && template.Resources[resourceName] !== undefined;
          expect(isParameter || isResource).toBe(true);
        }
      });
    });
  });
});