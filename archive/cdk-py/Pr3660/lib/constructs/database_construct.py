from aws_cdk import (
    aws_dynamodb as dynamodb,
    RemovalPolicy,
    Duration,
    aws_ssm as ssm,
)
from constructs import Construct


class DatabaseConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        env_name: str,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        # Create DynamoDB table
        self.table = dynamodb.Table(
            self,
            "InventoryTable",
            table_name=f"inventory-{env_name}",
            partition_key=dynamodb.Attribute(
                name="item_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sku",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Cost-efficient for 3000 orders/day
            removal_policy=RemovalPolicy.RETAIN if env_name == "prod" else RemovalPolicy.DESTROY,
            point_in_time_recovery=True if env_name == "prod" else False,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,  # For future event-driven features
        )

        # Add GSI for querying by category
        self.table.add_global_secondary_index(
            index_name="category-index",
            partition_key=dynamodb.Attribute(
                name="category",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="updated_at",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # Add GSI for querying by status
        self.table.add_global_secondary_index(
            index_name="status-index",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="item_id",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # Store table name in Parameter Store
        ssm.StringParameter(
            self,
            "TableNameParameter",
            parameter_name=f"/inventory/{env_name}/table-name",
            string_value=self.table.table_name,
            description=f"DynamoDB table name for {env_name} environment"
        )

        # If using provisioned capacity (alternative for predictable workloads)
        # Uncomment below for auto-scaling configuration
        """
        if env_name == "prod":
            # Configure auto-scaling for read capacity
            read_scaling = self.table.auto_scale_read_capacity(
                min_capacity=5,
                max_capacity=100
            )
            read_scaling.scale_on_utilization(
                target_utilization_percent=70
            )

            # Configure auto-scaling for write capacity
            write_scaling = self.table.auto_scale_write_capacity(
                min_capacity=5,
                max_capacity=100
            )
            write_scaling.scale_on_utilization(
                target_utilization_percent=70
            )
        """
