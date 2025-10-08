# modules/content_delivery/main.tf
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for media streaming platform"
}

resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = var.alb_dns_name
    origin_id   = "ALB"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  origin {
    domain_name = var.s3_bucket_domain
    origin_id   = "S3"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for media streaming platform"
  default_root_object = "index.html"
  
  # Price class determines the locations where content will be served from
  price_class = "PriceClass_All"
  
  # Geo-restriction
  restrictions {
    geo_restriction {
      restriction_type = var.geo_restrictions.restriction_type
      locations        = var.geo_restrictions.locations
    }
  }
  
  # Default cache behavior (S3 origin)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3"
    
    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = var.ttl_settings.min_ttl
    default_ttl            = var.ttl_settings.default_ttl
    max_ttl                = var.ttl_settings.max_ttl
    compress               = true
    
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge_request.qualified_arn
      include_body = false
    }
  }
  
  # Additional cache behavior for API requests (ALB origin)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB"
    
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }
  
  # Cache behavior for video content
  ordered_cache_behavior {
    path_pattern     = "/videos/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3"
    
    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = var.ttl_settings.min_ttl
    default_ttl            = var.ttl_settings.default_ttl
    max_ttl                = var.ttl_settings.max_ttl
    compress               = true
  }
  
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  tags = {
    Name = "media-streaming-cdn"
  }
}

# Lambda@Edge for request routing and A/B testing
resource "aws_iam_role" "lambda_edge" {
  name = "lambda-edge-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_edge" {
  name = "lambda-edge-policy"
  role = aws_iam_role.lambda_edge.id
  
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
      }
    ]
  })
}

# Lambda@Edge function for request routing
data "archive_file" "edge_request" {
  type        = "zip"
  output_path = "${path.module}/lambda_edge_request.zip"
  source {
    content  = templatefile("${path.module}/edge_request.js", {})
    filename = "index.js"
  }
}

resource "aws_lambda_function" "edge_request" {
  filename      = data.archive_file.edge_request.output_path
  function_name = "edge-request-router"
  role          = aws_iam_role.lambda_edge.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  publish       = true
  
  lifecycle {
    ignore_changes = [filename]
  }
}

# Route53 configuration removed - no domain available for this deployment
# To enable Route53:
# 1. Register a domain or use an existing hosted zone
# 2. Uncomment the resources below and provide hosted_zone_id variable
# 3. Update content_delivery module call in main.tf with hosted_zone_id parameter

# resource "aws_route53_record" "main" {
#   zone_id = var.hosted_zone_id
#   name    = var.domain_name
#   type    = "A"
#   
#   alias {
#     name                   = aws_cloudfront_distribution.main.domain_name
#     zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
#     evaluate_target_health = false
#   }
# }

# resource "aws_route53_record" "regional" {
#   for_each = toset(var.regions)
#   
#   zone_id        = var.hosted_zone_id
#   name           = "regional-${each.key}.${var.domain_name}"
#   type           = "A"
#   set_identifier = each.key
#   
#   alias {
#     name                   = aws_cloudfront_distribution.main.domain_name
#     zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
#     evaluate_target_health = true
#   }
#   
#   latency_routing_policy {
#     region = each.key
#   }
# }