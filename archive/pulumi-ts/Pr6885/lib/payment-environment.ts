import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { PaymentInfraProps } from './types';
import { NetworkComponent } from './network';
import { DatabaseComponent } from './database';
import { IamComponent } from './iam';
import { ComputeComponent } from './compute';
import { ApiComponent } from './api';
import { StorageComponent } from './storage';
import { MonitoringComponent } from './monitoring';

export class PaymentEnvironmentComponent extends pulumi.ComponentResource {
  public network: NetworkComponent;
  public database: DatabaseComponent;
  public iam: IamComponent;
  public compute: ComputeComponent;
  public api: ApiComponent;
  public storage: StorageComponent;
  public monitoring: MonitoringComponent;
  public kmsKey: aws.kms.Key;

  constructor(
    name: string,
    props: PaymentInfraProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:PaymentEnvironmentComponent', name, {}, opts);

    // Create KMS key for encryption
    this.kmsKey = new aws.kms.Key(
      `kms-key-${props.environment}-${props.environmentSuffix}`,
      {
        description: `KMS key for ${props.environment} payment processing`,
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: {
          Name: `payments-kms-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const kmsAlias = new aws.kms.Alias(
      `kms-alias-${props.environment}-${props.environmentSuffix}`,
      {
        name: `alias/payments-${props.environment}-${props.environmentSuffix}`,
        targetKeyId: this.kmsKey.keyId,
      },
      { parent: this }
    );

    // Create network infrastructure
    this.network = new NetworkComponent(
      `network-${props.environment}`,
      {
        environment: props.environment,
        environmentSuffix: props.environmentSuffix,
        vpcCidr: '10.0.0.0/16',
      },
      { parent: this }
    );

    // Create storage resources
    this.storage = new StorageComponent(
      `storage-${props.environment}`,
      {
        environment: props.environment,
        environmentSuffix: props.environmentSuffix,
        logRetentionDays: props.config.logRetentionDays,
      },
      { parent: this }
    );

    // Create IAM roles
    this.iam = new IamComponent(
      `iam-${props.environment}`,
      {
        environment: props.environment,
        environmentSuffix: props.environmentSuffix,
        transactionTableArn: this.storage.transactionTable.arn,
        auditBucketArn: this.storage.auditBucket.arn,
      },
      { parent: this }
    );

    // Create database
    this.database = new DatabaseComponent(
      `database-${props.environment}`,
      {
        environment: props.environment,
        environmentSuffix: props.environmentSuffix,
        subnetIds: this.network.privateSubnets.map(s => s.id),
        securityGroupId: this.network.securityGroup.id,
        kmsKey: this.kmsKey,
      },
      { parent: this }
    );

    // Create Lambda functions
    this.compute = new ComputeComponent(
      `compute-${props.environment}`,
      {
        environment: props.environment,
        environmentSuffix: props.environmentSuffix,
        lambdaConcurrency: props.config.lambdaConcurrency,
        role: this.iam.lambdaRole,
      },
      { parent: this }
    );

    // Create API Gateway
    this.api = new ApiComponent(
      `api-${props.environment}`,
      {
        environment: props.environment,
        environmentSuffix: props.environmentSuffix,
        paymentProcessorFunction: this.compute.paymentProcessorFunction,
        validationFunction: this.compute.validationFunction,
        enableWaf: props.config.enableWaf,
      },
      { parent: this }
    );

    // Create monitoring
    this.monitoring = new MonitoringComponent(
      `monitoring-${props.environment}`,
      {
        environment: props.environment,
        environmentSuffix: props.environmentSuffix,
        clusterIdentifier: this.database.cluster.id,
        rdsAlarmThreshold: props.config.rdsAlarmThreshold,
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
