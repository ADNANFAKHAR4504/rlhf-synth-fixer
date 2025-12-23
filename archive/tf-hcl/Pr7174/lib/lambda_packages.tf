# Archive Lambda function code
data "archive_file" "encryption_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/encryption_check.py"
  output_path = "${path.module}/lambda/encryption_check.zip"
}

data "archive_file" "tagging_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/tagging_check.py"
  output_path = "${path.module}/lambda/tagging_check.zip"
}

data "archive_file" "backup_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/backup_check.py"
  output_path = "${path.module}/lambda/backup_check.zip"
}
