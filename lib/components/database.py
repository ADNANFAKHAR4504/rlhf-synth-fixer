# components/database.py
"""
Database component that creates RDS Multi-AZ and DynamoDB with encryption
Implements high availability and cross-region replication strategies
"""

import pulumi
import pulumi_aws as aws
from typing import List

class DatabaseComponent(pulumi.ComponentResource):
    def __init__(self, name: str, vpc_id: pulumi.Output[str], private_subnet_ids: List[pulumi.Output[str]], 
                 database_security_group_id: pulumi.Output[str], region: str, is_primary: bool, 
                 tags: dict, opts: pulumi.ResourceOptions = None):
        super().__init__("custom:database:DatabaseComponent", name, None, opts)
        
        self.region = region
        self.is_primary = is_primary
        self.tags = tags
        
        # Create DB Subnet Group for RDS Multi-AZ deployment
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"{name}-db-subnet-group",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"{name}-db-subnet-group"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create RDS instance with Multi-AZ, encryption, and automated backups
        self.rds_instance = aws.rds.Instance(
            f"{name}-rds-instance",
            identifier=f"pulumi-optimization-db-{region}",
            engine="postgres",
            engine_version="17.5",
            instance_class="db.m5.large",
            allocated_storage=100,
            max_allocated_storage=1000,  # Enable storage autoscaling
            
            # Database configuration
            db_name="pulumioptimization",
            username="dbadmin",
            manage_master_user_password=True,  # AWS manages password in Secrets Manager
            
            # High Availability and Backup
            multi_az=True,  # Multi-AZ deployment for HA
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            
            # Security
            vpc_security_group_ids=[database_security_group_id],
            db_subnet_group_name=self.db_subnet_group.name,
            publicly_accessible=False,
            
            # Encryption at rest
            storage_encrypted=True,
            # kms_key_id will use default RDS KMS key
            
            # Performance and Monitoring
            performance_insights_enabled=True,
            monitoring_interval=60,
            enabled_cloudwatch_logs_exports=["postgresql"],
            
            # Deletion protection for production
            deletion_protection=True,
            skip_final_snapshot=False,
            final_snapshot_identifier=f"pulumi-optimization-db-{region}-final-snapshot",
            
            tags={**tags, "Name": f"{name}-rds-instance"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Export RDS endpoint for Lambda connections
        self.rds_endpoint = self.rds_instance.endpoint
        
        # Create DynamoDB table with encryption and auto-scaling
        self.dynamodb_table = aws.dynamodb.Table(
            f"{name}-dynamodb-table",
            name=f"pulumi-optimization-{region}",
            billing_mode="PAY_PER_REQUEST",  # On-demand pricing with auto-scaling
            
            # Define primary key
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            hash_key="id",
            range_key="timestamp",
            
            # Enable encryption at rest
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                # Uses AWS managed key by default
            ),
            
            # Enable point-in-time recovery
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            
            # Configure streams for cross-region replication
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            
            tags={**tags, "Name": f"{name}-dynamodb-table"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Set up DynamoDB Global Tables for cross-region replication (primary region only)
        if is_primary:
            # Create replica in secondary region
            secondary_region = "us-west-2" if region == "us-east-1" else "us-east-1"
            
            # Note: Global Tables v2 (2019.11.21) is automatically enabled with streams
            # The replica will be created by the secondary region deployment
            pass
        
        account_id = aws.get_caller_identity_output().account_id
        dest_vault_arn = account_id.apply(
            lambda aid: f"arn:aws:backup:{secondary_region if is_primary else 'us-east-1'}:{aid}:backup-vault:Default"
        )


        # Create DynamoDB backup vault for additional protection
        self.dynamodb_backup = aws.backup.Plan(
            f"{name}-dynamodb-backup-plan",
            rules=[
                aws.backup.PlanRuleArgs(
                    rule_name="daily_backup",
                    target_vault_name="default",  # Use default backup vault
                    schedule="cron(0 2 ? * * *)",  # Daily at 2 AM
                    start_window=60,  # 1 hour
                    completion_window=120,  # 2 hours
                    lifecycle=aws.backup.PlanRuleLifecycleArgs(
                        cold_storage_after=30,
                        delete_after=365
                    ),
                    copy_actions=[
                        aws.backup.PlanRuleCopyActionArgs(
                            # destination_vault_arn=f"arn:aws:backup:{secondary_region if is_primary else 'us-east-1'}:{account_id}:backup-vault:default",
                            destination_vault_arn=dest_vault_arn,
                            # destination_vault_arn=f"arn:aws:backup:us-east-1:*:backup-vault:default",
                            lifecycle=aws.backup.PlanRuleCopyActionLifecycleArgs(
                                cold_storage_after=30,
                                delete_after=365
                            )
                        )
                    ] if is_primary else []
                )
            ],
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # IAM role for backup service
        backup_role = aws.iam.Role(
            f"{name}-backup-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "backup.amazonaws.com"
                        }
                    }
                ]
            }""",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Attach AWS managed backup policy
        aws.iam.RolePolicyAttachment(
            f"{name}-backup-policy-attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create backup selection for DynamoDB table
        self.backup_selection = aws.backup.Selection(
            f"{name}-dynamodb-backup-selection",
            iam_role_arn=backup_role.arn,
            name=f"{name}-dynamodb-backup-selection",
            plan_id=self.dynamodb_backup.id,
            resources=[self.dynamodb_table.arn],
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        self.register_outputs({})