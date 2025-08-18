I need to create a robust CI/CD pipeline that can deploy applications to multiple AWS regions using AWS CDK with TypeScript. The pipeline should use AWS CodePipeline as the orchestration engine and AWS CodeBuild for build actions.

The deployment needs to work in both us-east-1 and eu-central-1 regions. I want to use the latest CodePipeline V2 pipeline type with parameterized pipelines for better flexibility and cost optimization.

The solution must include proper resource tagging for cost allocation and management following AWS best practices. All resources should be tagged appropriately to help with billing and resource management.

Please provide the infrastructure code using AWS CDK TypeScript stacks. The code should create a complete CI/CD pipeline that can deploy applications across multiple regions. Make sure to include separate code files for different components like the pipeline stack and any supporting constructs.

Each code file should be in its own code block so I can easily copy and implement them.