
Hey,

Im working on a Terraform setup and I want it to handle both staging and production environments. My main goals are to keep things easy to maintain, avoid repeating myself, and stick to best practices. Id like to use workspaces to keep the environments separate, and I want variable names to be consistent so its not confusing when switching between them.

Im planning to use modules for the common stuff, so we dont have to copy-paste code everywhere. Its also important for me to have some outputs that can be shared between environments, especially for deployment and CI/CD. We need to deploy in both us-west-2 and eu-west-1, and each environment should have its own workspace.

Lets keep the main logic in provider.tf and tap_stack.tf. If you have any suggestions or see a better way to organize things, let me know!