# Human Prompt Generation Examples & Scoring

## Authenticity Scoring System (0-10)

**Score 8-10: Highly Human-Authentic**
- Natural business context and urgency
- Realistic stakeholder personas  
- Cross-team requirements and constraints
- Informal language with contractions
- Business jargon and real concerns (budget, timeline, compliance)
- Incomplete thoughts and casual asides

**Score 5-7: Moderately Human-Like**
- Some business context but generic
- Basic informal language
- Mix of formal/informal structure
- Missing stakeholder persona depth

**Score 0-4: AI-Generated (REJECT)**
- Numbered requirements lists
- Formal technical specifications
- Perfect grammar and structure
- No business context or personas
- Template-like organization

## ✅ GOOD Examples (Score 8-10)

### Example 1: VP Engineering Request
```
Hi team,

We're launching our customer portal next month and need the AWS infrastructure set up ASAP. Marketing is expecting heavy traffic from our Black Friday campaign, so we need something that won't crash under load.

Here's what we need:

Our web app needs to handle at least 10,000 concurrent users during peak times. The backend team says we need multiple servers running so if one goes down, customers can still place orders. They want everything in us-east-1 since that's where our current systems are.

The database is critical - we can't lose customer orders or payment data. Finance department requires full audit trails and monitoring on everything. They're also asking for proper cost tracking tags so they can allocate expenses to the marketing budget.

Security team insists on:
- Separate network zones for web servers and database  
- No direct internet access to the database
- All logs must be centralized for compliance audits
- Proper backup and disaster recovery

Budget is approved but keep costs reasonable. We're a growing startup, not Amazon. :)

Thanks!
Sarah Chen  
VP Engineering
```

### Example 2: DevOps Engineer Request  
```
Hey,

So our current setup is falling apart and management finally approved budget for proper infrastructure. We've got this Python web app that keeps going down during traffic spikes and it's embarrassing.

Need something that can auto-scale when we get slammed. Last week we had 500 concurrent users and the whole thing crashed. The database connection pool was maxed out and everything just died.

Requirements from various teams:
- Dev team wants container orchestration (they're obsessed with Docker)
- Security team is paranoid about network isolation 
- Finance wants cost alerts so we don't blow our budget again
- Ops team needs monitoring that actually works (our current setup is useless)

Oh and legal mentioned something about data residency - everything needs to stay in US regions. Not sure why but apparently it's important for compliance.

Can we get this done in 2 weeks? The CEO is breathing down our necks about reliability.

Mike Rodriguez
Senior DevOps Engineer
```

## ❌ BAD Examples (Score 0-4 - REJECT)

### Example 1: AI-Generated Technical Spec
```
I need to deploy a highly available web application using AWS CDK in JavaScript. The infrastructure must meet these specific requirements:

1. Create a VPC with at least 3 subnets distributed across different Availability Zones
2. Set up an Auto Scaling group to ensure there are always at least two EC2 instances running
3. Deploy an Application Load Balancer to distribute incoming traffic
4. Configure an RDS MySQL database with Multi-AZ deployment enabled
5. Create IAM roles for EC2 instances to allow S3 access
6. Apply consistent tagging with 'Environment: Production' for cost allocation
7. Enable CloudWatch logging and monitoring

Additional requirements:
- Deploy in the us-east-1 region
- Use custom CIDR blocks for the VPC
- Follow AWS best practices and include proper error handling
```

### Example 2: Formal Requirements Document
```
Subject: Infrastructure Requirements for Web Application

The following technical specifications are required for the web application deployment:

Technical Requirements:
• High availability architecture across multiple availability zones
• Auto scaling capability with minimum 2 instances
• Load balancing for traffic distribution
• Database redundancy with automated failover
• Security groups with least privilege access
• Comprehensive monitoring and alerting

Compliance Requirements:
• All resources must be tagged according to organizational standards
• Logging must be enabled for audit purposes
• Encryption must be implemented for data at rest and in transit

Please implement according to AWS Well-Architected Framework principles.
```

## Key Patterns for Human Authenticity

### ✅ Human Indicators
- **Business Urgency**: "ASAP", "CEO breathing down necks", deadlines
- **Cross-Team Dynamics**: "Security team insists", "Finance wants", "Dev team is obsessed"
- **Real Constraints**: Budget concerns, existing systems, compliance requirements
- **Informal Language**: Contractions, casual phrases, incomplete sentences
- **Stakeholder Personas**: Names, titles, specific team concerns
- **Business Context**: Product launches, campaigns, growth events
- **Realistic Problems**: Past failures, current pain points, competitive pressure

### ❌ AI-Generated Red Flags  
- **Numbered Lists**: Formal requirement enumeration
- **Perfect Grammar**: No contractions, formal sentence structure
- **Template Language**: "Please provide", "Must meet requirements"
- **No Business Context**: Pure technical specifications
- **No Personas**: Generic "we need" without stakeholder identity
- **Formal Structure**: Subject lines, bullet points, section headers
- **AWS-Speak**: Heavy use of service names without business justification

## Validation Checklist

Before approving any PROMPT.md, verify:
- [ ] Realistic business persona with name/title
- [ ] Genuine business urgency/timeline pressure  
- [ ] Cross-team requirements and politics
- [ ] Budget/cost constraints mentioned
- [ ] Informal, conversational language
- [ ] Contractions and casual phrases present
- [ ] Business context (launch, campaign, growth, etc.)
- [ ] Real operational pain points described
- [ ] No numbered requirement lists
- [ ] No formal document structure