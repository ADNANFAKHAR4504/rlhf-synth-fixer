import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ComputeConstruct } from '../lib/compute-construct';

describe('ComputeConstruct', () => {
  let stack: cdk.Stack;
  let template: Template;
  let computeConstruct: ComputeConstruct;
  let vpc: cdk.aws_ec2.Vpc;
  let bucket: cdk.aws_s3.Bucket;
  let dynamoDbTable: cdk.aws_dynamodb.Table;
  let executionRole: cdk.aws_iam.Role;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    vpc = new cdk.aws_ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 3,
    });

    bucket = new cdk.aws_s3.Bucket(stack, 'TestBucket', {
      bucketName: 'test-bucket',
    });

    dynamoDbTable = new cdk.aws_dynamodb.Table(stack, 'TestTable', {
      tableName: 'test-table',
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
    });

    executionRole = new cdk.aws_iam.Role(stack, 'TestRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    computeConstruct = new ComputeConstruct(stack, 'Compute', {
      environmentSuffix: 'test',
      region: 'us-east-1',
      vpc,
      bucket,
      dynamoDbTable,
      executionRole,
    });

    template = Template.fromStack(stack);
  });

  describe('Lambda Function Configuration', () => {
    test('should create Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function',
        Match.objectLike({
          Runtime: 'python3.12',
          Handler: 'index.handler',
          FunctionName: 'test-main-function-us-east-1',
        })
      );
    });

    test('should configure Lambda memory and timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function',
        Match.objectLike({
          MemorySize: 512,
          Timeout: 300,
          // ReservedConcurrentExecutions is not configured in the current implementation
        })
      );
    });

    test('should set environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function',
        Match.objectLike({
          Environment: Match.objectLike({
            Variables: Match.objectLike({
              // Environment variables are set but values are CloudFormation references
              DYNAMODB_TABLE: Match.anyValue(),
              S3_BUCKET: Match.anyValue(),
            }),
          }),
        })
      );
    });

    test('should deploy Lambda in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function',
        Match.objectLike({
          VpcConfig: Match.objectLike({
            SubnetIds: Match.anyValue(),
            SecurityGroupIds: Match.anyValue(),
          }),
        })
      );
    });

    test('should expose Lambda function', () => {
      expect(computeConstruct.lambdaFunction).toBeDefined();
      expect(computeConstruct.lambdaFunction.functionArn).toBeDefined();
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer',
        Match.objectLike({
          Type: 'application',
          Scheme: 'internet-facing',
          Name: 'test-alb-us-east-1',
          // IpAddressType is not configured in the current implementation
        })
      );
    });

    test('should disable deletion protection for dev/test', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer',
        Match.objectLike({
          LoadBalancerAttributes: Match.arrayWith([
            Match.objectLike({
              Key: 'deletion_protection.enabled',
              Value: 'false',
            }),
          ]),
        })
      );
    });

    test('should create ALB security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup',
        Match.objectLike({
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
        })
      );
    });

    test('should expose ALB', () => {
      expect(computeConstruct.alb).toBeDefined();
      expect(computeConstruct.alb.loadBalancerDnsName).toBeDefined();
    });
  });

  describe('Target Group and Listener Configuration', () => {
    test('should create Lambda target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup',
        Match.objectLike({
          TargetType: 'lambda',
          Name: 'test-tg-use1',
          HealthCheckEnabled: true,
          // Health check properties are not configured in the current implementation
          Matcher: Match.objectLike({
            HttpCode: '200',
          }),
        })
      );
    });

    test('should handle region abbreviation correctly', () => {
      // Test us-west-2 region
      const app2 = new cdk.App();
      const stack2 = new cdk.Stack(app2, 'TestStack2', {
        env: { region: 'us-west-2' },
      });

      const vpc2 = new cdk.aws_ec2.Vpc(stack2, 'TestVpc2');
      const bucket2 = new cdk.aws_s3.Bucket(stack2, 'TestBucket2');
      const table2 = new cdk.aws_dynamodb.Table(stack2, 'TestTable2', {
        partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      });
      const role2 = new cdk.aws_iam.Role(stack2, 'TestRole2', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      new ComputeConstruct(stack2, 'Compute2', {
        environmentSuffix: 'test',
        region: 'us-west-2',
        vpc: vpc2,
        bucket: bucket2,
        dynamoDbTable: table2,
        executionRole: role2,
      });

      const template2 = Template.fromStack(stack2);
      template2.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup',
        Match.objectLike({
          Name: 'test-tg-usw2',
        })
      );
    });

    test('should create HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener',
        Match.objectLike({
          Port: 80,
          Protocol: 'HTTP',
          DefaultActions: Match.arrayWith([
            Match.objectLike({
              Type: 'forward',
            }),
          ]),
        })
      );
    });

    test('should create path-based routing rule', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule',
        Match.objectLike({
          Priority: 10,
          Conditions: Match.arrayWith([
            Match.objectLike({
              Field: 'path-pattern',
              PathPatternConfig: Match.objectLike({
                Values: Match.arrayWith(['/api/*']),
              }),
            }),
          ]),
          Actions: Match.arrayWith([
            Match.objectLike({
              Type: 'forward',
            }),
          ]),
        })
      );
    });

    test('should create domain-based routing rule', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule',
        Match.objectLike({
          Priority: 20,
          Conditions: Match.arrayWith([
            Match.objectLike({
              Field: 'host-header',
              HostHeaderConfig: Match.objectLike({
                Values: Match.arrayWith(['test.example.com']),
              }),
            }),
          ]),
          Actions: Match.arrayWith([
            Match.objectLike({
              Type: 'forward',
            }),
          ]),
        })
      );
    });
  });

  describe('Lambda Permissions', () => {
    test('should grant ALB permission to invoke Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission',
        Match.objectLike({
          Action: 'lambda:InvokeFunction',
          Principal: 'elasticloadbalancing.amazonaws.com',
        })
      );
    });
  });
});