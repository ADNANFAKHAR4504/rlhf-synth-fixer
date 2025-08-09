You are a senior Pulumi and Python infrastructure engineer. Your task is to design and implement a complete, production-ready serverless architecture on AWS using Pulumi in Python. The solution must follow best practices for security, modularity, and resource management.

*High-Level Objective:*
Develop a serverless infrastructure where an AWS S3 bucket triggers an AWS Lambda function every time a new object is created.

*Detailed Requirements & Implementation Steps:*

1.  *Project Structure:* Create a complete file and directory structure as if the project were being pulled from a Git repository. This must include:
    * A root directory for the Pulumi project.
    * A lambda_code directory containing the Python source code for the Lambda function (main.py). The code should include a simple print statement logging the S3 event data.
    * The main Pulumi script (__main__.py) which will define and deploy all resources.
    * A requirements.txt file listing the Python dependencies for the Lambda function.

2.  *Resource Deployment:* In the __main__.py script, deploy the following resources:
    * An *AWS S3 Bucket: The bucket must be configured with **versioning enabled* and a descriptive name.
    * *IAM Role and Policy: Create an IAM role specifically for the Lambda function. Attach a policy that adheres to the **principle of least privilege*, granting only the necessary permissions to read from the S3 bucket and write logs to CloudWatch.
    * *AWS Lambda Function*:
        * Use the *Python 3.9 runtime*.
        * The function's code should be sourced from the lambda_code directory.
        * Attach the IAM role created above to the Lambda function.

3.  *Resource Connection (The Core Task):*
    * Crucially, establish a *trigger* so that the Lambda function is invoked automatically whenever a new object is added to the S3 bucket. This must be configured programmatically within the Pulumi script.
    * Explicitly define the S3 bucket's event notification to send s3:ObjectCreated:* events to the Lambda function.

4.  *Pulumi Configuration:*
    * Ensure all resources are deployed in the *us-east-1* region.
    * Configure the Pulumi project to use an *AWS S3 backend for state management*. This configuration should be reflected in the project's setup.

5.  *Project Outputs:*
    * Include Pulumi stack outputs at the end of the script to display the *ARN of the S3 bucket* and the *ARN of the Lambda function*.

*Expected Output:*

Provide a complete, self-contained response that includes all the necessary Python scripts and configuration files. The code must be clean, well-commented, and ready to be deployed with a single pulumi up command. The comments should explain the purpose of each resource and the logic behind the S3-to-Lambda trigger configuration.