I need a CloudFormation YAML template (`TapStack.yml`) that will deploy a high-availability web application in AWS. The setup should meet these requirements:

* Use a VPC that spans at least two Availability Zones within a single AWS region.
* Create an internet-facing Application Load Balancer (ALB) that distributes traffic across multiple AZs for high availability.
* Launch an Auto Scaling group of EC2 instances behind the ALB, with scaling triggered by CPU utilization.
* Configure Security Groups so the ALB allows HTTP and HTTPS traffic, and the EC2 instances allow SSH access only from a specific IP range.
* Store the application code in an S3 bucket and ensure EC2 instances can pull the code during launch.
* Tag all resources according to the companys tagging policy for cost tracking and organization.

The final template should be tested to confirm it deploys a fully functional infrastructure the load balancer must route traffic to instances in multiple AZs, and the Auto Scaling group should scale correctly.

