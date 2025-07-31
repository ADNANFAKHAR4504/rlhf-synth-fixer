Below is a complete AWS CDK Python project and Terraform staticwebsite IAC that meets the requirements specified. The project includes the necessary constructs for the CI/CD pipeline, IAM roles, and other resources.

# Pipeline CDK stack
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_s3_deployment as s3_deploy,
    aws_iam as iam,
    aws_logs as logs,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as cp_actions,
    aws_codebuild as codebuild,
    RemovalPolicy,
)
import os
from constructs import Construct
import zipfile

def zip_directory_contents(source_dir: str, output_zip: str):
    """
    Zip all contents (files & subfolders) inside `source_dir` into `output_zip`
    without including the top-level folder itself.
    """
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                # Skip hidden files if necessary
                if file.startswith('.'):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

class CicdPipelineStack(Stack):
  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    _ = props

    # Static site and Artifact bucket
    bucket = s3.Bucket(
        self,
        "ArtifactBucket",
        bucket_name="privatebucketturingblacree",
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        versioned=True,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )


    # 2. Define static file path and zip path for pipeline files
    static_folder = os.path.join(os.getcwd(), "lib/staticfiles_turing")
    zip_file = os.path.join(os.getcwd(), "lib/pipeline_zip_file/pipelinefiles_turing.zip")

    # 3. Create the zip (only contents)
    zip_directory_contents(static_folder, zip_file)

    # Uplaod pipeline zip file to s3 bucket
    s3_deploy.BucketDeployment(
        self,
        "UploadZipFile",
        sources=[s3_deploy.Source.asset("lib/pipeline_zip_file")],
        destination_bucket=bucket,
        retain_on_delete=False
    )

    # Add a bucket policy that grants any CodePipeline in this account full access
    # Allow CodePipeline and CodeBuild full access (scoped to your account)
    for service in ["codepipeline.amazonaws.com", "codebuild.amazonaws.com"]:
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal(service)],
                actions=["s3:*"],
                resources=[
                    bucket.bucket_arn,
                    f"{bucket.bucket_arn}/*"
                ],
                conditions={
                    "StringEquals": {"aws:PrincipalAccount": self.account}
                }
            )
        )


    # 3. IAM Roles (you can add policies manually later)
    codepipeline_role = iam.Role(
        self, "CodePipelineRole",
        assumed_by=iam.ServicePrincipal("codepipeline.amazonaws.com")
    )

    codepipeline_role.add_to_policy(
        iam.PolicyStatement(
            actions=[
                "s3:PutObject",
                "s3:ListObjects",
                "s3:GetObjectVersion",
                "s3:GetObject",
                "s3:GetBucketVersioning",
                "codebuild:StartBuild",
                "codebuild:BatchGetBuilds",
                "codebuild:ListBuilds",
                "codebuild:StopBuild",
                "codebuild:ListCuratedEnvironmentImages",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources=["*"]  # Can restrict to specific ARNs if desired
        )
    )

    codebuild_role = iam.Role(
        self, "CodeBuildRole",
        assumed_by=iam.ServicePrincipal("codebuild.amazonaws.com")
    )

    codebuild_role.add_managed_policy(
        iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess")
    )

    codebuild_role.add_managed_policy(
        iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsFullAccess")
    )

    codebuild_role.add_to_policy(
        iam.PolicyStatement(
            actions=[
                "cloudfront:*",
                "route53:*",
                "acm:*",
            ],
            resources=["*"]  # Can restrict to specific ARNs if desired
        )
    )

    log_group = logs.LogGroup(
        self,
        "TerraformApplyLogGroupTuring",
        log_group_name="terraform-apply-log-group-turing",
        retention=logs.RetentionDays.ONE_WEEK
    )

    # 4. CodeBuild Project
    codebuild_project = codebuild.PipelineProject(
        self,
        "TerraformBuildProject",
        project_name="cdkpythonturingproject",
        description="Terraform deploy execution",
        role=codebuild_role,
        environment=codebuild.BuildEnvironment(
            compute_type=codebuild.ComputeType.SMALL,
            build_image=codebuild.LinuxBuildImage.from_docker_registry("hashicorp/terraform:latest"),
            privileged=False
        ),
        logging=codebuild.LoggingOptions(
            cloud_watch=codebuild.CloudWatchLoggingOptions(
                log_group=log_group
            )
        ),
        build_spec=codebuild.BuildSpec.from_source_filename("terraform_apply.yml")
    )

    # 5. Pipeline Artifacts
    source_output = codepipeline.Artifact()

    # 6. CodePipeline
    pipeline = codepipeline.Pipeline(
        self,
        "TuringCodePipeline",
        pipeline_name="TuringCodePipelineTerraform",
        role=codepipeline_role,
        artifact_bucket=bucket
    )

    # 7. Source Stage (S3)
    source_action = cp_actions.S3SourceAction(
        action_name="s3-connection",
        bucket=bucket,
        bucket_key="pipelinefiles_turing.zip",  # replace with actual zip name
        output=source_output,
        trigger=cp_actions.S3Trigger.POLL # equivalent to PollForSourceChanges = true
    )

    pipeline.add_stage(stage_name="Source", actions=[source_action])

    # 8. Deploy Stage (CodeBuild)
    deploy_action = cp_actions.CodeBuildAction(
        action_name="Terraform-Deploy",
        project=codebuild_project,
        input=source_output
    )

    pipeline.add_stage(stage_name="Deploy", actions=[deploy_action])





# Terraform application deploy IAC:
# Set backend state for Terraform
terraform {
  backend "s3" {
    bucket         = "privatebucketturingblacree"
    key            = "terraform.tfstate" # Path to state file in bucket
    region         = "us-east-1"
    encrypt        = true
  }
}

variable "subdomain_to_use" {
  default = "turing.blacree.com" # Replace with your desired subdomain
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
    status = "Disabled" # 
  }
}

