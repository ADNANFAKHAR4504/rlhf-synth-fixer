# AWS Multi-Account Setup with CDK

So I'm working on this pretty complex multi-account AWS setup for our company and need to use CDK (JavaScript) instead of the usual CloudFormation StackSets approach. We've got a growing organization with tons of accounts and regions to manage.

Here's what I'm trying to accomplish:

We need something that works like CloudFormation StackSets but built with CDK and more modern patterns. Basically deploy infrastructure across multiple AWS accounts and regions in our org, but with better automation.

For security stuff - cross-account IAM roles are crucial here. Need to follow least privilege but still allow infrastructure deployment across accounts. Can't have overly permissive roles but need enough access to actually deploy things.

Tagging is another headache we're dealing with... leadership wants consistent tags on everything (department, project, environment). Would be great if this could enforce that automatically rather than relying on people to remember.

CDK Pipelines would be perfect for the deployment automation - different environments across different accounts (we use separate accounts for dev/staging/prod). 

Also trying to integrate with Control Tower AFT since we're using that for account provisioning. Want to tap into those custom VPC options and baseline management features they added recently.

Oh and drift detection - heard CDK has some new capabilities there? Would love to catch when people make manual changes outside of our IaC.

This needs to scale for our environment... we're talking hundreds of accounts eventually. Infrastructure team needs clear instructions they can actually follow.

Can you help build out the complete CDK JavaScript code? I'd prefer separate files for different components so it's easier to maintain. Just provide complete code blocks I can copy into the project.