# CloudFormation Troubleshooting & CI/CD Guide for Labelling Tasks#

This guide will help new joiners understand the full end-to-end troubleshooting workflow for working with CloudFormation templates, setting up their local environment, running test cases, and handling CI/CD issues.

# Step-by-Step Troubleshooting & Deployment Flow #

# 1.  Select & Process a Task from Sheet #

Open the provided Sheet.

For each task row:

Copy the following fields:

problem.statement

problem.environment

problem.problem

Give the complete text to the AI Agent and request:

"Provide a comprehensive high-level user prompt for the above problem"

# 2. Create prompt.md #

Copy the generated user prompt.

Paste it inside the file prompt.md.

# 3. Use RLHF Labelling Tool

Go to the RLHF tool and open the task using the given RLHF Link.

Copy the same prompt from prompt.md.

Submit to the model.

Copy the code block (CloudFormation YAML) from model's response.

# 4. Set Up Local Project

# Clone & prepare environment
1. git clone <repo-url>
2. git checkout -b IAC-<labellingTaskID>
3. ./setup.sh
4. npm start rlhf-task

Select the project type (choose CloudFormation)

Fill in required metadata when prompted

Paste your RLHF Task ID when asked

# 5.  Add Code to Template

Navigate to: lib/TapStack.yml

Paste the CloudFormation code into the file.

# 6. Lint the CloudFormation Template

pip install cfn-lint
cfn-lint lib/TapStack.yml

Ensure there are no linting errors — this is mandatory for CI/CD.

# 7. Generate JSON for Testing

pipenv run cfn-flip ./lib/TapStack.yml > ./lib/TapStack.json

# 8. Write & Run Tests

Use the AI Agent to:

Generate unit tests for your template

Generate integration tests validating resources, permissions, and outputs

# Then run:

npm run test:unit
npm run test:integration

Ensure all test cases pass.

# 9.  Build Project

npm run build

Confirm build is successful

# 10. Push Changes & Create PR

git add .
git commit -m "IAC-labellingTaskID: Added stack + tests"
git push origin IAC-labellingTaskID

Open GitHub

Create a Pull Request for your branch

# 11.  Monitor CI/CD Pipeline

GitHub will trigger the pipeline automatically

If stack creation fails, error will look like:

Stack creation/updation failed. check logs

CI/CD pipeline doesn't show detailed error logs — see below to troubleshoot.

# 12.  Stack Error Troubleshooting

🔐 Login to Jumpbox

Use credentials provided to you for the AWS Jumpbox

# Find Stack Failure Reason

aws cloudformation describe-stack-events \
  --stack-name <TapStackName> \
  --query "StackEvents[?contains(ResourceStatus, 'FAILED') || contains(ResourceStatus, 'ROLLBACK')].[Timestamp, LogicalResourceId, ResourceStatus, ResourceStatusReason]" \
  --output table

# If Stack Is Stuck or Rolled Back

aws cloudformation delete-stack --stack-name <TapStackName> --region us-east-1

After deletion, re-run pipeline or manually deploy again

# 13.  Claude PR Review Trigger

Once your PR is ready and CI/CD passed:

Go to File changes tab in your PR

Leave a comment like:

@claude review this PR

# Claude Agent will evaluate:

CloudFormation best practices

Security, tagging, naming, permissions

Output any required fixes

If Claude suggests changes, apply them and repeat the troubleshooting + pipeline cycle.
# 14 PR Merge
Once pipeline passed deployment stages + Claude Review then ask your Team Lead to review PR and merge changes. individuals don't have rights to merge PRs by themselves so follow standard flow.
