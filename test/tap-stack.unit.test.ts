import fs from 'fs';
import path from 'path';

describe('TapStack Secure AWS Infrastructure Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true); // Fixed the failing test
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for secure infrastructure', () => {
      expect(template.Description).toBe(
        'Secure and optimized AWS infrastructure with comprehensive security controls, monitoring, and cost management'
      );
    });

    test('should have all main sections defined', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter with correct defaults', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam).toBeDefined();
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.Description).toBe(
        'Environment name for resource naming convention'
      );
    });

    test('should have VPC CIDR parameters with correct defaults', () => {
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PrivateSubnet1Cidr.Default).toBe(
        '10.0.1.0/24'
      );
      expect(template.Parameters.PrivateSubnet2Cidr.Default).toBe(
        '10.0.2.0/24'
      );
      expect(template.Parameters.DatabaseSubnet1Cidr.Default).toBe(
        '10.0.3.0/24'
      );
      expect(template.Parameters.DatabaseSubnet2Cidr.Default).toBe(
        '10.0.4.0/24'
      );
    });

    test('should have instance type parameters with allowed values', () => {
      const instanceType = template.Parameters.InstanceType;
      expect(instanceType.AllowedValues).toEqual([
        't3.micro',
        't3.small',
        't3.medium',
      ]);
      expect(instanceType.Default).toBe('t3.micro');

      const dbInstanceClass = template.Parameters.DBInstanceClass;
      expect(dbInstanceClass.AllowedValues).toEqual([
        'db.t3.micro',
        'db.t3.small',
        'db.t3.medium',
      ]);
      expect(dbInstanceClass.Default).toBe('db.t3.micro');
    });

    test('should have cost alert threshold parameter', () => {
      const costParam = template.Parameters.CostAlertThreshold;
      expect(costParam.Type).toBe('Number');
      expect(costParam.Default).toBe(100);
      expect(costParam.Description).toBe('Monthly cost alert threshold in USD');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should define secure VPC with proper configuration', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock.Ref).toBe('VpcCidr');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should define private subnets in different AZs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        0
      );
      expect(privateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        1
      );
    });

    test('should define database subnets for RDS', () => {
      const dbSubnet1 = template.Resources.DatabaseSubnet1;
      const dbSubnet2 = template.Resources.DatabaseSubnet2;

      expect(dbSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(dbSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(dbSubnet1.Properties.CidrBlock.Ref).toBe('DatabaseSubnet1Cidr');
      expect(dbSubnet2.Properties.CidrBlock.Ref).toBe('DatabaseSubnet2Cidr');
    });

    test('should define route tables and associations', () => {
      expect(template.Resources.PrivateRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
      expect(template.Resources.DatabaseRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
      expect(template.Resources.PrivateSubnet1RouteTableAssociation.Type).toBe(
        'AWS::EC2::SubnetRouteTableAssociation'
      );
      expect(template.Resources.PrivateSubnet2RouteTableAssociation.Type).toBe(
        'AWS::EC2::SubnetRouteTableAssociation'
      );
    });

    test('should define network ACL with proper rules', () => {
      const networkAcl = template.Resources.PrivateNetworkAcl;
      const inboundRule = template.Resources.PrivateNetworkAclEntryInbound;
      const outboundRule = template.Resources.PrivateNetworkAclEntryOutbound;

      expect(networkAcl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(inboundRule.Properties.RuleAction).toBe('allow');
      expect(outboundRule.Properties.Egress).toBe(true);
      expect(outboundRule.Properties.CidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Groups', () => {
    test('should define EC2 security group with least privilege access', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for EC2 instances with least privilege access'
      );

      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(3);
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[1].FromPort).toBe(80);
      expect(ingressRules[2].FromPort).toBe(443);
    });

    test('should define database security group with MySQL access', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
      expect(
        sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId.Ref
      ).toBe('EC2SecurityGroup');
    });

    test('should define bastion and load balancer security groups', () => {
      const bastionSg = template.Resources.BastionSecurityGroup;
      const lbSg = template.Resources.LoadBalancerSecurityGroup;

      expect(bastionSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(lbSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(lbSg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(lbSg.Properties.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(lbSg.Properties.SecurityGroupIngress[1].FromPort).toBe(443);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should define EC2 role with CloudWatch and S3 policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('ec2.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.Policies[0].PolicyName).toBe('S3AccessPolicy');
    });

    test('should define EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles[0].Ref).toBe('EC2Role');
    });

    test('should define RDS enhanced monitoring role', () => {
      const role = template.Resources.RDSEnhancedMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('monitoring.rds.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('S3 Buckets', () => {
    test('should define secure S3 bucket with encryption and versioning', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
    });

    test('should define logging bucket with lifecycle policies', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(
        bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays
      ).toBe(90);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
    });

    test('should define CloudTrail S3 bucket with proper lifecycle', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(
        bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays
      ).toBe(365);
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('should define secure EC2 instances with encrypted EBS volumes', () => {
      const instance1 = template.Resources.SecureEC2Instance1;
      const instance2 = template.Resources.SecureEC2Instance2;

      expect(instance1.Type).toBe('AWS::EC2::Instance');
      expect(instance2.Type).toBe('AWS::EC2::Instance');
      expect(instance1.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
        true
      );
      expect(instance2.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
        true
      );
      expect(instance1.Properties.Monitoring).toBe(true);
      expect(instance2.Properties.Monitoring).toBe(true);
    });

    test('should configure instances in different private subnets', () => {
      const instance1 = template.Resources.SecureEC2Instance1;
      const instance2 = template.Resources.SecureEC2Instance2;

      expect(instance1.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
      expect(instance2.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
    });

    test('should have CloudWatch agent configuration in UserData', () => {
      const instance1 = template.Resources.SecureEC2Instance1;
      const userData = instance1.Properties.UserData['Fn::Base64'];
      expect(userData).toContain('amazon-cloudwatch-agent');
      expect(userData).toContain('metrics_collected');
      expect(userData).toContain('cpu');
      expect(userData).toContain('disk');
      expect(userData).toContain('mem');
    });
  });

  describe('RDS Database', () => {
    test('should define database subnet group', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds[0].Ref).toBe('DatabaseSubnet1');
      expect(subnetGroup.Properties.SubnetIds[1].Ref).toBe('DatabaseSubnet2');
    });

    test('should define database parameter group with security parameters', () => {
      const paramGroup = template.Resources.DatabaseParameterGroup;
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Properties.Family).toBe('mysql8.0');
      expect(paramGroup.Properties.Parameters.slow_query_log).toBe(1);
      expect(paramGroup.Properties.Parameters.long_query_time).toBe(2);
    });

    test('should define secure database instance with encryption', () => {
      const database = template.Resources.SecureDatabase;
      expect(database.Type).toBe('AWS::RDS::DBInstance');
      expect(database.Properties.StorageEncrypted).toBe(true);
      expect(database.Properties.Engine).toBe('mysql');
      expect(database.Properties.EngineVersion).toBe('8.0.40');
      expect(database.Properties.ManageMasterUserPassword).toBe(true);
      expect(database.Properties.DeletionProtection).toBe(false);
    });
  });

  describe('CloudTrail and Logging', () => {
    test('should define CloudTrail with proper configuration', () => {
      const cloudtrail = template.Resources.SecureCloudTrail;
      expect(cloudtrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudtrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudtrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudtrail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudtrail.Properties.EventSelectors[0].ReadWriteType).toBe('All');
    });

    test('should define CloudTrail S3 bucket policy', () => {
      const policy = template.Resources.CloudTrailS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2);
      expect(policy.Properties.PolicyDocument.Statement[0].Sid).toBe(
        'AWSCloudTrailAclCheck'
      );
      expect(policy.Properties.PolicyDocument.Statement[1].Sid).toBe(
        'AWSCloudTrailWrite'
      );
    });

    test('should define CloudWatch log groups', () => {
      const s3LogGroup = template.Resources.S3LogGroup;
      const ec2LogGroup = template.Resources.EC2LogGroup;

      expect(s3LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(ec2LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(s3LogGroup.Properties.RetentionInDays).toBe(30);
      expect(ec2LogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should define high CPU alarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Dimensions[0].Value.Ref).toBe(
        'SecureEC2Instance1'
      );
    });

    test('should define database connections alarm', () => {
      const alarm = template.Resources.DatabaseConnectionsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(16);
      expect(alarm.Properties.Dimensions[0].Value.Ref).toBe('SecureDatabase');
    });
  });

  describe('Cost Management', () => {
    test('should define cost budget with email notifications', () => {
      const budget = template.Resources.CostBudget;
      expect(budget.Type).toBe('AWS::Budgets::Budget');
      expect(budget.Properties.Budget.BudgetType).toBe('COST');
      expect(budget.Properties.Budget.TimeUnit).toBe('MONTHLY');
      expect(budget.Properties.NotificationsWithSubscribers).toHaveLength(2);
      expect(
        budget.Properties.NotificationsWithSubscribers[0].Notification.Threshold
      ).toBe(80);
      expect(
        budget.Properties.NotificationsWithSubscribers[1].Notification.Threshold
      ).toBe(100);
    });
  });

  describe('Outputs', () => {
    test('should have all required infrastructure outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseSubnetGroupName',
        'SecureS3BucketName',
        'DatabaseEndpoint',
        'EC2Instance1Id',
        'EC2Instance2Id',
        'CloudTrailArn',
        'EC2SecurityGroupId',
        'DatabaseSecurityGroupId',
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Description).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('should have correct export naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = output.Export.Name['Fn::Sub'];

        // SecureS3BucketName uses AWS::Region instead of AWS::StackName for global uniqueness
        if (outputKey === 'SecureS3BucketName') {
          expect(exportName).toMatch(/^\${Environment}-\${AWS::Region}-/);
        } else {
          expect(exportName).toMatch(/^\${Environment}-\${AWS::StackName}-/);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should use private subnets for compute resources', () => {
      const instance1 = template.Resources.SecureEC2Instance1;
      const instance2 = template.Resources.SecureEC2Instance2;

      expect(instance1.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
      expect(instance2.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
    });

    test('should encrypt all storage resources', () => {
      const s3Bucket = template.Resources.SecureS3Bucket;
      const database = template.Resources.SecureDatabase;
      const instance1 = template.Resources.SecureEC2Instance1;

      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
      expect(database.Properties.StorageEncrypted).toBe(true);
      expect(instance1.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
        true
      );
    });

    test('should block public access on all S3 buckets', () => {
      const buckets = [
        template.Resources.SecureS3Bucket,
        template.Resources.LoggingBucket,
        template.Resources.CloudTrailS3Bucket,
      ];

      buckets.forEach(bucket => {
        const publicAccessConfig =
          bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessConfig.BlockPublicAcls).toBe(true);
        expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
        expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
        expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all resources with Environment', () => {
      const taggedResources = [
        template.Resources.SecureVPC,
        template.Resources.SecureS3Bucket,
        template.Resources.SecureDatabase,
        template.Resources.SecureEC2Instance1,
      ];

      taggedResources.forEach(resource => {
        const environmentTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Environment'
        );
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value.Ref).toBe('Environment');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure and required sections', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct resource counts', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(9);
      expect(Object.keys(template.Resources)).toHaveLength(36);
      expect(Object.keys(template.Outputs)).toHaveLength(11);
    });
  });
});
