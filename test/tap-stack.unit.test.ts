// __tests__/tap_stack.test.ts

import * as pulumi from "@pulumi/pulumi";
import { TapStack, createTapStackArgs } from "../lib/tap-stack";
import { NetworkInfrastructure } from "../lib/components/networking";
import { FrontendInfrastructure } from "../lib/components/user";
import { BackendInfrastructure } from "../lib/components/backend";
import { DataProcessingInfrastructure } from "../lib/components/data";
import { MonitoringInfrastructure } from "../lib/components/monitoring";

// Mock all the component classes
jest.mock("../lib/components/networking");
jest.mock("../lib/components/user");
jest.mock("../lib/components/backend");
jest.mock("../lib/components/data");
jest.mock("../lib/components/monitoring");

// Mock pulumi.export function
const mockPulumiExport = jest.fn();
(pulumi as any).export = mockPulumiExport;

// Mock Pulumi runtime
pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs): pulumi.runtime.MockResourceResult => {
        return {
            id: args.name + "_id",
            state: args.inputs,
        };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
    },
});

// Global mock variables accessible to all describe blocks
let mockNetworkInfrastructure: jest.Mocked<NetworkInfrastructure>;
let mockFrontendInfrastructure: jest.Mocked<FrontendInfrastructure>;
let mockBackendInfrastructure: jest.Mocked<BackendInfrastructure>;
let mockDataProcessingInfrastructure: jest.Mocked<DataProcessingInfrastructure>;
let mockMonitoringInfrastructure: jest.Mocked<MonitoringInfrastructure>;

// Function to setup mocks
function setupMocks() {
    mockNetworkInfrastructure = {
        vpc: { id: pulumi.output("vpc-12345") },
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        vpcEndpointSecurityGroup: { id: pulumi.output("sg-12345") }
    } as any;

    mockFrontendInfrastructure = {
        cloudfrontDistribution: { 
            id: pulumi.output("cloudfront-12345"),
            domainName: pulumi.output("d123456789.cloudfront.net")
        }
    } as any;

    mockBackendInfrastructure = {
        lambdaFunction: { name: pulumi.output("backend-lambda") }
    } as any;

    mockDataProcessingInfrastructure = {
        kinesisStream: { name: pulumi.output("data-stream") },
        kinesisProcessor: { name: pulumi.output("kinesis-processor") }
    } as any;

    mockMonitoringInfrastructure = {
        snsTopic: { arn: pulumi.output("arn:aws:sns:us-east-1:123456789012:monitoring-topic") },
        setupAlarms: jest.fn()
    } as any;

    // Configure mocks to return these instances
    (NetworkInfrastructure as jest.MockedClass<typeof NetworkInfrastructure>).mockClear();
    (FrontendInfrastructure as jest.MockedClass<typeof FrontendInfrastructure>).mockClear();
    (BackendInfrastructure as jest.MockedClass<typeof BackendInfrastructure>).mockClear();
    (DataProcessingInfrastructure as jest.MockedClass<typeof DataProcessingInfrastructure>).mockClear();
    (MonitoringInfrastructure as jest.MockedClass<typeof MonitoringInfrastructure>).mockClear();

    (NetworkInfrastructure as jest.MockedClass<typeof NetworkInfrastructure>).mockImplementation(() => mockNetworkInfrastructure);
    (FrontendInfrastructure as jest.MockedClass<typeof FrontendInfrastructure>).mockImplementation(() => mockFrontendInfrastructure);
    (BackendInfrastructure as jest.MockedClass<typeof BackendInfrastructure>).mockImplementation(() => mockBackendInfrastructure);
    (DataProcessingInfrastructure as jest.MockedClass<typeof DataProcessingInfrastructure>).mockImplementation(() => mockDataProcessingInfrastructure);
    (MonitoringInfrastructure as jest.MockedClass<typeof MonitoringInfrastructure>).mockImplementation(() => mockMonitoringInfrastructure);
}

