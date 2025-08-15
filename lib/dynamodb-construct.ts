// DynamoDB construct for production
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { Construct } from 'constructs';

export class DynamoDbConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // DynamoDB Table
    const dynamoTable = new DynamodbTable(this, 'production-table', {
      name: 'production-table',
      hashKey: 'id',
      attribute: [
        { name: 'id', type: 'S' }
      ],
      billingMode: 'PROVISIONED',
      readCapacity: 5,
      writeCapacity: 5,
      tags: {
        Name: 'production-table',
        Environment: 'production'
      }
    });

    // Auto Scaling Target
    new AppautoscalingTarget(this, 'dynamodb-autoscaling-target', {
      maxCapacity: 100,
      minCapacity: 5,
      resourceId: `table/${dynamoTable.name}`,
      scalableDimension: 'dynamodb:table:ReadCapacityUnits',
      serviceNamespace: 'dynamodb'
    });

    // Auto Scaling Policy
    new AppautoscalingPolicy(this, 'dynamodb-autoscaling-policy', {
      name: 'DynamoDBReadCapacityUtilization',
      policyType: 'TargetTrackingScaling',
      resourceId: `table/${dynamoTable.name}`,
      scalableDimension: 'dynamodb:table:ReadCapacityUnits',
      serviceNamespace: 'dynamodb',
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'DynamoDBReadCapacityUtilization'
        },
        targetValue: 70,
        scaleInCooldown: 60,
        scaleOutCooldown: 60
      }
    });
  }
}
