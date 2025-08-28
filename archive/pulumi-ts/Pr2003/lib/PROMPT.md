# AWS Infrastructure Setup - Help Request

Hey, I need your help building some AWS infrastructure using Pulumi and TypeScript. I've got this complex multi-environment setup that needs to be rock-solid and I'm honestly feeling a bit overwhelmed by all the moving parts.

## What I'm Working On

So I'm building this thing called "IaC - AWS Nova Model Breaking" - basically need to set up dev, staging, and prod environments that are identical but configurable. The business is really pushing for strict security and compliance, and everything needs to work across multiple AWS accounts in us-east-1 and eu-west-2.

## Here's What's Driving Me Crazy

I keep running into issues with resource dependencies and making sure everything connects properly. Like, I'll get the VPC set up, but then the security groups don't reference the right subnets, or the IAM roles can't actually access the resources they're supposed to manage. It's a mess.

The team lead wants:
- Everything locked down with proper IAM (least privilege and all that)
- Config and CloudTrail monitoring everything 
- Parameter Store for environment configs
- CloudWatch alarms so we actually know when stuff breaks
- Consistent tagging (apparently this is a big deal for the ops team)
- The whole thing needs to be in a VPC for security

## What I Need Help With

I'm only allowed to modify these three files:
- **lib/tap-stack.ts** - This is the main stack where all the magic happens
- **test/tap-stack.unit.test.ts** - Unit tests (because apparently we need good coverage)
- **test/tap-stack.int.test.ts** - Integration tests to make sure stuff actually works together

## The Real Challenge

The biggest pain point is getting all these resources to talk to each other properly. Like:
- VPC with subnets that actually work across AZs
- Security groups that reference each other correctly
- IAM roles that can assume other roles when needed
- CloudWatch alarms that monitor the right metrics
- Parameter Store integration that doesn't break between environments
- Making sure Config rules actually evaluate properly

I'm decent with TypeScript but Pulumi's dependency management is tripping me up. I need the code to be bulletproof because this is going to production and the last thing I want is a 3 AM phone call because something failed to deploy.

## What I'm Looking For

Can you help me build this out? I need clean, well-commented TypeScript that actually works, plus solid tests that'll catch issues before they hit production. The architecture needs to be modular so I can reuse components, but also robust enough to handle the complexity of multi-region, multi-account deployments.

### Specific Requirements:
- **Multi-Account & Multi-Region**: Deploy across multiple AWS accounts in us-east-1 and eu-west-2
- **Security First**: IAM roles following least privilege, proper security groups
- **Monitoring**: CloudWatch alarms for everything important
- **Compliance**: AWS Config rules and CloudTrail integration
- **Configuration Management**: Parameter Store for environment-specific stuff
- **Resource Organization**: Consistent tagging across all resources
- **Testing**: Comprehensive unit and integration tests

### File Structure:

lib/
└── tap-stack.ts # Main stack implementation
test/
├── tap-stack.unit.test.ts # Unit tests
└── tap-stack.int.test.ts # Integration tests