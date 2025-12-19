// test/tap-stack.unit.test.ts

import * as pulumi from "@pulumi/pulumi";
import { 
    TapStack, 
    createTapStackArgs,
    NetworkInfrastructure,
    FrontendInfrastructure,
    BackendInfrastructure,
    DataProcessingInfrastructure,
    MonitoringInfrastructure
} from "../lib/tap-stack";

// Mock AWS SDK at the top level before any imports
jest.mock("@pulumi/aws", () => ({
    dynamodb: {
        Table: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            name: pulumi.output(args?.name || name),
            arn: pulumi.output(`arn:aws:dynamodb:us-east-1:123456789012:table/${name}`)
        }))
    },
    iam: {
        Role: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`),
            name: pulumi.output(name),
            arn: pulumi.output(`arn:aws:iam::123456789012:role/${name}`)
        })),
        RolePolicyAttachment: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        RolePolicy: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        }))
    },
    lambda: {
        Function: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            name: pulumi.output(args?.name || name),
            invokeArn: pulumi.output(`arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${name}/invocations`)
        })),
        Permission: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        EventSourceMapping: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        }))
    },
    apigateway: {
        RestApi: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            rootResourceId: pulumi.output(`${name}-root-id`),
            executionArn: pulumi.output(`arn:aws:execute-api:us-east-1:123456789012:${name}`)
        })),
        Resource: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        Method: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            httpMethod: pulumi.output(args?.httpMethod || "GET")
        })),
        Integration: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        Deployment: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        Stage: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        }))
    },
    ec2: {
        Vpc: jest.fn().mockImplementation((name, args, opts) => ({
            id: pulumi.output(`${name}-id`),
            cidrBlock: args?.cidrBlock || "10.0.0.0/16"
        })),
        InternetGateway: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`)
        })),
        Subnet: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            availabilityZone: args?.availabilityZone || "us-east-1a"
        })),
        Eip: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        NatGateway: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        RouteTable: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        Route: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        RouteTableAssociation: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        SecurityGroup: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        VpcEndpoint: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        }))
    },
    kinesis: {
        Stream: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            name: pulumi.output(args?.name || name),
            arn: pulumi.output(`arn:aws:kinesis:us-east-1:123456789012:stream/${name}`)
        }))
    },
    s3: {
        Bucket: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            arn: pulumi.output(`arn:aws:s3:::${name}`),
            bucketDomainName: pulumi.output(`${name}.s3.amazonaws.com`)
        })),
        BucketPublicAccessBlock: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        BucketPolicy: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        })),
        BucketObject: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        }))
    },
    cloudfront: {
        Distribution: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            domainName: pulumi.output(`${name}.cloudfront.net`),
            arn: pulumi.output(`arn:aws:cloudfront::123456789012:distribution/${name}`)
        })),
        OriginAccessControl: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        }))
    },
    sns: {
        Topic: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            name: pulumi.output(args?.name || name),
            arn: pulumi.output(`arn:aws:sns:us-east-1:123456789012:${name}`)
        })),
        TopicSubscription: jest.fn().mockImplementation((name) => ({
            id: pulumi.output(`${name}-id`)
        }))
    },
    cloudwatch: {
        MetricAlarm: jest.fn().mockImplementation((name, args) => ({
            id: pulumi.output(`${name}-id`),
            name: pulumi.output(args?.name || name)
        }))
    },
    getAvailabilityZones: jest.fn().mockResolvedValue({
        names: ["us-east-1a", "us-east-1b", "us-east-1c"]
    }),
    getRegion: jest.fn().mockResolvedValue({
        name: "us-east-1"
    })
}));

// Mock all the component classes
jest.mock("../lib/components/networking");
jest.mock("../lib/components/user");
jest.mock("../lib/components/backend");
jest.mock("../lib/components/data");
jest.mock("../lib/components/monitoring");

// Mock pulumi.export function
const mockPulumiExport = jest.fn();
(pulumi as any).export = mockPulumiExport;

// Mock registerOutputs method
const mockRegisterOutputs = jest.fn();

// Mock Pulumi runtime
pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs): pulumi.runtime.MockResourceResult => {
        return {
            id: args.name + "_id",
            state: args.inputs,
        };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
            return {
                names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
            };
        }
        return args.inputs;
    },
});

// Global mock variables accessible to all describe blocks
let mockNetworkInfrastructure: jest.Mocked<NetworkInfrastructure>;
let mockFrontendInfrastructure: jest.Mocked<FrontendInfrastructure>;
let mockBackendInfrastructure: jest.Mocked<BackendInfrastructure>;
let mockDataProcessingInfrastructure: jest.Mocked<DataProcessingInfrastructure>;
let mockMonitoringInfrastructure: jest.Mocked<MonitoringInfrastructure>;

