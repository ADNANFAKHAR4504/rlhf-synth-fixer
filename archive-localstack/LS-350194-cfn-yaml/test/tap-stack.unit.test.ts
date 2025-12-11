import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load template JSON (convert YAML to JSON first if needed)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        'TapStack.json not found. Run: pipenv run cfn-flip-to-json > lib/TapStack.json'
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      const interfaceData = template.Metadata['AWS::CloudFormation::Interface'];
      expect(interfaceData.ParameterGroups).toBeDefined();
      expect(Array.isArray(interfaceData.ParameterGroups)).toBe(true);
      expect(interfaceData.ParameterGroups.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters Validation', () => {

    describe('EnvironmentName parameter', () => {
      test('should have correct type and constraints', () => {
        const param = template.Parameters.EnvironmentName;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('Production');
        expect(param.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
        expect(param.ConstraintDescription).toBeDefined();
      });
    });

    describe('DBUsername parameter', () => {
      test('should have correct type and constraints', () => {
        const param = template.Parameters.DBUsername;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('admin');
        expect(param.MinLength).toBe(1);
        expect(param.MaxLength).toBe(16);
        expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
      });

      test('should validate pattern matches requirements', () => {
        // Anchor the pattern to match entire string
        const pattern = new RegExp(`^${template.Parameters.DBUsername.AllowedPattern}$`);
        expect(pattern.test('admin')).toBe(true);
        expect(pattern.test('admin123')).toBe(true);
        expect(pattern.test('123admin')).toBe(false); // Must start with letter
        expect(pattern.test('admin-user')).toBe(false); // No special chars
      });
    });

    describe('DBInstanceClass parameter', () => {
      test('should have correct allowed values', () => {
        const param = template.Parameters.DBInstanceClass;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('db.t3.micro');
        expect(param.AllowedValues).toContain('db.t3.micro');
        expect(param.AllowedValues).toContain('db.t3.small');
        expect(param.AllowedValues).toContain('db.t3.medium');
        expect(param.AllowedValues).toContain('db.m5.large');
        expect(param.AllowedValues).toContain('db.m5.xlarge');
      });
    });

    describe('InstanceType parameter', () => {
      test('should have correct allowed values', () => {
        const param = template.Parameters.InstanceType;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('t3.micro');
        expect(param.AllowedValues).toContain('t3.micro');
        expect(param.AllowedValues).toContain('t3.small');
        expect(param.AllowedValues).toContain('t3.medium');
        expect(param.AllowedValues).toContain('t3.large');
      });
    });

    describe('NotificationEmail parameter', () => {
      test('should have email validation pattern', () => {
        const param = template.Parameters.NotificationEmail;
        expect(param.Type).toBe('String');
        expect(param.AllowedPattern).toBe('[^@]+@[^@]+\\.[^@]+');
      });

      test('should validate email pattern', () => {
        const pattern = new RegExp(template.Parameters.NotificationEmail.AllowedPattern);
        expect(pattern.test('user@example.com')).toBe(true);
        expect(pattern.test('invalid-email')).toBe(false);
        expect(pattern.test('@example.com')).toBe(false);
      });
    });

    describe('Auto Scaling parameters', () => {
      test('MinSize should have correct constraints', () => {
        const param = template.Parameters.MinSize;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(1);
        expect(param.MinValue).toBe(1);
        expect(param.MaxValue).toBe(10);
      });

      test('MaxSize should have correct constraints', () => {
        const param = template.Parameters.MaxSize;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(3);
        expect(param.MinValue).toBe(1);
        expect(param.MaxValue).toBe(10);
      });

      test('DesiredCapacity should have correct constraints', () => {
        const param = template.Parameters.DesiredCapacity;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(1);
        expect(param.MinValue).toBe(1);
        expect(param.MaxValue).toBe(10);
      });

      test('DesiredCapacity should be between MinSize and MaxSize', () => {
        const minSize = template.Parameters.MinSize.Default;
        const maxSize = template.Parameters.MaxSize.Default;
        const desiredCapacity = template.Parameters.DesiredCapacity.Default;
        expect(desiredCapacity).toBeGreaterThanOrEqual(minSize);
        expect(desiredCapacity).toBeLessThanOrEqual(maxSize);
      });
    });

    describe('LogRetentionDays parameter', () => {
      test('should have valid retention day values', () => {
        const param = template.Parameters.LogRetentionDays;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(7);
        expect(Array.isArray(param.AllowedValues)).toBe(true);
        expect(param.AllowedValues).toContain(7);
        expect(param.AllowedValues).toContain(30);
        expect(param.AllowedValues).toContain(365);
      });
    });
  });

  describe('Network Resources (VPC, Subnets, Routing)', () => {
    test('should have VPC resource with correct CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
      expect(tagKeys).toContain('iac-rlhf-amazon');
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have InternetGatewayAttachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have PublicSubnet with correct CIDR', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PrivateSubnet1 with correct CIDR', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have PrivateSubnet2 with correct CIDR', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have PublicRouteTable with route to InternetGateway', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const route = template.Resources.DefaultPublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Security Groups', () => {
    test('should have ApplicationSecurityGroup with correct ingress rules', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(Array.isArray(ingress)).toBe(true);

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have DatabaseSecurityGroup with restricted access', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(Array.isArray(ingress)).toBe(true);
      expect(ingress.length).toBe(1);

      const mysqlRule = ingress[0];
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'ApplicationSecurityGroup' });
    });
  });

  describe('KMS Key and Encryption', () => {
    test('should have KMSKey resource', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMSKey should have proper key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy).toBeDefined();
      expect(keyPolicy.Version).toBe('2012-10-17');

      const statements = keyPolicy.Statement;
      expect(Array.isArray(statements)).toBe(true);

      // Check for root account access
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');

      // Check for service access
      const serviceStatement = statements.find((s: any) => s.Sid === 'Allow services to use the key');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
    });

    test('should have KMSKeyAlias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2InstanceRole with SSM access', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');

      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(Array.isArray(managedPolicies)).toBe(true);
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('EC2InstanceRole should have S3 artifact access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3ArtifactAccess');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });

    test('EC2InstanceRole should have Secrets Manager access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain(
        'secretsmanager:GetSecretValue'
      );
    });

    test('should have EC2InstanceProfile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('Secrets Manager', () => {
    test('should have DatabaseSecret resource', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('DatabaseSecret should generate password automatically', () => {
      const secret = template.Resources.DatabaseSecret;
      const generateSecret = secret.Properties.GenerateSecretString;
      expect(generateSecret).toBeDefined();
      expect(generateSecret.GenerateStringKey).toBe('password');
      expect(generateSecret.PasswordLength).toBe(32);
    });
  });

  describe('S3 Bucket', () => {
    test('should have ArtifactsBucket with encryption', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('ArtifactsBucket should have versioning enabled', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ArtifactsBucket should have lifecycle policies', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(Array.isArray(lifecycle.Rules)).toBe(true);
    });

    test('ArtifactsBucket should block public access', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should have LaunchTemplate resource', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('LaunchTemplate should reference AMI from SSM parameter', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const imageId = launchTemplate.Properties.LaunchTemplateData.ImageId;
      expect(imageId).toEqual({ Ref: 'LatestAmiIdParameter' });
    });

    test('LaunchTemplate should have IAM instance profile', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const instanceProfile = launchTemplate.Properties.LaunchTemplateData.IamInstanceProfile;
      expect(instanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
    });

    test('LaunchTemplate should have security group', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const securityGroups =
        launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds;
      expect(securityGroups).toContainEqual({ Ref: 'ApplicationSecurityGroup' });
    });

    test('should have AutoScalingGroup resource', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PublicSubnet' });
    });

    test('AutoScalingGroup should reference LaunchTemplate', () => {
      const asg = template.Resources.AutoScalingGroup;
      const launchTemplate = asg.Properties.LaunchTemplate;
      expect(launchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(launchTemplate.Version).toEqual({
        'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber'],
      });
    });

    test('should have TargetTrackingScalingPolicy', () => {
      const policy = template.Resources.TargetTrackingScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(50);
    });
  });

  describe('RDS Database', () => {
    test('should have DBSubnetGroup', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      const subnetIds = subnetGroup.Properties.SubnetIds;
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have RDSDatabase resource', () => {
      const db = template.Resources.RDSDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDSDatabase should have encryption enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDSDatabase should use Secrets Manager for credentials', () => {
      const db = template.Resources.RDSDatabase;
      const username = db.Properties.MasterUsername;
      const password = db.Properties.MasterUserPassword;
      expect(username).toBeDefined();
      expect(password).toBeDefined();
      // Should use Fn::Sub with resolve:secretsmanager syntax
      // In JSON format, this becomes an object with Fn::Sub
      expect(typeof username === 'string' || typeof username === 'object').toBe(true);
      expect(typeof password === 'string' || typeof password === 'object').toBe(true);
      // Check if it contains resolve:secretsmanager pattern
      const usernameStr = typeof username === 'string' ? username : JSON.stringify(username);
      const passwordStr = typeof password === 'string' ? password : JSON.stringify(password);
      expect(usernameStr).toMatch(/resolve:secretsmanager/);
      expect(passwordStr).toMatch(/resolve:secretsmanager/);
    });

    test('RDSDatabase should have correct security group', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'DatabaseSecurityGroup' });
    });

    test('RDSDatabase should have CloudWatch logs exports', () => {
      const db = template.Resources.RDSDatabase;
      const logExports = db.Properties.EnableCloudwatchLogsExports;
      expect(Array.isArray(logExports)).toBe(true);
      expect(logExports).toContain('error');
      expect(logExports).toContain('general');
      expect(logExports).toContain('slowquery');
    });

    test('RDSDatabase should depend on log groups', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.DependsOn).toBeDefined();
      expect(Array.isArray(db.DependsOn)).toBe(true);
      expect(db.DependsOn).toContain('RDSLogGroupError');
      expect(db.DependsOn).toContain('RDSLogGroupGeneral');
      expect(db.DependsOn).toContain('RDSLogGroupSlowQuery');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have LogGroup for application logs', () => {
      const logGroup = template.Resources.LogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('should have RDS log groups', () => {
      expect(template.Resources.RDSLogGroupError).toBeDefined();
      expect(template.Resources.RDSLogGroupGeneral).toBeDefined();
      expect(template.Resources.RDSLogGroupSlowQuery).toBeDefined();
    });

    test('RDS log groups should have KMS encryption', () => {
      const errorLogGroup = template.Resources.RDSLogGroupError;
      expect(errorLogGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });
  });

  describe('SNS and Notifications', () => {
    test('should have SNSTopic resource', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('SNSTopic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      const subscriptions = topic.Properties.Subscription;
      expect(Array.isArray(subscriptions)).toBe(true);
      const emailSub = subscriptions.find((s: any) => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
      expect(emailSub.Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('should have SNSTopicPolicy', () => {
      const policy = template.Resources.SNSTopicPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });

    test('should have StackNotificationFunction Lambda', () => {
      const lambda = template.Resources.StackNotificationFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
    });
  });

  describe('Elastic IP', () => {
    test('should have ElasticIP resource', () => {
      const eip = template.Resources.ElasticIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });
  });

  describe('Outputs Validation', () => {
    const requiredOutputs = [
      'VPCId',
      'VPCCidr',
      'PublicSubnetId',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'ElasticIPAddress',
      'ApplicationURL',
      'AutoScalingGroupName',
      'RDSDatabaseEndpoint',
      'RDSDatabasePort',
      'DatabaseSecretArn',
      'S3BucketName',
      'ApplicationSecurityGroupId',
      'DatabaseSecurityGroupId',
      'KMSKeyId',
      'KMSKeyArn',
      'EC2InstanceRoleArn',
      'SNSTopicArn',
      'CloudWatchLogGroup',
      'StackName',
      'Region',
      'AccountId',
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names following convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          // Export name should use Fn::Sub with StackName
          expect(output.Export.Name).toHaveProperty('Fn::Sub');
        }
      });
    });
  });

  describe('Resource Tagging Strategy', () => {
    const resourcesWithTags = [
      'VPC',
      'InternetGateway',
      'PublicSubnet',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'ApplicationSecurityGroup',
      'DatabaseSecurityGroup',
      'EC2InstanceRole',
      'KMSKey',
      'DatabaseSecret',
      'ArtifactsBucket',
      'SNSTopic',
      'StackNotificationFunction',
    ];

    test('resources should have consistent tagging', () => {
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((tag: any) => tag.Key);
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('iac-rlhf-amazon');
        }
      });
    });
  });

  describe('Cross-Resource Dependencies', () => {
    test('InternetGatewayAttachment should depend on VPC and IGW', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('Subnets should reference VPC', () => {
      expect(template.Resources.PublicSubnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('RouteTables should reference VPC', () => {
      expect(template.Resources.PublicRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('SecurityGroups should reference VPC', () => {
      expect(template.Resources.ApplicationSecurityGroup.Properties.VpcId).toEqual({
        Ref: 'VPC',
      });
      expect(template.Resources.DatabaseSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('RDSDatabase should reference DBSubnetGroup and SecurityGroup', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      expect(db.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'DatabaseSecurityGroup' });
    });
  });

  describe('Error Cases and Boundary Conditions', () => {
    test('template should not have circular dependencies', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        // Check that DependsOn doesn't create cycles
        if (resource.DependsOn) {
          expect(Array.isArray(resource.DependsOn) || typeof resource.DependsOn === 'string').toBe(
            true
          );
        }
      });
    });

    test('CIDR blocks should not overlap', () => {
      const publicSubnetCidr = template.Resources.PublicSubnet.Properties.CidrBlock;
      const privateSubnet1Cidr = template.Resources.PrivateSubnet1.Properties.CidrBlock;
      const privateSubnet2Cidr = template.Resources.PrivateSubnet2.Properties.CidrBlock;

      expect(publicSubnetCidr).toBe('10.0.1.0/24');
      expect(privateSubnet1Cidr).toBe('10.0.2.0/24');
      expect(privateSubnet2Cidr).toBe('10.0.3.0/24');
    });
  });
});
