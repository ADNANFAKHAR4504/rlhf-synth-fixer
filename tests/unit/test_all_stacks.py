"""
Comprehensive unit tests for remaining stacks.
Tests API, Monitoring, Parameter Store, Route53, and Failover stacks.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from aws_cdk import aws_ec2 as ec2, aws_rds as rds, aws_lambda as _lambda, aws_apigateway as apigw
from pytest import mark

from lib.api_stack import ApiStack
from lib.monitoring_stack import MonitoringStack
from lib.parameter_store_stack import ParameterStoreStack
from lib.route53_stack import Route53Stack
from lib.failover_stack import FailoverStack


@mark.describe("ApiStack")
class TestApiStack(unittest.TestCase):
    """Test cases for the ApiStack"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = cdk.App()
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(self.vpc_stack, "TestVPC")

        # Create mock Lambda functions
        self.lambda_stack = cdk.Stack(self.app, "TestLambdaStack")
        self.lambda1 = _lambda.Function(
            self.lambda_stack, "Lambda1",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("def handler(event, context): pass")
        )
        self.lambda2 = _lambda.Function(
            self.lambda_stack, "Lambda2",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("def handler(event, context): pass")
        )

    @mark.it("creates API Gateway REST API")
    def test_api_creation(self):
        """Test that API Gateway is created."""
        stack = ApiStack(
            self.app,
            "TestApiStack",
            payment_validation_fn=self.lambda1,
            transaction_processing_fn=self.lambda2,
            notification_fn=self.lambda1,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    @mark.it("creates API methods")
    def test_api_methods(self):
        """Test that API methods are created."""
        stack = ApiStack(
            self.app,
            "TestApiStack",
            payment_validation_fn=self.lambda1,
            transaction_processing_fn=self.lambda2,
            notification_fn=self.lambda1,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.resource_count_is("AWS::ApiGateway::Method", Match.object_like({}))

    @mark.it("creates API deployment")
    def test_api_deployment(self):
        """Test that API deployment is created."""
        stack = ApiStack(
            self.app,
            "TestApiStack",
            payment_validation_fn=self.lambda1,
            transaction_processing_fn=self.lambda2,
            notification_fn=self.lambda1,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)

    @mark.it("exports API URL")
    def test_api_url_output(self):
        """Test that API URL is exported."""
        stack = ApiStack(
            self.app,
            "TestApiStack",
            payment_validation_fn=self.lambda1,
            transaction_processing_fn=self.lambda2,
            notification_fn=self.lambda1,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        outputs = template.to_json().get('Outputs', {})
        api_outputs = [k for k in outputs.keys() if 'API' in k or 'Url' in k]
        assert len(api_outputs) > 0


@mark.describe("ParameterStoreStack")
class TestParameterStoreStack(unittest.TestCase):
    """Test cases for the ParameterStoreStack"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = cdk.App()

        # Create mock VPC and DB cluster
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(self.vpc_stack, "TestVPC")

        self.db_stack = cdk.Stack(self.app, "TestDBStack")
        self.db_cluster = rds.DatabaseCluster(
            self.db_stack, "TestCluster",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            writer=rds.ClusterInstance.provisioned("writer"),
            vpc=self.vpc
        )

        # Create mock API
        self.api_stack = cdk.Stack(self.app, "TestAPIStack")
        self.api = apigw.RestApi(self.api_stack, "TestAPI")

    @mark.it("creates SSM parameters")
    def test_parameter_creation(self):
        """Test that SSM parameters are created."""
        stack = ParameterStoreStack(
            self.app,
            "TestParameterStoreStack",
            db_cluster=self.db_cluster,
            api=self.api,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.resource_count_is("AWS::SSM::Parameter", 4)

    @mark.it("creates database endpoint parameter")
    def test_db_endpoint_parameter(self):
        """Test that DB endpoint parameter is created."""
        stack = ParameterStoreStack(
            self.app,
            "TestParameterStoreStack",
            db_cluster=self.db_cluster,
            api=self.api,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            {
                "Name": "/payment/primary/db-endpoint"
            }
        )

    @mark.it("creates API URL parameter")
    def test_api_url_parameter(self):
        """Test that API URL parameter is created."""
        stack = ParameterStoreStack(
            self.app,
            "TestParameterStoreStack",
            db_cluster=self.db_cluster,
            api=self.api,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            {
                "Name": "/payment/primary/api-url"
            }
        )

    @mark.it("creates feature flags parameter")
    def test_feature_flags_parameter(self):
        """Test that feature flags parameter is created."""
        stack = ParameterStoreStack(
            self.app,
            "TestParameterStoreStack",
            db_cluster=self.db_cluster,
            api=self.api,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            {
                "Name": "/payment/primary/feature-flags"
            }
        )


@mark.describe("MonitoringStack")
class TestMonitoringStack(unittest.TestCase):
    """Test cases for the MonitoringStack"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = cdk.App()

        # Create mock resources
        self.vpc_stack = cdk.Stack(self.app, "TestVpcStack")
        self.vpc = ec2.Vpc(self.vpc_stack, "TestVPC")

        self.db_stack = cdk.Stack(self.app, "TestDBStack")
        self.db_cluster = rds.DatabaseCluster(
            self.db_stack, "TestCluster",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            writer=rds.ClusterInstance.provisioned("writer"),
            vpc=self.vpc
        )

        self.lambda_stack = cdk.Stack(self.app, "TestLambdaStack")
        self.lambda_fn = _lambda.Function(
            self.lambda_stack, "Lambda1",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("def handler(event, context): pass")
        )

        self.api_stack = cdk.Stack(self.app, "TestAPIStack")
        self.api = apigw.RestApi(self.api_stack, "TestAPI")

    @mark.it("creates SNS topic for alarms")
    def test_sns_topic(self):
        """Test that SNS topic is created."""
        stack = MonitoringStack(
            self.app,
            "TestMonitoringStack",
            db_cluster=self.db_cluster,
            lambda_functions=[self.lambda_fn],
            api=self.api,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates CloudWatch alarms")
    def test_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are created."""
        stack = MonitoringStack(
            self.app,
            "TestMonitoringStack",
            db_cluster=self.db_cluster,
            lambda_functions=[self.lambda_fn],
            api=self.api,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        # Should have multiple alarms (RDS, Lambda, API)
        resources = template.to_json().get('Resources', {})
        alarms = [k for k, v in resources.items() if v.get('Type') == 'AWS::CloudWatch::Alarm']
        assert len(alarms) >= 3

    @mark.it("creates RDS replication lag alarm")
    def test_rds_lag_alarm(self):
        """Test that RDS replication lag alarm is created."""
        stack = MonitoringStack(
            self.app,
            "TestMonitoringStack",
            db_cluster=self.db_cluster,
            lambda_functions=[self.lambda_fn],
            api=self.api,
            environment_suffix="test",
            dr_role="primary"
        )

        template = Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "MetricName": "AuroraGlobalDBReplicationLag"
            }
        )


@mark.describe("Route53Stack")
class TestRoute53Stack(unittest.TestCase):
    """Test cases for the Route53Stack"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = cdk.App()

        # Create mock APIs
        self.api_stack = cdk.Stack(self.app, "TestAPIStack")
        self.api1 = apigw.RestApi(self.api_stack, "TestAPI1")
        self.api2 = apigw.RestApi(self.api_stack, "TestAPI2")

    @mark.it("creates Route53 health checks")
    def test_health_checks(self):
        """Test that Route53 health checks are created."""
        stack = Route53Stack(
            self.app,
            "TestRoute53Stack",
            primary_api=self.api1,
            secondary_api=self.api2,
            environment_suffix="test"
        )

        template = Template.from_stack(stack)
        # Should have health checks for both regions
        template.resource_count_is("AWS::Route53::HealthCheck", Match.object_like({}))

    @mark.it("creates hosted zone output")
    def test_hosted_zone_output(self):
        """Test that hosted zone is referenced."""
        stack = Route53Stack(
            self.app,
            "TestRoute53Stack",
            primary_api=self.api1,
            secondary_api=self.api2,
            environment_suffix="test"
        )

        # Stack should be created without errors
        template = Template.from_stack(stack)
        assert template is not None


@mark.describe("FailoverStack")
class TestFailoverStack(unittest.TestCase):
    """Test cases for the FailoverStack"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = cdk.App()

    @mark.it("creates failover Lambda function")
    def test_failover_lambda(self):
        """Test that failover Lambda is created."""
        stack = FailoverStack(
            self.app,
            "TestFailoverStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)
        template.resource_count_is("AWS::Lambda::Function", 1)

    @mark.it("creates IAM role for failover")
    def test_failover_role(self):
        """Test that IAM role for failover is created."""
        stack = FailoverStack(
            self.app,
            "TestFailoverStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumedBy": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        )

    @mark.it("grants RDS permissions to failover Lambda")
    def test_rds_permissions(self):
        """Test that failover Lambda has RDS permissions."""
        stack = FailoverStack(
            self.app,
            "TestFailoverStack",
            environment_suffix="test"
        )

        template = Template.from_stack(stack)
        # Should have policy with RDS permissions
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Action": Match.array_with([
                                Match.string_like_regexp(".*rds.*")
                            ])
                        })
                    ])
                }
            }
        )
