Hey there! I'm working on setting up a CI/CD pipeline for our project and could really use your help with the AWS CDK implementation.

## What I'm Looking For

I need to build a **CI/CD pipeline using AWS CodePipeline** with TypeScript CDK. The setup should be pretty straightforward - just two files:

1. `main.ts` - the entry point that kicks everything off
2. `cicd-stack.ts` - where all the infrastructure magic happens

## The Big Picture

We're running this across multiple AWS regions (us-east-1 and us-west-2), so I need to make sure everything works smoothly in both places. The pipeline should connect GitHub as our source, run builds with CodeBuild, have a manual approval step, and then deploy via CloudFormation.

## What I Need

Here's what the pipeline should do:

- **GitHub Integration**: Pull code from our GitHub repo (we'll handle the webhook setup separately)
- **Build Process**: Use CodeBuild to run tests and build our app
- **Manual Approval**: Someone needs to sign off before we deploy to production
- **CloudFormation Deploy**: Deploy the actual infrastructure
- **Multi-region**: Work in both us-east-1 and us-west-2
- **Security**: Keep everything locked down with proper IAM roles and KMS encryption
- **Monitoring**: Send notifications when things go wrong and keep logs in CloudWatch
- **Cost Control**: Don't break the bank - optimize where we can

## Specific Requirements

1. **GitHub Source**: Connect to our repo and trigger on main branch pushes
2. **CodeBuild**: Run our buildspec tests and make sure they pass
3. **Manual Approval**: Add a gate between build and deploy
4. **CloudFormation**: Deploy our stack with proper rollback if things fail
5. **IAM Roles**: Keep permissions tight - only what's needed
6. **Logging**: Stream everything to CloudWatch Logs
7. **Tagging**: Tag all resources for cost tracking and compliance
8. **SSM Parameters**: Store sensitive config securely
9. **Multi-region**: Use StackSets for cross-region deployment
10. **S3 Encryption**: Encrypt artifacts bucket with KMS
11. **SNS Alerts**: Notify us when pipelines fail
12. **Build Caching**: Speed up builds with CodeBuild caching
13. **Concurrency Limits**: Don't overwhelm the system
14. **CloudWatch Alarms**: Monitor key pipeline metrics
15. **Cost Optimization**: Be smart about resource usage

## What I'm Expecting

- Two clean TypeScript files that actually work
- AWS CDK v2 syntax (using aws-cdk-lib)
- Logical flow: GitHub → Build → Approval → Deploy
- Good naming conventions and comments
- Proper error handling and rollback
- All resources tagged appropriately
- IAM roles defined inline with minimal permissions

## Environment Details

- **Regions**: us-east-1, us-west-2
- **Naming**: kebab-case for all resources
- **VPCs**: Already exist, so don't worry about networking
- **Tags**: Need project, env, owner tags on everything

This is for a production environment, so please make sure it's robust and follows AWS best practices. I'll handle the GitHub webhook configuration and any additional setup once I have the CDK code.

Thanks for your help! Let me know if you need any clarification on the requirements.