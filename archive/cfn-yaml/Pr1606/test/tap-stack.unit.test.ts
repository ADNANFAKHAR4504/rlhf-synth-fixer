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
      expect(template.Description).toContain(
        'TapStack - Secure Production Environment'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const interface_ = template.Metadata['AWS::CloudFormation::Interface'];
      expect(interface_.ParameterGroups).toBeDefined();
      expect(interface_.ParameterGroups).toHaveLength(2);
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'CompanyPrefix',
      'UseExistingVPC',
      'VpcId',
      'UseExistingPublicSubnets',
      'PublicSubnetIds',
      'UseExistingPrivateSubnets',
      'PrivateSubnetIds',
      'CertificateArn',
      'AllowedSSHIP',
      'UseExistingCloudTrail',
      'CloudTrailBucketName',
      'LatestAmiId',
      'CreateRDS',
      'DBMasterUser',
      'DBPasswordSecretName',
      'UseExistingConfigRecorder',
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('CompanyPrefix parameter should have correct properties', () => {
      const param = template.Parameters.CompanyPrefix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('corp-sec');
      expect(param.Description).toBe('Resource name prefix');
    });

    test('VpcId parameter should have correct validation pattern', () => {
      const param = template.Parameters.VpcId;
      expect(param.AllowedPattern).toBe('^$|^vpc-([0-9a-f]{8}|[0-9a-f]{17})$');
    });

    test('UseExistingVPC parameter should have correct allowed values', () => {
      const param = template.Parameters.UseExistingVPC;
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Default).toBe('false');
    });

    test('CreateRDS parameter should have correct allowed values', () => {
      const param = template.Parameters.CreateRDS;
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Default).toBe('false');
    });
  });

  describe('Conditions', () => {
    const expectedConditions = [
      'CreateVPC',
      'CreatePublicSubnets',
      'CreatePrivateSubnets',
      'CreateVPCAndPublicSubnets',
      'HasCertificate',
      'CreateCloudTrail',
      'CreateRDSFlag',
      'HasCloudTrailBucketName',
      'HasDBPasswordSecretName',
      'CreateConfigRecorder',
    ];

    test('should have all required conditions', () => {
      expectedConditions.forEach(conditionName => {
        expect(template.Conditions[conditionName]).toBeDefined();
      });
    });

    test('CreateVPC condition should be correct', () => {
      const condition = template.Conditions.CreateVPC;
      expect(condition['Fn::Equals']).toEqual([
        { Ref: 'UseExistingVPC' },
        'false',
      ]);
    });

    test('HasCertificate condition should be correct', () => {
      const condition = template.Conditions.HasCertificate;
      expect(condition['Fn::Not']).toEqual([
        { 'Fn::Equals': [{ Ref: 'CertificateArn' }, ''] },
      ]);
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['eu-west-1']).toBeDefined();
    });

    test('RegionMap should have correct AZ structure', () => {
      const regionMap = template.Mappings.RegionMap;
      Object.values(regionMap).forEach((region: any) => {
        expect(region.AZs).toBeDefined();
        expect(Array.isArray(region.AZs)).toBe(true);
        expect(region.AZs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have ProdVPC resource with condition', () => {
      const vpc = template.Resources.ProdVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Condition).toBe('CreateVPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have InternetGateway with condition', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.Condition).toBe('CreateVPC');
    });

    test('should have public subnets with conditions', () => {
      const publicSubnetA = template.Resources.PublicSubnetA;
      const publicSubnetB = template.Resources.PublicSubnetB;

      expect(publicSubnetA).toBeDefined();
      expect(publicSubnetA.Condition).toBe('CreatePublicSubnets');
      expect(publicSubnetA.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(publicSubnetB).toBeDefined();
      expect(publicSubnetB.Condition).toBe('CreatePublicSubnets');
    });

    test('should have private subnets with conditions', () => {
      const privateSubnetA = template.Resources.PrivateSubnetA;
      const privateSubnetB = template.Resources.PrivateSubnetB;

      expect(privateSubnetA).toBeDefined();
      expect(privateSubnetA.Condition).toBe('CreatePrivateSubnets');
      expect(privateSubnetA.Properties.MapPublicIpOnLaunch).toBe(false);

      expect(privateSubnetB).toBeDefined();
      expect(privateSubnetB.Condition).toBe('CreatePrivateSubnets');
    });

    test('should have NAT Gateways with conditions', () => {
      const natGW1 = template.Resources.NatGW1;
      const natGW2 = template.Resources.NatGW2;

      expect(natGW1).toBeDefined();
      expect(natGW1.Condition).toBe('CreateVPC');
      expect(natGW2).toBeDefined();
      expect(natGW2.Condition).toBe('CreateVPC');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Properties.SecurityGroupIngress).toHaveLength(2);

      const ingressRules = albSG.Properties.SecurityGroupIngress;
      const ports = ingressRules.map((rule: any) => rule.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test('should have Instance Security Group', () => {
      const instanceSG = template.Resources.InstanceSecurityGroup;
      expect(instanceSG).toBeDefined();
      expect(instanceSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(instanceSG.Properties.SecurityGroupIngress).toHaveLength(3);

      const ingressRules = instanceSG.Properties.SecurityGroupIngress;
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 Role', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
      );
    });

    test('should have EC2 Instance Profile', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toContainEqual({
        Ref: 'EC2Role',
      });
    });

    test('should have Config Role', () => {
      const configRole = template.Resources.ConfigRole;
      expect(configRole).toBeDefined();
      expect(configRole.Type).toBe('AWS::IAM::Role');
      expect(configRole.Condition).toBe('CreateConfigRecorder');
      expect(configRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      );
    });
  });

  describe('KMS and S3 Resources', () => {
    test('should have CloudTrail KMS Key', () => {
      const kmsKey = template.Resources.CloudTrailKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(2);
    });

    test('should have CloudTrail S3 Bucket', () => {
      const bucket = template.Resources.ProdTrailBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have S3 Bucket Policy', () => {
      const bucketPolicy = template.Resources.ProdTrailBucketPolicy;
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(bucketPolicy.Properties.Bucket).toEqual({
        Ref: 'ProdTrailBucket',
      });
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail with condition', () => {
      const cloudTrail = template.Resources.ProdCloudTrail;
      expect(cloudTrail).toBeDefined();
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.Condition).toBe('CreateCloudTrail');
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('EC2 Resources', () => {
    test('should have Launch Template', () => {
      const launchTemplate = template.Resources.ProdLaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toBe(
        't3.micro'
      );
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toEqual({
        Ref: 'LatestAmiId',
      });
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.ProdASG;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('4');
      expect(asg.Properties.DesiredCapacity).toBe('2');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ProdALB;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have Target Group', () => {
      const targetGroup = template.Resources.ProdTargetGroup;
      expect(targetGroup).toBeDefined();
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
    });

    test('should have HTTP Listener', () => {
      const httpListener = template.Resources.ProdHTTPListener;
      expect(httpListener).toBeDefined();
      expect(httpListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpListener.Properties.Port).toBe(80);
      expect(httpListener.Properties.Protocol).toBe('HTTP');
    });

    test('should have HTTPS Listener with condition', () => {
      const httpsListener = template.Resources.ProdHTTPSListener;
      expect(httpsListener).toBeDefined();
      expect(httpsListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpsListener.Condition).toBe('HasCertificate');
      expect(httpsListener.Properties.Port).toBe(443);
      expect(httpsListener.Properties.Protocol).toBe('HTTPS');
    });
  });

  describe('AWS Config Resources', () => {
    test('should have Config Recorder', () => {
      const configRecorder = template.Resources.ConfigRecorder;
      expect(configRecorder).toBeDefined();
      expect(configRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(configRecorder.Condition).toBe('CreateConfigRecorder');
      expect(configRecorder.Properties.RecordingGroup.AllSupported).toBe(true);
    });

    test('should have Config Delivery Channel', () => {
      const deliveryChannel = template.Resources.ConfigDeliveryChannel;
      expect(deliveryChannel).toBeDefined();
      expect(deliveryChannel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(deliveryChannel.Condition).toBe('CreateConfigRecorder');
      expect(deliveryChannel.Properties.S3BucketName).toEqual({
        Ref: 'ProdTrailBucket',
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should have S3 Cleanup Lambda Role', () => {
      const lambdaRole = template.Resources.S3BucketCleanupRole;
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole.Type).toBe('AWS::IAM::Role');
      expect(lambdaRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have S3 Cleanup Lambda Function', () => {
      const lambdaFunction = template.Resources.S3BucketCleanupFunction;
      expect(lambdaFunction).toBeDefined();
      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
      expect(lambdaFunction.Properties.Runtime).toBe('python3.11');
      expect(lambdaFunction.Properties.Timeout).toBe(300);
      expect(lambdaFunction.Properties.Code.ZipFile).toBeDefined();
    });

    test('should have S3 Cleanup Custom Resource', () => {
      const customResource = template.Resources.S3BucketCleanup;
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('Custom::S3BucketCleanup');
      expect(customResource.Properties.ServiceToken).toEqual({
        'Fn::GetAtt': ['S3BucketCleanupFunction', 'Arn'],
      });
    });
  });

  describe('RDS Resources', () => {
    test('should have DB Secret with condition', () => {
      const dbSecret = template.Resources.DBSecret;
      expect(dbSecret).toBeDefined();
      expect(dbSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(dbSecret.Condition).toBe('CreateRDSFlag');
    });

    test('should have RDS Subnet Group with condition', () => {
      const subnetGroup = template.Resources.RDSSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Condition).toBe('CreateRDSFlag');
    });

    test('should have RDS Instance with condition', () => {
      const rdsInstance = template.Resources.CorpRDS;
      expect(rdsInstance).toBeDefined();
      expect(rdsInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(rdsInstance.Condition).toBe('CreateRDSFlag');
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
      expect(rdsInstance.Properties.MultiAZ).toBe(true);
      expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PublicSubnets',
      'PrivateSubnets',
      'ALBEndpoint',
      'ProdSecurityGroupId',
      'InstanceSecurityGroupId',
      'ProdTrailBucketName',
      'CloudTrailKMSKeyId',
      'ProdCloudTrailName',
      'ProdASGName',
      'ProdLaunchTemplateName',
      'ConfigRecorderName',
      'S3BucketCleanupFunctionName',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be conditional', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Value['Fn::If'][0]).toBe('CreateVPC');
    });

    test('ALBEndpoint output should reference ALB DNS name', () => {
      const output = template.Outputs.ALBEndpoint;
      expect(output.Value['Fn::GetAtt']).toEqual(['ProdALB', 'DNSName']);
    });

    test('PublicSubnets output should be conditional', () => {
      const output = template.Outputs.PublicSubnets;
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Value['Fn::If'][0]).toBe('CreatePublicSubnets');
    });

    test('PrivateSubnets output should be conditional', () => {
      const output = template.Outputs.PrivateSubnets;
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Value['Fn::If'][0]).toBe('CreatePrivateSubnets');
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

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have reasonable number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(10);
    });

    test('should have reasonable number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(10);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use CompanyPrefix in naming', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Name'
          );
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toBeDefined();
            expect(nameTag.Value['Fn::Sub']).toContain('${CompanyPrefix}');
          }
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.ProdTrailBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
    });

    test('RDS instance should be encrypted and not publicly accessible', () => {
      const rdsInstance = template.Resources.CorpRDS;
      if (rdsInstance) {
        expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
        expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
      }
    });

    test('Security groups should have restricted ingress rules', () => {
      const instanceSG = template.Resources.InstanceSecurityGroup;
      const sshRule = instanceSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule.CidrIp).not.toBe('0.0.0.0/0');
    });
  });
});
