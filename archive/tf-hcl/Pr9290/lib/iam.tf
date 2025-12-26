# Elastic Beanstalk Service Role
resource "aws_iam_role" "eb_service_role" {
  name = "${var.project_name}-${var.environment_suffix}-eb-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticbeanstalk.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-eb-service-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "eb_service_role_health" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
  role       = aws_iam_role.eb_service_role.name
}

resource "aws_iam_role_policy_attachment" "eb_service_role_service" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService"
  role       = aws_iam_role.eb_service_role.name
}

# EC2 Instance Profile for Elastic Beanstalk
resource "aws_iam_role" "eb_ec2_role" {
  name = "${var.project_name}-${var.environment_suffix}-eb-ec2-role"

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
    Name        = "${var.project_name}-${var.environment_suffix}-eb-ec2-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "eb_ec2_web_tier" {
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
  role       = aws_iam_role.eb_ec2_role.name
}

resource "aws_iam_role_policy_attachment" "eb_ec2_worker_tier" {
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
  role       = aws_iam_role.eb_ec2_role.name
}

resource "aws_iam_role_policy_attachment" "eb_ec2_multicontainer_docker" {
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
  role       = aws_iam_role.eb_ec2_role.name
}

resource "aws_iam_instance_profile" "eb_ec2_profile" {
  name = "${var.project_name}-${var.environment_suffix}-eb-ec2-profile"
  role = aws_iam_role.eb_ec2_role.name

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-eb-ec2-profile"
    Environment = var.environment
    Project     = var.project_name
  }
}