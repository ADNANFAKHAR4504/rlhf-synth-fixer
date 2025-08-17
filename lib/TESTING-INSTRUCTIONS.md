# CI/CD Pipeline Testing Instructions

## Prerequisites

1. **GitHub Repository**: Ensure you have a GitHub repository with your application code
2. **CodeStar Connection**: Create a CodeStar connection to GitHub in the AWS Console
3. **AWS CLI**: Configured with appropriate permissions

## Deployment Steps

1. **Deploy the CloudFormation Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name my-cicd-pipeline \
     --template-body file://cicd-pipeline.yml \
     --parameters \
       ParameterKey=ProjectName,ParameterValue=my-app \
       ParameterKey=Environment,ParameterValue=dev \
       ParameterKey=CodeStarConnectionArn,ParameterValue=arn:aws:codestar-connections:us-east-1:123456789012:connection/your-connection-id \
       ParameterKey=GitHubOwner,ParameterValue=your-github-username \
       ParameterKey=GitHubRepo,ParameterValue=your-repo-name \
       ParameterKey=GitHubBranch,ParameterValue=main \
       ParameterKey=NotificationEmail,ParameterValue=your-email@example.com \
       ParameterKey=SecretValue,ParameterValue=your-secret-value \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

2. **Confirm SNS Subscription**: Check your email and confirm the SNS subscription for approval notifications

## Testing the Pipeline

### 1. Initiate a Pipeline Run

**Method 1: GitHub Push**
- Make a code change in your GitHub repository
- Commit and push to the specified branch (e.g., `main`)
- The pipeline will automatically trigger due to the webhook configuration

**Method 2: Manual Trigger**
- Go to AWS CodePipeline console
- Find your pipeline: `my-app-dev-pipeline`
- Click "Release change" to manually start the pipeline

### 2. Monitor the Build Stage

1. **Navigate to CodePipeline Console**:
   - Go to AWS Console → CodePipeline
   - Click on your pipeline name

2. **Monitor Build Progress**:
   - Watch the "Build" stage status
   - Click "Details" to view CodeBuild logs
   - Monitor CloudWatch Logs at `/aws/codebuild/my-app-dev`

3. **Verify Build Artifacts**:
   - Check the artifacts S3 bucket: `my-app-dev-artifacts-{account-id}`
   - Confirm build outputs are stored correctly

### 3. Handle Manual Approval Stage

1. **Receive Notification**:
   - Check your email for approval notification
   - Email will contain pipeline details and approval link

2. **Approve the Deployment**:
   - Click the approval link in the email, OR
   - Go to CodePipeline console
   - Click "Review" on the approval stage
   - Add comments if needed
   - Click "Approve" or "Reject"

### 4. Verify Deployment

1. **Check Deployment Bucket**:
   - Navigate to S3 console
   - Open bucket: `my-app-dev-deployment-{account-id}`
   - Verify your application artifacts are deployed
   - Check versioning is working (multiple versions if you've run pipeline multiple times)

2. **Verify Encryption**:
   - Check bucket properties to confirm KMS encryption is enabled
   - Verify lifecycle policies are applied

## Monitoring and Troubleshooting

### CloudWatch Logs
- **CodeBuild Logs**: `/aws/codebuild/my-app-dev`
- **CodePipeline Events**: Check CloudTrail for pipeline events

### Common Issues

1. **Build Failures**:
   - Check CodeBuild logs for specific error messages
   - Verify buildspec.yml syntax
   - Ensure all dependencies are properly defined

2. **Permission Issues**:
   - Verify IAM roles have necessary permissions
   - Check KMS key policies for encryption/decryption access

3. **GitHub Connection Issues**:
   - Verify CodeStar connection is active
   - Check repository permissions
   - Ensure branch name is correct

### Security Verification

1. **Secrets Manager**:
   - Verify secret is encrypted with KMS
   - Test secret retrieval in CodeBuild (check logs for successful access)

2. **S3 Bucket Security**:
   - Confirm public access is blocked
   - Verify encryption is enabled
   - Check lifecycle policies are active

3. **IAM Roles**:
   - Review role permissions follow least privilege principle
   - Verify cross-service access is properly configured

## Cleanup

To remove all resources:
```bash
aws cloudformation delete-stack --stack-name my-cicd-pipeline --region us-east-1
```

**Note**: You may need to empty S3 buckets manually before stack deletion if they contain objects.