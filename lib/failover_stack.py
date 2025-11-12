from aws_cdk import (
    Stack,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_lambda as _lambda,
    aws_iam as iam,
    Duration,
    Tags,
    CfnOutput
)
from constructs import Construct

class FailoverStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 environment_suffix: str, hosted_zone_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Lambda function for failover orchestration
        failover_lambda_role = iam.Role(
            self, f"FailoverLambdaRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant Route 53 permissions
        failover_lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "route53:ChangeResourceRecordSets",
                    "route53:GetChange",
                    "route53:ListResourceRecordSets"
                ],
                resources=[
                    f"arn:aws:route53:::hostedzone/{hosted_zone_id}",
                    "arn:aws:route53:::change/*"
                ]
            )
        )

        # Grant RDS permissions for cluster promotion
        failover_lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "rds:FailoverGlobalCluster",
                    "rds:DescribeGlobalClusters",
                    "rds:DescribeDBClusters"
                ],
                resources=["*"]
            )
        )

        # Grant SSM permissions
        failover_lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ssm:PutParameter",
                    "ssm:GetParameter"
                ],
                resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter/payment/*"]
            )
        )

        # Failover Lambda function code (inline for simplicity)
        failover_fn_code = """
import json
import boto3
import os

route53 = boto3.client('route53')
rds = boto3.client('rds')
ssm = boto3.client('ssm')

def handler(event, context):
    environment_suffix = os.environ['ENVIRONMENT_SUFFIX']
    hosted_zone_id = os.environ['HOSTED_ZONE_ID']

    # Step 1: Update Route 53 weights (primary: 0%, secondary: 100%)
    # Step 2: Update SSM parameters
    # Step 3: Notify about manual RDS promotion requirement

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Failover initiated successfully',
            'next_steps': 'Manual RDS cluster promotion required'
        })
    }
"""

        failover_fn = _lambda.Function(
            self, f"FailoverOrchestration-{environment_suffix}",
            function_name=f"failover-orchestration-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline(failover_fn_code),
            role=failover_lambda_role,
            timeout=Duration.minutes(5),
            memory_size=256,
            environment={
                "ENVIRONMENT_SUFFIX": environment_suffix,
                "HOSTED_ZONE_ID": hosted_zone_id
            }
        )

        Tags.of(failover_fn).add("DR-Role", "global")

        # Step Functions state machine for failover automation
        invoke_failover = tasks.LambdaInvoke(
            self, f"InvokeFailoverLambda-{environment_suffix}",
            lambda_function=failover_fn,
            output_path="$.Payload"
        )

        success_state = sfn.Succeed(
            self, f"FailoverComplete-{environment_suffix}",
            comment="Failover orchestration completed"
        )

        invoke_failover.next(success_state)

        state_machine = sfn.StateMachine(
            self, f"FailoverStateMachine-{environment_suffix}",
            state_machine_name=f"payment-failover-{environment_suffix}",
            definition=invoke_failover,
            timeout=Duration.minutes(10)
        )

        Tags.of(state_machine).add("DR-Role", "global")

        # Outputs
        CfnOutput(
            self, "FailoverStateMachineArn",
            value=state_machine.state_machine_arn,
            export_name=f"failover-state-machine-arn-{environment_suffix}"
        )

        CfnOutput(
            self, "FailoverLambdaArn",
            value=failover_fn.function_arn,
            export_name=f"failover-lambda-arn-{environment_suffix}"
        )
