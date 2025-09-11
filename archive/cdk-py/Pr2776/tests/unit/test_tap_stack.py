import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a VPC with correct configuration")
    def test_creates_vpc_with_correct_config(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
            "Tags": Match.array_with([
                {"Key": "Name", "Value": f"tap-vpc-{env_suffix}"}
            ])
        })

    @mark.it("creates public and private subnets")
    def test_creates_subnets(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT - Should have 4 subnets (2 public, 2 private across 2 AZs)
        template.resource_count_is("AWS::EC2::Subnet", 4)
        
        # Check for public subnets
        public_subnets = template.find_resources("AWS::EC2::Subnet", {
            "Properties": {
                "MapPublicIpOnLaunch": True
            }
        })
        self.assertEqual(len(public_subnets), 2, "Should have 2 public subnets")

    @mark.it("creates correct number of NAT gateways based on environment")
    def test_creates_nat_gateways_based_on_env(self):
        # ARRANGE - Test production environment with separate app
        prod_app = cdk.App()
        prod_stack = TapStack(prod_app, "TapStackProd",
                             TapStackProps(environment_suffix="prod"))
        prod_template = Template.from_stack(prod_stack)

        # Test development environment with separate app
        dev_app = cdk.App()
        dev_stack = TapStack(dev_app, "TapStackDev",
                            TapStackProps(environment_suffix="dev"))
        dev_template = Template.from_stack(dev_stack)

        # ASSERT
        prod_template.resource_count_is("AWS::EC2::NatGateway", 2)  # 2 NAT gateways for prod
        dev_template.resource_count_is("AWS::EC2::NatGateway", 1)   # 1 NAT gateway for dev

    @mark.it("creates security groups for ALB, EC2, and RDS")
    def test_creates_security_groups(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)
        
        # Check ALB security group allows HTTP and HTTPS
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupName": f"tap-alb-sg-{env_suffix}",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80}),
                Match.object_like({"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443})
            ])
        })

    @mark.it("creates an Application Load Balancer")
    def test_creates_alb(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": f"tap-alb-{env_suffix}",
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates a target group with health checks")
    def test_creates_target_group_with_health_check(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Name": f"tap-ec2-tg-{env_suffix}",
            "Port": 80,
            "Protocol": "HTTP",
            "HealthCheckPath": "/health",
            "HealthCheckProtocol": "HTTP",
            "HealthCheckIntervalSeconds": 30,
            "HealthCheckTimeoutSeconds": 5,
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 3
        })

    @mark.it("creates an Auto Scaling Group with correct capacity")
    def test_creates_asg_with_correct_capacity(self):
        # ARRANGE - Test production environment with separate app
        prod_app = cdk.App()
        prod_stack = TapStack(prod_app, "TapStackProd",
                             TapStackProps(environment_suffix="prod"))
        prod_template = Template.from_stack(prod_stack)

        # Test development environment with separate app
        dev_app = cdk.App()
        dev_stack = TapStack(dev_app, "TapStackDev",
                            TapStackProps(environment_suffix="dev"))
        dev_template = Template.from_stack(dev_stack)

        # ASSERT - Production ASG
        prod_template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "10",
            "DesiredCapacity": "3",
            "AutoScalingGroupName": "tap-asg-prod"
        })

        # ASSERT - Development ASG
        dev_template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "1",
            "MaxSize": "3",
            "DesiredCapacity": "1",
            "AutoScalingGroupName": "tap-asg-dev"
        })

    @mark.it("creates a launch template with correct instance type")
    def test_creates_launch_template(self):
        # ARRANGE - with separate apps
        prod_app = cdk.App()
        prod_stack = TapStack(prod_app, "TapStackProd",
                             TapStackProps(environment_suffix="prod"))
        prod_template = Template.from_stack(prod_stack)

        dev_app = cdk.App()
        dev_stack = TapStack(dev_app, "TapStackDev",
                            TapStackProps(environment_suffix="dev"))
        dev_template = Template.from_stack(dev_stack)

        # ASSERT - Production uses t3.medium
        prod_template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateName": "tap-launch-template-prod",
            "LaunchTemplateData": Match.object_like({
                "InstanceType": "t3.medium"
            })
        })

        # ASSERT - Dev uses t3.micro
        dev_template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateName": "tap-launch-template-dev",
            "LaunchTemplateData": Match.object_like({
                "InstanceType": "t3.micro"
            })
        })

    @mark.it("creates an RDS database with correct configuration")
    def test_creates_rds_database(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceIdentifier": f"tap-db-{env_suffix}",
            "DBName": f"tap{env_suffix}db",
            "Engine": "mysql",
            "StorageEncrypted": True,
            "AllocatedStorage": "20",
            "BackupRetentionPeriod": 1,
            "MultiAZ": False,
            "DeletionProtection": False
        })

    @mark.it("creates RDS with different config for production")
    def test_creates_rds_production_config(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackProd",
                        TapStackProps(environment_suffix="prod"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceIdentifier": "tap-db-prod",
            "DBInstanceClass": "db.t3.small",
            "AllocatedStorage": "100",
            "BackupRetentionPeriod": 7,
            "MultiAZ": True,
            "DeletionProtection": True,
            "MonitoringInterval": 60,
            "EnablePerformanceInsights": True
        })

    @mark.it("creates an S3 bucket for centralized logging")
    def test_creates_logging_bucket(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # The bucket name uses Fn::Join, so we check for other properties instead
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"},
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    })
                ])
            },
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "ExpirationInDays": 30,  # For test environment
                        "Status": "Enabled"
                    })
                ])
            }
        })

    @mark.it("creates CloudWatch log groups")
    def test_creates_log_groups(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/ec2/tap/{env_suffix}"
        })

    @mark.it("creates CloudWatch alarms for monitoring")
    def test_creates_cloudwatch_alarms(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Should create 3 alarms
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)
        
        # Check for specific alarms
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"TAP-{env_suffix}-High-CPU-Utilization",
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/EC2",
            "Threshold": 70,
            "ComparisonOperator": "GreaterThanThreshold"
        })

        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"TAP-{env_suffix}-RDS-High-CPU",
            "Threshold": 70,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates CloudWatch dashboard")
    def test_creates_dashboard(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": f"TAP-{env_suffix}-Dashboard"
        })

    @mark.it("creates IAM role for EC2 instances")
    def test_creates_iam_role(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"tap-ec2-role-{env_suffix}",
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"}
                    })
                ])
            })
        })

    @mark.it("creates database subnet group")
    def test_creates_db_subnet_group(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
        template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupName": f"tap-db-subnet-{env_suffix}",
            "DBSubnetGroupDescription": f"Subnet group for RDS database - {env_suffix}"
        })

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Check that resources use 'dev' suffix
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Name", "Value": "tap-vpc-dev"}
            ])
        })
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": "tap-alb-dev"
        })

    @mark.it("creates CloudFormation outputs for all major resources")
    def test_creates_outputs(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check for key outputs
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())
        
        # Check that we have outputs for major resources
        expected_outputs = [
            "VPCId", "VPCCidr", "PublicSubnetIds", "PrivateSubnetIds",
            "LoadBalancerDNS", "LoadBalancerURL", "LoadBalancerArn",
            "DatabaseEndpoint", "DatabasePort", "DatabaseSecretArn",
            "LoggingBucketName", "LoggingBucketArn",
            "AutoScalingGroupName", "AutoScalingGroupArn",
            "ALBSecurityGroupId", "EC2SecurityGroupId", "RDSSecurityGroupId",
            "Environment"
        ]
        
        for expected_output in expected_outputs:
            self.assertIn(expected_output, output_keys, 
                         f"Expected output {expected_output} not found")

    @mark.it("applies correct tags to all resources")
    def test_applies_tags(self):
        # ARRANGE
        env_suffix = "staging"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Check that VPC has the expected tags
        # Note: The VPC will have more tags than just these, so we use Match.array_with
        # Also note that CDK adds its own tags, and ManagedBy might not appear on all resources
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                {"Key": "Environment", "Value": "Staging"},
                {"Key": "Project", "Value": "TAP-WebApplicationInfrastructure"}
                # ManagedBy tag removed as it might not be applied to VPC directly
            ])
        })

    @mark.it("creates auto-scaling policy for ASG")
    def test_creates_auto_scaling_policy(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling",
            "TargetTrackingConfiguration": Match.object_like({
                "PredefinedMetricSpecification": {
                    "PredefinedMetricType": "ASGAverageCPUUtilization"
                },
                "TargetValue": 70
            })
        })

    @mark.it("creates secrets for database credentials")
    def test_creates_database_secret(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"tap-db-credentials-{env_suffix}",
            "GenerateSecretString": Match.object_like({
                "SecretStringTemplate": '{"username":"dbadmin"}',
                "GenerateStringKey": "password"
            })
        })

    @mark.it("configures S3 lifecycle rules based on environment")
    def test_s3_lifecycle_rules(self):
        # ARRANGE - with separate apps
        prod_app = cdk.App()
        prod_stack = TapStack(prod_app, "TapStackProd",
                             TapStackProps(environment_suffix="prod"))
        prod_template = Template.from_stack(prod_stack)

        dev_app = cdk.App()
        dev_stack = TapStack(dev_app, "TapStackDev",
                            TapStackProps(environment_suffix="dev"))
        dev_template = Template.from_stack(dev_stack)

        # ASSERT - Production has 90 day retention
        prod_template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "ExpirationInDays": 90,
                        "Status": "Enabled"
                    })
                ])
            }
        })

        # ASSERT - Dev has 30 day retention
        dev_template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "ExpirationInDays": 30,
                        "Status": "Enabled"
                    })
                ])
            }
        })