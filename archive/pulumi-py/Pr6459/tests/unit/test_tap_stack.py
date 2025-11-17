"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests CI/CD Pipeline infrastructure without actual AWS deployment.
"""

import unittest
import pulumi
import json


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that returns inputs as outputs without resource-specific logic.
    """
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs}
        
        # Add common computed properties based on resource type
        if "aws:kms/key:Key" in args.typ:
            outputs["id"] = f"{args.name}-id"
            outputs["arn"] = f"arn:aws:kms:us-east-1:123456789012:key/{args.name}-id"
        elif "aws:s3/bucket:Bucket" in args.typ:
            outputs["id"] = args.inputs.get("bucket", f"{args.name}-bucket")
            outputs["arn"] = f"arn:aws:s3:::{args.inputs.get('bucket', f'{args.name}-bucket')}"
        elif "aws:s3/bucketVersioning:BucketVersioning" in args.typ:
            outputs["id"] = f"{args.name}-versioning"
            outputs["bucket"] = args.inputs.get("bucket", f"{args.name}-bucket")
        elif "aws:s3/bucketServerSideEncryptionConfiguration:BucketServerSideEncryptionConfiguration" in args.typ:
            outputs["id"] = f"{args.name}-encryption"
            outputs["bucket"] = args.inputs.get("bucket", f"{args.name}-bucket")
        elif "aws:ecr/repository:Repository" in args.typ:
            outputs["id"] = args.inputs.get("name", f"{args.name}-repo")
            outputs["repository_url"] = f"123456789012.dkr.ecr.us-east-1.amazonaws.com/{args.inputs.get('name', f'{args.name}-repo')}"
            outputs["arn"] = f"arn:aws:ecr:us-east-1:123456789012:repository/{args.inputs.get('name', f'{args.name}-repo')}"
        elif "aws:cloudwatch/logGroup:LogGroup" in args.typ:
            outputs["id"] = args.inputs.get("name", f"{args.name}-lg")
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.inputs.get('name', f'{args.name}-lg')}"
        elif "aws:iam/role:Role" in args.typ:
            outputs["id"] = args.inputs.get("name", f"{args.name}-role")
            outputs["arn"] = f"arn:aws:iam::123456789012:role/{args.inputs.get('name', f'{args.name}-role')}"
        elif "aws:ec2/vpc:Vpc" in args.typ:
            outputs["id"] = f"vpc-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:vpc/vpc-{args.name}"
        elif "aws:ec2/subnet:Subnet" in args.typ:
            outputs["id"] = f"subnet-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:subnet/subnet-{args.name}"
        elif "aws:ec2/securityGroup:SecurityGroup" in args.typ:
            outputs["id"] = f"sg-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:security-group/sg-{args.name}"
        elif "aws:ecs/cluster:Cluster" in args.typ:
            outputs["id"] = args.inputs.get("name", f"{args.name}-cluster")
            outputs["arn"] = f"arn:aws:ecs:us-east-1:123456789012:cluster/{args.inputs.get('name', f'{args.name}-cluster')}"
            outputs["name"] = args.inputs.get("name", f"{args.name}-cluster")
        elif "aws:ecs/taskDefinition:TaskDefinition" in args.typ:
            outputs["id"] = f"{args.name}-task"
            outputs["arn"] = f"arn:aws:ecs:us-east-1:123456789012:task-definition/{args.inputs.get('family', f'{args.name}-family')}"
            outputs["family"] = args.inputs.get("family", f"{args.name}-family")
        elif "aws:ecs/service:Service" in args.typ:
            outputs["id"] = args.inputs.get("name", f"{args.name}-service")
            outputs["name"] = args.inputs.get("name", f"{args.name}-service")
        elif "aws:codebuild/project:Project" in args.typ:
            outputs["id"] = args.inputs.get("name", f"{args.name}-project")
            outputs["arn"] = f"arn:aws:codebuild:us-east-1:123456789012:project/{args.inputs.get('name', f'{args.name}-project')}"
            outputs["name"] = args.inputs.get("name", f"{args.name}-project")
        elif "aws:codedeploy/application:Application" in args.typ:
            outputs["id"] = args.inputs.get("name", f"{args.name}-app")
            outputs["name"] = args.inputs.get("name", f"{args.name}-app")
        elif "aws:codedeploy/deploymentGroup:DeploymentGroup" in args.typ:
            outputs["id"] = f"{args.name}-group"
            outputs["deployment_group_name"] = args.inputs.get("deployment_group_name", f"{args.name}-group")
        elif "aws:codepipeline/pipeline:Pipeline" in args.typ:
            outputs["id"] = args.inputs.get("name", f"{args.name}-pipeline")
            outputs["arn"] = f"arn:aws:codepipeline:us-east-1:123456789012:{args.inputs.get('name', f'{args.name}-pipeline')}"
            outputs["name"] = args.inputs.get("name", f"{args.name}-pipeline")
        else:
            outputs["id"] = f"{args.name}-id"
            if "arn" not in outputs:
                outputs["arn"] = f"arn:aws:service:us-east-1:123456789012:{args.name}-id"
        
        return [outputs.get("id", f"{args.name}-id"), outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getRegion:getRegion":
            return {"region": "ap-southeast-1", "name": "ap-southeast-1", "id": "ap-southeast-1"}
        return args.args


pulumi.runtime.set_mocks(MinimalMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.aws_region, 'ap-southeast-1')

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"Team": "Infrastructure", "CostCenter": "Engineering"}
        args = TapStackArgs(
            environment_suffix="prod",
            tags=custom_tags,
            aws_region="us-east-1"
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.aws_region, 'us-east-1')

    def test_tap_stack_args_dev_environment(self):
        """Test TapStackArgs with dev environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="dev")

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.aws_region, 'ap-southeast-1')

    def test_tap_stack_args_prod_environment(self):
        """Test TapStackArgs with prod environment."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="prod", aws_region="us-west-2")

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.aws_region, 'us-west-2')


