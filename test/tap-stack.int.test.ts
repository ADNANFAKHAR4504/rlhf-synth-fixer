import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;
  let resources: any;
  let parameters: any;
  let outputs: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    resources = template.Resources;
    parameters = template.Parameters;
    outputs = template.Outputs;
  });

  describe('Parameter configuration', () => {
    test('should define regional and operational parameters with safe defaults', () => {
      expect(parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(parameters.PrimaryRegion.Default).toBe('us-east-1');
      expect(parameters.SecondaryRegion.Default).toBe('us-west-2');
      expect(parameters.HealthCheckFailureThreshold.MinValue).toBe(1);
      expect(parameters.HealthCheckFailureThreshold.MaxValue).toBe(10);
      expect(parameters.AlertEmail.Default).toContain('@');
    });
  });

  describe('Network topology', () => {
    test('should connect public and private subnets to the primary VPC', () => {
      const subnetNames = [
        'PrimaryPublicSubnet1',
        'PrimaryPublicSubnet2',
        'PrimaryPrivateSubnet1',
        'PrimaryPrivateSubnet2'
      ];

      subnetNames.forEach(name => {
        const subnet = resources[name];
        expect(subnet).toBeDefined();
        expect(subnet.Properties.VpcId.Ref).toBe('PrimaryVPC');
        expect(subnet.Properties.CidrBlock).toMatch(/^10\.0\./);
      });
    });

    test('should attach an internet gateway and route default traffic through it', () => {
      expect(resources.PrimaryInternetGateway).toBeDefined();
      expect(resources.PrimaryVPCGatewayAttachment.Properties.VpcId.Ref).toBe('PrimaryVPC');
      expect(resources.PrimaryVPCGatewayAttachment.Properties.InternetGatewayId.Ref).toBe('PrimaryInternetGateway');

      const route = resources.PrimaryPublicRoute;
      expect(route.DependsOn).toBe('PrimaryVPCGatewayAttachment');
      expect(route.Properties.RouteTableId.Ref).toBe('PrimaryPublicRouteTable');
      expect(route.Properties.GatewayId.Ref).toBe('PrimaryInternetGateway');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');

      const associations = [
        'PrimaryPublicSubnet1RouteTableAssociation',
        'PrimaryPublicSubnet2RouteTableAssociation'
      ].map(name => resources[name]);

      associations.forEach((association, index) => {
        expect(association.Properties.RouteTableId.Ref).toBe('PrimaryPublicRouteTable');
        expect(association.Properties.SubnetId.Ref).toBe(`PrimaryPublicSubnet${index + 1}`);
      });
    });
  });

  describe('Security controls', () => {
    test('should configure a security group with HTTPS ingress and full egress', () => {
      const securityGroup = resources.PrimarySecurityGroup;
      expect(securityGroup.Properties.VpcId.Ref).toBe('PrimaryVPC');
      const ingress = securityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
      expect(ingress.CidrIp).toBe('0.0.0.0/0');

      const egress = securityGroup.Properties.SecurityGroupEgress[0];
      expect(egress.IpProtocol).toBe('-1');
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Data durability and disaster recovery', () => {
    test('should configure a DynamoDB global table with replicas in both regions', () => {
      const table = resources.TransactionTable.Properties;
      expect(table.TableName['Fn::Sub']).toContain('transactions-${EnvironmentSuffix}');
      expect(table.Replicas).toHaveLength(2);
      expect(table.Replicas[0].Region.Ref).toBe('PrimaryRegion');
      expect(table.Replicas[1].Region.Ref).toBe('SecondaryRegion');

      table.Replicas.forEach(replica => {
        expect(replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
        expect(replica.Tags[0].Value.Ref).toBe('EnvironmentSuffix');
      });

      expect(table.SSESpecification.SSEEnabled).toBe(true);
      expect(table.SSESpecification.SSEType).toBe('KMS');
    });

    test('should store transaction logs in an encrypted, versioned S3 bucket', () => {
      const bucket = resources.TransactionLogBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Processing pipeline', () => {
    test('should grant the Lambda processor access to DynamoDB, S3, and SQS', () => {
      const role = resources.TransactionProcessorRole.Properties;
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Policies[0].PolicyDocument.Statement.length).toBeGreaterThanOrEqual(4);
      const policyStatement = role.Policies[0].PolicyDocument.Statement;
      const hasDynamoAccess = policyStatement.some((stmt: any) => stmt.Resource?.['Fn::GetAtt']?.[0] === 'TransactionTable');
      const hasS3Access = policyStatement.some((stmt: any) => stmt.Resource?.['Fn::Sub']?.includes('transaction-logs-primary-'));
      const hasSqsAccess = policyStatement.some((stmt: any) => stmt.Resource?.['Fn::GetAtt']?.[0] === 'TransactionQueue');

      expect(hasDynamoAccess).toBe(true);
      expect(hasS3Access).toBe(true);
      expect(hasSqsAccess).toBe(true);
    });

    test('should configure the Lambda function with VPC networking and dependent resources', () => {
      const fn = resources.TransactionProcessorFunction.Properties;
      expect(fn.Runtime).toBe('python3.11');
      expect(fn.VpcConfig.SecurityGroupIds[0].Ref).toBe('PrimarySecurityGroup');
      expect(fn.VpcConfig.SubnetIds).toEqual([
        { Ref: 'PrimaryPrivateSubnet1' },
        { Ref: 'PrimaryPrivateSubnet2' }
      ]);
      expect(fn.Environment.Variables.TABLE_NAME.Ref).toBe('TransactionTable');
      expect(fn.Environment.Variables.BUCKET_NAME.Ref).toBe('TransactionLogBucket');
      expect(fn.Environment.Variables.QUEUE_URL.Ref).toBe('TransactionQueue');
      expect(fn.Role['Fn::GetAtt'][0]).toBe('TransactionProcessorRole');
    });
  });

  describe('API integration', () => {
    test('should wire API Gateway to the Lambda function with invoke permissions', () => {
      const method = resources.TransactionApiMethod.Properties;
      expect(method.HttpMethod).toBe('POST');
      expect(method.Integration.Type).toBe('AWS_PROXY');
      expect(method.Integration.Uri['Fn::Sub']).toContain('${TransactionProcessorFunction.Arn}/invocations');

      const permission = resources.LambdaApiPermission.Properties;
      expect(permission.FunctionName.Ref).toBe('TransactionProcessorFunction');
      expect(permission.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.SourceArn['Fn::Sub']).toContain('${TransactionApi}/*/*/*');
    });
  });

  describe('Monitoring and alerting', () => {
    test('should create a Route53 health check that feeds a CloudWatch alarm and SNS topic', () => {
      const healthCheck = resources.ApiHealthCheck.Properties;
      expect(healthCheck.HealthCheckConfig.Type).toBe('HTTPS');
      expect(healthCheck.HealthCheckConfig.FailureThreshold.Ref).toBe('HealthCheckFailureThreshold');
      expect(healthCheck.HealthCheckConfig.ResourcePath).toBe('/transactions');

      const alarm = resources.HealthCheckAlarm.Properties;
      expect(alarm.Dimensions[0].Value.Ref).toBe('ApiHealthCheck');
      expect(alarm.AlarmActions[0].Ref).toBe('HealthCheckAlarmTopic');

      const topic = resources.HealthCheckAlarmTopic.Properties;
      expect(topic.Subscription[0].Endpoint.Ref).toBe('AlertEmail');
    });

    test('should monitor Lambda, DynamoDB, and API Gateway metrics with shared notifications', () => {
      const lambdaAlarm = resources.LambdaErrorAlarm.Properties;
      expect(lambdaAlarm.Dimensions[0].Value.Ref).toBe('TransactionProcessorFunction');
      expect(lambdaAlarm.AlarmActions[0].Ref).toBe('HealthCheckAlarmTopic');

      const dynamoAlarm = resources.DynamoDBThrottleAlarm.Properties;
      expect(dynamoAlarm.Dimensions[0].Value.Ref).toBe('TransactionTable');
      expect(dynamoAlarm.AlarmActions[0].Ref).toBe('HealthCheckAlarmTopic');

      const apiAlarm = resources.ApiGateway5xxAlarm.Properties;
      expect(apiAlarm.Dimensions[0].Value['Fn::Sub']).toContain('transaction-api-${EnvironmentSuffix}');
      expect(apiAlarm.AlarmActions[0].Ref).toBe('HealthCheckAlarmTopic');
    });
  });

  describe('Messaging and queueing', () => {
    test('should provision an encrypted SQS queue for downstream processing', () => {
      const queue = resources.TransactionQueue.Properties;
      expect(queue.KmsMasterKeyId).toBe('alias/aws/sqs');
      expect(queue.VisibilityTimeout).toBe(300);
      expect(queue.QueueName['Fn::Sub']).toContain('transaction-queue-${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should expose key resource identifiers for cross-stack use', () => {
      expect(outputs.PrimaryVPCId.Value.Ref).toBe('PrimaryVPC');
      expect(outputs.PrimaryVPCId.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');

      expect(outputs.TransactionTableName.Value.Ref).toBe('TransactionTable');
      expect(outputs.TransactionTableName.Export.Name['Fn::Sub']).toContain('TransactionTable');

      expect(outputs.TransactionLogBucketName.Value.Ref).toBe('TransactionLogBucket');
      expect(outputs.TransactionLogBucketName.Export.Name['Fn::Sub']).toContain('TransactionLogBucket-');

      expect(outputs.TransactionQueueUrl.Value.Ref).toBe('TransactionQueue');
      expect(outputs.TransactionQueueUrl.Export.Name['Fn::Sub']).toContain('TransactionQueue');

      expect(outputs.ApiEndpoint.Value['Fn::Sub']).toContain('${TransactionApi}.execute-api');
      expect(outputs.ApiEndpoint.Export.Name['Fn::Sub']).toContain('ApiEndpoint');
    });
  });
});