# Upload the index.html file to the S3 bucket
resource "aws_s3_object" "index_html" {
  bucket = aws_s3_bucket.staticfilesbucket.id
  key    = "index.html"              # Object name in the bucket
  source = "${path.module}/index.html" # Local file path
  etag   = filemd5("${path.module}/index.html") # Forces update when file changes
  content_type = "text/html"
}



# -------------------------------------
# ROUTE53 AND CERTIFICATE CONFIGURATION
# -------------------------------------


# Configure all route53 records for the domain
# Get the Route53 hosted zone for the domain
data "aws_route53_zone" "selected" {
  name         = "blacree.com"  # Replace with your domain
  private_zone = false
}

# 2. Create the ACM certificate
resource "aws_acm_certificate" "cert" {
  domain_name       = var.subdomain_to_use                # Replace with your domain
  validation_method = "DNS"

  tags = {
    Name = "turing-cert-blacree"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# 3. Create the Route53 validation record(s)
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.selected.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

# 4. Validate the ACM certificate (waits until DNS is propagated)
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
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

  aliases = [
    var.subdomain_to_use
  ]

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
    acm_certificate_arn            = aws_acm_certificate.cert.arn
    ssl_support_method              = "sni-only"
    minimum_protocol_version        = "TLSv1.2_2021"
    cloudfront_default_certificate  = false
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

  depends_on = [ aws_cloudfront_distribution.turing_distribution ]
}


# Create subdomain for cloudfront distribution
resource "aws_route53_record" "alias_to_cloudfront" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = var.subdomain_to_use      # Root domain or subdomain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.turing_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.turing_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}




# **AWS Static Website Deployment Documentation with Terraform**

## **Introduction**
This document provides comprehensive deployment instructions for provisioning a static website on AWS using **Terraform**. The infrastructure includes an **S3 bucket**, **CloudFront distribution**, **ACM certificate**, and **Route53 DNS records**. It is designed for production-ready environments and follows AWS best practices for state management, security, and automation.

---

## **Prerequisites**
Before starting, ensure the following:
1. **AWS Account:** You have an active AWS account with appropriate permissions.
2. **Terraform Installed:** Install Terraform (v1.x or later) on your workstation or ensure it is available in your CI/CD pipeline (AWS CodeBuild).
3. **Domain Registered in Route53:** The target domain must be managed in AWS Route53.
4. **IAM Role:** AWS CodeBuild will execute Terraform using an assigned IAM Role (detailed below).

---

## **Terraform Backend Setup**
Terraform requires a remote backend to store its state securely and enable collaboration. Storing state locally can lead to **state drift** and conflicts when multiple engineers work on the same infrastructure.

### **Why Remote Backend?**
- **Collaboration:** Multiple team members can work simultaneously.
- **State Locking:** Prevents concurrent changes.
- **Disaster Recovery:** State is securely stored and backed up.

### **Example Backend Configuration**
```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "prod/static-website/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-lock-table"
    encrypt        = true
  }
}
```

### **Steps:**
1. Create an S3 bucket for state storage.
2. Create a DynamoDB table for state locking (optional but recommended).

---

## **IAM Role Usage**
The **AWS CodeBuild project** will run Terraform commands using its **assigned IAM Role**.  
This IAM Role must include permissions for the following actions:
- **S3:** Create, update, and manage buckets and bucket policies.
- **CloudFront:** Create and manage CloudFront distributions.
- **ACM:** Request and validate certificates.
- **Route53:** Create and update DNS records and query hosted zone IDs.

### **Example IAM Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets",
        "route53:ListHostedZones",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets",
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:DeleteCertificate",
        "acm:ListCertificates",
        "cloudfront:CreateDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:ListDistributions",
        "s3:CreateBucket",
        "s3:PutBucketPolicy",
        "s3:GetBucketPolicy",
        "s3:PutBucketAcl",
        "s3:GetBucketAcl",
        "s3:DeleteBucket",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": "*"
    }
  ]
}
```
> **Note:** The IAM Role is assumed automatically by CodeBuild; you do not need to configure AWS credentials locally.

---

## **Resource Details**

### **1. S3 Bucket**
The S3 bucket hosts static files. Public access is blocked, and CloudFront is used as the distribution layer.

```hcl
resource "aws_s3_bucket" "static_site" {
  bucket = "my-static-site-bucket"
}

