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
        'Web server infrastructure for non-profit donation platform'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming'
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
      expect(vpc.Properties.CidrBlock).toBe('10.6.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have PublicSubnet resource', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnet should have correct configuration', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.CidrBlock).toBe('10.6.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPCGatewayAttachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have RouteTable and Route', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.SubnetRouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have WebServerSecurityGroup', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServerSecurityGroup should allow HTTP on port 80', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('WebServerSecurityGroup should allow SSH on port 22 from specific CIDR', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('172.16.0.0/24');
    });
  });

  describe('Storage Resources', () => {
    test('should have StaticAssetsBucket', () => {
      expect(template.Resources.StaticAssetsBucket).toBeDefined();
      expect(template.Resources.StaticAssetsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('StaticAssetsBucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('StaticAssetsBucket should have proper naming', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('nonprofit-static-assets-${EnvironmentSuffix}');
    });

    test('should have BucketPolicy for public read access', () => {
      expect(template.Resources.BucketPolicy).toBeDefined();
      expect(template.Resources.BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('IAM Resources', () => {
    test('should have InstanceRole', () => {
      expect(template.Resources.InstanceRole).toBeDefined();
      expect(template.Resources.InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('InstanceRole should have CloudWatch and SSM managed policies', () => {
      const role = template.Resources.InstanceRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have InstanceProfile', () => {
      expect(template.Resources.InstanceProfile).toBeDefined();
      expect(template.Resources.InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Compute Resources', () => {
    test('should have LaunchTemplate', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('LaunchTemplate should have correct instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
    });

    test('LaunchTemplate should enable detailed monitoring', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.Monitoring.Enabled).toBe(true);
    });

    test('should have WebServerInstance', () => {
      expect(template.Resources.WebServerInstance).toBeDefined();
      expect(template.Resources.WebServerInstance.Type).toBe('AWS::EC2::Instance');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CPUAlarm', () => {
      expect(template.Resources.CPUAlarm).toBeDefined();
      expect(template.Resources.CPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CPUAlarm should have correct threshold', () => {
      const alarm = template.Resources.CPUAlarm;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('should have SNSTopic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CloudWatch Dashboard', () => {
      expect(template.Resources.Dashboard).toBeDefined();
      expect(template.Resources.Dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'WebServerPublicIP',
        'WebServerURL',
        'StaticAssetsBucketName',
        'StaticAssetsBucketURL',
        'DashboardURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('WebServerPublicIP output should be correct', () => {
      const output = template.Outputs.WebServerPublicIP;
      expect(output.Description).toBe('Public IP of the web server');
      expect(output.Value['Fn::GetAtt']).toEqual(['WebServerInstance', 'PublicIp']);
    });

    test('StaticAssetsBucketName output should be correct', () => {
      const output = template.Outputs.StaticAssetsBucketName;
      expect(output.Description).toBe('Name of the S3 bucket for static assets');
      expect(output.Value.Ref).toBe('StaticAssetsBucket');
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

    test('should have at least 15 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all taggable resources should include EnvironmentSuffix in Name tag', () => {
      const taggableResources = ['VPC', 'PublicSubnet', 'InternetGateway',
        'PublicRouteTable', 'WebServerSecurityGroup', 'StaticAssetsBucket',
        'InstanceRole'];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('bucket name should include environment suffix', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('alarm name should include environment suffix', () => {
      const alarm = template.Resources.CPUAlarm;
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('SNS topic name should include environment suffix', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Best Practices', () => {
    test('should use principle of least privilege for IAM role', () => {
      const role = template.Resources.InstanceRole;
      const s3Policy = role.Properties.Policies[0];
      expect(s3Policy.PolicyName).toBe('S3AccessPolicy');
      const actions = s3Policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:ListBucket');
      expect(actions).not.toContain('s3:*');
    });

    test('should restrict SSH access to specific CIDR', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule.CidrIp).not.toBe('0.0.0.0/0');
      expect(sshRule.CidrIp).toBe('172.16.0.0/24');
    });

    test('should enable S3 bucket versioning', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should have CloudWatch alarm for CPU utilization', () => {
      const alarm = template.Resources.CPUAlarm;
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.Dashboard;
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toContain('NonProfitPlatform');
    });
  });
});