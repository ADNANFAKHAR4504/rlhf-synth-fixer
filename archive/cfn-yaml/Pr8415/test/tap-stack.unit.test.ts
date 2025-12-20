import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template generated from YAML
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
      expect(template.Description).toContain('Secure AWS infrastructure');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[0].Label.default).toBe('Environment Configuration');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('Security Resources', () => {
    describe('KMS Key', () => {
      test('should have KMS key for encryption', () => {
        expect(template.Resources.InfrastructureKMSKey).toBeDefined();
        expect(template.Resources.InfrastructureKMSKey.Type).toBe('AWS::KMS::Key');
      });

      test('KMS key should have proper key policy', () => {
        const keyPolicy = template.Resources.InfrastructureKMSKey.Properties.KeyPolicy;
        expect(keyPolicy.Version).toBe('2012-10-17');
        expect(keyPolicy.Statement).toHaveLength(2);
        
        // Check root account access
        const rootStatement = keyPolicy.Statement[0];
        expect(rootStatement.Effect).toBe('Allow');
        expect(rootStatement.Action).toBe('kms:*');
        
        // Check service access
        const serviceStatement = keyPolicy.Statement[1];
        expect(serviceStatement.Effect).toBe('Allow');
        expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
        expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
        expect(serviceStatement.Principal.Service).toContain('ec2.amazonaws.com');
      });

      test('should have KMS key alias', () => {
        expect(template.Resources.InfrastructureKMSKeyAlias).toBeDefined();
        expect(template.Resources.InfrastructureKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      });

      test('all KMS resources should have proper tags', () => {
        const kmsKey = template.Resources.InfrastructureKMSKey;
        expect(kmsKey.Properties.Tags).toBeDefined();
        const tags = kmsKey.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Environment', Value: { Ref: 'EnvironmentSuffix' } });
        expect(tags).toContainEqual({ Key: 'Project', Value: 'SecureInfrastructure' });
        expect(tags).toContainEqual({ Key: 'Owner', Value: 'DevOpsTeam' });
      });
    });

    describe('IAM Roles', () => {
      test('should have EC2 instance role', () => {
        expect(template.Resources.EC2InstanceRole).toBeDefined();
        expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      });

      test('EC2 role should follow least privilege principle', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
        expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      });

      test('should have instance profile for EC2 role', () => {
        expect(template.Resources.EC2InstanceProfile).toBeDefined();
        expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
        expect(template.Resources.EC2InstanceProfile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
      });

      test('IAM resources should include environment suffix in names', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        
        const profile = template.Resources.EC2InstanceProfile;
        expect(profile.Properties.InstanceProfileName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    describe('Security Groups', () => {
      test('should have security group for web servers', () => {
        expect(template.Resources.WebServerSecurityGroup).toBeDefined();
        expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should have security group for ALB', () => {
        expect(template.Resources.ALBSecurityGroup).toBeDefined();
        expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should have security group for database', () => {
        expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
        expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('ALB security group should allow HTTPS traffic', () => {
        const sg = template.Resources.ALBSecurityGroup;
        const ingress = sg.Properties.SecurityGroupIngress;
        const httpsRule = ingress.find((r: any) => r.FromPort === 443);
        expect(httpsRule).toBeDefined();
        expect(httpsRule.IpProtocol).toBe('tcp');
        expect(httpsRule.ToPort).toBe(443);
      });

      test('database security group should only allow access from web servers', () => {
        const sg = template.Resources.DatabaseSecurityGroup;
        const ingress = sg.Properties.SecurityGroupIngress;
        expect(ingress).toHaveLength(1);
        expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
        expect(ingress[0].FromPort).toBe(3306);
      });
    });
  });

  describe('Network Resources', () => {
    test('should have VPC', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.SecureVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.SecureVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.SecureVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets for database', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('should have NAT Gateway for private subnet connectivity', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have proper route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
    });

    test('private route should use NAT Gateway', () => {
      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket with encryption', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should use KMS encryption', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'InfrastructureKMSKey' });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 bucket policy enforcing SSL/TLS', () => {
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      const policy = template.Resources.SecureS3BucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('Database Resources', () => {
    test('should have RDS database instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('database should be encrypted with KMS', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'InfrastructureKMSKey' });
    });

    test('database should not be publicly accessible', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('database should have backup configured', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('database should not have deletion protection for cleanup', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DeletionProtection).toBe(false);
      expect(db.DeletionPolicy).toBe('Delete');
    });

    test('should have database subnet group', () => {
      expect(template.Resources.DatabaseSubnetGroup).toBeDefined();
      expect(template.Resources.DatabaseSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have Secrets Manager secret for database password', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'InfrastructureKMSKey' });
    });
  });

  describe('Compute Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have ALB target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.Protocol).toBe('HTTPS');
      expect(tg.Properties.Port).toBe(443);
    });

    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should have encrypted EBS volumes', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      // Uses AWS managed key when KmsKeyId is not specified
      expect(blockDevice.Ebs.KmsKeyId).toBeUndefined();
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });
  });

  describe('Outputs', () => {
    test('should have essential outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.KMSKeyId).toBeDefined();
    });

    test('outputs should have exports for cross-stack references', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have required tags', () => {
      const taggableResources = [
        'InfrastructureKMSKey',
        'SecureVPC',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGateway',
        'DatabaseInstance',
        'SecureS3Bucket',
        'ApplicationLoadBalancer'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const projectTag = tags.find((t: any) => t.Key === 'Project');
          const ownerTag = tags.find((t: any) => t.Key === 'Owner');
          
          expect(envTag).toBeDefined();
          expect(projectTag).toBeDefined();
          expect(ownerTag).toBeDefined();
        }
      });
    });
  });

  describe('SSL/TLS Enforcement', () => {
    test('S3 bucket policy should deny non-SSL connections', () => {
      const policy = template.Resources.SecureS3BucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureConnections');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('ALB target group should use HTTPS', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.Protocol).toBe('HTTPS');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTPS');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('named resources should include environment suffix', () => {
      // Check IAM resources
      const ec2Role = template.Resources.EC2InstanceRole;
      expect(ec2Role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      // Check database
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      // Check S3 bucket
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('all resource references should be valid', () => {
      // Check that Refs point to existing resources
      const checkRefs = (obj: any): void => {
        if (typeof obj === 'object' && obj !== null) {
          if (obj.Ref && typeof obj.Ref === 'string') {
            // Check if it's a parameter or resource
            const isParameter = template.Parameters && template.Parameters[obj.Ref];
            const isResource = template.Resources && template.Resources[obj.Ref];
            const isPseudoParam = obj.Ref.startsWith('AWS::');
            expect(isParameter || isResource || isPseudoParam).toBeTruthy();
          }
          Object.values(obj).forEach(checkRefs);
        }
      };
      
      checkRefs(template.Resources);
    });
  });
});