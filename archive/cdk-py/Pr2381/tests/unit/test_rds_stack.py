# tests/unit/test_rds_stack.py

import pytest
from aws_cdk import App, Environment, Stack
from aws_cdk.assertions import Template, Match

from lib.cdk.rds_stack import RdsStack
from lib.cdk.vpc_stack import VpcStack


@pytest.fixture(scope="module")
def rds_stack():
    """Create an RdsStack instance for testing."""
    app = App(context={"stack": "test"})
    env = Environment(region="us-east-1")

    # Create a stack to provide proper scope
    stack = Stack(app, "TestStack", env=env)
    vpc_stack = VpcStack(stack, "TestVPC", env=env)
    rds_stack = RdsStack(stack, "TestRDS", vpc=vpc_stack.vpc, env=env)
    return Template.from_stack(rds_stack)


def test_rds_configuration(rds_stack):
    """Test RDS stack configuration."""

    # Validate RDS instance
    rds_stack.resource_count_is("AWS::RDS::DBInstance", 1)
    rds_stack.has_resource_properties("AWS::RDS::DBInstance", {
        "Engine": "mysql",
        "MultiAZ": True,
        "DBInstanceClass": "db.t3.micro",
        "AllocatedStorage": "20",
        "StorageEncrypted": True,
        "DBName": "appdb",
        "EngineVersion": "8.0",
        "DBInstanceIdentifier": Match.any_value(),
        "VPCSecurityGroups": Match.any_value(),
        "DBSubnetGroupName": Match.any_value()
    })

    # Validate Secrets Manager
    rds_stack.resource_count_is("AWS::SecretsManager::Secret", 1)
    rds_stack.has_resource_properties("AWS::SecretsManager::Secret", {
        "GenerateSecretString": {
            "SecretStringTemplate": Match.serialized_json({"username": "admin"}),
            "GenerateStringKey": "password"
        }
    })

    # Validate Subnet Group
    rds_stack.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
    rds_stack.has_resource_properties("AWS::RDS::DBSubnetGroup", {
        "SubnetIds": Match.any_value(),
        "DBSubnetGroupDescription": Match.any_value()
    })

    # Optional: Uncomment if explicitly defining security groups with ingress rules
    # rds_stack.resource_count_is("AWS::EC2::SecurityGroup", 1)
    # rds_stack.has_resource_properties("AWS::EC2::SecurityGroup", {
    #     "GroupDescription": Match.any_value(),
    #     "VpcId": Match.any_value(),
    #     "SecurityGroupIngress": [
    #         {
    #             "IpProtocol": "tcp",
    #             "FromPort": 3306,
    #             "ToPort": 3306,
    #             "CidrIp": "10.0.0.0/16"
    #         }
    #     ]
    # })
    