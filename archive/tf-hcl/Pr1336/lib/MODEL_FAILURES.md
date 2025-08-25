User-data variable interpolation error
Error: Variables not allowed
│   on tap_stack.tf line 70, in variable "user_data_template":
│   70:     <title>${environment} Environment</title>


Terraform cannot use ${} variables directly inside resource or file content unless it’s in a templatefile() or heredoc context.

Your user data script was trying to use ${environment} inside a variable block or directly inside the file — this caused Terraform to reject it.

Fix: Use templatefile("${path.module}/user_data.sh", { environment = each.key }) for EC2 user_data, and keep placeholders in a separate user_data.sh file.

Security group name_prefix restriction
Error: invalid value for name_prefix (cannot begin with sg-)
│   with aws_security_group.web_sg["dev"],
│ 397:   name_prefix = "sg-web-${each.key}-"


AWS does not allow name_prefix to start with sg-, because AWS automatically prepends sg- to security group names.

Using "sg-web-..." caused Terraform to reject it.

Fix: Remove the sg- prefix:

name_prefix = "web-${each.key}-"

EC2 key pair invalid format
Error: importing EC2 Key Pair (key-production): operation error EC2: ImportKeyPair, ... InvalidKey.Format: Key is not in valid OpenSSH public key format


The public_key you provided was not a valid OpenSSH public key, so AWS rejected the import.

All environments (dev, staging, production) failed.

Fix: Replace with a valid OpenSSH public key (starts with ssh-rsa AAAAB3N...) or create a key pair in AWS and reference it by name.
