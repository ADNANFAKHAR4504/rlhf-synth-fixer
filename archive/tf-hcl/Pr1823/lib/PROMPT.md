I need your help creating a single, comprehensive Terraform configuration file for a new AWS stack.

Please generate the entire configuration in one file located at `./lib/tap_stack.tf`. This file should contain everything: all **variable declarations**, **locals**, the **resource definitions**, and any **outputs**.

A few important guidelines:

* **Build from Scratch:** Please define all the resources directly in this file. **Do not use any external modules.**
* **Best Practices are Key:**
    * **Security:** Stick to **least-privilege IAM** policies, enable **encryption** wherever applicable, and configure **secure security groups** with minimal ingress rules.
    * **Tagging:** Apply a consistent set of tags to all resources.
* **CI/CD Friendly Outputs:** The outputs should expose useful information for automation and testing (like ARNs, IDs, or DNS names), but please **make sure not to include any secrets**.
* **Provider Configuration:** You don't need to write the `provider.tf` file, but you should **declare the `aws_region` variable** in your `tap_stack.tf` file. You can assume that if multiple regions are needed, the necessary provider aliases are already defined elsewhere and are available for you to use.

Essentially, I'm looking for a clean, secure, and self-contained Terraform file that sets up a new stack following modern IaC standards.
