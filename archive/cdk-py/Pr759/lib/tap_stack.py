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
  and a CloudWatch dashboard for monitoring. Cost optimization cannot be implemented as there is very less viewing access on AWS console to perform and automate the activity. Can be ignored for now.
  """

  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    table = self._create_dynamodb_table()
    self._add_autoscaling_to_table(table)
    lambda_fn = self._create_lambda_function(table)
    dashboard = self._create_monitoring_dashboard(lambda_fn, table, construct_id)
    self._add_stack_outputs(table, lambda_fn, dashboard)

  def _create_dynamodb_table(self) -> ddb.Table:
    return ddb.Table(
      self,
      "CostEffectiveTableV3",
      partition_key=ddb.Attribute(name="ItemId", type=ddb.AttributeType.STRING),
      removal_policy=RemovalPolicy.DESTROY,
      billing_mode=ddb.BillingMode.PAY_PER_REQUEST,
    )

  def _add_autoscaling_to_table(self, table: ddb.Table) -> None:
    for capacity_type in [("Read", "ReadCapacityUnits"), ("Write", "WriteCapacityUnits")]:
      name, dimension = capacity_type
      scalable_target = appautoscaling.ScalableTarget(
        self,
        f"DynamoDB{name}ScalingTargetPolicyV3",
        min_capacity=1,
        max_capacity=1000,
        resource_id=f"table/{table.table_name}",
        scalable_dimension=f"dynamodb:table:{dimension}",
        service_namespace=appautoscaling.ServiceNamespace.DYNAMODB,
      )
      predefined_metric = getattr(
        appautoscaling.PredefinedMetric,
        f"DYNAMODB_{name.upper()}_CAPACITY_UTILIZATION",
      )
      scalable_target.scale_to_track_metric(
        f"DynamoDB{name}CapacityUtilization",
        target_value=70,
        predefined_metric=predefined_metric,
      )

  def _create_lambda_function(self, table: ddb.Table) -> _lambda.Function:
    role = iam.Role(
      self,
      "LambdaExecutionRoleV3",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ],
    )

    fn = _lambda.Function(
      self,
      "CostEffectiveLambdaV3",
      runtime=_lambda.Runtime.PYTHON_3_12,
      code=_lambda.Code.from_inline(
        "def handler(event, context): return 'Hello from Lambda!'"
      ),
      handler="index.handler",
      timeout=Duration.seconds(5),
      role=role,
      environment={"TABLE_NAME": table.table_name},
    )

    table.grant_read_write_data(fn)
    return fn

  ## Created monitoring Dashboards and this requirement is for only cost saving, So extensive metrics were not configured.
  def _create_monitoring_dashboard(
    self, lambda_fn: _lambda.Function, table: ddb.Table, construct_id: str
  ) -> cw.Dashboard:
    dashboard = cw.Dashboard(
      self,
      "ServerlessDashboardV3",
      dashboard_name=f"{construct_id}-ServerlessMonitoringDashboardV3",
    )

    lambda_error_metric = cw.Metric(
      namespace="AWS/Lambda",
      metric_name="Errors",
      dimensions_map={"FunctionName": lambda_fn.function_name},
      statistic="Sum",
      period=Duration.minutes(1),
    )

    read_capacity_metric = cw.Metric(
      namespace="AWS/DynamoDB",
      metric_name="ConsumedReadCapacityUnits",
      dimensions_map={"TableName": table.table_name},
      statistic="Sum",
      period=Duration.minutes(1),
    )

    dashboard.add_widgets(
      cw.GraphWidget(title="Lambda Errors", left=[lambda_error_metric]),
      cw.GraphWidget(title="DynamoDB Read Capacity", left=[read_capacity_metric]),
    )

    return dashboard

  def _add_stack_outputs(
    self, table: ddb.Table, lambda_fn: _lambda.Function, dashboard: cw.Dashboard
  ) -> None:
    CfnOutput(
      self,
      "DynamoDBTableName",
      value=table.table_name,
      description="The name of the DynamoDB table",
      export_name="ServerlessStackV3DynamoDBTableName",
    )

    CfnOutput(
      self,
      "LambdaFunctionName",
      value=lambda_fn.function_name,
      description="The name of the Lambda function",
      export_name="ServerlessStackV3LambdaFunctionName",
    )

    CfnOutput(
      self,
      "CloudWatchDashboardName",
      value=dashboard.dashboard_name,
      description="The name of the CloudWatch Dashboard",
      export_name="ServerlessStackV3CloudWatchDashboardName",
    )
