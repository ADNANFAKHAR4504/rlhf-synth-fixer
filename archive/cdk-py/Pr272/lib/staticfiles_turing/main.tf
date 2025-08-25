#---------------------------------------------------
# USING ROUTE 53 AS ACCES POINT
#---------------------------------------------------

# Set backend state for Terraform
# terraform {
#   backend "s3" {
#     bucket         = "privatebucketturingblacree"
#     key            = "terraform.tfstate" # Path to state file in bucket
#     region         = "us-east-1"
#     encrypt        = true
#   }
# }

# variable "subdomain_to_use" {
#   default = "blacree.turing.com" # Replace with your desired subdomain
# }


# data "aws_caller_identity" "current" {}
# data "aws_region" "name" {}

# output "aws_caller_identity" {
#   value = data.aws_caller_identity.current.arn
# } 

# # S3 Bucket
# resource "aws_s3_bucket" "staticfilesbucket" {
#   bucket = "turingstaticfilebucketblacree"

#   tags = {
#     Name        = "Turing Static Files Bucket"
#     Environment = "Production"
#   }
# }

# # Enforce bucket ownership and disable ACLs (BucketOwnerEnforced replaces acl)
# resource "aws_s3_bucket_ownership_controls" "staticfilesbucket_controls" {
#   bucket = aws_s3_bucket.staticfilesbucket.id

#   rule {
#     object_ownership = "BucketOwnerEnforced"
#   }
# }

# # Block all forms of public access (best practice)
# resource "aws_s3_bucket_public_access_block" "staticfilesbucket_block" {
#   bucket = aws_s3_bucket.staticfilesbucket.id

#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# resource "aws_s3_bucket_versioning" "staticfilesbucket_versioning" {
#   bucket = aws_s3_bucket.staticfilesbucket.id

#   versioning_configuration {
#     status = "Disabled" # 
#   }
# }

# # Upload the index.html file to the S3 bucket
# resource "aws_s3_object" "index_html" {
#   bucket = aws_s3_bucket.staticfilesbucket.id
#   key    = "index.html"              # Object name in the bucket
#   source = "${path.module}/index.html" # Local file path
#   etag   = filemd5("${path.module}/index.html") # Forces update when file changes
#   content_type = "text/html"
# }



# # -------------------------------------
# # ROUTE53 AND CERTIFICATE CONFIGURATION
# # -------------------------------------


# # Configure all route53 records for the domain
# # Get the Route53 hosted zone for the domain
# data "aws_route53_zone" "selected" {
#   name         = "blacree.com"  # Replace with your domain
#   private_zone = false
# }

# # 2. Create the ACM certificate
# resource "aws_acm_certificate" "cert" {
#   domain_name       = var.subdomain_to_use                # Replace with your domain
#   validation_method = "DNS"

#   tags = {
#     Name = "turing-cert-blacree"
#   }

#   lifecycle {
#     create_before_destroy = true
#   }
# }

# # 3. Create the Route53 validation record(s)
# resource "aws_route53_record" "cert_validation" {
#   for_each = {
#     for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }

#   zone_id = data.aws_route53_zone.selected.zone_id
#   name    = each.value.name
#   type    = each.value.type
#   ttl     = 60
#   records = [each.value.record]
# }

# # 4. Validate the ACM certificate (waits until DNS is propagated)
# resource "aws_acm_certificate_validation" "cert" {
#   certificate_arn         = aws_acm_certificate.cert.arn
#   validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
# }




# # -----------------------
# # CLOUDFRONT DISTRIBUTION
# # -----------------------


# # 1. Create the Origin Access Identity
# resource "aws_cloudfront_origin_access_identity" "turingblacree_oai" {
#   comment = "OAI for Turing CloudFront distribution"
# }

# resource "aws_cloudfront_distribution" "turing_distribution" {
#   enabled             = true
#   price_class         = "PriceClass_All"
#   default_root_object = "index.html"
#   is_ipv6_enabled     = true
#   http_version        = "http2"

#   aliases = [
#     var.subdomain_to_use
#   ]

#   origin {
#     domain_name = "${aws_s3_bucket.staticfilesbucket.bucket}.s3.${data.aws_region.name.region}.amazonaws.com"
#     origin_id   = "blacreeturing"

#     s3_origin_config {
#       origin_access_identity = aws_cloudfront_origin_access_identity.turingblacree_oai.cloudfront_access_identity_path
#     }
#   }

#   default_cache_behavior {
#     target_origin_id       = "blacreeturing"
#     viewer_protocol_policy = "redirect-to-https"

#     allowed_methods = [
#       "GET",
#       "HEAD"
#     ]

#     cached_methods = [
#       "GET",
#       "HEAD"
#     ]

#     forwarded_values {
#       query_string = false

#       cookies {
#         forward = "none"
#       }
#     }

#     compress    = true
#     min_ttl     = 120
#     default_ttl = 120
#     max_ttl     = 120
#   }

#   restrictions {
#     geo_restriction {
#       restriction_type = "none"
#     }
#   }

#   viewer_certificate {
#     acm_certificate_arn            = aws_acm_certificate.cert.arn
#     ssl_support_method              = "sni-only"
#     minimum_protocol_version        = "TLSv1.2_2021"
#     cloudfront_default_certificate  = false
#   }
# }


# resource "aws_s3_bucket_policy" "staticfilesbucket_policy" {
#   bucket = aws_s3_bucket.staticfilesbucket.id

