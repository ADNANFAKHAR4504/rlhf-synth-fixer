resource "aws_iam_role" "lambda_role" {
  name = "${var.project}-${var.environment}-lambda-role-${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_common_policy" {
  name        = "${var.project}-${var.environment}-lambda-common-${local.suffix}"
  description = "Least-privilege policy for webhook lambdas"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = [
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.project}-${var.environment}-*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ],
        Resource = [
          aws_sqs_queue.webhook_processing_queue.arn,
          aws_sqs_queue.validated_queue.arn,
          aws_sqs_queue.webhook_dlq.arn
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          "${aws_s3_bucket.webhook_payloads.arn}/*",
          "${aws_s3_bucket.failed_messages.arn}/*",
          aws_s3_bucket.webhook_payloads.arn,
          aws_s3_bucket.failed_messages.arn
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ],
        Resource = [
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/index/*"
        ]
      },
      {
        Effect   = "Allow",
        Action   = ["ssm:GetParameter*"],
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter${var.ssm_prefix}/*"
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt"],
        Resource = [data.aws_kms_alias.dynamodb.target_key_arn]
      },
      {
        Effect   = "Allow",
        Action   = ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_common_policy.arn
}
