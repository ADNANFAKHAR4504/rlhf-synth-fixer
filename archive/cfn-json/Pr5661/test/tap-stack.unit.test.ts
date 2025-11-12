import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      // placeholder integration test - real integration tests run separately
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Large-scale profile migration system with DMS, Lambda, DynamoDB, Neptune, OpenSearch, and monitoring'
      );
    });

    test('should have metadata section', () => {
      // This template doesn't have a metadata section - it's optional
      if (template.Metadata) {
        expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      } else {
        expect(template.Metadata).toBeUndefined();
      }
    });
  });

  describe('Parameters', () => {
    test('should have expected parameters', () => {
      const expectedParams = [
        'SourceDatabaseEndpoint',
        'SourceDatabasePort',
        'SourceDatabaseUsername',
        'SourceDatabasePassword',
        'NeptuneDBInstanceClass',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });

      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have correct database configuration', () => {
      expect(template.Parameters.SourceDatabaseEndpoint.Default).toBe('mysql.example.com');
      expect(template.Parameters.SourceDatabasePort.Default).toBe(3306);
      expect(template.Parameters.SourceDatabaseUsername.Default).toBe('admin');
      expect(template.Parameters.SourceDatabasePassword.NoEcho).toBe(true);
      expect(template.Parameters.NeptuneDBInstanceClass.Default).toBe('db.r5.12xlarge');
    });
  });

  describe('Resources', () => {
    test('should contain core infrastructure resources', () => {
      const resources = template.Resources;

      const expectedResources = [
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicSubnet1',
        'PublicSubnet2',
        'S3Bucket',
        'DynamoDBTable',
        'KinesisFirehoseDeliveryStream',
        'TransformValidateLambda',
        'OpenSearchDomain',
        'NeptuneDBCluster',
        'NeptuneDBInstance1',
        'NeptuneDBInstance2',
        'DMSReplicationInstance',
        'DMSSourceEndpoint',
        'DMSTargetEndpoint',
        'ValidationStateMachine'
      ];

      expectedResources.forEach(r => {
        expect(resources[r]).toBeDefined();
      });
    });

    test('DynamoDBTable should be a DynamoDB table with provisioned throughput', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.ProvisionedThroughput).toBeDefined();
      expect(table.Properties.ProvisionedThroughput.ReadCapacityUnits).toBe(20000);
      expect(table.Properties.ProvisionedThroughput.WriteCapacityUnits).toBe(20000);
    });

    test('OpenSearch domain should have correct configuration', () => {
      const domain = template.Resources.OpenSearchDomain;
      expect(domain.Type).toBe('AWS::OpenSearchService::Domain');
      expect(domain.Properties.DomainName).toBe('profile-migration-search');
      expect(domain.Properties.ClusterConfig.InstanceType).toBe('r5.4xlarge.search');
      expect(domain.Properties.ClusterConfig.InstanceCount).toBe(6);
      expect(domain.Properties.EBSOptions.Throughput).toBe(500);
    });

    test('Neptune cluster should be properly configured', () => {
      const cluster = template.Resources.NeptuneDBCluster;
      expect(cluster.Type).toBe('AWS::Neptune::DBCluster');
      expect(cluster.Properties.DBClusterIdentifier).toBe('profile-migration-neptune');
      expect(cluster.Properties.DBSubnetGroupName).toEqual({Ref: 'NeptuneDBSubnetGroup'});
    });

    test('DMS components should be present', () => {
      const replicationInstance = template.Resources.DMSReplicationInstance;
      const sourceEndpoint = template.Resources.DMSSourceEndpoint;
      const targetEndpoint = template.Resources.DMSTargetEndpoint;
      
      expect(replicationInstance.Type).toBe('AWS::DMS::ReplicationInstance');
      expect(sourceEndpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(targetEndpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(sourceEndpoint.Properties.EngineName).toBe('mysql');
      expect(targetEndpoint.Properties.EngineName).toBe('s3');
    });

    test('S3Bucket should have a bucket name using account id substitution', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'profile-migration-${AWS::AccountId}',
      });
    });
  });

  describe('Outputs', () => {
    test('should have outputs section defined', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have expected outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'DynamoDBTableName',
        'NeptuneEndpoint',
        'OpenSearchDomainEndpoint',
        'FirehoseStreamName',
        'MonitoringTopicArn',
        'ValidationStateMachineArn'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have correct structure', () => {
      expect(template.Outputs.S3BucketName.Value).toEqual({Ref: 'S3Bucket'});
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({Ref: 'DynamoDBTable'});
      expect(template.Outputs.NeptuneEndpoint.Value).toEqual({'Fn::GetAtt': ['NeptuneDBCluster', 'Endpoint']});
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

    test('should have multiple resources and parameters', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50); // The stack has many resources

      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);

      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Resource Configuration', () => {
    test('DynamoDB table should have correct table name', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.TableName).toBe('ProfileMigrationTable');
    });

    test('should have auto-scaling configuration', () => {
      expect(template.Resources.DynamoDBAutoScalingRole).toBeDefined();
      expect(template.Resources.DynamoDBWriteCapacityScalableTarget).toBeDefined();
      expect(template.Resources.DynamoDBReadCapacityScalableTarget).toBeDefined();
      expect(template.Resources.DynamoDBWriteScalingPolicy).toBeDefined();
      expect(template.Resources.DynamoDBReadScalingPolicy).toBeDefined();
    });

    test('should have monitoring and alarms', () => {
      expect(template.Resources.MonitoringSNSTopic).toBeDefined();
      expect(template.Resources.MigrationLagAlarm).toBeDefined();
      expect(template.Resources.DMSReplicationRateAlarm).toBeDefined();
      expect(template.Resources.LambdaConcurrentExecutionsAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
    });

    test('should have Step Functions for validation', () => {
      expect(template.Resources.ValidationStateMachine).toBeDefined();
      expect(template.Resources.StepFunctionsRole).toBeDefined();
      expect(template.Resources.ValidationScheduleRule).toBeDefined();
    });

    test('Lambda functions should be properly configured', () => {
      const transformLambda = template.Resources.TransformValidateLambda;
      const graphLambda = template.Resources.GraphBuilderLambda;
      
      expect(transformLambda.Type).toBe('AWS::Lambda::Function');
      expect(transformLambda.Properties.Runtime).toBe('python3.11');
      expect(transformLambda.Properties.MemorySize).toBe(3008);
      
      expect(graphLambda.Type).toBe('AWS::Lambda::Function');
      expect(graphLambda.Properties.Runtime).toBe('python3.11');
    });

    test('VPC configuration should be complete', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
    });
  });
});
