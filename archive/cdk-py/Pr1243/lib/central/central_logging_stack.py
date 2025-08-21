from typing import List
from constructs import Construct
from aws_cdk import (
  Stack,
  aws_kinesis as kinesis,
  aws_logs as logs,
  aws_logs_destinations as log_destinations,
  aws_lambda as _lambda,
  aws_iam as iam,
  aws_lambda_event_sources as lambda_event_sources,
)

class CentralLoggingStack(Stack):
  """
  Central (security) account:
    - Kinesis stream as the endpoint for cross-account Logs Destination
    - CrossAccountDestination that allows source accounts to subscribe
    - Lambda consumer that writes all records into a central Log Group
  """
  def __init__(self,
               scope: Construct,
               construct_id: str,
               *,
               allowed_source_accounts: List[str],
               destination_name: str,
               **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.aggregated_log_group = logs.LogGroup(
      self, "AggregatedSecurityLogs",
      log_group_name="/aws/tap/security/aggregated",
      retention=logs.RetentionDays.THREE_MONTHS
    )

    stream = kinesis.Stream(
      self, "CentralLogStream",
      stream_name="central-security-logs",
      shard_count=1
    )

    # Cross-account Logs destination that targets the Kinesis stream
    # Grants PutSubscriptionFilter to allowed accounts
    destination_role = iam.Role(
      self, "LogsDestinationRole",
      assumed_by=iam.ServicePrincipal("logs.amazonaws.com")
    )
    stream.grant_write(destination_role)

    self.destination = logs.CrossAccountDestination(
      self, "CrossAccountLogsDestination",
      target_arn=stream.stream_arn,
      role=destination_role,
      destination_name=destination_name
    )
    for acct in allowed_source_accounts:
      self.destination.add_to_policy(
        iam.PolicyStatement(
          principals=[iam.AccountPrincipal(acct)],
          actions=["logs:PutSubscriptionFilter", "logs:CreateLogStream", "logs:PutLogEvents"],
          resources=["*"]
        )
      )

    # Lambda consumer -> writes each record into the central log group
    fn = _lambda.Function(
      self, "KinesisToCWLogs",
      runtime=_lambda.Runtime.PYTHON_3_12,
      handler="index.handler",
      code=_lambda.InlineCode(
        """
import base64, json, os, time
import boto3

logs = boto3.client("logs")
LOG_GROUP = os.environ["LOG_GROUP"]

def handler(event, _ctx):
    ts = int(time.time() * 1000)
    # create or get a log stream per batch
    stream_name = "kinesis-batch-" + str(ts)
    try:
        logs.create_log_stream(logGroupName=LOG_GROUP, logStreamName=stream_name)
    except logs.exceptions.ResourceAlreadyExistsException:
        pass

    msgs = []
    for rec in event.get("Records", []):
        data = base64.b64decode(rec["kinesis"]["data"])
        # CloudWatch Logs subscription delivers JSON lines; store raw
        msgs.append({"timestamp": ts, "message": data.decode("utf-8", errors="ignore")})

    if msgs:
        logs.put_log_events(logGroupName=LOG_GROUP, logStreamName=stream_name, logEvents=msgs)
    return {"ok": len(msgs)}
        """
      ),
      environment={"LOG_GROUP": self.aggregated_log_group.log_group_name},
      timeout=_lambda.Duration.seconds(60),
    )
    # Read from Kinesis
    fn.add_event_source(lambda_event_sources.KinesisEventSource(
      stream, batch_size=100, starting_position=_lambda.StartingPosition.TRIM_HORIZON
    ))

    # Expose ARN for per-account stacks to subscribe to
    self.destination_arn = self.destination.destination_arn
