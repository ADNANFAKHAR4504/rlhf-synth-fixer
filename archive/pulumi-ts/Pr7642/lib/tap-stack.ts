import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { Ec2Stack } from './ec2-stack';
import { LambdaStack } from './lambda-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly instanceIds: pulumi.Output<string[]>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC infrastructure
    const vpcStack = new VpcStack(
      'vpc',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create EC2 instances
    const ec2Stack = new Ec2Stack(
      'ec2',
      {
        environmentSuffix,
        vpcId: vpcStack.vpc.id,
        privateSubnetIds: pulumi.all(vpcStack.privateSubnets.map(s => s.id)),
        tags,
      },
      { parent: this }
    );

    // Create Lambda for tag remediation
    const lambdaStack = new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create monitoring and compliance dashboard
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        instanceIds: pulumi.all(ec2Stack.instances.map(i => i.id)),
        lambdaFunctionArn: lambdaStack.function.arn,
        tags,
      },
      { parent: this }
    );

    // Set outputs
    this.vpcId = vpcStack.vpc.id;
    this.instanceIds = pulumi.all(ec2Stack.instances.map(i => i.id));
    this.lambdaFunctionArn = lambdaStack.function.arn;
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${monitoringStack.dashboard.dashboardName}`;

    this.registerOutputs({
      vpcId: this.vpcId,
      instanceIds: this.instanceIds,
      lambdaFunctionArn: this.lambdaFunctionArn,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
