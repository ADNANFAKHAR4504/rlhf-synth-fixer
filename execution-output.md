[0;36m╔══════════════════════════════════════════════════════════════════════════════════════════════╗[0m
[0;36m║                              🚀 LocalStack Deploy                                            ║[0m
[0;36m╚══════════════════════════════════════════════════════════════════════════════════════════════╝[0m

[0;34m📍 Stack Path: /mnt/d/Projects/Turing/iac-test-automations[0m

[1;33m🔍 Checking LocalStack status...[0m
[0;32m✅ LocalStack is running[0m

[1;33m🔍 Detecting platform and language...[0m
[0;32m✅ Detected platform: pulumi[0m
[0;32m✅ Detected language: ts[0m

[0;35m🚀 Executing deployment for pulumi platform...[0m
[0;34m📁 Working directory: /mnt/d/Projects/Turing/iac-test-automations[0m

[0;32m🚀 Starting Pulumi Deploy to LocalStack...[0m
[0;32m✅ LocalStack is running[0m
[1;33m📁 Working directory: /mnt/d/Projects/Turing/iac-test-automations[0m
[0;32m✅ Pulumi project found: Pulumi.yaml[0m
[0;34m🔧 Using Pulumi: /home/noman/.pulumi/bin/pulumi[0m
[1;33m📦 Setting up Pulumi local backend...[0m
Logged in to Noman-PC as noman (file://~)
[0;32m✅ Pulumi local backend configured[0m
[1;33m📦 Installing dependencies...[0m
[0;32m✅ Node.js dependencies installed[0m
[1;33m🔨 Building TypeScript...[0m

> tap@0.1.0 build
> tsc --skipLibCheck

[0;32m✅ TypeScript build completed[0m
[0;36m🔧 Deploying Pulumi stack:[0m
[0;34m  • Stack Name: localstack[0m
[0;34m  • Environment: dev[0m
[0;34m  • Region: us-east-1[0m
[1;33m📦 Initializing Pulumi stack...[0m
[0;34m  Selecting existing stack: localstack[0m
[1;33m🔧 Configuring LocalStack endpoints...[0m
[0;32m✅ LocalStack endpoints configured[0m
[1;33m🧹 Cleaning up existing resources...[0m
Destroying (localstack):

 -  tap:stack:TapStack pulumi-infra deleting (0s) 
 -  pulumi:pulumi:Stack TapStack-localstack deleting (0s) 
 -  pulumi:pulumi:Stack TapStack-localstack deleted (0.00s) 
Resources:
    - 2 deleted

Duration: 1s

The resources in the stack have been deleted, but the history and configuration associated with the stack are still maintained. 
If you want to remove the stack completely, run `pulumi stack rm localstack`.
[1;33m📦 Deploying Pulumi stack...[0m

[0;34m🔄 Previewing update (localstack):[0m
[1;33m[0m
[1;33m@ previewing update........................[0m
[0;32m +  pulumi:pulumi:Stack TapStack-localstack create [0m
[1;33m@ previewing update...........................................[0m
[0;32m +  tap:stack:TapStack pulumi-infra create [0m
[0;32m +  pulumi:pulumi:Stack TapStack-localstack create [0m
[0;35mResources:[0m
[0;32m    + 2 to create[0m
[1;33m[0m
[0;34m🔄 Updating (localstack):[0m
[1;33m[0m
[1;33m@ updating.........................[0m
[0;34m🔄  +  pulumi:pulumi:Stack TapStack-localstack creating (0s) [0m
[1;33m@ updating..................................................[0m
[0;34m🔄  +  tap:stack:TapStack pulumi-infra creating (0s) [0m
[0;32m✅  +  pulumi:pulumi:Stack TapStack-localstack created (46s) [0m
[0;35mResources:[0m
[0;32m✅     + 2 created[0m
[1;33m[0m
[0;35mDuration: 1m9s[0m
[1;33m[0m

[0;32m⏱️  Total deployment time: 1058s[0m
[1;33m🔍 Verifying deployment...[0m
[1;33m📊 Generating stack outputs...[0m
[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json[0m
[1;33mℹ️  No stack outputs defined[0m
[0;36m🎯 Deployment Summary:[0m
[0;34m  • Stack: localstack[0m
[0;34m  • Status: Deployed[0m
[0;34m  • Resources: 2[0m
[0;34m  • Duration: 1058s[0m
[0;34m  • LocalStack: http://localhost:4566[0m
[0;32m🎉 Pulumi deployment to LocalStack completed successfully![0m
[0;32m🎉 Deployment completed successfully![0m
