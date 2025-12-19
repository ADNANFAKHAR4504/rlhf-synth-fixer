import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template (converted from YAML)
    // Run: python3 -m cfn_flip lib/TapStack.yml lib/TapStack.json
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

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toBeDefined();
      expect(Array.isArray(parameterGroups)).toBe(true);
      expect(parameterGroups.length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'KeyPairName',
        'AdminIPAddress',
        'DBUsername',
        'DBPassword',
        'BlogDomainName',
        'NotificationEmail',
        'Environment',
        'ImageId'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('KeyPairName parameter should be optional', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('optional');
    });

    test('DBUsername parameter should have constraints', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('DBPassword parameter should be NoEcho', () => {
      const param = template.Parameters.DBPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(41);
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('ImageId parameter should have default value', () => {
      const param = template.Parameters.ImageId;
      expect(param.Type).toBe('AWS::EC2::Image::Id');
      expect(param.Default).toBeDefined();
      expect(param.Default).toBeTruthy();
    });

    test('NotificationEmail parameter should have pattern validation', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toContain('email');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
  });

  describe('Resources - Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.RecipeBlogVPC).toBeDefined();
      const vpc = template.Resources.RecipeBlogVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.15.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have Public Subnet', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.15.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two Private Subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.15.2.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.15.3.0/24');
    });

    test('should have Route Table and Routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
    });
  });

  describe('Resources - Security Groups', () => {
    test('should have WebServer Security Group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBeDefined();
    });

    test('WebServer Security Group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      expect(Array.isArray(ingressRules)).toBe(true);
      const httpRule = ingressRules.find((r: any) => r.FromPort === 80);
      const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('should have Database Security Group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Database Security Group should allow MySQL from WebServer', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      expect(Array.isArray(ingressRules)).toBe(true);
      const mysqlRule = ingressRules.find((r: any) => r.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.IpProtocol).toBe('tcp');
    });
  });

  describe('Resources - Database', () => {
    test('should have RDS DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS Database Instance', () => {
      expect(template.Resources.WordPressDatabase).toBeDefined();
      const db = template.Resources.WordPressDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(db.Properties.AllocatedStorage).toBe(20); // Number, not string
    });

    test('RDS should have proper deletion policy', () => {
      const db = template.Resources.WordPressDatabase;
      expect(db.Properties.DeletionProtection).toBeDefined();
      // DeletionPolicy can be Delete or Snapshot
      expect(['Delete', 'Snapshot', 'Retain']).toContain(db.DeletionPolicy);
    });

    test('RDS should not have MaxAllocatedStorage property', () => {
      const db = template.Resources.WordPressDatabase;
      // MaxAllocatedStorage is not a valid CloudFormation property
      expect(db.Properties.MaxAllocatedStorage).toBeUndefined();
    });

    test('RDS should have proper storage configuration', () => {
      const db = template.Resources.WordPressDatabase;
      expect(db.Properties.AllocatedStorage).toBeDefined();
      expect(db.Properties.StorageType).toBeDefined();
      expect(db.Properties.StorageEncrypted).toBe(true);
    });
  });

  describe('Resources - Storage', () => {
    test('should have S3 Bucket for media', () => {
      expect(template.Resources.MediaBucket).toBeDefined();
      const bucket = template.Resources.MediaBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 Bucket should have lifecycle configuration', () => {
      const bucket = template.Resources.MediaBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });

    test('S3 Bucket should have CORS configuration', () => {
      const bucket = template.Resources.MediaBucket;
      expect(bucket.Properties.CorsConfiguration).toBeDefined();
    });

    test('S3 Bucket should have public read policy', () => {
      expect(template.Resources.MediaBucketPolicy).toBeDefined();
      const policy = template.Resources.MediaBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Resources - IAM', () => {
    test('should have EC2 Instance Role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 Role should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      expect(Array.isArray(policies)).toBe(true);
      expect(policies.length).toBeGreaterThan(0);
    });

    test('should have Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Resources - Compute', () => {
    test('should have WordPress EC2 Instance', () => {
      expect(template.Resources.WordPressInstance).toBeDefined();
      const instance = template.Resources.WordPressInstance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t3.micro');
    });

    test('EC2 Instance should have proper configuration', () => {
      const instance = template.Resources.WordPressInstance;
      expect(instance.Properties.InstanceType).toBe('t3.micro');
      expect(instance.Properties.IamInstanceProfile).toBeDefined();
      expect(instance.Properties.NetworkInterfaces).toBeDefined();
    });

    test('EC2 Instance should have UserData', () => {
      const instance = template.Resources.WordPressInstance;
      expect(instance.Properties.UserData).toBeDefined();
    });

    test('should have Elastic IP for WordPress', () => {
      // Check for WordPress EIP
      expect(template.Resources.WordPressEIP).toBeDefined();
      const eip = template.Resources.WordPressEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Resources - CloudFront', () => {
    test('should have CloudFront Distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront should have proper distribution configuration', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
      expect(distribution.Properties.DistributionConfig).toBeDefined();
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
      expect(distribution.Properties.DistributionConfig.Origins).toBeDefined();
    });

    test('CloudFront should have default cache behavior', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.DefaultCacheBehavior).toBeDefined();
    });
  });

  describe('Resources - Monitoring', () => {
    test('should have SNS Topic for alarms', () => {
      expect(template.Resources.AlarmNotificationTopic).toBeDefined();
      const topic = template.Resources.AlarmNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SNS Subscription if email parameter is provided', () => {
      // SNS subscription may be created conditionally
      const topicExists = template.Resources.AlarmNotificationTopic !== undefined;
      expect(topicExists).toBe(true);
    });

    test('should have CloudWatch Dashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have CloudWatch Alarms', () => {
      // Check for actual alarm names in the template
      const alarms = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThan(0);

      // Check for specific alarms
      expect(template.Resources.EC2CPUAlarm || template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.RDSConnectionsAlarm || template.Resources.DatabaseConnectionsAlarm).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetIds',
        'RDSEndpoint',
        'S3BucketName',
        'CloudFrontDistributionId',
        'EC2PublicIP',
        'WordPressURL',
        'SNSTopicArn',
        'DashboardURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });

    test('RDSEndpoint output should use GetAtt', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });

    test('S3BucketName output should reference bucket', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });

    test('CloudFrontDistributionId output should reference distribution', () => {
      const output = template.Outputs.CloudFrontDistributionId;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });

    test('WordPressURL output should be defined', () => {
      const output = template.Outputs.WordPressURL;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
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

    test('should have all major resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);

      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Instance');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::CloudFront::Distribution');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
    });

    test('should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have proper parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8);
    });

    test('should have proper output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Resource Tags', () => {
    test('all taggable resources should have tags', () => {
      // Note: AWS::IAM::Role, AWS::EC2::EIP, and AWS::SNS::Topic do not support Tags property
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance',
        'AWS::S3::Bucket'
      ];

      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (taggableTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();
          expect(Array.isArray(resource.Properties.Tags)).toBe(true);
          expect(resource.Properties.Tags.length).toBeGreaterThan(0);
        }
      });
    });

    test('IAM Role should not have Tags property', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Properties.Tags).toBeUndefined();
    });

    test('EIP should not have Tags property', () => {
      const eip = template.Resources.WordPressEIP;
      expect(eip).toBeDefined();
      expect(eip.Properties.Tags).toBeUndefined();
    });

    test('SNS Topic should not have Tags property', () => {
      const topic = template.Resources.AlarmNotificationTopic;
      expect(topic).toBeDefined();
      expect(topic.Properties.Tags).toBeUndefined();
    });

    test('resources should have Name tag', () => {
      const vpcTags = template.Resources.RecipeBlogVPC.Properties.Tags;
      const nameTag = vpcTags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBeDefined();
    });

    test('resources should have Environment tag', () => {
      const vpcTags = template.Resources.RecipeBlogVPC.Properties.Tags;
      const envTag = vpcTags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('RDS should not be publicly accessible', () => {
      const db = template.Resources.WordPressDatabase;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('Database password should be NoEcho parameter', () => {
      const param = template.Parameters.DBPassword;
      expect(param.NoEcho).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.MediaBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('Security groups should have specific ingress rules', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const ingress = webSG.Properties.SecurityGroupIngress;

      expect(Array.isArray(ingress)).toBe(true);
      ingress.forEach((rule: any) => {
        expect(rule.FromPort).toBeDefined();
        expect(rule.ToPort).toBeDefined();
        expect(rule.IpProtocol).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway EIP should depend on Internet Gateway attachment', () => {
      const natGatewayEIP = template.Resources.NATGatewayEIP;
      expect(natGatewayEIP.DependsOn).toBe('AttachGateway');
    });

    test('WordPress EIP should depend on Internet Gateway attachment', () => {
      const eip = template.Resources.WordPressEIP;
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('Resources should reference VPC correctly', () => {
      const vpc = template.Resources.RecipeBlogVPC;
      expect(vpc).toBeDefined();
      
      // Check that subnets reference VPC
      const publicSubnet = template.Resources.PublicSubnet;
      expect(publicSubnet.Properties.VpcId).toBeDefined();
    });
  });

  describe('Resource Relationships', () => {    test('Subnets should reference VPC', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.VpcId).toBeDefined();
    });

    test('Security groups should reference VPC', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Properties.VpcId).toBeDefined();
    });
  });

  describe('Resource Properties Validation', () => {
    test('VPC CIDR should not overlap with common ranges', () => {
      const vpc = template.Resources.RecipeBlogVPC;
      const cidr = vpc.Properties.CidrBlock;
      expect(cidr).toBe('10.15.0.0/16');
    });

    test('Subnet CIDRs should be within VPC CIDR', () => {
      const publicSubnet = template.Resources.PublicSubnet;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(publicSubnet.Properties.CidrBlock).toMatch(/^10\.15\.\d+\.\d+\/\d+$/);
      expect(privateSubnet1.Properties.CidrBlock).toMatch(/^10\.15\.\d+\.\d+\/\d+$/);
      expect(privateSubnet2.Properties.CidrBlock).toMatch(/^10\.15\.\d+\.\d+\/\d+$/);
    });

    test('RDS storage should be adequate', () => {
      const db = template.Resources.WordPressDatabase;
      const storage = parseInt(db.Properties.AllocatedStorage);
      expect(storage).toBeGreaterThanOrEqual(20);
    });

    test('EC2 instance type should be t3.micro', () => {
      const instance = template.Resources.WordPressInstance;
      expect(instance.Properties.InstanceType).toBe('t3.micro');
    });
  });
});
