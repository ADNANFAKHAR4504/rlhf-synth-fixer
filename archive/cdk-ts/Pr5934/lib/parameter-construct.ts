import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ParameterConstructProps {
  environmentSuffix: string;
  environment: string;
  databaseEndpoint: string;
  bucketName: string;
  tableName: string;
}

export class ParameterConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ParameterConstructProps) {
    super(scope, id);

    // Database endpoint parameter
    new ssm.StringParameter(
      this,
      `DBEndpointParam-${props.environmentSuffix}`,
      {
        parameterName: `/${props.environment}/database/endpoint`,
        stringValue: props.databaseEndpoint,
        description: 'RDS database endpoint',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    // S3 bucket parameter
    new ssm.StringParameter(this, `BucketParam-${props.environmentSuffix}`, {
      parameterName: `/${props.environment}/storage/bucket`,
      stringValue: props.bucketName,
      description: 'S3 data bucket name',
      tier: ssm.ParameterTier.STANDARD,
    });

    // DynamoDB table parameter
    new ssm.StringParameter(this, `TableParam-${props.environmentSuffix}`, {
      parameterName: `/${props.environment}/storage/table`,
      stringValue: props.tableName,
      description: 'DynamoDB state table name',
      tier: ssm.ParameterTier.STANDARD,
    });
  }
}
