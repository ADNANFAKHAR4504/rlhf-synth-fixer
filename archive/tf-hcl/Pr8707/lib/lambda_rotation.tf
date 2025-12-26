data "archive_file" "secrets_rotation" {
  type        = "zip"
  output_path = "${path.module}/lambda_rotation.zip"

  source {
    content  = <<-EOT
      import json
      import boto3
      import os

      def lambda_handler(event, context):
          arn = event['SecretId']
          token = event['ClientRequestToken']
          step = event['Step']

          service_client = boto3.client('secretsmanager')

          metadata = service_client.describe_secret(SecretId=arn)
          if not metadata['RotationEnabled']:
              raise ValueError("Secret %s is not enabled for rotation" % arn)
          versions = metadata['VersionIdsToStages']
          if token not in versions:
              raise ValueError("Secret version %s has no stage for rotation of secret %s." % (token, arn))
          if "AWSCURRENT" in versions[token]:
              return
          elif "AWSPENDING" not in versions[token]:
              raise ValueError("Secret version %s not set as AWSPENDING for rotation of secret %s." % (token, arn))

          if step == "createSecret":
              create_secret(service_client, arn, token)
          elif step == "setSecret":
              set_secret(service_client, arn, token)
          elif step == "testSecret":
              test_secret(service_client, arn, token)
          elif step == "finishSecret":
              finish_secret(service_client, arn, token)
          else:
              raise ValueError("Invalid step parameter")

      def create_secret(service_client, arn, token):
          service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
          try:
              service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
          except service_client.exceptions.ResourceNotFoundException:
              passwd = service_client.get_random_password(ExcludeCharacters='/@"\'\\ ', PasswordLength=32)
              service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=passwd['RandomPassword'], VersionStages=['AWSPENDING'])

      def set_secret(service_client, arn, token):
          pass

      def test_secret(service_client, arn, token):
          pass

      def finish_secret(service_client, arn, token):
          metadata = service_client.describe_secret(SecretId=arn)
          current_version = None
          for version in metadata["VersionIdsToStages"]:
              if "AWSCURRENT" in metadata["VersionIdsToStages"][version]:
                  if version == token:
                      return
                  current_version = version
                  break
          service_client.update_secret_version_stage(SecretId=arn, VersionStage="AWSCURRENT", MoveToVersionId=token, RemoveFromVersionId=current_version)
    EOT
    filename = "index.py"
  }
}

resource "aws_lambda_function" "secrets_rotation" {
  filename         = data.archive_file.secrets_rotation.output_path
  function_name    = "secrets-rotation-${var.environment_suffix}"
  role             = aws_iam_role.lambda_secrets_rotation.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.secrets_rotation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_rotation.id]
  }

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "secrets-rotation-lambda-${var.environment_suffix}"
  }
}

resource "aws_security_group" "lambda_rotation" {
  name_prefix = "lambda-rotation-sg-${var.environment_suffix}-"
  description = "Security group for Lambda secrets rotation"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "HTTPS to Secrets Manager"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-rotation-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}
