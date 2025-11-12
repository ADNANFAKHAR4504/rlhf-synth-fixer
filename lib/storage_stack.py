from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    Tags,
    CfnOutput,
    Fn
)
from constructs import Construct

class StorageStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 dr_role: str, is_primary: bool = True,
                 destination_bucket_arn: str = None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for payment data
        bucket = s3.Bucket(
            self, f"PaymentData-{environment_suffix}",
            bucket_name=f"payment-data-{dr_role}-{environment_suffix}-{self.account}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        self.bucket = bucket
        Tags.of(bucket).add("DR-Role", dr_role)

        CfnOutput(
            self, "BucketArn",
            value=bucket.bucket_arn,
            export_name=f"{dr_role}-bucket-arn-{environment_suffix}"
        )

        CfnOutput(
            self, "BucketName",
            value=bucket.bucket_name,
            export_name=f"{dr_role}-bucket-name-{environment_suffix}"
        )

        # Configure cross-region replication if primary
        if is_primary and destination_bucket_arn:
            # Create replication role
            replication_role = iam.Role(
                self, f"S3ReplicationRole-{environment_suffix}",
                assumed_by=iam.ServicePrincipal("s3.amazonaws.com"),
                description="S3 Cross-Region Replication Role"
            )

            # Grant permissions
            replication_role.add_to_policy(
                iam.PolicyStatement(
                    actions=[
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket"
                    ],
                    resources=[bucket.bucket_arn]
                )
            )

            replication_role.add_to_policy(
                iam.PolicyStatement(
                    actions=[
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl"
                    ],
                    resources=[f"{bucket.bucket_arn}/*"]
                )
            )

            replication_role.add_to_policy(
                iam.PolicyStatement(
                    actions=[
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete"
                    ],
                    resources=[f"{destination_bucket_arn}/*"]
                )
            )

            # Configure replication
            cfn_bucket = bucket.node.default_child
            cfn_bucket.replication_configuration = s3.CfnBucket.ReplicationConfigurationProperty(
                role=replication_role.role_arn,
                rules=[
                    s3.CfnBucket.ReplicationRuleProperty(
                        status="Enabled",
                        priority=1,
                        destination=s3.CfnBucket.ReplicationDestinationProperty(
                            bucket=destination_bucket_arn,
                            replication_time=s3.CfnBucket.ReplicationTimeProperty(
                                status="Enabled",
                                time=s3.CfnBucket.ReplicationTimeValueProperty(
                                    minutes=15
                                )
                            ),
                            metrics=s3.CfnBucket.MetricsProperty(
                                status="Enabled",
                                event_threshold=s3.CfnBucket.ReplicationTimeValueProperty(
                                    minutes=15
                                )
                            )
                        ),
                        filter=s3.CfnBucket.ReplicationRuleFilterProperty(
                            prefix=""
                        )
                    )
                ]
            )
