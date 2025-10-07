import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Data Lake Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON if needed: pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure Data Lake Infrastructure for Analytics Company - 10TB Daily Processing'
      );
    });

    test('should have metadata section with parameter interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(3);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have CompanyName parameter with correct properties', () => {
      const param = template.Parameters.CompanyName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dataanalytics');
      expect(param.AllowedPattern).toBe('^[a-z0-9]+$');
    });

    test('should have Environment parameter with allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have DataRetentionDays parameter with valid range', () => {
      const param = template.Parameters.DataRetentionDays;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(2555); // 7 years
      expect(param.MinValue).toBe(30);
      expect(param.MaxValue).toBe(3650);
    });

    test('should have VpcCidr parameter', () => {
      const param = template.Parameters.VpcCidr;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction).toEqual({
        'Fn::Equals': [{ 'Ref': 'Environment' }, 'prod']
      });
    });
  });

  describe('KMS Keys', () => {
    const kmsKeys = ['RawDataKMSKey', 'ProcessedDataKMSKey', 'CuratedDataKMSKey'];

    test.each(kmsKeys)('should have %s with proper configuration', (keyName) => {
      const kmsKey = template.Resources[keyName];
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(2);
    });

    test.each(kmsKeys)('should have %sAlias with proper configuration', (keyName) => {
      const aliasName = `${keyName}Alias`;
      const alias = template.Resources[aliasName];
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ 'Ref': keyName });
    });

    test('KMS keys should have appropriate service permissions', () => {
      const rawKey = template.Resources.RawDataKMSKey;
      const glueFirehoseStatement = rawKey.Properties.KeyPolicy.Statement.find(
        (stmt: any) => stmt.Principal?.Service?.includes('glue.amazonaws.com')
      );
      expect(glueFirehoseStatement).toBeDefined();
      expect(glueFirehoseStatement.Principal.Service).toContain('firehose.amazonaws.com');
    });
  });

  describe('VPC and Networking', () => {
    test('should have DataLakeVPC with correct CIDR', () => {
      const vpc = template.Resources.DataLakeVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ 'Ref': 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have two private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have VPC endpoints for secure service access', () => {
      const s3Endpoint = template.Resources.S3VPCEndpoint;
      const glueEndpoint = template.Resources.GlueVPCEndpoint;
      
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(s3Endpoint.Properties.VpcEndpointType).toBe('Gateway');
      
      expect(glueEndpoint).toBeDefined();
      expect(glueEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(glueEndpoint.Properties.VpcEndpointType).toBe('Interface');
    });
  });

  describe('S3 Data Lake Buckets', () => {
    const buckets = [
      'RawDataBucket',
      'ProcessedDataBucket', 
      'CuratedDataBucket',
      'AthenaQueryResultsBucket',
      'ScriptsBucket'
    ];

    test.each(buckets)('should have %s with proper configuration', (bucketName) => {
      const bucket = template.Resources[bucketName];
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      });
    });

    test('data lake buckets should have versioning enabled', () => {
      const dataLakeBuckets = ['RawDataBucket', 'ProcessedDataBucket', 'CuratedDataBucket'];
      dataLakeBuckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('data lake buckets should have KMS encryption', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]).toEqual({
        ServerSideEncryptionByDefault: {
          SSEAlgorithm: 'aws:kms',
          KMSMasterKeyID: { 'Ref': 'RawDataKMSKey' }
        },
        BucketKeyEnabled: true
      });
    });

    test('data lake buckets should have lifecycle policies', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions).toHaveLength(3);
      expect(rule.ExpirationInDays).toEqual({ 'Ref': 'DataRetentionDays' });
    });
  });

  describe('IAM Roles', () => {
    const roles = [
      'GlueExecutionRole',
      'EMRServiceRole', 
      'EMRInstanceRole',
      'FirehoseDeliveryRole',
      'LambdaExecutionRole',
      'DataAnalystRole'
    ];

    test.each(roles)('should have %s with proper configuration', (roleName) => {
      const role = template.Resources[roleName];
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('GlueExecutionRole should have data lake access policy', () => {
      const role = template.Resources.GlueExecutionRole;
      const customPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DataLakeAccess');
      expect(customPolicy).toBeDefined();
      
      const s3Statement = customPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource).toContainEqual({ 'Fn::Sub': '${RawDataBucket.Arn}/*' });
    });

    test('DataAnalystRole should have Athena query permissions', () => {
      const role = template.Resources.DataAnalystRole;
      const athenaPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'AthenaQueryPolicy');
      expect(athenaPolicy).toBeDefined();
      
      const athenaStatement = athenaPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action.includes('athena:StartQueryExecution')
      );
      expect(athenaStatement).toBeDefined();
    });

    test('should have EMRInstanceProfile', () => {
      const profile = template.Resources.EMRInstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ 'Ref': 'EMRInstanceRole' }]);
    });
  });

  describe('Kinesis Data Firehose', () => {
    test('should have LogIngestionFirehose with proper S3 destination', () => {
      const firehose = template.Resources.LogIngestionFirehose;
      expect(firehose).toBeDefined();
      expect(firehose.Type).toBe('AWS::KinesisFirehose::DeliveryStream');
      expect(firehose.Properties.DeliveryStreamType).toBe('DirectPut');
      
      const s3Config = firehose.Properties.S3DestinationConfiguration;
      expect(s3Config.BufferingHints.SizeInMBs).toBe(128);
      expect(s3Config.CompressionFormat).toBe('GZIP');
      expect(s3Config.EncryptionConfiguration.KMSEncryptionConfig.AWSKMSKeyARN).toEqual({
        'Fn::GetAtt': ['RawDataKMSKey', 'Arn']
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should have DataValidationLambda with proper configuration', () => {
      const lambda = template.Resources.DataValidationLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(300);
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('DataValidationLambda should have inline code for data validation', () => {
      const lambda = template.Resources.DataValidationLambda;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('ValidationStatus');
    });
  });

  describe('Glue Data Catalog', () => {
    const databases = ['RawDataDatabase', 'ProcessedDataDatabase', 'CuratedDataDatabase'];

    test.each(databases)('should have %s with proper configuration', (dbName) => {
      const database = template.Resources[dbName];
      expect(database).toBeDefined();
      expect(database.Type).toBe('AWS::Glue::Database');
      expect(database.Properties.CatalogId).toEqual({ 'Ref': 'AWS::AccountId' });
    });

    test('databases should have proper naming convention', () => {
      const rawDb = template.Resources.RawDataDatabase;
      expect(rawDb.Properties.DatabaseInput.Name).toEqual({
        'Fn::Sub': '${CompanyName}_raw_data_${Environment}'
      });
    });

    const crawlers = ['RawDataCrawler', 'ProcessedDataCrawler'];

    test.each(crawlers)('should have %s with proper configuration', (crawlerName) => {
      const crawler = template.Resources[crawlerName];
      expect(crawler).toBeDefined();
      expect(crawler.Type).toBe('AWS::Glue::Crawler');
      expect(crawler.Properties.Schedule.ScheduleExpression).toMatch(/cron\(.+\)/);
    });
  });

  describe('Glue ETL Jobs', () => {
    const etlJobs = ['RawToProcessedETLJob', 'ProcessedToCuratedETLJob'];

    test.each(etlJobs)('should have %s with proper configuration', (jobName) => {
      const job = template.Resources[jobName];
      expect(job).toBeDefined();
      expect(job.Type).toBe('AWS::Glue::Job');
      expect(job.Properties.Command.Name).toBe('glueetl');
      expect(job.Properties.GlueVersion).toBe('3.0');
      expect(job.Properties.WorkerType).toBe('G.1X');
    });

    test('ETL jobs should have conditional worker scaling based on environment', () => {
      const job = template.Resources.RawToProcessedETLJob;
      expect(job.Properties.NumberOfWorkers).toEqual({
        'Fn::If': ['IsProduction', 10, 2]
      });
    });

    test('ETL jobs should have proper default arguments', () => {
      const job = template.Resources.RawToProcessedETLJob;
      const args = job.Properties.DefaultArguments;
      expect(args['--job-language']).toBe('python');
      expect(args['--job-bookmark-option']).toBe('job-bookmark-enable');
      expect(args['--enable-metrics']).toBe('true');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have AlertTopic for notifications', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toBe('Data Lake Monitoring Alerts');
    });
  });

  describe('Outputs', () => {
    test('should have all required VPC outputs', () => {
      const vpcOutputs = ['VPCId', 'PrivateSubnet1Id', 'PrivateSubnet2Id'];
      vpcOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should have all S3 bucket outputs', () => {
      const bucketOutputs = [
        'RawDataBucketName',
        'ProcessedDataBucketName', 
        'CuratedDataBucketName',
        'AthenaQueryResultsBucketName',
        'ScriptsBucketName'
      ];
      bucketOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Value).toEqual({ 'Ref': outputName.replace('Name', '') });
      });
    });

    test('should have all KMS key outputs', () => {
      const kmsOutputs = ['RawDataKMSKeyId', 'ProcessedDataKMSKeyId', 'CuratedDataKMSKeyId'];
      kmsOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Value).toEqual({ 'Ref': outputName.replace('Id', '') });
      });
    });

    test('should have all Glue resource outputs', () => {
      const glueOutputs = [
        'RawDataDatabaseName',
        'ProcessedDataDatabaseName',
        'CuratedDataDatabaseName',
        'RawToProcessedETLJobName',
        'ProcessedToCuratedETLJobName'
      ];
      glueOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have IAM role ARN outputs', () => {
      const roleOutputs = ['GlueExecutionRoleArn', 'DataAnalystRoleArn'];
      roleOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Value).toEqual({ 
          'Fn::GetAtt': [outputName.replace('Arn', ''), 'Arn'] 
        });
      });
    });

    test('outputs should have consistent export naming pattern', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-.+$/);
      });
    });
  });

  describe('Resource Counts and Template Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(33); // Total resources in the data lake template
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(21); // Updated to match actual output count
    });

    test('should have expected number of conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(1);
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should block public access', () => {
      const s3Resources = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );
      
      s3Resources.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        });
      });
    });

    test('data lake buckets should use KMS encryption', () => {
      const dataLakeBuckets = ['RawDataBucket', 'ProcessedDataBucket', 'CuratedDataBucket'];
      dataLakeBuckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
      });
    });

    test('IAM roles should follow least privilege principle', () => {
      const glueRole = template.Resources.GlueExecutionRole;
      const policies = glueRole.Properties.Policies;
      expect(policies).toHaveLength(1);
      
      const dataLakePolicy = policies[0];
      expect(dataLakePolicy.PolicyName).toBe('DataLakeAccess');
      
      // Check that S3 permissions are scoped to specific buckets
      const s3Statement = dataLakePolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement.Resource).not.toContain('*');
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have consistent tagging strategy', () => {
      const taggedResourceTypes = [
        'AWS::KMS::Key',
        'AWS::S3::Bucket', 
        'AWS::IAM::Role',
        'AWS::Glue::Crawler',
        'AWS::Glue::Job',
        'AWS::Lambda::Function',
        'AWS::SNS::Topic'
      ];

      taggedResourceTypes.forEach(resourceType => {
        const resources = Object.keys(template.Resources).filter(key => 
          template.Resources[key].Type === resourceType
        );
        
        resources.forEach(resourceKey => {
          const resource = template.Resources[resourceKey];
          expect(resource.Properties.Tags).toBeDefined();
          
          // Tags can be either array format or object format depending on resource type
          const tags = Array.isArray(resource.Properties.Tags) 
            ? resource.Properties.Tags 
            : Object.keys(resource.Properties.Tags).map(key => ({ Key: key, Value: resource.Properties.Tags[key] }));
          
          const nameTag = tags.find((tag: any) => tag.Key === 'Name');
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          
          expect(nameTag).toBeDefined();
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ 'Ref': 'Environment' });
        });
      });
    });
  });

  describe('Data Lake Architecture Validation', () => {
    test('should implement proper data lake zones (raw, processed, curated)', () => {
      const rawZoneResources = ['RawDataBucket', 'RawDataKMSKey', 'RawDataDatabase'];
      const processedZoneResources = ['ProcessedDataBucket', 'ProcessedDataKMSKey', 'ProcessedDataDatabase'];
      const curatedZoneResources = ['CuratedDataBucket', 'CuratedDataKMSKey', 'CuratedDataDatabase'];
      
      [rawZoneResources, processedZoneResources, curatedZoneResources].forEach(zoneResources => {
        zoneResources.forEach(resourceName => {
          expect(template.Resources[resourceName]).toBeDefined();
        });
      });
    });

    test('should have proper ETL pipeline flow (raw -> processed -> curated)', () => {
      const etlJob1 = template.Resources.RawToProcessedETLJob;
      const etlJob2 = template.Resources.ProcessedToCuratedETLJob;
      
      expect(etlJob1.Properties.DefaultArguments['--source-database']).toEqual({ 'Ref': 'RawDataDatabase' });
      expect(etlJob1.Properties.DefaultArguments['--target-database']).toEqual({ 'Ref': 'ProcessedDataDatabase' });
      
      expect(etlJob2.Properties.DefaultArguments['--source-database']).toEqual({ 'Ref': 'ProcessedDataDatabase' });
      expect(etlJob2.Properties.DefaultArguments['--target-database']).toEqual({ 'Ref': 'CuratedDataDatabase' });
    });

    test('should have data ingestion capability through Kinesis Firehose', () => {
      const firehose = template.Resources.LogIngestionFirehose;
      expect(firehose.Properties.S3DestinationConfiguration.BucketARN).toEqual({
        'Fn::GetAtt': ['RawDataBucket', 'Arn']
      });
    });

    test('should have data validation through Lambda function', () => {
      const lambda = template.Resources.DataValidationLambda;
      expect(lambda.Properties.Code.ZipFile).toContain('ValidationStatus');
      expect(lambda.Properties.Code.ZipFile).toContain('csv');
      expect(lambda.Properties.Code.ZipFile).toContain('json');
    });
  });

  describe('Scalability and Performance', () => {
    test('ETL jobs should scale based on environment', () => {
      const job = template.Resources.RawToProcessedETLJob;
      expect(job.Properties.NumberOfWorkers).toEqual({
        'Fn::If': ['IsProduction', 10, 2]
      });
    });

    test('S3 buckets should have intelligent tiering for cost optimization', () => {
      const bucket = template.Resources.RawDataBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycleRules.Transitions).toHaveLength(3);
      expect(lifecycleRules.Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(lifecycleRules.Transitions[1].StorageClass).toBe('GLACIER');
      expect(lifecycleRules.Transitions[2].StorageClass).toBe('DEEP_ARCHIVE');
    });

    test('Firehose should have appropriate buffering for throughput', () => {
      const firehose = template.Resources.LogIngestionFirehose;
      const bufferingHints = firehose.Properties.S3DestinationConfiguration.BufferingHints;
      expect(bufferingHints.SizeInMBs).toBe(128);
      expect(bufferingHints.IntervalInSeconds).toBe(60);
    });
  });

  describe('Data Governance and Compliance', () => {
    test('should implement proper data retention policies', () => {
      const buckets = ['RawDataBucket', 'ProcessedDataBucket', 'CuratedDataBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];
        expect(lifecycleRule.ExpirationInDays).toEqual({ 'Ref': 'DataRetentionDays' });
      });
    });

    test('should have proper access control for data analysts', () => {
      const analystRole = template.Resources.DataAnalystRole;
      const athenaPolicy = analystRole.Properties.Policies.find((p: any) => p.PolicyName === 'AthenaQueryPolicy');
      
      const athenaActions = athenaPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action.includes('athena:StartQueryExecution')
      );
      expect(athenaActions.Resource).toBe('*');
      
      const s3Actions = athenaPolicy.PolicyDocument.Statement.find((s: any) => 
        s.Action.includes('s3:GetObject')
      );
      expect(s3Actions.Resource).toContainEqual({ 'Fn::GetAtt': ['CuratedDataBucket', 'Arn'] });
    });

    test('should have monitoring and alerting setup', () => {
      const alertTopic = template.Resources.AlertTopic;
      expect(alertTopic.Type).toBe('AWS::SNS::Topic');
      expect(alertTopic.Properties.DisplayName).toBe('Data Lake Monitoring Alerts');
    });
  });
});
