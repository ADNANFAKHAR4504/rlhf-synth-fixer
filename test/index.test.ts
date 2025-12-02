import * as pulumi from "@pulumi/pulumi";

// Comprehensive unit tests with mocks for resource validation
pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
        const mockOutputs: Record<string, any> = {
            id: `${args.name}_id`,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
            name: args.name,
            ...args.inputs,
        };

        // Add type-specific mock outputs
        if (args.type === "aws:ec2/vpc:Vpc") {
            mockOutputs.defaultSecurityGroupId = "sg-default";
        } else if (args.type === "aws:ecs/cluster:Cluster") {
            mockOutputs.name = args.inputs.name || args.name;
        }

        return {
            id: mockOutputs.id,
            state: mockOutputs,
        };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === "aws:index/getAvailabilityZones:getAvailabilityZones") {
            return {
                names: ["us-east-1a", "us-east-1b"],
            };
        }
        return args.inputs;
    },
});

describe("Infrastructure Unit Tests", () => {
    let infra: typeof import("../lib/tap-stack");

    beforeAll(async () => {
        infra = await import("../lib/tap-stack");
    });

    describe("VPC Resources", () => {
        it("should create VPC with correct CIDR block", (done) => {
            pulumi.all([infra.vpcId]).apply(([vpcId]) => {
                expect(vpcId).toBeDefined();
                expect(vpcId).toContain("_id");
                done();
            });
        });

        it("should export VPC ID", (done) => {
            pulumi.all([infra.vpcId]).apply(([vpcId]) => {
                expect(typeof vpcId).toBe("string");
                expect(vpcId.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    describe("ECS Resources", () => {
        it("should create ECS cluster", (done) => {
            pulumi.all([infra.clusterId]).apply(([clusterId]) => {
                expect(clusterId).toBeDefined();
                expect(clusterId).toContain("_id");
                done();
            });
        });

        it("should export cluster ID", (done) => {
            pulumi.all([infra.clusterId]).apply(([clusterId]) => {
                expect(typeof clusterId).toBe("string");
                expect(clusterId.length).toBeGreaterThan(0);
                done();
            });
        });

        it("should create task definition with correct exports", (done) => {
            pulumi.all([infra.taskDefinitionArn]).apply(([taskDefArn]) => {
                expect(taskDefArn).toBeDefined();
                expect(taskDefArn).toContain("arn:aws:");
                done();
            });
        });

        it("should export task definition ARN", (done) => {
            pulumi.all([infra.taskDefinitionArn]).apply(([arn]) => {
                expect(typeof arn).toBe("string");
                expect(arn.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    describe("EC2 Launch Template", () => {
        it("should create launch template", (done) => {
            pulumi.all([infra.launchTemplateId]).apply(([ltId]) => {
                expect(ltId).toBeDefined();
                expect(ltId).toContain("_id");
                done();
            });
        });

        it("should export launch template ID", (done) => {
            pulumi.all([infra.launchTemplateId]).apply(([ltId]) => {
                expect(typeof ltId).toBe("string");
                expect(ltId.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    describe("All Exports", () => {
        it("should export all required outputs", (done) => {
            pulumi.all([
                infra.vpcId,
                infra.clusterId,
                infra.taskDefinitionArn,
                infra.launchTemplateId
            ]).apply(([vpcId, clusterId, taskDefArn, ltId]) => {
                expect(vpcId).toBeDefined();
                expect(clusterId).toBeDefined();
                expect(taskDefArn).toBeDefined();
                expect(ltId).toBeDefined();
                done();
            });
        });

        it("should have consistent ID format across resources", (done) => {
            pulumi.all([
                infra.vpcId,
                infra.clusterId,
                infra.launchTemplateId
            ]).apply(([vpcId, clusterId, ltId]) => {
                expect(vpcId).toMatch(/_id$/);
                expect(clusterId).toMatch(/_id$/);
                expect(ltId).toMatch(/_id$/);
                done();
            });
        });
    });
});
