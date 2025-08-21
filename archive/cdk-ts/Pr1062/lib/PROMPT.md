I need help setting up a multi-region CI/CD pipeline on AWS that can deploy applications across both us-east-1 and us-west-2 regions. 

The requirements are:
- Set up AWS CodePipeline to automate build and deployment processes
- Use AWS CodeBuild with batch builds for efficient building
- Deploy applications to both us-east-1 and us-west-2 regions
- Include automated rollback mechanism for deployment failures
- Use latest CodeBuild features like reserved capacity for batch builds
- Implement cross-region deployment with proper IAM permissions
- Add monitoring and logging across both regions

Please provide infrastructure code that creates:
1. A CodePipeline with multi-region deployment stages
2. CodeBuild project configured for application builds
3. Cross-region IAM roles and policies
4. Automated rollback capabilities
5. Application deployment resources in both regions

Make sure to use AWS native EC2 deployment support for CodePipeline and batch builds with reserved capacity where appropriate.