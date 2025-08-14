import re


def parse_arn(arn: str) -> str:
  """
  Parses an AWS ARN and returns the resource part.

  Handles:
  - Standard ARNs: arn:partition:service:region:account-id:resource
  - S3 bucket ARNs: arn:aws:s3:::bucket-name (no region/account)
  """

  # Handle S3 bucket ARN format
  s3_match = re.match(r"^arn:aws:s3:::(.+)$", arn)
  if s3_match:
    return s3_match.group(1)

  # Handle other standard ARNs
  general_match = re.match(r"^arn:aws:[^:]+:[^:]*:\d+:(.+)$", arn)
  if general_match:
    return general_match.group(1)

  raise ValueError(f"Invalid ARN format: {arn}")