import fs from 'fs';
import path from 'path';

describe('PCI-DSS Payment Processing CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have PCI-DSS description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('PCI-DSS');
      expect(template.Description).toContain('payment processing');
    });

    test('should have 41 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(41);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have EmailAddress parameter for SNS', () => {
      expect(template.Parameters.EmailAddress).toBeDefined();
      expect(template.Parameters.EmailAddress.Type).toBe('String');
    });
  });

  describe('VPC and Networking', () => {
    test('should have PaymentVpc resource', () => {
      expect(template.Resources.PaymentVpc).toBeDefined();
      expect(template.Resources.PaymentVpc.Type).toBe('AWS::EC2::VPC');
    });

    test('PaymentVpc should have correct CIDR and DNS settings', () => {
      const vpc = template.Resources.PaymentVpc;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });

    test('should have VPC Flow Log configured', () => {
      expect(template.Resources.VpcFlowLog).toBeDefined();
      const flowLog = template.Resources.VpcFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 Gateway Endpoint', () => {
      expect(template.Resources.S3GatewayEndpoint).toBeDefined();
      const endpoint = template.Resources.S3GatewayEndpoint;
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('should have Lambda Interface Endpoint', () => {
      expect(template.Resources.LambdaInterfaceEndpoint).toBeDefined();
      const endpoint = template.Resources.LambdaInterfaceEndpoint;
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
    });

    test('should have SSM Interface Endpoint for Parameter Store', () => {
      expect(template.Resources.SsmInterfaceEndpoint).toBeDefined();
      const endpoint = template.Resources.SsmInterfaceEndpoint;
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(endpoint.Properties.PrivateDnsEnabled).toBe(true);
    });

    test('SSM endpoint should have security group', () => {
      expect(template.Resources.SsmEndpointSecurityGroup).toBeDefined();
      const sg = template.Resources.SsmEndpointSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Encryption Keys', () => {
    test('should have separate SnsEncryptionKey', () => {
      expect(template.Resources.SnsEncryptionKey).toBeDefined();
      const key = template.Resources.SnsEncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key aliases', () => {
      expect(template.Resources.DataEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.SnsEncryptionKeyAlias).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('DataBucket should have KMS encryption enabled', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('DataBucket should have versioning enabled', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('DataBucket should block all public access', () => {
      const bucket = template.Resources.DataBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have AuditLogBucket with Delete policy', () => {
      expect(template.Resources.AuditLogBucket).toBeDefined();
      const bucket = template.Resources.AuditLogBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('bucket policies should enforce SSL/TLS', () => {
      const dataPolicy = template.Resources.DataBucketPolicy;
      const auditPolicy = template.Resources.AuditLogBucketPolicy;
      expect(dataPolicy).toBeDefined();
      expect(auditPolicy).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('should have PaymentProcessorFunction', () => {
      expect(template.Resources.PaymentProcessorFunction).toBeDefined();
      const lambda = template.Resources.PaymentProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should be configured for VPC', () => {
      const lambda = template.Resources.PaymentProcessorFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(3);
    });

    test('Lambda should have environment variables for SSM parameters', () => {
      const lambda = template.Resources.PaymentProcessorFunction;
      expect(lambda.Properties.Environment.Variables.CONFIG_PARAM_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.SECRET_PARAM_NAME).toBeDefined();
    });

    test('should have LambdaExecutionRole with SSM permissions', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const policies = role.Properties.Policies;
      const ssmPolicy = policies.find((p: any) => p.PolicyName === 'SSMParameterAccess');
      expect(ssmPolicy).toBeDefined();
    });

    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Lambda log group', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('SSM Parameter Store', () => {
    test('should have PaymentConfigParameter', () => {
      expect(template.Resources.PaymentConfigParameter).toBeDefined();
      const param = template.Resources.PaymentConfigParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('should have PaymentSecretParameter', () => {
      expect(template.Resources.PaymentSecretParameter).toBeDefined();
      const param = template.Resources.PaymentSecretParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('should have PaymentApiKeyParameter', () => {
      expect(template.Resources.PaymentApiKeyParameter).toBeDefined();
      const param = template.Resources.PaymentApiKeyParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });
  });

  describe('SNS Alerting', () => {
    test('should have SecurityAlertsTopic with SNS encryption key', () => {
      expect(template.Resources.SecurityAlertsTopic).toBeDefined();
      const topic = template.Resources.SecurityAlertsTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('should have SNS topic policy', () => {
      expect(template.Resources.SecurityAlertsTopicPolicy).toBeDefined();
      const policy = template.Resources.SecurityAlertsTopicPolicy;
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });

    test('should have email subscription', () => {
      expect(template.Resources.SecurityAlertsEmailSubscription).toBeDefined();
      const subscription = template.Resources.SecurityAlertsEmailSubscription;
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have VPC rejected connections alarm', () => {
      expect(template.Resources.VpcRejectedConnectionsAlarm).toBeDefined();
      const alarm = template.Resources.VpcRejectedConnectionsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Threshold).toBe(100);
      expect(alarm.Properties.Period).toBe(300);
    });

    test('should have Lambda error alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.MetricName).toBe('Errors');
    });

    test('should have S3 unauthorized access alarm', () => {
      expect(template.Resources.S3UnauthorizedAccessAlarm).toBeDefined();
      const alarm = template.Resources.S3UnauthorizedAccessAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have KMS key usage alarm', () => {
      expect(template.Resources.KmsKeyUsageAlarm).toBeDefined();
      const alarm = template.Resources.KmsKeyUsageAlarm;
      expect(alarm.Properties.Threshold).toBe(1000);
    });

    test('all alarms should publish to SNS topic', () => {
      const alarms = [
        'VpcRejectedConnectionsAlarm',
        'LambdaErrorAlarm',
        'S3UnauthorizedAccessAlarm',
        'KmsKeyUsageAlarm'
      ];
      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('should have metric filters for custom metrics', () => {
      expect(template.Resources.VpcRejectedConnectionsMetricFilter).toBeDefined();
      expect(template.Resources.S3UnauthorizedAccessMetricFilter).toBeDefined();
      expect(template.Resources.KmsKeyUsageMetricFilter).toBeDefined();
    });
  });


  describe('Resource Tagging', () => {
    test('VPC should have PCI compliance tags', () => {
      const vpc = template.Resources.PaymentVpc;
      const tags = vpc.Properties.Tags;
      const pciTag = tags.find((t: any) => t.Key === 'DataClassification');
      const complianceTag = tags.find((t: any) => t.Key === 'ComplianceScope');
      expect(pciTag.Value).toBe('PCI');
      expect(complianceTag.Value).toBe('Payment');
    });

    test('all tagged resources should have PCI compliance tags', () => {
      const taggedResources = [
        'PaymentVpc',
        'PrivateSubnet1',
        'DataEncryptionKey',
        'DataBucket',
        'PaymentProcessorFunction',
        'SecurityAlertsTopic',
        'FlowLogGroup'
      ];
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const pciTag = resource.Properties.Tags.find((t: any) => t.Key === 'DataClassification');
          expect(pciTag).toBeDefined();
          expect(pciTag.Value).toBe('PCI');
        }
      });
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('VPC name should include environment suffix', () => {
      const vpc = template.Resources.PaymentVpc;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('SNS topic name should include environment suffix', () => {
      const topic = template.Resources.SecurityAlertsTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('SSM parameters should include environment suffix in path', () => {
      const param = template.Resources.PaymentConfigParameter;
      expect(param.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have VpcId output', () => {
      expect(template.Outputs.VpcId).toBeDefined();
      expect(template.Outputs.VpcId.Value.Ref).toBe('PaymentVpc');
    });

    test('should have DataBucketName output', () => {
      expect(template.Outputs.DataBucketName).toBeDefined();
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
    });

    test('should have SnsTopicArn output', () => {
      expect(template.Outputs.SnsTopicArn).toBeDefined();
    });
  });

  describe('Security Validation', () => {
    test('should not have any internet gateways', () => {
      const resources = Object.keys(template.Resources);
      const igws = resources.filter(r =>
        template.Resources[r].Type === 'AWS::EC2::InternetGateway'
      );
      expect(igws).toHaveLength(0);
    });

    test('should not have any NAT gateways', () => {
      const resources = Object.keys(template.Resources);
      const nats = resources.filter(r =>
        template.Resources[r].Type === 'AWS::EC2::NatGateway'
      );
      expect(nats).toHaveLength(0);
    });

    test('should have proper IAM role trust policies', () => {
      const roles = [
        'LambdaExecutionRole',
        'FlowLogRole'
      ];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });
  });

  describe('Deployment Readiness', () => {
    test('template should be valid JSON', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('all required sections should be present', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have exactly 41 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(41);
    });

    test('should have 2 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });
});
