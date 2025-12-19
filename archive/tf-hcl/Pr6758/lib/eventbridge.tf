# EventBridge rule to trigger Lambda on S3 object creation
resource "aws_cloudwatch_event_rule" "s3_object_created" {
  name        = "etl-s3-object-created-${var.environmentSuffix}"
  description = "Trigger ETL processing when file is uploaded to input bucket"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.input.bucket]
      }
    }
  })

  tags = {
    Name = "etl-s3-trigger-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.s3_object_created.name
  target_id = "InvokeLambdaFunction"
  arn       = aws_lambda_function.processor.arn
  role_arn  = aws_iam_role.eventbridge_lambda.arn
}
