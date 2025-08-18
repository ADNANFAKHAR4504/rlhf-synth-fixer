```python
from aws_cdk import (
  Stack,
  Duration,
  RemovalPolicy,
  CfnOutput,
  aws_lambda as _lambda,
  aws_dynamodb as ddb,
  aws_iam as iam,
  aws_cloudwatch as cw,
  aws_applicationautoscaling as appautoscaling,
)
from constructs import Construct


class ServerlessStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    dynamodb_table = ddb.Table(
      self,
      "CostEffectiveTable",
      partition_key=ddb.Attribute(name="ItemId", type=ddb.AttributeType.STRING),
      removal_policy=RemovalPolicy.DESTROY,
      billing_mode=ddb.BillingMode.PROVISIONED
    )

    read_scaling = appautoscaling.ScalableTarget(
      self,
      "DynamoDBReadScaling",
      min_capacity=1,
      max_capacity=1000,
      resource_id=f"table/{dynamodb_table.table_name}",
      scalable_dimension="dynamodb:table:ReadCapacityUnits",
      service_namespace=appautoscaling.ServiceNamespace.DYNAMODB,
    )
    read_scaling.scale_to_track_metric(
      "DynamoDBReadCapacityUtilization",
      target_value=70,
      predefined_metric=appautoscaling.PredefinedMetric.DYNAMODB_READ_CAPACITY_UTILIZATION,
    )

    write_scaling = appautoscaling.ScalableTarget(
      self,
      "DynamoDBWriteScaling",
      min_capacity=1,
      max_capacity=1000,
      resource_id=f"table/{dynamodb_table.table_name}",
      scalable_dimension="dynamodb:table:WriteCapacityUnits",
      service_namespace=appautoscaling.ServiceNamespace.DYNAMODB,
    )
    write_scaling.scale_to_track_metric(
      "DynamoDBWriteCapacityUtilization",
      target_value=70,
      predefined_metric=appautoscaling.PredefinedMetric.DYNAMODB_WRITE_CAPACITY_UTILIZATION,
    )

    lambda_role = iam.Role(
      self,
      "LambdaExecutionRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
      ]
    )

    lambda_function = _lambda.Function(
      self,
      "CostEffectiveLambda",
      runtime=_lambda.Runtime.PYTHON_3_9,
      code=_lambda.Code.from_inline(
        "def handler(event, context): return 'Hello from Lambda!'"
      ),
      handler="index.handler",
      timeout=Duration.seconds(5),
      role=lambda_role,
      environment={
        "TABLE_NAME": dynamodb_table.table_name
      }
    )

    dynamodb_table.grant_read_write_data(lambda_function)

    dashboard = cw.Dashboard(
      self,
      "ServerlessDashboard",
      dashboard_name="ServerlessMonitoringDashboard"
    )

    dashboard.add_widgets(
      cw.GraphWidget(
        title="Lambda Errors",
        left=[
          cw.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            dimensions_map={"FunctionName": lambda_function.function_name},
            statistic="Sum",
            period=Duration.minutes(1),
          )
        ]
      )
    )

    dashboard.add_widgets(
      cw.GraphWidget(
        title="DynamoDB Read Capacity",
        left=[
          cw.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            dimensions_map={"TableName": dynamodb_table.table_name},
            statistic="Sum",
            period=Duration.minutes(1),
          )
        ]
      )
    )

    CfnOutput(
      self,
      "DynamoDBTableName",
      value=dynamodb_table.table_name,
      description="The name of the DynamoDB table",
      export_name="ServerlessStackDynamoDBTableName"
    )

    CfnOutput(
      self,
      "LambdaFunctionName",
      value=lambda_function.function_name,
      description="The name of the Lambda function",
      export_name="ServerlessStackLambdaFunctionName"
    )

    CfnOutput(
      self,
      "CloudWatchDashboardName",
      value=dashboard.dashboard_name,
      description="The name of the CloudWatch Dashboard",
      export_name="ServerlessStackCloudWatchDashboardName"
    )

```