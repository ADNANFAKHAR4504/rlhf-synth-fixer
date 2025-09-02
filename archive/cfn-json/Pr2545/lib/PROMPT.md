# CloudFormation Template Generation Prompt

## Task
Generate a complete CloudFormation template in JSON format for a secure static website hosting solution on AWS. The template must be production-ready and pass both `aws cloudformation validate-template` and actual stack deployment without errors.

## Architecture Requirements
Create a secure, scalable static website hosting infrastructure with the following components:

### Core Services
- **Amazon S3**: Primary static website hosting with versioning
- **CloudFront**: Global content delivery network
- **Route 53**: DNS management and traffic routing
- **ACM**: SSL/TLS certificate management
- **IAM**: Role-based access control
- **KMS**: Server-side encryption key management

### Security & Compliance Requirements
1. **S3 Configuration**:
   - Enable versioning on the bucket
   - Block all public access by default
   - Configure automatic HTTP to HTTPS redirection
   - Enable access logging to a separate logging bucket
   - Implement server-side encryption using AWS KMS

2. **IAM Security**:
   - Create roles and policies following least privilege principle
   - Separate roles for CloudFront access and administration
   - No hardcoded credentials or overly permissive policies

3. **CloudFront Setup**:
   - Use ACM certificate for HTTPS
   - Configure security headers
   - Implement proper origin access control
   - Set appropriate caching behaviors

4. **DNS & Routing**:
   - Route 53 hosted zone configuration
   - A and AAAA records pointing to CloudFront
   - Health checks if applicable

## Technical Specifications

### Naming Convention
Use the pattern: `{prefix}-{department}-{purpose}-{year}`
- Example: `myorg-web-staticsite-2024`

### Parameters to Include
```json
{
  "DomainName": "example.com",
  "EnvironmentName": "production",
  "OrganizationPrefix": "myorg",
  "Department": "web",
  "Purpose": "staticsite",
  "Year": "2024"
}
```

### Required Outputs
- S3 bucket name and website endpoint
- CloudFront distribution domain name
- Route 53 hosted zone ID
- ACM certificate ARN
- KMS key ID

## Implementation Guidelines

### Resource Organization
Structure the template with clear sections:
1. Parameters
2. Metadata
3. Resources (grouped by service)
4. Outputs

### Error Prevention
- Include all required dependencies between resources
- Use proper Ref and GetAtt functions
- Ensure CloudFront can access S3 through Origin Access Control
- Validate all resource naming follows AWS conventions

### Best Practices
- Include meaningful descriptions for all resources
- Use AWS-managed policies where appropriate
- Implement proper resource tagging
- Add DeletionPolicy for critical resources
- Include CloudFormation stack notifications

## Expected Deliverable
Provide a complete, valid JSON CloudFormation template that:
- Creates all specified AWS resources
- Passes CloudFormation validation
- Deploys successfully without manual intervention
- Follows AWS Well-Architected Framework principles
- Includes comprehensive resource documentation

## Sample Resource Structure
The template should include (but not be limited to):
- AWS::S3::Bucket (main website bucket)
- AWS::S3::Bucket (access logging bucket)
- AWS::KMS::Key (encryption key)
- AWS::IAM::Role (CloudFront access role)
- AWS::IAM::Policy (least privilege policies)
- AWS::CloudFront::Distribution
- AWS::CloudFront::OriginAccessControl
- AWS::CertificateManager::Certificate
- AWS::Route53::HostedZone
- AWS::Route53::RecordSet

## Validation Requirements
The final template must:
- Be syntactically correct JSON
- Pass `aws cloudformation validate-template`
- Deploy without errors in us-east-1 region
- Create a functional static website accessible via HTTPS
- Meet all security requirements listed above

Please generate the complete CloudFormation JSON template with detailed comments explaining each resource's purpose and configuration.