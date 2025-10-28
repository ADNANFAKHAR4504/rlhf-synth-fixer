Hey team,

We've got a pretty urgent project from one of our financial clients. They need us to set up zero-trust security architecture across their 50 AWS accounts. Banking regulations are no joke, so we need to get this right.

Here's the situation:
They're dealing with extremely sensitive financial data and want to move to a zero-trust model. Current setup isn't cutting it anymore - too much implicit trust, not enough visibility, and their compliance team is breathing down their necks.

What we need to build:

Network Layer:
- Isolated VPCs with proper subnet segmentation (public/private/isolated)
- Transit Gateway to connect everything across those 50 accounts
- AWS Network Firewall for deep packet inspection at the perimeter
- VPC Flow Logs on everything so we can see what's happening

Security & Monitoring:
- GuardDuty running in all accounts for threat detection
- Security Hub as the central dashboard for managing findings
- CloudTrail everywhere with proper log aggregation
- Systems Manager Session Manager for secure access (no more bastion hosts!)

Access Control:
- IAM policies with strict conditional logic (think MFA, IP restrictions, time-based access)
- Least privilege principle enforced across the board
- Service control policies at the org level

Automation:
- Lambda functions to auto-respond to security incidents
- EventBridge rules to trigger responses
- SNS for alerting the security team

Key requirements:
- Everything needs to work across 50 accounts (use AWS Organizations)
- Compliance logging that'll pass banking audits
- Automated threat response - can't rely on manual intervention
- Centralized monitoring and management
- Zero standing privileges where possible

What I need from you:
1. Main Terraform configs for all the core infrastructure
2. Separate files for each major component (keeps it readable)
3. Variables file so we can customize per account/environment
4. Outputs for integration points
5. A runbook explaining the deployment sequence and what each piece does
6. Testing strategy doc - how do we validate this actually works?

Important notes:
- We already have provider.tf configured, don't mess with that
- Use Terraform best practices - modules where it makes sense
- Add comments explaining the security controls
- Make sure resources have proper tags for cost allocation
- Use data sources for cross-account lookups where needed

The client wants to start with a pilot in 3 accounts first, then roll out to the rest. So keep that in mind for the design.

Let me know if you need clarification on anything. This needs to be production-ready, so take your time to do it right.

Thanks!