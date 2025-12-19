/**
 * TapStack - Main orchestrator for payment processing infrastructure
 *
 * This stack coordinates all component resources and exports key outputs.
 */
import * as pulumi from '@pulumi/pulumi';
import { NetworkingStack } from './components/networking';
import { DataStack } from './components/data';
import { ComputeStack } from './components/compute';
import { MonitoringStack } from './components/monitoring';
import { ApiGatewayStack } from './components/api-gateway';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'payment-processing',
      ManagedBy: 'Pulumi',
    }));

    // 1. Networking: VPC, subnets, NAT gateways, VPC endpoints, flow logs, transit gateway
    const networking = new NetworkingStack(
      `networking-${environmentSuffix}`,
      {
        environmentSuffix,
        cidrBlock: '10.0.0.0/16',
        availabilityZoneCount: 3,
        tags,
      },
      { parent: this }
    );

    // 2. Data: DynamoDB, S3, KMS
    const data = new DataStack(
      `data-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 3. Compute: Lambda functions
    const compute = new ComputeStack(
      `compute-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: networking.vpc,
        privateSubnetIds: networking.privateSubnetIds,
        securityGroupId: networking.lambdaSecurityGroupId,
        tableName: data.tableName,
        bucketName: data.bucketName,
        snsTopicArn: pulumi.output(''), // Will be set after monitoring stack
        tags,
      },
      { parent: this }
    );

    // 4. API Gateway
    const apiGateway = new ApiGatewayStack(
      `api-${environmentSuffix}`,
      {
        environmentSuffix,
        validatorLambdaArn: compute.validatorLambdaArn,
        tags,
      },
      { parent: this }
    );

    // 5. Monitoring: CloudWatch logs, dashboard, alarms, SNS
    const monitoring = new MonitoringStack(
      `monitoring-${environmentSuffix}`,
      {
        environmentSuffix,
        validatorLambdaName: compute.validatorLambdaName,
        processorLambdaName: compute.processorLambdaName,
        notifierLambdaName: compute.notifierLambdaName,
        tableName: data.tableName,
        apiGatewayId: apiGateway.apiId,
        apiGatewayStageName: apiGateway.stageName,
        flowLogGroupName: networking.flowLogGroupName,
        tags,
      },
      { parent: this }
    );

    // Update compute stack with SNS topic ARN
    compute.setSnsTopicArn(monitoring.snsTopicArn);

    // Export key outputs
    this.apiUrl = apiGateway.apiUrl;
    this.bucketName = data.bucketName;
    this.tableName = data.tableName;
    this.dashboardUrl = monitoring.dashboardUrl;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      bucketName: this.bucketName,
      tableName: this.tableName,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
