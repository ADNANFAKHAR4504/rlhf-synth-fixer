from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
import json


class SecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, vpc):
        super().__init__(scope, id)

        # KMS Key for encryption
        self.kms_key = KmsKey(self, "kms_key",
            description=f"KMS key for financial transaction platform {environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={
                "Name": f"financial-kms-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        KmsAlias(self, "kms_alias",
            name=f"alias/financial-transaction-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

        # ALB Security Group
        self.alb_sg = SecurityGroup(self, "alb_sg",
            name=f"financial-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from anywhere"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"financial-alb-sg-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # EC2 Instance Security Group
        self.ec2_sg = SecurityGroup(self, "ec2_sg",
            name=f"financial-ec2-sg-{environment_suffix}",
            description="Security group for EC2 instances",
            vpc_id=vpc.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id],
                    description="Allow HTTP from ALB"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id],
                    description="Allow HTTPS from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"financial-ec2-sg-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # RDS Security Group
        self.rds_sg = SecurityGroup(self, "rds_sg",
            name=f"financial-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora cluster",
            vpc_id=vpc.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.ec2_sg.id],
                    description="Allow MySQL from EC2 instances"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"financial-rds-sg-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # IAM Role for EC2 Instances
        self.ec2_role = IamRole(self, "ec2_role",
            name=f"financial-ec2-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"financial-ec2-role-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # EC2 IAM Policy
        ec2_policy = IamPolicy(self, "ec2_policy",
            name=f"financial-ec2-policy-{environment_suffix}",
            description="Policy for EC2 instances",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": f"arn:aws:secretsmanager:us-east-1:*:secret:financial-db-credentials-{environment_suffix}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": self.kms_key.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": "arn:aws:logs:us-east-1:*:log-group:/aws/ec2/financial-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"arn:aws:s3:::financial-logs-{environment_suffix}/*"
                    }
                ]
            }),
            tags={
                "Name": f"financial-ec2-policy-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        IamRolePolicyAttachment(self, "ec2_policy_attachment",
            role=self.ec2_role.name,
            policy_arn=ec2_policy.arn
        )

        # Attach SSM managed policy for Systems Manager access
        IamRolePolicyAttachment(self, "ec2_ssm_policy",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        # Instance Profile for EC2
        self.ec2_instance_profile = IamInstanceProfile(self, "ec2_instance_profile",
            name=f"financial-ec2-profile-{environment_suffix}",
            role=self.ec2_role.name
        )

        # IAM Role for Lambda (Secrets Rotation)
        self.lambda_role = IamRole(self, "lambda_role",
            name=f"financial-lambda-rotation-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"financial-lambda-role-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Lambda IAM Policy
        lambda_policy = IamPolicy(self, "lambda_policy",
            name=f"financial-lambda-rotation-policy-{environment_suffix}",
            description="Policy for Lambda secrets rotation",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:DescribeSecret",
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:PutSecretValue",
                            "secretsmanager:UpdateSecretVersionStage"
                        ],
                        "Resource": f"arn:aws:secretsmanager:us-east-1:*:secret:financial-db-credentials-{environment_suffix}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetRandomPassword"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:ModifyDBCluster"
                        ],
                        "Resource": f"arn:aws:rds:us-east-1:*:cluster:financial-aurora-{environment_suffix}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": self.kms_key.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface",
                            "ec2:AssignPrivateIpAddresses",
                            "ec2:UnassignPrivateIpAddresses"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"financial-lambda-policy-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        IamRolePolicyAttachment(self, "lambda_policy_attachment",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Attach Lambda basic execution role
        IamRolePolicyAttachment(self, "lambda_basic_execution",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Lambda Security Group (for VPC access)
        self.lambda_sg = SecurityGroup(self, "lambda_sg",
            name=f"financial-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=vpc.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"financial-lambda-sg-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Allow Lambda to access RDS
        SecurityGroup(self, "lambda_to_rds_rule",
            name=f"financial-lambda-to-rds-{environment_suffix}",
            description="Allow Lambda to access RDS",
            vpc_id=vpc.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.lambda_sg.id],
                    description="Allow MySQL from Lambda"
                )
            ],
            tags={
                "Name": f"financial-lambda-to-rds-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )
