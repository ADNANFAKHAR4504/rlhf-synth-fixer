import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: Record<string, any>;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template
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
        'LocalStack Compatible - High Availability Web Application Infrastructure'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should validate CloudFormation template structure', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParams = ['ProjectName', 'Environment', 'AllowedCIDR'];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('TapStack');
      expect(param.Description).toBe('Project name for resource tagging');
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'production']);
      expect(param.Description).toBe('Environment type');
    });

    test('AllowedCIDR parameter should have correct properties', () => {
      const param = template.Parameters.AllowedCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('0.0.0.0/0');
      expect(param.Description).toBe(
        'CIDR block allowed to access the application'
      );
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets in two AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have private subnets in two AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
      expect(template.Resources.PrivateRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have public route to internet gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have web security group', () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for web tier');
    });

    test('should have app security group', () => {
      const sg = template.Resources.AppSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for application tier'
      );
    });

    test('should have data security group', () => {
      const sg = template.Resources.DataSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for data tier'
      );
    });

    test('web security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.WebSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have application IAM role', () => {
      const role = template.Resources.AppRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have instance profile', () => {
      const profile = template.Resources.AppInstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('AppRole should have correct assume role policy', () => {
      const role = template.Resources.AppRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');

      const principals = assumePolicy.Statement[0].Principal.Service;
      expect(principals).toContain('ec2.amazonaws.com');
      expect(principals).toContain('lambda.amazonaws.com');
    });

    test('AppRole should have required policies', () => {
      const role = template.Resources.AppRole;
      const policies = role.Properties.Policies;
      const policyNames = policies.map(
        (p: any) => p.PolicyName['Fn::Sub'] || p.PolicyName
      );

      expect(policyNames).toContain('${ProjectName}-S3Access-${Environment}');
      expect(policyNames).toContain(
        '${ProjectName}-DynamoDBAccess-${Environment}'
      );
      expect(policyNames).toContain('${ProjectName}-SNSAccess-${Environment}');
      expect(policyNames).toContain('${ProjectName}-LogsAccess-${Environment}');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket', () => {
      const bucket = template.Resources.AppBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.AppBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.AppBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have DynamoDB table', () => {
      const table = template.Resources.AppTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.DeletionPolicy).toBe('Delete');
    });

    test('DynamoDB table should have correct schema', () => {
      const table = template.Resources.AppTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('createdAt');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('DynamoDB table should use pay-per-request billing', () => {
      const table = template.Resources.AppTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('Messaging Resources', () => {
    test('should have SNS topic', () => {
      const topic = template.Resources.NotificationTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SQS queue', () => {
      const queue = template.Resources.ProcessingQueue;
      expect(queue).toBeDefined();
      expect(queue.Type).toBe('AWS::SQS::Queue');
    });

    test('SQS queue should have correct properties', () => {
      const queue = template.Resources.ProcessingQueue;
      expect(queue.Properties.VisibilityTimeout).toBe(300);
      expect(queue.Properties.MessageRetentionPeriod).toBe(345600);
    });
  });

  describe('Logging Resources', () => {
    test('should have CloudWatch log group', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have retention policy', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PublicSubnets',
        'PrivateSubnets',
        'WebSecurityGroupId',
        'AppSecurityGroupId',
        'AppRoleArn',
        'AppBucketName',
        'AppBucketArn',
        'AppTableName',
        'AppTableArn',
        'NotificationTopicArn',
        'LogGroupName',
        'ProcessingQueueUrl',
        'ProcessingQueueArn',
        'Region',
        'StackName',
        'Environment',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('AppBucketName output should be correct', () => {
      const output = template.Outputs.AppBucketName;
      expect(output.Description).toBe('Application S3 Bucket Name');
      expect(output.Value).toEqual({ Ref: 'AppBucket' });
    });

    test('AppTableArn output should be correct', () => {
      const output = template.Outputs.AppTableArn;
      expect(output.Description).toBe('Application DynamoDB Table ARN');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['AppTable', 'Arn'] });
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

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(21);
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(24);
    });
  });

  describe('High Availability Features', () => {
    test('should have multi-AZ deployment with two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('should have multi-AZ deployment with two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('subnets should be in different availability zones', () => {
      const subnet1Az =
        template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2Az =
        template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      // Check they reference different AZ indices
      expect(subnet1Az['Fn::Select'][0]).toBe(0);
      expect(subnet2Az['Fn::Select'][0]).toBe(1);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();

      const nameTag = tags.find((tag: { Key: string }) => tag.Key === 'Name');
      const projectTag = tags.find(
        (tag: { Key: string }) => tag.Key === 'Project'
      );
      const envTag = tags.find(
        (tag: { Key: string }) => tag.Key === 'Environment'
      );

      expect(nameTag).toBeDefined();
      expect(projectTag).toBeDefined();
      expect(envTag).toBeDefined();
    });

    test('S3 bucket should have proper tags', () => {
      const bucket = template.Resources.AppBucket;
      const tags = bucket.Properties.Tags;
      expect(tags).toBeDefined();

      const tagKeys = tags.map((tag: { Key: string }) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Environment');
    });

    test('DynamoDB table should have proper tags', () => {
      const table = template.Resources.AppTable;
      const tags = table.Properties.Tags;
      expect(tags).toBeDefined();

      const tagKeys = tags.map((tag: { Key: string }) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Environment');
    });
  });

  describe('LocalStack Compatibility', () => {
    test('should not contain unsupported LocalStack resources', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );

      // These resources are not well supported in LocalStack Community
      const unsupportedTypes = [
        'AWS::RDS::DBInstance',
        'AWS::EC2::NatGateway',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::AutoScaling::LaunchConfiguration',
        'AWS::EC2::LaunchTemplate',
        'AWS::KMS::Key',
        'AWS::SecretsManager::Secret',
        'AWS::CloudWatch::Alarm',
      ];

      unsupportedTypes.forEach(unsupportedType => {
        expect(resourceTypes).not.toContain(unsupportedType);
      });
    });

    test('should only contain LocalStack-compatible resources', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );

      const supportedTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::S3::Bucket',
        'AWS::DynamoDB::Table',
        'AWS::SNS::Topic',
        'AWS::SQS::Queue',
        'AWS::Logs::LogGroup',
      ];

      resourceTypes.forEach(resourceType => {
        expect(supportedTypes).toContain(resourceType);
      });
    });
  });
});
