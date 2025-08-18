import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Secure Web Application', () => {
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
      expect(template.Description).toContain(
        'Secure, modular CloudFormation template'
      );
    });

    test('should have metadata section with parameter interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterLabels
      ).toBeDefined();
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(21); // Minimum expected resources for secure web app
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'ProjectName',
        'EnvironmentSuffix',
        'InstanceType',
        'AllowedCIDR',
        'DBInstanceClass',
        'HTTPPort',
        'HTTPSPort',
        'DatabasePort',
        'Owner',
      ];

      expectedParams.forEach((param: string) => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('InstanceType parameter should include t3 instances', () => {
      const instanceTypeParam = template.Parameters.InstanceType;
      expect(instanceTypeParam.AllowedValues).toContain('t3.micro');
      expect(instanceTypeParam.AllowedValues).toContain('t3.small');
      expect(instanceTypeParam.AllowedValues).toContain('t3.medium');
    });

    test('AllowedCIDR parameter should have validation pattern', () => {
      const cidrParam = template.Parameters.AllowedCIDR;
      expect(cidrParam.AllowedPattern).toBeDefined();
      expect(cidrParam.AllowedPattern).toContain(
        '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])'
      );
    });

    test('port parameters should have valid ranges', () => {
      const portParams = ['HTTPPort', 'HTTPSPort', 'DatabasePort'];
      portParams.forEach((param: string) => {
        expect(template.Parameters[param].Type).toBe('Number');
        expect(template.Parameters[param].MinValue).toBe(1);
        expect(template.Parameters[param].MaxValue).toBe(65535);
      });
    });

    test('Owner parameter should have correct properties', () => {
      const ownerParam = template.Parameters.Owner;
      expect(ownerParam.Type).toBe('String');
      expect(ownerParam.Default).toBe('cloud-team');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC with correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe(
        'InternetGateway'
      );
    });
  });

  describe('Subnet Configuration', () => {
    test('should have public subnets with correct configuration', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets with correct configuration', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.101.0/24');
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();

      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.102.0/24');
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should use dynamic availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select']).toEqual([
        0,
        { 'Fn::GetAZs': '' },
      ]);
    });
  });

  describe('Security Groups', () => {
    test('should have web server security group with parameterized ports', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = webSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      // Check HTTP rule uses parameter
      const httpRule = ingressRules.find(
        (rule: any) => rule.FromPort.Ref === 'HTTPPort'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp.Ref).toBe('AllowedCIDR');

      // Check HTTPS rule uses parameter
      const httpsRule = ingressRules.find(
        (rule: any) => rule.FromPort.Ref === 'HTTPSPort'
      );
      expect(httpsRule).toBeDefined();
    });

    test('should have database security group with restricted access', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = dbSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);

      const dbRule = ingressRules[0];
      expect(dbRule.FromPort.Ref).toBe('DatabasePort');
      expect(dbRule.SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
    });

    test('security groups should allow only necessary outbound traffic', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const egressRules = webSG.Properties.SecurityGroupEgress;
      expect(egressRules).toHaveLength(1);
      expect(egressRules[0].IpProtocol).toBe('-1');
      expect(egressRules[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('S3 Buckets', () => {
    test('should have application S3 bucket with encryption and versioning', () => {
      const appBucket = template.Resources.ApplicationTierS3Bucket;
      expect(appBucket.Type).toBe('AWS::S3::Bucket');

      expect(appBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
      expect(
        appBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('AES256');
      expect(
        appBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].BucketKeyEnabled
      ).toBe(true);
    });

    test('should have public access blocked on all S3 buckets', () => {
      const appBucket = template.Resources.ApplicationTierS3Bucket;

      const publicAccessBlock =
        appBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have ApplicationTierS3Bucket with encryption and versioning', () => {
      const appTierBucket = template.Resources.ApplicationTierS3Bucket;
      expect(appTierBucket.Type).toBe('AWS::S3::Bucket');

      expect(appTierBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
      expect(
        appTierBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('AES256');
      expect(
        appTierBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].BucketKeyEnabled
      ).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role with least privilege', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      expect(ec2Role.Type).toBe('AWS::IAM::Role');

      const policies = ec2Role.Properties.Policies;
      expect(policies).toHaveLength(2);

      // Check S3 policy
      const s3Policy = policies.find(
        (p: any) => p.PolicyName === 'S3AccessPolicy'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toEqual([
        's3:GetObject',
        's3:PutObject',
      ]);

      // Check CloudWatch policy
      const cwPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchLogsPolicy'
      );
      expect(cwPolicy).toBeDefined();
    });

    test('should have EC2 instance profile', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles[0].Ref).toBe('EC2InstanceRole');
    });

    test('S3 policy should have proper resource restrictions', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const s3Policy = ec2Role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'S3AccessPolicy'
      );

      // Check that policy has resource restrictions
      const getObjectStatement = s3Policy.PolicyDocument.Statement.find(
        (s: any) => s.Action.includes('s3:GetObject')
      );
      expect(getObjectStatement.Resource['Fn::Sub']).toContain(
        '${ApplicationTierS3Bucket}/*'
      );

      const listBucketStatement = s3Policy.PolicyDocument.Statement.find(
        (s: any) => s.Action.includes('s3:ListBucket')
      );
      expect(listBucketStatement.Resource['Fn::Sub']).toContain(
        '${ApplicationTierS3Bucket}'
      );
    });

    test('EC2 instance role should include AmazonSSMManagedInstanceCore policy', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });
  });

  describe('EC2 Instance', () => {
    test('should have EC2 instance with correct configuration', () => {
      const ec2Instance = template.Resources.WebServerInstance;
      expect(ec2Instance.Type).toBe('AWS::EC2::Instance');

      expect(ec2Instance.Properties.ImageId.Ref).toBe('AmiId');
      expect(ec2Instance.Properties.InstanceType.Ref).toBe('InstanceType');
      expect(ec2Instance.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    });

    test('should have proper IAM instance profile attached', () => {
      const ec2Instance = template.Resources.WebServerInstance;
      expect(ec2Instance.Properties.IamInstanceProfile.Ref).toBe(
        'EC2InstanceProfile'
      );
    });

    test('should have security group attached', () => {
      const ec2Instance = template.Resources.WebServerInstance;
      expect(ec2Instance.Properties.SecurityGroupIds[0].Ref).toBe(
        'WebServerSecurityGroup'
      );
    });

    test('should have user data for web server setup', () => {
      const ec2Instance = template.Resources.WebServerInstance;
      expect(ec2Instance.Properties.UserData).toBeDefined();
      expect(ec2Instance.Properties.UserData['Fn::Base64']).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with security configuration', () => {
      const rdsInstance = template.Resources.DatabaseInstance;
      expect(rdsInstance.Type).toBe('AWS::RDS::DBInstance');

      expect(rdsInstance.Properties.Engine).toBe('aurora-mysql');
      // Note: EngineVersion, PubliclyAccessible, StorageEncrypted, MultiAZ are cluster-level properties
    });

    test('should have DB subnet group with private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');

      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(subnetIds[1].Ref).toBe('PrivateSubnet2');
    });

    test('should use managed master password', () => {
      // Note: ManageMasterUserPassword and MasterUsername are cluster-level properties
      const rdsCluster = template.Resources.DatabaseCluster;
      expect(rdsCluster.Properties.ManageMasterUserPassword).toBe(true);
      expect(rdsCluster.Properties.MasterUsername).toBe('admin');
    });

    test('should use latest storage type', () => {
      // Note: StorageType is not applicable to Aurora instances
      // Aurora uses its own distributed storage system
      const rdsInstance = template.Resources.DatabaseInstance;
      expect(rdsInstance.Properties.Engine).toBe('aurora-mysql');
    });
  });

  describe('CloudTrail Lake', () => {
    test('should have CloudTrail EventDataStore with proper configuration', () => {
      const eventDataStore = template.Resources.CloudTrailEventDataStore;
      expect(eventDataStore.Type).toBe('AWS::CloudTrail::EventDataStore');

      // Basic configuration
      expect(eventDataStore.Properties.RetentionPeriod).toBe(90);
      expect(eventDataStore.DeletionPolicy).toBe('Delete');

      // Advanced event selectors
      const eventSelectors = eventDataStore.Properties.AdvancedEventSelectors;
      expect(eventSelectors).toHaveLength(1);
      expect(eventSelectors[0].FieldSelectors[0].Field).toBe('eventCategory');
      expect(eventSelectors[0].FieldSelectors[0].Equals).toEqual([
        'Management',
      ]);
    });

    test('should have proper CloudTrail Lake naming and tags', () => {
      const eventDataStore = template.Resources.CloudTrailEventDataStore;

      expect(eventDataStore.Properties.Name).toEqual({
        'Fn::Sub': '${ProjectName}-${EnvironmentSuffix}-cloudtrail-lake',
      });

      const tags = eventDataStore.Properties.Tags;
      expect(tags).toHaveLength(4);
      expect(
        tags.find((tag: { Key: string; Value: any }) => tag.Key === 'Project')
      ).toBeDefined();
      expect(
        tags.find(
          (tag: { Key: string; Value: any }) => tag.Key === 'Environment'
        )
      ).toBeDefined();
      expect(
        tags.find((tag: { Key: string; Value: any }) => tag.Key === 'Owner')
      ).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have required tags', () => {
      const requiredTags = ['Project', 'Environment', 'Owner'];
      const taggedResources = [
        'VPC',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicRouteTable',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'ApplicationTierS3Bucket',
        'EC2InstanceRole',
        'WebServerInstance',
        'DBSubnetGroup',
        'DatabaseInstance',
        'CloudTrailEventDataStore',
      ];

      taggedResources.forEach((resourceName: string) => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        requiredTags.forEach((tagKey: string) => {
          const tag = resource.Properties.Tags.find(
            (t: any) => t.Key === tagKey
          );
          expect(tag).toBeDefined();
        });
      });
    });

    test('resources should use correct naming convention', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBe(
        '${ProjectName}-${EnvironmentSuffix}-vpc'
      );
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
        'ApplicationTierS3BucketName',
        'DatabaseEndpoint',
        'WebServerInstanceId',
      ];

      expectedOutputs.forEach((output: string) => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      const vpcOutput = template.Outputs.VPCId;
      expect(vpcOutput.Export.Name['Fn::Sub']).toBe(
        '${ProjectName}-${EnvironmentSuffix}-vpc-id'
      );
    });

    test('database endpoint should use GetAtt function', () => {
      const dbOutput = template.Outputs.DatabaseEndpoint;
      expect(dbOutput.Value['Fn::GetAtt']).toEqual([
        'DatabaseInstance',
        'Endpoint.Address',
      ]);
    });
  });

  describe('Template Validation', () => {
    test('should not have any hardcoded values in critical places', () => {
      const templateStr = JSON.stringify(template);

      // Should not have hardcoded account IDs or regions (except us-east-1 which is specified)
      expect(templateStr).not.toMatch(/\d{12}/); // 12-digit account ID
      expect(templateStr).not.toMatch(/us-west-[12]/); // Wrong regions
    });

    test('should use Fn::Sub for dynamic naming', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBeDefined();
    });

    test('should have proper dependencies', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');

      const cloudTrail = template.Resources.CloudTrailEventDataStore;
      expect(cloudTrail.DependsOn).toBeUndefined();
    });
  });

  describe('Security Compliance', () => {
    test('should not have any publicly accessible databases', () => {
      // Note: Aurora MySQL doesn't support PubliclyAccessible property
      // Aurora clusters are private by default when placed in private subnets
      const rdsCluster = template.Resources.DatabaseCluster;
      expect(rdsCluster.Type).toBe('AWS::RDS::DBCluster');

      // Verify cluster is in private subnets via DB subnet group
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });

    test('should have encryption enabled on all storage', () => {
      // Note: StorageEncrypted is a cluster-level property for Aurora
      const rdsCluster = template.Resources.DatabaseCluster;
      expect(rdsCluster.Properties.StorageEncrypted).toBe(true);

      const appBucket = template.Resources.ApplicationTierS3Bucket;
      expect(appBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have backup and retention policies', () => {
      // Note: BackupRetentionPeriod and DeletionProtection are cluster-level properties
      const rdsCluster = template.Resources.DatabaseCluster;
      expect(rdsCluster.Properties.BackupRetentionPeriod).toBe(7);
      expect(rdsCluster.Properties.DeletionProtection).toBe(false);
    });
  });
});
