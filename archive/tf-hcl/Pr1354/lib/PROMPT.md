
Hey,

I’m working on a Terraform setup and I want it to handle both staging and production environments. My main goals are to keep things easy to maintain, avoid repeating myself, and stick to best practices. I’d like to use workspaces to keep the environments separate, and I want variable names to be consistent so it’s not confusing when switching between them.

I’m planning to use modules for the common stuff, so we don’t have to copy-paste code everywhere. It’s also important for me to have some outputs that can be shared between environments, especially for deployment and CI/CD. We need to deploy in both us-west-2 and eu-west-1, and each environment should have its own workspace.

Let’s keep the main logic in provider.tf and tap_stack.tf. If you have any suggestions or see a better way to organize things, let me know!