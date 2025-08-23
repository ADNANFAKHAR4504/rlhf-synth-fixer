import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Secure AWS Infrastructure', () => {
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

    test('should have a descriptive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure AWS infrastructure with S3 encryption, IAM least privilege, CloudTrail, and VPC Flow Logs'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['ProjectName', 'Environment', 'VpcCidr', 'EnvironmentSuffix'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('myproj');
      expect(param.Description).toBe('Project name for resource naming convention');
      expect(param.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only lowercase letters and numbers');
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Description).toBe('Environment name for resource naming convention');
    });

    test('VpcCidr parameter should have correct properties', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toBe('CIDR block for the VPC');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('Lambda Function for Random String Generation', () => {
    test('should have RandomString custom resource', () => {
      expect(template.Resources.RandomString).toBeDefined();
      expect(template.Resources.RandomString.Type).toBe('AWS::CloudFormation::CustomResource');
    });

    test('should have RandomStringFunction Lambda', () => {
      expect(template.Resources.RandomStringFunction).toBeDefined();
      expect(template.Resources.RandomStringFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('RandomStringFunction should have correct properties', () => {
      const func = template.Resources.RandomStringFunction;
      expect(func.Properties.Runtime).toBe('python3.9');
      expect(func.Properties.Handler).toBe('index.handler');
      expect(func.Properties.Code.ZipFile).toContain('random');
      expect(func.Properties.Code.ZipFile).toContain('cfnresponse');
    });

    test('should have RandomStringLambdaRole with correct properties', () => {
      const role = template.Resources.RandomStringLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });
  });

  describe('S3 Buckets', () => {
    test('should have CloudTrailLogsBucket', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('CloudTrailLogsBucket should have correct encryption configuration', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('CloudTrailLogsBucket should have public access blocked', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('CloudTrailLogsBucket should have versioning enabled', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('CloudTrailLogsBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);
      
      const deleteRule = rules.find((r: any) => r.Id === 'DeleteOldVersions');
      expect(deleteRule).toBeDefined();
      expect(deleteRule.Status).toBe('Enabled');
    });

    test('should have VpcFlowLogsBucket with correct configuration', () => {
      const bucket = template.Resources.VpcFlowLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should have CloudTrail bucket policy', () => {
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('CloudTrail bucket policy should have correct statements', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements.length).toBe(2);
      
      const aclStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      expect(aclStatement).toBeDefined();
      expect(aclStatement.Action).toBe('s3:GetBucketAcl');
      
      const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Action).toBe('s3:PutObject');
    });

    test('should have CloudTrail role', () => {
      const role = template.Resources.CloudTrailRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
    });

    test('should have GlobalCloudTrail with correct configuration', () => {
      const trail = template.Resources.GlobalCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
    });

    test('GlobalCloudTrail should have event selectors', () => {
      const trail = template.Resources.GlobalCloudTrail;
      const eventSelectors = trail.Properties.EventSelectors;
      expect(eventSelectors).toBeDefined();
      expect(eventSelectors[0].ReadWriteType).toBe('All');
      expect(eventSelectors[0].IncludeManagementEvents).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    test('should have SecureVpc', () => {
      const vpc = template.Resources.SecureVpc;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have PublicSubnet and PrivateSubnet', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnet should have correct configuration', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.CidrBlock).toBeDefined();
    });

    test('should have InternetGateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VpcFlowLogsRole', () => {
      const role = template.Resources.VpcFlowLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
    });

    test('should have VpcFlowLogs with correct configuration', () => {
      const flowLogs = template.Resources.VpcFlowLogs;
      expect(flowLogs).toBeDefined();
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.ResourceType).toBe('VPC');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(flowLogs.Properties.LogDestinationType).toBe('s3');
      expect(flowLogs.Properties.MaxAggregationInterval).toBe(60);
    });

    test('VpcFlowLogs should have correct LogFormat', () => {
      const flowLogs = template.Resources.VpcFlowLogs;
      expect(flowLogs.Properties.LogFormat).toBe('${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action}');
    });
  });

  describe('EC2 IAM Configuration', () => {
    test('should have Ec2InstanceRole', () => {
      const role = template.Resources.Ec2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('Ec2InstanceRole should have least privilege policies', () => {
      const role = template.Resources.Ec2InstanceRole;
      const policies = role.Properties.Policies;
      expect(policies.length).toBe(2);
      
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3ReadOnlyPolicy');
      expect(s3Policy).toBeDefined();
      
      const cloudWatchPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      expect(cloudWatchPolicy).toBeDefined();
    });

    test('should have Ec2InstanceProfile', () => {
      const profile = template.Resources.Ec2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'Ec2InstanceRole' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'CloudTrailBucketName',
        'VpcFlowLogsBucketName',
        'VpcId',
        'CloudTrailArn',
        'RandomString',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });

    test('CloudTrailBucketName output should be correct', () => {
      const output = template.Outputs.CloudTrailBucketName;
      expect(output.Description).toBe('Name of the CloudTrail logs S3 bucket');
      expect(output.Value).toEqual({ Ref: 'CloudTrailLogsBucket' });
    });

    test('VpcId output should be correct', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'SecureVpc' });
    });

    test('CloudTrailArn output should be correct', () => {
      const output = template.Outputs.CloudTrailArn;
      expect(output.Description).toBe('CloudTrail ARN');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['GlobalCloudTrail', 'Arn'] });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use consistent naming with environment suffix and random string', () => {
      const checkNaming = (resourceName: string, nameProperty: string) => {
        const resource = template.Resources[resourceName];
        const name = resource.Properties[nameProperty];
        if (typeof name === 'object' && name['Fn::Sub']) {
          expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
          if (resourceName !== 'RandomStringFunction' && resourceName !== 'RandomStringLambdaRole') {
            expect(name['Fn::Sub']).toContain('${RandomString.RandomString}');
          }
        }
      };

      checkNaming('CloudTrailLogsBucket', 'BucketName');
      checkNaming('VpcFlowLogsBucket', 'BucketName');
      checkNaming('RandomStringFunction', 'FunctionName');
      checkNaming('CloudTrailRole', 'RoleName');
      checkNaming('GlobalCloudTrail', 'TrailName');
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Security Configuration', () => {
    test('all S3 buckets should have encryption enabled', () => {
      ['CloudTrailLogsBucket', 'VpcFlowLogsBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('all S3 buckets should have public access blocked', () => {
      ['CloudTrailLogsBucket', 'VpcFlowLogsBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('IAM roles should follow least privilege principle', () => {
      const ec2Role = template.Resources.Ec2InstanceRole;
      const policies = ec2Role.Properties.Policies;
      
      // S3 policy should only allow GetObject and ListBucket
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3ReadOnlyPolicy');
      const s3Actions = s3Policy.PolicyDocument.Statement[0].Action;
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:GetObjectVersion');
      expect(s3Actions).not.toContain('s3:PutObject');
      expect(s3Actions).not.toContain('s3:DeleteObject');
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(17); // Updated count for all resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Dependencies', () => {
    test('GlobalCloudTrail should depend on CloudTrailBucketPolicy', () => {
      const trail = template.Resources.GlobalCloudTrail;
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
    });

    test('CloudTrailBucketPolicy should reference CloudTrailLogsBucket', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy.Properties.Bucket).toEqual({ Ref: 'CloudTrailLogsBucket' });
    });

    test('RandomString should reference RandomStringFunction', () => {
      const customResource = template.Resources.RandomString;
      expect(customResource.Properties.ServiceToken).toEqual({
        'Fn::GetAtt': ['RandomStringFunction', 'Arn']
      });
    });
  });
});