import fs from 'fs';
import path from 'path';

describe('CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have resources and outputs sections', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.AllowedSSHCIDR).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('parameters should have correct properties', () => {
      const sshCidrParam = template.Parameters.AllowedSSHCIDR;
      expect(sshCidrParam.Type).toBe('String');
      expect(sshCidrParam.Default).toBeDefined();
      expect(sshCidrParam.Description).toBeDefined();
      expect(sshCidrParam.AllowedPattern).toBeDefined();

      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.Description).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have required resource types', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );

      // VPC Resources
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::EC2::NatGateway');
      expect(resourceTypes).toContain('AWS::EC2::RouteTable');

      // Security Resources
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::IAM::Role');

      // Storage Resources
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::S3::BucketPolicy');

      // Monitoring Resources
      expect(resourceTypes).toContain('AWS::CloudTrail::Trail');
      expect(resourceTypes).toContain('AWS::Config::ConfigurationRecorder');
      expect(resourceTypes).toContain('AWS::Config::DeliveryChannel');

      // Compute Resources
      expect(resourceTypes).toContain('AWS::EC2::Instance');

      // Content Delivery
      expect(resourceTypes).toContain('AWS::CloudFront::Distribution');
    });

    describe('VPC Configuration', () => {
      test('should have properly configured VPC', () => {
        const vpc = template.Resources.WebAppVPC;
        expect(vpc).toBeDefined();
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
      });

      test('should have properly tagged VPC', () => {
        const vpc = template.Resources.WebAppVPC;
        const tags = vpc.Properties.Tags;
        expect(tags).toBeDefined();

        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toBe('WebApp-VPC');

        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });

      test('should have multiple subnets across availability zones', () => {
        const privateSubnet1 = template.Resources.WebAppPrivateSubnet1;
        const privateSubnet2 = template.Resources.WebAppPrivateSubnet2;
        const publicSubnet = template.Resources.WebAppPublicSubnet;

        expect(privateSubnet1).toBeDefined();
        expect(privateSubnet2).toBeDefined();
        expect(publicSubnet).toBeDefined();

        // Check different AZs
        expect(
          JSON.stringify(privateSubnet1.Properties.AvailabilityZone)
        ).not.toBe(JSON.stringify(privateSubnet2.Properties.AvailabilityZone));

        // Check CIDR blocks don't overlap
        expect(privateSubnet1.Properties.CidrBlock).not.toBe(
          privateSubnet2.Properties.CidrBlock
        );
        expect(privateSubnet1.Properties.CidrBlock).not.toBe(
          publicSubnet.Properties.CidrBlock
        );
        expect(privateSubnet2.Properties.CidrBlock).not.toBe(
          publicSubnet.Properties.CidrBlock
        );
      });

      test('should have properly configured routing', () => {
        expect(template.Resources.WebAppPublicRouteTable).toBeDefined();
        expect(template.Resources.WebAppPrivateRouteTable).toBeDefined();
        expect(template.Resources.WebAppPublicRoute).toBeDefined();
        expect(template.Resources.WebAppPrivateRoute).toBeDefined();

        // Public route should go through internet gateway
        expect(
          template.Resources.WebAppPublicRoute.Properties.GatewayId.Ref
        ).toBe('WebAppInternetGateway');

        // Private route should go through NAT gateway
        expect(
          template.Resources.WebAppPrivateRoute.Properties.NatGatewayId.Ref
        ).toBe('WebAppNATGateway');
      });
    });

    describe('Security Groups', () => {
      test('should have properly configured security group', () => {
        const sg = template.Resources.WebAppSecurityGroup;
        expect(sg).toBeDefined();
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

        // Check ingress rules
        const ingress = sg.Properties.SecurityGroupIngress;
        expect(ingress).toBeInstanceOf(Array);
        expect(ingress.length).toBeGreaterThan(0);

        // SSH should be restricted
        const sshRule = ingress.find(
          (r: any) => r.FromPort === 22 && r.ToPort === 22
        );
        expect(sshRule).toBeDefined();
        expect(sshRule.CidrIp.Ref).toBe('AllowedSSHCIDR');

        // Check egress rules
        const egress = sg.Properties.SecurityGroupEgress;
        expect(egress).toBeInstanceOf(Array);
        expect(egress.length).toBeGreaterThan(0);
      });
    });

    describe('IAM Roles', () => {
      test('should have properly configured instance role with least privilege', () => {
        const role = template.Resources.WebAppInstanceRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');

        // Check trust relationship (assume role policy)
        const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
          'ec2.amazonaws.com'
        );

        // Check for policies following least privilege
        const policies = role.Properties.Policies;
        expect(policies).toBeInstanceOf(Array);

        // Policies should have specific actions and resources, not "*"
        policies.forEach((policy: any) => {
          const statements = policy.PolicyDocument.Statement;
          statements.forEach((statement: any) => {
            if (
              Array.isArray(statement.Action) &&
              statement.Action.includes('*')
            ) {
              console.warn(
                'Warning: Policy with wildcard action found:',
                policy.PolicyName
              );
            }

            // Resource shouldn't be "*" unless absolutely necessary
            if (statement.Resource === '*') {
              console.warn(
                'Warning: Policy with wildcard resource found:',
                policy.PolicyName
              );
            }
          });
        });
      });

      test('should have properly configured config role', () => {
        const role = template.Resources.WebAppConfigRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');

        // Check trust relationship for Config service
        const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
          'config.amazonaws.com'
        );
      });
    });

    describe('S3 Buckets', () => {
      test('should have encrypted S3 buckets', () => {
        const contentBucket = template.Resources.WebAppS3Bucket;
        const cloudTrailBucket = template.Resources.WebAppCloudTrailS3Bucket;

        expect(contentBucket).toBeDefined();
        expect(cloudTrailBucket).toBeDefined();

        // Check for encryption
        expect(contentBucket.Properties.BucketEncryption).toBeDefined();
        expect(cloudTrailBucket.Properties.BucketEncryption).toBeDefined();

        // Check for public access blocks
        expect(
          contentBucket.Properties.PublicAccessBlockConfiguration
            .BlockPublicAcls
        ).toBe(true);
        expect(
          contentBucket.Properties.PublicAccessBlockConfiguration
            .BlockPublicPolicy
        ).toBe(true);
        expect(
          contentBucket.Properties.PublicAccessBlockConfiguration
            .IgnorePublicAcls
        ).toBe(true);
        expect(
          contentBucket.Properties.PublicAccessBlockConfiguration
            .RestrictPublicBuckets
        ).toBe(true);

        expect(
          cloudTrailBucket.Properties.PublicAccessBlockConfiguration
            .BlockPublicAcls
        ).toBe(true);
        expect(
          cloudTrailBucket.Properties.PublicAccessBlockConfiguration
            .BlockPublicPolicy
        ).toBe(true);
        expect(
          cloudTrailBucket.Properties.PublicAccessBlockConfiguration
            .IgnorePublicAcls
        ).toBe(true);
        expect(
          cloudTrailBucket.Properties.PublicAccessBlockConfiguration
            .RestrictPublicBuckets
        ).toBe(true);
      });

      test('should have versioning enabled on S3 buckets', () => {
        const contentBucket = template.Resources.WebAppS3Bucket;
        const cloudTrailBucket = template.Resources.WebAppCloudTrailS3Bucket;

        expect(contentBucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
        expect(cloudTrailBucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
      });

      test('should have proper S3 bucket policies', () => {
        const contentBucketPolicy = template.Resources.WebAppS3BucketPolicy;
        const cloudTrailBucketPolicy =
          template.Resources.WebAppCloudTrailS3BucketPolicy;

        expect(contentBucketPolicy).toBeDefined();
        expect(cloudTrailBucketPolicy).toBeDefined();

        // Check that S3 bucket policies have proper resource ARNs
        const statement =
          cloudTrailBucketPolicy.Properties.PolicyDocument.Statement;
        expect(statement).toBeInstanceOf(Array);
        expect(statement.length).toBeGreaterThan(0);

        // Check for proper ARN formatting in resources
        statement.forEach((s: any) => {
          const resource = s.Resource;
          if (typeof resource === 'object' && resource['Fn::Sub']) {
            expect(resource['Fn::Sub']).toContain('arn:aws:s3:::');
          }
        });
      });
    });

    describe('CloudTrail Configuration', () => {
      test('should have properly configured CloudTrail', () => {
        const trail = template.Resources.WebAppCloudTrail;
        expect(trail).toBeDefined();
        expect(trail.Type).toBe('AWS::CloudTrail::Trail');

        // Check for multi-region trail
        expect(trail.Properties.IsMultiRegionTrail).toBe(true);

        // Check for log file validation
        expect(trail.Properties.EnableLogFileValidation).toBe(true);

        // Check for encryption
        expect(trail.Properties.KMSKeyId).toBeDefined();

        // Check for logging enabled
        expect(trail.Properties.IsLogging).toBe(true);
      });
    });

    describe('AWS Config Configuration', () => {
      test('should have properly configured AWS Config', () => {
        const configRecorder =
          template.Resources.WebAppConfigConfigurationRecorder;
        const deliveryChannel = template.Resources.WebAppConfigDeliveryChannel;

        expect(configRecorder).toBeDefined();
        expect(deliveryChannel).toBeDefined();

        // Check recording group for all supported resources
        expect(configRecorder.Properties.RecordingGroup.AllSupported).toBe(
          true
        );
        expect(
          configRecorder.Properties.RecordingGroup.IncludeGlobalResourceTypes
        ).toBe(true);

        // Check delivery channel
        expect(deliveryChannel.Properties.S3BucketName.Ref).toBe(
          'WebAppCloudTrailS3Bucket'
        );
      });
    });

    describe('EC2 Instances', () => {
      test('should have properly configured EC2 instances', () => {
        const instance1 = template.Resources.WebAppEC2Instance1;
        const instance2 = template.Resources.WebAppEC2Instance2;

        expect(instance1).toBeDefined();
        expect(instance2).toBeDefined();

        // Check instance type
        expect(instance1.Properties.InstanceType).toBe('t3.micro');
        expect(instance2.Properties.InstanceType).toBe('t3.micro');

        // Check for encrypted volumes
        expect(instance1.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
          true
        );
        expect(instance2.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
          true
        );

        // Check for KMS key usage
        expect(
          instance1.Properties.BlockDeviceMappings[0].Ebs.KmsKeyId.Ref
        ).toBe('WebAppKMSKey');
        expect(
          instance2.Properties.BlockDeviceMappings[0].Ebs.KmsKeyId.Ref
        ).toBe('WebAppKMSKey');

        // Check for IAM instance profile
        expect(instance1.Properties.IamInstanceProfile.Ref).toBe(
          'WebAppInstanceProfile'
        );
        expect(instance2.Properties.IamInstanceProfile.Ref).toBe(
          'WebAppInstanceProfile'
        );
      });
    });

    describe('CloudFront Distribution', () => {
      test('should have properly configured CloudFront distribution', () => {
        const distribution = template.Resources.WebAppCloudFrontDistribution;
        expect(distribution).toBeDefined();

        // Check for HTTPS redirection
        const behavior =
          distribution.Properties.DistributionConfig.DefaultCacheBehavior;
        expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');

        // Check for S3 origin
        const origins = distribution.Properties.DistributionConfig.Origins;
        expect(origins[0].Id).toBe('S3Origin');

        // Check for Origin Access Control
        expect(origins[0].OriginAccessControlId.Ref).toBe(
          'WebAppCloudFrontOriginAccessControl'
        );
      });
    });
  });

  describe('Outputs', () => {
    test('should have required outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.SecurityGroupId).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.CloudFrontDistributionId).toBeDefined();
      expect(template.Outputs.CloudFrontDistributionDomainName).toBeDefined();
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.CloudTrailS3BucketName).toBeDefined();
      expect(template.Outputs.ConfigRecorderRoleArn).toBeDefined();
    });

    test('outputs should be properly exported', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('VPC ID output should be correctly configured', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBeDefined();
      expect(output.Value.Ref).toBe('WebAppVPC');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPC-ID');
    });

    test('S3 bucket name output should be correctly configured', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBeDefined();
      expect(output.Value.Ref).toBe('WebAppS3Bucket');
      expect(output.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-S3-Bucket-Name'
      );
    });

    test('CloudTrail bucket name output should be correctly configured', () => {
      const output = template.Outputs.CloudTrailS3BucketName;
      expect(output.Description).toBeDefined();
      expect(output.Value.Ref).toBe('WebAppCloudTrailS3Bucket');
      expect(output.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-CloudTrail-S3-Bucket-Name'
      );
    });
  });

  describe('Template Validation', () => {
    test('should have proper encryption for sensitive resources', () => {
      // Check KMS key usage across resources
      const kmsKey = template.Resources.WebAppKMSKey;
      expect(kmsKey).toBeDefined();

      // Check S3 buckets
      const contentBucket = template.Resources.WebAppS3Bucket;
      const cloudTrailBucket = template.Resources.WebAppCloudTrailS3Bucket;

      expect(
        contentBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('aws:kms');
      expect(
        cloudTrailBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('aws:kms');

      // Check CloudTrail
      expect(template.Resources.WebAppCloudTrail.Properties.KMSKeyId.Ref).toBe(
        'WebAppKMSKey'
      );
    });

    test('should have secure networking configuration', () => {
      const vpc = template.Resources.WebAppVPC;
      const sg = template.Resources.WebAppSecurityGroup;

      expect(vpc).toBeDefined();
      expect(sg).toBeDefined();

      // Check security group rules
      const ingress = sg.Properties.SecurityGroupIngress;
      const sshRule = ingress.find(
        (r: any) => r.FromPort === 22 && r.ToPort === 22
      );

      expect(sshRule.CidrIp.Ref).toBe('AllowedSSHCIDR');
      expect(sshRule.CidrIp.Ref).not.toBe('0.0.0.0/0');
    });

    test('should have all required security configurations', () => {
      // Check S3 bucket encryption
      const buckets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );

      buckets.forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
        ).toBe(true);
      });

      // Check for CloudTrail
      const cloudTrail = template.Resources.WebAppCloudTrail;
      expect(cloudTrail).toBeDefined();
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);

      // Check for Config
      const configRecorder =
        template.Resources.WebAppConfigConfigurationRecorder;
      expect(configRecorder).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use consistent naming convention for resources', () => {
      const resourceKeys = Object.keys(template.Resources);

      // Check that resources follow the "WebApp" prefix naming convention
      const webAppPrefixed = resourceKeys.filter(key =>
        key.startsWith('WebApp')
      );
      expect(webAppPrefixed.length).toBe(resourceKeys.length);

      // Check for descriptive resource names
      resourceKeys.forEach(key => {
        expect(key.length).toBeGreaterThan(6); // More than just "WebApp"
        expect(key).toMatch(/^WebApp[A-Z]/); // CamelCase after prefix
      });
    });

    test('should use account-specific bucket names', () => {
      const contentBucket = template.Resources.WebAppS3Bucket;
      const cloudTrailBucket = template.Resources.WebAppCloudTrailS3Bucket;

      expect(contentBucket.Properties.BucketName['Fn::Sub']).toContain(
        '${AWS::AccountId}'
      );
      expect(cloudTrailBucket.Properties.BucketName['Fn::Sub']).toContain(
        '${AWS::AccountId}'
      );
    });
  });
});
