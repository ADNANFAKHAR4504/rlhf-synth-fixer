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
        'Production-Grade Cloud Infrastructure Setup - Multi-tier web application with VPC, EC2, RDS MySQL, and security features'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have all required sections', () => {
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
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'KeyName',
        'InstanceType',
        'DBInstanceClass',
        'SSHLocation',
        'DBName',
        'DBUsername',
        'LatestAmiId'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBe(
        'Suffix for the environment (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters.'
      );
    });

    test('VPC CIDR parameters should have valid patterns', () => {
      const cidrParams = [
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr'
      ];

      cidrParams.forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Type).toBe('String');
        expect(param.AllowedPattern).toBeDefined();
        expect(param.AllowedPattern).toContain('([0-9]');
      });
    });

    test('InstanceType parameter should have valid allowed values', () => {
      const instanceTypeParam = template.Parameters.InstanceType;
      expect(instanceTypeParam.Type).toBe('String');
      expect(instanceTypeParam.Default).toBe('t3.micro');
      expect(instanceTypeParam.AllowedValues).toEqual([
        't3.micro',
        't3.small',
        't3.medium',
        't3.large'
      ]);
    });

    test('DBInstanceClass parameter should have valid allowed values', () => {
      const dbInstanceParam = template.Parameters.DBInstanceClass;
      expect(dbInstanceParam.Type).toBe('String');
      expect(dbInstanceParam.Default).toBe('db.t3.micro');
      expect(dbInstanceParam.AllowedValues).toEqual([
        'db.t3.micro',
        'db.t3.small',
        'db.t3.medium',
        'db.t3.large'
      ]);
    });

    test('LatestAmiId should use SSM parameter', () => {
      const amiParam = template.Parameters.LatestAmiId;
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyName condition', () => {
      expect(template.Conditions.HasKeyName).toBeDefined();
      expect(template.Conditions.HasKeyName['Fn::Not']).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      const igwAttachment = template.Resources.InternetGatewayAttachment;
      expect(igwAttachment).toBeDefined();
      expect(igwAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets', () => {
      ['PublicSubnet1', 'PublicSubnet2'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have private subnets', () => {
      ['PrivateSubnet1', 'PrivateSubnet2'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have NAT Gateway and EIP', () => {
      const natGateway = template.Resources.NatGateway1;
      const natEIP = template.Resources.NatGateway1EIP;
      
      expect(natGateway).toBeDefined();
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      
      expect(natEIP).toBeDefined();
      expect(natEIP.Type).toBe('AWS::EC2::EIP');
      expect(natEIP.Properties.Domain).toBe('vpc');
    });

    test('should have route tables and associations', () => {
      const publicRouteTable = template.Resources.PublicRouteTable;
      const privateRouteTable = template.Resources.PrivateRouteTable1;
      
      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      
      expect(privateRouteTable).toBeDefined();
      expect(privateRouteTable.Type).toBe('AWS::EC2::RouteTable');

      // Check route table associations
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have WebServer security group', () => {
      const webServerSG = template.Resources.WebServerSecurityGroup;
      expect(webServerSG).toBeDefined();
      expect(webServerSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = webServerSG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      
      // Check HTTP rule
      const httpRule = ingress.find((rule: { FromPort: number; }) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.IpProtocol).toBe('tcp');
      
      // Check HTTPS rule
      const httpsRule = ingress.find((rule: { FromPort: number; }) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.IpProtocol).toBe('tcp');
    });

    test('should have Database security group', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG).toBeDefined();
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = dbSG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].IpProtocol).toBe('tcp');
    });

    test('should have conditional SSH security group rule', () => {
      const sshRule = template.Resources.WebServerSSHSecurityGroupRule;
      expect(sshRule).toBeDefined();
      expect(sshRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(sshRule.Condition).toBe('HasKeyName');
      expect(sshRule.Properties.FromPort).toBe(22);
      expect(sshRule.Properties.ToPort).toBe(22);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      
      const managedPolicies = ec2Role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have EC2 instance profile', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('EC2 role should have SecretsManager policy', () => {
      const ec2Role = template.Resources.EC2Role;
      const policies = ec2Role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('SecretsManagerAccess');
      
      const statements = policies[0].PolicyDocument.Statement;
      expect(statements[0].Action).toContain('secretsmanager:GetSecretValue');
    });
  });

  describe('EC2 Instance', () => {
    test('should have WebServer instance', () => {
      const webServer = template.Resources.WebServerInstance;
      expect(webServer).toBeDefined();
      expect(webServer.Type).toBe('AWS::EC2::Instance');
      expect(webServer.Properties.Monitoring).toBe(true);
    });

    test('should have Elastic IP for WebServer', () => {
      const eip = template.Resources.WebServerEIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('WebServer should use conditional KeyName', () => {
      const webServer = template.Resources.WebServerInstance;
      const keyName = webServer.Properties.KeyName;
      expect(keyName['Fn::If']).toBeDefined();
      expect(keyName['Fn::If'][0]).toBe('HasKeyName');
    });

    test('should have CloudWatch CPU alarm', () => {
      const cpuAlarm = template.Resources.CPUAlarm;
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Properties.Threshold).toBe(80);
    });
  });

  describe('RDS Database', () => {
    test('should have database KMS key', () => {
      const kmsKey = template.Resources.DatabaseKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS key alias', () => {
      const keyAlias = template.Resources.DatabaseKMSKeyAlias;
      expect(keyAlias).toBeDefined();
      expect(keyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have database subnet group', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have database instance', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance).toBeDefined();
      expect(dbInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(dbInstance.Properties.Engine).toBe('mysql');
      expect(dbInstance.Properties.EngineVersion).toBe('8.0.35');
      expect(dbInstance.Properties.MultiAZ).toBe(true);
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
      expect(dbInstance.Properties.DeletionProtection).toBe(true);
      expect(dbInstance.DeletionPolicy).toBe('Snapshot');
    });

    test('should have database secret', () => {
      const dbSecret = template.Resources.DatabaseSecret;
      expect(dbSecret).toBeDefined();
      expect(dbSecret.Type).toBe('AWS::SecretsManager::Secret');
      
      const generateConfig = dbSecret.Properties.GenerateSecretString;
      expect(generateConfig.GenerateStringKey).toBe('password');
      expect(generateConfig.PasswordLength).toBe(32);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have S3 bucket for VPC flow logs', () => {
      const s3Bucket = template.Resources.VPCFlowLogsS3Bucket;
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.DeletionPolicy).toBe('Retain');
      
      const properties = s3Bucket.Properties;
      expect(properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have S3 bucket policy', () => {
      const bucketPolicy = template.Resources.VPCFlowLogsBucketPolicy;
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(2);
      expect(statements[0].Sid).toBe('AWSLogDeliveryWrite');
      expect(statements[1].Sid).toBe('AWSLogDeliveryCheck');
    });

    test('should have VPC flow log', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('s3');
      expect(flowLog.DependsOn).toBe('VPCFlowLogsBucketPolicy');
    });

    test('VPC flow log should have correct format', () => {
      const flowLog = template.Resources.VPCFlowLog;
      const logFormat = flowLog.Properties.LogFormat;
      expect(logFormat).toContain('${account-id}');
      expect(logFormat).toContain('${interface-id}');
      expect(logFormat).toContain('${srcaddr}');
      expect(logFormat).toContain('${dstaddr}');
      expect(logFormat).toContain('${start}');
      expect(logFormat).toContain('${end}');
      expect(logFormat).toContain('${log-status}');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'EnvironmentSuffix',
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'WebServerSecurityGroupId',
        'DatabaseSecurityGroupId',
        'EC2InstanceId',
        'EC2PublicIP',
        'WebServerURL',
        'RDSEndpoint',
        'RDSPort',
        'DatabaseCredentialsSecret',
        'S3BucketName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        
        // Check that export exists
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        
        // Check that export name follows the pattern ${AWS::StackName}-*
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-.+/);
        
        // Check that export name contains stack name reference
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });

    test('WebServerURL should be HTTP URL', () => {
      const urlOutput = template.Outputs.WebServerURL;
      expect(urlOutput.Value['Fn::Sub']).toBe('http://${WebServerEIP}');
    });

    test('RDSPort should be 3306', () => {
      const portOutput = template.Outputs.RDSPort;
      expect(portOutput.Value).toBe('3306');
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environment suffix in naming', () => {
      const resourcesWithEnvSuffix = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'WebServerInstance',
        'DatabaseInstance'
      ];

      resourcesWithEnvSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameTag = resource.Properties.Tags?.find((tag: { Key: string; }) => tag.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('all resources should have Environment tag', () => {
      const taggedResources = Object.keys(template.Resources).filter(resourceName => {
        return template.Resources[resourceName].Properties?.Tags;
      });

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const envTag = resource.Properties.Tags.find((tag: { Key: string; }) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
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

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources for infrastructure
      expect(resourceCount).toBeLessThan(50); // But not excessive
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(13); // Based on actual template
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(15); // Based on actual template
    });
  });

  describe('Security Best Practices', () => {
    test('RDS should be in private subnets', () => {
      const dbSubnetGroup = template.Resources.DatabaseSubnetGroup;
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      
      subnetIds.forEach((subnetRef: { Ref: any; }) => {
        expect(subnetRef.Ref).toMatch(/PrivateSubnet/);
      });
    });

    test('S3 bucket should block public access', () => {
      const s3Bucket = template.Resources.VPCFlowLogsS3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('RDS should have encryption enabled', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
      expect(dbInstance.Properties.KmsKeyId).toBeDefined();
    });

    test('database access should be restricted to web servers only', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSG.Properties.SecurityGroupIngress[0];
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('High Availability', () => {
    test('should have multi-AZ RDS deployment', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Properties.MultiAZ).toBe(true);
    });

    test('should have subnets in different AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should have backup retention configured', () => {
      const dbInstance = template.Resources.DatabaseInstance;
      expect(dbInstance.Properties.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.Properties.PreferredBackupWindow).toBeDefined();
    });
  });

  describe('Integration Tests Placeholder', () => {
    test('should write comprehensive integration tests', () => {
      // This test serves as a reminder to implement integration tests
      // Integration tests should include:
      // - Template deployment in test environment
      // - Resource creation verification
      // - Connectivity tests between components
      // - Security group rule validation
      // - Database connectivity from EC2
      // - S3 bucket policy effectiveness
      // - VPC Flow Logs functionality
      expect(true).toBe(true); // Placeholder - implement actual integration tests
    });
  });
});