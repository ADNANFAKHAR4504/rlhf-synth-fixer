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
        assert int(output) >= 15
