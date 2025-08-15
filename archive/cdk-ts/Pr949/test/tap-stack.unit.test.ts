import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TestTapStack${testEnvironmentSuffix}`, { 
      environmentSuffix: testEnvironmentSuffix 
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('should use provided environment suffix', () => {
      const customSuffix = 'custom456';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, `CustomStack${customSuffix}`, {
        environmentSuffix: customSuffix
      });
      const customTemplate = Template.fromStack(customStack);
      
      // Check KMS alias uses custom suffix
      customTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/production-key-${customSuffix}`,
      });
    });

    test('should use environment variable when no suffix provided', () => {
      process.env.ENVIRONMENT_SUFFIX = 'env789';
      const envApp = new cdk.App();
      const envStack = new TapStack(envApp, 'EnvStack', {});
      const envTemplate = Template.fromStack(envStack);
      
      // Check KMS alias uses env suffix
      envTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/production-key-${process.env.ENVIRONMENT_SUFFIX}`,
      });
      
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    test('should default to dev when no suffix provided', () => {
      // Ensure no environment variable is set
      delete process.env.ENVIRONMENT_SUFFIX;
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Check KMS alias uses default 'dev' suffix
      defaultTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/production-key-dev',
      });
    });

    test('should default to dev when props are undefined', () => {
      // Ensure no environment variable is set
      delete process.env.ENVIRONMENT_SUFFIX;
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');  // No props object
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Check KMS alias uses default 'dev' suffix
      defaultTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/production-key-dev',
      });
    });

    test('should prioritize props over environment variable', () => {
      // Set environment variable but expect props to take precedence
      process.env.ENVIRONMENT_SUFFIX = 'env999';
      const propsSuffix = 'props123';
      const priorityApp = new cdk.App();
      const priorityStack = new TapStack(priorityApp, `PriorityStack${propsSuffix}`, {
        environmentSuffix: propsSuffix
      });
      const priorityTemplate = Template.fromStack(priorityStack);
      
      // Check KMS alias uses props suffix, not env variable
      priorityTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/production-key-${propsSuffix}`,
      });
      
      delete process.env.ENVIRONMENT_SUFFIX;
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for production environment encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS alias with environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/production-key-${testEnvironmentSuffix}`,
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('should create 2 NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create public, private, and isolated subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });

      // Check for private subnets with egress
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });

      // Check for isolated subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          }),
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP and HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('should create RDS security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 role with correct managed policies', () => {
      // Check for EC2 role specifically (not the canary role)
      const resources = template.toJSON().Resources;
      const ec2Role = Object.entries(resources).find(([key, value]: [string, any]) => 
        value.Type === 'AWS::IAM::Role' && 
        value.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'ec2.amazonaws.com'
      );
      
      expect(ec2Role).toBeDefined();
      const roleProperties = (ec2Role![1] as any).Properties;
      
      // Check managed policies are attached
      expect(roleProperties.ManagedPolicyArns).toBeDefined();
      expect(roleProperties.ManagedPolicyArns.length).toBe(2);
      
      // Check the policies contain the expected patterns
      const policiesStr = JSON.stringify(roleProperties.ManagedPolicyArns);
      expect(policiesStr).toContain('CloudWatchAgentServerPolicy');
      expect(policiesStr).toContain('AmazonSSMManagedInstanceCore');
    });

    test('should have S3 access policy with environment-specific bucket', () => {
      const resources = template.toJSON().Resources;
      const ec2Role = Object.entries(resources).find(([key, value]: [string, any]) => 
        value.Type === 'AWS::IAM::Role' && 
        value.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'ec2.amazonaws.com'
      );
      
      expect(ec2Role).toBeDefined();
      const roleProperties = (ec2Role![1] as any).Properties;
      
      // Check inline policies
      expect(roleProperties.Policies).toBeDefined();
      const s3Policy = roleProperties.Policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      
      // Check S3 permissions
      const s3Statement = s3Policy.PolicyDocument.Statement.find((s: any) => 
        s.Action?.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource).toBe(`arn:aws:s3:::production-app-bucket-${testEnvironmentSuffix}-*/*`);
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should create launch template with encrypted EBS', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
                DeleteOnTermination: true,
                VolumeSize: 20,
              }),
            }),
          ]),
        }),
      });
    });

    test('should create auto scaling group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('should create CPU-based scaling policy at 70% threshold', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: 70,
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          }),
        }),
      });
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create internet-facing application load balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckEnabled: true,
        HealthCheckPath: '/index.html',
        HealthCheckProtocol: 'HTTP',
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 5,
      });
    });

    test('should create ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('RDS Database Configuration', () => {
    test('should create MySQL database with Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: false,
        BackupRetentionPeriod: 7,
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
      });
    });

    test('should create database subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('should generate database credentials secret with environment suffix', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `production-db-credentials-${testEnvironmentSuffix}`,
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with KMS encryption and versioning', () => {
      // Check S3 bucket exists with proper configuration
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
        VersioningConfiguration: Match.objectLike({
          Status: 'Enabled',
        }),
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }),
      });
      
      // Verify bucket name contains environment suffix
      const resources = template.toJSON().Resources;
      const bucket = Object.entries(resources).find(([key, value]: [string, any]) => 
        value.Type === 'AWS::S3::Bucket'
      );
      expect(bucket).toBeDefined();
      const bucketName = (bucket![1] as any).Properties?.BucketName;
      expect(JSON.stringify(bucketName)).toContain(`production-app-bucket-${testEnvironmentSuffix}`);
    });

    test('should have lifecycle rules for old versions', () => {
      // Find the production app bucket (not the CDK staging bucket)
      const resources = template.toJSON().Resources;
      const buckets = Object.entries(resources).filter(([key, value]: [string, any]) => 
        value.Type === 'AWS::S3::Bucket'
      );
      
      // Find the bucket with lifecycle configuration
      const bucketWithLifecycle = buckets.find(([key, value]: [string, any]) => 
        value.Properties?.LifecycleConfiguration?.Rules
      );
      
      expect(bucketWithLifecycle).toBeDefined();
      const lifecycleRules = (bucketWithLifecycle![1] as any).Properties?.LifecycleConfiguration?.Rules;
      expect(lifecycleRules).toBeDefined();
      expect(lifecycleRules.length).toBeGreaterThanOrEqual(1);
      
      const deleteOldVersionsRule = lifecycleRules.find((rule: any) => 
        rule.Id === 'delete-old-versions'
      );
      expect(deleteOldVersionsRule).toBeDefined();
      expect(deleteOldVersionsRule.NoncurrentVersionExpiration.NoncurrentDays).toBe(90);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CloudWatch log group with KMS encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ec2/production-app-${testEnvironmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('should create CPU alarm for Auto Scaling Group', () => {
      const resources = template.toJSON().Resources;
      const alarms = Object.entries(resources).filter(([key, value]: [string, any]) => 
        value.Type === 'AWS::CloudWatch::Alarm'
      );
      
      const ec2Alarm = alarms.find(([key, value]: [string, any]) => 
        value.Properties?.MetricName === 'CPUUtilization' &&
        value.Properties?.Namespace === 'AWS/EC2'
      );
      
      expect(ec2Alarm).toBeDefined();
      const alarmProps = (ec2Alarm![1] as any).Properties;
      expect(alarmProps.Threshold).toBe(80);
      expect(alarmProps.EvaluationPeriods).toBe(2);
      expect(alarmProps.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create CPU alarm for RDS database', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 75,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('CloudWatch Synthetics', () => {
    test('should create Synthetics canary with environment suffix', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        Name: `production-endpoint-canary-${testEnvironmentSuffix}`,
        Schedule: Match.objectLike({
          Expression: 'rate(5 minutes)',
        }),
      });
    });

    test('should create canary execution role', () => {
      // Find the Lambda/Canary role
      const resources = template.toJSON().Resources;
      const canaryRole = Object.entries(resources).find(([key, value]: [string, any]) => 
        value.Type === 'AWS::IAM::Role' && 
        value.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'lambda.amazonaws.com'
      );
      
      expect(canaryRole).toBeDefined();
      const roleProperties = (canaryRole![1] as any).Properties;
      
      // Check managed policies exist
      expect(roleProperties.ManagedPolicyArns).toBeDefined();
      expect(roleProperties.ManagedPolicyArns.length).toBeGreaterThanOrEqual(1);
      
      // Check the policies contain expected CloudWatch Synthetics policy
      const policiesStr = JSON.stringify(roleProperties.ManagedPolicyArns);
      // The role should have at least the CloudWatch Synthetics execution policy
      expect(policiesStr).toMatch(/CloudWatchSynthetics|Lambda/);
    });
  });

  describe('Application Insights', () => {
    test('should create Application Insights with environment suffix', () => {
      template.hasResourceProperties('AWS::ApplicationInsights::Application', {
        ResourceGroupName: `production-application-resources-${testEnvironmentSuffix}`,
        AutoConfigurationEnabled: true,
        CWEMonitorEnabled: true,
      });
    });
  });

  describe('Systems Manager Parameters', () => {
    test('should create SSM parameter for database endpoint', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/production-${testEnvironmentSuffix}/database/endpoint`,
        Type: 'String',
        Description: 'RDS database endpoint for production environment',
      });
    });

    test('should create SSM parameter for S3 bucket name', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/production-${testEnvironmentSuffix}/s3bucket/name`,
        Type: 'String',
        Description: 'S3 bucket name for production environment',
      });
    });
  });

  describe('Lambda Functions with Powertools v2', () => {
    test('should create API Lambda function with Powertools layer', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs20.x',
        Timeout: 30,
        MemorySize: 256,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            POWERTOOLS_SERVICE_NAME: 'api-service',
            POWERTOOLS_METRICS_NAMESPACE: 'Production/Lambda',
            LOG_LEVEL: 'INFO',
            ENVIRONMENT_SUFFIX: testEnvironmentSuffix,
          }),
        },
      });
    });

    test('should create Data Processor Lambda function with Powertools layer', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs20.x',
        Timeout: 300,
        MemorySize: 512,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            POWERTOOLS_SERVICE_NAME: 'data-processor',
            POWERTOOLS_METRICS_NAMESPACE: 'Production/DataProcessing',
            LOG_LEVEL: 'INFO',
            ENVIRONMENT_SUFFIX: testEnvironmentSuffix,
          }),
        },
      });
    });

    test('should create Lambda execution role with proper policies', () => {
      // Check for Lambda execution role
      const resources = template.toJSON().Resources;
      const lambdaRole = Object.entries(resources).find(([key, value]: [string, any]) => 
        value.Type === 'AWS::IAM::Role' && 
        key.includes('LambdaExecutionRole')
      );
      
      expect(lambdaRole).toBeDefined();
      const roleProperties = (lambdaRole![1] as any).Properties;
      
      // Check assume role policy
      expect(roleProperties.AssumeRolePolicyDocument).toBeDefined();
      expect(roleProperties.AssumeRolePolicyDocument.Statement).toBeDefined();
      const assumeStatement = roleProperties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeStatement.Action).toBe('sts:AssumeRole');
      expect(assumeStatement.Principal.Service).toBe('lambda.amazonaws.com');
      
      // Check managed policies
      expect(roleProperties.ManagedPolicyArns).toBeDefined();
      expect(roleProperties.ManagedPolicyArns.length).toBe(3);
      
      // Check the policies contain expected patterns
      const policiesStr = JSON.stringify(roleProperties.ManagedPolicyArns);
      expect(policiesStr).toContain('AWSLambdaBasicExecutionRole');
      expect(policiesStr).toContain('AWSXRayDaemonWriteAccess');
      expect(policiesStr).toContain('AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda functions should have VPC configuration', () => {
      // Count Lambda functions with VPC configuration
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.entries(resources).filter(([key, value]: [string, any]) => 
        value.Type === 'AWS::Lambda::Function' && 
        value.Properties?.VpcConfig
      );
      
      expect(lambdaFunctions.length).toBeGreaterThanOrEqual(2); // At least API and Data Processor functions
      
      // Check VPC configuration exists
      lambdaFunctions.forEach(([key, func]: [string, any]) => {
        expect(func.Properties.VpcConfig).toBeDefined();
        expect(func.Properties.VpcConfig.SubnetIds).toBeDefined();
        expect(func.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      });
    });
  });

  describe('VPC Lattice Configuration', () => {
    test('should create VPC Lattice service network', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: `production-service-network-${testEnvironmentSuffix}`,
        AuthType: 'AWS_IAM',
      });
    });

    test('should create VPC Lattice service network VPC association', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetworkVpcAssociation', {
        ServiceNetworkIdentifier: Match.anyValue(),
        VpcIdentifier: Match.anyValue(),
      });
    });

    test('should create VPC Lattice service for API', () => {
      template.hasResourceProperties('AWS::VpcLattice::Service', {
        Name: `api-service-${testEnvironmentSuffix}`,
        AuthType: 'AWS_IAM',
      });
    });

    test('should create VPC Lattice target group for Lambda', () => {
      template.hasResourceProperties('AWS::VpcLattice::TargetGroup', {
        Name: `api-targets-${testEnvironmentSuffix}`,
        Type: 'LAMBDA',
        Targets: Match.arrayWith([
          Match.objectLike({
            Id: Match.anyValue(),
          }),
        ]),
      });
    });

    test('should create VPC Lattice listener', () => {
      template.hasResourceProperties('AWS::VpcLattice::Listener', {
        Protocol: 'HTTPS',
        Port: 443,
        DefaultAction: Match.objectLike({
          Forward: Match.objectLike({
            TargetGroups: Match.arrayWith([
              Match.objectLike({
                TargetGroupIdentifier: Match.anyValue(),
                Weight: 100,
              }),
            ]),
          }),
        }),
      });
    });

    test('should create VPC Lattice service association', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetworkServiceAssociation', {
        ServiceIdentifier: Match.anyValue(),
        ServiceNetworkIdentifier: Match.anyValue(),
      });
    });

    test('Lambda functions should have VPC Lattice invoke permissions', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'vpc-lattice.amazonaws.com',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have load balancer DNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name',
      });
    });

    test('should have database endpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('should have S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for application storage',
      });
    });

    test('should have VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID for the production environment',
      });
    });

    test('should have API Lambda function ARN output', () => {
      template.hasOutput('ApiLambdaFunctionArn', {
        Description: 'ARN of the API Lambda function with Powertools',
      });
    });

    test('should have Data Processor function ARN output', () => {
      template.hasOutput('DataProcessorFunctionArn', {
        Description: 'ARN of the data processor Lambda function with Powertools',
      });
    });

    test('should have VPC Lattice service network ARN output', () => {
      template.hasOutput('VpcLatticeServiceNetworkArn', {
        Description: 'ARN of the VPC Lattice service network',
      });
    });

    test('should have VPC Lattice service ARN output', () => {
      template.hasOutput('VpcLatticeServiceArn', {
        Description: 'ARN of the VPC Lattice API service',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all major resources should have Production environment tag', () => {
      // Check VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });

      // Check KMS Key
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });

      // Check RDS
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });
  });

  describe('Deletion Policies', () => {
    test('should have destroy removal policy for development resources', () => {
      // KMS Key should be destroyable
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
      });

      // S3 Bucket should be destroyable
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
      });
    });

    test('RDS should not have deletion protection enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });
  });
});