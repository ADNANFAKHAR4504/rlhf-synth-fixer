Generate a single AWS CloudFormation YAML file named `TapStack.yml` that **fully creates** a production-ready VPC-based environment in **us-west-2**. The template must adhere exactly to the following requirements and best practices — produce the full YAML only (no extra commentary). Ensure the template will deploy as a *brand new stack* (do not reference or require any existing AWS resources). Tag **all** resources with `Environment: Production`.

**High-level requirements**

* Region: `us-west-2`.
* VPC CIDR: `10.0.0.0/16`.
* Use **two availability zones** in us-west-2; create at least one public and one private subnet in **each** AZ (so total 4 subnets: 2 public, 2 private).
* Each public subnet must route to an Internet Gateway (IGW).
* Provide **NAT Gateway(s)** so private subnets have non-interactive outbound internet access. Implement NAT per AZ (i.e., a NAT Gateway and Elastic IP per AZ) for high availability.
* Launch application EC2 instances into the **private subnets**. Instance type default must be `t2.micro` but controlled via Parameter.
* Provide **SSH access** to the EC2 instances only from a *specific* CIDR range passed in as a Parameter. Implement SSH in a secure, best-practice way (introduce a bastion/jump host in public subnets and have the private instances accept SSH only from the bastion security group; the bastion accepts SSH only from the Parameter CIDR).
* Put an **Application Load Balancer (ALB)** in the public subnets to distribute incoming HTTP (port 80) traffic to EC2 instances in private subnets. ALB should be internet-facing.
* Implement **Auto Scaling Group** (ASG) for the EC2 fleet (min/desired/max controlled via Parameters), using a Launch Template or Launch Configuration. Register ASG targets with the ALB Target Group.
* Security groups: ALB SG must allow inbound HTTP/HTTPS from the internet; EC2 SG must allow inbound application port from ALB SG and SSH only from bastion SG; Bastion SG allows SSH only from the Parameter SSH CIDR.
* IAM: create least-privilege IAM Role(s) and Instance Profile(s) for EC2 and the bastion. EC2 instances must have permission only to read specific SSM Parameter Store values (not full SSM policy). The ALB and autoscaling should have necessary roles if required.
* Secrets: **No sensitive strings hard-coded**. Any secret-like string(s) (e.g., application secret) must be stored as SecureString in **AWS Systems Manager Parameter Store**. The template should either create example SSM SecureString parameters (with placeholder values created via Parameters) or accept SSM parameter names as Parameters and reference them with dynamic references (`{{resolve:ssm-secure:...}}`) where needed. Ensure the EC2 instance IAM role allows `ssm:GetParameter` and `ssm:GetParameters` for the specific parameter ARNs only.
* Use CloudFormation **Parameters** for all variable inputs (KeyPair name, SSH CIDR, InstanceType, ASG min/desired/max, AMI SSM parameter name or explicit AMI ID, VPC CIDR if desired, NAT Elastic IP allocation options, etc.). Provide sensible defaults where appropriate.
* Use **Mappings**, **Conditions**, **Outputs**, and **Tags** following CloudFormation best practices. Outputs should include at least: VPC ID, public subnet IDs, private subnet IDs, ALB DNSName, ALB ARN, ASG name, Security Group IDs, and Bastion Public IP.
* Ensure resources are created with `Environment: Production` tag (and include additional tags like `Name` and `Stack` where appropriate).
* Validate networking: ensure public subnets have route tables pointing `0.0.0.0/0` to IGW; private route tables point `0.0.0.0/0` to NAT Gateway in same AZ.
* Use stable, recommended AMI lookup: either accept an `AmiId` Parameter or use the SSM public parameter `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2` (document how the template uses it).
* Keep security *tight*: default to HTTPS optional but configure ALB to allow HTTP; encourage user to extend to HTTPS.
* Include stack-level metadata and a short description at the top of the template.

**Specific Parameter list (minimum)**

