# Model Failures

## Example Failure 1

**Description:** EC2 instance failed to launch due to invalid AMI ID.
**Error:** `InvalidAMIID.NotFound: The image id '[ami-xxxxxxx]' does not exist`

## Example Failure 2

**Description:** S3 bucket policy denied access to EC2 role for log uploads.
**Error:** `AccessDenied: User: arn:aws:iam::... is not authorized to perform: s3:PutObject`

## Example Failure 3

**Description:** Network ACL blocks inbound HTTP/HTTPS traffic to web server.
**Error:** `Connection timed out` or `Site cannot be reached`

## Example Failure 4

**Description:** Public IP or DNS not assigned to EC2 instance.
**Error:** Output for `web-server-public-ip` or `web-server-public-dns` is empty or missing.

## Example Failure 5

**Description:** S3 bucket is publicly accessible.
**Error:** Security scan flags bucket as public.

## Example Failure 6

**Description:** Outputs missing or incorrect after deployment.
**Error:** Terraform outputs do not match expected resource IDs or URLs.