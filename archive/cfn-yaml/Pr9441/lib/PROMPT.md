Need a CloudFormation YAML template named `TapStack.yaml` that provisions a highly available web application infrastructure in AWS. This needs to be resilient, scalable, and cost-effective following AWS architectural best practices.

Here's what the infrastructure needs:

**Resilience and Availability**
- Deploy EC2 instances across multiple Availability Zones within a single region
- Ensure infrastructure stays up during zone-level failures through redundancy and geographic distribution

**Load Distribution**
- Set up an Application Load Balancer that receives incoming web traffic and distributes it across the EC2 instances in different AZs
- The ALB should connect to EC2 targets through health checks and support HTTP routing with even traffic flow

**Dynamic Auto Scaling**
- Create an Auto Scaling Group that connects to the ALB and automatically adjusts EC2 instance count based on real-time demand
- Minimum 2 EC2 instances, maximum 10 instances
- Scale based on CPU utilization or other load metrics
- Include health checks that detect failing instances and trigger the Auto Scaling Group to launch replacements

**Persistent Logging with Lifecycle Management**
- Create an S3 bucket that receives application logs from the EC2 instances
- Configure a lifecycle policy that automatically transitions logs to S3 Glacier after 30 days to reduce storage costs

**Template Flexibility**
- Make the template region-agnostic unless specific constraints apply
- Use CloudFormation Parameters for customization of VPC CIDRs, instance types, environment names
- Apply consistent naming conventions and resource tagging with Environment and Name tags for clarity and cost tracking

**Required Outputs**
- Load Balancer DNS name
- S3 bucket name
- Auto Scaling Group name

The template should be deployable in any AWS environment, syntactically correct, logically organized, and easy to understand and modify. Focus on cost optimization without compromising performance or availability.

Use IAM roles or policies only when required to enable specific services or features.
