# modules/media_processing/main.tf
resource "aws_iam_role" "media_convert" {
  name = "media-convert-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "mediaconvert.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "media_convert" {
  name = "media-convert-policy"
  role = aws_iam_role.media_convert.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = [
          var.source_bucket_arn,
          "${var.source_bucket_arn}/*",
          var.destination_bucket_arn,
          "${var.destination_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_media_convert_queue" "main" {
  name = "media-streaming-queue"
  
  tags = {
    Name = "media-streaming-queue"
  }
}

# Create a MediaConvert job template for standard video transcoding
resource "aws_cloudformation_stack" "job_template" {
  name = "media-convert-job-template"
  
  template_body = templatefile("${path.module}/job_template.json", {
    role_arn = aws_iam_role.media_convert.arn
    queue_arn = aws_media_convert_queue.main.arn
  })
  
  capabilities = ["CAPABILITY_NAMED_IAM"]
}

# Lambda function to trigger MediaConvert jobs when new videos are uploaded to S3
resource "aws_iam_role" "lambda_media_convert_trigger" {
  name = "lambda-media-convert-trigger-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_media_convert_trigger" {
  name = "lambda-media-convert-trigger-policy"
  role = aws_iam_role.lambda_media_convert_trigger.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "s3:GetObject"
        ]
        Effect   = "Allow"
        Resource = "${var.source_bucket_arn}/*"
      },
      {
        Action = [
          "mediaconvert:CreateJob",
          "mediaconvert:GetJobTemplate"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "iam:PassRole"
        ]
        Effect   = "Allow"
        Resource = aws_iam_role.media_convert.arn
      }
    ]
  })
}

data "archive_file" "media_convert_trigger" {
  type        = "zip"
  output_path = "${path.module}/lambda_media_convert_trigger.zip"
  source {
    content  = templatefile("${path.module}/media_convert_trigger.js", {
      job_template_name = aws_cloudformation_stack.job_template.outputs.JobTemplateName
      role_arn = aws_iam_role.media_convert.arn
      destination_bucket = var.destination_bucket
      mediaconvert_endpoint = var.mediaconvert_endpoint
    })
    filename = "index.js"
  }
}

resource "aws_lambda_function" "media_convert_trigger" {
  filename      = data.archive_file.media_convert_trigger.output_path
  function_name = "media-convert-trigger"
  role          = aws_iam_role.lambda_media_convert_trigger.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  
  environment {
    variables = {
      JOB_TEMPLATE_NAME   = aws_cloudformation_stack.job_template.outputs.JobTemplateName
      ROLE_ARN            = aws_iam_role.media_convert.arn
      DESTINATION_BUCKET  = var.destination_bucket
      MEDIACONVERT_ENDPOINT = var.mediaconvert_endpoint
    }
  }
  
  lifecycle {
    ignore_changes = [filename]
  }
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.media_convert_trigger.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.source_bucket_arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = var.source_bucket_id
  
  lambda_function {
    lambda_function_arn = aws_lambda_function.media_convert_trigger.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".mp4"
  }
}