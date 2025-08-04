
```python
#modules/vpc/vpc.py
import pulumi
import pulumi_aws as aws
from typing import Dict, List

class SecureVPC:
    def __init__(self, name: str, region: str, cidr_block: str = "10.0.0.0/16"):
        self.name = name
        self.region = region
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"secure-projectx-vpc-{region}",
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"secure-projectx-vpc-{region}",
                "Environment": "production",
                "Project": "ProjectX",
                "Security": "high"
            }
        )
        
        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"secure-projectx-igw-{region}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"secure-projectx-igw-{region}",
                "Project": "ProjectX"
            }
        )
        
        # Create subnets
        self.public_subnets = []
        self.private_subnets = []
        
        availability_zones = aws.get_availability_zones(state="available").names
        
        for i, az in enumerate(availability_zones[:2]):  # Use first 2 AZs
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"secure-projectx-public-subnet-{i+1}-{region}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"secure-projectx-public-subnet-{i+1}-{region}",
                    "Type": "Public",
                    "Project": "ProjectX"
                }
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"secure-projectx-private-subnet-{i+1}-{region}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"secure-projectx-private-subnet-{i+1}-{region}",
                    "Type": "Private",
                    "Project": "ProjectX"
                }
            )
            self.private_subnets.append(private_subnet)
        
        # Create NAT Gateway for private subnets
        self.eip = aws.ec2.Eip(
            f"secure-projectx-nat-eip-{region}",
            domain="vpc",
            tags={
                "Name": f"secure-projectx-nat-eip-{region}",
                "Project": "ProjectX"
            }
        )
        
        self.nat_gateway = aws.ec2.NatGateway(
            f"secure-projectx-nat-{region}",
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                "Name": f"secure-projectx-nat-{region}",
                "Project": "ProjectX"
            }
        )
        
        # Route tables
        self._create_route_tables()
    
    def _create_route_tables(self):
        # Public route table
        self.public_rt = aws.ec2.RouteTable(
            f"secure-projectx-public-rt-{self.region}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"secure-projectx-public-rt-{self.region}",
                "Project": "ProjectX"
            }
        )
        
        aws.ec2.Route(
            f"secure-projectx-public-route-{self.region}",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"secure-projectx-public-rta-{i+1}-{self.region}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )
        
        # Private route table
        self.private_rt = aws.ec2.RouteTable(
            f"secure-projectx-private-rt-{self.region}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"secure-projectx-private-rt-{self.region}",
                "Project": "ProjectX"
            }
        )
        
        aws.ec2.Route(
            f"secure-projectx-private-route-{self.region}",
            route_table_id=self.private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id
        )
        
        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"secure-projectx-private-rta-{i+1}-{self.region}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id
            )



#modules/security/kms.py
import pulumi
import pulumi_aws as aws
import json

class SecureKMS:
    def __init__(self, region: str):
        self.region = region
        
        # KMS Key for general encryption
        self.kms_key = aws.kms.Key(
            f"secure-projectx-kms-key-{region}",
            description=f"ProjectX KMS key for {region}",
            deletion_window_in_days=7,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {"Service": f"logs.{region}.amazonaws.com"},
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"secure-projectx-kms-key-{region}",
                "Project": "ProjectX",
                "Environment": "production"
            }
        )
        
        # KMS Key Alias
        self.kms_alias = aws.kms.Alias(
            f"secure-projectx-kms-alias-{region}",
            name=f"alias/secure-projectx-{region}",
            target_key_id=self.kms_key.key_id
        )

modules/security/security_groups.py
import pulumi
import pulumi_aws as aws

class SecurityGroups:
    def __init__(self, vpc_id: pulumi.Output[str], region: str):
        self.vpc_id = vpc_id
        self.region = region
        
        # Web Security Group (restricted HTTP/HTTPS)
        self.web_sg = aws.ec2.SecurityGroup(
            f"secure-projectx-web-sg-{region}",
            name=f"secure-projectx-web-sg-{region}",
            description="Security group for web servers with restricted access",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS from specific CIDR",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]  # Only internal traffic
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP from ALB only",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]  # Only internal traffic
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"secure-projectx-web-sg-{region}",
                "Project": "ProjectX",
                "Type": "WebServer"
            }
        )
        
        # SSH Security Group (highly restricted)
        self.ssh_sg = aws.ec2.SecurityGroup(
            f"secure-projectx-ssh-sg-{region}",
            name=f"secure-projectx-ssh-sg-{region}",
            description="Highly restricted SSH access",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="SSH from bastion host only",
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=["10.0.1.0/24"]  # Only from public subnet
                )
            ],
            tags={
                "Name": f"secure-projectx-ssh-sg-{region}",
                "Project": "ProjectX",
                "Type": "SSH"
            }
        )
        
        # Database Security Group
        self.db_sg = aws.ec2.SecurityGroup(
            f"secure-projectx-db-sg-{region}",
            name=f"secure-projectx-db-sg-{region}",
            description="Database security group - private access only",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="MySQL/Aurora from web servers",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.web_sg.id]
                )
            ],
            tags={
                "Name": f"secure-projectx-db-sg-{region}",
                "Project": "ProjectX",
                "Type": "Database"
            }
        )
        
        # ALB Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"secure-projectx-alb-sg-{region}",
            name=f"secure-projectx-alb-sg-{region}",
            description="Application Load Balancer security group",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS from internet",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP redirect to HTTPS",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"secure-projectx-alb-sg-{region}",
                "Project": "ProjectX",
                "Type": "LoadBalancer"
            }
        )

#modules/security/nacl.py
import pulumi
import pulumi_aws as aws

class NetworkACLs:
    def __init__(self, vpc_id: pulumi.Output[str], public_subnet_ids: list, private_subnet_ids: list, region: str):
        self.vpc_id = vpc_id
        self.region = region
        
        # Public Subnet NACL
        self.public_nacl = aws.ec2.NetworkAcl(
            f"secure-projectx-public-nacl-{region}",
            vpc_id=vpc_id,
            tags={
                "Name": f"secure-projectx-public-nacl-{region}",
                "Project": "ProjectX",
                "Type": "Public"
            }
        )
        
        # Public NACL Rules - Inbound
        aws.ec2.NetworkAclRule(
            f"secure-projectx-public-nacl-inbound-https-{region}",
            network_acl_id=self.public_nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=443,
            to_port=443
        )
        
        aws.ec2.NetworkAclRule(
            f"secure-projectx-public-nacl-inbound-http-{region}",
            network_acl_id=self.public_nacl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=80,
            to_port=80
        )
        
        aws.ec2.NetworkAclRule(
            f"secure-projectx-public-nacl-inbound-ephemeral-{region}",
            network_acl_id=self.public_nacl.id,
            rule_number=120,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=1024,
            to_port=65535
        )
        
        # Public NACL Rules - Outbound
        aws.ec2.NetworkAclRule(
            f"secure-projectx-public-nacl-outbound-all-{region}",
            network_acl_id=self.public_nacl.id,
            rule_number=100,
            protocol="-1",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            egress=True
        )
        
        # Associate public subnets with public NACL
        for i, subnet_id in enumerate(public_subnet_ids):
            aws.ec2.NetworkAclAssociation(
                f"secure-projectx-public-nacl-assoc-{i+1}-{region}",
                network_acl_id=self.public_nacl.id,
                subnet_id=subnet_id
            )
        
        # Private Subnet NACL
        self.private_nacl = aws.ec2.NetworkAcl(
            f"secure-projectx-private-nacl-{region}",
            vpc_id=vpc_id,
            tags={
                "Name": f"secure-projectx-private-nacl-{region}",
                "Project": "ProjectX",
                "Type": "Private"
            }
        )
        
        # Private NACL Rules - Inbound (only from VPC)
        aws.ec2.NetworkAclRule(
            f"secure-projectx-private-nacl-inbound-vpc-{region}",
            network_acl_id=self.private_nacl.id,
            rule_number=100,
            protocol="-1",
            rule_action="allow",
            cidr_block="10.0.0.0/16"
        )
        
        aws.ec2.NetworkAclRule(
            f"secure-projectx-private-nacl-inbound-ephemeral-{region}",
            network_acl_id=self.private_nacl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=1024,
            to_port=65535
        )
        
        # Private NACL Rules - Outbound
        aws.ec2.NetworkAclRule(
            f"secure-projectx-private-nacl-outbound-all-{region}",
            network_acl_id=self.private_nacl.id,
            rule_number=100,
            protocol="-1",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            egress=True
        )
        
        # Associate private subnets with private NACL
        for i, subnet_id in enumerate(private_subnet_ids):
            aws.ec2.NetworkAclAssociation(
                f"secure-projectx-private-nacl-assoc-{i+1}-{region}",
                network_acl_id=self.private_nacl.id,
                subnet_id=subnet_id
            )

#modules/iam/roles.py
import pulumi
import pulumi_aws as aws
import json

class IAMRoles:
    def __init__(self, region: str):
        self.region = region
        
        # EC2 Instance Role (least privilege)
        self.ec2_role = aws.iam.Role(
            f"secure-projectx-ec2-role-{region}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"}
                    }
                ]
            }),
            tags={
                "Name": f"secure-projectx-ec2-role-{region}",
                "Project": "ProjectX"
            }
        )
        
        # EC2 Policy (minimal permissions)
        self.ec2_policy = aws.iam.RolePolicy(
            f"secure-projectx-ec2-policy-{region}",
            role=self.ec2_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "ec2:DescribeVolumes",
                            "ec2:DescribeTags",
                            "logs:PutLogEvents",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject"
                        ],
                        "Resource": f"arn:aws:s3:::secure-projectx-*/{region}/*"
                    }
                ]
            })
        )
        
        # EC2 Instance Profile
        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"secure-projectx-ec2-profile-{region}",
            role=self.ec2_role.name
        )
        
        # MFA Policy for IAM Users
        self.mfa_policy = aws.iam.Policy(
            f"secure-projectx-mfa-policy-{region}",
            description="Enforce MFA for all operations",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowViewAccountInfo",
                        "Effect": "Allow",
                        "Action": [
                            "iam:GetAccountPasswordPolicy",
                            "iam:GetAccountSummary",
                            "iam:ListVirtualMFADevices"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "AllowManageOwnPasswords",
                        "Effect": "Allow",
                        "Action": [
                            "iam:ChangePassword",
                            "iam:GetUser"
                        ],
                        "Resource": "arn:aws:iam::*:user/${aws:username}"
                    },
                    {
                        "Sid": "AllowManageOwnMFA",
                        "Effect": "Allow",
                        "Action": [
                            "iam:CreateVirtualMFADevice",
                            "iam:DeleteVirtualMFADevice",
                            "iam:ListMFADevices",
                            "iam:EnableMFADevice",
                            "iam:ResyncMFADevice"
                        ],
                        "Resource": [
                            "arn:aws:iam::*:mfa/${aws:username}",
                            "arn:aws:iam::*:user/${aws:username}"
                        ]
                    },
                    {
                        "Sid": "DenyAllExceptUnlessSignedInWithMFA",
                        "Effect": "Deny",
                        "NotAction": [
                            "iam:CreateVirtualMFADevice",
                            "iam:EnableMFADevice",
                            "iam:GetUser",
                            "iam:ListMFADevices",
                            "iam:ListVirtualMFADevices",
                            "iam:ResyncMFADevice",
                            "sts:GetSessionToken"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "BoolIfExists": {
                                "aws:MultiFactorAuthPresent": "false"
                            }
                        }
                    }
                ]
            })
        )

#modules/storage/s3.py
import pulumi
import pulumi_aws as aws

class SecureS3:
    def __init__(self, kms_key_id: pulumi.Output[str], region: str):
        self.kms_key_id = kms_key_id
        self.region = region
        
        # S3 Bucket for application data
        self.app_bucket = aws.s3.Bucket(
            f"secure-projectx-app-data-{region}",
            bucket=f"secure-projectx-app-data-{region}-{aws.get_caller_identity().account_id}",
            tags={
                "Name": f"secure-projectx-app-data-{region}",
                "Project": "ProjectX",
                "Environment": "production"
            }
        )
        
        # Enable versioning
        self.app_bucket_versioning = aws.s3.BucketVersioningV2(
            f"secure-projectx-app-versioning-{region}",
            bucket=self.app_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            )
        )
        
        # Server-side encryption
        self.app_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"secure-projectx-app-encryption-{region}",
            bucket=self.app_bucket.id,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs(
                rules=[
                    aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            kms_master_key_id=kms_key_id,
                            sse_algorithm="aws:kms"
                        ),
                        bucket_key_enabled=True
                    )
                ]
            )
        )
        
        # Block public access
        self.app_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"secure-projectx-app-pab-{region}",
            bucket=self.app_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        # Lifecycle configuration
        self.app_bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f"secure-projectx-app-lifecycle-{region}",
            bucket=self.app_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="transition_to_ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="delete_old_versions",
                    status="Enabled",
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=90
                    )
                )
            ]
        )
        
        # S3 Bucket for logs
        self.logs_bucket = aws.s3.Bucket(
            f"secure-projectx-logs-{region}",
            bucket=f"secure-projectx-logs-{region}-{aws.get_caller_identity().account_id}",
            tags={
                "Name": f"secure-projectx-logs-{region}",
                "Project": "ProjectX",
                "Type": "Logs"
            }
        )
        
        # Logs bucket encryption
        self.logs_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"secure-projectx-logs-encryption-{region}",
            bucket=self.logs_bucket.id,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs(
                rules=[
                    aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            kms_master_key_id=kms_key_id,
                            sse_algorithm="aws:kms"
                        )
                    )
                ]
            )
        )
        
        # Block public access for logs bucket
        self.logs_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"secure-projectx-logs-pab-{region}",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

#modules/database/rds.py
import pulumi
import pulumi_aws as aws

class SecureRDS:
    def __init__(self, private_subnet_ids: list, db_security_group_id: pulumi.Output[str], 
                 kms_key_id: pulumi.Output[str], region: str):
        self.region = region
        
        # DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"secure-projectx-db-subnet-group-{region}",
            name=f"secure-projectx-db-subnet-group-{region}",
            subnet_ids=private_subnet_ids,
            tags={
                "Name": f"secure-projectx-db-subnet-group-{region}",
                "Project": "ProjectX"
            }
        )
        
        # RDS Instance
        self.db_instance = aws.rds.Instance(
            f"secure-projectx-db-{region}",
            identifier=f"secure-projectx-db-{region}",
            engine="mysql",
            engine_version="8.0",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=kms_key_id,
            
            # Database configuration
            db_name="projectxdb",
            username="admin",
            password="ChangeMe123!",  # In production, use AWS Secrets Manager
            
            # Network configuration
            db_subnet_group_name=self.db_subnet_group.name,

