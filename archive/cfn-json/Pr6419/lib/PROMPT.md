Hey team,

We have a situation with our transaction processing infrastructure that needs immediate attention. A financial services company has been running CloudFormation stacks across multiple AWS regions, and a recent audit uncovered some serious inefficiencies. The infrastructure is over-provisioned, costs are running 40% higher than they should be, and the IAM policies are too permissive. The current template is over 1500 lines of JSON and it's been deployed across us-east-1, eu-west-1, and ap-southeast-1.

The business wants us to refactor this entire setup without disrupting operations. They need the cost savings, better security posture, and improved maintainability, but we can't afford any downtime during the transition. I've been asked to create this solution using **CloudFormation with JSON** exclusively. The template needs to be multi-region capable so we can deploy the same codebase across all three regions.

The existing infrastructure handles financial transactions, so we're dealing with RDS databases, Lambda functions for processing, and DynamoDB for session management. Everything runs in a VPC with 10.0.0.0/16 CIDR split across three availability zones with both public and private subnets. The Lambda functions sit in private subnets and use NAT Gateways for outbound internet access.

## What we need to build

Create a refactored CloudFormation template using **CloudFormation with JSON** that optimizes the existing transaction processing infrastructure through systematic resource configuration improvements.

### Core Requirements

1. **RDS Right-Sizing**
   - Downsize RDS instance from db.r5.2xlarge to db.t3.large
   - Must preserve Multi-AZ deployment for high availability
   - Apply appropriate DeletionPolicy: Snapshot to prevent data loss

2. **Dynamic Region References**
   - Extract all hardcoded region-specific ARNs
   - Replace with Fn::Sub using ${AWS::Region} pseudo parameter
   - Template must work across us-east-1, eu-west-1, and ap-southeast-1

3. **IAM Policy Consolidation**
   - Create single IAM managed policy for Lambda execution
   - Replace three duplicate inline policies
   - Follow principle of least privilege

4. **Environment Conditional Logic**
   - Add Conditions section with IsProduction condition
   - Base condition on EnvironmentType parameter
   - Deploy RDS read replicas only in production environment

5. **Deletion and Update Policies**
   - Apply DeletionPolicy: Snapshot for RDS resources
   - Apply DeletionPolicy: Retain for DynamoDB tables
   - Add UpdateReplacePolicy for all resources supporting replacement

6. **Function Modernization**
   - Convert all Fn::Join operations to Fn::Sub
   - Minimum 10 conversions required throughout template
   - Improves readability and maintainability

7. **Lambda Parameterization**
   - Parameterize Lambda memory allocation
   - Allowed values: 512 MB, 1024 MB, or 2048 MB
   - Enable right-sizing per environment

8. **Multi-Region Validation**
   - Template must validate successfully in all three target regions
   - Test deployment in us-east-1, eu-west-1, and ap-southeast-1
   - Single template file works across all regions

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **RDS MySQL 8.0** for Multi-AZ database with right-sized instances
- Use **AWS Lambda** for transaction processing functions
- Use **DynamoDB** for session management tables
- Use **IAM** for consolidated managed policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix pattern
- Deploy to **ap-southeast-1** region as primary target
- All resources must be destroyable for CI/CD workflows
- Secrets should be fetched from existing AWS Secrets Manager entries

### Constraints

- Template must use JSON format exclusively, no YAML conversion
- Maintain Multi-AZ configuration while downsizing RDS
- No hardcoded region-specific values or ARNs
- Implement encryption at rest and in transit
- Enable appropriate logging and monitoring
- Infrastructure must support deployment to at least three different AWS regions
- Current template is 1500+ lines requiring systematic refactoring
- All resources must be fully destroyable except fetched secrets

## Success Criteria

- **Cost Reduction**: Infrastructure costs reduced by 40% through right-sizing
- **Maintainability**: Proper parameterization enables easy multi-region deployment
- **Security**: Consolidated IAM policies following least privilege principle
- **Reliability**: Appropriate deletion and update policies prevent data loss
- **Portability**: Single template deploys successfully across three regions
- **Resource Naming**: All resources include environmentSuffix for PR environment support
- **Code Quality**: Clean JSON, Fn::Sub instead of Fn::Join, well-documented
- **Modernization**: Minimum 10 Fn::Join to Fn::Sub conversions completed

## What to deliver

- Complete CloudFormation JSON template with all 10 optimizations implemented
- RDS MySQL 8.0 Multi-AZ configuration right-sized to db.t3.large
- Lambda functions with parameterized memory allocation
- DynamoDB tables with appropriate policies
- Consolidated IAM managed policy replacing inline policies
- Conditions section with IsProduction logic
- Dynamic region references using AWS::Region pseudo parameter
- Proper DeletionPolicy and UpdateReplacePolicy throughout
- Integration test support loading outputs from cfn-outputs/flat-outputs.json
- Documentation showing multi-region deployment capability
