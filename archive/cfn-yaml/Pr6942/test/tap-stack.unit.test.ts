import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON version of the template (converted from YAML using cfn-flip)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description matching requirements', () => {
      expect(template.Description).toContain('Production-grade automated EMR-based data processing pipeline');
      expect(template.Description).toContain('financial transaction fraud detection');
      expect(template.Description).toContain('Region-agnostic deployment');
    });

    test('should have metadata with interface configuration', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(5);
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter with correct constraints', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('should have ProjectName parameter with validation', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('emr-pipeline');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(20);
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]*$');
    });

    test('should have VpcCidr with pattern validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toMatch(/^.*\[0-9\].*\/.*$/);
    });

    test('should have EMR configuration parameters with boundaries', () => {
      const releaseParam = template.Parameters.EMRReleaseLabel;
      expect(releaseParam.AllowedPattern).toBe('^emr-6\\.(9|[1-9][0-9])\\.[0-9]+$');

      const taskMin = template.Parameters.TaskNodeMinCapacity;
      expect(taskMin.MinValue).toBe(0);
      expect(taskMin.MaxValue).toBe(10);

      const taskMax = template.Parameters.TaskNodeMaxCapacity;
      expect(taskMax.MinValue).toBe(1);
      expect(taskMax.MaxValue).toBe(100);
    });

    test('should have notification email with pattern validation', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Default).toBe('alerts@example.com');
      expect(emailParam.AllowedPattern).toMatch(/^.*@.*$/);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals'][1]).toBe('production');
    });

    test('should have CreateTaskNodes condition', () => {
      const condition = template.Conditions.CreateTaskNodes;
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals'][0]['Ref']).toBe('TaskNodeMinCapacity');
      expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe(0);
    });
  });

  describe('Resources', () => {
    test('should have VPC resource with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have EMR cluster with all required properties', () => {
      const emr = template.Resources.EMRCluster;
      expect(emr.Type).toBe('AWS::EMR::Cluster');
      expect(emr.Properties.Name['Fn::Sub']).toContain('${ProjectName}-${Environment}-emr-cluster');
      expect(emr.Properties.ReleaseLabel['Ref']).toBe('EMRReleaseLabel');
      expect(emr.Properties.Applications).toHaveLength(3); // Spark, Hive, Ganglia
      expect(emr.Properties.SecurityConfiguration['Ref']).toBe('EMRSecurityConfiguration');
    });

    test('should have S3 buckets with encryption and lifecycle', () => {
      const rawBucket = template.Resources.RawDataBucket;
      expect(rawBucket.Type).toBe('AWS::S3::Bucket');
      expect(rawBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(rawBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(rawBucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
    });

    test('should have Lambda functions with correct runtime and handlers', () => {
      const monitoringFunc = template.Resources.JobMonitoringFunction;
      expect(monitoringFunc.Type).toBe('AWS::Lambda::Function');
      expect(monitoringFunc.Properties.Runtime).toBe('python3.9');
      expect(monitoringFunc.Properties.Handler).toBe('index.lambda_handler');
      expect(monitoringFunc.Properties.Timeout).toBe(60);
    });

    test('should have Step Functions state machine with logging', () => {
      const stateMachine = template.Resources.StateMachine;
      expect(stateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
      expect(stateMachine.Properties.LoggingConfiguration.Level).toBe('ALL');
      expect(stateMachine.Properties.LoggingConfiguration.IncludeExecutionData).toBe(true);
    });

    test('should have KMS key with rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(3);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'EMRClusterId', 'EMRClusterMasterPublicDNS',
        'RawDataBucketName', 'ProcessedDataBucketName', 'EMRLogsBucketName',
        'ScriptsBucketName', 'StateMachineArn', 'StateMachineExecutionUrl',
        'SNSTopicArn', 'KMSKeyId', 'KMSKeyArn', 'GlueDatabaseName', 'DashboardURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have outputs with exports where specified', () => {
      const outputsWithExports = [
        'VPCId', 'EMRClusterId', 'EMRClusterMasterPublicDNS',
        'RawDataBucketName', 'ProcessedDataBucketName', 'EMRLogsBucketName',
        'ScriptsBucketName', 'StateMachineArn',
        'SNSTopicArn', 'KMSKeyId', 'KMSKeyArn', 'GlueDatabaseName'
      ];

      outputsWithExports.forEach(outputName => {
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should have correctly formatted export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure after YAML conversion', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have any undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Comprehensive template
    });

    test('should have matching parameter groups and parameters', () => {
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      const allParams = paramGroups.flatMap((group: any) => group.Parameters);
      const templateParams = Object.keys(template.Parameters);

      // Ensure all parameters in groups exist in template
      allParams.forEach((param: string) => {
        expect(templateParams).toContain(param);
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle task node min capacity of 0 correctly', () => {
      const taskInstanceGroup = template.Resources.TaskInstanceGroup;
      expect(taskInstanceGroup.Condition).toBe('CreateTaskNodes');
      expect(taskInstanceGroup.Properties.InstanceCount['Ref']).toBe('TaskNodeMinCapacity');
    });

    test('should have termination protection based on environment', () => {
      const emr = template.Resources.EMRCluster;
      expect(emr.Properties.Instances.TerminationProtected['Fn::If']).toBeDefined();
      expect(emr.Properties.Instances.TerminationProtected['Fn::If'][0]).toBe('IsProduction');
    });

    test('should have public access blocked on all S3 buckets', () => {
      const buckets = ['RawDataBucket', 'ProcessedDataBucket', 'EMRLogsBucket', 'ScriptsBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have EMR cluster depending on networking resources', () => {
      const emr = template.Resources.EMRCluster;
      expect(emr.DependsOn).toContain('NATGateway1');
      expect(emr.DependsOn).toContain('NATGateway2');
      expect(emr.DependsOn).toContain('PrivateRoute1');
      expect(emr.DependsOn).toContain('PrivateRoute2');
    });

    test('should have NAT gateway EIPs depending on internet gateway', () => {
      const nat1EIP = template.Resources.NATGateway1EIP;
      expect(nat1EIP.DependsOn).toBe('AttachGateway');

      const nat2EIP = template.Resources.NATGateway2EIP;
      expect(nat2EIP.DependsOn).toBe('AttachGateway');
    });
  });

  describe('IAM Policies', () => {
    test('should have EMR service role with correct managed policies', () => {
      const serviceRole = template.Resources.EMRServiceRole;
      expect(serviceRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceRole');
    });

    test('should have Lambda execution role with VPC access', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      expect(lambdaRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      expect(lambdaRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have Step Functions role with Lambda invoke permission', () => {
      const sfRole = template.Resources.StepFunctionsExecutionRole;
      const lambdaPolicy = sfRole.Properties.Policies[0].PolicyDocument.Statement.find(
        (stmt: any) => Array.isArray(stmt.Action) && stmt.Action.includes('lambda:InvokeFunction')
      );
      expect(lambdaPolicy).toBeDefined();
      expect(lambdaPolicy.Resource[0]['Fn::Sub']).toContain('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${ProjectName}-${Environment}-*');
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('should have CloudWatch alarms with correct metrics', () => {
      const healthAlarm = template.Resources.EMRClusterHealthAlarm;
      expect(healthAlarm.Properties.MetricName).toBe('IsIdle');
      expect(healthAlarm.Properties.Namespace).toBe('AWS/ElasticMapReduce');
      expect(healthAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      const volumeAlarm = template.Resources.DataProcessingVolumeAlarm;
      expect(volumeAlarm.Properties.MetricName).toBe('DataVolumeProcessed');
      expect(volumeAlarm.Properties.Namespace['Fn::Sub']).toContain('${ProjectName}/${Environment}/EMRPipeline');
    });

    test('should have dashboard with correct widgets', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toContain('${ProjectName}-${Environment}-emr-dashboard');
    });
  });
});