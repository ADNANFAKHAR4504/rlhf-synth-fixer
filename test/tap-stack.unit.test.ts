import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || '';

describe('Secure Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Integration tests should be implemented', async () => {
      // TODO: Implement integration tests for:
      // - VPC connectivity
      // - EC2 instance accessibility via SSM
      // - RDS connectivity from EC2/Lambda
      // - Lambda function execution
      // - S3 bucket access policies
      // - Secrets Manager integration
      expect(true).toBe(true); // Placeholder - remove when implementing actual tests
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure and compliant infrastructure with VPC, EC2, RDS, S3, Lambda, and comprehensive security controls including AWS Secrets Manager for database credentials'
      );
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'Environment',
      'Owner',
      'EnvironmentSuffix',
      'TrustedCIDR',
      'DBUsername',
      'LatestAmiId',
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming to avoid conflicts'
      );
    });

    test('TrustedCIDR parameter should have valid pattern', () => {
      const trustedCIDRParam = template.Parameters.TrustedCIDR;
      expect(trustedCIDRParam.Type).toBe('String');
      expect(trustedCIDRParam.Default).toBe('10.0.0.0/8');
      expect(trustedCIDRParam.AllowedPattern).toBe(
        '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$'
      );
    });

    test('DBUsername parameter should have correct constraints', () => {
      const dbUsernameParam = template.Parameters.DBUsername;
      expect(dbUsernameParam.Type).toBe('String');
      expect(dbUsernameParam.Default).toBe('admin');
      expect(dbUsernameParam.MinLength).toBe(1);
      expect(dbUsernameParam.MaxLength).toBe(16);
      expect(dbUsernameParam.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });
  });

  describe('Core Infrastructure Resources', () => {
    const expectedResources = [
      'VPC',
      'PublicSubnet1',
      'PublicSubnet2',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'InternetGateway',
      'NatGateway1',
      'EC2Instance',
      'RDSInstance',
      'LambdaFunction',
      'SecureS3Bucket',
      'CloudTrailS3Bucket',
    ];

    test('should have all core infrastructure resources', () => {
      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('VPC should have correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('subnets should be in different availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      // Check that subnets use different AZ indices
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        0
      );
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        1
      );
      expect(privateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        0
      );
      expect(privateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        1
      );
    });

    test('public subnets should not auto-assign public IPs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });

  describe('Security Groups', () => {
    const expectedSecurityGroups = [
      'EC2SecurityGroup',
      'RDSSecurityGroup',
      'LambdaSecurityGroup',
    ];

    test('should have all required security groups', () => {
      expectedSecurityGroups.forEach(sgName => {
        expect(template.Resources[sgName]).toBeDefined();
        expect(template.Resources[sgName].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('RDS security group should only allow access from EC2 and Lambda', () => {
      const rdsSG = template.Resources.RDSSecurityGroup;
      const ingressRules = rdsSG.Properties.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(2);
      expect(ingressRules[0].SourceSecurityGroupId.Ref).toBe(
        'EC2SecurityGroup'
      );
      expect(ingressRules[1].SourceSecurityGroupId.Ref).toBe(
        'LambdaSecurityGroup'
      );
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[1].FromPort).toBe(3306);
    });

    test('EC2 security group should restrict access to trusted CIDR', () => {
      const ec2SG = template.Resources.EC2SecurityGroup;
      const ingressRules = ec2SG.Properties.SecurityGroupIngress;

      ingressRules.forEach((rule: any) => {
        expect(rule.CidrIp.Ref).toBe('TrustedCIDR');
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    const expectedRoles = ['EC2Role', 'LambdaExecutionRole', 'CloudTrailRole'];

    test('should have all required IAM roles', () => {
      expectedRoles.forEach(roleName => {
        expect(template.Resources[roleName]).toBeDefined();
        expect(template.Resources[roleName].Type).toBe('AWS::IAM::Role');
      });
    });

    test('EC2 role should have SSM and CloudWatch policies', () => {
      const ec2Role = template.Resources.EC2Role;
      const managedPolicies = ec2Role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('Lambda execution role should have VPC access', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const managedPolicies = lambdaRole.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('roles should have secrets manager access policies', () => {
      const ec2Role = template.Resources.EC2Role;
      const lambdaRole = template.Resources.LambdaExecutionRole;

      const ec2SecretsPolicy = ec2Role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'SecretsManagerReadAccess'
      );
      const lambdaSecretsPolicy = lambdaRole.Properties.Policies.find(
        (p: any) => p.PolicyName === 'SecretsManagerReadAccess'
      );

      expect(ec2SecretsPolicy).toBeDefined();
      expect(lambdaSecretsPolicy).toBeDefined();
    });
  });

  describe('Database Configuration', () => {
    test('RDS instance should be properly configured', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.39');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.DeletionProtection).toBe(true);
      expect(rds.Properties.EnablePerformanceInsights).toBe(true);
    });

    test('DB subnet group should use private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');

      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('secrets manager secret should be configured for RDS', () => {
      const dbSecret = template.Resources.DBSecret;
      expect(dbSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(dbSecret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(
        dbSecret.Properties.GenerateSecretString.RequireEachIncludedType
      ).toBe(true);
    });
  });

  describe('S3 Buckets', () => {
    test('S3 buckets should have encryption enabled', () => {
      const secureS3Bucket = template.Resources.SecureS3Bucket;
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket;

      expect(
        secureS3Bucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('AES256');
      expect(
        cloudTrailBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 buckets should block all public access', () => {
      const secureS3Bucket = template.Resources.SecureS3Bucket;
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket;

      const securePublicAccess =
        secureS3Bucket.Properties.PublicAccessBlockConfiguration;
      const cloudTrailPublicAccess =
        cloudTrailBucket.Properties.PublicAccessBlockConfiguration;

      [securePublicAccess, cloudTrailPublicAccess].forEach(config => {
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });

    test('secure S3 bucket should have versioning enabled', () => {
      const secureS3Bucket = template.Resources.SecureS3Bucket;
      expect(secureS3Bucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function should be configured correctly', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.VpcConfig).toBeDefined();
    });

    test('Lambda should be deployed in private subnets', () => {
      const lambda = template.Resources.LambdaFunction;
      const subnetIds = lambda.Properties.VpcConfig.SubnetIds;

      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('Lambda should have environment variables for secrets', () => {
      const lambda = template.Resources.LambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.DB_SECRET_ARN).toEqual({ Ref: 'DBSecret' });
      expect(envVars.REGION).toEqual({ Ref: 'AWS::Region' });
    });
  });

  describe('VPC Endpoints', () => {
    const expectedVPCEndpoints = [
      'S3VPCEndpoint',
      'LambdaVPCEndpoint',
      'SecretsManagerVPCEndpoint',
      'SSMVPCEndpoint',
      'SSMMessagesVPCEndpoint',
      'EC2MessagesVPCEndpoint',
    ];

    test('should have all required VPC endpoints', () => {
      expectedVPCEndpoints.forEach(endpointName => {
        expect(template.Resources[endpointName]).toBeDefined();
        expect(template.Resources[endpointName].Type).toBe(
          'AWS::EC2::VPCEndpoint'
        );
      });
    });

    test('S3 VPC endpoint should be Gateway type', () => {
      const s3Endpoint = template.Resources.S3VPCEndpoint;
      expect(s3Endpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('Interface VPC endpoints should be in private subnets', () => {
      const interfaceEndpoints = [
        'LambdaVPCEndpoint',
        'SecretsManagerVPCEndpoint',
        'SSMVPCEndpoint',
        'SSMMessagesVPCEndpoint',
        'EC2MessagesVPCEndpoint',
      ];

      interfaceEndpoints.forEach(endpointName => {
        const endpoint = template.Resources[endpointName];
        expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
        expect(endpoint.Properties.SubnetIds).toContainEqual({
          Ref: 'PrivateSubnet1',
        });
        expect(endpoint.Properties.SubnetIds).toContainEqual({
          Ref: 'PrivateSubnet2',
        });
      });
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('should have CloudWatch alarms for EC2', () => {
      const cpuAlarm = template.Resources.EC2CPUAlarm;
      const statusAlarm = template.Resources.EC2StatusCheckFailedAlarm;

      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(statusAlarm.Type).toBe('AWS::CloudWatch::Alarm');

      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(statusAlarm.Properties.MetricName).toBe('StatusCheckFailed');
    });

    test('should have CloudWatch log groups', () => {
      const cloudTrailLogs = template.Resources.CloudTrailLogGroup;
      const lambdaLogs = template.Resources.LambdaLogGroup;

      expect(cloudTrailLogs.Type).toBe('AWS::Logs::LogGroup');
      expect(lambdaLogs.Type).toBe('AWS::Logs::LogGroup');

      expect(cloudTrailLogs.Properties.RetentionInDays).toBe(30);
      expect(lambdaLogs.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail should be properly configured', () => {
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.IsLogging).toBe(true);
    });

    test('CloudTrail bucket policy should allow CloudTrail access', () => {
      const bucketPolicy = template.Resources.CloudTrailS3BucketPolicy;
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      const aclCheckStatement = statements.find(
        (s: any) => s.Sid === 'AWSCloudTrailAclCheck'
      );
      const writeStatement = statements.find(
        (s: any) => s.Sid === 'AWSCloudTrailWrite'
      );

      expect(aclCheckStatement).toBeDefined();
      expect(writeStatement).toBeDefined();
      expect(aclCheckStatement.Principal.Service).toBe(
        'cloudtrail.amazonaws.com'
      );
      expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const resourcesWithNaming = [
        'VPC',
        'PublicSubnet1',
        'PrivateSubnet1',
        'EC2SecurityGroup',
        'SecureS3Bucket',
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.Tags?.find((tag: any) => tag.Key === 'Name') ||
          resource.Properties.GroupName ||
          resource.Properties.BucketName;

        if (nameProperty) {
          expect(JSON.stringify(nameProperty)).toContain(
            '${EnvironmentSuffix}'
          );
        }
      });
    });

    test('resources should have consistent tagging', () => {
      const taggedResources = [
        'VPC',
        'PublicSubnet1',
        'PrivateSubnet1',
        'EC2SecurityGroup',
        'RDSInstance',
        'SecureS3Bucket',
        'LambdaFunction',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags: Array<{ Key: string; Value: any }> =
          resource.Properties.Tags;

        if (tags) {
          const environmentTag = tags.find(
            (tag: { Key: string; Value: any }) => tag.Key === 'Environment'
          );
          const ownerTag = tags.find(
            (tag: { Key: string; Value: any }) => tag.Key === 'Owner'
          );

          expect(environmentTag).toBeDefined();
          expect(ownerTag).toBeDefined();
          expect(environmentTag?.Value.Ref).toBe('Environment');
          expect(ownerTag?.Value.Ref).toBe('Owner');
        }
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'EC2InstanceId',
      'RDSInstanceId',
      'RDSEndpoint',
      'RDSPort',
      'DBSecretArn',
      'S3BucketName',
      'S3BucketArn',
      'LambdaFunctionName',
      'LambdaFunctionArn',
      'CloudTrailArn',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toMatch(
          new RegExp(`\\$\\{AWS::StackName\\}-.*\\$\\{EnvironmentSuffix\\}`)
        );
      });
    });

    test('RDS outputs should reference correct attributes', () => {
      const rdsEndpoint = template.Outputs.RDSEndpoint;
      const rdsPort = template.Outputs.RDSPort;

      expect(rdsEndpoint.Value['Fn::GetAtt']).toEqual([
        'RDSInstance',
        'Endpoint.Address',
      ]);
      expect(rdsPort.Value['Fn::GetAtt']).toEqual([
        'RDSInstance',
        'Endpoint.Port',
      ]);
    });

    test('S3 outputs should reference correct attributes', () => {
      const s3BucketName = template.Outputs.S3BucketName;
      const s3BucketArn = template.Outputs.S3BucketArn;

      expect(s3BucketName.Value.Ref).toBe('SecureS3Bucket');
      expect(s3BucketArn.Value['Fn::GetAtt']).toEqual([
        'SecureS3Bucket',
        'Arn',
      ]);
    });
  });

  describe('Security Best Practices', () => {
    test('EC2 launch template should enforce IMDSv2', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      const metadataOptions =
        launchTemplate.Properties.LaunchTemplateData.MetadataOptions;

      expect(metadataOptions.HttpTokens).toBe('required');
      expect(metadataOptions.HttpEndpoint).toBe('enabled');
      expect(metadataOptions.HttpPutResponseHopLimit).toBe(2);
    });

    test('RDS should use secrets manager for password management', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.ManageMasterUserPassword).toBe(true);
      expect(rds.Properties.MasterUserSecret.SecretArn.Ref).toBe('DBSecret');
    });

    test('should have secret attachment for RDS', () => {
      const secretAttachment = template.Resources.SecretRDSInstanceAttachment;
      expect(secretAttachment.Type).toBe(
        'AWS::SecretsManager::SecretTargetAttachment'
      );
      expect(secretAttachment.Properties.TargetType).toBe(
        'AWS::RDS::DBInstance'
      );
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
      expect(resourceCount).toBeGreaterThan(30); // Should have many infrastructure resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(15);
    });
  });
});
