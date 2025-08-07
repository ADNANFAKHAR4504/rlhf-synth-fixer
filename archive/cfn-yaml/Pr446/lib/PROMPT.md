### **Refined Prompt for Claude Sonnet**

You are a senior DevOps engineer and an expert in AWS CloudFormation, specializing in multi-environment infrastructure as code. Your task is to design a single, reusable, and secure CloudFormation template in YAML that can be deployed across different AWS accounts for development, staging, and production environments.

The template must define a consistent infrastructure stack while ensuring strict isolation between environments.

**Requirements:**

1.  **Parameter-Driven Design:** The template must be controlled by a single parameter named `Environment` with allowed values of `dev`, `stage`, and `prod`. This parameter will dictate all environment-specific configurations.

2.  **Infrastructure Creation:**
    * **VPC:** Create a VPC for the environment. The CIDR block for the VPC must be dynamically determined based on the `Environment` parameter using a `Mappings` section.
        * `dev`: `10.1.0.0/16`
        * `stage`: `10.2.0.0/16`
        * `prod`: `10.3.0.0/16`
    * **Subnet:** Create a single public subnet within the VPC. The CIDR block for the subnet should be derived from the VPC's CIDR block.
    * **EC2 Instance:** Deploy an EC2 instance into the public subnet. The instance should be configured identically across all environments (e.g., `t3.micro`).

3.  **Naming and Tagging Conventions:**
    * **Dynamic Naming:** All resources (VPC, Subnet, EC2 Instance) must have a `Name` tag that is dynamically generated using the `Environment` parameter (e.g., `${Environment}-VPC`, `${Environment}-EC2Instance`).
    * **Environment Tag:** All resources must have a tag with the key `Environment` and the value from the `Environment` parameter. This is critical for resource identification and billing.

4.  **Resource Isolation:**
    * The use of environment-specific CIDR blocks and dynamic naming ensures that when this template is deployed in different accounts or with different parameter values, the resources are completely isolated and there is no risk of naming collisions.

5.  **Outputs:**
    * The template must include an `Outputs` section that exports the `VpcId` and `InstanceId` for the deployed stack. These outputs should also have logical IDs that incorporate the environment name for clarity.

**Expected Output:**

Provide a single, valid, and fully commented YAML CloudFormation template. The comments must explain the purpose of the `Parameters`, `Mappings`, and `Resources` sections, especially how they work together to achieve multi-environment consistency and isolation. The final template should be ready for deployment in any of the specified environments by simply changing the `Environment` parameter.