import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack } from "../lib/tap-stack";

// Get configuration from Pulumi config
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// Get metadata from environment variables for tagging
const repository = process.env.REPOSITORY || "unknown";
const commitAuthor = process.env.COMMIT_AUTHOR || "unknown";
const prNumber = process.env.PR_NUMBER || "unknown";
const team = process.env.TEAM || "unknown";
const createdAt = new Date().toISOString();

// Default tags for all resources
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
    PRNumber: prNumber,
    Team: team,
    CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider("aws", {
    region: process.env.AWS_REGION || "us-east-1",
    defaultTags: {
        tags: defaultTags,
    },
});

// Instantiate the compliance system stack
const stack = new TapStack(
    "compliance-system",
    {
        environmentSuffix: environmentSuffix,
    },
    { provider }
);

// Export stack outputs
export const configRecorderName = stack.configRecorderName;
export const bucketArn = stack.bucketArn;
export const snsTopicArn = stack.snsTopicArn;
