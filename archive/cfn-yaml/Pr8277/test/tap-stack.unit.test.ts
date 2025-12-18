import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - EC2 Backup Solution', () => {
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

    test('should have a description for automated backup solution', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Automated daily backup solution');
      expect(template.Description).toContain('EventBridge');
      expect(template.Description).toContain('Lambda');
      expect(template.Description).toContain('SSM');
      expect(template.Description).toContain('S3');
    });
  });

  describe('Parameters', () => {
    test('should have BackupSchedule parameter', () => {
      expect(template.Parameters.BackupSchedule).toBeDefined();
      const param = template.Parameters.BackupSchedule;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('cron(0 2 * * ? *)');
      expect(param.Description).toContain('Backup schedule in cron format');
    });

    test('should have ApplicationDataPath parameter', () => {
      expect(template.Parameters.ApplicationDataPath).toBeDefined();
      const param = template.Parameters.ApplicationDataPath;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('/var/www/html');
      expect(param.Description).toContain('Path to application data to backup');
    });

    test('should have VPC and networking parameters', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.PublicSubnetCidr).toBeDefined();
      expect(template.Parameters.PrivateSubnetCidr).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
    });

    test('InstanceType parameter should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
      expect(param.Default).toBe('t3.micro');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have BackupVPC resource', () => {
      expect(template.Resources.BackupVPC).toBeDefined();
      const vpc = template.Resources.BackupVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();
      
      const publicSubnet = template.Resources.PublicSubnet;
      const privateSubnet = template.Resources.PrivateSubnet;
      
      expect(publicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have internet gateway and NAT gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      
      const igw = template.Resources.InternetGateway;
      const natGw = template.Resources.NATGateway;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables configured correctly', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
      
      const publicRoute = template.Resources.PublicRoute;
      const privateRoute = template.Resources.PrivateRoute;
      
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have security group for web server', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toEqual([
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '0.0.0.0/0',
          Description: 'HTTPS traffic from internet'
        }
      ]);
    });
  });

  describe('S3 Resources', () => {
    test('should have BackupBucket resource', () => {
      expect(template.Resources.BackupBucket).toBeDefined();
      const bucket = template.Resources.BackupBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('BackupBucket should have encryption enabled', () => {
      const bucket = template.Resources.BackupBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
    });

    test('BackupBucket should have public access blocked', () => {
      const bucket = template.Resources.BackupBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('BackupBucket should have versioning and lifecycle configuration', () => {
      const bucket = template.Resources.BackupBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
    });

    test('should have AccessLogsBucket resource', () => {
      expect(template.Resources.AccessLogsBucket).toBeDefined();
      const accessLogsBucket = template.Resources.AccessLogsBucket;
      expect(accessLogsBucket.Type).toBe('AWS::S3::Bucket');
      expect(accessLogsBucket.Properties.BucketEncryption).toBeDefined();
      expect(accessLogsBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have BackupLambdaRole resource', () => {
      expect(template.Resources.BackupLambdaRole).toBeDefined();
      const role = template.Resources.BackupLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('BackupLambdaRole should have correct managed policies', () => {
      const role = template.Resources.BackupLambdaRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('BackupLambdaRole should have SSM permissions', () => {
      const role = template.Resources.BackupLambdaRole;
      const ssmPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SSMSendCommandPolicy');
      expect(ssmPolicy).toBeDefined();
      
      const statements = ssmPolicy.PolicyDocument.Statement;
      const describeStatement = statements.find((s: any) => s.Action.includes('ssm:DescribeInstanceInformation'));
      const commandStatement = statements.find((s: any) => s.Action.includes('ssm:SendCommand'));
      
      expect(describeStatement).toBeDefined();
      expect(describeStatement.Resource).toBe('*');
      expect(commandStatement).toBeDefined();
      expect(commandStatement.Condition.StringEquals['ssm:ResourceTag/BackupEnabled']).toBe('true');
    });

    test('should have EC2BackupRole resource', () => {
      expect(template.Resources.EC2BackupRole).toBeDefined();
      const role = template.Resources.EC2BackupRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2BackupRole should have SSM managed policy', () => {
      const role = template.Resources.EC2BackupRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2BackupRole should have S3 backup permissions', () => {
      const role = template.Resources.EC2BackupRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3BackupPolicy');
      expect(s3Policy).toBeDefined();
      
      const statements = s3Policy.PolicyDocument.Statement;
      const putObjectStatement = statements.find((s: any) => s.Action.includes('s3:PutObject'));
      const listBucketStatement = statements.find((s: any) => s.Action.includes('s3:ListBucket'));
      
      expect(putObjectStatement).toBeDefined();
      expect(listBucketStatement).toBeDefined();
    });

    test('should have EC2BackupInstanceProfile resource', () => {
      expect(template.Resources.EC2BackupInstanceProfile).toBeDefined();
      const profile = template.Resources.EC2BackupInstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2BackupRole' }]);
    });
  });

  describe('EC2 Resources', () => {
    test('should have WebServerInstance resource', () => {
      expect(template.Resources.WebServerInstance).toBeDefined();
      const instance = template.Resources.WebServerInstance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2BackupInstanceProfile' });
    });

    test('WebServerInstance should have backup tag', () => {
      const instance = template.Resources.WebServerInstance;
      const backupTag = instance.Properties.Tags.find((tag: any) => tag.Key === 'BackupEnabled');
      expect(backupTag).toBeDefined();
      expect(backupTag.Value).toBe('true');
    });

    test('WebServerInstance should have correct user data', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.UserData).toBeDefined();
      expect(instance.Properties.UserData['Fn::Base64']).toBeDefined();
    });
  });

  describe('Lambda Resources', () => {
    test('should have BackupLambdaFunction resource', () => {
      expect(template.Resources.BackupLambdaFunction).toBeDefined();
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('BackupLambdaFunction should have correct environment variables', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.INSTANCE_ID).toEqual({ Ref: 'WebServerInstance' });
      expect(envVars.BUCKET_NAME).toEqual({ Ref: 'BackupBucket' });
      expect(envVars.DATA_PATH).toEqual({ Ref: 'ApplicationDataPath' });
    });

    test('BackupLambdaFunction should have inline code', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('ssm_client');
      expect(lambda.Properties.Code.ZipFile).toContain('send_command');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have BackupScheduleRule resource', () => {
      expect(template.Resources.BackupScheduleRule).toBeDefined();
      const rule = template.Resources.BackupScheduleRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toEqual({ Ref: 'BackupSchedule' });
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('BackupScheduleRule should target Lambda function', () => {
      const rule = template.Resources.BackupScheduleRule;
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn).toEqual({ 'Fn::GetAtt': ['BackupLambdaFunction', 'Arn'] });
      expect(rule.Properties.Targets[0].Id).toBe('BackupLambdaTarget');
    });

    test('should have LambdaInvokePermission resource', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have BackupLogGroup resource', () => {
      expect(template.Resources.BackupLogGroup).toBeDefined();
      const logGroup = template.Resources.BackupLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('BackupLogGroup should have correct name pattern', () => {
      const logGroup = template.Resources.BackupLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/backup/${AWS::StackName}' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'BackupBucketName',
        'BackupBucketArn',
        'LambdaFunctionArn',
        'BackupSchedule',
        'LogGroupName',
        'WebServerInstanceId',
        'VPCId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('BackupBucketName output should be correct', () => {
      const output = template.Outputs.BackupBucketName;
      expect(output.Description).toContain('S3 bucket storing backups');
      expect(output.Value).toEqual({ Ref: 'BackupBucket' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-backup-bucket' });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toContain('backup orchestration Lambda function');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['BackupLambdaFunction', 'Arn'] });
    });

    test('WebServerInstanceId output should be correct', () => {
      const output = template.Outputs.WebServerInstanceId;
      expect(output.Description).toContain('Instance ID of the web server');
      expect(output.Value).toEqual({ Ref: 'WebServerInstance' });
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const s3Resources = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );

      s3Resources.forEach(resourceKey => {
        const bucket = template.Resources[resourceKey];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('all S3 buckets should have public access blocked', () => {
      const s3Resources = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );

      s3Resources.forEach(resourceKey => {
        const bucket = template.Resources[resourceKey];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('IAM roles should follow principle of least privilege', () => {
      const lambdaRole = template.Resources.BackupLambdaRole;
      const ec2Role = template.Resources.EC2BackupRole;

      // Lambda role should only have necessary SSM and CloudWatch permissions
      const lambdaSsmPolicy = lambdaRole.Properties.Policies.find((p: any) => p.PolicyName === 'SSMSendCommandPolicy');
      expect(lambdaSsmPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action.includes('ssm:SendCommand') && s.Condition
      )).toBeDefined();

      // EC2 role should only have S3 backup permissions
      const ec2S3Policy = ec2Role.Properties.Policies.find((p: any) => p.PolicyName === 'S3BackupPolicy');
      expect(ec2S3Policy).toBeDefined();
      expect(ec2S3Policy.PolicyDocument.Statement.find((s: any) => 
        s.Action.includes('s3:PutObject')
      )).toBeDefined();
    });

    test('security group should only allow HTTPS traffic', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(443);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(443);
      expect(sg.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
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

    test('all resource types should be valid AWS CloudFormation types', () => {
      const validResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance',
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::Lambda::Function',
        'AWS::Lambda::Permission',
        'AWS::Events::Rule',
        'AWS::Logs::LogGroup'
      ];

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(validResourceTypes).toContain(resource.Type);
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda function should depend on IAM role', () => {
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['BackupLambdaRole', 'Arn'] });
    });

    test('EC2 instance should depend on instance profile', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2BackupInstanceProfile' });
    });

    test('EventBridge rule should target Lambda function', () => {
      const rule = template.Resources.BackupScheduleRule;
      expect(rule.Properties.Targets[0].Arn).toEqual({ 'Fn::GetAtt': ['BackupLambdaFunction', 'Arn'] });
    });

    test('NAT Gateway should depend on EIP', () => {
      const natGw = template.Resources.NATGateway;
      expect(natGw.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'] });
    });
  });

  describe('Event-Driven Architecture Validation', () => {
    test('should implement EventBridge -> Lambda -> SSM -> EC2 -> S3 flow', () => {
      // EventBridge Rule exists and targets Lambda
      const rule = template.Resources.BackupScheduleRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.Targets[0].Arn).toEqual({ 'Fn::GetAtt': ['BackupLambdaFunction', 'Arn'] });

      // Lambda function exists with SSM permissions
      const lambda = template.Resources.BackupLambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      
      // Lambda role has SSM permissions
      const lambdaRole = template.Resources.BackupLambdaRole;
      const ssmPolicy = lambdaRole.Properties.Policies.find((p: any) => p.PolicyName === 'SSMSendCommandPolicy');
      expect(ssmPolicy).toBeDefined();

      // EC2 instance has SSM role and S3 permissions
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2BackupInstanceProfile' });
      
      const ec2Role = template.Resources.EC2BackupRole;
      const s3Policy = ec2Role.Properties.Policies.find((p: any) => p.PolicyName === 'S3BackupPolicy');
      expect(s3Policy).toBeDefined();
    });
  });
});