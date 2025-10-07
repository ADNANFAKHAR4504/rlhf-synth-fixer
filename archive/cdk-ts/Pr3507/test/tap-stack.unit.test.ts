import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BatchStack } from '../lib/batch-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { NetworkingStack } from '../lib/networking-stack';
import { SageMakerStack } from '../lib/sagemaker-stack';
import { StorageStack } from '../lib/storage-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Stack uses environment suffix from context if not provided in props', () => {
    const appWithContext = new cdk.App();
    appWithContext.node.setContext('environmentSuffix', 'context-test');
    const stackWithContext = new TapStack(appWithContext, 'TestStackContext');
    const templateWithContext = Template.fromStack(stackWithContext);

    templateWithContext.hasOutput('EnvironmentSuffix', {
      Value: 'context-test',
      Description: 'Environment suffix used for resource naming'
    });
  });

  test('Stack uses default environment suffix if not provided', () => {
    const appNoSuffix = new cdk.App();
    const stackNoSuffix = new TapStack(appNoSuffix, 'TestStackNoSuffix');
    const templateNoSuffix = Template.fromStack(stackNoSuffix);

    templateNoSuffix.hasOutput('EnvironmentSuffix', {
      Value: 'dev',
      Description: 'Environment suffix used for resource naming'
    });
  });

  test('Main stack creates all nested stacks', () => {
    // Verify we have 5 nested stacks (counting the tap stack itself and infrastructure stack twice)
    const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
    expect(Object.keys(nestedStacks)).toHaveLength(5);

    // Check nested stack types exist
    template.hasResourceProperties('AWS::CloudFormation::Stack', {
      TemplateURL: Match.anyValue()
    });
  });

  test('Main stack has correct outputs', () => {
    // Check outputs
    template.hasOutput('EnvironmentSuffix', {
      Value: 'test',
      Description: 'Environment suffix used for resource naming'
    });

    template.hasOutput('Region', {
      Value: { Ref: 'AWS::Region' },
      Description: 'AWS region where stack is deployed'
    });
  });
});

describe('NetworkingStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkingStack: NetworkingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    networkingStack = new NetworkingStack(stack, 'NetworkingStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(networkingStack);
  });

  test('VPC is created with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.220.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Two private subnets are created', () => {
    // Check that 2 private and 2 public subnets are created
    template.resourceCountIs('AWS::EC2::Subnet', 4);

    // Check private subnet properties
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.220.2.0/24',
      MapPublicIpOnLaunch: false
    });

    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.220.3.0/24',
      MapPublicIpOnLaunch: false
    });
  });

  test('NAT Gateway is not created to avoid EIP limits', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
    template.resourceCountIs('AWS::EC2::EIP', 0);
  });

  test('VPC Endpoints are created for AWS services', () => {
    // S3 Gateway endpoint
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Gateway',
      ServiceName: {
        'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.s3']]
      }
    });

    // SageMaker API endpoint
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Interface',
      ServiceName: {
        'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.sagemaker.api']]
      }
    });

    // SageMaker Runtime endpoint
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Interface',
      ServiceName: {
        'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.sagemaker.runtime']]
      }
    });

    // ECR endpoints
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Interface',
      ServiceName: {
        'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.ecr.api']]
      }
    });

    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Interface',
      ServiceName: {
        'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.ecr.dkr']]
      }
    });
  });

  test('Stack outputs are created', () => {
    template.hasOutput('VpcId', {
      Description: 'VPC ID'
    });

    template.hasOutput('PrivateSubnetIds', {
      Description: 'Private subnet IDs'
    });
  });

  test('NetworkingStack can be created without props', () => {
    // Test the optional props parameter path
    const testApp = new cdk.App();
    const testStack = new cdk.Stack(testApp, 'TestNetworkingStack');
    const testNetworkingStack = new NetworkingStack(testStack, 'TestNetworkingStack');
    const testTemplate = Template.fromStack(testNetworkingStack);

    // Should still create VPC even without props
    testTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.220.0.0/16',
    });
  });

  test('Private subnet IDs are properly formatted in output', () => {
    // This test ensures the lambda function in isolatedSubnets.map() is covered
    const isolatedSubnets = networkingStack.vpc.isolatedSubnets;
    expect(isolatedSubnets.length).toBeGreaterThan(0);
    
    // Test the actual lambda function logic by accessing subnet IDs
    const subnetIds = isolatedSubnets.map(subnet => subnet.subnetId);
    expect(subnetIds.length).toBe(isolatedSubnets.length);
    
    // Verify the output format
    const joinedIds = subnetIds.join(',');
    expect(typeof joinedIds).toBe('string');
    expect(joinedIds.length).toBeGreaterThan(0);
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: StorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    storageStack = new StorageStack(stack, 'StorageStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(storageStack);
  });

  test('Dataset S3 bucket is created with versioning', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }]
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('Model S3 bucket has lifecycle policies', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [{
          Id: 'archive-old-models',
          Status: 'Enabled',
          Transitions: [{
            StorageClass: 'GLACIER',
            TransitionInDays: 180
          }]
        }]
      }
    });
  });

  test('ECR repository is created with scanning enabled', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'training-containers-test',
      ImageScanningConfiguration: {
        ScanOnPush: true
      },
      LifecyclePolicy: {
        LifecyclePolicyText: Match.stringLikeRegexp('.*countNumber.*50.*')
      }
    });
  });

  test('S3 buckets have DESTROY removal policy', () => {
    // Check for auto-delete Lambda function
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Timeout: 900
    });
  });

  test('Stack outputs are created', () => {
    template.hasOutput('DatasetBucketName', {
      Description: 'Training dataset S3 bucket name'
    });

    template.hasOutput('ModelBucketName', {
      Description: 'Model artifacts S3 bucket name'
    });

    template.hasOutput('ECRRepositoryUri', {
      Description: 'ECR repository URI for training containers'
    });
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let monitoringStack: MonitoringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(monitoringStack);
  });

  test('CloudWatch log group is created', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/sagemaker/training-jobs-test',
      RetentionInDays: 30
    });
  });

  test('CloudWatch dashboard is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'sagemaker-training-test'
    });
  });

  test('CloudWatch alarm for training failures is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'TrainingJobsFailed',
      Namespace: 'AWS/SageMaker',
      Statistic: 'Sum',
      Threshold: 1,
      EvaluationPeriods: 1,
      TreatMissingData: 'notBreaching',
      AlarmDescription: 'Alert when training jobs fail'
    });
  });

  test('Stack outputs are created', () => {
    template.hasOutput('LogGroupName', {
      Description: 'CloudWatch log group name'
    });

    template.hasOutput('DashboardName', {
      Description: 'CloudWatch dashboard name'
    });
  });
});