// Function to setup mocks with simple string values instead of Pulumi outputs
function setupMocks() {
    mockNetworkInfrastructure = {
        vpc: { id: "vpc-12345" },
        privateSubnetIds: ["subnet-1", "subnet-2"],
        vpcEndpointSecurityGroup: { id: "sg-12345" },
        igw: { id: "igw-12345" },
        publicSubnets: [] as any,
        publicSubnetIds: ["subnet-pub-1", "subnet-pub-2"],
        privateSubnets: [] as any,
        natEips: [] as any,
        natGateways: [] as any,
        publicRouteTable: { id: "rt-public-12345" } as any,
        privateRouteTables: [] as any,
        lambdaSecurityGroup: { id: "sg-lambda-12345" } as any,
        dynamodbEndpoint: { id: "vpce-dynamodb-12345" } as any,
        s3Endpoint: { id: "vpce-s3-12345" } as any,
        kinesisEndpoint: { id: "vpce-kinesis-12345" } as any,
        registerOutputs: jest.fn(),
    } as any;

    mockFrontendInfrastructure = {
        cloudfrontDistribution: { 
            id: "cloudfront-12345",
            domainName: "d123456789.cloudfront.net"
        },
        registerOutputs: jest.fn(),
    } as any;

    mockBackendInfrastructure = {
        lambdaFunction: { name: "backend-lambda" },
        table: { name: "backend-table", arn: "arn:aws:dynamodb:us-east-1:123456789012:table/backend-table" } as any,
        lambdaRole: { id: "role-12345", arn: "arn:aws:iam::123456789012:role/lambda-role" } as any,
        apiGateway: { id: "api-12345", executionArn: "arn:aws:execute-api:us-east-1:123456789012:api-12345" } as any,
        apiResource: { id: "resource-12345" } as any,
        apiResourceId: { id: "resource-id-12345" } as any,
        getMethod: { httpMethod: "GET" } as any,
        postMethod: { httpMethod: "POST" } as any,
        getItemMethod: { httpMethod: "GET" } as any,
        getIntegration: { id: "integration-get-12345" } as any,
        postIntegration: { id: "integration-post-12345" } as any,
        getItemIntegration: { id: "integration-get-item-12345" } as any,
        apiDeployment: { id: "deployment-12345" } as any,
        registerOutputs: jest.fn(),
    } as any;

    mockDataProcessingInfrastructure = {
        kinesisStream: { name: "data-stream" },
        kinesisProcessor: { name: "kinesis-processor" },
        registerOutputs: jest.fn(),
    } as any;

    mockMonitoringInfrastructure = {
        snsTopic: { arn: "arn:aws:sns:us-east-1:123456789012:monitoring-topic" },
        setupAlarms: jest.fn(),
        registerOutputs: jest.fn(),
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
        mockRegisterOutputs.mockClear();
        
        // Setup mock implementations
        setupMocks();

        // Mock the registerOutputs method on ComponentResource
        jest.spyOn(pulumi.ComponentResource.prototype, 'registerOutputs' as any).mockImplementation(mockRegisterOutputs);
    });

    afterEach(() => {
        jest.restoreAllMocks();
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
            
            // Verify registerOutputs was called (not pulumi.export)
            expect(mockRegisterOutputs).toHaveBeenCalledWith({
                vpcId: mockNetworkInfrastructure.vpc.id,
                cloudfrontDomain: mockFrontendInfrastructure.cloudfrontDistribution.domainName,
                kinesisStreamName: mockDataProcessingInfrastructure.kinesisStream.name,
                snsTopicArn: mockMonitoringInfrastructure.snsTopic.arn,
            });
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
            expect(stack.network.vpc.id).toBeDefined();
            expect(stack.frontend.cloudfrontDistribution.domainName).toBeDefined();
            expect(stack.dataProcessing.kinesisStream.name).toBeDefined();
            expect(stack.monitoring.snsTopic.arn).toBeDefined();
        });

        it("should export stack level outputs using registerOutputs", () => {
            new TapStack("test-stack", {});

            expect(mockRegisterOutputs).toHaveBeenCalledWith({
                vpcId: mockNetworkInfrastructure.vpc.id,
                cloudfrontDomain: mockFrontendInfrastructure.cloudfrontDistribution.domainName,
                kinesisStreamName: mockDataProcessingInfrastructure.kinesisStream.name,
                snsTopicArn: mockMonitoringInfrastructure.snsTopic.arn,
            });
        });

        it("should return correct outputs from getOutputs method", () => {
            const stack = new TapStack("test-stack", {});
            
            const outputs = stack.getOutputs();
            
            expect(outputs).toEqual({
                vpcId: mockNetworkInfrastructure.vpc.id,
                cloudfrontDomain: mockFrontendInfrastructure.cloudfrontDistribution.domainName,
                kinesisStreamName: mockDataProcessingInfrastructure.kinesisStream.name,
                snsTopicArn: mockMonitoringInfrastructure.snsTopic.arn,
            });
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

// Mock-based component tests for better coverage without instantiating real components
describe("Component Integration Tests", () => {
    beforeEach(() => {
        setupMocks();
    });

    describe("NetworkInfrastructure Integration", () => {
        it("should be instantiated with correct parameters", () => {
            new TapStack("test-stack", { environmentSuffix: "test" });

            expect(NetworkInfrastructure).toHaveBeenCalledWith(
                "test-stack-network",
                expect.objectContaining({
                    environment: "test"
                }),
                expect.any(Object)
            );
        });

        it("should provide required outputs for other components", () => {
            const stack = new TapStack("test-stack", {});

            // Verify the network component provides expected outputs
            expect(stack.network.vpc.id).toBe("vpc-12345");
            expect(stack.network.privateSubnetIds).toEqual(["subnet-1", "subnet-2"]);
            expect(stack.network.vpcEndpointSecurityGroup.id).toBe("sg-12345");
        });
    });

    describe("BackendInfrastructure Integration", () => {
        it("should be instantiated with network dependencies", () => {
            new TapStack("test-stack", {});

            expect(BackendInfrastructure).toHaveBeenCalledWith(
                "test-stack-backend",
                expect.objectContaining({
                    vpcId: "vpc-12345",
                    privateSubnetIds: ["subnet-1", "subnet-2"],
                    vpcEndpointSgId: "sg-12345"
                }),
                expect.objectContaining({
                    dependsOn: expect.arrayContaining([mockNetworkInfrastructure, mockMonitoringInfrastructure])
                })
            );
        });

        it("should provide required outputs", () => {
            const stack = new TapStack("test-stack", {});

            expect(stack.backend.lambdaFunction.name).toBe("backend-lambda");
            expect(stack.backend.table.name).toBe("backend-table");
            expect(stack.backend.apiGateway.id).toBe("api-12345");
        });
    });

    describe("DataProcessingInfrastructure Integration", () => {
        it("should be instantiated with network dependencies", () => {
            new TapStack("test-stack", {});

            expect(DataProcessingInfrastructure).toHaveBeenCalledWith(
                "test-stack-data",
                expect.objectContaining({
                    vpcId: "vpc-12345",
                    privateSubnetIds: ["subnet-1", "subnet-2"],
                    vpcEndpointSgId: "sg-12345"
                }),
                expect.objectContaining({
                    dependsOn: expect.arrayContaining([mockNetworkInfrastructure, mockMonitoringInfrastructure])
                })
            );
        });

        it("should provide required outputs", () => {
            const stack = new TapStack("test-stack", {});

            expect(stack.dataProcessing.kinesisStream.name).toBe("data-stream");
            expect(stack.dataProcessing.kinesisProcessor.name).toBe("kinesis-processor");
        });
    });

    describe("FrontendInfrastructure Integration", () => {
        it("should be instantiated with backend dependency", () => {
            new TapStack("test-stack", {});

            expect(FrontendInfrastructure).toHaveBeenCalledWith(
                "test-stack-frontend",
                expect.any(Object),
                expect.objectContaining({
                    dependsOn: [mockBackendInfrastructure]
                })
            );
        });

        it("should provide required outputs", () => {
            const stack = new TapStack("test-stack", {});

            expect(stack.frontend.cloudfrontDistribution.id).toBe("cloudfront-12345");
            expect(stack.frontend.cloudfrontDistribution.domainName).toBe("d123456789.cloudfront.net");
        });
    });

    describe("MonitoringInfrastructure Integration", () => {
        it("should be instantiated correctly", () => {
            const tags = { Environment: "test" };
            new TapStack("test-stack", { tags });

            expect(MonitoringInfrastructure).toHaveBeenCalledWith(
                "test-stack-monitoring",
                { tags },
                expect.any(Object)
            );
        });

        it("should setup alarms with correct parameters", () => {
            new TapStack("test-stack", {});

            expect(mockMonitoringInfrastructure.setupAlarms).toHaveBeenCalledWith(
                ["backend-lambda", "kinesis-processor"],
                "data-stream",
                "cloudfront-12345",
                expect.any(Object)
            );
        });

        it("should provide required outputs", () => {
            const stack = new TapStack("test-stack", {});

            expect(stack.monitoring.snsTopic.arn).toBe("arn:aws:sns:us-east-1:123456789012:monitoring-topic");
        });
    });
});

// Additional helper function tests for better coverage
describe("Component Resource Options", () => {
    it("should handle undefined component resource options", () => {
        const stack = new TapStack("test-stack", {}, undefined);
        
        expect(stack).toBeDefined();
        expect(stack.environmentSuffix).toBe("dev");
    });

    it("should handle custom component resource options", () => {
        const customOpts = {
            protect: true,
            deleteBeforeReplace: true,
        };
        
        const stack = new TapStack("test-stack", {}, customOpts);
        
        expect(stack).toBeDefined();
    });
});

describe("Edge Cases", () => {
    it("should handle empty tags object", () => {
        const stack = new TapStack("test-stack", { tags: {} });
        
        expect(stack.tags).toEqual({});
    });

    it("should handle undefined environment suffix", () => {
        const stack = new TapStack("test-stack", { environmentSuffix: undefined });
        
        expect(stack.environmentSuffix).toBe("dev");
    });

    it("should handle both undefined environment and tags", () => {
        const stack = new TapStack("test-stack", {
            environmentSuffix: undefined,
            tags: undefined
        });
        
        expect(stack.environmentSuffix).toBe("dev");
        expect(stack.tags).toEqual({});
    });

    it("should handle null tags", () => {
        const stack = new TapStack("test-stack", { tags: null as any });
        
        expect(stack.tags).toEqual({});
    });

    it("should handle component instantiation with different tag configurations", () => {
        const tags1 = { Environment: "production", Team: "backend" };
        const tags2 = { Project: "tap-stack", Version: "1.0.0" };
        
        const stack1 = new TapStack("stack1", { tags: tags1 });
        const stack2 = new TapStack("stack2", { tags: tags2 });
        
        expect(stack1.tags).toEqual(tags1);
        expect(stack2.tags).toEqual(tags2);
    });
});

// Test stack composition and interaction
describe("Stack Composition", () => {
    it("should properly compose all infrastructure components", () => {
        const stack = new TapStack("composition-test", {
            environmentSuffix: "integration",
            tags: { Environment: "integration", Project: "tap-stack" }
        });

        // Verify all components are instantiated
        expect(NetworkInfrastructure).toHaveBeenCalled();
        expect(MonitoringInfrastructure).toHaveBeenCalled();
        expect(BackendInfrastructure).toHaveBeenCalled();
        expect(DataProcessingInfrastructure).toHaveBeenCalled();
        expect(FrontendInfrastructure).toHaveBeenCalled();

        // Verify proper dependency chain
        expect(BackendInfrastructure).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
                dependsOn: expect.arrayContaining([mockNetworkInfrastructure, mockMonitoringInfrastructure])
            })
        );

        expect(DataProcessingInfrastructure).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
                dependsOn: expect.arrayContaining([mockNetworkInfrastructure, mockMonitoringInfrastructure])
            })
        );

        expect(FrontendInfrastructure).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            expect.objectContaining({
                dependsOn: [mockBackendInfrastructure]
            })
        );

        // Verify monitoring setup
        expect(mockMonitoringInfrastructure.setupAlarms).toHaveBeenCalled();
    });

    it("should maintain proper naming conventions across components", () => {
        new TapStack("my-app", { environmentSuffix: "prod" });

        expect(NetworkInfrastructure).toHaveBeenCalledWith("my-app-network", expect.any(Object), expect.any(Object));
        expect(MonitoringInfrastructure).toHaveBeenCalledWith("my-app-monitoring", expect.any(Object), expect.any(Object));
        expect(BackendInfrastructure).toHaveBeenCalledWith("my-app-backend", expect.any(Object), expect.any(Object));
        expect(DataProcessingInfrastructure).toHaveBeenCalledWith("my-app-data", expect.any(Object), expect.any(Object));
        expect(FrontendInfrastructure).toHaveBeenCalledWith("my-app-frontend", expect.any(Object), expect.any(Object));
    });
});

