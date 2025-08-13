import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from typing import Dict, Any, Optional, List


class DynamoDBTableComponent(ComponentResource):
  """
  A component that creates a DynamoDB table with:
  - On-demand capacity mode
  - Environment-specific naming and tagging
  - Configurable attributes and keys
  """

  def __init__(
      self,
      name: str,
      environment: str,
      hash_key: str,
      range_key: Optional[str] = None,
      attributes: Optional[List[Dict[str, str]]] = None,
      tags: Optional[Dict[str, str]] = None,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__("custom:aws:DynamoDBTableComponent", name, None, opts)

    # Default tags
    default_tags = {
      "Environment": environment,
      "ManagedBy": "Pulumi",
      "Project": "aws-infrastructure"
    }
    if tags:
      default_tags.update(tags)

    # Default attributes if none provided
    if attributes is None:
      attributes = [
        {"name": hash_key, "type": "S"}
      ]
      if range_key:
        attributes.append({"name": range_key, "type": "S"})

    # Create DynamoDB table
    table_args = {
      "name": f"{environment}-{name}",
      "billing_mode": "PAY_PER_REQUEST",  # On-demand capacity
      "hash_key": hash_key,
      "attributes": [
        aws.dynamodb.TableAttributeArgs(
          name=attr["name"],
          type=attr["type"]
        ) for attr in attributes
      ],
      "tags": default_tags
    }

    if range_key:
      table_args["range_key"] = range_key

    self.table = aws.dynamodb.Table(
      f"{name}-table",
      point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True
      ),
      **table_args,
      opts=ResourceOptions(parent=self)
    )

    # Register outputs
    self.register_outputs({
      "dynamodb_table_name": self.table.name,
      "dynamodb_table_arn": self.table.arn
    })

  @property
  def table_name(self) -> pulumi.Output[str]:
    """Returns the table name"""
    return self.table.name

  @property
  def table_arn(self) -> pulumi.Output[str]:
    """Returns the table ARN"""
    return self.table.arn
