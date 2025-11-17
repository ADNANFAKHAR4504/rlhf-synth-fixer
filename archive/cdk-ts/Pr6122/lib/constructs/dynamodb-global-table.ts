import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface DynamoDBGlobalTableProps {
  readonly tableName: string;
  readonly drRegion: string;
  readonly environmentSuffix: string;
}

export class DynamoDBGlobalTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBGlobalTableProps) {
    super(scope, id);

    // Create DynamoDB table with proper CDK v2 global table configuration
    this.table = new dynamodb.Table(this, 'GlobalTable', {
      tableName: props.tableName,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand billing as required
      pointInTimeRecovery: true, // Point-in-time recovery enabled as required
      removalPolicy: RemovalPolicy.DESTROY, // For cleanup
      deletionProtection: false, // Allow destroy
      // Note: Global table replication will be set up via custom resource
      // as the native CDK support may vary between versions
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // Required for global tables
    });

    // Add GSI for order lookups
    this.table.addGlobalSecondaryIndex({
      indexName: 'orderStatusIndex',
      partitionKey: {
        name: 'orderStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    // Set up global table replication using custom resource
    this.setupGlobalTableReplication(props.drRegion);

    // Add tags
    this.table.node.addMetadata('aws:cdk:tagging', {
      Project: 'iac-rlhf-amazon',
      Environment: props.environmentSuffix,
      Component: 'DynamoDB',
    });
  }

  private setupGlobalTableReplication(drRegion: string): void {
    // Create Lambda function to set up global table replication
    const globalTableSetupFunction = new lambda.Function(
      this,
      'GlobalTableSetup',
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
import json
import cfnresponse

def handler(event, context):
    try:
        if event['RequestType'] == 'Delete':
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            return
            
        table_name = event['ResourceProperties']['TableName']
        dr_region = event['ResourceProperties']['DRRegion']
        
        # Create global table
        dynamodb = boto3.client('dynamodb')
        
        try:
            # Check if global table already exists
            response = dynamodb.describe_table(TableName=table_name)
            if 'GlobalTableDescription' in response.get('Table', {}):
                print(f"Global table {table_name} already exists")
                cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                    'GlobalTableArn': response['Table'].get('TableArn', '')
                })
                return
        except dynamodb.exceptions.ResourceNotFoundException:
            pass
        
        # Create replica table in DR region
        dr_dynamodb = boto3.client('dynamodb', region_name=dr_region)
        
        # Get table description
        table_desc = dynamodb.describe_table(TableName=table_name)['Table']
        
        # Create replica table
        create_table_params = {
            'TableName': table_name,
            'KeySchema': table_desc['KeySchema'],
            'AttributeDefinitions': table_desc['AttributeDefinitions'],
            'BillingMode': 'PAY_PER_REQUEST',
            'StreamSpecification': {
                'StreamEnabled': True,
                'StreamViewType': 'NEW_AND_OLD_IMAGES'
            }
        }
        
        # Add GSIs if they exist
        if 'GlobalSecondaryIndexes' in table_desc:
            create_table_params['GlobalSecondaryIndexes'] = []
            for gsi in table_desc['GlobalSecondaryIndexes']:
                gsi_def = {
                    'IndexName': gsi['IndexName'],
                    'KeySchema': gsi['KeySchema'],
                    'Projection': gsi['Projection']
                }
                create_table_params['GlobalSecondaryIndexes'].append(gsi_def)
        
        try:
            dr_dynamodb.create_table(**create_table_params)
            print(f"Created replica table {table_name} in {dr_region}")
        except dr_dynamodb.exceptions.ResourceInUseException:
            print(f"Replica table {table_name} already exists in {dr_region}")
        
        # Wait for table to be active
        waiter = dr_dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {
            'ReplicaCreated': 'true'
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {})
      `),
        timeout: Duration.minutes(5),
      }
    );

    // Grant DynamoDB permissions
    globalTableSetupFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:CreateTable',
          'dynamodb:DescribeTable',
          'dynamodb:CreateGlobalTable',
          'dynamodb:DescribeGlobalTable',
          'dynamodb:UpdateGlobalTable',
        ],
        resources: ['*'],
      })
    );

    // Create custom resource
    new CustomResource(this, 'GlobalTableReplication', {
      serviceToken: globalTableSetupFunction.functionArn,
      properties: {
        TableName: this.table.tableName,
        DRRegion: drRegion,
      },
    });
  }
}
