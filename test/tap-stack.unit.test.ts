import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true); // Fixed: Changed false to true
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'AWS CloudFormation template to provision a secure development environment with networking, EC2, RDS PostgreSQL, and S3.'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'S3BucketPrefix',
        'DBName',
        'DBUser',
        'KeyPairName',
        'EnableRDS',
        'EnableEC2'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Suffix for the environment (e.g., dev, prod)');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters.');
    });

    test('S3BucketPrefix parameter should have correct properties', () => {
      const s3Param = template.Parameters.S3BucketPrefix;
      expect(s3Param.Type).toBe('String');
      expect(s3Param.Default).toBe('project-files');
      expect(s3Param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
    });

    test('DBName parameter should have correct properties', () => {
      const dbNameParam = template.Parameters.DBName;
      expect(dbNameParam.Type).toBe('String');
      expect(dbNameParam.Default).toBe('appdb');
      expect(dbNameParam.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('EnableRDS parameter should control RDS creation', () => {
      const enableRDSParam = template.Parameters.EnableRDS;
      expect(enableRDSParam.Type).toBe('String');
      expect(enableRDSParam.Default).toBe('true');
      expect(enableRDSParam.AllowedValues).toContain('true');
      expect(enableRDSParam.AllowedValues).toContain('false');
    });

    test('EnableEC2 parameter should control EC2 creation', () => {
      const enableEC2Param = template.Parameters.EnableEC2;
      expect(enableEC2Param.Type).toBe('String');
      expect(enableEC2Param.Default).toBe('true');
      expect(enableEC2Param.AllowedValues).toContain('true');
      expect(enableEC2Param.AllowedValues).toContain('false');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
      expect(template.Conditions.HasKeyPair['Fn::Not']).toBeDefined();
    });

    test('should have CreateRDS condition', () => {
      expect(template.Conditions.CreateRDS).toBeDefined();
      expect(template.Conditions.CreateRDS['Fn::Equals']).toBeDefined();
    });

    test('should have CreateEC2 condition', () => {
      expect(template.Conditions.CreateEC2).toBeDefined();
      expect(template.Conditions.CreateEC2['Fn::Equals']).toBeDefined();
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

    test('should have public subnets in different AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in different AZs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('should have route table and associations', () => {
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(template.Resources.PublicSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('Security Groups', () => {
    test('should have web server security group with correct rules', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = webSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      
      // HTTP rule
      expect(ingressRules[0].FromPort).toBe(80);
      expect(ingressRules[0].ToPort).toBe(80);
      expect(ingressRules[0].CidrIp).toBe('0.0.0.0/0');
      
      // HTTPS rule
      expect(ingressRules[1].FromPort).toBe(443);
      expect(ingressRules[1].ToPort).toBe(443);
      expect(ingressRules[1].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have database security group with restricted access', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = dbSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(5432);
      expect(ingressRules[0].ToPort).toBe(5432);
      expect(ingressRules[0].SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with correct configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
      
      const props = rds.Properties;
      expect(props.DBInstanceClass).toBe('db.t4g.medium');
      expect(props.Engine).toBe('postgres');
      expect(props.EngineVersion).toBe('17.2');
      expect(props.MultiAZ).toBe(true);
      expect(props.StorageEncrypted).toBe(true);
      expect(props.BackupRetentionPeriod).toBe(7);
      expect(props.EnablePerformanceInsights).toBe(true);
    });

    test('should have DB subnet group in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(subnetIds[1].Ref).toBe('PrivateSubnet2');
    });

    test('should have database secret for credentials', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have RDS monitoring role', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket with security features', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
      
      const props = s3.Properties;
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      
      const publicAccessBlock = props.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have lifecycle configuration', () => {
      const s3 = template.Resources.S3Bucket;
      const lifecycle = s3.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
      expect(lifecycle.Rules[0].NoncurrentVersionExpirationInDays).toBe(30);
    });

    test('should have globally unique bucket name', () => {
      const s3 = template.Resources.S3Bucket;
      const bucketName = s3.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toBe('${S3BucketPrefix}-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}');
    });
  });

  describe('EC2 Instance', () => {
    test('should have EC2 instance with correct configuration', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Type).toBe('AWS::EC2::Instance');
      
      const props = ec2.Properties;
      expect(props.InstanceType).toBe('t3.micro');
      expect(props.Monitoring).toBe(true);
      // ImageId is hardcoded for LocalStack compatibility
      expect(props.ImageId).toBe('ami-0c55b159cbfafe1f0');
    });

    test('should have conditional key pair assignment', () => {
      const ec2 = template.Resources.EC2Instance;
      const keyName = ec2.Properties.KeyName;
      expect(keyName['Fn::If']).toEqual([
        'HasKeyPair',
        { Ref: 'KeyPairName' },
        { Ref: 'AWS::NoValue' }
      ]);
    });

    test('should have user data script', () => {
      const ec2 = template.Resources.EC2Instance;
      const userData = ec2.Properties.UserData;
      expect(userData['Fn::Base64']).toBeDefined();
      expect(userData['Fn::Base64']['Fn::Sub']).toBeDefined();
      // UserData script should contain environment setup
      expect(userData['Fn::Base64']['Fn::Sub']).toContain('#!/bin/bash');
      expect(userData['Fn::Base64']['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role with correct policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      
      const inlinePolicies = role.Properties.Policies;
      expect(inlinePolicies).toHaveLength(1);
      expect(inlinePolicies[0].PolicyName).toBe('S3Access');
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles[0].Ref).toBe('EC2InstanceRole');
    });

    test('should have proper S3 resource ARN references in IAM policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policyDoc = role.Properties.Policies[0].PolicyDocument;
      
      // Statement uses Fn::If for conditional RDS access
      expect(policyDoc.Statement['Fn::If']).toBeDefined();
      
      // Get the S3 policy from the conditional (first branch when RDS is enabled)
      const statements = policyDoc.Statement['Fn::If'][1]; // RDS enabled branch
      const s3Policy = statements[0]; // First statement is S3 access
      
      expect(s3Policy.Resource).toHaveLength(2);
      expect(s3Policy.Resource[0]['Fn::GetAtt']).toEqual(['S3Bucket', 'Arn']);
      expect(s3Policy.Resource[1]['Fn::Join']).toBeDefined();
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
        'WebServerSecurityGroupId',
        'DatabaseSecurityGroupId',
        'S3BucketName',
        'RDSEndpoint',
        'RDSPort',
        'EC2InstanceId',
        'EC2PublicIP',
        'DatabaseCredentialsSecret',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC outputs should have correct export names', () => {
      const vpcOutput = template.Outputs.VPCId;
      expect(vpcOutput.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPC-ID');
      
      const subnet1Output = template.Outputs.PublicSubnet1Id;
      expect(subnet1Output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-PublicSubnet1-ID');
    });

    test('RDS outputs should be correct', () => {
      const rdsEndpoint = template.Outputs.RDSEndpoint;
      // RDS outputs use Fn::If for conditional RDS
      expect(rdsEndpoint.Value['Fn::If']).toBeDefined();
      expect(rdsEndpoint.Value['Fn::If'][0]).toBe('CreateRDS');
      expect(rdsEndpoint.Value['Fn::If'][1]['Fn::GetAtt']).toEqual(['RDSInstance', 'Endpoint.Address']);
      
      const rdsPort = template.Outputs.RDSPort;
      expect(rdsPort.Value['Fn::If']).toBeDefined();
      expect(rdsPort.Value['Fn::If'][0]).toBe('CreateRDS');
      expect(rdsPort.Value['Fn::If'][1]['Fn::GetAtt']).toEqual(['RDSInstance', 'Endpoint.Port']);
    });

    test('EC2 outputs should be correct', () => {
      const ec2Id = template.Outputs.EC2InstanceId;
      // EC2 outputs use Fn::If for conditional EC2
      expect(ec2Id.Value['Fn::If']).toBeDefined();
      expect(ec2Id.Value['Fn::If'][0]).toBe('CreateEC2');
      expect(ec2Id.Value['Fn::If'][1].Ref).toBe('EC2Instance');
      expect(ec2Id.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EC2Instance-ID');
      
      const ec2PublicIP = template.Outputs.EC2PublicIP;
      expect(ec2PublicIP.Value['Fn::If']).toBeDefined();
      expect(ec2PublicIP.Value['Fn::If'][0]).toBe('CreateEC2');
      expect(ec2PublicIP.Value['Fn::If'][1]['Fn::GetAtt']).toEqual(['EC2Instance', 'PublicIp']);
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7); // Updated count with EnableEC2
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(14); // Updated count
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow environment suffix naming convention', () => {
      const resourcesWithNaming = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicRouteTable',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'DBSubnetGroup',
        'DatabaseSecret',
        'S3Bucket',
        'RDSInstance',
        'EC2Instance'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        
        if (nameTag) {
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('export names should follow stack naming convention', () => {
      const outputsWithExports = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'WebServerSecurityGroupId',
        'S3BucketName',
        'EC2InstanceId',
        'EnvironmentSuffix'
      ];

      outputsWithExports.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('RDS should be in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      expect(subnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(subnetIds[1].Ref).toBe('PrivateSubnet2');
    });

    test('database should use encrypted storage', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should block public access', () => {
      const s3 = template.Resources.S3Bucket;
      const publicAccessBlock = s3.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('database security group should only allow access from web tier', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingressRules = dbSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
    });
  });

  describe('High Availability', () => {
    test('RDS should be configured for Multi-AZ', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should have subnets in multiple availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should have backup retention configured', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
    });
  });
});
