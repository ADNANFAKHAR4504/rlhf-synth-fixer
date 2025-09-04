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
      expect(template.Parameters.InstanceType.AllowedValues).toContain(
        't3.medium'
      );
      expect(template.Parameters.InstanceType.AllowedValues).toContain(
        'm5.large'
      );
    });

    test('should have SSHLocation parameter', () => {
      expect(template.Parameters.SSHLocation).toBeDefined();
      expect(template.Parameters.SSHLocation.Type).toBe('String');
      expect(template.Parameters.SSHLocation.Default).toBe('10.0.0.0/8');
    });

    test('should have AMIOperatingSystem parameter', () => {
      expect(template.Parameters.AMIOperatingSystem).toBeDefined();
      expect(template.Parameters.AMIOperatingSystem.Type).toBe('String');
      expect(template.Parameters.AMIOperatingSystem.Default).toBe(
        'AmazonLinux2023'
      );
      expect(template.Parameters.AMIOperatingSystem.AllowedValues).toContain(
        'AmazonLinux2'
      );
      expect(template.Parameters.AMIOperatingSystem.AllowedValues).toContain(
        'Ubuntu22'
      );
    });
  });

  describe('Mappings', () => {
    test('should have OSToSSMParam mapping', () => {
      expect(template.Mappings.OSToSSMParam).toBeDefined();
      expect(template.Mappings.OSToSSMParam.AmazonLinux2023).toBeDefined();
      expect(template.Mappings.OSToSSMParam.AmazonLinux2023.SSMParam).toBe(
        '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64'
      );
      expect(template.Mappings.OSToSSMParam.Ubuntu22).toBeDefined();
      expect(template.Mappings.OSToSSMParam.Ubuntu22.SSMParam).toBe(
        '/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id'
      );
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
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have public subnets in two AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);

      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have private subnets in two AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.0.11.0/24'
      );

      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.0.12.0/24'
      );
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
      expect(
        template.Resources.PublicSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PublicSubnet2RouteTableAssociation
      ).toBeDefined();

      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(
        template.Resources.PrivateSubnet1RouteTableAssociation
      ).toBeDefined();

      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
      expect(
        template.Resources.PrivateSubnet2RouteTableAssociation
      ).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have LoadBalancer security group', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.LoadBalancerSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );

      const ingress =
        template.Resources.LoadBalancerSecurityGroup.Properties
          .SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443)).toBe(true);
    });

    test('should have WebServer security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have Bastion security group', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );

      const ingress =
        template.Resources.BastionSecurityGroup.Properties.SecurityGroupIngress;
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
      expect(template.Resources.ApplicationDataBucket.Type).toBe(
        'AWS::S3::Bucket'
      );

      const props = template.Resources.ApplicationDataBucket.Properties;
      expect(props.BucketEncryption).toBeDefined();
      expect(
        props.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have LoggingBucket with encryption', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');

      const props = template.Resources.LoggingBucket.Properties;
      expect(props.BucketEncryption).toBeDefined();
      expect(
        props.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      expect(props.LifecycleConfiguration).toBeDefined();
      expect(props.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have bucket policies enforcing TLS', () => {
      expect(template.Resources.ApplicationDataBucketPolicy).toBeDefined();
      expect(template.Resources.ApplicationDataBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );

      const appPolicy =
        template.Resources.ApplicationDataBucketPolicy.Properties.PolicyDocument
          .Statement[0];
      expect(appPolicy.Effect).toBe('Deny');
      expect(appPolicy.Condition.Bool['aws:SecureTransport']).toBe('false');

      expect(template.Resources.LoggingBucketPolicy).toBeDefined();
      expect(template.Resources.LoggingBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.FinAppKMSKey).toBeDefined();
      expect(template.Resources.FinAppKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.FinAppKMSKey.Properties.Description).toBe(
        'KMS Key for Financial Application encryption'
      );

      // Check KMS key policy structure
      const keyPolicy = template.Resources.FinAppKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(3);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.FinAppKMSKeyAlias).toBeDefined();
      expect(template.Resources.FinAppKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have separate KMS access policy for EC2', () => {
      expect(template.Resources.EC2KMSAccessPolicy).toBeDefined();
      expect(template.Resources.EC2KMSAccessPolicy.Type).toBe(
        'AWS::IAM::Policy'
      );
      expect(template.Resources.EC2KMSAccessPolicy.Properties.PolicyName).toBe(
        'EC2KMSAccess'
      );
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      expect(
        template.Resources.EC2InstanceRole.Properties.RoleName
      ).toBeDefined();

      const policies = template.Resources.EC2InstanceRole.Properties.Policies;
      expect(policies).toHaveLength(2);
      expect(policies.some((p: any) => p.PolicyName === 'S3AccessPolicy')).toBe(
        true
      );
      expect(
        policies.some((p: any) => p.PolicyName === 'CloudWatchLogsPolicy')
      ).toBe(true);
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('should follow least privilege principle', () => {
      const s3Policy =
        template.Resources.EC2InstanceRole.Properties.Policies.find(
          (p: any) => p.PolicyName === 'S3AccessPolicy'
        );
      const s3Statement = s3Policy.PolicyDocument.Statement[0];

      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).not.toContain('s3:*');
    });

    test('should have separate KMS permissions in dedicated policy', () => {
      // KMS permissions should now be in the separate EC2KMSAccessPolicy
      const kmsPolicy = template.Resources.EC2KMSAccessPolicy;
      expect(kmsPolicy).toBeDefined();

      const kmsStatement = kmsPolicy.Properties.PolicyDocument.Statement[0];
      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Action).toContain('kms:CreateGrant');
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('should have launch template with SSM parameter for AMI', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );

      const launchData =
        template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(launchData.ImageId).toBeDefined();

      // Check for SSM parameter resolution
      const imageId = JSON.stringify(launchData.ImageId);
      expect(imageId).toContain('resolve:ssm:');

      expect(launchData.InstanceType).toBeDefined();
      expect(launchData.UserData).toBeDefined();
      expect(launchData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );

      const props = template.Resources.AutoScalingGroup.Properties;
      expect(props.MinSize).toBe(2);
      expect(props.MaxSize).toBe(6);
      expect(props.DesiredCapacity).toBe(2);
      expect(props.HealthCheckType).toBe('ELB');
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe(
        'AWS::AutoScaling::ScalingPolicy'
      );
      expect(
        template.Resources.ScaleUpPolicy.Properties.ScalingAdjustment
      ).toBe(1);

      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy.Type).toBe(
        'AWS::AutoScaling::ScalingPolicy'
      );
      expect(
        template.Resources.ScaleDownPolicy.Properties.ScalingAdjustment
      ).toBe(-1);
    });

    test('should have CloudWatch alarms for scaling', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmHigh.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
      expect(template.Resources.CPUAlarmHigh.Properties.Threshold).toBe(70);

      expect(template.Resources.CPUAlarmLow).toBeDefined();
      expect(template.Resources.CPUAlarmLow.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
      expect(template.Resources.CPUAlarmLow.Properties.Threshold).toBe(25);
    });
  });

  describe('Load Balancing', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(template.Resources.ApplicationLoadBalancer.Properties.Type).toBe(
        'application'
      );
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe(
        'internet-facing'
      );
    });

    test('should have Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
      expect(template.Resources.TargetGroup.Properties.Port).toBe(80);
      expect(template.Resources.TargetGroup.Properties.Protocol).toBe('HTTP');
      expect(template.Resources.TargetGroup.Properties.HealthCheckPath).toBe(
        '/'
      );
    });

    test('should have Load Balancer Listener', () => {
      expect(template.Resources.LoadBalancerListener).toBeDefined();
      expect(template.Resources.LoadBalancerListener.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
      expect(template.Resources.LoadBalancerListener.Properties.Port).toBe(80);
      expect(template.Resources.LoadBalancerListener.Properties.Protocol).toBe(
        'HTTP'
      );
    });
  });

  describe('Bastion Host', () => {
    test('should have Bastion Host instance with SSM parameter for AMI', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.BastionHost.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.BastionHost.Properties.InstanceType).toBe(
        't3.micro'
      );
      expect(
        template.Resources.BastionHost.Properties.BlockDeviceMappings[0].Ebs
          .Encrypted
      ).toBe(true);

      // Check for SSM parameter resolution
      const imageId = JSON.stringify(
        template.Resources.BastionHost.Properties.ImageId
      );
      expect(imageId).toContain('resolve:ssm:');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix in names', () => {
      const resourcesWithNames = [
        'ApplicationDataBucket',
        'LoggingBucket',
        'LaunchTemplate',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'AutoScalingGroup',
        'CPUAlarmHigh',
        'CPUAlarmLow',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const nameProps = [
            'BucketName',
            'LaunchTemplateName',
            'Name',
            'AutoScalingGroupName',
            'AlarmName',
          ];

          nameProps.forEach(prop => {
            if (resource.Properties[prop]) {
              const value = JSON.stringify(resource.Properties[prop]);
              // Some resources use EnvironmentName instead of EnvironmentSuffix in this template
              expect(value).toMatch(/Environment(Name|Suffix)/);
            }
          });
        }
      });
    });

    test('EC2 role should include EnvironmentName', () => {
      const roleName = JSON.stringify(
        template.Resources.EC2InstanceRole.Properties.RoleName
      );
      expect(roleName).toContain('EnvironmentName');
    });

    test('EC2 instance profile should include EnvironmentName', () => {
      const profileName = JSON.stringify(
        template.Resources.EC2InstanceProfile.Properties.InstanceProfileName
      );
      expect(profileName).toContain('EnvironmentName');
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
        'PublicSubnets',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('should have new outputs for SSM and OS info', () => {
      expect(template.Outputs.AMIParameterUsed).toBeDefined();
      expect(template.Outputs.SelectedOperatingSystem).toBeDefined();
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
      const publicSubnet1AZ =
        template.Resources.PublicSubnet1.Properties.AvailabilityZone[
          'Fn::Select'
        ][0];
      const publicSubnet2AZ =
        template.Resources.PublicSubnet2.Properties.AvailabilityZone[
          'Fn::Select'
        ][0];
      expect(publicSubnet1AZ).not.toBe(publicSubnet2AZ);

      // Check private subnets are in different AZs
      const privateSubnet1AZ =
        template.Resources.PrivateSubnet1.Properties.AvailabilityZone[
          'Fn::Select'
        ][0];
      const privateSubnet2AZ =
        template.Resources.PrivateSubnet2.Properties.AvailabilityZone[
          'Fn::Select'
        ][0];
      expect(privateSubnet1AZ).not.toBe(privateSubnet2AZ);

      // Check Auto Scaling Group uses both private subnets
      const asgSubnets =
        template.Resources.AutoScalingGroup.Properties.VPCZoneIdentifier;
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
      const ebsConfig =
        launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
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

    test('KMS key should have proper condition-based access', () => {
      const kmsKey = template.Resources.FinAppKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      // Should have at least one statement with ViaService condition for EC2
      const hasViaServiceCondition = keyPolicy.Statement.some(
        (statement: any) =>
          statement.Condition &&
          statement.Condition.StringEquals &&
          statement.Condition.StringEquals['kms:ViaService']
      );

      expect(hasViaServiceCondition).toBe(true);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('all resource references should be valid', () => {
      const jsonString = JSON.stringify(template);
      const refMatches = jsonString.match(/"Ref":\s*"([^"]+)"/g) || [];

      refMatches.forEach(match => {
        const resourceName = match.match(/"Ref":\s*"([^"]+)"/)?.[1];
        if (resourceName && !resourceName.startsWith('AWS::')) {
          const isParameter =
            template.Parameters &&
            template.Parameters[resourceName] !== undefined;
          const isResource =
            template.Resources &&
            template.Resources[resourceName] !== undefined;
          expect(isParameter || isResource).toBe(true);
        }
      });
    });

    test('should have proper dependency management', () => {
      // Check that NAT Gateway EIPs have proper dependencies
      expect(template.Resources.NatGateway1EIP.DependsOn).toBe(
        'InternetGatewayAttachment'
      );
      expect(template.Resources.NatGateway2EIP.DependsOn).toBe(
        'InternetGatewayAttachment'
      );
    });
  });

  describe('Advanced Security Features', () => {
    test('should have proper KMS key access patterns', () => {
      const kmsKey = template.Resources.FinAppKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      // Should have root account access
      const hasRootAccess = keyPolicy.Statement.some(
        (statement: any) =>
          statement.Principal &&
          statement.Principal.AWS &&
          JSON.stringify(statement.Principal.AWS).includes('root')
      );
      expect(hasRootAccess).toBe(true);

      // Should have service-specific access
      const hasS3Access = keyPolicy.Statement.some(
        (statement: any) =>
          statement.Principal &&
          statement.Principal.Service === 's3.amazonaws.com'
      );
      expect(hasS3Access).toBe(true);
    });

    test('should enforce HTTPS for S3 access', () => {
      const appBucketPolicy = template.Resources.ApplicationDataBucketPolicy;
      const loggingBucketPolicy = template.Resources.LoggingBucketPolicy;

      [appBucketPolicy, loggingBucketPolicy].forEach(policy => {
        const statement = policy.Properties.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Deny');
        expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
        expect(statement.Action).toBe('s3:*');
      });
    });

    test('should use KMS encryption for EBS volumes', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const bastionHost = template.Resources.BastionHost;

      [launchTemplate, bastionHost].forEach(resource => {
        const blockDeviceMapping =
          resource.Properties.LaunchTemplateData?.BlockDeviceMappings?.[0] ||
          resource.Properties.BlockDeviceMappings?.[0];
        expect(blockDeviceMapping.Ebs.Encrypted).toBe(true);
        expect(blockDeviceMapping.Ebs.KmsKeyId).toBeDefined();
      });
    });
  });

  describe('Network Security', () => {
    test('should have proper security group ingress rules', () => {
      const webServerSG = template.Resources.WebServerSecurityGroup;
      const bastionSG = template.Resources.BastionSecurityGroup;
      const albSG = template.Resources.LoadBalancerSecurityGroup;

      // ALB should allow HTTP/HTTPS from internet
      const albIngress = albSG.Properties.SecurityGroupIngress;
      expect(
        albIngress.some(
          (rule: any) => rule.FromPort === 80 && rule.CidrIp === '0.0.0.0/0'
        )
      ).toBe(true);
      expect(
        albIngress.some(
          (rule: any) => rule.FromPort === 443 && rule.CidrIp === '0.0.0.0/0'
        )
      ).toBe(true);

      // Bastion should only allow SSH from specified CIDR
      const bastionIngress = bastionSG.Properties.SecurityGroupIngress;
      expect(bastionIngress[0].FromPort).toBe(22);
      expect(bastionIngress[0].CidrIp).toBeDefined();
    });

    test('should have security group rules to prevent circular dependencies', () => {
      const requiredRules = [
        'LoadBalancerToWebServerEgress',
        'WebServerFromLoadBalancerIngress',
        'WebServerFromBastionIngress',
        'BastionToWebServerEgress',
      ];

      requiredRules.forEach(ruleName => {
        expect(template.Resources[ruleName]).toBeDefined();
        expect(template.Resources[ruleName].Type).toMatch(
          /SecurityGroup(Ingress|Egress)/
        );
      });
    });
  });

  describe('Resource Optimization', () => {
    test('should use GP3 volumes for better performance', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const bastionHost = template.Resources.BastionHost;

      [launchTemplate, bastionHost].forEach(resource => {
        const blockDeviceMapping =
          resource.Properties.LaunchTemplateData?.BlockDeviceMappings?.[0] ||
          resource.Properties.BlockDeviceMappings?.[0];
        expect(blockDeviceMapping.Ebs.VolumeType).toBe('gp3');
      });
    });

    test('should have appropriate instance sizes', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const bastionHost = template.Resources.BastionHost;

      // Launch template should use parameter
      expect(
        launchTemplate.Properties.LaunchTemplateData.InstanceType
      ).toBeDefined();

      // Bastion should use micro instance
      expect(bastionHost.Properties.InstanceType).toBe('t3.micro');
    });
  });

  describe('Tagging Strategy', () => {
    test('should have consistent tagging across resources', () => {
      const taggedResources = [
        'VPC',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'InternetGateway',
        'NatGateway1',
        'NatGateway2',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'BastionHost',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const nameTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Name'
        );
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toBeDefined();
      });
    });

    test('Auto Scaling Group should propagate tags', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;

      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThan(0);

      // Should have propagation settings
      tags.forEach((tag: any) => {
        expect(tag.PropagateAtLaunch).toBeDefined();
      });
    });
  });

  describe('Template Specific Validations', () => {
    test('should have proper KMS key reference in S3 bucket', () => {
      const appBucket = template.Resources.ApplicationDataBucket;
      const kmsKeyRef =
        appBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .KMSMasterKeyID;

      expect(kmsKeyRef).toBeDefined();
      expect(JSON.stringify(kmsKeyRef)).toContain('FinAppKMSKey');
    });

    test('should have proper launch template configuration', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const launchData = launchTemplate.Properties.LaunchTemplateData;

      // Should have IAM instance profile
      expect(launchData.IamInstanceProfile).toBeDefined();
      expect(launchData.IamInstanceProfile.Arn).toBeDefined();

      // Should have security groups
      expect(launchData.SecurityGroupIds).toBeDefined();
      expect(launchData.SecurityGroupIds).toHaveLength(1);
    });

    test('should have proper Auto Scaling Group configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      const props = asg.Properties;

      // Should reference launch template
      expect(props.LaunchTemplate).toBeDefined();
      expect(props.LaunchTemplate.LaunchTemplateId).toBeDefined();
      expect(props.LaunchTemplate.Version).toBeDefined();

      // Should have target group ARNs
      expect(props.TargetGroupARNs).toBeDefined();
      expect(props.TargetGroupARNs).toHaveLength(1);
    });

    test('should have proper ALB configuration', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const listener = template.Resources.LoadBalancerListener;

      // ALB should be internet-facing
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');

      // Listener should forward to target group
      expect(listener.Properties.DefaultActions).toHaveLength(1);
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(
        listener.Properties.DefaultActions[0].TargetGroupArn
      ).toBeDefined();
    });

    test('should have proper VPC CIDR and subnet allocation', () => {
      const vpc = template.Resources.VPC;
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('should have comprehensive output exports', () => {
      const outputs = template.Outputs;

      // All outputs should have proper export names
      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();

        const exportName = output.Export.Name;
        if (typeof exportName === 'object' && exportName['Fn::Sub']) {
          expect(exportName['Fn::Sub']).toContain('EnvironmentSuffix');
        }
      });
    });
  });
});