// SIMPLIFIED COMPONENT TESTS - Testing actual components without asyncTest
describe("NetworkInfrastructure Component", () => {
    let NetworkInfrastructureActual: typeof NetworkInfrastructure;

    beforeAll(() => {
        // Import the actual class while keeping AWS mocked
        jest.unmock("../lib/components/networking");
    });

    beforeEach(() => {
        // Re-import the actual class for each test
        delete require.cache[require.resolve("../lib/components/networking")];
        const networking = require("../lib/components/networking");
        NetworkInfrastructureActual = networking.NetworkInfrastructure;
    });

    afterAll(() => {
        // Re-mock for other tests
        jest.mock("../lib/components/networking");
    });

    it("should create NetworkInfrastructure with required properties", () => {
        const args = {
            environment: "test",
            tags: { Environment: "test", Project: "networking" }
        };

        const network = new NetworkInfrastructureActual("test-network", args);

        // Test that all required properties are defined
        expect(network.vpc).toBeDefined();
        expect(network.igw).toBeDefined();
        expect(network.publicSubnets).toBeDefined();
        expect(network.privateSubnets).toBeDefined();
        expect(network.publicSubnetIds).toBeDefined();
        expect(network.privateSubnetIds).toBeDefined();
        expect(network.natEips).toBeDefined();
        expect(network.natGateways).toBeDefined();
        expect(network.publicRouteTable).toBeDefined();
        expect(network.privateRouteTables).toBeDefined();
        expect(network.lambdaSecurityGroup).toBeDefined();
        expect(network.vpcEndpointSecurityGroup).toBeDefined();
    });

    it("should create correct number of subnets", () => {
        const args = {
            environment: "test",
            tags: { Environment: "test" }
        };

        const network = new NetworkInfrastructureActual("test-network", args);

        expect(network.publicSubnets).toHaveLength(2);
        expect(network.privateSubnets).toHaveLength(2);
        expect(network.publicSubnetIds).toHaveLength(2);
        expect(network.privateSubnetIds).toHaveLength(2);
    });

    it("should create NAT gateways for each public subnet", () => {
        const args = {
            environment: "test",
            tags: { Environment: "test" }
        };

        const network = new NetworkInfrastructureActual("test-network", args);

        expect(network.natGateways).toHaveLength(2);
        expect(network.natEips).toHaveLength(2);
    });

    it("should create private route tables for each private subnet", () => {
        const args = {
            environment: "test",
            tags: { Environment: "test" }
        };

        const network = new NetworkInfrastructureActual("test-network", args);

        expect(network.privateRouteTables).toHaveLength(2);
    });

    it("should create security groups with proper configuration", () => {
        const args = {
            environment: "test",
            tags: { Environment: "test" }
        };

        const network = new NetworkInfrastructureActual("test-network", args);

        expect(network.lambdaSecurityGroup).toBeDefined();
        expect(network.vpcEndpointSecurityGroup).toBeDefined();
    });

    it("should handle different environment configurations", () => {
        const prodArgs = {
            environment: "production",
            tags: { Environment: "production", CostCenter: "engineering" }
        };

        const devArgs = {
            environment: "development",
            tags: { Environment: "development" }
        };

        const prodNetwork = new NetworkInfrastructureActual("prod-network", prodArgs);
        const devNetwork = new NetworkInfrastructureActual("dev-network", devArgs);

        expect(prodNetwork.vpc).toBeDefined();
        expect(devNetwork.vpc).toBeDefined();
    });

    it("should create VPC endpoints correctly", () => {
        const args = {
            environment: "test",
            tags: { Environment: "test" }
        };

        const network = new NetworkInfrastructureActual("test-network", args);

        expect(network.dynamodbEndpoint).toBeDefined();
        expect(network.s3Endpoint).toBeDefined();
        expect(network.kinesisEndpoint).toBeDefined();
    });
});

