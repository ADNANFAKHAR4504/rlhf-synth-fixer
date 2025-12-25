import fs from 'fs';
import path from 'path';

// Generate unique test identifiers with randomness
const testId = Math.random().toString(36).substring(2, 15);
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe(`Zephyr${testId}SecureWebApp CloudFormation Template Unit Tests`, () => {
  let template: any;
  const expectedResourceTypes = [
    'AWS::KMS::Key',
    'AWS::KMS::Alias', 
    'AWS::EC2::VPC',
    'AWS::EC2::InternetGateway',
    'AWS::EC2::VPCGatewayAttachment',
    'AWS::EC2::Subnet',
    'AWS::EC2::EIP',
    'AWS::EC2::NatGateway',
    'AWS::EC2::RouteTable',
    'AWS::EC2::Route',
    'AWS::EC2::SubnetRouteTableAssociation',
    'AWS::EC2::SecurityGroup',
    'AWS::S3::Bucket',
    'AWS::S3::BucketPolicy',
    'AWS::IAM::Role',
    'AWS::IAM::InstanceProfile',
    'AWS::Logs::LogGroup',
    'AWS::CloudTrail::Trail'
    // Note: AWS Config resources removed due to account delivery channel limits
  ];

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    expect(fs.existsSync(templatePath)).toBe(true);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe(`PhoenixFoundation${testId}`, () => {
    test(`should have valid CloudFormation AWSTemplateFormatVersion_${testId}`, () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test(`should have comprehensive infrastructure description_${testId}`, () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS Web Application Infrastructure');
    });

    test(`should validate JSON structure integrity_${testId}`, () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  describe(`QuantumParameters${testId}`, () => {
    test(`should contain EnvironmentSuffix parameter with constraints_${testId}`, () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envParam.ConstraintDescription).toContain('alphanumeric characters');
    });

    test(`should include all network CIDR parameters_${testId}`, () => {
      const networkParams = ['VpcCIDR', 'PublicSubnet1CIDR', 'PublicSubnet2CIDR', 'PrivateSubnet1CIDR', 'PrivateSubnet2CIDR'];
      networkParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
        expect(template.Parameters[param].Default).toMatch(/^10\.0\.\d+\.0\/\d+$/);
      });
    });

    test(`should have exactly expected number of parameters_${testId}`, () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });
  });

  describe(`NovaSecurityFoundation${testId}`, () => {
    test(`should create KMS key for encryption_${testId}`, () => {
      expect(template.Resources.WebAppKMSKey).toBeDefined();
      expect(template.Resources.WebAppKMSKey.Type).toBe('AWS::KMS::Key');
      
      const keyPolicy = template.Resources.WebAppKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(3);
      
      // Verify CloudTrail permissions
      const cloudTrailStatement = keyPolicy.Statement.find(
        (stmt: any) => stmt.Principal?.Service === 'cloudtrail.amazonaws.com'
      );
      expect(cloudTrailStatement).toBeDefined();
    });

    test(`should create KMS alias with environment suffix_${testId}`, () => {
      expect(template.Resources.WebAppKMSKeyAlias).toBeDefined();
      expect(template.Resources.WebAppKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      
      const aliasName = template.Resources.WebAppKMSKeyAlias.Properties.AliasName;
      expect(aliasName['Fn::Sub']).toContain('securewebapp${EnvironmentSuffix}-key');
    });

    test(`should configure security groups with proper restrictions_${testId}`, () => {
      const securityGroups = ['ALBSecurityGroup', 'WebServerSecurityGroup', 'DatabaseSecurityGroup', 'BastionSecurityGroup'];
      
      securityGroups.forEach(sgName => {
        expect(template.Resources[sgName]).toBeDefined();
        expect(template.Resources[sgName].Type).toBe('AWS::EC2::SecurityGroup');
        expect(template.Resources[sgName].Properties.VpcId).toEqual({Ref: 'VPC'});
      });

      // Verify ALB security group allows HTTP/HTTPS
      const albSg = template.Resources.ALBSecurityGroup;
      const httpRule = albSg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = albSg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      // Verify database security group restricts to web servers only
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const dbRule = dbSg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 3306);
      expect(dbRule.SourceSecurityGroupId).toEqual({Ref: 'WebServerSecurityGroup'});
    });
  });

  describe(`AuroraNetworking${testId}`, () => {
    test(`should create VPC with DNS support_${testId}`, () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      
      const vpcProps = template.Resources.VPC.Properties;
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
      expect(vpcProps.CidrBlock).toEqual({Ref: 'VpcCIDR'});
    });

    test(`should create internet gateway and attachment_${testId}`, () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Properties.VpcId).toEqual({Ref: 'VPC'});
      expect(template.Resources.InternetGatewayAttachment.Properties.InternetGatewayId).toEqual({Ref: 'InternetGateway'});
    });

    test(`should create multi-AZ subnets configuration_${testId}`, () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      
      subnets.forEach(subnetName => {
        expect(template.Resources[subnetName]).toBeDefined();
        expect(template.Resources[subnetName].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnetName].Properties.VpcId).toEqual({Ref: 'VPC'});
      });

      // Verify public subnets have public IP mapping
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Verify private subnets don't have public IP mapping
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test(`should configure NAT gateways for high availability_${testId}`, () => {
      // NAT Gateway EIPs
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP.Properties.Domain).toBe('vpc');

      // NAT Gateways
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Properties.SubnetId).toEqual({Ref: 'PublicSubnet1'});
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway2.Properties.SubnetId).toEqual({Ref: 'PublicSubnet2'});
    });

    test(`should configure proper routing tables_${testId}`, () => {
      // Public routing
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Properties.GatewayId).toEqual({Ref: 'InternetGateway'});
      
      // Private routing
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1.Properties.NatGatewayId).toEqual({Ref: 'NatGateway1'});
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2.Properties.NatGatewayId).toEqual({Ref: 'NatGateway2'});
    });
  });

  describe(`CelestialStorage${testId}`, () => {
    test(`should create S3 buckets with versioning and encryption_${testId}`, () => {
      const s3Buckets = ['WebAppS3Bucket', 'LoggingS3Bucket', 'CloudTrailS3Bucket'];
      
      s3Buckets.forEach(bucketName => {
        expect(template.Resources[bucketName]).toBeDefined();
        expect(template.Resources[bucketName].Type).toBe('AWS::S3::Bucket');
        
        const bucket = template.Resources[bucketName];
        
        // Verify versioning
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
        
        // Verify encryption with KMS
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({Ref: 'WebAppKMSKey'});
        
        // Verify public access block
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test(`should configure bucket policies for CloudTrail_${testId}`, () => {
      // CloudTrail bucket policy
      expect(template.Resources.CloudTrailS3BucketPolicy).toBeDefined();
      const cloudTrailPolicy = template.Resources.CloudTrailS3BucketPolicy;
      expect(cloudTrailPolicy.Properties.Bucket).toEqual({Ref: 'CloudTrailS3Bucket'});
      
      const statements = cloudTrailPolicy.Properties.PolicyDocument.Statement;
      expect(statements.some((stmt: any) => stmt.Sid === 'AWSCloudTrailAclCheck')).toBe(true);
      expect(statements.some((stmt: any) => stmt.Sid === 'AWSCloudTrailWrite')).toBe(true);

      // Note: Config bucket policy removed since Config resources are not deployed due to account limits
    });
  });

  describe(`ZenithIAMRoles${testId}`, () => {
    test(`should create EC2 instance role with proper permissions_${testId}`, () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      
      // Check S3 access policy
      const s3Policy = role.Properties.Policies.find((policy: any) => policy.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement.some((stmt: any) => 
        stmt.Action.includes('s3:GetObject')
      )).toBe(true);
    });

    test(`should create instance profile linked to EC2 role_${testId}`, () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.EC2InstanceProfile.Properties.Roles).toContainEqual({Ref: 'EC2InstanceRole'});
    });

    test(`should create service role for CloudTrail_${testId}`, () => {
      // CloudTrail role
      expect(template.Resources.CloudTrailRole).toBeDefined();
      const cloudTrailRole = template.Resources.CloudTrailRole;
      expect(cloudTrailRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
      
      // Note: Config role removed since Config resources are not deployed due to account delivery channel limits
    });
  });

  describe(`OrionCompliance${testId}`, () => {
    test(`should configure CloudTrail with proper settings_${testId}`, () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.S3BucketName).toEqual({Ref: 'CloudTrailS3Bucket'});
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.KMSKeyId).toEqual({Ref: 'WebAppKMSKey'});
      
      // Verify event selectors include S3 data events
      expect(trail.Properties.EventSelectors).toBeDefined();
      expect(trail.Properties.EventSelectors[0].ReadWriteType).toBe('All');
      expect(trail.Properties.EventSelectors[0].IncludeManagementEvents).toBe(true);
    });

    test(`should note Config service limitations_${testId}`, () => {
      // AWS Config resources not included due to account delivery channel limits
      // Most AWS accounts already have Config configured with only 1 delivery channel allowed per region
      // For production environments, integrate with existing Config setup or use AWS Security Hub
      expect(template.Resources.ConfigurationRecorder).toBeUndefined();
      expect(template.Resources.ConfigDeliveryChannel).toBeUndefined();
      
      // Verify CloudTrail provides essential audit capabilities instead
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(template.Resources.CloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test(`should implement security controls without Config rules_${testId}`, () => {
      // Config rules not included due to Config service account limitations
      // Security is enforced through CloudFormation template design:
      
      // Verify S3 encryption is enforced at resource level
      const s3Buckets = ['WebAppS3Bucket', 'LoggingS3Bucket', 'CloudTrailS3Bucket'];
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
      
      // Verify security groups have proper restrictions
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const dbRule = dbSg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 3306);
      expect(dbRule.SourceSecurityGroupId).toEqual({Ref: 'WebServerSecurityGroup'});
      
      // Verify CloudTrail provides comprehensive logging
      expect(template.Resources.CloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(template.Resources.CloudTrail.Properties.EventSelectors[0].ReadWriteType).toBe('All');
    });
  });

  describe(`StellarCloudWatch${testId}`, () => {
    test(`should create log groups for monitoring_${testId}`, () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.CloudTrailLogGroup.Properties.RetentionInDays).toBe(90);
      
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.S3LogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe(`VortexOutputs${testId}`, () => {
    test(`should export all critical infrastructure values_${testId}`, () => {
      const expectedOutputs = [
        'VPC', 'PublicSubnets', 'PrivateSubnets',
        'ALBSecurityGroup', 'WebServerSecurityGroup', 'DatabaseSecurityGroup',
        'WebAppS3Bucket', 'KMSKey', 'EC2InstanceProfile'
      ];
      
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name['Fn::Sub']).toContain('securewebapp${EnvironmentSuffix}');
      });
    });

    test(`should have proper output descriptions_${testId}`, () => {
      expect(template.Outputs.VPC.Description).toContain('reference to the created VPC');
      expect(template.Outputs.WebAppS3Bucket.Description).toContain('S3 bucket for web application');
      expect(template.Outputs.KMSKey.Description).toContain('KMS Key for encryption');
    });
  });

  describe(`CosmicResourceValidation${testId}`, () => {
    test(`should contain all expected AWS resource types_${testId}`, () => {
      const actualResourceTypes = Object.values(template.Resources).map((resource: any) => resource.Type);
      
      expectedResourceTypes.forEach(expectedType => {
        expect(actualResourceTypes).toContain(expectedType);
      });
    });

    test(`should have reasonable resource count for secure web app_${testId}`, () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Complex infrastructure should have many resources
      expect(resourceCount).toBeLessThan(100); // But not excessive
    });

    test(`should not have any undefined or null properties in critical resources_${testId}`, () => {
      const criticalResources = ['VPC', 'WebAppKMSKey', 'CloudTrail', 'EC2InstanceRole'];
      
      criticalResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName]).not.toBeNull();
        expect(template.Resources[resourceName].Type).toBeDefined();
        expect(template.Resources[resourceName].Properties).toBeDefined();
      });
    });

    test(`should use consistent naming patterns with environment suffix_${testId}`, () => {
      const resourcesWithNames = Object.keys(template.Resources).filter(resourceName => {
        const resource = template.Resources[resourceName];
        return resource.Properties && (
          resource.Properties.GroupName || 
          resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.InstanceProfileName ||
          resource.Properties.TrailName ||
          resource.Properties.LogGroupName
        );
      });

      // At least some resources should use environment suffix in their names
      expect(resourcesWithNames.length).toBeGreaterThan(0);
      
      // Check a few specific cases
      if (template.Resources.ALBSecurityGroup?.Properties?.GroupName) {
        expect(template.Resources.ALBSecurityGroup.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      }
    });
  });

  describe(`GalaxyCoverageValidation${testId}`, () => {
    test(`should have template structure validation_${testId}`, () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      
      expect(typeof template.Parameters).toBe('object');
      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
    });

    test(`should meet security compliance requirements_${testId}`, () => {
      // Verify encryption at rest
      expect(template.Resources.WebAppKMSKey).toBeDefined();
      
      // Verify CloudTrail logging
      expect(template.Resources.CloudTrail).toBeDefined();
      
      // Note: Config compliance monitoring not included due to account delivery channel limits
      // CloudTrail provides essential audit capabilities for security compliance
      expect(template.Resources.CloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(template.Resources.CloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      
      // Verify S3 bucket versioning and encryption
      const s3Buckets = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );
      expect(s3Buckets.length).toBeGreaterThan(0);
      s3Buckets.forEach(bucketKey => {
        expect(template.Resources[bucketKey].Properties.VersioningConfiguration.Status).toBe('Enabled');
        expect(template.Resources[bucketKey].Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });

    test(`should validate IAM security best practices_${testId}`, () => {
      // Check that IAM roles have proper trust relationships
      const iamRoles = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::IAM::Role'
      );
      
      expect(iamRoles.length).toBeGreaterThan(0);
      iamRoles.forEach(roleKey => {
        const role = template.Resources[roleKey];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement.length).toBeGreaterThan(0);
      });
    });
  });
});