### **Project Task: Secure AWS S3 Configuration with Python CDK**

---

Hey team, we're shifting gears on our secure configuration project. Instead of a CloudFormation YAML template, we'll be using Python and the AWS Cloud Development Kit (CDK) to define our infrastructure. This approach will give us more flexibility and allow us to use familiar programming concepts.

Your task is to create a Python CDK application that sets up a secure IAM role for interacting with AWS S3. This is a critical piece of our infrastructure, so it needs to follow our security best practices.

### **Requirements**

Here's what the solution needs to do:

* **IAM Role and Least Privilege:** Create a new **IAM Role** with a policy that grants access to S3. The policy must be as restrictive as possible, granting only the specific S3 actions required (e.g., `s3:GetObject`, `s3:ListBucket`). Avoid using broad permissions like `s3:*`.
* **Tagging:** All resources, including the IAM Role and its policy, must be tagged with `Environment: Production` and `Owner: DevOps`.
* **Documentation:** The CDK code must be clear and well-commented. Please add inline comments to explain the purpose of each resource and the logic behind the policy statements. This will make it easier for others to understand and maintain the code.
* **Security:** Follow AWS security best practices. Do not hardcode any sensitive information, like access keys or secrets, directly into the code.

### **Technical Specifications**

* **Language:** Python
* **Framework:** AWS CDK
* **Environment:** The solution should be designed for the `us-east-1` region. You can assume the role will operate within our existing `prod-vpc`.

### **Deliverable**

Please submit a complete and functional Python CDK project. This should include the main application file (e.g., `app.py`) and the stack definition file (e.g., `s3_stack.py`). The project should be ready to be deployed by running standard CDK commands like `cdk synth`.