resource "aws_s3_bucket_public_access_block" "static_site_block" {
  bucket                  = aws_s3_bucket.static_site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

---

### **2. ACM Certificate**
An ACM certificate is required to enable HTTPS on the CloudFront distribution. It will be validated via Route53 DNS records.

```hcl
resource "aws_acm_certificate" "site_cert" {
  domain_name       = "www.example.com"
  validation_method = "DNS"
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.site_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = aws_route53_zone.primary.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}
```

---

### **3. CloudFront Distribution**
CloudFront delivers static content from the S3 bucket to users worldwide.

```hcl
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"
  origin {
    domain_name = aws_s3_bucket.static_site.bucket_regional_domain_name
    origin_id   = "s3-origin"
  }

  default_cache_behavior {
    target_origin_id       = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
  }

  viewer_certificate {
    acm_certificate_arn           = aws_acm_certificate.site_cert.arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}
```

---

### **4. Route53 Record**
Route53 creates an alias record mapping the custom domain to the CloudFront distribution.

```hcl
data "aws_route53_zone" "primary" {
  name         = "example.com"
  private_zone = false
}

resource "aws_route53_record" "alias" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = "www.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
```

---

## **How the Resources Work Together**
1. **Route53 validation records** allow ACM to issue a trusted HTTPS certificate.
2. **CloudFront** uses the ACM certificate and serves content from the S3 bucket.
3. **Route53 alias record** maps your domain to the CloudFront endpoint.

---

## **Deployment Steps**
1. **Configure Terraform Backend State**
   - Set up the backend as shown above.
2. **Set Variables**
   - Create a `.tfvars` file or set environment variables for your domain and bucket names.
3. **Initialize Terraform**
   ```bash
   terraform init
   ```
4. **Plan & Apply**
   ```bash
   terraform plan
   terraform apply
   ```
   > If using **AWS CodeBuild**, these commands are automatically run by the pipeline using the assigned IAM Role.

---

## **Verification**
1. Access the CloudFront distribution domain from the Terraform output.
2. Confirm the Route53 alias resolves correctly.
3. Ensure the ACM certificate enables **HTTPS** (you should see a padlock icon in the browser).
