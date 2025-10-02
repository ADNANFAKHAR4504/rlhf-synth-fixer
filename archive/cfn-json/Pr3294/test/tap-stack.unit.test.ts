import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Charity Web Platform', () => {
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
        'Charity Web Platform Infrastructure for 1,500 daily donors with secure access and monitoring'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(template.Parameters.LatestAmiId.Default).toBe('/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64');
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have correct CIDR blocks', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.VPC.CIDR).toBe('10.50.0.0/16');
      expect(subnetConfig.PublicSubnet1.CIDR).toBe('10.50.1.0/24');
      expect(subnetConfig.PublicSubnet2.CIDR).toBe('10.50.2.0/24');
      expect(subnetConfig.PrivateSubnet1.CIDR).toBe('10.50.10.0/24');
      expect(subnetConfig.PrivateSubnet2.CIDR).toBe('10.50.11.0/24');
    });
  });

  describe('Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.CharityVPC).toBeDefined();
      expect(template.Resources.CharityVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.CharityVPC.Properties;
      expect(vpc.CidrBlock).toEqual({ 'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR'] });
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have correct route configurations', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute).toBeDefined();
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway' });
    });

    test('should have EC2 Instance Connect Endpoint', () => {
      expect(template.Resources.EC2InstanceConnectEndpoint).toBeDefined();
      expect(template.Resources.EC2InstanceConnectEndpoint.Type).toBe('AWS::EC2::InstanceConnectEndpoint');
      expect(template.Resources.EC2InstanceConnectEndpoint.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
    });
  });

  describe('Security Configuration', () => {
    test('should have WebServerSecurityGroup', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServerSecurityGroup should have correct ingress rules', () => {
      const sg = template.Resources.WebServerSecurityGroup.Properties;
      const ingressRules = sg.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(3);

      // HTTPS rule
      const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');

      // HTTP rule
      const httpRule = ingressRules.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      // SSH rule
      const sshRule = ingressRules.find((r: any) => r.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('10.0.0.0/8');
    });
  });

  describe('IAM Configuration', () => {
    test('should have EC2Role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2Role should have correct assume role policy', () => {
      const role = template.Resources.EC2Role.Properties;
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(role.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2Role should have CloudWatch agent policy', () => {
      const role = template.Resources.EC2Role.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2Role should have S3 access policy', () => {
      const role = template.Resources.EC2Role.Properties;
      const s3Policy = role.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:DeleteObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.EC2InstanceProfile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });
  });

  describe('Compute Resources', () => {
    test('should have LaunchTemplate', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('LaunchTemplate should have correct properties', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(lt.InstanceType).toBe('t3.micro');
      expect(lt.Monitoring.Enabled).toBe(true);
      expect(lt.IamInstanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
    });

    test('should have UserData for Apache installation', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.UserData).toBeDefined();
      expect(lt.UserData['Fn::Base64']).toContain('httpd');
      expect(lt.UserData['Fn::Base64']).toContain('systemctl start httpd');
      expect(lt.UserData['Fn::Base64']).toContain('amazon-cloudwatch-agent');
    });

    test('should have two EC2 instances', () => {
      expect(template.Resources.WebServerInstance1).toBeDefined();
      expect(template.Resources.WebServerInstance1.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.WebServerInstance2).toBeDefined();
      expect(template.Resources.WebServerInstance2.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instances should use LaunchTemplate', () => {
      expect(template.Resources.WebServerInstance1.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(template.Resources.WebServerInstance2.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
    });

    test('EC2 instances should be in different subnets', () => {
      expect(template.Resources.WebServerInstance1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.WebServerInstance2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.StaticAssetsBucket).toBeDefined();
      expect(template.Resources.StaticAssetsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have server-side encryption', () => {
      const bucket = template.Resources.StaticAssetsBucket.Properties;
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.StaticAssetsBucket.Properties;
      const publicBlock = bucket.PublicAccessBlockConfiguration;
      expect(publicBlock.BlockPublicAcls).toBe(true);
      expect(publicBlock.BlockPublicPolicy).toBe(true);
      expect(publicBlock.IgnorePublicAcls).toBe(true);
      expect(publicBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket name should include environment suffix', () => {
      const bucket = template.Resources.StaticAssetsBucket.Properties;
      expect(bucket.BucketName).toEqual({ 'Fn::Sub': 'charity-static-assets-${AWS::AccountId}-${EnvironmentSuffix}' });
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch CPU alarms', () => {
      expect(template.Resources.CPUAlarmHigh1).toBeDefined();
      expect(template.Resources.CPUAlarmHigh1.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.CPUAlarmHigh2).toBeDefined();
      expect(template.Resources.CPUAlarmHigh2.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CPU alarms should have correct threshold', () => {
      expect(template.Resources.CPUAlarmHigh1.Properties.Threshold).toBe(80);
      expect(template.Resources.CPUAlarmHigh1.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(template.Resources.CPUAlarmHigh2.Properties.Threshold).toBe(80);
      expect(template.Resources.CPUAlarmHigh2.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('CPU alarms should monitor correct instances', () => {
      expect(template.Resources.CPUAlarmHigh1.Properties.Dimensions[0].Value).toEqual({ Ref: 'WebServerInstance1' });
      expect(template.Resources.CPUAlarmHigh2.Properties.Dimensions[0].Value).toEqual({ Ref: 'WebServerInstance2' });
    });

    test('should have CloudWatch Dashboard', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('CloudWatch Dashboard should have correct name', () => {
      expect(template.Resources.CloudWatchDashboard.Properties.DashboardName).toEqual({ 'Fn::Sub': 'CharityPlatform-${EnvironmentSuffix}' });
    });

    test('CloudWatch Dashboard should include metrics', () => {
      const dashboardBody = template.Resources.CloudWatchDashboard.Properties.DashboardBody;
      expect(dashboardBody).toContain('CPUUtilization');
      expect(dashboardBody).toContain('NetworkIn');
      expect(dashboardBody).toContain('NetworkOut');
      expect(dashboardBody).toContain('us-east-2');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'WebServerInstance1Id',
        'WebServerInstance2Id',
        'WebServerInstance1PublicIP',
        'WebServerInstance2PublicIP',
        'StaticAssetsBucketName',
        'EC2ConnectEndpointId',
        'CloudWatchDashboardURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'CharityVPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPCId' });
    });

    test('Instance outputs should be correct', () => {
      expect(template.Outputs.WebServerInstance1Id.Value).toEqual({ Ref: 'WebServerInstance1' });
      expect(template.Outputs.WebServerInstance2Id.Value).toEqual({ Ref: 'WebServerInstance2' });
      expect(template.Outputs.WebServerInstance1PublicIP.Value).toEqual({ 'Fn::GetAtt': ['WebServerInstance1', 'PublicIp'] });
      expect(template.Outputs.WebServerInstance2PublicIP.Value).toEqual({ 'Fn::GetAtt': ['WebServerInstance2', 'PublicIp'] });
    });

    test('S3 bucket output should be correct', () => {
      expect(template.Outputs.StaticAssetsBucketName.Value).toEqual({ Ref: 'StaticAssetsBucket' });
    });

    test('CloudWatch Dashboard URL should be correct', () => {
      const output = template.Outputs.CloudWatchDashboardURL;
      expect(output.Value['Fn::Sub']).toContain('https://console.aws.amazon.com/cloudwatch');
      expect(output.Value['Fn::Sub']).toContain('region=us-east-2');
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
      expect(resourceCount).toBeGreaterThan(20); // We have many resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // EnvironmentSuffix and LatestAmiId
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should follow naming convention with environment suffix', () => {
      // Check VPC
      expect(template.Resources.CharityVPC.Properties.Tags[0].Value).toEqual({ 'Fn::Sub': 'CharityVPC-${EnvironmentSuffix}' });

      // Check Security Group
      expect(template.Resources.WebServerSecurityGroup.Properties.GroupName).toEqual({ 'Fn::Sub': 'WebServerSG-${EnvironmentSuffix}' });

      // Check S3 Bucket
      expect(template.Resources.StaticAssetsBucket.Properties.BucketName).toEqual({ 'Fn::Sub': 'charity-static-assets-${AWS::AccountId}-${EnvironmentSuffix}' });

      // Check IAM Role
      expect(template.Resources.EC2Role.Properties.RoleName).toEqual({ 'Fn::Sub': 'EC2Role-${EnvironmentSuffix}' });

      // Check Instance Profile
      expect(template.Resources.EC2InstanceProfile.Properties.InstanceProfileName).toEqual({ 'Fn::Sub': 'EC2Profile-${EnvironmentSuffix}' });

      // Check Launch Template
      expect(template.Resources.LaunchTemplate.Properties.LaunchTemplateName).toEqual({ 'Fn::Sub': 'WebServerTemplate-${EnvironmentSuffix}' });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name).toEqual({ 'Fn::Sub': `\${AWS::StackName}-${outputKey}` });
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should be deletable (no Retain policies)', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        // Resources should either have no DeletionPolicy or have it set to Delete
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });
  });
});