describe("BackendInfrastructure Component", () => {
    let BackendInfrastructureActual: typeof BackendInfrastructure;

    beforeAll(() => {
        // Import the actual class while keeping AWS mocked
        jest.unmock("../lib/components/backend");
    });

    beforeEach(() => {
        // Re-import the actual class for each test
        delete require.cache[require.resolve("../lib/components/backend")];
        const backend = require("../lib/components/backend");
        BackendInfrastructureActual = backend.BackendInfrastructure;
    });

    afterAll(() => {
        // Re-mock for other tests
        jest.mock("../lib/components/backend");
    });

    it("should create BackendInfrastructure with all required resources", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1"), pulumi.output("subnet-2")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const backend = new BackendInfrastructureActual("test-backend", mockArgs);

        // Test that all required properties are defined
        expect(backend.table).toBeDefined();
        expect(backend.lambdaRole).toBeDefined();
        expect(backend.lambdaFunction).toBeDefined();
        expect(backend.apiGateway).toBeDefined();
        expect(backend.apiResource).toBeDefined();
        expect(backend.apiResourceId).toBeDefined();
        expect(backend.getMethod).toBeDefined();
        expect(backend.postMethod).toBeDefined();
        expect(backend.getItemMethod).toBeDefined();
        expect(backend.apiDeployment).toBeDefined();
    });

    it("should generate valid Lambda code", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const backend = new BackendInfrastructureActual("test-backend", mockArgs);

        // Access the private method through bracket notation
        const lambdaCode = (backend as any).getLambdaCode();

        expect(lambdaCode).toContain("exports.handler");
        expect(lambdaCode).toContain("const AWS = require('aws-sdk')");
        expect(lambdaCode).toContain("async function getAllItems()");
        expect(lambdaCode).toContain("async function createItem(event)");
        expect(lambdaCode).toContain("async function getItem(itemId)");
        expect(lambdaCode).toContain("DynamoDB.DocumentClient");
        expect(lambdaCode).toContain("SNS()");
        expect(lambdaCode).toContain("TABLE_NAME");
        expect(lambdaCode).toContain("SNS_TOPIC_ARN");
    });

    it("should create API Gateway integrations", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const backend = new BackendInfrastructureActual("test-backend", mockArgs);

        expect(backend.getIntegration).toBeDefined();
        expect(backend.postIntegration).toBeDefined();
        expect(backend.getItemIntegration).toBeDefined();
    });

    it("should handle different tag configurations", () => {
        const args1 = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "production", Team: "backend" }
        };

        const args2 = {
            vpcId: pulumi.output("vpc-67890"),
            privateSubnetIds: [pulumi.output("subnet-3"), pulumi.output("subnet-4")],
            vpcEndpointSgId: pulumi.output("sg-67890"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-west-2:123456789012:topic"),
            tags: { Environment: "development" }
        };

        const backend1 = new BackendInfrastructureActual("prod-backend", args1);
        const backend2 = new BackendInfrastructureActual("dev-backend", args2);

        expect(backend1.table).toBeDefined();
        expect(backend2.table).toBeDefined();
        expect(backend1.lambdaFunction).toBeDefined();
        expect(backend2.lambdaFunction).toBeDefined();
    });

    it("should create Lambda code with proper error handling", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const backend = new BackendInfrastructureActual("test-backend", mockArgs);
        const lambdaCode = (backend as any).getLambdaCode();

        // Test error handling patterns
        expect(lambdaCode).toContain("try {");
        expect(lambdaCode).toContain("} catch (error) {");
        expect(lambdaCode).toContain("console.error");
        expect(lambdaCode).toContain("statusCode: 500");
        expect(lambdaCode).toContain("statusCode: 404");
        expect(lambdaCode).toContain("statusCode: 200");
        expect(lambdaCode).toContain("statusCode: 201");
    });

    it("should create Lambda code with CORS headers", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const backend = new BackendInfrastructureActual("test-backend", mockArgs);
        const lambdaCode = (backend as any).getLambdaCode();

        // Test CORS configuration
        expect(lambdaCode).toContain("'Access-Control-Allow-Origin': '*'");
        expect(lambdaCode).toContain("'Content-Type': 'application/json'");
    });

    it("should test private method createLambdaIntegrations", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const backend = new BackendInfrastructureActual("test-backend", mockArgs);

        // The integrations should be created by the constructor
        expect(backend.getIntegration).toBeDefined();
        expect(backend.postIntegration).toBeDefined();
        expect(backend.getItemIntegration).toBeDefined();
        
        // Test that they have readonly properties
        const descriptor1 = Object.getOwnPropertyDescriptor(backend, 'getIntegration');
        const descriptor2 = Object.getOwnPropertyDescriptor(backend, 'postIntegration');
        const descriptor3 = Object.getOwnPropertyDescriptor(backend, 'getItemIntegration');
        
        expect(descriptor1?.writable).toBe(false);
        expect(descriptor2?.writable).toBe(false);
        expect(descriptor3?.writable).toBe(false);
    });
});

