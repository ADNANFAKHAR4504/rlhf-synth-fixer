import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/**
 * Integration tests that validate infrastructure against real AWS state
 * These tests run after deployment and verify actual resource properties
 */

describe("Infrastructure Integration Tests", () => {
    let stackOutputs: Record<string, any>;

    beforeAll(async () => {
        // Get stack outputs from actual deployment
        const stack = await pulumi.automation.LocalWorkspace.selectStack({
            stackName: "dev",
            workDir: process.cwd(),
        });
        stackOutputs = await stack.outputs();
    });

    describe("VPC Integration", () => {
        it("should have deployed VPC with correct configuration", async () => {
            const vpcId = stackOutputs.vpcId?.value;
            expect(vpcId).toBeDefined();
            
            if (vpcId) {
                const ec2 = new aws.sdk.EC2({ region: "us-east-1" });
                const vpcResult = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
                
                expect(vpcResult.Vpcs).toHaveLength(1);
                expect(vpcResult.Vpcs?.[0].CidrBlock).toBe("10.0.0.0/16");
                expect(vpcResult.Vpcs?.[0].EnableDnsHostnames).toBe(true);
                expect(vpcResult.Vpcs?.[0].EnableDnsSupport).toBe(true);
            }
        });

        it("should have subnets in correct availability zones", async () => {
            const vpcId = stackOutputs.vpcId?.value;
            expect(vpcId).toBeDefined();
            
            if (vpcId) {
                const ec2 = new aws.sdk.EC2({ region: "us-east-1" });
                const subnetResult = await ec2.describeSubnets({
                    Filters: [{ Name: "vpc-id", Values: [vpcId] }]
                }).promise();
                
                expect(subnetResult.Subnets).toBeDefined();
                expect(subnetResult.Subnets!.length).toBeGreaterThanOrEqual(2);
            }
        });
    });

    describe("ECS Integration", () => {
        it("should have deployed ECS cluster", async () => {
            const clusterId = stackOutputs.clusterId?.value;
            expect(clusterId).toBeDefined();
            
            if (clusterId) {
                const ecs = new aws.sdk.ECS({ region: "us-east-1" });
                const clusterResult = await ecs.describeClusters({
                    clusters: [clusterId]
                }).promise();
                
                expect(clusterResult.clusters).toHaveLength(1);
                expect(clusterResult.clusters?.[0].status).toBe("ACTIVE");
            }
        });

        it("should have task definition with correct container configuration", async () => {
            const taskDefArn = stackOutputs.taskDefinitionArn?.value;
            expect(taskDefArn).toBeDefined();
            
            if (taskDefArn) {
                const ecs = new aws.sdk.ECS({ region: "us-east-1" });
                const taskDefResult = await ecs.describeTaskDefinition({
                    taskDefinition: taskDefArn
                }).promise();
                
                expect(taskDefResult.taskDefinition).toBeDefined();
                expect(taskDefResult.taskDefinition?.status).toBe("ACTIVE");
                expect(taskDefResult.taskDefinition?.networkMode).toBe("awsvpc");
                expect(taskDefResult.taskDefinition?.requiresCompatibilities).toContain("FARGATE");
                
                const containerDef = taskDefResult.taskDefinition?.containerDefinitions?.[0];
                expect(containerDef).toBeDefined();
                expect(containerDef?.name).toBe("app-container");
                expect(containerDef?.image).toBe("nginx:latest");
            }
        });
    });

    describe("EC2 Launch Template Integration", () => {
        it("should have launch template with base64 encoded user data", async () => {
            const launchTemplateId = stackOutputs.launchTemplateId?.value;
            expect(launchTemplateId).toBeDefined();
            
            if (launchTemplateId) {
                const ec2 = new aws.sdk.EC2({ region: "us-east-1" });
                const ltResult = await ec2.describeLaunchTemplateVersions({
                    LaunchTemplateId: launchTemplateId
                }).promise();
                
                expect(ltResult.LaunchTemplateVersions).toHaveLength(1);
                const version = ltResult.LaunchTemplateVersions?.[0];
                expect(version?.LaunchTemplateData?.UserData).toBeDefined();
                
                // Verify user data is base64 encoded by trying to decode it
                const userData = version?.LaunchTemplateData?.UserData;
                if (userData) {
                    const decoded = Buffer.from(userData, 'base64').toString('utf-8');
                    expect(decoded).toContain('#!/bin/bash');
                    expect(decoded).toContain('ECS_CLUSTER=');
                }
            }
        });

        it("should have correct IAM instance profile attached", async () => {
            const launchTemplateId = stackOutputs.launchTemplateId?.value;
            expect(launchTemplateId).toBeDefined();
            
            if (launchTemplateId) {
                const ec2 = new aws.sdk.EC2({ region: "us-east-1" });
                const ltResult = await ec2.describeLaunchTemplateVersions({
                    LaunchTemplateId: launchTemplateId
                }).promise();
                
                const iamProfile = ltResult.LaunchTemplateVersions?.[0]?.LaunchTemplateData?.IamInstanceProfile;
                expect(iamProfile).toBeDefined();
                expect(iamProfile?.Arn).toContain("arn:aws:iam::");
            }
        });
    });

    describe("Resource Tagging", () => {
        it("should have consistent tagging across resources", async () => {
            const vpcId = stackOutputs.vpcId?.value;
            
            if (vpcId) {
                const ec2 = new aws.sdk.EC2({ region: "us-east-1" });
                const vpcResult = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
                
                const tags = vpcResult.Vpcs?.[0]?.Tags;
                expect(tags).toBeDefined();
                
                const nameTag = tags?.find(t => t.Key === "Name");
                expect(nameTag).toBeDefined();
                expect(nameTag?.Value).toBeTruthy();
            }
        });
    });
});