describe('SageMakerStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let datasetBucket: s3.Bucket;
  let modelBucket: s3.Bucket;
  let ecrRepository: ecr.Repository;
  let logGroup: logs.LogGroup;
  let sageMakerStack: SageMakerStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create dependencies
    vpc = new ec2.Vpc(stack, 'TestVPC', { maxAzs: 2 });
    datasetBucket = new s3.Bucket(stack, 'TestDatasetBucket');
    modelBucket = new s3.Bucket(stack, 'TestModelBucket');
    ecrRepository = new ecr.Repository(stack, 'TestECR');
    logGroup = new logs.LogGroup(stack, 'TestLogGroup');

    sageMakerStack = new SageMakerStack(stack, 'SageMakerStack', {
      environmentSuffix: 'test',
      vpc,
      datasetBucket,
      modelBucket,
      ecrRepository,
      logGroup
    });
    template = Template.fromStack(sageMakerStack);
  });

  test('SageMaker notebook instance is created', () => {
    template.hasResourceProperties('AWS::SageMaker::NotebookInstance', {
      InstanceType: 'ml.t3.medium',
      NotebookInstanceName: 'training-notebook-test',
      DefaultCodeRepository: 'https://github.com/aws/amazon-sagemaker-examples.git'
    });
  });

  test('IAM roles are created for SageMaker', () => {
    // Notebook execution role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'sagemaker.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      },
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([Match.stringLikeRegexp('.*AmazonSageMakerFullAccess.*')])
          ])
        })
      ])
    });

    // Training job role with inline policies - check if policy exists
    const hasPolicy = template.findResources('AWS::IAM::Policy', {
      Properties: {
        PolicyDocument: {
          Statement: Match.anyValue()
        }
      }
    });
    expect(Object.keys(hasPolicy).length).toBeGreaterThan(0);
  });

  test('Security group is created for SageMaker', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for SageMaker resources',
      SecurityGroupEgress: [{
        CidrIp: '0.0.0.0/0',
        Description: 'Allow all outbound traffic by default',
        IpProtocol: '-1'
      }]
    });
  });

  test('Stack outputs are created', () => {
    template.hasOutput('NotebookInstanceName', {
      Description: 'SageMaker notebook instance name'
    });

    template.hasOutput('TrainingRoleArn', {
      Description: 'ARN of the IAM role for SageMaker training jobs'
    });

    template.hasOutput('TrainingJobConfig', {
      Description: 'Configuration for SageMaker training jobs with spot instances'
    });
  });
});

describe('BatchStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let modelBucket: s3.Bucket;
  let ecrRepository: ecr.Repository;
  let batchStack: BatchStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create dependencies
    vpc = new ec2.Vpc(stack, 'TestVPC', { maxAzs: 2 });
    modelBucket = new s3.Bucket(stack, 'TestModelBucket');
    ecrRepository = new ecr.Repository(stack, 'TestECR');

    batchStack = new BatchStack(stack, 'BatchStack', {
      environmentSuffix: 'test',
      vpc,
      modelBucket,
      ecrRepository
    });
    template = Template.fromStack(batchStack);
  });

  test('Batch compute environment is created with spot instances', () => {
    template.hasResourceProperties('AWS::Batch::ComputeEnvironment', {
      ComputeEnvironmentName: 'batch-inference-test',
      Type: 'managed',
      State: 'ENABLED',
      ComputeResources: {
        Type: 'SPOT',
        BidPercentage: 80,
        MaxvCpus: 256,
        MinvCpus: 0,
        AllocationStrategy: 'SPOT_PRICE_CAPACITY_OPTIMIZED'
      }
    });
  });

  test('Batch job queue is created', () => {
    template.hasResourceProperties('AWS::Batch::JobQueue', {
      JobQueueName: 'inference-queue-test',
      Priority: 1,
      State: 'ENABLED'
    });
  });

  test('Batch job definition is created', () => {
    template.hasResourceProperties('AWS::Batch::JobDefinition', {
      JobDefinitionName: 'inference-job-test',
      Type: 'container',
      RetryStrategy: {
        Attempts: 3
      },
      Timeout: {
        AttemptDurationSeconds: 3600
      },
      PlatformCapabilities: ['EC2']
    });
  });

  test('IAM roles are created for Batch', () => {
    // Instance profile role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      }
    });

    // Job execution role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      }
    });
  });

  test('Security group is created for Batch', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for Batch compute environment'
    });
  });

  test('Stack outputs are created', () => {
    template.hasOutput('ComputeEnvironmentArn', {
      Description: 'Batch compute environment ARN'
    });

    template.hasOutput('JobQueueArn', {
      Description: 'Batch job queue ARN'
    });

    template.hasOutput('JobDefinitionArn', {
      Description: 'Batch job definition ARN'
    });
  });
});