class TestTapStackInstantiation(unittest.TestCase):
    """Test cases for TapStack instantiation and basic properties."""

    @pulumi.runtime.test
    def test_stack_instantiation_without_errors(self):
        """Test that stack can be instantiated without errors."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_instantiation(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify stack is created
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, "test")
            self.assertEqual(stack.aws_region, "ap-southeast-1")
            
            return {}

        return check_instantiation([])

    @pulumi.runtime.test
    def test_stack_with_default_environment(self):
        """Test stack with default environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_default_env(args):
            stack = TapStack("test-stack", TapStackArgs())
            
            # Should default to 'dev'
            self.assertEqual(stack.environment_suffix, "dev")
            self.assertEqual(stack.aws_region, "ap-southeast-1")
            
            return {}

        return check_default_env([])

    @pulumi.runtime.test
    def test_stack_with_prod_environment(self):
        """Test stack with production environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_env(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod", aws_region="us-east-1"))
            
            self.assertEqual(stack.environment_suffix, "prod")
            self.assertEqual(stack.aws_region, "us-east-1")
            
            return {}

        return check_prod_env([])


class TestTapStackTags(unittest.TestCase):
    """Test resource tagging functionality."""

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are stored in stack."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "DevOps", "Project": "CICDPipeline"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            self.assertEqual(stack.tags, custom_tags)

            return {}

        return check_tags([])

    @pulumi.runtime.test
    def test_no_tags_provided(self):
        """Test stack works when no tags are provided."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_no_tags(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Tags should be empty dict when not provided
            self.assertEqual(stack.tags, {})

            return {}

        return check_no_tags([])


class TestTapStackKMSInfrastructure(unittest.TestCase):
    """Test KMS key creation."""

    @pulumi.runtime.test
    def test_kms_key_creation(self):
        """Test that KMS key is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_kms(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify KMS key is created
            self.assertIsNotNone(stack.kms_key)
            
            return {}

        return check_kms([])


class TestTapStackS3Infrastructure(unittest.TestCase):
    """Test S3 bucket creation."""

    @pulumi.runtime.test
    def test_artifact_bucket_creation(self):
        """Test that S3 artifact bucket is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_s3(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify artifact bucket is created
            self.assertIsNotNone(stack.artifact_bucket)
            
            return {}

        return check_s3([])


class TestTapStackECRInfrastructure(unittest.TestCase):
    """Test ECR repository creation."""

    @pulumi.runtime.test
    def test_ecr_repository_creation(self):
        """Test that ECR repository is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_ecr(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify ECR repository is created
            self.assertIsNotNone(stack.ecr_repository)
            
            return {}

        return check_ecr([])


class TestTapStackCloudWatchInfrastructure(unittest.TestCase):
    """Test CloudWatch log groups creation."""

    @pulumi.runtime.test
    def test_log_groups_creation(self):
        """Test that CloudWatch log groups are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_logs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify log groups are created
            self.assertIsNotNone(stack.build_log_group)
            self.assertIsNotNone(stack.ecs_log_group)
            
            return {}

        return check_logs([])


class TestTapStackIAMRoles(unittest.TestCase):
    """Test IAM roles creation."""

    @pulumi.runtime.test
    def test_iam_roles_creation(self):
        """Test that IAM roles are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_iam(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify IAM roles are created
            self.assertIsNotNone(stack.codebuild_role)
            self.assertIsNotNone(stack.codepipeline_role)
            self.assertIsNotNone(stack.codedeploy_role)
            self.assertIsNotNone(stack.ecs_task_role)
            self.assertIsNotNone(stack.ecs_execution_role)
            
            return {}

        return check_iam([])


class TestTapStackVPCInfrastructure(unittest.TestCase):
    """Test VPC and networking infrastructure."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that VPC is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_vpc(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify VPC is created
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.private_subnets)
            self.assertIsNotNone(stack.security_group)
            
            return {}

        return check_vpc([])


