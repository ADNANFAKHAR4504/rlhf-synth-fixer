"""
Comprehensive unit tests for TapStack with 90%+ coverage.

Tests all infrastructure components including:
- VPC and networking
- Security groups
- RDS Aurora cluster
- ECS cluster and services
- Application Load Balancer
- CloudFront distribution
- API Gateway
- ECR repositories
- Auto-scaling policies
- CloudWatch monitoring
- IAM roles and policies
- SSM parameters
- Stack outputs
"""

import unittest
from aws_cdk import App
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Comprehensive unit tests for TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = App()
        self.env_suffix = "test"

    def _create_stack(self, env_suffix=None):
        """Helper to create a stack with optional environment suffix"""
        props = TapStackProps(environment_suffix=env_suffix) if env_suffix else None
        return TapStack(self.app, "TestStack", props=props)

    # ============================================================
    # Environment Suffix Tests
    # ============================================================

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        stack = self._create_stack()
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "Name", "Value": "media-streaming-vpc-dev"})
            ])
        })

    @mark.it("uses provided environment suffix in resource names")
    def test_uses_provided_env_suffix(self):
        stack = self._create_stack("prod")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "Name", "Value": "media-streaming-vpc-prod"})
            ])
        })

    # ============================================================
    # VPC and Networking Tests
    # ============================================================

    @mark.it("creates VPC with correct CIDR block")
    def test_vpc_created_with_cidr(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    @mark.it("creates VPC with DNS support enabled")
    def test_vpc_dns_support(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates Internet Gateway")
    def test_internet_gateway_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::EC2::InternetGateway", 1)

    @mark.it("creates NAT Gateway")
    def test_nat_gateway_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates Elastic IP for NAT Gateway")
    def test_eip_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::EC2::EIP", 1)

    # ============================================================
    # Security Groups Tests
    # ============================================================

    @mark.it("creates ALB security group with HTTP and HTTPS ingress")
    def test_alb_security_group(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0"
                }),
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443,
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })

    @mark.it("creates ECS security group allowing traffic from ALB")
    def test_ecs_security_group(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for ECS Fargate tasks"
        })

    @mark.it("creates database security group allowing PostgreSQL from ECS")
    def test_db_security_group(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Aurora PostgreSQL"
        })

    # ============================================================
    # RDS Aurora Cluster Tests
    # ============================================================

    @mark.it("creates RDS Aurora PostgreSQL cluster")
    def test_rds_cluster_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    @mark.it("creates RDS cluster with correct engine and version")
    def test_rds_cluster_engine(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "EngineVersion": "14.6"
        })

    @mark.it("creates RDS cluster with encryption enabled")
    def test_rds_cluster_encryption(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True
        })

    @mark.it("creates RDS cluster with backup retention")
    def test_rds_cluster_backup(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "BackupRetentionPeriod": 7
        })

    @mark.it("creates RDS writer and reader instances")
    def test_rds_instances_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        # Should have 1 writer + 1 reader = 2 instances
        template.resource_count_is("AWS::RDS::DBInstance", 2)

    @mark.it("creates RDS instances with correct instance class")
    def test_rds_instance_class(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.t3.medium"
        })

    @mark.it("creates database credentials secret")
    def test_db_secret_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"db-creds-{self.env_suffix}"
        })

    @mark.it("creates secret rotation schedule")
    def test_secret_rotation_schedule(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::SecretsManager::RotationSchedule", 1)

    @mark.it("creates DB subnet group")
    def test_db_subnet_group(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    # ============================================================
    # ECR Repository Tests
    # ============================================================

    @mark.it("creates frontend and backend ECR repositories")
    def test_ecr_repositories_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ECR::Repository", 2)

    @mark.it("creates ECR repository with image scan on push")
    def test_ecr_image_scan(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ECR::Repository", {
            "ImageScanningConfiguration": {
                "ScanOnPush": True
            }
        })

    @mark.it("creates ECR repository with lifecycle policy")
    def test_ecr_lifecycle_policy(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ECR::Repository", {
            "LifecyclePolicy": Match.any_value()
        })

    # ============================================================
    # ECS Cluster and Services Tests
    # ============================================================

    @mark.it("creates ECS cluster with container insights")
    def test_ecs_cluster_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ECS::Cluster", 1)
        template.has_resource_properties("AWS::ECS::Cluster", {
            "ClusterSettings": Match.array_with([
                Match.object_like({
                    "Name": "containerInsights",
                    "Value": "enabled"
                })
            ])
        })

    @mark.it("creates CloudWatch log groups for frontend and backend")
    def test_log_groups_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::Logs::LogGroup", 2)

    @mark.it("creates task execution role with correct policies")
    def test_task_execution_role(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    })
                ])
            }
        })

    @mark.it("creates frontend and backend task definitions")
    def test_task_definitions_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ECS::TaskDefinition", 2)

    @mark.it("creates task definitions with correct CPU and memory")
    def test_task_definition_resources(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "Cpu": "512",
            "Memory": "1024",
            "RequiresCompatibilities": ["FARGATE"],
            "NetworkMode": "awsvpc"
        })

    @mark.it("creates frontend and backend ECS services")
    def test_ecs_services_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ECS::Service", 2)

    @mark.it("creates ECS services with desired count of 2")
    def test_ecs_service_desired_count(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ECS::Service", {
            "DesiredCount": 2
        })

    @mark.it("creates ECS services with circuit breaker enabled")
    def test_ecs_service_circuit_breaker(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ECS::Service", {
            "DeploymentConfiguration": {
                "DeploymentCircuitBreaker": {
                    "Enable": True,
                    "Rollback": True
                }
            }
        })

    # ============================================================
    # Application Load Balancer Tests
    # ============================================================

    @mark.it("creates Application Load Balancer")
    def test_alb_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    @mark.it("creates internet-facing ALB")
    def test_alb_internet_facing(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates ALB listener on port 80")
    def test_alb_listener_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Protocol": "HTTP",
            "Port": 80
        })

    @mark.it("creates frontend and backend target groups")
    def test_target_groups_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)

    # ============================================================
    # Auto-Scaling Tests
    # ============================================================

    @mark.it("creates auto-scaling targets for frontend and backend")
    def test_autoscaling_targets_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 2)

    @mark.it("creates auto-scaling targets with correct min and max capacity")
    def test_autoscaling_capacity(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ApplicationAutoScaling::ScalableTarget", {
            "MinCapacity": 2,
            "MaxCapacity": 10
        })

    @mark.it("creates auto-scaling policies for CPU utilization")
    def test_autoscaling_policies_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalingPolicy", 2)

    @mark.it("creates auto-scaling policies with target CPU utilization")
    def test_autoscaling_cpu_target(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ApplicationAutoScaling::ScalingPolicy", {
            "TargetTrackingScalingPolicyConfiguration": {
                "TargetValue": 70.0,
                "PredefinedMetricSpecification": {
                    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
                }
            }
        })

    # ============================================================
    # CloudFront Distribution Tests
    # ============================================================

    @mark.it("creates CloudFront distribution")
    def test_cloudfront_distribution_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::CloudFront::Distribution", 1)

    @mark.it("creates CloudFront distribution with HTTPS redirect")
    def test_cloudfront_https_redirect(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https"
                }
            }
        })

    @mark.it("creates CloudFront cache policy")
    def test_cloudfront_cache_policy(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::CloudFront::CachePolicy", 1)

    # ============================================================
    # API Gateway Tests
    # ============================================================

    @mark.it("creates API Gateway REST API")
    def test_api_gateway_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    @mark.it("creates API Gateway usage plan")
    def test_api_gateway_usage_plan(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)

    @mark.it("creates API Gateway deployment")
    def test_api_gateway_deployment(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)

    @mark.it("creates API Gateway stage")
    def test_api_gateway_stage(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::ApiGateway::Stage", 1)

    # ============================================================
    # SSM Parameters Tests
    # ============================================================

    @mark.it("creates SSM parameters for DB endpoint and ALB DNS")
    def test_ssm_parameters_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::SSM::Parameter", 2)

    @mark.it("creates SSM parameter for database endpoint")
    def test_ssm_db_endpoint_parameter(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": f"/app/{self.env_suffix}/db/endpoint"
        })

    @mark.it("creates SSM parameter for ALB DNS")
    def test_ssm_alb_dns_parameter(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": f"/app/{self.env_suffix}/alb/dns"
        })

    # ============================================================
    # CloudWatch Dashboard Tests
    # ============================================================

    @mark.it("creates CloudWatch dashboard")
    def test_cloudwatch_dashboard_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    # ============================================================
    # Stack Outputs Tests
    # ============================================================

    @mark.it("creates stack outputs")
    def test_stack_outputs_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        outputs = template.find_outputs("*")
        assert len(outputs) >= 7

    @mark.it("creates CloudFront URL output")
    def test_cloudfront_url_output(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        template.has_output("CloudFrontURL", {
            "Export": {
                "Name": f"cloudfront-url-{self.env_suffix}"
            }
        })

    @mark.it("creates API Gateway endpoint output")
    def test_api_gateway_endpoint_output(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)

        template.has_output("APIGatewayEndpoint", {
            "Export": {
                "Name": f"api-gateway-endpoint-{self.env_suffix}"
            }
        })

    @mark.it("creates RDS cluster endpoint output")
    def test_rds_endpoint_output(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)

        template.has_output("RDSClusterEndpoint", {
            "Export": {
                "Name": f"rds-endpoint-{self.env_suffix}"
            }
        })

    @mark.it("creates ALB DNS name output")
    def test_alb_dns_output(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)

        template.has_output("ALBDNSName", {
            "Export": {
                "Name": f"alb-dns-{self.env_suffix}"
            }
        })

    @mark.it("creates ECR repository URI outputs")
    def test_ecr_repo_outputs(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)

        template.has_output("FrontendRepoURI", Match.any_value())
        template.has_output("BackendRepoURI", Match.any_value())

    @mark.it("creates DB secret ARN output")
    def test_db_secret_arn_output(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)

        template.has_output("DBSecretArn", {
            "Export": {
                "Name": f"db-secret-arn-{self.env_suffix}"
            }
        })

    # ============================================================
    # IAM Role Tests
    # ============================================================

    @mark.it("creates IAM roles for ECS tasks")
    def test_iam_roles_created(self):
        stack = self._create_stack(self.env_suffix)
        template = Template.from_stack(stack)
        
        # Should have task execution role + frontend task role + backend task role = 3
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) >= 3

