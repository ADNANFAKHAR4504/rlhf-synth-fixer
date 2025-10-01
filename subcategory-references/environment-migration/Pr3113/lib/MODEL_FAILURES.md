# Model Failures

This file documents the issues and limitations of the AI model's generated code. It serves as a record of the manual corrections and improvements that were required to make the code functional and production-ready.

## Migration Stack

The following issues were identified and addressed in the `migration-stack.ts` file:

### Issue 1: Hardcoded EC2 Key Pair and Lack of Self-Containment

*   **Problem**: The original code had a hardcoded dependency on a pre-existing EC2 key pair named `migration-bastion-key`. This was a deployment blocker and not a good practice, as the stack was not self-contained and relied on external resources not defined within it.
*   **Fix**:
    *   Automated the creation of the EC2 key pair using the `cdk-ec2-key-pair` construct.
    *   Securely stored the private key in AWS Secrets Manager.
    *   Added the `cdk-ec2-key-pair` dependency to the project.
    *   Corrected the properties for the `KeyPair` construct.
    *   Corrected the output for the secret name.

### Issue 2: ALB Not Routing Traffic (Nginx Service Installation)

*   **Problem**: The ALB was returning a 502 Bad Gateway error because the health checks were failing. This was caused by the Nginx service not being installed and started correctly on the web server instances.
*   **Fix**:
    *   The user data script was updated to correctly install Nginx. (Further details on specific Nginx installation fixes are in Issue 3 and 4).

### Issue 3: User Data Script Not Running (Incorrect `echo` redirection)

*   **Problem**: The user data script was not correctly creating the `index.html` file due to incorrect shell redirection with `echo >`. The `>` operator was being misinterpreted during script execution.
*   **Fix**: Changed the `addUserData` call to use a "here document" (`sudo cat > /usr/share/nginx/html/index.html <<EOF ... EOF`) for reliable file creation, ensuring the HTML content was correctly written to the file.

### Issue 4: Nginx Package Not Found (Amazon Linux Extras)

*   **Problem**: Nginx was not found in the default Amazon Linux 2 repositories when attempting to install with `sudo yum install -y nginx`. This resulted in an error "No package nginx available."
*   **Fix**: Updated the user data script to install Nginx using `sudo amazon-linux-extras install nginx1 -y`, which is the correct method for installing Nginx from the Amazon Linux Extras repository on Amazon Linux 2.