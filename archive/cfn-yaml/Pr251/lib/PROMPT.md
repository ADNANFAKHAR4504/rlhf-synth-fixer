# CloudFormation Template Prompt

## Objective

Create a CloudFormation template in YAML format to automate the deployment of a highly available web application on AWS.

## Requirements

1. **High Availability**
   - Deploy EC2 instances using an Auto Scaling group.
   - Ensure the group spans **at least two Availability Zones**.

2. **Load Balancing**
   - Use an **Application Load Balancer (ALB)** to distribute incoming traffic across EC2 instances.

3. **Database**
   - Store application data in **Amazon RDS** with **Multi-AZ** configuration for high availability.

4. **Networking**
   - Use a **VPC** setup:
     - **Public subnets** for the Load Balancer.
     - **Private subnets** for application EC2 instances and the RDS database.

5. **Parameterization**
   - Allow users to configure the following at stack creation:
     - EC2 instance type
     - RDS database instance class
     - Application port

6. **Outputs**
   - Provide outputs for:
     - The **URL** to access the web application.
     - The **database endpoint**.

## Deliverable

- A YAML file named `lib/TapStack.yaml` that implements all of the above.
- The template must pass AWS CloudFormation validation.
- Organize the template following AWS best practices (use `Parameters`, `Mappings`, `Resources`, and `Outputs` sections appropriately).

