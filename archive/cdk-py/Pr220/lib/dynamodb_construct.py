from aws_cdk import (
  aws_dynamodb as dynamodb,
  RemovalPolicy,
)
from constructs import Construct

class DynamoDBConstruct(Construct):
  def __init__(self, scope: Construct, construct_id: str, 
               table_name: str = None, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    
    # Use provided table name or generate one based on construct hierarchy
    actual_table_name = table_name or "ProcessedLogEntriesTable"
    
    self.dynamodb_table = dynamodb.Table(
      self,
      "ProcessedLogEntriesTable",
      table_name=actual_table_name,
      partition_key=dynamodb.Attribute(name="serviceName", type=dynamodb.AttributeType.STRING),
      sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.STRING),
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
      point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
        point_in_time_recovery_enabled=True
      ),
      removal_policy=RemovalPolicy.DESTROY,
    )