class TestTapStackECSInfrastructure(unittest.TestCase):
    """Test ECS cluster and service creation."""

    @pulumi.runtime.test
    def test_ecs_cluster_creation(self):
        """Test that ECS cluster is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_ecs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify ECS resources are created
            self.assertIsNotNone(stack.ecs_cluster)
            self.assertIsNotNone(stack.task_definition)
            self.assertIsNotNone(stack.ecs_service)
            
            return {}

        return check_ecs([])


class TestTapStackCodeBuildInfrastructure(unittest.TestCase):
    """Test CodeBuild project creation."""

    @pulumi.runtime.test
    def test_codebuild_project_creation(self):
        """Test that CodeBuild project is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_codebuild(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify CodeBuild project is created
            self.assertIsNotNone(stack.build_project)
            
            return {}

        return check_codebuild([])


class TestTapStackCodeDeployInfrastructure(unittest.TestCase):
    """Test CodeDeploy application and deployment group creation."""

    @pulumi.runtime.test
    def test_codedeploy_creation(self):
        """Test that CodeDeploy application and deployment group are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_codedeploy(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify CodeDeploy resources are created
            self.assertIsNotNone(stack.deploy_app)
            self.assertIsNotNone(stack.deploy_group)
            
            return {}

        return check_codedeploy([])


class TestTapStackCodePipelineInfrastructure(unittest.TestCase):
    """Test CodePipeline creation."""

    @pulumi.runtime.test
    def test_codepipeline_creation(self):
        """Test that CodePipeline is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_codepipeline(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))
            
            # Verify CodePipeline is created
            self.assertIsNotNone(stack.pipeline)
            
            return {}

        return check_codepipeline([])


class TestTapStackNaming(unittest.TestCase):
    """Test resource naming conventions."""

    @pulumi.runtime.test
    def test_resource_naming_with_dev_environment(self):
        """Test resources are named with dev environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dev_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="dev"))

            self.assertEqual(stack.environment_suffix, "dev")

            return {}

        return check_dev_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_prod_environment(self):
        """Test resources are named with prod environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_prod_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            self.assertEqual(stack.environment_suffix, "prod")

            return {}

        return check_prod_naming([])

    @pulumi.runtime.test
    def test_resource_naming_with_custom_environment(self):
        """Test resources are named with custom environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_custom_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="staging"))

            self.assertEqual(stack.environment_suffix, "staging")

            return {}

        return check_custom_naming([])


class TestTapStackRegionConfiguration(unittest.TestCase):
    """Test AWS region configuration."""

    @pulumi.runtime.test
    def test_default_region(self):
        """Test that default region is ap-southeast-1."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_default_region(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertEqual(stack.aws_region, "ap-southeast-1")

            return {}

        return check_default_region([])

    @pulumi.runtime.test
    def test_custom_region(self):
        """Test that custom region is used."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_custom_region(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", aws_region="us-west-2"))

            self.assertEqual(stack.aws_region, "us-west-2")

            return {}

        return check_custom_region([])


class TestTapStackMultipleInstances(unittest.TestCase):
    """Test creating multiple stack instances."""

    @pulumi.runtime.test
    def test_multiple_dev_stacks(self):
        """Test creating multiple dev environment stacks."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_multiple_stacks(args):
            stack1 = TapStack("dev-stack-1", TapStackArgs(environment_suffix="dev"))
            stack2 = TapStack("dev-stack-2", TapStackArgs(environment_suffix="dev"))
            
            self.assertIsNotNone(stack1)
            self.assertIsNotNone(stack2)
            self.assertEqual(stack1.environment_suffix, "dev")
            self.assertEqual(stack2.environment_suffix, "dev")
            
            return {}

        return check_multiple_stacks([])

    @pulumi.runtime.test
    def test_mixed_environment_stacks(self):
        """Test creating stacks with different environments."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_mixed_stacks(args):
            dev_stack = TapStack("dev-stack", TapStackArgs(environment_suffix="dev"))
            prod_stack = TapStack("prod-stack", TapStackArgs(environment_suffix="prod"))
            
            self.assertIsNotNone(dev_stack)
            self.assertIsNotNone(prod_stack)
            self.assertEqual(dev_stack.environment_suffix, "dev")
            self.assertEqual(prod_stack.environment_suffix, "prod")
            
            return {}

        return check_mixed_stacks([])


if __name__ == '__main__':
    unittest.main()
