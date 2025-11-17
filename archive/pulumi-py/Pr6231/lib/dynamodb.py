"""
DynamoDB Table for Session Management
Creates DynamoDB table with TTL enabled
"""

import pulumi
import pulumi_aws as aws

def create_dynamodb_table(environment_suffix: str):
    """
    Create DynamoDB table for user sessions with TTL
    """

    # Create DynamoDB table
    table = aws.dynamodb.Table(
        f"user-sessions-{environment_suffix}",
        name=f"user-sessions-{environment_suffix}",
        billing_mode="PAY_PER_REQUEST",  # On-demand pricing for cost optimization
        hash_key="session_id",
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="session_id",
                type="S"
            )
        ],
        ttl=aws.dynamodb.TableTtlArgs(
            enabled=True,
            attribute_name="expiry"
        ),
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True
        ),
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True
        ),
        tags={
            "Name": f"user-sessions-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    return table