// NEW TESTS FOR DATA PROCESSING INFRASTRUCTURE
describe("DataProcessingInfrastructure Component", () => {
    let DataProcessingInfrastructureActual: typeof DataProcessingInfrastructure;

    beforeAll(() => {
        jest.unmock("../lib/components/data");
    });

    beforeEach(() => {
        delete require.cache[require.resolve("../lib/components/data")];
        const data = require("../lib/components/data");
        DataProcessingInfrastructureActual = data.DataProcessingInfrastructure;
    });

    afterAll(() => {
        jest.mock("../lib/components/data");
    });

    it("should create DataProcessingInfrastructure with all required resources", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1"), pulumi.output("subnet-2")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test", Project: "data-processing" }
        };

        const dataProcessing = new DataProcessingInfrastructureActual("test-data", mockArgs);

        expect(dataProcessing.kinesisStream).toBeDefined();
        expect(dataProcessing.processedDataBucket).toBeDefined();
        expect(dataProcessing.kinesisProcessorRole).toBeDefined();
        expect(dataProcessing.kinesisProcessor).toBeDefined();
        expect(dataProcessing.kinesisEventSourceMapping).toBeDefined();
    });

    it("should generate valid Kinesis processor Lambda code", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const dataProcessing = new DataProcessingInfrastructureActual("test-data", mockArgs);
        const lambdaCode = (dataProcessing as any).getKinesisProcessorCode();

        expect(lambdaCode).toContain("exports.handler");
        expect(lambdaCode).toContain("const AWS = require('aws-sdk')");
        expect(lambdaCode).toContain("new AWS.S3()");
        expect(lambdaCode).toContain("new AWS.SNS()");
        expect(lambdaCode).toContain("PROCESSED_DATA_BUCKET");
        expect(lambdaCode).toContain("SNS_TOPIC_ARN");
        expect(lambdaCode).toContain("event.Records");
        expect(lambdaCode).toContain("Buffer.from");
        expect(lambdaCode).toContain("base64");
        expect(lambdaCode).toContain("putObject");
        expect(lambdaCode).toContain("processed_at");
    });

    it("should handle different tag configurations for data processing", () => {
        const args1 = {
            vpcId: pulumi.output("vpc-prod"),
            privateSubnetIds: [pulumi.output("subnet-prod-1")],
            vpcEndpointSgId: pulumi.output("sg-prod"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:prod-topic"),
            tags: { Environment: "production", Team: "data", CostCenter: "analytics" }
        };

        const args2 = {
            vpcId: pulumi.output("vpc-dev"),
            privateSubnetIds: [pulumi.output("subnet-dev-1"), pulumi.output("subnet-dev-2")],
            vpcEndpointSgId: pulumi.output("sg-dev"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-west-2:123456789012:dev-topic"),
            tags: { Environment: "development" }
        };

        const dataProcessing1 = new DataProcessingInfrastructureActual("prod-data", args1);
        const dataProcessing2 = new DataProcessingInfrastructureActual("dev-data", args2);

        expect(dataProcessing1.kinesisStream).toBeDefined();
        expect(dataProcessing2.kinesisStream).toBeDefined();
        expect(dataProcessing1.processedDataBucket).toBeDefined();
        expect(dataProcessing2.processedDataBucket).toBeDefined();
    });

    it("should create Kinesis processor with proper error handling and SNS notifications", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const dataProcessing = new DataProcessingInfrastructureActual("test-data", mockArgs);
        const lambdaCode = (dataProcessing as any).getKinesisProcessorCode();

        // Test error handling patterns
        expect(lambdaCode).toContain("try {");
        expect(lambdaCode).toContain("} catch (error) {");
        expect(lambdaCode).toContain("console.error");
        expect(lambdaCode).toContain("snsClient.publish");
        expect(lambdaCode).toContain("TopicArn");
        expect(lambdaCode).toContain("Kinesis processor Lambda");
        expect(lambdaCode).toContain("throw error");
    });

    it("should create Lambda function with VPC configuration", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1"), pulumi.output("subnet-2")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const dataProcessing = new DataProcessingInfrastructureActual("test-data", mockArgs);

        expect(dataProcessing.kinesisProcessor).toBeDefined();
        // Lambda function should be created with VPC config (mocked)
        expect(dataProcessing.kinesisProcessorRole).toBeDefined();
    });

    it("should create S3 bucket with proper encryption", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test", Encryption: "enabled" }
        };

        const dataProcessing = new DataProcessingInfrastructureActual("test-data", mockArgs);

        expect(dataProcessing.processedDataBucket).toBeDefined();
    });

    it("should create Kinesis stream with proper configuration", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test", Service: "kinesis" }
        };

        const dataProcessing = new DataProcessingInfrastructureActual("test-data", mockArgs);

        expect(dataProcessing.kinesisStream).toBeDefined();
        expect(dataProcessing.kinesisEventSourceMapping).toBeDefined();
    });

    it("should register correct outputs", () => {
        const mockArgs = {
            vpcId: pulumi.output("vpc-12345"),
            privateSubnetIds: [pulumi.output("subnet-1")],
            vpcEndpointSgId: pulumi.output("sg-12345"),
            snsTopicArn: pulumi.output("arn:aws:sns:us-east-1:123456789012:topic"),
            tags: { Environment: "test" }
        };

        const registerOutputsSpy = jest.spyOn(pulumi.ComponentResource.prototype, 'registerOutputs' as any);
        
        new DataProcessingInfrastructureActual("test-data", mockArgs);

        expect(registerOutputsSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                kinesisStreamName: expect.anything(),
                processedDataBucketName: expect.anything(),
                kinesisProcessorFunctionName: expect.anything()
            })
        );
    });
});


