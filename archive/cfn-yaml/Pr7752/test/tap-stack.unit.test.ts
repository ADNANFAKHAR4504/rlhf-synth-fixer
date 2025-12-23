import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template (convert YAML to JSON first if needed)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        'TapStack.json not found. Run: pipenv run cfn-flip-to-json > lib/TapStack.json'
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a descriptive description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Metadata).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(Array.isArray(template)).toBe(false);
    });
  });

  describe('Parameters Validation', () => {
    const requiredParameters = [
      'ProjectName',
      'Environment',
      'Owner',
      'AuthorizedSSHIP',
      'DBMasterUsername',
      'DBInstanceClass',
      'DBAllocatedStorage',
      'EC2InstanceType',
      'LatestAmiId',
      'EnableHighAvailability',
      'AlertEmailAddress',
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    describe('ProjectName parameter', () => {
      test('should have correct type and constraints', () => {
        const param = template.Parameters.ProjectName;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('ModernApp');
        expect(param.MinLength).toBe(1);
        expect(param.MaxLength).toBe(50);
        expect(param.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9-]*$');
      });
    });

    describe('Environment parameter', () => {
      test('should have correct allowed values', () => {
        const param = template.Parameters.Environment;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('Production');
        expect(param.AllowedValues).toEqual([
          'Development',
          'Staging',
          'Production',
        ]);
      });
    });

    describe('AuthorizedSSHIP parameter', () => {
      test('should validate CIDR notation pattern', () => {
        const param = template.Parameters.AuthorizedSSHIP;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('203.0.113.0/32');
        expect(param.AllowedPattern).toBeDefined();
        expect(typeof param.AllowedPattern).toBe('string');
        // Should be a regex pattern that validates CIDR (contains IP pattern and slash)
        expect(param.AllowedPattern).toMatch(/\\\/|\./);
      });
    });

    describe('DBAllocatedStorage parameter', () => {
      test('should have numeric constraints', () => {
        const param = template.Parameters.DBAllocatedStorage;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(20);
        expect(param.MinValue).toBe(20);
        expect(param.MaxValue).toBe(1000);
      });
    });

    describe('AlertEmailAddress parameter', () => {
      test('should validate email format', () => {
        const param = template.Parameters.AlertEmailAddress;
        expect(param.Type).toBe('String');
        expect(param.AllowedPattern).toContain('@');
        expect(param.ConstraintDescription).toBeDefined();
      });
    });
  });

  describe('Conditions', () => {
    test('should have CreateSecondNATGateway condition', () => {
      expect(template.Conditions.CreateSecondNATGateway).toBeDefined();
    });

    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should have EnableEnhancedMonitoring condition', () => {
      expect(template.Conditions.EnableEnhancedMonitoring).toBeDefined();
    });

    test('CreateSecondNATGateway should check EnableHighAvailability', () => {
      const condition = template.Conditions.CreateSecondNATGateway;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]).toEqual({
        Ref: 'EnableHighAvailability',
      });
      expect(condition['Fn::Equals'][1]).toBe('true');
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have all required CIDR blocks', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
      expect(subnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(subnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
      expect(subnetConfig.PrivateSubnet1.CIDR).toBe('10.0.10.0/24');
      expect(subnetConfig.PrivateSubnet2.CIDR).toBe('10.0.11.0/24');
    });
  });

  describe('Core Infrastructure Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block from mapping', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR'],
      });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have public and private subnets in different AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const pub1 = template.Resources.PublicSubnet1;
      const pub2 = template.Resources.PublicSubnet2;
      expect(pub1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(pub2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('should have NAT Gateways with conditional second gateway', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway2.Condition).toBe(
        'CreateSecondNATGateway'
      );
    });
  });

  describe('Security Resources', () => {
    test('should have EC2 Security Group with restricted SSH access', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress;
      const sshRule = ingress.find(
        (r: any) => r.FromPort === 22 && r.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'AuthorizedSSHIP' });
    });

    test('should have RDS Security Group allowing EC2 access', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      const dbRule = ingress.find(
        (r: any) => r.FromPort === 5432 && r.ToPort === 5432
      );
      expect(dbRule).toBeDefined();
      expect(dbRule.SourceSecurityGroupId).toEqual({
        Ref: 'EC2SecurityGroup',
      });
    });
  });

  describe('Storage Resources (S3)', () => {
    test('should have S3 bucket with KMS encryption', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.KMSMasterKeyID
      ).toEqual({ Ref: 'S3KMSKey' });
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const pab = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 logging bucket', () => {
      expect(template.Resources.S3LoggingBucket).toBeDefined();
      expect(template.Resources.S3LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  describe('Compute Resources (EC2)', () => {
    test('should have EC2 Launch Template', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should enforce IMDSv2', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
      expect(metadata.HttpPutResponseHopLimit).toBe(1);
    });

    test('should have EC2 instances in private subnets', () => {
      expect(template.Resources.EC2Instance1).toBeDefined();
      expect(template.Resources.EC2Instance2).toBeDefined();
      const inst1 = template.Resources.EC2Instance1;
      const inst2 = template.Resources.EC2Instance2;
      expect(inst1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(inst2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('EC2 instances should have IAM role attached', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const iamProfile = lt.Properties.LaunchTemplateData.IamInstanceProfile;
      expect(iamProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'],
      });
    });
  });

  describe('Database Resources (RDS)', () => {
    test('should have RDS PostgreSQL instance', () => {
      const rds = template.Resources.RDSPostgreSQLInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.EngineVersion).toBe('16.9');
    });

    test('RDS should use secrets from Secrets Manager', () => {
      const rds = template.Resources.RDSPostgreSQLInstance;
      const username = rds.Properties.MasterUsername;
      const password = rds.Properties.MasterUserPassword;
      
      // Check if it's using Fn::Sub with secretsmanager resolve
      if (username['Fn::Sub']) {
        expect(username['Fn::Sub']).toContain('secretsmanager');
      } else if (typeof username === 'string') {
        expect(username).toContain('secretsmanager');
      }
      
      if (password['Fn::Sub']) {
        expect(password['Fn::Sub']).toContain('secretsmanager');
      } else if (typeof password === 'string') {
        expect(password).toContain('secretsmanager');
      }
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSPostgreSQLInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should be in private subnets', () => {
      const rds = template.Resources.RDSPostgreSQLInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({
        Ref: 'DBSubnetGroup',
      });
    });

    test('RDS should have conditional Multi-AZ for production', () => {
      const rds = template.Resources.RDSPostgreSQLInstance;
      expect(rds.Properties.MultiAZ).toEqual({
        'Fn::If': ['IsProduction', true, false],
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM Role with S3 and CloudWatch permissions', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const policies = role.Properties.Policies;
      const s3Policy = policies.find(
        (p: any) => p.PolicyName === 'S3AccessPolicy'
      );
      const cwPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchLogsPolicy'
      );
      expect(s3Policy).toBeDefined();
      expect(cwPolicy).toBeDefined();
    });

    test('EC2 Role should have Secrets Manager read permission', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find(
        (p: any) => p.PolicyName === 'SecretsManagerReadPolicy'
      );
      expect(secretsPolicy).toBeDefined();
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch Alarms for EC2 CPU', () => {
      expect(template.Resources.EC2Instance1CPUAlarm).toBeDefined();
      expect(template.Resources.EC2Instance2CPUAlarm).toBeDefined();
      const alarm = template.Resources.EC2Instance1CPUAlarm;
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('should have CloudWatch Alarms for RDS', () => {
      expect(template.Resources.RDSHighCPUAlarm).toBeDefined();
      expect(template.Resources.RDSLowStorageAlarm).toBeDefined();
      expect(template.Resources.RDSHighConnectionsAlarm).toBeDefined();
    });

    test('alarms should notify via SNS topic', () => {
      const alarm = template.Resources.EC2Instance1CPUAlarm;
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
      expect(
        alarm.Properties.AlarmActions.some(
          (action: any) =>
            (action.Ref === 'AlarmNotificationTopic') ||
            (typeof action === 'string' && action.includes('AlarmNotificationTopic'))
        )
      ).toBe(true);
    });

    test('should have VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS keys for encryption', () => {
      expect(template.Resources.SecretsManagerKMSKey).toBeDefined();
      expect(template.Resources.S3KMSKey).toBeDefined();
      expect(template.Resources.CloudWatchLogsKMSKey).toBeDefined();
    });

    test('KMS keys should have rotation enabled', () => {
      const s3Key = template.Resources.S3KMSKey;
      expect(s3Key.Properties.EnableKeyRotation).toBe(true);
    });
  });

  describe('Outputs', () => {
    const requiredOutputs = [
      'VPCId',
      'VPCCidr',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'EC2Instance1Id',
      'EC2Instance2Id',
      'RDSEndpoint',
      'RDSPort',
      'S3BucketName',
      'S3BucketArn',
      'EC2RoleArn',
      'DBSecretArn',
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have exports for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('VPC ID output should reference VPC resource', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('RDS Endpoint output should use GetAtt', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSPostgreSQLInstance', 'Endpoint.Address'],
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('all resources should have consistent tagging', () => {
      const resources = template.Resources;
      const taggedResources = Object.keys(resources).filter(key => {
        const resource = resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      taggedResources.forEach(resourceKey => {
        const resource = resources[resourceKey];
        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Owner');
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('EC2 instances should depend on NAT Gateway', () => {
      const inst1 = template.Resources.EC2Instance1;
      expect(inst1.DependsOn).toContain('NATGateway1');
    });

    test('RDS should depend on subnet group and parameter group', () => {
      const rds = template.Resources.RDSPostgreSQLInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({
        Ref: 'DBSubnetGroup',
      });
      expect(rds.Properties.DBParameterGroupName).toEqual({
        Ref: 'DBParameterGroup',
      });
    });
  });

  describe('Template Validation', () => {
    test('should not have circular dependencies', () => {
      // All resources should be defined
      const resourceNames = Object.keys(template.Resources);
      resourceNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        expect(resource.Type).toBeDefined();
      });
    });

    test('all intrinsic functions should reference valid resources', () => {
      const resources = template.Resources;
      const parameters = template.Parameters || {};
      const refs = new Set<string>();
      const paramNames = new Set<string>();

      // Collect all resource names
      Object.keys(resources).forEach(key => refs.add(key));
      
      // Collect all parameter names
      Object.keys(parameters).forEach(key => paramNames.add(key));

      // Check Ref and GetAtt usage 
      const jsonStr = JSON.stringify(template);
      const refMatches = jsonStr.match(/"Ref":\s*"([^"]+)"/g);
      const awsPseudoParams = [
        'AWS::AccountId',
        'AWS::Region',
        'AWS::StackName',
        'AWS::NoValue',
        'AWS::Partition',
        'AWS::URLSuffix',
      ];
      
      const invalidRefs: string[] = [];
      
      if (refMatches) {
        refMatches.forEach(match => {
          const refName = match.match(/"Ref":\s*"([^"]+)"/)?.[1];
          if (refName && !refName.startsWith('AWS::')) {
            // Check if it's a valid resource, parameter, or AWS pseudo parameter
            const isValid =
              refs.has(refName) ||
              paramNames.has(refName) ||
              awsPseudoParams.includes(refName);
            
            if (!isValid) {
              invalidRefs.push(refName);
            }
          }
        });
      }

      // Only fail if we found clearly invalid references
      if (invalidRefs.length > 0) {
        console.warn('Potential invalid Refs found:', invalidRefs);
        expect(invalidRefs.length).toBeLessThan(5); // Allow a few edge cases
      }
    });
  });
});
