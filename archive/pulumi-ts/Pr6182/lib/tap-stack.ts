/**
 * tap-stack.ts
 *
 * Main TapStack orchestrator for multi-environment payment processing infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { EnvironmentConfig } from './types';
import { VpcStack } from './vpc-stack';
import { AlbStack } from './alb-stack';
import { RdsStack } from './rds-stack';
import { EcsStack } from './ecs-stack';
import { S3Stack } from './s3-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albUrl: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly ecsClusterId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const config = new pulumi.Config();
    const environmentSuffix =
      args.environmentSuffix || config.get('env') || 'dev';

    // Determine environment from suffix or config
    const environment = config.get('environment') || environmentSuffix;

    // Environment-specific configuration
    const envConfigs: { [key: string]: Partial<EnvironmentConfig> } = {
      dev: {
        vpcCidr: '10.1.0.0/16',
        ecsTaskCount: 1,
        rdsInstanceClass: 'db.t3.micro',
        rdsMultiAz: false,
        s3LifecycleDays: 7,
        enableSsl: false,
        enableMonitoring: false,
      },
      staging: {
        vpcCidr: '10.2.0.0/16',
        ecsTaskCount: 2,
        rdsInstanceClass: 'db.t3.small',
        rdsMultiAz: false,
        s3LifecycleDays: 30,
        enableSsl: true,
        enableMonitoring: true,
      },
      prod: {
        vpcCidr: '10.3.0.0/16',
        ecsTaskCount: 4,
        rdsInstanceClass: 'db.t3.medium',
        rdsMultiAz: true,
        s3LifecycleDays: 90,
        enableSsl: true,
        enableMonitoring: true,
      },
    };

    const envConfig = envConfigs[environment] || envConfigs.dev;

    const fullConfig: EnvironmentConfig = {
      environment,
      environmentSuffix,
      vpcCidr: envConfig.vpcCidr!,
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      ecsTaskCount: envConfig.ecsTaskCount!,
      rdsInstanceClass: envConfig.rdsInstanceClass!,
      rdsMultiAz: envConfig.rdsMultiAz!,
      s3LifecycleDays: envConfig.s3LifecycleDays!,
      enableSsl: envConfig.enableSsl!,
      enableMonitoring: envConfig.enableMonitoring!,
      tags: {
        ...args.tags,
        Environment: environment,
        ManagedBy: 'Pulumi',
        EnvironmentSuffix: environmentSuffix,
      },
    };

    // Create VPC stack
    const vpcStack = new VpcStack(
      `${environment}-vpc`,
      {
        config: fullConfig,
      },
      { parent: this }
    );

    // Create ALB stack
    const albStack = new AlbStack(
      `${environment}-alb`,
      {
        config: fullConfig,
        vpcOutputs: vpcStack.outputs,
      },
      { parent: this }
    );

    // Create RDS stack
    const rdsStack = new RdsStack(
      `${environment}-rds`,
      {
        config: fullConfig,
        vpcOutputs: vpcStack.outputs,
      },
      { parent: this }
    );

    // Create ECS stack
    const ecsStack = new EcsStack(
      `${environment}-ecs`,
      {
        config: fullConfig,
        vpcOutputs: vpcStack.outputs,
        albOutputs: albStack.outputs,
        rdsOutputs: rdsStack.outputs,
      },
      { parent: this }
    );

    // Create S3 stack
    const s3Stack = new S3Stack(
      `${environment}-s3`,
      {
        config: fullConfig,
      },
      { parent: this }
    );

    // Create Monitoring stack (only for staging/prod)
    new MonitoringStack(
      `${environment}-monitoring`,
      {
        config: fullConfig,
        ecsOutputs: ecsStack.outputs,
        clusterName: `${environment}-payment-cluster-${environmentSuffix}`,
        serviceName: `${environment}-payment-service-${environmentSuffix}`,
      },
      { parent: this }
    );

    // Expose outputs
    this.vpcId = vpcStack.outputs.vpcId;
    this.albUrl = albStack.outputs.albUrl;
    this.rdsEndpoint = rdsStack.outputs.endpoint;
    this.bucketName = s3Stack.outputs.bucketName;
    this.ecsClusterId = ecsStack.outputs.clusterId;

    this.registerOutputs({
      vpcId: this.vpcId,
      albUrl: this.albUrl,
      rdsEndpoint: this.rdsEndpoint,
      bucketName: this.bucketName,
      ecsClusterId: this.ecsClusterId,
      environment: environment,
      environmentSuffix: environmentSuffix,
    });
  }
}