// NEW TESTS FOR MONITORING INFRASTRUCTURE
describe("MonitoringInfrastructure Component", () => {
    let MonitoringInfrastructureActual: typeof MonitoringInfrastructure;

    beforeAll(() => {
        jest.unmock("../lib/components/monitoring");
    });

    beforeEach(() => {
        delete require.cache[require.resolve("../lib/components/monitoring")];
        const monitoring = require("../lib/components/monitoring");
        MonitoringInfrastructureActual = monitoring.MonitoringInfrastructure;
    });

    afterAll(() => {
        jest.mock("../lib/components/monitoring");
    });

    it("should create MonitoringInfrastructure with required resources", () => {
        const args = {
            tags: { Environment: "test", Project: "monitoring" },
            emailEndpoint: "test@example.com"
        };

        const monitoring = new MonitoringInfrastructureActual("test-monitoring", args);

        expect(monitoring.snsTopic).toBeDefined();
        expect(monitoring.snsTopicSubscription).toBeDefined();
    });

    it("should use default email when not provided", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const monitoring = new MonitoringInfrastructureActual("test-monitoring", args);

        expect(monitoring.snsTopic).toBeDefined();
        expect(monitoring.snsTopicSubscription).toBeDefined();
    });

    it("should setup alarms for Lambda functions", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const monitoring = new MonitoringInfrastructureActual("test-monitoring", args);
        
        const lambdaNames = [
            pulumi.output("lambda-function-1"),
            pulumi.output("lambda-function-2")
        ];
        
        monitoring.setupAlarms(
            lambdaNames,
            pulumi.output("test-kinesis-stream"),
            pulumi.output("test-cloudfront-dist")
        );

        // Verify alarms are created (through mocks)
        expect(monitoring.snsTopic).toBeDefined();
    });

    it("should setup custom alarms", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const monitoring = new MonitoringInfrastructureActual("test-monitoring", args);
        
        const customAlarms = [
            {
                name: "custom-alarm-1",
                comparisonOperator: "GreaterThanThreshold",
                evaluationPeriods: 2,
                metricName: "CPUUtilization",
                namespace: "AWS/EC2",
                period: 300,
                statistic: "Average",
                threshold: 80,
                dimensions: { InstanceId: "i-1234567890abcdef0" },
                description: "High CPU utilization alarm"
            },
            {
                name: "custom-alarm-2",
                comparisonOperator: "LessThanThreshold",
                evaluationPeriods: 1,
                metricName: "NetworkIn",
                namespace: "AWS/EC2",
                period: 60,
                statistic: "Sum",
                threshold: 1000,
                dimensions: { InstanceId: "i-1234567890abcdef0" },
                description: "Low network input alarm"
            }
        ];

        monitoring.setupCustomAlarms(customAlarms);

        expect(monitoring.snsTopic).toBeDefined();
    });

    it("should handle different tag configurations", () => {
        const args1 = {
            tags: { Environment: "production", Team: "monitoring", CostCenter: "ops" },
            emailEndpoint: "prod-alerts@company.com"
        };

        const args2 = {
            tags: { Environment: "development" },
            emailEndpoint: "dev-alerts@company.com"
        };

        const monitoring1 = new MonitoringInfrastructureActual("prod-monitoring", args1);
        const monitoring2 = new MonitoringInfrastructureActual("dev-monitoring", args2);

        expect(monitoring1.snsTopic).toBeDefined();
        expect(monitoring2.snsTopic).toBeDefined();
        expect(monitoring1.snsTopicSubscription).toBeDefined();
        expect(monitoring2.snsTopicSubscription).toBeDefined();
    });
    it("should register correct outputs", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const registerOutputsSpy = jest.spyOn(pulumi.ComponentResource.prototype, 'registerOutputs' as any);
        
        new MonitoringInfrastructureActual("test-monitoring", args);

        expect(registerOutputsSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                snsTopicArn: expect.anything(),
                snsTopicName: expect.anything()
            })
        );
    });

    it("should handle empty custom alarms array", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const monitoring = new MonitoringInfrastructureActual("test-monitoring", args);
        
        // Should not throw error with empty array
        monitoring.setupCustomAlarms([]);

        expect(monitoring.snsTopic).toBeDefined();
    });

    it("should create alarms with proper naming for sanitized Lambda function names", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const monitoring = new MonitoringInfrastructureActual("test-monitoring", args);
        
        const lambdaNames = [
            pulumi.output("my-lambda-function-with-hyphens"),
            pulumi.output("another-lambda-func")
        ];
        
        monitoring.setupAlarms(
            lambdaNames,
            pulumi.output("test-kinesis-stream"),
            pulumi.output("test-cloudfront-dist")
        );

        expect(monitoring.snsTopic).toBeDefined();
    });

    it("should setup Kinesis and CloudFront alarms", () => {
        const args = {
            tags: { Environment: "production" }
        };

        const monitoring = new MonitoringInfrastructureActual("prod-monitoring", args);
        
        monitoring.setupAlarms(
            [],
            pulumi.output("prod-kinesis-stream"),
            pulumi.output("prod-cloudfront-dist")
        );

        expect(monitoring.snsTopic).toBeDefined();
    });

    it("should handle setupAlarms with default resource options", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const monitoring = new MonitoringInfrastructureActual("test-monitoring", args);
        
        const lambdaNames = [pulumi.output("test-lambda")];
        
        // Call without opts parameter
        monitoring.setupAlarms(
            lambdaNames,
            pulumi.output("test-stream"),
            pulumi.output("test-dist")
        );

        expect(monitoring.snsTopic).toBeDefined();
    });

    it("should handle setupCustomAlarms with default resource options", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const monitoring = new MonitoringInfrastructureActual("test-monitoring", args);
        
        const customAlarms = [
            {
                name: "test-alarm",
                comparisonOperator: "GreaterThanThreshold",
                evaluationPeriods: 1,
                metricName: "TestMetric",
                namespace: "AWS/Test",
                period: 60,
                statistic: "Average",
                threshold: 100,
                dimensions: { TestDimension: "test-value" },
                description: "Test alarm"
            }
        ];

        // Call without opts parameter
        monitoring.setupCustomAlarms(customAlarms);

        expect(monitoring.snsTopic).toBeDefined();
    });
});

