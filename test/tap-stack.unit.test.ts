import fs from 'fs';
import path from 'path';

describe('Secure AWS Infrastructure CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Secure AWS Infrastructure for Production Environment'
      );
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('prod');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe(
        '^[a-zA-Z0-9-]+$'
      );
    });

    test('should have AllowedSSHCIDR parameter', () => {
      expect(template.Parameters.AllowedSSHCIDR).toBeDefined();
      expect(template.Parameters.AllowedSSHCIDR.Type).toBe('String');
      expect(template.Parameters.AllowedSSHCIDR.Default).toBe('10.0.0.0/8');
      expect(template.Parameters.AllowedSSHCIDR.AllowedPattern).toBe(
        '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$'
      );
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t3.micro');
      expect(template.Parameters.InstanceType.AllowedValues).toContain(
        't3.micro'
      );
      expect(template.Parameters.InstanceType.AllowedValues).toContain(
        't3.small'
      );
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe(
        'AWS::EC2::KeyPair::KeyName'
      );
      expect(template.Parameters.KeyPairName.Default).toBe('myapp-keypair');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.SecureVPC.Properties.CidrBlock).toBe(
        '10.0.0.0/16'
      );
      expect(template.Resources.SecureVPC.Properties.EnableDnsHostnames).toBe(
        true
      );
      expect(template.Resources.SecureVPC.Properties.EnableDnsSupport).toBe(
        true
      );
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
      expect(template.Resources.AttachGateway.Properties.VpcId.Ref).toBe(
        'SecureVPC'
      );
      expect(
        template.Resources.AttachGateway.Properties.InternetGatewayId.Ref
      ).toBe('InternetGateway');
    });

    test('should have Public Subnet', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(
        template.Resources.PublicSubnet.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have Private Subnet', () => {
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );
    });

    test('should have Route Table and Routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );

      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(
        template.Resources.PublicRoute.Properties.DestinationCidrBlock
      ).toBe('0.0.0.0/0');

      expect(
        template.Resources.PublicSubnetRouteTableAssociation
      ).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation.Type).toBe(
        'AWS::EC2::SubnetRouteTableAssociation'
      );
    });
  });

  describe('EC2 and Security Resources', () => {
    test('should have Security Group with restricted SSH access', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );

      const ingress =
        template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(22);
      expect(ingress[0].ToPort).toBe(22);
      expect(ingress[0].CidrIp.Ref).toBe('AllowedSSHCIDR');
    });

    test('should have EC2 Instance', () => {
      expect(template.Resources.SecureEC2Instance).toBeDefined();
      expect(template.Resources.SecureEC2Instance.Type).toBe(
        'AWS::EC2::Instance'
      );
      expect(
        template.Resources.SecureEC2Instance.Properties.InstanceType.Ref
      ).toBe('InstanceType');
      expect(template.Resources.SecureEC2Instance.Properties.KeyName.Ref).toBe(
        'KeyPairName'
      );
      expect(template.Resources.SecureEC2Instance.Properties.SubnetId.Ref).toBe(
        'PublicSubnet'
      );
    });

    test('EC2 Instance should have encrypted EBS volume', () => {
      const blockDeviceMappings =
        template.Resources.SecureEC2Instance.Properties.BlockDeviceMappings;
      expect(blockDeviceMappings).toHaveLength(1);
      expect(blockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(blockDeviceMappings[0].Ebs.DeleteOnTermination).toBe(true);
      expect(blockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
      expect(blockDeviceMappings[0].Ebs.VolumeSize).toBe(20);
    });
  });

  describe('IAM Resources', () => {
    test('IAM Role should follow least privilege principle', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe(
        'Allow'
      );
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('ec2.amazonaws.com');

      // Check for minimal S3 access policy
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName['Fn::Sub']).toContain(
        'MinimalS3Access-${EnvironmentSuffix}'
      );

      const statements = policies[0].PolicyDocument.Statement;
      expect(statements).toHaveLength(2);
      expect(statements[0].Action).toContain('s3:GetObject');
      expect(statements[0].Action).toContain('s3:PutObject');
      expect(statements[1].Action).toContain('s3:ListBucket');
    });

    test('should have Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
      expect(
        template.Resources.EC2InstanceProfile.Properties.Roles[0].Ref
      ).toBe('EC2Role');
    });
  });

  describe('S3 Buckets and Encryption', () => {
    test('should have KMS Key for S3 encryption', () => {
      expect(template.Resources.S3KMSKey).toBeDefined();
      expect(template.Resources.S3KMSKey.Type).toBe('AWS::KMS::Key');
      expect(
        template.Resources.S3KMSKey.Properties.Description['Fn::Sub']
      ).toContain(
        'KMS Key for S3 bucket encryption with automatic rotation - ${EnvironmentSuffix}'
      );
    });

    test('should have KMS Key Alias', () => {
      expect(template.Resources.S3KMSKeyAlias).toBeDefined();
      expect(template.Resources.S3KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.S3KMSKeyAlias.Properties.TargetKeyId.Ref).toBe(
        'S3KMSKey'
      );
    });

    test('should have Secure S3 Bucket with encryption and versioning', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');

      // Check encryption
      const encryption =
        template.Resources.SecureS3Bucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe(
        'S3KMSKey'
      );
      expect(encryption.BucketKeyEnabled).toBe(true);

      // Check versioning
      expect(
        template.Resources.SecureS3Bucket.Properties.VersioningConfiguration
          .Status
      ).toBe('Enabled');

      // Check public access block
      const publicAccess =
        template.Resources.SecureS3Bucket.Properties
          .PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 Access Logs Bucket', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
      expect(template.Resources.S3AccessLogsBucket.Type).toBe(
        'AWS::S3::Bucket'
      );

      // Check encryption
      const encryption =
        template.Resources.S3AccessLogsBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );

      // Check public access block (no lifecycle in current template)
      const publicAccess =
        template.Resources.S3AccessLogsBucket.Properties
          .PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have CloudTrail Bucket', () => {
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucket.Type).toBe('AWS::S3::Bucket');

      // Check encryption
      const encryption =
        template.Resources.CloudTrailBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('should have CloudTrail Bucket Policy', () => {
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );

      const statements =
        template.Resources.CloudTrailBucketPolicy.Properties.PolicyDocument
          .Statement;
      expect(statements).toHaveLength(2);
      expect(statements[0].Sid).toBe('AWSCloudTrailAclCheck');
      expect(statements[1].Sid).toBe('AWSCloudTrailWrite');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should have CloudTrail resource', () => {
      expect(template.Resources.SecureCloudTrail).toBeDefined();
      expect(template.Resources.SecureCloudTrail.Type).toBe(
        'AWS::CloudTrail::Trail'
      );
      expect(template.Resources.SecureCloudTrail.DependsOn).toBe(
        'CloudTrailBucketPolicy'
      );
    });

    test('CloudTrail should be properly configured', () => {
      const trail = template.Resources.SecureCloudTrail.Properties;
      expect(trail.S3BucketName.Ref).toBe('CloudTrailBucket');
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.EnableLogFileValidation).toBe(true);
      expect(trail.IsLogging).toBe(true);
    });

    test('CloudTrail should monitor S3 data events', () => {
      const eventSelectors =
        template.Resources.SecureCloudTrail.Properties.EventSelectors;
      expect(eventSelectors).toHaveLength(1);
      expect(eventSelectors[0].ReadWriteType).toBe('All');
      expect(eventSelectors[0].IncludeManagementEvents).toBe(true);
      expect(eventSelectors[0].DataResources[0].Type).toBe('AWS::S3::Object');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include EnvironmentSuffix', () => {
      const namedResources = [
        'SecureVPC',
        'InternetGateway',
        'PublicSubnet',
        'PrivateSubnet',
        'PublicRouteTable',
        'EC2SecurityGroup',
        'EC2Role',
        'EC2InstanceProfile',
        'SecureEC2Instance',
        'S3KMSKey',
        'S3KMSKeyAlias',
        'SecureS3Bucket',
        'S3AccessLogsBucket',
        'CloudTrailBucket',
        'SecureCloudTrail',
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        // Check if resource has name property that includes EnvironmentSuffix
        const props = resource.Properties;
        if (props) {
          const nameProps = [
            'RoleName',
            'InstanceProfileName',
            'TrailName',
            'AliasName',
            'GroupName',
          ];
          const tags = props.Tags;

          // Check direct name properties
          nameProps.forEach(prop => {
            if (props[prop]) {
              if (typeof props[prop] === 'object' && props[prop]['Fn::Sub']) {
                expect(props[prop]['Fn::Sub']).toMatch(
                  /\$\{EnvironmentSuffix\}|\$\{AWS::StackName\}/
                );
              }
            }
          });

          // Check Name tag
          if (tags && Array.isArray(tags)) {
            const nameTag = tags.find((tag: any) => tag.Key === 'Name');
            if (
              nameTag &&
              typeof nameTag.Value === 'object' &&
              nameTag.Value['Fn::Sub']
            ) {
              expect(nameTag.Value['Fn::Sub']).toContain(
                '${EnvironmentSuffix}'
              );
            }
          }
        }
      });
    });
  });

  describe('Tagging Requirements', () => {
    test('all taggable resources should have Environment tag with EnvironmentSuffix', () => {
      const taggableResources = Object.keys(template.Resources).filter(key => {
        return (
          template.Resources[key].Properties &&
          template.Resources[key].Properties.Tags
        );
      });

      expect(taggableResources.length).toBeGreaterThan(0);

      taggableResources.forEach(resourceName => {
        const tags = template.Resources[resourceName].Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value.Ref).toBe('EnvironmentSuffix');
      });
    });
  });

  describe('Deletion Policies', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });

    test('EBS volumes should have DeleteOnTermination set to true', () => {
      const ec2Instance = template.Resources.SecureEC2Instance;
      if (ec2Instance && ec2Instance.Properties.BlockDeviceMappings) {
        ec2Instance.Properties.BlockDeviceMappings.forEach((mapping: any) => {
          if (mapping.Ebs) {
            expect(mapping.Ebs.DeleteOnTermination).toBe(true);
          }
        });
      }
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'EC2InstanceId',
        'EC2PublicIP',
        'S3BucketName',
        'CloudTrailArn',
        'SecurityGroupId',
        'S3KMSKeyId',
        'EC2RoleArn',
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('all outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should block all public access', () => {
      const s3Buckets = [
        'SecureS3Bucket',
        'S3AccessLogsBucket',
        'CloudTrailBucket',
      ];

      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket).toBeDefined();

        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('KMS key should have proper permissions', () => {
      const kmsKey = template.Resources.S3KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;

      // Root account should have full access
      const rootStatement = statements.find(
        (s: any) => s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');

      // S3 service should have limited access
      const s3Statement = statements.find(
        (s: any) => s.Sid === 'Allow S3 Service'
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('kms:Decrypt');
      expect(s3Statement.Action).toContain('kms:GenerateDataKey');
    });

    test('Security group should only allow SSH from specified CIDR', () => {
      const securityGroup = template.Resources.EC2SecurityGroup;
      const ingress = securityGroup.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(22);
      expect(ingress[0].ToPort).toBe(22);
      expect(ingress[0].CidrIp.Ref).toBe('AllowedSSHCIDR');
    });
  });

  describe('Dependencies and References', () => {
    test('CloudTrail should depend on bucket policy', () => {
      expect(template.Resources.SecureCloudTrail.DependsOn).toBe(
        'CloudTrailBucketPolicy'
      );
    });

    test('Public route should depend on gateway attachment', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('All references should be valid', () => {
      // Check that EC2 instance references valid resources
      const ec2Instance = template.Resources.SecureEC2Instance;
      expect(
        template.Parameters[ec2Instance.Properties.KeyName.Ref]
      ).toBeDefined();
      expect(
        template.Resources[ec2Instance.Properties.SubnetId.Ref]
      ).toBeDefined();
      expect(
        template.Resources[ec2Instance.Properties.SecurityGroupIds[0].Ref]
      ).toBeDefined();
      expect(
        template.Resources[ec2Instance.Properties.IamInstanceProfile.Ref]
      ).toBeDefined();
    });
  });
});
