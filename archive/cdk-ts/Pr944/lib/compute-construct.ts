import * as cdk from 'aws-cdk-lib';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: cdk.aws_ec2.Vpc;
  bucket: cdk.aws_s3.Bucket;
  dynamoDbTable: cdk.aws_dynamodb.Table;
  executionRole: cdk.aws_iam.Role;
}

export class ComputeConstruct extends Construct {
  public readonly lambdaFunction: cdk.aws_lambda.Function;
  public readonly alb: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      region,
      vpc,
      bucket,
      dynamoDbTable,
      executionRole,
    } = props;

    // Lambda function
    this.lambdaFunction = new cdk.aws_lambda.Function(this, 'MainFunction', {
      functionName: `${environmentSuffix}-main-function-${region}`,
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: cdk.aws_lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    # Example handler with cross-region resource access
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
    
    s3 = boto3.client('s3')
    bucket_name = os.environ['S3_BUCKET']
    
    try:
        # Sample operations
        response = table.get_item(
            Key={'PK': 'sample', 'SK': 'item'}
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Success',
                'region': os.environ['AWS_REGION'],
                'dynamodb_response': response.get('Item', {}),
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
      environment: {
        DYNAMODB_TABLE: dynamoDbTable.tableName,
        S3_BUCKET: bucket.bucketName,
      },
      role: executionRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      retryAttempts: 2,
    });

    // ALB Security Group
    const albSecurityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      'AlbSecurityGroup',
      {
        vpc: vpc,
        securityGroupName: `${environmentSuffix}-alb-sg-${region}`,
        description: 'Security group for Application Load Balancer',
      }
    );

    albSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Application Load Balancer
    this.alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      'MainALB',
      {
        loadBalancerName: `${environmentSuffix}-alb-${region}`,
        vpc: vpc,
        internetFacing: true,
        vpcSubnets: {
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        securityGroup: albSecurityGroup,
        deletionProtection: false, // For dev/test environments
      }
    );

    // Target Group for Lambda (name max 32 chars)
    const shortRegion = region === 'us-east-1' ? 'use1' : 'usw2';
    const lambdaTarget =
      new cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup(
        this,
        'LambdaTargetGroup',
        {
          targetGroupName: `${environmentSuffix}-tg-${shortRegion}`,
          targetType: cdk.aws_elasticloadbalancingv2.TargetType.LAMBDA,
          targets: [new targets.LambdaTarget(this.lambdaFunction)],
          healthCheck: {
            enabled: true,
            healthyHttpCodes: '200',
          },
        }
      );

    // ALB Listener with path-based routing
    const listener = this.alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [lambdaTarget],
    });

    // Path-based routing rules
    listener.addTargetGroups('ApiRouting', {
      targetGroups: [lambdaTarget],
      conditions: [
        cdk.aws_elasticloadbalancingv2.ListenerCondition.pathPatterns([
          '/api/*',
        ]),
      ],
      priority: 10,
    });

    // Domain-based routing (if needed)
    listener.addTargetGroups('DomainRouting', {
      targetGroups: [lambdaTarget],
      conditions: [
        cdk.aws_elasticloadbalancingv2.ListenerCondition.hostHeaders([
          `${environmentSuffix}.example.com`,
        ]),
      ],
      priority: 20,
    });

    // Lambda permission for ALB
    this.lambdaFunction.addPermission('AlbInvokePermission', {
      principal: new cdk.aws_iam.ServicePrincipal(
        'elasticloadbalancing.amazonaws.com'
      ),
      sourceArn: lambdaTarget.targetGroupArn,
    });
  }
}
