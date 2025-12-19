"""Integration tests for deployed TapStack monitoring infrastructure"""
import json
import os
from pathlib import Path
import subprocess


def run_aws_command(command):
    """Helper to run AWS CLI commands"""
    result = subprocess.run(
        command,
        shell=True,
        capture_output=True,
        text=True
    )
    return result.stdout.strip(), result.returncode


class TestTapStackIntegration:
    """Integration tests for TapStack monitoring resources"""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs"""
        outputs_path = Path("cfn-outputs/flat-outputs.json")
        if outputs_path.exists():
            with open(outputs_path) as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}
        
        cls.region = os.getenv("AWS_REGION", "us-east-1")
        cls.env_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        cls.stack_name = cls.outputs.get("StackName", f"TapStack{cls.env_suffix}")

    def test_stack_exists(self):
        """Verify CloudFormation stack is deployed"""
        cmd = f"aws cloudformation describe-stacks --stack-name {self.stack_name} --region {self.region} --query 'Stacks[0].StackStatus' --output text"
        output, code = run_aws_command(cmd)
        
        assert code == 0, f"Stack {self.stack_name} not found"
        assert output in ["CREATE_COMPLETE", "UPDATE_COMPLETE"], f"Stack status: {output}"

    def test_cloudwatch_log_groups_exist(self):
        """Verify CloudWatch log groups are created"""
        log_groups = [
            f"/aws/apigateway/payment-api-{self.env_suffix}",
            f"/aws/lambda/payment-processor-{self.env_suffix}",
            f"/aws/payment-app-{self.env_suffix}"
        ]
        
        for log_group in log_groups:
            cmd = f"aws logs describe-log-groups --log-group-name-prefix '{log_group}' --region {self.region} --query 'logGroups[0].logGroupName' --output text"
            output, code = run_aws_command(cmd)
            
            assert code == 0, f"Log group {log_group} not found"
            assert log_group in output, f"Expected {log_group}, got {output}"

    def test_sns_topics_exist(self):
        """Verify SNS topics are created"""
        cmd = f"aws sns list-topics --region {self.region} --query 'Topics[*].TopicArn' --output text"
        output, code = run_aws_command(cmd)
        
        assert code == 0, "Failed to list SNS topics"
        assert "payment-critical-alerts" in output
        assert "payment-warning-alerts" in output
        assert "payment-info-alerts" in output

    def test_cloudwatch_alarms_exist(self):
        """Verify CloudWatch alarms are created"""
        cmd = f"aws cloudwatch describe-alarms --region {self.region} --query 'MetricAlarms[?contains(AlarmName, `payment`)].AlarmName' --output text"
        output, code = run_aws_command(cmd)
        
        assert code == 0
        assert "payment-api-4xx-errors" in output
        assert "payment-api-5xx-errors" in output
        assert "payment-lambda-errors" in output

    def test_monitoring_resources_deployed(self):
        """Verify all monitoring resources are deployed"""
        cmd = f"aws cloudformation describe-stack-resources --stack-name {self.stack_name} --region {self.region} --query 'StackResources | length(@)' --output text"
        output, code = run_aws_command(cmd)
        
        assert code == 0
        assert int(output) >= 20  # Updated to include Synthetics resources

    def test_synthetics_canary_exists(self):
        """Verify Synthetics canary is created"""
        cmd = f"aws synthetics describe-canaries --region {self.region} --query 'Canaries[?contains(Name, `payment-api-canary`)].Name' --output text"
        output, code = run_aws_command(cmd)
        
        assert code == 0
        assert "payment-api-canary" in output

    def test_synthetics_canary_configuration(self):
        """Verify Synthetics canary configuration and status"""
        canary_name = f"payment-api-canary-{self.env_suffix}"
        cmd = f"aws synthetics describe-canaries --region {self.region} --names {canary_name} --query 'Canaries[0].[Status.State,RuntimeVersion,Schedule.DurationInSeconds]' --output text"
        output, code = run_aws_command(cmd)
        
        assert code == 0
        parts = output.split()
        state = parts[0] if len(parts) > 0 else ""
        runtime = parts[1] if len(parts) > 1 else ""
        
        # Canary should be in RUNNING or READY state
        assert state in ["RUNNING", "READY", "CREATING"], f"Canary state: {state}"
        assert "syn-python-selenium" in runtime, f"Runtime: {runtime}"

    def test_synthetics_canary_runs(self):
        """Verify Synthetics canary has executed runs"""
        canary_name = f"payment-api-canary-{self.env_suffix}"
        cmd = f"aws synthetics get-canary-runs --region {self.region} --name {canary_name} --max-results 1 --query 'CanaryRuns[0].Status.State' --output text"
        output, code = run_aws_command(cmd)
        
        # If canary has run, check status. If not run yet, that's also acceptable (newly created)
        if code == 0 and output and output != "None":
            # Canary has run - verify it's not in a failed state
            assert output in ["PASSED", "RUNNING"], f"Canary run state: {output}"
