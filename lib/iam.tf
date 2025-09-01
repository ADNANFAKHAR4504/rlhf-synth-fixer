# EC2 Instance Role - Minimal permissions for SSM and CloudWatch
# Follows least privilege principle with scoped permissions
resource "aws_iam_role" "ec2_instance" {
  name = "${var.project_name}-${var.environment}-ec2-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-instance-role"
  }
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_instance" {
  name = "${var.project_name}-${var.environment}-ec2-instance-profile"
  role = aws_iam_