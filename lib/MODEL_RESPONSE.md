# CI/CD Infrastructure for Educational Platform - MODEL RESPONSE

This implementation provides a CI/CD infrastructure with RDS, ElastiCache, and CodePipeline.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

CI/CD infrastructure for educational platform with student data management.
"""

from typing import Optional
import json

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
    """
    Arguments for TapStack component.

    Args:
        environment_suffix: Suffix for resource naming
        tags: Optional tags for resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main infrastructure stack for CI/CD educational platform.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create VPC
        vpc = aws.ec2.Vpc(
            f"vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create public subnet
        public_subnet = aws.ec2.Subnet(
            f"public-subnet-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={**self.tags, "Name": f"public-subnet-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create private subnets
        private_subnet_1 = aws.ec2.Subnet(
            f"private-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1a",
            tags={**self.tags, "Name": f"private-subnet-1-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        private_subnet_2 = aws.ec2.Subnet(
            f"private-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone="us-east-1b",
            tags={**self.tags, "Name": f"private-subnet-2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Elastic IP for NAT Gateway
        eip = aws.ec2.Eip(
            f"nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={**self.tags, "Name": f"nat-eip-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # NAT Gateway
        nat_gateway = aws.ec2.NatGateway(
            f"nat-gateway-{self.environment_suffix}",
            allocation_id=eip.id,
            subnet_id=public_subnet.id,
            tags={**self.tags, "Name": f"nat-gateway-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id,
                )
            ],
            tags={**self.tags, "Name": f"public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Private route table
        private_rt = aws.ec2.RouteTable(
            f"private-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id,
                )
            ],
            tags={**self.tags, "Name": f"private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Route table associations
        aws.ec2.RouteTableAssociation(
            f"public-rta-{self.environment_suffix}",
            subnet_id=public_subnet.id,
            route_table_id=public_rt.id,
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.RouteTableAssociation(
            f"private-rta-1-{self.environment_suffix}",
            subnet_id=private_subnet_1.id,
            route_table_id=private_rt.id,
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.RouteTableAssociation(
            f"private-rta-2-{self.environment_suffix}",
            subnet_id=private_subnet_2.id,
            route_table_id=private_rt.id,
            opts=ResourceOptions(parent=self)
        )

        # Security group for RDS
        rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for RDS MySQL instance",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["10.0.0.0/16"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.tags, "Name": f"rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Security group for ElastiCache
        cache_sg = aws.ec2.SecurityGroup(
            f"cache-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ElastiCache",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    cidr_blocks=["10.0.0.0/16"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.tags, "Name": f"cache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # DB subnet group
        db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{self.environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={**self.tags, "Name": f"db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create secret for database credentials
        db_secret = aws.secretsmanager.Secret(
            f"db-credentials-{self.environment_suffix}",
            description="Database credentials for student management system",
            tags={**self.tags, "Name": f"db-credentials-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Store initial credentials (ISSUE: Using hardcoded password)
        db_secret_version = aws.secretsmanager.SecretVersion(
            f"db-credentials-version-{self.environment_suffix}",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": "admin",
                "password": "TempPassword123!"
            }),
            opts=ResourceOptions(parent=self)
        )

        # RDS instance (ISSUE: Missing skip_final_snapshot for destroyability)
        rds_instance = aws.rds.Instance(
            f"student-db-{self.environment_suffix}",
            allocated_storage=20,
            engine="mysql",
            engine_version="8.0",
            instance_class="db.t3.micro",
            db_name="studentdb",
            username="admin",
            password="TempPassword123!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            publicly_accessible=False,
            storage_encrypted=True,
            tags={**self.tags, "Name": f"student-db-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ElastiCache subnet group
        cache_subnet_group = aws.elasticache.SubnetGroup(
            f"cache-subnet-group-{self.environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={**self.tags, "Name": f"cache-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ElastiCache cluster
        cache_cluster = aws.elasticache.Cluster(
            f"session-cache-{self.environment_suffix}",
            engine="redis",
            node_type="cache.t3.micro",
            num_cache_nodes=1,
            port=6379,
            subnet_group_name=cache_subnet_group.name,
            security_group_ids=[cache_sg.id],
            tags={**self.tags, "Name": f"session-cache-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # SNS topic for approval notifications
        approval_topic = aws.sns.Topic(
            f"pipeline-approval-{self.environment_suffix}",
            display_name="Pipeline Approval Notifications",
            tags={**self.tags, "Name": f"pipeline-approval-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # IAM role for CodePipeline
        pipeline_role = aws.iam.Role(
            f"pipeline-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"pipeline-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Attach policy to pipeline role (ISSUE: Overly permissive policy)
        aws.iam.RolePolicyAttachment(
            f"pipeline-policy-attachment-{self.environment_suffix}",
            role=pipeline_role.name,
            policy_arn="arn:aws:iam::aws:policy/AdministratorAccess",
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket for artifacts
        artifact_bucket = aws.s3.Bucket(
            f"pipeline-artifacts-{self.environment_suffix}",
            tags={**self.tags, "Name": f"pipeline-artifacts-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # IAM role for CodeBuild
        build_role = aws.iam.Role(
            f"build-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "codebuild.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"build-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # CodeBuild project
        build_project = aws.codebuild.Project(
            f"student-app-build-{self.environment_suffix}",
            service_role=build_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE",
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/standard:5.0",
                type="LINUX_CONTAINER",
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
            ),
            tags={**self.tags, "Name": f"student-app-build-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # CodePipeline (ISSUE: Missing staging environment and proper approval stage)
        pipeline = aws.codepipeline.Pipeline(
            f"student-app-pipeline-{self.environment_suffix}",
            role_arn=pipeline_role.arn,
            artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
                location=artifact_bucket.bucket,
                type="S3",
            ),
            stages=[
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Source",
                            category="Source",
                            owner="AWS",
                            provider="CodeCommit",
                            version="1",
                            output_artifacts=["source_output"],
                            configuration={
                                "RepositoryName": "student-app",
                                "BranchName": "main",
                            },
                        ),
                    ],
                ),
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Build",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["source_output"],
                            output_artifacts=["build_output"],
                            configuration={
                                "ProjectName": build_project.name,
                            },
                        ),
                    ],
                ),
            ],
            tags={**self.tags, "Name": f"student-app-pipeline-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "vpc_id": vpc.id,
            "rds_endpoint": rds_instance.endpoint,
            "cache_endpoint": cache_cluster.cache_nodes[0].address,
            "pipeline_name": pipeline.name,
            "secret_arn": db_secret.arn,
        })
```

## Known Issues in This Implementation

1. **Missing skip_final_snapshot**: RDS instance doesn't have `skip_final_snapshot=True`, making it difficult to destroy
2. **Hardcoded password**: Database password is hardcoded instead of being generated
3. **No secret rotation**: SecretsManager secret doesn't have rotation configured
4. **Overly permissive IAM**: Pipeline role uses AdministratorAccess instead of least privilege
5. **Missing staging environment**: Pipeline only has source and build stages, no staging/production separation
6. **No manual approval**: Pipeline missing approval action before production deployment
7. **Incomplete CodeBuild policy**: Build role has no attached policies for CloudWatch logs or S3 access
