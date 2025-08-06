#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const tap_stack_1 = require("../lib/tap-stack");
const app = new cdk.App();
// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
aws_cdk_lib_1.Tags.of(app).add('Environment', environmentSuffix);
aws_cdk_lib_1.Tags.of(app).add('Repository', repositoryName);
aws_cdk_lib_1.Tags.of(app).add('Author', commitAuthor);
new tap_stack_1.TapStack(app, stackName, {
    stackName: stackName, // This ensures CloudFormation stack name includes the suffix
    environmentSuffix: environmentSuffix, // Pass the suffix to the stack
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
