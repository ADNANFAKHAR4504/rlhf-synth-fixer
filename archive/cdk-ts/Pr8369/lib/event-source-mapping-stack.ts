import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface EventSourceMappingStackProps extends cdk.StackProps {
  environmentSuffix: string;
  userDataTable: dynamodb.Table;
  orderDataTable: dynamodb.Table;
  userDataProcessor: lambda.Function;
  orderDataProcessor: lambda.Function;
}

export class EventSourceMappingStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: EventSourceMappingStackProps
  ) {
    super(scope, id, props);

    // Event source mapping for User Data Table
    props.userDataProcessor.addEventSource(
      new lambdaEventSources.DynamoEventSource(props.userDataTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        retryAttempts: 3,
        parallelizationFactor: 2,
        reportBatchItemFailures: true,
      })
    );

    // Event source mapping for Order Data Table
    props.orderDataProcessor.addEventSource(
      new lambdaEventSources.DynamoEventSource(props.orderDataTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 5,
        maxBatchingWindow: cdk.Duration.seconds(10),
        retryAttempts: 3,
        parallelizationFactor: 1,
        reportBatchItemFailures: true,
      })
    );
  }
}