#   policy = jsonencode({
#     Version = "2008-10-17",
#     Id      = "PolicyForCloudFrontPrivateContent",
#     Statement = [
#       {
#         Sid    = "AllowCloudfrontOAI"
#         Effect = "Allow"
#         Principal = {
#           AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.turingblacree_oai.id}"
#         }
#         Action   = "s3:GetObject"
#         Resource = "${aws_s3_bucket.staticfilesbucket.arn}/*"
#       }
#     ]
#   })

#   depends_on = [ aws_cloudfront_distribution.turing_distribution ]
# }


# # Create subdomain for cloudfront distribution
# resource "aws_route53_record" "alias_to_cloudfront" {
#   zone_id = data.aws_route53_zone.selected.zone_id
#   name    = var.subdomain_to_use      # Root domain or subdomain
#   type    = "A"

#   alias {
#     name                   = aws_cloudfront_distribution.turing_distribution.domain_name
#     zone_id                = aws_cloudfront_distribution.turing_distribution.hosted_zone_id
#     evaluate_target_health = false
#   }
# }





#---------------------------------------------------
# USING CLOUDFRONT AS ACCESS POINT (STUCK TO CLOUDFRONT FOR TASK BECAUSE NO PUBLIC DOMAIN TO FULFILL REQUIREMENT. DISCUSSED WITH PRANAV)
#---------------------------------------------------

terraform {
  backend "s3" {
    bucket  = "piplinebucketturingtask"
    key     = "terraform.tfstate" # Path to state file in bucket
    region  = "us-east-1"
    encrypt = true
  }
}


data "aws_caller_identity" "current" {}
data "aws_region" "name" {}

output "aws_caller_identity" {
  value = data.aws_caller_identity.current.arn
}

# S3 Bucket
resource "aws_s3_bucket" "staticfilesbucket" {
  bucket = "turingstaticfilebucketblacree"

  tags = {
    Name        = "Turing Static Files Bucket"
    Environment = "Production"
  }
}

# Enforce bucket ownership and disable ACLs (BucketOwnerEnforced replaces acl)
resource "aws_s3_bucket_ownership_controls" "staticfilesbucket_controls" {
  bucket = aws_s3_bucket.staticfilesbucket.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Block all forms of public access (best practice)
resource "aws_s3_bucket_public_access_block" "staticfilesbucket_block" {
  bucket = aws_s3_bucket.staticfilesbucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "staticfilesbucket_versioning" {
  bucket = aws_s3_bucket.staticfilesbucket.id

  versioning_configuration {
    status = "Enabled" # 
  }
}

# Upload the index.html file to the S3 bucket
resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.staticfilesbucket.id
  key          = "index.html"                         # Object name in the bucket
  source       = "${path.module}/index.html"          # Local file path
  etag         = filemd5("${path.module}/index.html") # Forces update when file changes
  content_type = "text/html"
}


# -----------------------
# CLOUDFRONT DISTRIBUTION
# -----------------------


# 1. Create the Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "turingblacree_oai" {
  comment = "OAI for Turing CloudFront distribution"
}

resource "aws_cloudfront_distribution" "turing_distribution" {
  enabled             = true
  price_class         = "PriceClass_All"
  default_root_object = "index.html"
  is_ipv6_enabled     = true
  http_version        = "http2"

  origin {
    domain_name = "${aws_s3_bucket.staticfilesbucket.bucket}.s3.${data.aws_region.name.region}.amazonaws.com"
    origin_id   = "blacreeturing"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.turingblacree_oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    target_origin_id       = "blacreeturing"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = [
      "GET",
      "HEAD"
    ]

    cached_methods = [
      "GET",
      "HEAD"
    ]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    compress    = true
    min_ttl     = 120
    default_ttl = 120
    max_ttl     = 120
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = false
  }
}


resource "aws_s3_bucket_policy" "staticfilesbucket_policy" {
  bucket = aws_s3_bucket.staticfilesbucket.id

  policy = jsonencode({
    Version = "2008-10-17",
    Id      = "PolicyForCloudFrontPrivateContent",
    Statement = [
      {
        Sid    = "AllowCloudfrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.turingblacree_oai.id}"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.staticfilesbucket.arn}/*"
      }
    ]
  })

  depends_on = [aws_cloudfront_distribution.turing_distribution]
}

# -----------------------
# CLOUDFRONT DISTRIBUTION
# -----------------------

resource "aws_backup_vault" "s3_backup_vault" {
  name = "s3-backup-vault"
  tags = {
    Purpose = "S3 Backup Vault"
  }
}

resource "aws_backup_plan" "s3_backup_plan" {
  name = "s3-daily-backup-plan-blacree"

  rule {
    rule_name         = "daily-s3-backup"
    target_vault_name = aws_backup_vault.s3_backup_vault.name
    schedule          = "cron(0 5 * * ? *)" # Daily at 5 AM UTC

    lifecycle {
      delete_after = 30
    }
  }
}

resource "aws_iam_role" "backup_role" {
  name = "AWSBackupRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backup_policy_attach" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForS3Backup"
}

resource "aws_backup_selection" "s3_selection" {
  name         = "s3-backup-selection"
  plan_id      = aws_backup_plan.s3_backup_plan.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_s3_bucket.staticfilesbucket.arn
  ]
}


# Save the CloudFront domain name to a local file
resource "local_file" "cloudfront_domain_file" {
  content  = aws_cloudfront_distribution.turing_distribution.domain_name
  filename = "cloudfront_domain.txt"
}


resource "aws_s3_object" "upload_cloudfront_domain" {
  bucket = aws_s3_bucket.staticfilesbucket.bucket
  key    = "cloudfront_domain.txt"
  source = local_file.cloudfront_domain_file.filename
  etag   = filemd5(local_file.cloudfront_domain_file.filename)
}