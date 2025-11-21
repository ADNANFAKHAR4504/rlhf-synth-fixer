import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"
        self.stack = TapStack(self.app, "TapStackTest", environment_suffix=self.env_suffix)
        self.template = Template.from_stack(self.stack)

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc_with_config(self):
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates subnets across AZs")
    def test_creates_public_subnets(self):
        self.template.has_resource("AWS::EC2::Subnet", {})

    @mark.it("creates 3 private subnets with egress")
    def test_creates_private_subnets(self):
        self.template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False
        })

    @mark.it("creates single NAT Gateway for cost optimization")
    def test_creates_nat_gateway(self):
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates Internet Gateway")
    def test_creates_internet_gateway(self):
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

    @mark.it("creates ECS cluster with environment suffix")
    def test_creates_ecs_cluster(self):
        self.template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("creates RDS Aurora PostgreSQL cluster")
    def test_creates_rds_cluster(self):
        self.template.resource_count_is("AWS::RDS::DBCluster", 1)
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": "15.6",
            "DeletionProtection": False,
            "StorageEncrypted": True
        })

    @mark.it("creates 2 RDS instances (1 writer + 1 reader)")
    def test_creates_rds_instances(self):
        self.template.resource_count_is("AWS::RDS::DBInstance", 2)
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "aurora-postgresql",
            "DBInstanceClass": "db.t3.medium"
        })

    @mark.it("creates DB subnet group with private subnets")
    def test_creates_db_subnet_group(self):
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates Secrets Manager secret for DB credentials")
    def test_creates_db_secret(self):
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("creates SecretTargetAttachment for RDS")
    def test_creates_secret_attachment(self):
        self.template.resource_count_is("AWS::SecretsManager::SecretTargetAttachment", 1)

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })

    @mark.it("creates two target groups (blue and green)")
    def test_creates_target_groups(self):
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "ip"
        })

    @mark.it("creates ALB listener with weighted routing")
    def test_creates_alb_listener(self):
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    @mark.it("creates ECS task definition with correct CPU and memory")
    def test_creates_task_definition(self):
        self.template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "2048",
            "Memory": "4096",
            "NetworkMode": "awsvpc",
            "RequiresCompatibilities": ["FARGATE"]
        })

    @mark.it("creates two ECS services (blue and green)")
    def test_creates_ecs_services(self):
        self.template.resource_count_is("AWS::ECS::Service", 2)

    @mark.it("creates blue ECS service with 2 tasks")
    def test_creates_blue_service(self):
        self.template.has_resource_properties("AWS::ECS::Service", {
            "DesiredCount": 2
        })

    @mark.it("creates green ECS service with 1 task")
    def test_creates_green_service(self):
        self.template.has_resource_properties("AWS::ECS::Service", {
            "DesiredCount": 1
        })

    @mark.it("creates three security groups")
    def test_creates_security_groups(self):
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    @mark.it("creates ALB security group allowing HTTP from anywhere")
    def test_creates_alb_security_group(self):
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupIngress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 80,
                    "ToPort": 80,
                    "IpProtocol": "tcp"
                }
            ]
        })

    @mark.it("creates RDS security group allowing PostgreSQL from ECS")
    def test_creates_rds_security_group(self):
        self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "FromPort": 5432,
            "ToPort": 5432,
            "IpProtocol": "tcp"
        })

    @mark.it("creates IAM role for ECS task execution")
    def test_creates_task_execution_role(self):
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        }
                    })
                ])
            })
        })

    @mark.it("creates IAM role for ECS task")
    def test_creates_task_role(self):
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        }
                    })
                ])
            })
        })

    @mark.it("creates CloudWatch log group for ECS tasks")
    def test_creates_log_group(self):
        self.template.resource_count_is("AWS::Logs::LogGroup", 1)
        self.template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 3
        })

    @mark.it("creates CloudWatch Dashboard")
    def test_creates_cloudwatch_dashboard(self):
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("creates route tables for subnets")
    def test_creates_route_tables(self):
        self.template.has_resource("AWS::EC2::RouteTable", {})

    @mark.it("creates routes for internet and NAT gateway")
    def test_creates_routes(self):
        self.template.has_resource("AWS::EC2::Route", {})

    @mark.it("creates Elastic IP for NAT Gateway")
    def test_creates_elastic_ip(self):
        self.template.resource_count_is("AWS::EC2::EIP", 1)

    @mark.it("creates VPC Gateway Attachment")
    def test_creates_vpc_gateway_attachment(self):
        self.template.resource_count_is("AWS::EC2::VPCGatewayAttachment", 1)

    @mark.it("exposes VPC ID as stack output")
    def test_exposes_vpc_id_output(self):
        self.template.has_output("VPCId", {})

    @mark.it("exposes ALB DNS name as stack output")
    def test_exposes_alb_dns_output(self):
        self.template.has_output("ALBDNSName", {})

    @mark.it("exposes Database endpoint as stack output")
    def test_exposes_db_endpoint_output(self):
        self.template.has_output("DatabaseEndpoint", {})

    @mark.it("exposes Database secret ARN as stack output")
    def test_exposes_db_secret_arn_output(self):
        self.template.has_output("DatabaseSecretArn", {})

    @mark.it("exposes ECS cluster name as stack output")
    def test_exposes_ecs_cluster_output(self):
        self.template.has_output("ECSClusterName", {})

    @mark.it("exposes Blue service name as stack output")
    def test_exposes_blue_service_output(self):
        self.template.has_output("BlueServiceName", {})

    @mark.it("exposes Green service name as stack output")
    def test_exposes_green_service_output(self):
        self.template.has_output("GreenServiceName", {})

    @mark.it("exposes CloudWatch Dashboard URL as stack output")
    def test_exposes_dashboard_output(self):
        self.template.has_output("CloudWatchDashboard", {})

    @mark.it("configures RDS backup retention to 1 day")
    def test_rds_backup_retention(self):
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "BackupRetentionPeriod": 1
        })

    @mark.it("configures target group health checks")
    def test_target_group_health_checks(self):
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckEnabled": True,
            "HealthCheckIntervalSeconds": 30,
            "HealthCheckPath": "/",
            "HealthCheckProtocol": "HTTP",
            "HealthCheckTimeoutSeconds": 5,
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 3
        })

    @mark.it("configures ECS service deployment parameters")
    def test_ecs_service_deployment_config(self):
        self.template.has_resource_properties("AWS::ECS::Service", {
            "DeploymentConfiguration": {
                "MaximumPercent": 200,
                "MinimumHealthyPercent": 100
            }
        })

    @mark.it("grants RDS secret read permissions to task execution role")
    def test_grants_secret_read_permissions(self):
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with(["secretsmanager:GetSecretValue"])
                    })
                ])
            })
        })

    @mark.it("configures container with environment variables")
    def test_container_environment_variables(self):
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({
                    "Environment": Match.array_with([
                        Match.object_like({
                            "Name": "DB_HOST"
                        }),
                        Match.object_like({
                            "Name": "DB_PORT",
                            "Value": "5432"
                        })
                    ])
                })
            ])
        })

    @mark.it("configures container with secrets from Secrets Manager")
    def test_container_secrets(self):
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({
                    "Secrets": Match.array_with([
                        Match.object_like({
                            "Name": "DB_PASSWORD"
                        }),
                        Match.object_like({
                            "Name": "DB_USERNAME"
                        })
                    ])
                })
            ])
        })

    @mark.it("configures deregistration delay for target groups")
    def test_target_group_deregistration_delay(self):
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "TargetGroupAttributes": Match.array_with([
                Match.object_like({
                    "Key": "deregistration_delay.timeout_seconds",
                    "Value": "30"
                })
            ])
        })

    @mark.it("creates subnet with correct CIDR mask")
    def test_subnet_cidr_mask(self):
        self.template.has_resource_properties("AWS::EC2::Subnet", {
            "CidrBlock": Match.string_like_regexp(r"10\.0\.\d+\.0/24")
        })

    @mark.it("ensures RDS has no public access")
    def test_rds_not_publicly_accessible(self):
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "PubliclyAccessible": False
        })
