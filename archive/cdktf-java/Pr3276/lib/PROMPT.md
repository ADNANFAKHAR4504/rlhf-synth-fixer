Design a CI/CD pipeline on AWS using CDK for Terraform with Java that automates the build, test, and deployment of a web application with the following requirements:

The pipeline should use an S3 bucket as the source repository where source code is uploaded as a ZIP archive (source.zip). 
AWS CodePipeline should orchestrate the entire workflow and can be manually triggered or triggered via S3 events when new source archives are uploaded.
CodeBuild should handle application builds using inline buildspec definitions embedded directly in the CDKTF infrastructure code. CodeDeploy should manage deployments, and S3 should be used for storing artifacts with KMS encryption enabled.
IAM roles must follow the principle of least privilege, and CloudWatch should capture logs for all pipeline stages. 
The pipeline should deploy first to a staging environment in the us-west-2 region and only proceed to production in the us-east-1 region after a manual approval step.
Both frontend and backend components should be built and deployed independently with separate CodeBuild projects and deployment configurations. 
The buildspec definitions for both components should be defined as inline specifications within the CDKTF Java code, not as external files.
SNS notifications should be sent if builds fail, with EventBridge rules monitoring CodeBuild and CodePipeline state changes.