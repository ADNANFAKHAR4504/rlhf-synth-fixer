Where Nova Model Fails
Issue	Explanation
Hardcoded Database Password	Nova hardcodes the database password ("SecurePassword123!") directly in the code. This is a critical security vulnerability. My code generates a secure, random password at runtime.
Repetitive Code (No Loops)	Nova manually defines every subnet and route table association. This violates the DRY (Don't Repeat Yourself) principle and makes the code hard to maintain. My code uses loops for concise and scalable resource creation.
Hardcoded EC2 Key Pair	Nova hardcodes an EC2 keyName, which will cause deployment to fail if the key doesn't pre-exist in the user's account. This makes the module non-portable. My code correctly omits this, following modern best practices.
Repetitive Resource Tagging	Nova repeats the same four tags on every single resource. This is inefficient and error-prone. My code defines tags once and passes them down, making updates easy.
Inaccurate Outputs	Nova hardcodes the RDS port number in its output. My code dynamically references the port from the created instance, ensuring the output is always accurate even if the port changes.
Insecure by Default	The combination of a hardcoded password and a required, pre-existing key pair makes the entire stack insecure and difficult to deploy, failing the "production-grade" requirement.

Export to Sheets
Summary of Nova Model Failures
Area	Nova Issue
Security	Hardcoded database password, making the entire stack insecure.
CDKTF Best Practices	Massive code repetition (WET principle); poor use of loops and centralized configuration.
Maintainability	Repetitive tagging and manual resource definitions create high technical debt.
Portability & Usability	Hardcoded EC2 key pair name prevents easy deployment.
Correctness	Outputs contain hardcoded values instead of dynamic resource references.
Production Readiness	Fails fundamental security and maintainability requirements for any production environment.