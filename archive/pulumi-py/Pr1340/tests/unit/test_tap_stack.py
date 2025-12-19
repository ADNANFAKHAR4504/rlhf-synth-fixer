import pulumi
import pulumi_aws as aws
import pytest
from pulumi import ResourceOptions
from pulumi.runtime import set_mocks

from lib.tap_stack import TapStack, TapStackArgs


# ------------------------
# Pulumi Mocks
# ------------------------
class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args):
        name = args.name
        outputs = dict(args.inputs)
        outputs.setdefault("id", f"{name}_id")
        outputs.setdefault("arn", f"arn:aws:mock:{name}")
        outputs.setdefault("name", name)
        outputs.setdefault("bucket", f"{name}-bucket")
        return [f"{name}_id", outputs]

    def call(self, args):
        return {}


set_mocks(MyMocks())

# ------------------------
# Helpers
# ------------------------


def get_first_resource(stack, resource_type):
    """
    Finds the first child resource of a given type from a Pulumi ComponentResource.
    Searches through instance attributes and Pulumi's child resource tracking.
    """
    # Search in attributes
    for attr in vars(stack).values():
        if isinstance(attr, resource_type):
            return attr
    # Search in Pulumi's tracked children (if present)
    for res in getattr(stack, "_child_resources", []):
        if isinstance(res, resource_type):
            return res
    raise AssertionError(f"No resource found of type {resource_type.__name__}")


def assert_required_tags(tags, required):
    assert isinstance(tags, dict)
    missing = required - set(tags.keys())
    assert not missing, f"Missing tags: {missing}. Found: {tags}"


def assert_versioning_enabled(v):
    if isinstance(v, dict):
        assert v.get("enabled") is True
    else:
        assert getattr(v, "enabled", False) is True


def assert_alias_name(name):
    assert name == "live", f"Expected alias 'live', got {name}"


def assert_bucket_name_has_prefix(name, prefix):
    assert name.startswith(
        prefix), f"Bucket name {name} does not start with {prefix}"


def assert_pipeline_stages(stages):
    names = {s["name"] for s in stages}
    assert {"Source", "Build", "Deploy"}.issubset(
        names), f"Pipeline stages missing: {names}"

# ------------------------
# Fixture
# ------------------------


@pytest.fixture(scope="module")
def tap_stack():
    args = TapStackArgs(environment_suffix="dev")
    return TapStack("test-stack", args, opts=ResourceOptions())

# ------------------------
# Tests
# ------------------------


def test_tags_applied_everywhere(tap_stack):
    required = {"Environment", "Department", "Project"}
    resources = [
        get_first_resource(tap_stack, aws.s3.BucketV2),
        get_first_resource(tap_stack, aws.lambda_.Function),
        # aws.lambda_.Alias has no tags property → skip
        get_first_resource(tap_stack, aws.codedeploy.Application),
        get_first_resource(tap_stack, aws.codebuild.Project),
        get_first_resource(tap_stack, aws.codepipeline.Pipeline),
    ]
    for r in resources:
        if hasattr(r, "tags"):
            pulumi.Output.from_input(r.tags).apply(
                lambda t: assert_required_tags(t, required)
            )


def test_artifact_and_logs_bucket_names(tap_stack):
    for prefix in ["corp-ci-artifacts", "corp-app-logs"]:
        pulumi.Output.from_input(
            get_first_resource(tap_stack, aws.s3.BucketV2).bucket
        ).apply(lambda b, p=prefix: assert_bucket_name_has_prefix(b, p))


def test_lambda_alias_is_live(tap_stack):
    pulumi.Output.from_input(
        get_first_resource(tap_stack, aws.lambda_.Alias).name
    ).apply(assert_alias_name)


def test_api_gateway_exists(tap_stack):
    api = get_first_resource(tap_stack, aws.apigateway.RestApi)
    assert api is not None


def test_codedeploy_app_and_group_exist(tap_stack):
    app = get_first_resource(tap_stack, aws.codedeploy.Application)
    dg = get_first_resource(tap_stack, aws.codedeploy.DeploymentGroup)
    assert app is not None and dg is not None


def test_pipeline_has_expected_stages(tap_stack):
    pulumi.Output.from_input(
        get_first_resource(tap_stack, aws.codepipeline.Pipeline).stages
    ).apply(assert_pipeline_stages)
