#!/usr/bin/env python3
"""
Multi-environment payment processing infrastructure entry point.
This module initializes and deploys the payment processing stack for the specified environment.
"""
import pulumi
from payment_infrastructure import PaymentInfrastructure, PaymentInfrastructureArgs

# Get Pulumi configuration
config = pulumi.Config()

# Get environment-specific configuration
environment = pulumi.get_stack()
environment_config = config.get_object("environment_config") or {}

# Create the payment infrastructure
infrastructure = PaymentInfrastructure(
    "payment-processing-infra",
    PaymentInfrastructureArgs(
        environment=environment,
        vpc_cidr=environment_config.get("vpc_cidr", "10.2.0.0/16"),
        rds_instance_count=environment_config.get("rds_instance_count", 1),
        rds_instance_class=environment_config.get("rds_instance_class", "db.t3.medium"),
        rds_backup_retention=environment_config.get("rds_backup_retention", 1),
        lambda_memory_size=environment_config.get("lambda_memory_size", 512),
        dynamodb_billing_mode=environment_config.get("dynamodb_billing_mode", "PAY_PER_REQUEST"),
        dynamodb_read_capacity=environment_config.get("dynamodb_read_capacity", None),
        dynamodb_write_capacity=environment_config.get("dynamodb_write_capacity", None),
        enable_cloudwatch_alarms=environment_config.get("enable_cloudwatch_alarms", False),
        cloudwatch_cpu_threshold=environment_config.get("cloudwatch_cpu_threshold", 80),
        use_nat_gateway=environment_config.get("use_nat_gateway", False),
        enable_pitr=environment_config.get("enable_pitr", False),
        enable_s3_lifecycle=environment_config.get("enable_s3_lifecycle", False),
    )
)

# Export stack outputs
pulumi.export("vpc_id", infrastructure.vpc.id)
pulumi.export("rds_cluster_endpoint", infrastructure.rds_cluster.endpoint)
pulumi.export("lambda_function_arns", {
    "payment_processor": infrastructure.payment_processor_lambda.arn,
    "transaction_validator": infrastructure.transaction_validator_lambda.arn,
})
pulumi.export("dynamodb_table_names", {
    "transactions": infrastructure.transactions_table.name,
    "audit_logs": infrastructure.audit_logs_table.name,
})
pulumi.export("s3_bucket_names", {
    "audit_storage": infrastructure.audit_storage_bucket.bucket,
    "transaction_data": infrastructure.transaction_data_bucket.bucket,
})