/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */


import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class ComputeComponent extends pulumi.ComponentResource {
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly lambdaRole: aws.iam.Role;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;
  public readonly lambdaPermission: aws.lambda.Permission;
  public readonly targetGroupAttachment: aws.lb.TargetGroupAttachment;

  constructor(
    name: string,
    args: {
      environmentSuffix: string;
      region: string;
      isPrimary: boolean;
      vpcId: pulumi.Output<string>;
      subnetIds: pulumi.Output<string>[];
      securityGroupId: pulumi.Output<string>;
      tags: { [key: string]: string };
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:compute:ComputeComponent', name, {}, opts);

    const tags = {
      ...args.tags,
      Name: `${name}-${args.region}-${args.environmentSuffix}`,
      Region: args.region,
      'DR-Role': args.isPrimary ? 'primary' : 'secondary',
    };

    // Create IAM Role for Lambda
    this.lambdaRole = new aws.iam.Role(
      `${name}-lambda-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `lambda-role-${args.region}-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-policy`,
      {
        role: this.lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-vpc-policy`,
      {
        role: this.lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create Lambda Function with /health endpoint
    this.lambdaFunction = new aws.lambda.Function(
      `${name}-function`,
      {
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Extract path from ALB event
  const path = event.path || event.rawPath || '/';

  // Health check endpoint for Route53 and ALB
  if (path === '/health') {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "healthy",
        region: "${args.region}",
        isPrimary: ${args.isPrimary},
        timestamp: new Date().toISOString()
      })
    };
  }

  // Default application endpoint
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Healthcare API - ${args.region}",
      region: "${args.region}",
      isPrimary: ${args.isPrimary},
      timestamp: new Date().toISOString(),
      path: path
    })
  };
};
`),
        }),
        role: this.lambdaRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        vpcConfig: {
          subnetIds: args.subnetIds,
          securityGroupIds: [args.securityGroupId],
        },
        environment: {
          variables: {
            ENVIRONMENT: args.environmentSuffix,
            REGION: args.region,
            IS_PRIMARY: args.isPrimary.toString(),
          },
        },
        tags: {
          ...tags,
          Name: `lambda-function-${args.region}-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        loadBalancerType: 'application',
        subnets: args.subnetIds,
        securityGroups: [args.securityGroupId],
        internal: false,
        tags: { ...tags, Name: `alb-${args.region}-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Target Group with health check
    this.targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        targetType: 'lambda',
        healthCheck: {
          enabled: true,
          path: '/health',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: { ...tags, Name: `tg-${args.region}-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Lambda Permission for ALB (MUST be created BEFORE attachment)
    this.lambdaPermission = new aws.lambda.Permission(
      `${name}-lambda-permission`,
      {
        action: 'lambda:InvokeFunction',
        function: this.lambdaFunction.name,
        principal: 'elasticloadbalancing.amazonaws.com',
        sourceArn: this.targetGroup.arn,
      },
      { parent: this }
    );

    // Attach Lambda to Target Group (depends on permission being created first)
    this.targetGroupAttachment = new aws.lb.TargetGroupAttachment(
      `${name}-tg-attachment`,
      {
        targetGroupArn: this.targetGroup.arn,
        targetId: this.lambdaFunction.arn,
      },
      {
        parent: this,
        dependsOn: [this.lambdaFunction, this.targetGroup, this.lambdaPermission],
      }
    );

    // Create HTTP Listener (no HTTPS certificate required)
    this.listener = new aws.lb.Listener(
      `${name}-listener`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        tags: {
          ...tags,
          Name: `listener-${args.region}-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      functionArn: this.lambdaFunction.arn,
      albDnsName: this.alb.dnsName,
      albArn: this.alb.arn,
    });
  }
}
