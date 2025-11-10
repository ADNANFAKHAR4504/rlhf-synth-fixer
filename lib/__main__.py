"""Main entry point for the multi-environment payment processing infrastructure."""
import pulumi
from payment_stack import PaymentProcessingStack

# Get configuration
config = pulumi.Config()
environment = pulumi.get_stack()
environment_suffix = config.require("environmentSuffix")
vpc_cidr = config.require("vpcCidr")
region = config.require("awsRegion")
cost_center = config.require("costCenter")
enable_multi_az = config.get_bool("enableMultiAz") or False
db_instance_class = config.get("dbInstanceClass") or "db.t3.micro"
dynamodb_read_capacity = config.get_int("dynamodbReadCapacity") or 5
dynamodb_write_capacity = config.get_int("dynamodbWriteCapacity") or 5
log_retention_days = config.get_int("logRetentionDays") or 7

# Create the payment processing stack
stack = PaymentProcessingStack(
    name=f"payment-{environment}",
    environment=environment,
    environment_suffix=environment_suffix,
    vpc_cidr=vpc_cidr,
    region=region,
    cost_center=cost_center,
    enable_multi_az=enable_multi_az,
    db_instance_class=db_instance_class,
    dynamodb_read_capacity=dynamodb_read_capacity,
    dynamodb_write_capacity=dynamodb_write_capacity,
    log_retention_days=log_retention_days,
)

# Export outputs
pulumi.export("vpc_id", stack.vpc_id)
pulumi.export("public_subnet_ids", stack.public_subnet_ids)
pulumi.export("private_subnet_ids", stack.private_subnet_ids)
pulumi.export("api_gateway_url", stack.api_gateway_url)
pulumi.export("dynamodb_table_name", stack.dynamodb_table_name)
pulumi.export("rds_endpoint", stack.rds_endpoint)
pulumi.export("audit_bucket_name", stack.audit_bucket_name)
pulumi.export("lambda_function_name", stack.lambda_function_name)
