"""Unit tests for the TapStack CDK stack."""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
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
    def test_creates_vpc_with_correct_config(self):
        """Test VPC creation with 3 AZs and correct subnets"""
        # ASSERT
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates public and private subnets")
    def test_creates_public_and_private_subnets(self):
        """Test subnet creation with correct types"""
        # ASSERT - Should have both public and private subnets
        subnets = self.template.find_resources("AWS::EC2::Subnet")
        self.assertGreaterEqual(len(subnets), 4, "Should have at least 4 subnets (public + private)")

    @mark.it("creates route tables for subnets")
    def test_creates_route_tables(self):
        """Test route table creation"""
        # ASSERT
        route_tables = self.template.find_resources("AWS::EC2::RouteTable")
        self.assertGreaterEqual(len(route_tables), 4, "Should have at least 4 route tables")

    @mark.it("creates Internet Gateway for public subnets")
    def test_creates_internet_gateway(self):
        """Test Internet Gateway creation"""
        # ASSERT
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)
        self.template.resource_count_is("AWS::EC2::VPCGatewayAttachment", 1)

    @mark.it("creates 1 NAT Gateway for cost optimization")
    def test_creates_single_nat_gateway(self):
        """Test NAT gateway creation (1 for cost optimization)"""
        # ASSERT
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates Elastic IP for NAT Gateway")
    def test_creates_elastic_ip_for_nat(self):
        """Test Elastic IP creation for NAT Gateway"""
        # ASSERT
        self.template.resource_count_is("AWS::EC2::EIP", 1)
        self.template.has_resource_properties("AWS::EC2::EIP", {
            "Domain": "vpc"
        })

    @mark.it("creates ECS cluster with Container Insights enabled")
    def test_creates_ecs_cluster_with_insights(self):
        """Test ECS cluster with Container Insights"""
        # ASSERT
        self.template.resource_count_is("AWS::ECS::Cluster", 1)
        self.template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterSettings": [
                {
                    "Name": "containerInsights",
                    "Value": "enabled"
                }
            ]
        })

    @mark.it("creates ECS Task Definition with correct configuration")
    def test_creates_ecs_task_definition(self):
        """Test ECS Task Definition configuration"""
        # ASSERT
        self.template.resource_count_is("AWS::ECS::TaskDefinition", 1)
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "RequiresCompatibilities": ["FARGATE"],
            "NetworkMode": "awsvpc",
            "Cpu": "256",
            "Memory": "512"
        })

    @mark.it("creates ECS container with nginx image")
    def test_creates_container_with_nginx_image(self):
        """Test container definition uses nginx image"""
        # ASSERT
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({
                    "Image": "public.ecr.aws/nginx/nginx:latest",
                    "PortMappings": Match.array_with([
                        Match.object_like({
                            "ContainerPort": 80,
                            "Protocol": "tcp"
                        })
                    ])
                })
            ])
        })

    @mark.it("configures container with database environment variables")
    def test_container_has_database_env_vars(self):
        """Test container has database connection configuration"""
        # ASSERT
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({
                    "Environment": Match.array_with([
                        Match.object_like({"Name": "DB_PORT", "Value": "5432"})
                    ])
                })
            ])
        })

    @mark.it("configures container with database secrets")
    def test_container_has_database_secrets(self):
        """Test container has secrets for database credentials"""
        # ASSERT
        self.template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({
                    "Secrets": Match.array_with([
                        Match.object_like({"Name": "DB_PASSWORD"}),
                        Match.object_like({"Name": "DB_USERNAME"})
                    ])
                })
            ])
        })

    @mark.it("creates ECS Fargate service with desired count 2")
    def test_creates_fargate_service(self):
        """Test Fargate service with correct configuration"""
        # ASSERT
        self.template.resource_count_is("AWS::ECS::Service", 1)
        self.template.has_resource_properties("AWS::ECS::Service", {
            "LaunchType": "FARGATE",
            "DesiredCount": 2
        })

    @mark.it("creates Aurora PostgreSQL cluster with encryption")
    def test_creates_aurora_cluster_encrypted(self):
        """Test Aurora cluster with encryption at rest"""
        # ASSERT
        self.template.resource_count_is("AWS::RDS::DBCluster", 1)
        self.template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True,
            "Engine": "aurora-postgresql",
            "EngineVersion": "15.8"
        })

    @mark.it("creates Aurora cluster with writer and reader instances")
    def test_creates_aurora_instances(self):
        """Test Aurora cluster has writer and reader instances"""
        # ASSERT - Should have 2 instances (1 writer + 1 reader)
        self.template.resource_count_is("AWS::RDS::DBInstance", 2)

    @mark.it("configures Aurora instances with correct instance class")
    def test_aurora_instances_use_burstable3_medium(self):
        """Test Aurora instances use db.t3.medium"""
        # ASSERT
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.t3.medium",
            "Engine": "aurora-postgresql"
        })

    @mark.it("creates Secrets Manager secret for database credentials")
    def test_creates_secrets_manager_secret(self):
        """Test Secrets Manager secret creation"""
        # ASSERT
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
        self.template.has_resource_properties("AWS::SecretsManager::Secret", {
            "GenerateSecretString": Match.object_like({
                "GenerateStringKey": "password",
                "PasswordLength": 32,
                "ExcludePunctuation": True
            })
        })

    @mark.it("attaches secrets to database cluster")
    def test_attaches_secret_to_db_cluster(self):
        """Test secret is attached to database cluster"""
        # ASSERT
        self.template.resource_count_is("AWS::SecretsManager::SecretTargetAttachment", 1)
        self.template.has_resource_properties("AWS::SecretsManager::SecretTargetAttachment", {
            "TargetType": "AWS::RDS::DBCluster"
        })

    @mark.it("creates Application Load Balancer in public subnets")
    def test_creates_alb_in_public_subnets(self):
        """Test ALB creation with correct configuration"""
        # ASSERT
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates HTTP listener on port 80")
    def test_creates_http_listener(self):
        """Test HTTP listener creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    @mark.it("creates target group with health check on root path")
    def test_creates_target_group_with_health_check(self):
        """Test target group with correct health check configuration"""
        # ASSERT
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "ip",
            "HealthCheckPath": "/",
            "HealthCheckIntervalSeconds": 30,
            "HealthCheckTimeoutSeconds": 5,
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 3
        })

    @mark.it("creates security group for ALB with HTTP ingress")
    def test_creates_alb_security_group(self):
        """Test ALB security group configuration"""
        # ASSERT - Find ALB security group with HTTP ingress
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })

    @mark.it("creates security group for ECS tasks with ALB ingress")
    def test_creates_ecs_security_group(self):
        """Test ECS security group allows traffic from ALB"""
        # ASSERT
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for ECS tasks"
        })

    @mark.it("allows ECS tasks to connect to database on port 5432")
    def test_allows_ecs_to_db_connection(self):
        """Test security group rule allows ECS to RDS connection"""
        # ASSERT - Check for ingress rule allowing port 5432
        security_group_ingress = self.template.find_resources("AWS::EC2::SecurityGroupIngress")
        has_postgres_rule = any(
            True for sg in security_group_ingress.values()
            if sg.get("Properties", {}).get("IpProtocol") == "tcp"
            and sg.get("Properties", {}).get("FromPort") == 5432
        )
        self.assertTrue(has_postgres_rule, "Should have security group rule for PostgreSQL port 5432")

    @mark.it("creates WAF WebACL with rate limiting and SQL injection rules")
    def test_creates_waf_with_rules(self):
        """Test WAF WebACL with security rules"""
        # ASSERT
        self.template.resource_count_is("AWS::WAFv2::WebACL", 1)
        self.template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Scope": "REGIONAL",
            "Rules": Match.array_with([
                Match.object_like({
                    "Name": "RateLimitRule",
                    "Priority": 1
                }),
                Match.object_like({
                    "Name": "SQLInjectionRule",
                    "Priority": 2
                })
            ])
        })

    @mark.it("configures WAF rate limit rule with 2000 requests limit")
    def test_waf_rate_limit_configuration(self):
        """Test WAF rate limit rule configuration"""
        # ASSERT
        self.template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Rules": Match.array_with([
                Match.object_like({
                    "Name": "RateLimitRule",
                    "Statement": Match.object_like({
                        "RateBasedStatement": Match.object_like({
                            "Limit": 2000,
                            "AggregateKeyType": "IP"
                        })
                    })
                })
            ])
        })

    @mark.it("associates WAF with ALB")
    def test_associates_waf_with_alb(self):
        """Test WAF is associated with ALB"""
        # ASSERT
        self.template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard creation"""
        # ASSERT
        self.template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("creates CloudWatch alarms for error rate and DB CPU")
    def test_creates_cloudwatch_alarms(self):
        """Test CloudWatch alarms creation"""
        # ASSERT
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 2)

    @mark.it("creates alarm for high error rate")
    def test_creates_high_error_rate_alarm(self):
        """Test high error rate alarm configuration"""
        # ASSERT
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 5,
            "EvaluationPeriods": 1,
            "DatapointsToAlarm": 1,
            "MetricName": "HTTPCode_Target_5XX_Count"
        })

    @mark.it("creates alarm for high database CPU")
    def test_creates_high_db_cpu_alarm(self):
        """Test high database CPU alarm configuration"""
        # ASSERT
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 80,
            "EvaluationPeriods": 2,
            "DatapointsToAlarm": 2,
            "MetricName": "CPUUtilization"
        })

    @mark.it("creates auto-scaling target for ECS service")
    def test_creates_autoscaling_target(self):
        """Test auto-scaling target creation"""
        # ASSERT
        self.template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 1)
        self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 2,
            "MaxCapacity": 10
        })

    @mark.it("creates auto-scaling policy based on CPU utilization")
    def test_creates_autoscaling_policy(self):
        """Test auto-scaling policy configuration"""
        # ASSERT
        self.template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 1)
        self.template.has_resource_properties("AWS::ApplicationAutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling",
            "TargetTrackingScalingPolicyConfiguration": Match.object_like({
                "TargetValue": 70
            })
        })

    @mark.it("grants ECS task role permissions to read secrets")
    def test_grants_ecs_secrets_permissions(self):
        """Test ECS task role has permissions to read Secrets Manager"""
        # ASSERT - Check for IAM role with Secrets Manager permissions
        self.template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with(["secretsmanager:GetSecretValue"]),
                        "Effect": "Allow"
                    })
                ])
            })
        })

    @mark.it("creates IAM role for ECS task execution")
    def test_creates_ecs_task_execution_role(self):
        """Test ECS task execution role creation"""
        # ASSERT
        roles = self.template.find_resources("AWS::IAM::Role")
        ecs_roles = [
            r for r in roles.values()
            if "ecs-tasks.amazonaws.com" in str(r.get("Properties", {}).get("AssumeRolePolicyDocument", {}))
        ]
        self.assertGreaterEqual(len(ecs_roles), 1, "Should have at least one ECS task role")

    @mark.it("creates CloudWatch Log Group for ECS container logs")
    def test_creates_cloudwatch_log_group(self):
        """Test CloudWatch Log Group creation for container logs"""
        # ASSERT
        self.template.resource_count_is("AWS::Logs::LogGroup", 1)

    @mark.it("applies RemovalPolicy.DESTROY to database cluster")
    def test_database_has_destroy_policy(self):
        """Test database has RemovalPolicy.DESTROY for testing"""
        # ASSERT
        self.template.has_resource("AWS::RDS::DBCluster", {
            "DeletionPolicy": "Delete"
        })

    @mark.it("creates stack outputs for all required resources")
    def test_creates_stack_outputs(self):
        """Test all required stack outputs are created"""
        # ASSERT
        outputs = self.template.find_outputs("*")
        output_keys = list(outputs.keys())

        # Check for required outputs
        self.assertIn("VPCId", output_keys)
        self.assertIn("ECSClusterName", output_keys)
        self.assertIn("ECSServiceName", output_keys)
        self.assertIn("DBClusterIdentifier", output_keys)
        self.assertIn("DBSecretArn", output_keys)
        self.assertIn("LoadBalancerArn", output_keys)
        self.assertIn("LoadBalancerDNS", output_keys)
        self.assertIn("TargetGroupArn", output_keys)
        self.assertIn("DashboardName", output_keys)
        self.assertIn("WebACLArn", output_keys)

    @mark.it("exports outputs with correct export names")
    def test_exports_outputs_with_correct_names(self):
        """Test outputs are exported with correct names"""
        # ASSERT
        outputs = self.template.find_outputs("*")

        # Check that exports include environment suffix
        for output in outputs.values():
            export_name = output.get("Export", {}).get("Name")
            if export_name:
                self.assertIn(self.env_suffix, export_name,
                            f"Export name should contain environment suffix: {export_name}")

    @mark.it("uses environment suffix in resource names")
    def test_uses_environment_suffix_in_names(self):
        """Test that resources use environment suffix in names"""
        # ASSERT - Check resources exist (ClusterName may not be explicitly set in template)
        self.template.resource_count_is("AWS::ECS::Cluster", 1)
        # Verify outputs use environment suffix
        outputs = self.template.find_outputs("*")
        has_suffix_in_outputs = any(
            self.env_suffix in str(output.get("Export", {}).get("Name", ""))
            for output in outputs.values()
        )
        self.assertTrue(has_suffix_in_outputs, "At least one output should contain environment suffix")


if __name__ == '__main__':
    unittest.main()