* `EnvironmentName` (Default: `Production`)
* `VpcCidr` (Default: `10.0.0.0/16`)
* `AvailabilityZones` or use `Fn::GetAZs` to pick two AZs
* `PublicSubnet1Cidr`, `PublicSubnet2Cidr`, `PrivateSubnet1Cidr`, `PrivateSubnet2Cidr` (give sensible default CIDR splits)
* `KeyName` (EC2 KeyPair name) — must be a Parameter (no hard-coded key)
* `SSHCidr` — CIDR range allowed to reach the bastion (e.g., `203.0.113.0/32`) — **must** be a Parameter
* `InstanceType` (Default: `t2.micro`)
* `AmiId` (optional) or a `UseAmiFromSsm` boolean and `AmiSsmParameter` (default to Amazon Linux 2 SSM parameter)
* `AsgMinSize`, `AsgDesiredCapacity`, `AsgMaxSize`
* `AppPort` (Default: `80`)
* `AppSecretParameterName` — name of the SSM SecureString parameter to use for application secret (template should create an example parameter if not provided)
* `CreateBastion` boolean (default true) — allow operator to disable if they have alternate access method

**Outputs (minimum)**

* `VPCId`
* `PublicSubnetIds` (list)
* `PrivateSubnetIds` (list)
* `BastionPublicIP` (if bastion created)
* `AlbDNSName`
* `AlbArn`
* `AsgName`
* `Ec2InstanceRole` / `Ec2InstanceProfile`
* `SecurityGroupIds` (ALB SG, EC2 SG, Bastion SG)

**Behavior & Implementation hints to include in template**

* Create one NAT Gateway per AZ; ensure each private subnet's route table points to NAT Gateway in the same AZ (for high availability).
* Create one route table for public subnets (can be shared) and separate route tables for private subnets (one per AZ recommended).
* Create Elastic IPs for each NAT Gateway.
* Create an Internet Gateway and attach it to the VPC.
* Use `AWS::AutoScaling::AutoScalingGroup` with `LaunchTemplate` or `LaunchConfiguration`. Use latest generation for LaunchTemplate if possible.
* Configure health checks on the ALB Target Group and hook the ASG to the Target Group.
* Use SSM Parameter Store secure strings for secrets; create example AWS::SSM::Parameter resources with Type=`AWS::SSM::Parameter::Value<SecureString>` or create parameter resources of type `AWS::SSM::Parameter` and show how EC2 instances dynamically reference them with `{{resolve:ssm-secure:/path/to/param:1}}` in user data.
* EC2 user data should demonstrate reading an application secret using a dynamic reference (do not place the secret inline).
* Create IAM policy for EC2 that limits SSM access to only the parameter path used and limited Describe/Read permissions necessary for ALB/ASG if any (least privilege).
* Bake in deletion policies / Update policies where appropriate (for example, preserve EIPs on deletion is optional; document in template via Metadata if needed).
* Add `CreationPolicy` or `WaitCondition` if necessary to ensure instances register with ALB before finishing (optional but recommended).
* Use CloudFormation intrinsic functions to reference AZs, subnet IDs, etc. Avoid hard-coded AZ names.

**Deliverable format**

* A **single YAML CloudFormation template** named `TapStack.yml` (the assistant should output the YAML content only). The template must be ready to deploy in the AWS Console or AWS CLI in `us-west-2` and meet all constraints above.

**Testing notes (for the generator to consider)**

* The stack will be deployed to verify:

  * VPC with two AZs exists and has 2 public + 2 private subnets.
  * Public subnets route via IGW.
  * Private subnets route via NAT Gateways in their AZs.
  * EC2 instances launched in private subnets and reachable for SSH only via bastion (SSH restricted to `SSHCidr`).
  * ALB is internet-facing and distributes traffic to the ASG instances.
  * IAM role attached to EC2 can read only the specified SSM SecureString parameter.
  * All resources have tag `Environment: Production`.
  * No secret strings are hard-coded in the template (only references to SSM SecureString dynamic references / Parameter names).
  * Default EC2 instance type is `t2.micro`.