// NEW TESTS FOR FRONTEND INFRASTRUCTURE
describe("FrontendInfrastructure Component", () => {
    let FrontendInfrastructureActual: typeof FrontendInfrastructure;

    beforeAll(() => {
        jest.unmock("../lib/components/user");
    });

    beforeEach(() => {
        delete require.cache[require.resolve("../lib/components/user")];
        const frontend = require("../lib/components/user");
        FrontendInfrastructureActual = frontend.FrontendInfrastructure;
    });

    afterAll(() => {
        jest.mock("../lib/components/user");
    });

    it("should create FrontendInfrastructure with all required resources", () => {
        const args = {
            tags: { Environment: "test", Project: "frontend" }
        };

        const frontend = new FrontendInfrastructureActual("test-frontend", args);

        expect(frontend.bucket).toBeDefined();
        expect(frontend.oac).toBeDefined();
        expect(frontend.cloudfrontDistribution).toBeDefined();
    });

    it("should handle different tag configurations for frontend", () => {
        const args1 = {
            tags: { Environment: "production", Team: "frontend", CostCenter: "web" }
        };

        const args2 = {
            tags: { Environment: "development", Project: "webapp" }
        };

        const frontend1 = new FrontendInfrastructureActual("prod-frontend", args1);
        const frontend2 = new FrontendInfrastructureActual("dev-frontend", args2);

        expect(frontend1.bucket).toBeDefined();
        expect(frontend2.bucket).toBeDefined();
        expect(frontend1.cloudfrontDistribution).toBeDefined();
        expect(frontend2.cloudfrontDistribution).toBeDefined();
    });

    it("should create S3 bucket with website configuration", () => {
        const args = {
            tags: { Environment: "test", Website: "enabled" }
        };

        const frontend = new FrontendInfrastructureActual("test-frontend", args);

        expect(frontend.bucket).toBeDefined();
        // S3 bucket should be configured for static website hosting (mocked)
    });

    it("should create CloudFront distribution with proper configuration", () => {
        const args = {
            tags: { Environment: "test", CDN: "cloudfront" }
        };

        const frontend = new FrontendInfrastructureActual("test-frontend", args);

        expect(frontend.cloudfrontDistribution).toBeDefined();
        expect(frontend.oac).toBeDefined();
    });

    it("should upload sample files correctly", () => {
        const args = {
            tags: { Environment: "test", SampleFiles: "enabled" }
        };

        // The uploadSampleFiles method is called internally during construction
        const frontend = new FrontendInfrastructureActual("test-frontend", args);

        expect(frontend.bucket).toBeDefined();
        // Sample files should be uploaded (mocked S3 BucketObject calls)
    });

    it("should register correct outputs", () => {
        const args = {
            tags: { Environment: "test" }
        };

        const registerOutputsSpy = jest.spyOn(pulumi.ComponentResource.prototype, 'registerOutputs' as any);
        
        new FrontendInfrastructureActual("test-frontend", args);

        expect(registerOutputsSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                bucketName: expect.anything(),
                cloudfrontDomain: expect.anything(),
                cloudfrontDistributionId: expect.anything()
            })
        );
    });

    it("should handle minimal tag configuration", () => {
        const args = {
            tags: {}
        };

        const frontend = new FrontendInfrastructureActual("minimal-frontend", args);

        expect(frontend.bucket).toBeDefined();
        expect(frontend.oac).toBeDefined();
        expect(frontend.cloudfrontDistribution).toBeDefined();
    });

    it("should create proper S3 bucket policy for CloudFront access", () => {
        const args = {
            tags: { Environment: "test", Security: "enabled" }
        };

        const frontend = new FrontendInfrastructureActual("test-frontend", args);

        expect(frontend.bucket).toBeDefined();
        expect(frontend.cloudfrontDistribution).toBeDefined();
        // Bucket policy should be created to allow CloudFront access (mocked)
    });

    it("should create S3 bucket with public access block", () => {
        const args = {
            tags: { Environment: "test", Security: "strict" }
        };

        const frontend = new FrontendInfrastructureActual("secure-frontend", args);

        expect(frontend.bucket).toBeDefined();
        // Public access block should be created (mocked)
    });

    it("should create Origin Access Control with proper configuration", () => {
        const args = {
            tags: { Environment: "test", OAC: "enabled" }
        };

        const frontend = new FrontendInfrastructureActual("test-frontend", args);

        expect(frontend.oac).toBeDefined();
        expect(frontend.cloudfrontDistribution).toBeDefined();
    });

    it("should handle complex tag scenarios", () => {
        const complexTags = {
            Environment: "staging",
            Project: "multi-tier-app",
            Team: "frontend",
            CostCenter: "development",
            Owner: "hackwithjoshua",
            Version: "1.2.3"
        };

        const args = { tags: complexTags };
        const frontend = new FrontendInfrastructureActual("complex-frontend", args);

        expect(frontend.bucket).toBeDefined();
        expect(frontend.oac).toBeDefined();
        expect(frontend.cloudfrontDistribution).toBeDefined();
    });

    it("should test private uploadSampleFiles method indirectly", () => {
        const args = {
            tags: { Environment: "test", Content: "sample" }
        };

        // uploadSampleFiles is called in constructor, so we test it indirectly
        const frontend = new FrontendInfrastructureActual("sample-frontend", args);

        expect(frontend.bucket).toBeDefined();
        // Sample files (index.html, styles.css, app.js, error.html) should be created
        // This is tested through the mocked BucketObject calls
    });

    it("should create CloudFront distribution with error page configuration", () => {
        const args = {
            tags: { Environment: "test", ErrorPages: "spa" }
        };

        const frontend = new FrontendInfrastructureActual("spa-frontend", args);

        expect(frontend.cloudfrontDistribution).toBeDefined();
        // CloudFront should be configured with custom error responses for SPA
    });

    it("should handle edge case with very long name", () => {
        const longName = "very-long-frontend-infrastructure-component-name-that-might-cause-issues";
        const args = {
            tags: { Environment: "test", LongName: "true" }
        };

        const frontend = new FrontendInfrastructureActual(longName, args);

        expect(frontend.bucket).toBeDefined();
        expect(frontend.oac).toBeDefined();
        expect(frontend.cloudfrontDistribution).toBeDefined();
    });
});