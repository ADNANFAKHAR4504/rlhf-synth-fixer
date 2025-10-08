# Static Website Hosting - S3 Terraform Configuration

## Role
You are an expert Terraform and AWS infrastructure specialist.

## Goal
Create a Terraform configuration to deploy an S3 bucket for hosting static website content for a digital media company's new product launch page.

## Background
A digital media company needs to store and serve static website assets for their new product launch page. The assets include HTML files, CSS stylesheets, JavaScript code, and image files that must be publicly accessible with proper caching and versioning.

## Requirements

### Core Infrastructure
1. **S3 Bucket Creation**
   - Create an S3 bucket with a unique name containing the prefix `media-assets-` followed by a random suffix
   - The random suffix must be exactly 8 characters long using terraform `random_string` resource

2. **Static Website Hosting**
   - Enable static website hosting with `index.html` as the index document
   - Set `error.html` as the error document

3. **Versioning & Storage Management**
   - Configure bucket versioning to track changes to all objects
   - Create a lifecycle rule that transitions objects older than 30 days to S3 Standard-IA storage class
   - Lifecycle rules must not delete any objects, only transition storage classes

4. **Security & Access Control**
   - Set up a bucket policy that allows public read access to all objects in the bucket
   - The bucket policy must use the bucket ARN reference, not hardcoded values
   - Enable server-side encryption using AWS managed keys (SSE-S3)

5. **CORS Configuration**
   - Configure CORS rules to allow GET requests from any origin
   - Set max age of 3600 seconds
   - CORS configuration must explicitly set allowed headers to `Content-Type` and `Authorization`

6. **Tagging & Cost Management**
   - Add cost allocation tags including:
     - `Environment='production'`
     - `Project='media-launch'`

### Technical Constraints
- **AWS Provider**: Must use AWS provider version `~> 5.0`
- **Region**: All resources must be created in the `us-west-2` region
- **Naming**: Bucket name must be globally unique and follow S3 naming conventions
- **File Structure**: All configuration must be in a single `main.tf` file

### Required Outputs
The configuration must output:
1. **Bucket name** - for pipeline integration
2. **Website endpoint URL** - for DNS configuration
3. **Bucket ARN** - for cross-service references

## Deliverable
- **One complete Terraform configuration** (`main.tf`)
- Must be deployable without modification
- Include clear comments for each resource section
- Follow Terraform best practices for resource naming and organization

## Output Format
Return only the complete Terraform HCL configuration with no additional text. Configuration must be production-ready, syntactically correct, and deployable as-is for integration with the company's deployment pipeline.
