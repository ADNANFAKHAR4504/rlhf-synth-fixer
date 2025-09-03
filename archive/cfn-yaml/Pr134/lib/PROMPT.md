# Prompt

You are an expert **AWS Infrastructure Engineer specializing in CloudFormation and secure, scalable VPC design**. Your task is to generate a **production-ready CloudFormation YAML template** that automatically provisions a VPC environment according to the requirements below.

**Requirements:**

1. **Region:** All resources must be deployed in **`us-east-1`**.
2. **VPC:**
- Create a VPC with a valid CIDR block for typical workloads.
- Follow AWS best practices for tagging, internet accessibility, and subnet segmentation.
3. **Subnets:**
- Create **two public subnets**, each in a **different Availability Zone** for high availability.
4. **Internet Gateway:**
- Attach an Internet Gateway to the VPC to enable internet access for the public subnets.
5. **Route Tables:**
- Configure route tables so that **each public subnet routes `0.0.0.0/0` traffic to the Internet Gateway**.
6. **Naming Convention:**
- Enforce consistent naming:
```
{Environment}-{ResourceType}-{UniqueIdentifier}
```
where:
- `{Environment}` is provided as a **stack parameter** during deployment.
- `{ResourceType}` identifies the resource (e.g., VPC, Subnet, IGW).
- `{UniqueIdentifier}` ensures uniqueness.
7. **Validation:**
- Template should pass `cfn-lint` validation and deploy successfully.
- All resource dependencies must be handled correctly within the stack.
- Tag all resources with the `Environment` parameter.

**Constraints:**

* Use **AWS native CloudFormation YAML** only (no CDK or Terraform).
* Ensure **idempotence** for repeated deployments.
* Focus on clarity, modularity, and AWS best practices for scalability.

**Expected Output:**

* A **clean, production-ready `vpc-setup.yaml` CloudFormation YAML template** fulfilling all the above requirements.
* The file should be directly deployable using:
```
aws cloudformation create-stack --stack-name <name> --template-body file://vpc-setup.yaml --parameters ParameterKey=Environment,ParameterValue=Production
```
* Include a **short explanation (35 bullet points)** describing how the template fulfills the requirements.

**Optional Advanced Considerations:**

- Use clear, consistent logical IDs for resources.
- Parameterize the VPC CIDR and subnet CIDRs for flexibility.
- Use Mappings for AZ selection to improve portability.
- Configure public subnets to auto-assign public IPs for instances.
- Keep the template minimal but extendable for future needs.