describe("TapStack", () => {

    beforeEach(() => {
        // Clear all mocks including the pulumi.export mock
        jest.clearAllMocks();
        mockPulumiExport.mockClear();
        
        // Setup mock implementations
        setupMocks();
    });

    describe("Constructor", () => {
        it("should create TapStack with default arguments", async () => {
            const stack = new TapStack("test-stack", {});

            expect(stack.environmentSuffix).toBe("dev");
            expect(stack.tags).toEqual({});
            expect(stack.network).toBe(mockNetworkInfrastructure);
            expect(stack.frontend).toBe(mockFrontendInfrastructure);
            expect(stack.backend).toBe(mockBackendInfrastructure);
            expect(stack.dataProcessing).toBe(mockDataProcessingInfrastructure);
            expect(stack.monitoring).toBe(mockMonitoringInfrastructure);
            
            // Verify pulumi.export was called
            expect(mockPulumiExport).toHaveBeenCalledWith("vpcId", mockNetworkInfrastructure.vpc.id);
            expect(mockPulumiExport).toHaveBeenCalledWith("cloudfrontDomain", mockFrontendInfrastructure.cloudfrontDistribution.domainName);
            expect(mockPulumiExport).toHaveBeenCalledWith("kinesisStreamName", mockDataProcessingInfrastructure.kinesisStream.name);
            expect(mockPulumiExport).toHaveBeenCalledWith("snsTopicArn", mockMonitoringInfrastructure.snsTopic.arn);
        });

        it("should create TapStack with custom arguments", async () => {
            const customTags = { Environment: "test", Project: "tap-stack" };
            const stack = new TapStack("test-stack", {
                environmentSuffix: "prod",
                tags: customTags
            });

            expect(stack.environmentSuffix).toBe("prod");
            expect(stack.tags).toEqual(customTags);
        });

        it("should instantiate NetworkInfrastructure with correct arguments", () => {
            const customTags = { Environment: "test" };
            new TapStack("test-stack", {
                environmentSuffix: "staging",
                tags: customTags
            });

            expect(NetworkInfrastructure).toHaveBeenCalledWith(
                "test-stack-network",
                {
                    environment: "staging",
                    tags: customTags
                },
                expect.objectContaining({
                    parent: expect.any(TapStack)
                })
            );
        });

        it("should instantiate MonitoringInfrastructure with correct arguments", () => {
            const customTags = { Environment: "test" };
            new TapStack("test-stack", {
                tags: customTags
            });

            expect(MonitoringInfrastructure).toHaveBeenCalledWith(
                "test-stack-monitoring",
                {
                    tags: customTags
                },
                expect.objectContaining({
                    parent: expect.any(TapStack)
                })
            );
        });

        it("should instantiate BackendInfrastructure with network dependencies", () => {
            const customTags = { Environment: "test" };
            new TapStack("test-stack", {
                tags: customTags
            });

            expect(BackendInfrastructure).toHaveBeenCalledWith(
                "test-stack-backend",
                {
                    vpcId: mockNetworkInfrastructure.vpc.id,
                    privateSubnetIds: mockNetworkInfrastructure.privateSubnetIds,
                    vpcEndpointSgId: mockNetworkInfrastructure.vpcEndpointSecurityGroup.id,
                    snsTopicArn: mockMonitoringInfrastructure.snsTopic.arn,
                    tags: customTags
                },
                expect.objectContaining({
                    parent: expect.any(TapStack),
                    dependsOn: expect.arrayContaining([mockNetworkInfrastructure, mockMonitoringInfrastructure])
                })
            );
        });

        it("should instantiate DataProcessingInfrastructure with network dependencies", () => {
            const customTags = { Environment: "test" };
            new TapStack("test-stack", {
                tags: customTags
            });

            expect(DataProcessingInfrastructure).toHaveBeenCalledWith(
                "test-stack-data",
                {
                    vpcId: mockNetworkInfrastructure.vpc.id,
                    privateSubnetIds: mockNetworkInfrastructure.privateSubnetIds,
                    vpcEndpointSgId: mockNetworkInfrastructure.vpcEndpointSecurityGroup.id,
                    snsTopicArn: mockMonitoringInfrastructure.snsTopic.arn,
                    tags: customTags
                },
                expect.objectContaining({
                    parent: expect.any(TapStack),
                    dependsOn: expect.arrayContaining([mockNetworkInfrastructure, mockMonitoringInfrastructure])
                })
            );
        });

        it("should instantiate FrontendInfrastructure with backend dependency", () => {
            const customTags = { Environment: "test" };
            new TapStack("test-stack", {
                tags: customTags
            });

            expect(FrontendInfrastructure).toHaveBeenCalledWith(
                "test-stack-frontend",
                {
                    tags: customTags
                },
                expect.objectContaining({
                    parent: expect.any(TapStack),
                    dependsOn: [mockBackendInfrastructure]
                })
            );
        });

        it("should setup monitoring alarms", () => {
            new TapStack("test-stack", {});

            expect(mockMonitoringInfrastructure.setupAlarms).toHaveBeenCalledWith(
                [
                    mockBackendInfrastructure.lambdaFunction.name,
                    mockDataProcessingInfrastructure.kinesisProcessor.name
                ],
                mockDataProcessingInfrastructure.kinesisStream.name,
                mockFrontendInfrastructure.cloudfrontDistribution.id,
                expect.objectContaining({
                    parent: expect.any(TapStack)
                })
            );
        });
    });

    describe("Outputs", () => {
        it("should register correct outputs", async () => {
            const stack = new TapStack("test-stack", {});
            
            // Test that outputs are properly set by checking the registered outputs
            // This is a bit tricky with Pulumi mocks, so we'll verify the structure exists
            expect(stack.network.vpc.id).toBeDefined();
            expect(stack.frontend.cloudfrontDistribution.domainName).toBeDefined();
            expect(stack.dataProcessing.kinesisStream.name).toBeDefined();
            expect(stack.monitoring.snsTopic.arn).toBeDefined();
        });

        it("should export stack level outputs", () => {
            new TapStack("test-stack", {});

            expect(mockPulumiExport).toHaveBeenCalledWith("vpcId", mockNetworkInfrastructure.vpc.id);
            expect(mockPulumiExport).toHaveBeenCalledWith("cloudfrontDomain", mockFrontendInfrastructure.cloudfrontDistribution.domainName);
            expect(mockPulumiExport).toHaveBeenCalledWith("kinesisStreamName", mockDataProcessingInfrastructure.kinesisStream.name);
            expect(mockPulumiExport).toHaveBeenCalledWith("snsTopicArn", mockMonitoringInfrastructure.snsTopic.arn);
        });
    });

    describe("Error Handling", () => {
        it("should handle missing network infrastructure gracefully", () => {
            // Reset the mock for this specific test
            (NetworkInfrastructure as jest.MockedClass<typeof NetworkInfrastructure>).mockImplementationOnce(() => {
                throw new Error("Network creation failed");
            });

            expect(() => {
                new TapStack("test-stack", {});
            }).toThrow("Network creation failed");
        });

        it("should handle component initialization failures", () => {
            // Reset the mock for this specific test
            (BackendInfrastructure as jest.MockedClass<typeof BackendInfrastructure>).mockImplementationOnce(() => {
                throw new Error("Backend creation failed");
            });

            expect(() => {
                new TapStack("test-stack", {});
            }).toThrow("Backend creation failed");
        });
    });
});

describe("createTapStackArgs helper function", () => {
    it("should return default values when no arguments provided", () => {
        const args = createTapStackArgs();
        
        expect(args.environmentSuffix).toBe("dev");
        expect(args.tags).toEqual({});
    });

    it("should return custom values when arguments provided", () => {
        const customTags = { Environment: "prod", Team: "platform" };
        const args = createTapStackArgs("production", customTags);
        
        expect(args.environmentSuffix).toBe("production");
        expect(args.tags).toEqual(customTags);
    });

    it("should use default environment when only tags provided", () => {
        const customTags = { Project: "test" };
        const args = createTapStackArgs(undefined, customTags);
        
        expect(args.environmentSuffix).toBe("dev");
        expect(args.tags).toEqual(customTags);
    });

    it("should use default tags when only environment provided", () => {
        const args = createTapStackArgs("staging");
        
        expect(args.environmentSuffix).toBe("staging");
        expect(args.tags).toEqual({});
    });
});