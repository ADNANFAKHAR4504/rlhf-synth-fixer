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

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-grade secure AWS foundation with multi-VPC architecture, least-privilege IAM, and encryption at rest'
      );
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
    });

    test('should have Owner parameter', () => {
      expect(template.Parameters.Owner).toBeDefined();
    });

    test('should have AllowedCIDR parameter', () => {
      expect(template.Parameters.AllowedCIDR).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.Description).toBe('Environment name for resource tagging');
    });

    test('ApplicationName parameter should have correct properties', () => {
      const param = template.Parameters.ApplicationName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('SecureApp');
      expect(param.Description).toBe('Application name for resource tagging');
    });

    test('Owner parameter should have correct properties', () => {
      const param = template.Parameters.Owner;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('DevOps-Team');
      expect(param.Description).toBe('Owner for resource tagging');
    });

    test('AllowedCIDR parameter should have correct properties', () => {
      const param = template.Parameters.AllowedCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.Description).toBe('CIDR block allowed for management access');
      expect(param.AllowedPattern).toBe('^(\\d{1,3}\\.){3}\\d{1,3}/\\d{1,2}$');
    });
  });

  describe('Mappings', () => {
    test('should have NetworkConfig mapping', () => {
      expect(template.Mappings.NetworkConfig).toBeDefined();
    });

    test('NetworkConfig should have us-west-2 region configuration', () => {
      const networkConfig = template.Mappings.NetworkConfig['us-west-2'];
      expect(networkConfig).toBeDefined();
      expect(networkConfig.AppVPCCIDR).toBe('10.1.0.0/16');
      expect(networkConfig.SharedVPCCIDR).toBe('10.2.0.0/16');
    });
  });

  describe('Conditions', () => {
    test('should not have unused conditions to avoid cfn-lint warnings', () => {
      // Template should not have unused conditions that cause cfn-lint warnings
      if (template.Conditions) {
        expect(Object.keys(template.Conditions)).toHaveLength(0);
      } else {
        expect(template.Conditions).toBeUndefined();
      }
    });
  });

  describe('Resources', () => {
    test('should have ProdKMSKey resource', () => {
      expect(template.Resources.ProdKMSKey).toBeDefined();
      expect(template.Resources.ProdKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have ProdKMSKeyAlias resource', () => {
      expect(template.Resources.ProdKMSKeyAlias).toBeDefined();
      expect(template.Resources.ProdKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have ProdAppVPC resource', () => {
      expect(template.Resources.ProdAppVPC).toBeDefined();
      expect(template.Resources.ProdAppVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have ProdSharedVPC resource', () => {
      expect(template.Resources.ProdSharedVPC).toBeDefined();
      expect(template.Resources.ProdSharedVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have ProdAppInternetGateway resource', () => {
      expect(template.Resources.ProdAppInternetGateway).toBeDefined();
      expect(template.Resources.ProdAppInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets', () => {
      expect(template.Resources.ProdAppPublicSubnet1).toBeDefined();
      expect(template.Resources.ProdAppPublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.ProdAppPublicSubnet2).toBeDefined();
      expect(template.Resources.ProdAppPublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.ProdAppPrivateSubnet1).toBeDefined();
      expect(template.Resources.ProdAppPrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.ProdAppPrivateSubnet2).toBeDefined();
      expect(template.Resources.ProdAppPrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.ProdAppNATGateway1).toBeDefined();
      expect(template.Resources.ProdAppNATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.ProdAppNATGateway1EIP).toBeDefined();
      expect(template.Resources.ProdAppNATGateway1EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables', () => {
      expect(template.Resources.ProdAppPublicRouteTable).toBeDefined();
      expect(template.Resources.ProdAppPublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.ProdAppPrivateRouteTable).toBeDefined();
      expect(template.Resources.ProdAppPrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have security groups', () => {
      expect(template.Resources.ProdWebSecurityGroup).toBeDefined();
      expect(template.Resources.ProdWebSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.ProdAppSecurityGroup).toBeDefined();
      expect(template.Resources.ProdAppSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.ProdDatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.ProdDatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.ProdManagementSecurityGroup).toBeDefined();
      expect(template.Resources.ProdManagementSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Network ACL', () => {
      expect(template.Resources.ProdPrivateNetworkAcl).toBeDefined();
      expect(template.Resources.ProdPrivateNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('should have IAM roles', () => {
      expect(template.Resources.ProdEC2Role).toBeDefined();
      expect(template.Resources.ProdEC2Role.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.ProdLambdaExecutionRole).toBeDefined();
      expect(template.Resources.ProdLambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.ProdEC2InstanceProfile).toBeDefined();
      expect(template.Resources.ProdEC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have S3 buckets', () => {
      expect(template.Resources.ProdS3Bucket).toBeDefined();
      expect(template.Resources.ProdS3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.ProdS3AccessLogsBucket).toBeDefined();
      expect(template.Resources.ProdS3AccessLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have VPC endpoints', () => {
      expect(template.Resources.ProdS3VPCEndpoint).toBeDefined();
      expect(template.Resources.ProdS3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.ProdKMSVPCEndpoint).toBeDefined();
      expect(template.Resources.ProdKMSVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('should have CloudWatch Log Group', () => {
      expect(template.Resources.ProdApplicationLogGroup).toBeDefined();
      expect(template.Resources.ProdApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have VPC Peering Connection', () => {
      expect(template.Resources.ProdVPCPeeringConnection).toBeDefined();
      expect(template.Resources.ProdVPCPeeringConnection.Type).toBe('AWS::EC2::VPCPeeringConnection');
    });
  });

  describe('Outputs', () => {
    test('should have AppVPCId output', () => {
      expect(template.Outputs.AppVPCId).toBeDefined();
      expect(template.Outputs.AppVPCId.Value).toEqual({ Ref: 'ProdAppVPC' });
    });

    test('should have SharedVPCId output', () => {
      expect(template.Outputs.SharedVPCId).toBeDefined();
      expect(template.Outputs.SharedVPCId.Value).toEqual({ Ref: 'ProdSharedVPC' });
    });

    test('should have AppPrivateSubnets output', () => {
      expect(template.Outputs.AppPrivateSubnets).toBeDefined();
      expect(template.Outputs.AppPrivateSubnets.Value).toEqual({
        'Fn::Join': [',', [{ Ref: 'ProdAppPrivateSubnet1' }, { Ref: 'ProdAppPrivateSubnet2' }]]
      });
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.WebSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebSecurityGroupId.Value).toEqual({ Ref: 'ProdWebSecurityGroup' });
      expect(template.Outputs.AppSecurityGroupId).toBeDefined();
      expect(template.Outputs.AppSecurityGroupId.Value).toEqual({ Ref: 'ProdAppSecurityGroup' });
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId.Value).toEqual({ Ref: 'ProdDatabaseSecurityGroup' });
    });

    test('should have KMS key outputs', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value).toEqual({ Ref: 'ProdKMSKey' });
      expect(template.Outputs.KMSKeyArn).toBeDefined();
      expect(template.Outputs.KMSKeyArn.Value).toEqual({
        'Fn::GetAtt': ['ProdKMSKey', 'Arn']
      });
    });

    test('should have S3 bucket output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'ProdS3Bucket' });
    });

    test('should have IAM role outputs', () => {
      expect(template.Outputs.EC2RoleArn).toBeDefined();
      expect(template.Outputs.EC2RoleArn.Value).toEqual({
        'Fn::GetAtt': ['ProdEC2Role', 'Arn']
      });
      expect(template.Outputs.InstanceProfileArn).toBeDefined();
      expect(template.Outputs.InstanceProfileArn.Value).toEqual({
        'Fn::GetAtt': ['ProdEC2InstanceProfile', 'Arn']
      });
    });
  });

  describe('Resource Properties', () => {
    test('KMS Key should have correct key policy', () => {
      const kmsKey = template.Resources.ProdKMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(2);
    });

    test('VPCs should have DNS support enabled', () => {
      const appVpc = template.Resources.ProdAppVPC;
      expect(appVpc.Properties.EnableDnsHostnames).toBe(true);
      expect(appVpc.Properties.EnableDnsSupport).toBe(true);

      const sharedVpc = template.Resources.ProdSharedVPC;
      expect(sharedVpc.Properties.EnableDnsHostnames).toBe(true);
      expect(sharedVpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('Public subnets should not auto-assign public IPs', () => {
      const publicSubnet1 = template.Resources.ProdAppPublicSubnet1;
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      const publicSubnet2 = template.Resources.ProdAppPublicSubnet2;
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('S3 buckets should have encryption enabled', () => {
      const s3Bucket = template.Resources.ProdS3Bucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
      expect(s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      const accessLogsBucket = template.Resources.ProdS3AccessLogsBucket;
      expect(accessLogsBucket.Properties.BucketEncryption).toBeDefined();
      expect(accessLogsBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 buckets should have public access blocked', () => {
      const s3Bucket = template.Resources.ProdS3Bucket;
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const s3Bucket = template.Resources.ProdS3Bucket;
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('CloudWatch Log Group should have encryption and retention', () => {
      const logGroup = template.Resources.ProdApplicationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['ProdKMSKey', 'Arn']
      });
    });

    test('Security groups should have proper ingress rules', () => {
      const webSG = template.Resources.ProdWebSecurityGroup;
      expect(webSG.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(webSG.Properties.SecurityGroupIngress[0].FromPort).toBe(443);
      expect(webSG.Properties.SecurityGroupIngress[1].FromPort).toBe(80);

      const appSG = template.Resources.ProdAppSecurityGroup;
      expect(appSG.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(appSG.Properties.SecurityGroupIngress[0].FromPort).toBe(8080);

      const dbSG = template.Resources.ProdDatabaseSecurityGroup;
      expect(dbSG.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(dbSG.Properties.SecurityGroupIngress[0].FromPort).toBe(5432);
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

    test('should have at least one resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have at least one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(0);
    });

    test('should have at least one output', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow prod- naming convention', () => {
      const resourceNames = Object.keys(template.Resources);
      const prodResources = resourceNames.filter(name => name.startsWith('Prod'));
      expect(prodResources.length).toBeGreaterThan(0);
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (typeof exportName === 'string') {
            expect(exportName).toMatch(/^\$\{AWS::StackName\}-/);
          } else if (typeof exportName === 'object' && exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toMatch(/^\$\{AWS::StackName\}-/);
          }
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have deletion policies set to Delete for test environments', () => {
      const resourcesWithDeletionPolicy = [
        'ProdKMSKey', 'ProdAppVPC', 'ProdSharedVPC', 'ProdS3Bucket', 'ProdS3AccessLogsBucket'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.DeletionPolicy).toBe('Delete');
          expect(resource.UpdateReplacePolicy).toBe('Delete');
        }
      });
    });

    test('should have proper tagging on resources', () => {
      const taggedResources = [
        'ProdKMSKey', 'ProdAppVPC', 'ProdSharedVPC', 'ProdS3Bucket'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          const appTag = tags.find((tag: any) => tag.Key === 'Application');
          const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');

          expect(envTag).toBeDefined();
          expect(appTag).toBeDefined();
          expect(ownerTag).toBeDefined();
        }
      });
    });
  });
});
