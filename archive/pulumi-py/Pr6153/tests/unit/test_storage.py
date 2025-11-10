"""Unit tests for storage.py"""
import pulumi
import pytest
from pulumi import ResourceOptions

from lib.storage import StorageStack


def test_storage_stack_initialization():
    """Test StorageStack initialization with required parameters"""
    # Setup dummy values
    name = "test-storage"
    environment = "test"
    environment_suffix = "suffix"
    vpc_id = pulumi.Output.from_input("vpc-12345")
    private_subnet_ids = [
        pulumi.Output.from_input("subnet-1"),
        pulumi.Output.from_input("subnet-2")
    ]
    db_security_group_id = pulumi.Output.from_input("sg-12345")
    enable_multi_az = False
    db_instance_class = "db.t3.micro"
    dynamodb_read_capacity = 5
    dynamodb_write_capacity = 5
    log_retention_days = 7
    tags = {"environment": "test", "project": "payment"}

    # Create storage stack
    storage = StorageStack(
        name=name,
        environment=environment,
        environment_suffix=environment_suffix,
        vpc_id=vpc_id,
        private_subnet_ids=private_subnet_ids,
        db_security_group_id=db_security_group_id,
        enable_multi_az=enable_multi_az,
        db_instance_class=db_instance_class,
        dynamodb_read_capacity=dynamodb_read_capacity,
        dynamodb_write_capacity=dynamodb_write_capacity,
        log_retention_days=log_retention_days,
        tags=tags
    )

    # Verify basic attributes
    assert storage.dynamodb_table is not None
    assert storage.db_password is not None
    assert storage.db_password_param is not None
    assert storage.db_subnet_group is not None
    assert storage.rds_instance is not None
    assert storage.audit_bucket is not None
    assert storage.bucket_public_access_block is not None

    # Verify that outputs are properly exposed
    assert storage.dynamodb_table_name is not None
    assert storage.dynamodb_table_arn is not None
    assert storage.rds_endpoint is not None
    assert storage.audit_bucket_name is not None

def test_storage_stack_multi_az():
    """Test StorageStack with multi-AZ enabled"""
    name = "test-storage-multi-az"
    environment = "prod"
    environment_suffix = "suffix"
    vpc_id = pulumi.Output.from_input("vpc-12345")
    private_subnet_ids = [
        pulumi.Output.from_input("subnet-1"),
        pulumi.Output.from_input("subnet-2"),
        pulumi.Output.from_input("subnet-3")
    ]
    db_security_group_id = pulumi.Output.from_input("sg-12345")
    enable_multi_az = True  # Enable multi-AZ
    db_instance_class = "db.t3.medium"
    dynamodb_read_capacity = 10
    dynamodb_write_capacity = 10
    log_retention_days = 30
    tags = {"environment": "prod", "project": "payment"}

    # Create storage stack with multi-AZ enabled
    storage = StorageStack(
        name=name,
        environment=environment,
        environment_suffix=environment_suffix,
        vpc_id=vpc_id,
        private_subnet_ids=private_subnet_ids,
        db_security_group_id=db_security_group_id,
        enable_multi_az=enable_multi_az,
        db_instance_class=db_instance_class,
        dynamodb_read_capacity=dynamodb_read_capacity,
        dynamodb_write_capacity=dynamodb_write_capacity,
        log_retention_days=log_retention_days,
        tags=tags
    )

    # Verify objects are created
    assert storage.rds_instance is not None
    assert storage.db_subnet_group is not None

def test_storage_stack_with_opts():
    """Test StorageStack with options"""
    name = "test-storage-opts"
    environment = "staging"
    environment_suffix = "suffix"
    vpc_id = pulumi.Output.from_input("vpc-12345")
    private_subnet_ids = [
        pulumi.Output.from_input("subnet-1"),
        pulumi.Output.from_input("subnet-2")
    ]
    db_security_group_id = pulumi.Output.from_input("sg-12345")
    enable_multi_az = False
    db_instance_class = "db.t3.micro"
    dynamodb_read_capacity = 5
    dynamodb_write_capacity = 5
    log_retention_days = 7
    tags = {"environment": "staging", "project": "payment"}
    
    # Create custom resource options
    custom_opts = ResourceOptions(protect=True)

    # Create storage stack with custom options
    storage = StorageStack(
        name=name,
        environment=environment,
        environment_suffix=environment_suffix,
        vpc_id=vpc_id,
        private_subnet_ids=private_subnet_ids,
        db_security_group_id=db_security_group_id,
        enable_multi_az=enable_multi_az,
        db_instance_class=db_instance_class,
        dynamodb_read_capacity=dynamodb_read_capacity,
        dynamodb_write_capacity=dynamodb_write_capacity,
        log_retention_days=log_retention_days,
        tags=tags,
        opts=custom_opts
    )

    # Just verify objects are created with custom options
    assert storage.dynamodb_table is not None
    assert storage.rds_instance is not None
    assert storage.audit_bucket is not None
    