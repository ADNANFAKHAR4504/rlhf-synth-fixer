"""Integration tests for TapStack."""
# tests/integration/test_tap_stack_integration.py
import json
import re
import os
import pytest
from cdktf import App, Testing
from lib.tap_stack import TapStack


def synth(stack) -> dict:
    """Synthesize the stack and return parsed JSON."""
    output = Testing.synth(stack)
    # Testing.synth returns a string; ensure we load it as JSON
    if isinstance(output, bytes):
        output = output.decode("utf-8")
    return json.loads(output)


def get_resources(tfjson: dict, rtype: str) -> dict:
    """Return dict of resources of a given Terraform type."""
    res = tfjson.get("resource", {})
    return res.get(rtype, {})


def get_data_sources(tfjson: dict, dtype: str) -> dict:
    data = tfjson.get("data", {})
    return data.get(dtype, {})


class TestTapStackIntegration:
    def test_stack_synthesizes_and_core_resources_exist(self, tmp_path, monkeypatch):
        # Ensure working dir is clean for any file writes (your stack writes lambda_src/)
        monkeypatch.chdir(tmp_path)

        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="int",
            aws_region="us-west-2",  # prefer matching your requirement
            state_bucket_region="us-east-1",
        )

        tf = synth(stack)

        # --- Provider sanity ---
        providers = tf.get("provider", {})
        assert "aws" in providers, "AWS provider must be configured"

        # --- VPC & networking ---
        vpcs = get_resources(tf, "aws_vpc")
        assert "main_vpc" in vpcs
        assert vpcs["main_vpc"]["cidr_block"] == "10.0.0.0/16"

        subnets = get_resources(tf, "aws_subnet")
        # Expect 2 public + 2 private = 4
        assert len(subnets) == 4
        # Quick check names
        names = {cfg["tags"]["Name"] for cfg in subnets.values()}
        assert {"tap-public-subnet-1", "tap-public-subnet-2", "tap-private-subnet-1", "tap-private-subnet-2"} <= names

        igw = get_resources(tf, "aws_internet_gateway")
        assert "main_igw" in igw

        natgws = get_resources(tf, "aws_nat_gateway")
        assert len(natgws) == 2, "Two NAT gateways for two AZs"

        # --- Security group for Lambda ---
        sgs = get_resources(tf, "aws_security_group")
        assert "lambda_sg" in sgs
        assert sgs["lambda_sg"]["description"] == "Security group for Lambda functions"

        # --- IAM: role + basic attachments ---
        roles = get_resources(tf, "aws_iam_role")
        assert "lambda_role" in roles
        role_name = roles["lambda_role"]["name"]
        assert role_name == "tap-lambda-execution-role"

        attachments = get_resources(tf, "aws_iam_role_policy_attachment")
        attached_arns = {cfg["policy_arn"] for cfg in attachments.values()}
        assert "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" in attached_arns
        assert "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole" in attached_arns
        assert "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess" in attached_arns

        # --- DynamoDB ---
        tables = get_resources(tf, "aws_dynamodb_table")
        assert "main_table" in tables
        tcfg = tables["main_table"]
        assert tcfg["name"] == "tap-serverless-table"
        assert tcfg["billing_mode"] == "PAY_PER_REQUEST"
        assert tcfg["hash_key"] == "id"
        assert {"name": "id", "type": "S"} in tcfg["attribute"]
        assert tcfg["server_side_encryption"]["enabled"] is True
        assert tcfg["point_in_time_recovery"]["enabled"] is True

        # --- Lambda (packaged via TerraformAsset) ---
        lambdas = get_resources(tf, "aws_lambda_function")
        assert "main_lambda" in lambdas
        lcfg = lambdas["main_lambda"]
        assert lcfg["function_name"] == "tap-serverless-function"
        assert lcfg["runtime"] == "python3.9"
        assert lcfg["handler"] == "lambda_function.lambda_handler"
        # Ensure environment var name is valid and contains table name reference
        env_vars = lcfg["environment"]["variables"]
        assert "DYNAMODB_TABLE" in env_vars
        # Should reference the table name from resource interpolation
        # (We can't fully resolve here, but ensure it's a string token)
        assert isinstance(env_vars["DYNAMODB_TABLE"], str) and env_vars["DYNAMODB_TABLE"]

        # VPC config attached
        vpc_cfg = lcfg["vpc_config"]
        assert len(vpc_cfg["subnet_ids"]) == 2
        assert len(vpc_cfg["security_group_ids"]) == 1

        # Source zip should be produced by the asset (path under .gen/.cdktf*)
        assert "filename" in lcfg and isinstance(lcfg["filename"], str)
        assert "source_code_hash" in lcfg and isinstance(lcfg["source_code_hash"], str)

        # --- API Gateway ---
        apis = get_resources(tf, "aws_api_gateway_rest_api")
        assert "main_api" in apis
        resources = get_resources(tf, "aws_api_gateway_resource")
        assert "api_resource" in resources
        assert resources["api_resource"]["path_part"] == "hello"
        methods = get_resources(tf, "aws_api_gateway_method")
        assert "api_method" in methods
        assert methods["api_method"]["http_method"] == "GET"
        integrations = get_resources(tf, "aws_api_gateway_integration")
        assert "api_integration" in integrations
        assert integrations["api_integration"]["type"] == "AWS_PROXY"
        stages = get_resources(tf, "aws_api_gateway_stage")
        assert "api_stage" in stages
        assert stages["api_stage"]["stage_name"] == "prod"
        assert stages["api_stage"]["xray_tracing_enabled"] is True

        # Lambda permission for API Gateway
        perms = get_resources(tf, "aws_lambda_permission")
        assert "api_lambda_permission" in perms
        assert perms["api_lambda_permission"]["principal"] == "apigateway.amazonaws.com"

        # --- CloudWatch Log Groups (no KMS alias/aws/logs) ---
        logs = get_resources(tf, "aws_cloudwatch_log_group")
        assert "lambda_log_group" in logs
        assert "api_log_group" in logs
        assert "kms_key_id" not in logs["lambda_log_group"]
        assert "kms_key_id" not in logs["api_log_group"]

        # --- Alarms ---
        alarms = get_resources(tf, "aws_cloudwatch_metric_alarm")
        alarm_names = {cfg["alarm_name"] for cfg in alarms.values()}
        assert {"tap-lambda-errors", "tap-api-4xx-errors"} <= alarm_names

        # --- Outputs ---
        outputs = tf.get("output", {})
        assert "api_gateway_url" in outputs
        assert "lambda_function_name" in outputs
        assert "dynamodb_table_name" in outputs
        assert "vpc_id" in outputs


    def test_synth_with_different_props(self, tmp_path, monkeypatch):
        # Validate props override (region/env suffix)
        monkeypatch.chdir(tmp_path)

        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack2",
            environment_suffix="qa",
            aws_region="us-east-1",
            state_bucket_region="us-east-1",
        )
        tf = synth(stack)

        # Provider region check (cannot assert directly here; validate via derived resources)
        # We at least ensure resources synthesized with expected naming using suffix
        buckets = get_resources(tf, "aws_s3_bucket")
        assert "tap_bucket" in buckets
        assert buckets["tap_bucket"]["bucket"].startswith("tap-bucket-qa-")

        # Ensure Lambda & API exist too
        lambdas = get_resources(tf, "aws_lambda_function")
        assert "main_lambda" in lambdas
        apis = get_resources(tf, "aws_api_gateway_rest_api")
        assert "main_api" in apis


