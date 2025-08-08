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
  """
  A CDK stack that provisions a serverless application infrastructure.
  Includes a DynamoDB table with autoscaling, a Lambda function,
  and a CloudWatch dashboard for monitoring.
  """

  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    table = self._create_dynamodb_table()
    self._configure_autoscaling(table)
    lambda_fn = self._create_lambda_function(table)
    dashboard = self._create_dashboard(lambda_fn, table)
    self._add_outputs(table, lambda_fn, dashboard)

  def _create_dynamodb_table(self) -> ddb.Table:
    return ddb.Table(
      self,
      "CostEffectiveTable",
      partition_key=ddb.Attribute(name="ItemId", type=ddb.AttributeType.STRING),
      removal_policy=RemovalPolicy.DESTROY,
      billing_mode=ddb.BillingMode.PROVISIONED,
    )

  def _configure_autoscaling(self, table: ddb.Table) -> None:
    for name, dimension in [
      ("Read", "ReadCapacityUnits"),
      ("Write", "WriteCapacityUnits"),
    ]:
      target = appautoscaling.ScalableTarget(
        self,
        f"DynamoDB{name}ScalingTargetPolicy",
        min_capacity=1,
        max_capacity=1000,
        resource_id=f"table/{table.table_name}",
        scalable_dimension=f"dynamodb:table:{dimension}",
        service_namespace=appautoscaling.ServiceNamespace.DYNAMODB,
      )
      metric_enum = getattr(
        appautoscaling.PredefinedMetric,
        f"DYNAMODB_{name.upper()}_CAPACITY_UTILIZATION"
      )
      target.scale_to_track_metric(
        f"DynamoDB{name}CapacityUtilization",
        target_value=70,
        predefined_metric=metric_enum,
      )

  def _create_lambda_function(self, table: ddb.Table) -> _lambda.Function:
    role = iam.Role(
      self,
      "LambdaExecutionRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ]
    )

    lambda_fn = _lambda.Function(
      self,
      "CostEffectiveLambda",
      runtime=_lambda.Runtime.PYTHON_3_9,
      code=_lambda.Code.from_inline(
        "def handler(event, context): return 'Hello from Lambda!'"
      ),
      handler="index.handler",
      timeout=Duration.seconds(5),
      role=role,
      environment={"TABLE_NAME": table.table_name},
    )

    table.grant_read_write_data(lambda_fn)
    return lambda_fn

  def _create_dashboard(
    self,
    lambda_fn: _lambda.Function,
    table: ddb.Table
  ) -> cw.Dashboard:
    dashboard = cw.Dashboard(
      self,
      "ServerlessDashboard",
      dashboard_name=f"{self.stack_name}-ServerlessMonitoringDashboard",
    )

    dashboard.add_widgets(
      cw.GraphWidget(
        title="Lambda Errors",
        left=[
          cw.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            dimensions_map={"FunctionName": lambda_fn.function_name},
            statistic="Sum",
            period=Duration.minutes(1),
          )
        ]
      ),
      cw.GraphWidget(
        title="DynamoDB Read Capacity",
        left=[
          cw.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            dimensions_map={"TableName": table.table_name},
            statistic="Sum",
            period=Duration.minutes(1),
          )
        ]
      )
    )
    return dashboard

  def _add_outputs(
    self,
    table: ddb.Table,
    lambda_fn: _lambda.Function,
    dashboard: cw.Dashboard
  ) -> None:
    CfnOutput(
      self,
      "DynamoDBTableName",
      value=table.table_name,
      description="The name of the DynamoDB table",
      export_name="ServerlessStackDynamoDBTableName"
    )
    CfnOutput(
      self,
      "LambdaFunctionName",
      value=lambda_fn.function_name,
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
