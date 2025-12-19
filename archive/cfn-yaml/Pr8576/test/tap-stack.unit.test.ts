import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON template generated from YAML
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
        'Secure AWS Infrastructure with S3 buckets, EC2 instances, and IAM roles - us-west-2 region'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should target us-west-2 region in mappings', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2'].AMI).toBe('ami-008fe2fc65df48dac');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
      expect(envParam.Description).toBe('Environment tag value');
    });

    test('Project parameter should have correct properties', () => {
      const projectParam = template.Parameters.Project;
      expect(projectParam.Type).toBe('String');
      expect(projectParam.Default).toBe('secure-infrastructure');
      expect(projectParam.Description).toBe('Project tag value');
    });

    test('Owner parameter should have correct properties', () => {
      const ownerParam = template.Parameters.Owner;
      expect(ownerParam.Type).toBe('String');
      expect(ownerParam.Default).toBe('infrastructure-team');
      expect(ownerParam.Description).toBe('Owner tag value');
    });

    test('InstanceType parameter should have correct properties', () => {
      const instanceParam = template.Parameters.InstanceType;
      expect(instanceParam.Type).toBe('String');
      expect(instanceParam.Default).toBe('t3.micro');
      expect(instanceParam.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
      expect(instanceParam.Description).toBe('EC2 instance type');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have SecureDataBucket resource', () => {
      expect(template.Resources.SecureDataBucket).toBeDefined();
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('SecureDataBucket should have correct properties', () => {
      const bucket = template.Resources.SecureDataBucket;
      const properties = bucket.Properties;
      
      // Check bucket name includes environment suffix
      expect(properties.BucketName).toEqual({
        'Fn::Sub': '${Project}-secure-data-${EnvironmentSuffix}-${AWS::AccountId}',
      });
      
      // Check encryption configuration
      expect(properties.BucketEncryption).toBeDefined();
      expect(properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(properties.BucketEncryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
      
      // Check public access block
      expect(properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      
      // Check versioning
      expect(properties.VersioningConfiguration).toBeDefined();
      expect(properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('LogsBucket should have correct properties', () => {
      expect(template.Resources.LogsBucket).toBeDefined();
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      
      const properties = bucket.Properties;
      
      // Check bucket name includes environment suffix
      expect(properties.BucketName).toEqual({
        'Fn::Sub': '${Project}-logs-${EnvironmentSuffix}-${AWS::AccountId}',
      });
      
      // Check encryption
      expect(properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      
      // Check lifecycle policy
      expect(properties.LifecycleConfiguration).toBeDefined();
      expect(properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('both S3 buckets should have mandatory tags', () => {
      const buckets = ['SecureDataBucket', 'LogsBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.Tags).toBeDefined();
        expect(bucket.Properties.Tags).toHaveLength(3);
        
        const tagKeys = bucket.Properties.Tags.map((tag: any) => tag.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Owner');
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2InstanceRole with least privilege', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      // Role name will be auto-generated by CloudFormation
      expect(role.Properties.RoleName).toBeUndefined();
      
      // Check assume role policy
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      
      // Check managed policies
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      
      // Check inline policies
      expect(role.Properties.Policies).toHaveLength(2);
      expect(role.Properties.Policies[0].PolicyName).toBe('S3AccessPolicy');
      expect(role.Properties.Policies[1].PolicyName).toBe('CloudWatchLogsPolicy');
    });

    test('EC2InstanceRole should have specific S3 permissions only', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      
      expect(policy.Statement).toHaveLength(4);
      
      // Check first statement - GetObject and PutObject on SecureDataBucket
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Action).toContain('s3:GetObject');
      expect(policy.Statement[0].Action).toContain('s3:PutObject');
      
      // Check second statement - ListBucket on SecureDataBucket
      expect(policy.Statement[1].Effect).toBe('Allow');
      expect(policy.Statement[1].Action).toContain('s3:ListBucket');
      
      // Check third statement - PutObject on LogsBucket
      expect(policy.Statement[2].Effect).toBe('Allow');
      expect(policy.Statement[2].Action).toContain('s3:PutObject');
    });

    test('should have ApplicationServiceRole with least privilege', () => {
      expect(template.Resources.ApplicationServiceRole).toBeDefined();
      const role = template.Resources.ApplicationServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      // Role name will be auto-generated by CloudFormation
      expect(role.Properties.RoleName).toBeUndefined();
      
      // Check assume role policy for Lambda
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      
      // Check managed policies
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      
      // Check inline policies - read-only access
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('ReadOnlyS3Access');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      expect(policy.PolicyDocument.Statement[0].Action).not.toContain('s3:PutObject');
      expect(policy.PolicyDocument.Statement[0].Action).not.toContain('s3:DeleteObject');
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      
      // Profile name will be auto-generated by CloudFormation
      expect(profile.Properties.InstanceProfileName).toBeUndefined();
      
      expect(profile.Properties.Roles).toHaveLength(1);
      expect(profile.Properties.Roles[0]).toEqual({ Ref: 'EC2InstanceRole' });
    });

    test('all IAM resources should have mandatory tags', () => {
      const iamResources = ['EC2InstanceRole', 'ApplicationServiceRole'];
      iamResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags).toHaveLength(3);
        
        const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Owner');
      });
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2SecurityGroup with minimal access', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      // Security group name will be auto-generated by CloudFormation
      expect(sg.Properties.GroupName).toBeUndefined();
      
      // Check ingress rules
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(3);
      
      // SSH should be restricted to private networks
      const sshRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
      
      // HTTP and HTTPS should be open
      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      
      const httpsRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have WebServerInstance with correct configuration', () => {
      expect(template.Resources.WebServerInstance).toBeDefined();
      const instance = template.Resources.WebServerInstance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      
      // Check instance uses conditional AMI selection
      expect(instance.Properties.ImageId).toEqual({
        'Fn::If': ['UseCustomAMI', { Ref: 'CustomAMIId' }, { 'Fn::FindInMap': ['RegionMap', { Ref: 'AWS::Region' }, 'AMI'] }]
      });
      
      // Check instance type parameter reference
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
      
      // Check IAM instance profile
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      
      // Check security group
      expect(instance.Properties.SecurityGroupIds).toHaveLength(1);
      expect(instance.Properties.SecurityGroupIds[0]).toEqual({ 'Fn::GetAtt': ['EC2SecurityGroup', 'GroupId'] });
      
      // Check UserData exists
      expect(instance.Properties.UserData).toBeDefined();
    });

    test('WebServerInstance should have CloudWatch agent in UserData', () => {
      const instance = template.Resources.WebServerInstance;
      const userData = instance.Properties.UserData['Fn::Base64'];
      
      expect(userData).toContain('yum update -y');
      expect(userData).toContain('amazon-cloudwatch-agent');
      expect(userData).toContain('/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl');
    });

    test('EC2 resources should have mandatory tags', () => {
      const ec2Resources = ['EC2SecurityGroup', 'WebServerInstance'];
      ec2Resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Owner');
      });
    });

    test('WebServerInstance should have Name tag with environment suffix', () => {
      const instance = template.Resources.WebServerInstance;
      const nameTag = instance.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${Project}-web-server-${EnvironmentSuffix}'
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'SecureDataBucketName',
        'LogsBucketName',
        'EC2InstanceId',
        'EC2InstanceRoleArn',
        'ApplicationServiceRoleArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('SecureDataBucketName output should be correct', () => {
      const output = template.Outputs.SecureDataBucketName;
      expect(output.Description).toBe('Name of the secure data S3 bucket');
      expect(output.Value).toEqual({ Ref: 'SecureDataBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SecureDataBucket',
      });
    });

    test('LogsBucketName output should be correct', () => {
      const output = template.Outputs.LogsBucketName;
      expect(output.Description).toBe('Name of the logs S3 bucket');
      expect(output.Value).toEqual({ Ref: 'LogsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LogsBucket',
      });
    });

    test('EC2InstanceId output should be correct', () => {
      const output = template.Outputs.EC2InstanceId;
      expect(output.Description).toBe('Instance ID of the web server');
      expect(output.Value).toEqual({ Ref: 'WebServerInstance' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-WebServerInstance',
      });
    });

    test('EC2InstanceRoleArn output should be correct', () => {
      const output = template.Outputs.EC2InstanceRoleArn;
      expect(output.Description).toBe('ARN of the EC2 instance role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EC2InstanceRole', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2InstanceRole',
      });
    });

    test('ApplicationServiceRoleArn output should be correct', () => {
      const output = template.Outputs.ApplicationServiceRoleArn;
      expect(output.Description).toBe('ARN of the application service role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationServiceRole', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApplicationServiceRole',
      });
    });

    test('all outputs should have exports with stack name prefix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
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
      expect(resourceCount).toBe(20); // 2 S3 buckets, 2 IAM roles, 1 instance profile, 1 security group, 1 EC2 instance, 1 VPC, 2 subnets, 1 IGW, 1 VPC attachment, 2 route tables, 2 routes, 2 subnet associations, 1 EIP, 1 NAT Gateway
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8); // Environment, Project, Owner, InstanceType, EnvironmentSuffix, KeyPairName, CreateNATGateway, CustomAMIId
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13);
    });
  });

  describe('Security Compliance', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['SecureDataBucket', 'LogsBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = ['SecureDataBucket', 'LogsBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('IAM roles should follow least privilege principle', () => {
      // EC2 role should only have specific S3 permissions
      const ec2Role = template.Resources.EC2InstanceRole;
      const ec2Policy = ec2Role.Properties.Policies[0].PolicyDocument;
      ec2Policy.Statement.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).not.toContain('*');
        expect(statement.Resource).not.toContain('*');
      });

      // Application role should only have read permissions
      const appRole = template.Resources.ApplicationServiceRole;
      const appPolicy = appRole.Properties.Policies[0].PolicyDocument;
      appPolicy.Statement.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).not.toContain('s3:DeleteObject');
        expect(statement.Action).not.toContain('s3:PutObject');
      });
    });

    test('SSH access should be restricted to private networks', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule.CidrIp).not.toBe('0.0.0.0/0');
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include environment suffix', () => {
      // Check S3 bucket names (explicitly named)
      expect(template.Resources.SecureDataBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(template.Resources.LogsBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      // IAM resources use auto-generated names (no explicit names to test)
      expect(template.Resources.EC2InstanceRole.Properties.RoleName).toBeUndefined();
      expect(template.Resources.ApplicationServiceRole.Properties.RoleName).toBeUndefined();
      expect(template.Resources.EC2InstanceProfile.Properties.InstanceProfileName).toBeUndefined();
      expect(template.Resources.EC2SecurityGroup.Properties.GroupName).toBeUndefined();
      
      // Check EC2 instance name tag (still explicitly named)
      const nameTag = template.Resources.WebServerInstance.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Deletion Policy', () => {
    test('all S3 buckets should have Delete policy for cleanup', () => {
      const buckets = ['SecureDataBucket', 'LogsBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Tagging Compliance', () => {
    test('all taggable resources should have mandatory tags', () => {
      const mandatoryTags = ['Environment', 'Project', 'Owner'];
      const taggableResources = [
        'SecureDataBucket',
        'LogsBucket',
        'EC2InstanceRole',
        'ApplicationServiceRole',
        'EC2SecurityGroup',
        'WebServerInstance'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
        mandatoryTags.forEach(mandatoryTag => {
          expect(tagKeys).toContain(mandatoryTag);
        });
      });
    });

    test('Environment tag should reference Environment parameter', () => {
      const taggableResources = [
        'SecureDataBucket',
        'LogsBucket',
        'EC2InstanceRole',
        'ApplicationServiceRole',
        'EC2SecurityGroup',
        'WebServerInstance'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });

    test('Project tag should reference Project parameter', () => {
      const taggableResources = [
        'SecureDataBucket',
        'LogsBucket',
        'EC2InstanceRole',
        'ApplicationServiceRole',
        'EC2SecurityGroup',
        'WebServerInstance'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag.Value).toEqual({ Ref: 'Project' });
      });
    });

    test('Owner tag should reference Owner parameter', () => {
      const taggableResources = [
        'SecureDataBucket',
        'LogsBucket',
        'EC2InstanceRole',
        'ApplicationServiceRole',
        'EC2SecurityGroup',
        'WebServerInstance'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const ownerTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Owner');
        expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
      });
    });
  });
});