import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the template for testing
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
        'Secure and compliant AWS production environment with EC2, S3, RDS, Elasticsearch, Lambda, IAM, CloudWatch, and Parameter Store'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have all required network parameters', () => {
      const expectedParams = [
        'VpcCidr',
        'PublicSubnetCidr',
        'PrivateSubnetCidr1',
        'PrivateSubnetCidr2',
        'AllowedSSHCidr',
        'AllowedHTTPCidr',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
      });
    });

    test('should have instance configuration parameters', () => {
      expect(template.Parameters.EC2InstanceType).toBeDefined();
      expect(template.Parameters.RDSInstanceClass).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have web server security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('web server security group should allow SSH and HTTP', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(3); // SSH, HTTP, HTTPS

      const sshRule = ingress.find((rule: any) => rule.FromPort === 22);
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('should have database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have elasticsearch security group', () => {
      expect(template.Resources.ElasticsearchSecurityGroup).toBeDefined();
      expect(template.Resources.ElasticsearchSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });
  });

  describe('Database Configuration Parameters', () => {
    test('should have database username parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.Default).toBe('admin');
      expect(template.Parameters.DBMasterUsername.AllowedPattern).toBeDefined();
    });

    test('should have RDS master secret for secure password management', () => {
      expect(template.Resources.RDSMasterSecret).toBeDefined();
      expect(template.Resources.RDSMasterSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );
      expect(
        template.Resources.RDSMasterSecret.Properties.GenerateSecretString
      ).toBeDefined();
      expect(
        template.Resources.RDSMasterSecret.Properties.GenerateSecretString
          .PasswordLength
      ).toBe(16);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have CloudWatch and SSM policies', () => {
      const role = template.Resources.EC2Role;
      const managedPolicies = role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration;

      expect(encryption).toBeDefined();
      expect(encryption[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('EC2 Resources', () => {
    test('should have latest AMI lookup', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
    });

    test('should have EC2 instance', () => {
      expect(template.Resources.EC2Instance).toBeDefined();
      expect(template.Resources.EC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instance should have monitoring enabled', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.Monitoring).toBe(true);
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe(
        'AWS::RDS::DBSubnetGroup'
      );
    });

    test('should have RDS instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should be Multi-AZ', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('RDS instance should have storage encrypted', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS instance should not have deletion protection', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('RDS instance should use Secrets Manager for password management', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.ManageMasterUserPassword).toBe(true);
      expect(rds.Properties.MasterUserSecret).toBeDefined();
      expect(rds.Properties.MasterUserSecret.SecretArn.Ref).toBe(
        'RDSMasterSecret'
      );
      expect(rds.Properties.MasterUserPassword).toBeUndefined();
    });
  });

  describe('OpenSearch Resources', () => {
    test('should have OpenSearch domain', () => {
      expect(template.Resources.OpenSearchDomain).toBeDefined();
      expect(template.Resources.OpenSearchDomain.Type).toBe(
        'AWS::OpenSearchService::Domain'
      );
    });

    test('OpenSearch should have encryption enabled', () => {
      const domain = template.Resources.OpenSearchDomain;
      expect(domain.Properties.EncryptionAtRestOptions.Enabled).toBe(true);
      expect(domain.Properties.NodeToNodeEncryptionOptions.Enabled).toBe(true);
    });

    test('OpenSearch should enforce HTTPS', () => {
      const domain = template.Resources.OpenSearchDomain;
      expect(domain.Properties.DomainEndpointOptions.EnforceHTTPS).toBe(true);
    });

    test('OpenSearch should have fine-grained access control', () => {
      const domain = template.Resources.OpenSearchDomain;
      expect(domain.Properties.AdvancedSecurityOptions.Enabled).toBe(true);
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda function', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      expect(template.Resources.LambdaFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources.EC2LogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup).toBeDefined();
    });

    test('should have CloudWatch alarm', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.HighCPUAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'EC2InstanceId',
        'EC2PublicIP',
        'S3BucketName',
        'RDSEndpoint',
        'OpenSearchDomainEndpoint',
        'LambdaFunctionArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names with stack name prefix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have Environment tag set to Production', () => {
      const resourcesWithTags = [
        'VPC',
        'InternetGateway',
        'PublicSubnet',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGatewayEIP',
        'NatGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'ElasticsearchSecurityGroup',
        'EC2Role',
        'LambdaExecutionRole',
        'S3Bucket',
        'EC2Instance',
        'DBSubnetGroup',
        'RDSInstance',
        'OpenSearchDomain',
        'LambdaFunction',
        'EC2LogGroup',
        'LambdaLogGroup',
        'HighCPUAlarm',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
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

    test('should have multiple resources for complete infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(10);
    });

    test('should have multiple outputs for integration', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const resourcesWithNaming = [
        {
          resource: 'VPC',
          property: 'Tags',
          name: 'TapStack${EnvironmentSuffix}-vpc',
        },
        {
          resource: 'S3Bucket',
          property: 'BucketName',
          name: 'tapstack${EnvironmentSuffix}-secure-bucket-${AWS::AccountId}',
        },
        {
          resource: 'RDSInstance',
          property: 'DBInstanceIdentifier',
          name: 'tapstack${EnvironmentSuffix}-database',
        },
        {
          resource: 'OpenSearchDomain',
          property: 'DomainName',
          name: 'tapstack${EnvironmentSuffix}-os-domain',
        },
      ];

      resourcesWithNaming.forEach(({ resource, property, name }) => {
        const res = template.Resources[resource];
        if (property === 'Tags') {
          const nameTag = res.Properties.Tags.find(
            (tag: any) => tag.Key === 'Name'
          );
          expect(nameTag.Value).toEqual({ 'Fn::Sub': name });
        } else {
          expect(res.Properties[property]).toEqual({ 'Fn::Sub': name });
        }
      });
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

  describe('Security Best Practices', () => {
    test('all resources should have deletion policies for cleanup', () => {
      const resourcesWithDeletionPolicy = Object.keys(
        template.Resources
      ).filter(key => {
        const resource = template.Resources[key];
        return resource.DeletionPolicy === 'Delete';
      });

      // Most resources should have Delete policies for QA cleanup
      expect(resourcesWithDeletionPolicy.length).toBeGreaterThan(15);
    });

    test('security groups should not allow unrestricted access on sensitive ports', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSG.Properties.SecurityGroupIngress;

      // Database should only allow access from web security group, not 0.0.0.0/0
      ingress.forEach((rule: any) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
        expect(rule.SourceSecurityGroupId).toBeDefined();
      });
    });
  });
});
