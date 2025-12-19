import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CrossStackReferencesArgs {
  environmentSuffix: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  ecsClusterArn: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  auroraEndpoint: pulumi.Output<string>;
}

export class CrossStackReferences extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: CrossStackReferencesArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:CrossStackReferences', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Get reference to other stack if it exists
    const config = new pulumi.Config();
    const referenceStackName = config.get('referenceStack');

    if (referenceStackName) {
      const stackRef = new pulumi.StackReference(
        `stack-ref-${args.environmentSuffix}`,
        {
          name: referenceStackName,
        },
        defaultResourceOptions
      );

      // Validate network configuration is synchronized
      const refVpcId = stackRef.getOutput('vpcId');

      // Create VPC peering connection if different VPCs
      refVpcId.apply(refId => {
        if (refId !== args.vpcId) {
          new aws.ec2.VpcPeeringConnection(
            `vpc-peer-${args.environmentSuffix}`,
            {
              vpcId: args.vpcId,
              peerVpcId: refId,
              autoAccept: true,
              tags: {
                Name: `vpc-peer-${args.environmentSuffix}`,
                Environment: args.environment,
                EnvironmentSuffix: args.environmentSuffix,
              },
            },
            defaultResourceOptions
          );
        }
      });

      // Store references for other environments
      new aws.ssm.Parameter(
        `ref-ecs-cluster-${args.environmentSuffix}`,
        {
          name: `/${args.environment}/references/ecs-cluster-${args.environmentSuffix}`,
          type: 'String',
          value: pulumi.output(args.ecsClusterArn),
          description: 'ECS cluster ARN reference',
          tags: {
            Name: `ref-ecs-cluster-${args.environmentSuffix}`,
            Environment: args.environment,
            EnvironmentSuffix: args.environmentSuffix,
          },
        },
        defaultResourceOptions
      );

      new aws.ssm.Parameter(
        `ref-alb-arn-${args.environmentSuffix}`,
        {
          name: `/${args.environment}/references/alb-arn-${args.environmentSuffix}`,
          type: 'String',
          value: pulumi.output(args.albArn),
          description: 'ALB ARN reference',
          tags: {
            Name: `ref-alb-arn-${args.environmentSuffix}`,
            Environment: args.environment,
            EnvironmentSuffix: args.environmentSuffix,
          },
        },
        defaultResourceOptions
      );
    }

    this.registerOutputs({});
  }
}
