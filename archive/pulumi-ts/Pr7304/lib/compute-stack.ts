/**
 * compute-stack.ts
 *
 * ALBs in both regions and Lambda@Edge for intelligent routing.
 * Lambda@Edge functions must be created in us-east-1.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ComputeStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  primaryVpcId: pulumi.Output<string>;
  secondaryVpcId: pulumi.Output<string>;
  primarySubnetIds: pulumi.Output<string[]>;
  secondarySubnetIds: pulumi.Output<string[]>;
  primaryAlbSecurityGroupId: pulumi.Output<string>;
  secondaryAlbSecurityGroupId: pulumi.Output<string>;
  primaryDbEndpoint: pulumi.Output<string>;
  secondaryDbEndpoint: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly primaryAlbDns: pulumi.Output<string>;
  public readonly secondaryAlbDns: pulumi.Output<string>;
  public readonly lambdaEdgeArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compute:ComputeStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Providers
    const primaryProvider = new aws.Provider(
      `compute-primary-provider-${environmentSuffix}`,
      {
        region: primaryRegion,
      },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      `compute-secondary-provider-${environmentSuffix}`,
      {
        region: secondaryRegion,
      },
      { parent: this }
    );

    // Lambda@Edge must be in us-east-1
    const edgeProvider = new aws.Provider(
      `edge-provider-${environmentSuffix}`,
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    // Primary ALB
    const primaryAlb = new aws.lb.LoadBalancer(
      `primary-alb-${environmentSuffix}`,
      {
        name: `primary-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        subnets: args.primarySubnetIds,
        securityGroups: [args.primaryAlbSecurityGroupId],
        enableHttp2: true,
        enableDeletionProtection: false,
        tags: {
          ...tags,
          Name: `primary-alb-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary Target Group
    const primaryTargetGroup = new aws.lb.TargetGroup(
      `primary-target-group-${environmentSuffix}`,
      {
        name: `primary-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: args.primaryVpcId,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          ...tags,
          Name: `primary-target-group-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary ALB Listener (HTTP for testing)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _primaryListener = new aws.lb.Listener(
      `primary-listener-${environmentSuffix}`,
      {
        loadBalancerArn: primaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: primaryTargetGroup.arn,
          },
        ],
      },
      { parent: this, provider: primaryProvider }
    );

    // Secondary ALB
    const secondaryAlb = new aws.lb.LoadBalancer(
      `secondary-alb-${environmentSuffix}`,
      {
        name: `secondary-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        subnets: args.secondarySubnetIds,
        securityGroups: [args.secondaryAlbSecurityGroupId],
        enableHttp2: true,
        enableDeletionProtection: false,
        tags: {
          ...tags,
          Name: `secondary-alb-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Secondary Target Group
    const secondaryTargetGroup = new aws.lb.TargetGroup(
      `secondary-target-group-${environmentSuffix}`,
      {
        name: `secondary-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: args.secondaryVpcId,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          ...tags,
          Name: `secondary-target-group-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Secondary ALB Listener (HTTP for testing)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _secondaryListener = new aws.lb.Listener(
      `secondary-listener-${environmentSuffix}`,
      {
        loadBalancerArn: secondaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: secondaryTargetGroup.arn,
          },
        ],
      },
      { parent: this, provider: secondaryProvider }
    );

    // IAM Role for Lambda@Edge
    const lambdaEdgeRole = new aws.iam.Role(
      `lambda-edge-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `lambda-edge-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: edgeProvider }
    );

    // Lambda@Edge Policy
    const lambdaEdgePolicy = new aws.iam.RolePolicyAttachment(
      `lambda-edge-policy-${environmentSuffix}`,
      {
        role: lambdaEdgeRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this, provider: edgeProvider }
    );

    // Lambda@Edge Function for Intelligent Routing
    // Note: Environment variables are not supported in Lambda@Edge.
    // This function demonstrates intelligent routing logic.
    // In production, route to specific origins using CloudFront configuration.
    const lambdaEdgeFunction = new aws.lambda.Function(
      `edge-routing-${environmentSuffix}`,
      {
        name: `edge-routing-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaEdgeRole.arn,
        timeout: 5,
        memorySize: 128,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Check for custom region health header
  const regionHealth = headers['x-region-health'] ? headers['x-region-health'][0].value : 'primary';

  // In production, these domain names would be dynamically configured
  // or retrieved from Parameter Store / Secrets Manager
  const primaryDomain = process.env.PRIMARY_DOMAIN || 'primary-alb.example.com';
  const secondaryDomain = process.env.SECONDARY_DOMAIN || 'secondary-alb.example.com';

  if (regionHealth === 'secondary') {
    // Route to secondary region
    request.origin = {
      custom: {
        domainName: secondaryDomain,
        port: 443,
        protocol: 'https',
        sslProtocols: ['TLSv1.2'],
        readTimeout: 30,
        keepaliveTimeout: 5,
      },
    };
  } else {
    // Route to primary region (default)
    request.origin = {
      custom: {
        domainName: primaryDomain,
        port: 443,
        protocol: 'https',
        sslProtocols: ['TLSv1.2'],
        readTimeout: 30,
        keepaliveTimeout: 5,
      },
    };
  }

  return request;
};
        `),
        }),
        publish: true,
        tags: {
          ...tags,
          Name: `edge-routing-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: edgeProvider,
        dependsOn: [lambdaEdgeRole, lambdaEdgePolicy],
      }
    );

    // Outputs
    this.primaryAlbDns = primaryAlb.dnsName;
    this.secondaryAlbDns = secondaryAlb.dnsName;
    this.lambdaEdgeArn = pulumi.interpolate`${lambdaEdgeFunction.arn}:${lambdaEdgeFunction.version}`;

    this.registerOutputs({
      primaryAlbDns: this.primaryAlbDns,
      secondaryAlbDns: this.secondaryAlbDns,
      lambdaEdgeArn: this.lambdaEdgeArn,
    });
  }
}
