# IAM role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "${var.environment}-payment-app-ec2-role"
  
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
    Name        = "${var.environment}-payment-app-ec2-role"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Attach CloudWatch agent policy
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Attach SSM policy for Session Manager
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.environment}-payment-app-ec2-profile"
  role = aws_iam_role.ec2.name
  
  tags = {
    Name        = "${var.environment}-payment-app-ec2-profile"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# EC2 instances
resource "aws_instance" "app" {
  count = var.instance_count
  
  ami           = var.ami_id
  instance_type = var.ec2_instance_type
  
  subnet_id                   = data.aws_subnets.private.ids[count.index % length(data.aws_subnets.private.ids)]
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  key_name                    = var.ssh_key_name
  
  monitoring = var.environment == "prod" ? true : false
  
  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.environment == "prod" ? 50 : 20
    encrypted            = true
    delete_on_termination = true
  }
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_endpoint = aws_db_instance.main.endpoint
    db_name     = aws_db_instance.main.db_name
    environment = var.environment
  }))
  
  tags = {
    Name        = "${var.environment}-payment-app-ec2-${count.index + 1}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}