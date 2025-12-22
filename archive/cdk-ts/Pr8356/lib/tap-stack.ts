import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { StorageConstruct } from './storage-construct';
import { DatabaseConstruct } from './database-construct';
import { ApplicationConstruct } from './application-construct';

// Define a configuration interface for environment-specific overrides
interface EnvironmentConfig {
  instanceSize: string;
  vpcCidr: string;
}

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly networking: NetworkingConstruct;
  public readonly storage: StorageConstruct;
  public readonly database: DatabaseConstruct;
  public readonly application: ApplicationConstruct;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // --- Environment Configuration Strategy ---
    const envConfig: EnvironmentConfig = this.node.tryGetContext(
      environmentSuffix
    ) || {
      instanceSize: 'MICRO',
      vpcCidr: '10.0.0.0/16',
    };

    // --- Comprehensive Tagging Strategy ---
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'MultiRegionWebApp');

    // --- Instantiate Constructs ---
    // Each construct encapsulates related resources and logic

    // 1. Networking Infrastructure
    this.networking = new NetworkingConstruct(this, 'Networking', {
      vpcCidr: envConfig.vpcCidr,
      environmentSuffix,
    });

    // 2. Storage Infrastructure
    this.storage = new StorageConstruct(this, 'Storage', {
      environmentSuffix,
    });

    // 3. Database Infrastructure
    this.database = new DatabaseConstruct(this, 'Database', {
      vpc: this.networking.vpc,
      instanceSize: envConfig.instanceSize,
      environmentSuffix,
    });

    // 4. Application Infrastructure
    this.application = new ApplicationConstruct(this, 'Application', {
      vpc: this.networking.vpc,
      assetBucket: this.storage.assetBucket,
      databaseSecurityGroup: this.database.securityGroup,
      instanceSize: envConfig.instanceSize,
      environmentSuffix,
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.networking.vpc.vpcId,
      description: 'ID of the VPC',
    });
    new cdk.CfnOutput(this, 'AssetBucketName', {
      value: this.storage.assetBucket.bucketName,
      description: 'Name of the S3 bucket for application assets',
    });
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instance.instanceEndpoint.hostname,
      description: 'Endpoint address of the RDS database',
    });
  }
}
