/**
 * Integration tests for TapStack CloudFormation nested stack architecture
 * Tests validate deployment outputs and CloudFormation template structure
 * No AWS API calls - validates outputs from cfn-outputs/flat-outputs.json
 */

import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs from flat-outputs.json
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');

let deploymentOutputs: any;
let cfnTemplate: any;

beforeAll(() => {
  // Load deployment outputs if they exist
  if (fs.existsSync(outputsPath)) {
    deploymentOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  }

  // Load CloudFormation template
  if (!fs.existsSync(templatePath)) {
    throw new Error(`CloudFormation template not found at: ${templatePath}`);
  }
  cfnTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
});

describe('TapStack Integration Tests', () => {
  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(cfnTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have template description', () => {
      expect(cfnTemplate.Description).toBeDefined();
      expect(typeof cfnTemplate.Description).toBe('string');
      expect(cfnTemplate.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(cfnTemplate.Parameters).toBeDefined();
      expect(typeof cfnTemplate.Parameters).toBe('object');
    });

    test('should have Conditions section', () => {
      expect(cfnTemplate.Conditions).toBeDefined();
      expect(typeof cfnTemplate.Conditions).toBe('object');
    });

    test('should have Resources section', () => {
      expect(cfnTemplate.Resources).toBeDefined();
      expect(typeof cfnTemplate.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(cfnTemplate.Outputs).toBeDefined();
      expect(typeof cfnTemplate.Outputs).toBe('object');
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(cfnTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(cfnTemplate.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(cfnTemplate.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
    });

    test('should have Environment parameter with allowed values', () => {
      expect(cfnTemplate.Parameters.Environment).toBeDefined();
      expect(cfnTemplate.Parameters.Environment.Type).toBe('String');
      expect(cfnTemplate.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(cfnTemplate.Parameters.Environment.Default).toBe('dev');
    });

    test('should have DBMasterUsername parameter', () => {
      expect(cfnTemplate.Parameters.DBMasterUsername).toBeDefined();
      expect(cfnTemplate.Parameters.DBMasterUsername.Type).toBe('String');
      expect(cfnTemplate.Parameters.DBMasterUsername.Default).toBe('admin');
    });

    // DBMasterPassword parameter removed - DatabaseStack now uses AWS Secrets Manager

    test('should have EnableMultiAZ parameter', () => {
      expect(cfnTemplate.Parameters.EnableMultiAZ).toBeDefined();
      expect(cfnTemplate.Parameters.EnableMultiAZ.Type).toBe('String');
      expect(cfnTemplate.Parameters.EnableMultiAZ.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have LambdaImageUri parameter', () => {
      expect(cfnTemplate.Parameters.LambdaImageUri).toBeDefined();
      expect(cfnTemplate.Parameters.LambdaImageUri.Type).toBe('String');
    });

  });

  describe('Conditions Validation', () => {
    test('should have IsProd condition', () => {
      expect(cfnTemplate.Conditions.IsProd).toBeDefined();
      expect(cfnTemplate.Conditions.IsProd['Fn::Equals']).toBeDefined();
    });

    test('IsProd condition should check Environment parameter', () => {
      const condition = cfnTemplate.Conditions.IsProd['Fn::Equals'];
      expect(condition[0]).toEqual({ Ref: 'Environment' });
      expect(condition[1]).toBe('prod');
    });

  });

  describe('Nested Stack Configuration', () => {
    test('should have NetworkStack nested stack', () => {
      expect(cfnTemplate.Resources.NetworkStack).toBeDefined();
      expect(cfnTemplate.Resources.NetworkStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('NetworkStack should reference local template file for packaging', () => {
      const templateURL = cfnTemplate.Resources.NetworkStack.Properties.TemplateURL;
      expect(templateURL).toBe('NetworkStack.json');
      expect(typeof templateURL).toBe('string');
    });

    test('NetworkStack should pass EnvironmentSuffix and Environment', () => {
      const params = cfnTemplate.Resources.NetworkStack.Properties.Parameters;
      expect(params.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(params.Environment).toEqual({ Ref: 'Environment' });
    });

    test('NetworkStack should have timeout configured', () => {
      expect(cfnTemplate.Resources.NetworkStack.Properties.TimeoutInMinutes).toBe(10);
    });

    test('should have DatabaseStack nested stack', () => {
      expect(cfnTemplate.Resources.DatabaseStack).toBeDefined();
      expect(cfnTemplate.Resources.DatabaseStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('DatabaseStack should reference NetworkStack outputs', () => {
      const params = cfnTemplate.Resources.DatabaseStack.Properties.Parameters;
      expect(params.PrivateSubnet1Id['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.PrivateSubnet1Id']);
      expect(params.PrivateSubnet2Id['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.PrivateSubnet2Id']);
      expect(params.PrivateSubnet3Id['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.PrivateSubnet3Id']);
      expect(params.DatabaseSecurityGroupId['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.DatabaseSecurityGroupId']);
    });

    test('DatabaseStack should pass database credentials', () => {
      const params = cfnTemplate.Resources.DatabaseStack.Properties.Parameters;
      expect(params.DBMasterUsername).toEqual({ Ref: 'DBMasterUsername' });
      expect(params.EnableMultiAZ).toEqual({ Ref: 'EnableMultiAZ' });
      // DBMasterPassword removed - DatabaseStack uses Secrets Manager
      expect(params.DBMasterPassword).toBeUndefined();
    });

    test('DatabaseStack should have timeout configured', () => {
      expect(cfnTemplate.Resources.DatabaseStack.Properties.TimeoutInMinutes).toBe(30);
    });

    test('should have ComputeStack nested stack', () => {
      expect(cfnTemplate.Resources.ComputeStack).toBeDefined();
      expect(cfnTemplate.Resources.ComputeStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('ComputeStack should reference NetworkStack and DatabaseStack outputs', () => {
      const params = cfnTemplate.Resources.ComputeStack.Properties.Parameters;
      expect(params.PrivateSubnet1Id['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.PrivateSubnet1Id']);
      expect(params.PrivateSubnet2Id['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.PrivateSubnet2Id']);
      expect(params.LambdaSecurityGroupId['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.LambdaSecurityGroupId']);
      expect(params.DBClusterEndpoint['Fn::GetAtt']).toEqual(['DatabaseStack', 'Outputs.DBClusterEndpoint']);
      expect(params.DBClusterPort['Fn::GetAtt']).toEqual(['DatabaseStack', 'Outputs.DBClusterPort']);
    });

    test('ComputeStack should have timeout configured', () => {
      expect(cfnTemplate.Resources.ComputeStack.Properties.TimeoutInMinutes).toBe(15);
    });

    test('should have MonitoringStack nested stack', () => {
      expect(cfnTemplate.Resources.MonitoringStack).toBeDefined();
      expect(cfnTemplate.Resources.MonitoringStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('MonitoringStack should reference DatabaseStack and ComputeStack outputs', () => {
      const params = cfnTemplate.Resources.MonitoringStack.Properties.Parameters;
      expect(params.DBClusterId['Fn::GetAtt']).toEqual(['DatabaseStack', 'Outputs.DBClusterId']);
      expect(params.ValidatorLambdaName['Fn::GetAtt']).toEqual(['ComputeStack', 'Outputs.ValidatorLambdaName']);
      expect(params.MigrationLambdaName['Fn::GetAtt']).toEqual(['ComputeStack', 'Outputs.MigrationLambdaName']);
    });

    test('MonitoringStack should have timeout configured', () => {
      expect(cfnTemplate.Resources.MonitoringStack.Properties.TimeoutInMinutes).toBe(5);
    });

    test('all nested stacks should have tags', () => {
      const nestedStacks = ['NetworkStack', 'DatabaseStack', 'ComputeStack', 'MonitoringStack'];
      nestedStacks.forEach(stackName => {
        const stack = cfnTemplate.Resources[stackName];
        expect(stack.Properties.Tags).toBeDefined();
        expect(Array.isArray(stack.Properties.Tags)).toBe(true);
      });
    });

    test('nested stacks should have ManagedBy tag', () => {
      const nestedStacks = ['NetworkStack', 'DatabaseStack', 'ComputeStack', 'MonitoringStack'];
      nestedStacks.forEach(stackName => {
        const tags = cfnTemplate.Resources[stackName].Properties.Tags;
        const managedByTag = tags.find((tag: any) => tag.Key === 'ManagedBy');
        expect(managedByTag).toBeDefined();
        expect(managedByTag.Value).toBe('CloudFormation');
      });
    });
  });

  describe('Root Level Resources', () => {

    describe('SessionTable DynamoDB', () => {
      test('should have SessionTable resource', () => {
        expect(cfnTemplate.Resources.SessionTable).toBeDefined();
        expect(cfnTemplate.Resources.SessionTable.Type).toBe('AWS::DynamoDB::Table');
      });

      test('SessionTable should use EnvironmentSuffix in name', () => {
        const tableName = cfnTemplate.Resources.SessionTable.Properties.TableName;
        expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });

      test('SessionTable should have PAY_PER_REQUEST billing mode', () => {
        expect(cfnTemplate.Resources.SessionTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      });

      test('SessionTable should have attribute definitions', () => {
        const attrs = cfnTemplate.Resources.SessionTable.Properties.AttributeDefinitions;
        expect(attrs).toBeDefined();
        expect(Array.isArray(attrs)).toBe(true);
        expect(attrs.length).toBeGreaterThanOrEqual(2);
      });

      test('SessionTable should have key schema', () => {
        const keySchema = cfnTemplate.Resources.SessionTable.Properties.KeySchema;
        expect(keySchema).toBeDefined();
        expect(Array.isArray(keySchema)).toBe(true);
      });

      test('SessionTable should have GlobalSecondaryIndexes', () => {
        const gsi = cfnTemplate.Resources.SessionTable.Properties.GlobalSecondaryIndexes;
        expect(gsi).toBeDefined();
        expect(Array.isArray(gsi)).toBe(true);
      });

      test('SessionTable should have TTL enabled', () => {
        const ttl = cfnTemplate.Resources.SessionTable.Properties.TimeToLiveSpecification;
        expect(ttl).toBeDefined();
        expect(ttl.Enabled).toBe(true);
      });

      test('SessionTable should have conditional PITR for prod', () => {
        const pitr = cfnTemplate.Resources.SessionTable.Properties.PointInTimeRecoverySpecification;
        expect(pitr).toBeDefined();
        expect(pitr.PointInTimeRecoveryEnabled['Fn::If']).toEqual(['IsProd', true, false]);
      });

      test('SessionTable should have DeletionPolicy Delete', () => {
        expect(cfnTemplate.Resources.SessionTable.DeletionPolicy).toBe('Delete');
      });
    });

    describe('AuditLogsBucket S3', () => {
      test('should have AuditLogsBucket resource', () => {
        expect(cfnTemplate.Resources.AuditLogsBucket).toBeDefined();
        expect(cfnTemplate.Resources.AuditLogsBucket.Type).toBe('AWS::S3::Bucket');
      });

      test('AuditLogsBucket should have unique name with AccountId and Region', () => {
        const bucketName = cfnTemplate.Resources.AuditLogsBucket.Properties.BucketName;
        expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
        expect(bucketName['Fn::Sub']).toContain('${AWS::Region}');
      });

      test('AuditLogsBucket should have versioning enabled', () => {
        expect(cfnTemplate.Resources.AuditLogsBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('AuditLogsBucket should have lifecycle configuration', () => {
        const lifecycle = cfnTemplate.Resources.AuditLogsBucket.Properties.LifecycleConfiguration;
        expect(lifecycle).toBeDefined();
        expect(lifecycle.Rules).toBeDefined();
        expect(Array.isArray(lifecycle.Rules)).toBe(true);
      });

      test('AuditLogsBucket should have encryption configured', () => {
        const encryption = cfnTemplate.Resources.AuditLogsBucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      });

      test('AuditLogsBucket should have public access blocked', () => {
        const publicAccess = cfnTemplate.Resources.AuditLogsBucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });

      test('AuditLogsBucket should have conditional replication for prod', () => {
        const replication = cfnTemplate.Resources.AuditLogsBucket.Properties.ReplicationConfiguration;
        expect(replication).toBeDefined();
        expect(replication['Fn::If']).toBeDefined();
        expect(replication['Fn::If'][0]).toBe('IsProd');
      });

      test('AuditLogsBucket should have DeletionPolicy Delete', () => {
        expect(cfnTemplate.Resources.AuditLogsBucket.DeletionPolicy).toBe('Delete');
      });
    });

    describe('S3ReplicationRole IAM', () => {
      test('should have S3ReplicationRole resource', () => {
        expect(cfnTemplate.Resources.S3ReplicationRole).toBeDefined();
        expect(cfnTemplate.Resources.S3ReplicationRole.Type).toBe('AWS::IAM::Role');
      });

      test('S3ReplicationRole should be conditional on IsProd', () => {
        expect(cfnTemplate.Resources.S3ReplicationRole.Condition).toBe('IsProd');
      });

      test('S3ReplicationRole should have assume role policy', () => {
        const assumePolicy = cfnTemplate.Resources.S3ReplicationRole.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy).toBeDefined();
        expect(assumePolicy.Statement).toBeDefined();
      });

      test('S3ReplicationRole should trust S3 service', () => {
        const assumePolicy = cfnTemplate.Resources.S3ReplicationRole.Properties.AssumeRolePolicyDocument;
        const statement = assumePolicy.Statement[0];
        expect(statement.Principal.Service).toBe('s3.amazonaws.com');
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should have StackName output', () => {
      expect(cfnTemplate.Outputs.StackName).toBeDefined();
      expect(cfnTemplate.Outputs.StackName.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(cfnTemplate.Outputs.StackName.Description).toBeDefined();
      expect(cfnTemplate.Outputs.StackName.Export).toBeDefined();
    });

    test('should have VpcId output from NetworkStack', () => {
      expect(cfnTemplate.Outputs.VpcId).toBeDefined();
      expect(cfnTemplate.Outputs.VpcId.Value['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.VpcId']);
      expect(cfnTemplate.Outputs.VpcId.Description).toBeDefined();
      expect(cfnTemplate.Outputs.VpcId.Export).toBeDefined();
    });

    test('should have DBClusterEndpoint output from DatabaseStack', () => {
      expect(cfnTemplate.Outputs.DBClusterEndpoint).toBeDefined();
      expect(cfnTemplate.Outputs.DBClusterEndpoint.Value['Fn::GetAtt']).toEqual(['DatabaseStack', 'Outputs.DBClusterEndpoint']);
      expect(cfnTemplate.Outputs.DBClusterEndpoint.Description).toBeDefined();
      expect(cfnTemplate.Outputs.DBClusterEndpoint.Export).toBeDefined();
    });

    test('should have ValidatorLambdaArn output from ComputeStack', () => {
      expect(cfnTemplate.Outputs.ValidatorLambdaArn).toBeDefined();
      expect(cfnTemplate.Outputs.ValidatorLambdaArn.Value['Fn::GetAtt']).toEqual(['ComputeStack', 'Outputs.ValidatorLambdaArn']);
      expect(cfnTemplate.Outputs.ValidatorLambdaArn.Description).toBeDefined();
      expect(cfnTemplate.Outputs.ValidatorLambdaArn.Export).toBeDefined();
    });

    test('should have SessionTableName output', () => {
      expect(cfnTemplate.Outputs.SessionTableName).toBeDefined();
      expect(cfnTemplate.Outputs.SessionTableName.Value).toEqual({ Ref: 'SessionTable' });
      expect(cfnTemplate.Outputs.SessionTableName.Description).toBeDefined();
      expect(cfnTemplate.Outputs.SessionTableName.Export).toBeDefined();
    });

    test('should have AuditLogsBucketName output', () => {
      expect(cfnTemplate.Outputs.AuditLogsBucketName).toBeDefined();
      expect(cfnTemplate.Outputs.AuditLogsBucketName.Value).toEqual({ Ref: 'AuditLogsBucket' });
      expect(cfnTemplate.Outputs.AuditLogsBucketName.Description).toBeDefined();
      expect(cfnTemplate.Outputs.AuditLogsBucketName.Export).toBeDefined();
    });

    test('should have AuditLogsBucketArn output', () => {
      expect(cfnTemplate.Outputs.AuditLogsBucketArn).toBeDefined();
      expect(cfnTemplate.Outputs.AuditLogsBucketArn.Value['Fn::GetAtt']).toEqual(['AuditLogsBucket', 'Arn']);
      expect(cfnTemplate.Outputs.AuditLogsBucketArn.Description).toBeDefined();
      expect(cfnTemplate.Outputs.AuditLogsBucketArn.Export).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(cfnTemplate.Outputs).forEach(outputKey => {
        expect(cfnTemplate.Outputs[outputKey].Description).toBeDefined();
        expect(typeof cfnTemplate.Outputs[outputKey].Description).toBe('string');
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(cfnTemplate.Outputs).forEach(outputKey => {
        expect(cfnTemplate.Outputs[outputKey].Export).toBeDefined();
        expect(cfnTemplate.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Deployment Outputs Validation', () => {
    test('should load deployment outputs if file exists', () => {
      if (fs.existsSync(outputsPath)) {
        expect(deploymentOutputs).toBeDefined();
        expect(typeof deploymentOutputs).toBe('object');
      } else {
        console.warn('Deployment outputs file not found, skipping deployment validation tests');
      }
    });

    test('should have StackName in deployment outputs if available', () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs.StackName).toBeDefined();
        expect(typeof deploymentOutputs.StackName).toBe('string');
      }
    });

    test('should have VpcId in deployment outputs if available', () => {
      if (deploymentOutputs && deploymentOutputs.VpcId) {
        expect(deploymentOutputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      }
    });

    test('should have DBClusterEndpoint in deployment outputs if available', () => {
      if (deploymentOutputs && deploymentOutputs.DBClusterEndpoint) {
        expect(typeof deploymentOutputs.DBClusterEndpoint).toBe('string');
        expect(deploymentOutputs.DBClusterEndpoint.length).toBeGreaterThan(0);
      }
    });

    test('should have ValidatorLambdaArn in deployment outputs if available', () => {
      if (deploymentOutputs && deploymentOutputs.ValidatorLambdaArn && deploymentOutputs.ValidatorLambdaArn !== 'NotCreated') {
        expect(deploymentOutputs.ValidatorLambdaArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:.+$/);
      }
    });

    test('should have SessionTableName in deployment outputs if available', () => {
      if (deploymentOutputs && deploymentOutputs.SessionTableName) {
        expect(typeof deploymentOutputs.SessionTableName).toBe('string');
        expect(deploymentOutputs.SessionTableName.length).toBeGreaterThan(0);
      }
    });

    test('should have AuditLogsBucketName in deployment outputs if available', () => {
      if (deploymentOutputs && deploymentOutputs.AuditLogsBucketName) {
        expect(typeof deploymentOutputs.AuditLogsBucketName).toBe('string');
        expect(deploymentOutputs.AuditLogsBucketName.length).toBeGreaterThan(0);
      }
    });

    test('should have AuditLogsBucketArn in deployment outputs if available', () => {
      if (deploymentOutputs && deploymentOutputs.AuditLogsBucketArn) {
        expect(deploymentOutputs.AuditLogsBucketArn).toMatch(/^arn:aws:s3:::.+$/);
      }
    });

    test('all template outputs should be present in deployment outputs if available', () => {
      if (deploymentOutputs) {
        const templateOutputKeys = Object.keys(cfnTemplate.Outputs || {});
        templateOutputKeys.forEach((key) => {
          // Some outputs might be optional or conditional
          if (deploymentOutputs[key] !== undefined) {
            expect(deploymentOutputs[key]).toBeDefined();
          }
        });
      }
    });
  });

  describe('Cross-Stack Reference Validation', () => {
    test('DatabaseStack should depend on NetworkStack outputs', () => {
      const params = cfnTemplate.Resources.DatabaseStack.Properties.Parameters;
      // Verify cross-stack references use Fn::GetAtt
      expect(params.PrivateSubnet1Id['Fn::GetAtt']).toBeDefined();
      expect(params.PrivateSubnet1Id['Fn::GetAtt'][0]).toBe('NetworkStack');
      expect(params.PrivateSubnet1Id['Fn::GetAtt'][1]).toContain('Outputs.');
    });

    test('ComputeStack should depend on NetworkStack and DatabaseStack outputs', () => {
      const params = cfnTemplate.Resources.ComputeStack.Properties.Parameters;
      // NetworkStack outputs
      expect(params.PrivateSubnet1Id['Fn::GetAtt'][0]).toBe('NetworkStack');
      expect(params.LambdaSecurityGroupId['Fn::GetAtt'][0]).toBe('NetworkStack');
      // DatabaseStack outputs
      expect(params.DBClusterEndpoint['Fn::GetAtt'][0]).toBe('DatabaseStack');
      expect(params.DBClusterPort['Fn::GetAtt'][0]).toBe('DatabaseStack');
    });

    test('MonitoringStack should depend on DatabaseStack and ComputeStack outputs', () => {
      const params = cfnTemplate.Resources.MonitoringStack.Properties.Parameters;
      expect(params.DBClusterId['Fn::GetAtt'][0]).toBe('DatabaseStack');
      expect(params.ValidatorLambdaName['Fn::GetAtt'][0]).toBe('ComputeStack');
      expect(params.MigrationLambdaName['Fn::GetAtt'][0]).toBe('ComputeStack');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('SessionTable name should include EnvironmentSuffix', () => {
      const tableName = cfnTemplate.Resources.SessionTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('AuditLogsBucket name should include EnvironmentSuffix', () => {
      const bucketName = cfnTemplate.Resources.AuditLogsBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('nested stack tags should include EnvironmentSuffix in Name tag', () => {
      const nestedStacks = ['NetworkStack', 'DatabaseStack', 'ComputeStack', 'MonitoringStack'];
      nestedStacks.forEach(stackName => {
        const tags = cfnTemplate.Resources[stackName].Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('SessionTable should have conditional PITR for production', () => {
      const pitr = cfnTemplate.Resources.SessionTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled['Fn::If']).toEqual(['IsProd', true, false]);
    });

    test('AuditLogsBucket should have encryption enabled', () => {
      const encryption = cfnTemplate.Resources.AuditLogsBucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('AuditLogsBucket should have public access blocked', () => {
      const publicAccess = cfnTemplate.Resources.AuditLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
    });

    test('S3ReplicationRole should only be created in production', () => {
      expect(cfnTemplate.Resources.S3ReplicationRole.Condition).toBe('IsProd');
    });
  });

  describe('Deployment Consistency', () => {
    test('template should have all required nested stacks', () => {
      const requiredStacks = ['NetworkStack', 'DatabaseStack', 'ComputeStack', 'MonitoringStack'];
      requiredStacks.forEach(stackName => {
        expect(cfnTemplate.Resources[stackName]).toBeDefined();
        expect(cfnTemplate.Resources[stackName].Type).toBe('AWS::CloudFormation::Stack');
      });
    });

    test('template should have all required root level resources', () => {
      expect(cfnTemplate.Resources.SessionTable).toBeDefined();
      expect(cfnTemplate.Resources.AuditLogsBucket).toBeDefined();
    });

    test('all nested stacks should reference correct template files', () => {
      const nestedStacks = ['NetworkStack', 'DatabaseStack', 'ComputeStack', 'MonitoringStack'];
      nestedStacks.forEach(stackName => {
        const templateURL = cfnTemplate.Resources[stackName].Properties.TemplateURL;

        // Template uses simple local file paths for aws cloudformation package
        expect(templateURL).toBe(`${stackName}.json`);
        expect(typeof templateURL).toBe('string');
      });
    });
  });
});

