import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-construct';
import { DatabaseConstruct } from './database-construct';
import { LambdaConstruct } from './lambda-construct';
import { StorageConstruct } from './storage-construct';
import { ParameterConstruct } from './parameter-construct';
import { getEnvironmentConfig } from './environment-config';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environment: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment configuration
    const config = getEnvironmentConfig(props.environment);

    // Create VPC
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      environmentSuffix: props.environmentSuffix,
      config,
    });

    // Create Database
    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct', {
      environmentSuffix: props.environmentSuffix,
      config,
      vpc: vpcConstruct.vpc,
      securityGroup: vpcConstruct.databaseSecurityGroup,
    });

    // Create Lambda functions
    const lambdaConstruct = new LambdaConstruct(this, 'LambdaConstruct', {
      environmentSuffix: props.environmentSuffix,
      config,
      vpc: vpcConstruct.vpc,
      securityGroup: vpcConstruct.lambdaSecurityGroup,
      databaseSecretArn: databaseConstruct.credentials.secretArn,
    });

    // Create Storage resources
    const storageConstruct = new StorageConstruct(this, 'StorageConstruct', {
      environmentSuffix: props.environmentSuffix,
      config,
    });

    // Grant Lambda access to S3 and DynamoDB
    storageConstruct.dataBucket.grantReadWrite(
      lambdaConstruct.dataProcessorFunction
    );
    storageConstruct.stateTable.grantReadWriteData(
      lambdaConstruct.dataProcessorFunction
    );

    // Create SSM parameters
    new ParameterConstruct(this, 'ParameterConstruct', {
      environmentSuffix: props.environmentSuffix,
      environment: props.environment,
      databaseEndpoint: databaseConstruct.database.dbInstanceEndpointAddress,
      bucketName: storageConstruct.dataBucket.bucketName,
      tableName: storageConstruct.stateTable.tableName,
    });

    // Add stack tags
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('CostCenter', 'analytics');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
  }
}
