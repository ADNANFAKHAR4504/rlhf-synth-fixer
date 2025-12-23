# lib/components/frontend.py

import pulumi
import pulumi_aws as aws
import json

"""
Frontend Infrastructure Component
Creates S3 bucket, CloudFront distribution, and related resources
"""

class FrontendInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, tags: dict, opts=None):
    super().__init__("custom:frontend:Infrastructure", name, None, opts)

    # S3 bucket for static website content
    self.bucket = aws.s3.Bucket(
      f"{name}-website",
      website=aws.s3.BucketWebsiteArgs(
        index_document="index.html",
        error_document="error.html"
      ),
      acl="private",
      tags={**tags, "Name": f"{name}-website"},
      opts=pulumi.ResourceOptions(parent=self, retain_on_delete=False)
    )

    # Block public access to the S3 bucket
    aws.s3.BucketPublicAccessBlock(
      f"{name}-website-pab",
      bucket=self.bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Origin Access Control for CloudFront to access S3
    self.oac = aws.cloudfront.OriginAccessControl(
      f"{name}-oac",
      name=f"{name}-oac",
      description="OAC for S3 bucket access",
      origin_access_control_origin_type="s3",
      signing_behavior="always",
      signing_protocol="sigv4",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # CloudFront distribution with S3 origin
    self.cloudfront_distribution = aws.cloudfront.Distribution(
      f"{name}-distribution",
      origins=[
        aws.cloudfront.DistributionOriginArgs(
          domain_name=self.bucket.bucket_domain_name,
          origin_id=f"{name}-s3-origin",
          origin_access_control_id=self.oac.id,
        )
      ],
      enabled=True,
      is_ipv6_enabled=True,
      default_root_object="index.html",
      default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
        allowed_methods=["GET", "HEAD", "OPTIONS"],
        cached_methods=["GET", "HEAD"],
        target_origin_id=f"{name}-s3-origin",
        compress=True,
        viewer_protocol_policy="redirect-to-https",
        forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
          query_string=False,
          cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
            forward="none"
          ),
        ),
        min_ttl=0,
        default_ttl=3600,
        max_ttl=86400,
      ),
      custom_error_responses=[
        aws.cloudfront.DistributionCustomErrorResponseArgs(
          error_code=404,
          response_code=200,
          response_page_path="/index.html",
          error_caching_min_ttl=300,
        ),
        aws.cloudfront.DistributionCustomErrorResponseArgs(
          error_code=403,
          response_code=200,
          response_page_path="/index.html",
          error_caching_min_ttl=300,
        )
      ],
      restrictions=aws.cloudfront.DistributionRestrictionsArgs(
        geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
          restriction_type="none",
        ),
      ),
      viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
        cloudfront_default_certificate=True,
      ),
      price_class="PriceClass_100",
      tags={**tags, "Name": f"{name}-distribution"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    # S3 bucket policy to allow CloudFront access
    bucket_policy = pulumi.Output.all(
      self.bucket.arn,
      self.cloudfront_distribution.arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AllowCloudFrontServicePrincipal",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudfront.amazonaws.com"
          },
          "Action": "s3:GetObject",
          "Resource": f"{args[0]}/*",
          "Condition": {
            "StringEquals": {
              "AWS:SourceArn": args[1]
            }
          }
        }
      ]
    }))

    aws.s3.BucketPolicy(
      f"{name}-bucket-policy",
      bucket=self.bucket.id,
      policy=bucket_policy,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self._upload_sample_files(name)

    self.register_outputs({
      "bucket_name": self.bucket.id,
      "cloudfront_domain": self.cloudfront_distribution.domain_name,
      "cloudfront_distribution_id": self.cloudfront_distribution.id
    })

  def _upload_sample_files(self, name: str):
    """Upload sample HTML, CSS, and JS files"""

    index_html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Tier Web Application</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Multi-Tier Web Application</h1>
    <p>This is a sample frontend for the multi-tier web application.</p>
    <div id="api-test">
      <button onclick="testAPI()">Test Backend API</button>
      <div id="api-result"></div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>"""

    aws.s3.BucketObject(
      f"{name}-index-html",
      bucket=self.bucket.id,
      key="index.html",
      content=index_html,
      content_type="text/html",
      opts=pulumi.ResourceOptions(parent=self)
    )

    css_content = """
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  text-align: center;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0056b3;
}

#api-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 50px;
}
"""

    aws.s3.BucketObject(
      f"{name}-css",
      bucket=self.bucket.id,
      key="styles.css",
      content=css_content,
      content_type="text/css",
      opts=pulumi.ResourceOptions(parent=self)
    )

    js_content = """
async function testAPI() {
  const resultDiv = document.getElementById('api-result');
  resultDiv.innerHTML = 'Testing API...';

  try {
    // Placeholder for API testing
    const response = await fetch('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      resultDiv.innerHTML = `<strong>API Response:</strong> ${JSON.stringify(data, null, 2)}`;
    } else {
      resultDiv.innerHTML = `<strong>Error:</strong> ${response.status} - ${response.statusText}`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
  }
}
"""

    aws.s3.BucketObject(
      f"{name}-js",
      bucket=self.bucket.id,
      key="app.js",
      content=js_content,
      content_type="application/javascript",
      opts=pulumi.ResourceOptions(parent=self)
    )

    error_html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go back to home</a>
  </div>
</body>
</html>"""

    aws.s3.BucketObject(
      f"{name}-error-html",
      bucket=self.bucket.id,
      key="error.html",
      content=error_html,
      content_type="text/html",
      opts=pulumi.ResourceOptions(parent=self)
    )


