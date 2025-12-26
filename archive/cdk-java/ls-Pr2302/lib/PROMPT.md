# High Availability Infrastructure Setup Help

Hey there! I'm working on a really challenging project for my company and could use some guidance. We're trying to set up a robust failure recovery and high availability infrastructure on AWS, and I'm honestly feeling a bit overwhelmed by all the moving parts.

I'm a mid-level engineer at a growing fintech startup, and we've been experiencing some reliability issues with our current setup. Last month we had two separate outages that cost us significant customer trust and revenue. The CEO is now breathing down our necks to build something bulletproof that can handle failures gracefully without manual intervention.

Here's what I'm trying to accomplish:

I need help building a complete high availability infrastructure that can automatically recover from failures. The main requirements I've been given are:

First, I need to create a proper VPC architecture with both public and private subnets spread across multiple availability zones. I've heard that distributing resources across AZs is crucial for fault tolerance, but I'm not entirely sure about the best practices for subnet design.

Second, I need to implement auto-scaling groups that can dynamically handle load changes. Our traffic patterns are pretty unpredictable - we might see 10x spikes during market hours, and then drop to almost nothing overnight. The infrastructure needs to scale up and down automatically based on demand.

Third, I need proper networking setup with internet gateways for public subnets and NAT gateways for private subnets. I'm particularly concerned about ensuring private resources can still reach the internet for updates while maintaining security.

Fourth, IAM configuration is giving me headaches. I need to implement least privilege access, but I'm not confident about getting the policies right. Security is absolutely critical in fintech, and I can't afford to get this wrong.

Fifth, comprehensive logging and monitoring integration is essential. We need to be able to quickly identify issues when they occur and ideally catch problems before they impact customers.

Finally, the whole setup needs to support automatic failure recovery using AWS features. If an instance fails or even if an entire AZ goes down, the system should recover without any manual intervention.

I've been reading about some newer AWS features like VPC Lattice and the latest Application Load Balancer capabilities that might help with this setup. I'd love to incorporate these if they make sense for high availability scenarios.

Budget is a concern since we're still a startup, so I need to be mindful of costs while still achieving our reliability goals. I'm also working mostly solo on this, so the solution needs to be maintainable by a small team.

Could you help me design and implement this infrastructure using AWS CDK with Java? I'm particularly looking for a complete solution that I can deploy and test, with clear documentation about how everything works together. Any insights about best practices for high availability architectures would be incredibly valuable too.

Thanks in advance for any help you can provide!