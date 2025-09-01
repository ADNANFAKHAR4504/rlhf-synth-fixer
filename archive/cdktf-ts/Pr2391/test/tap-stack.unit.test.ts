import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { VpcModule, AlbModule, Route53Module, } from '../lib/module';


// Mock all the modules to isolate the TapStack for unit testing.
jest.mock('../lib/module', () => {
    return {
        VpcModule: jest.fn(() => ({
            vpcIdOutput: 'mock-vpc-id',
            publicSubnetIdsOutput: ['mock-public-subnet-0'],
            privateSubnetIdsOutput: ['mock-private-subnet-0'],
            cidrBlockOutput: '10.0.0.0/16',
        })),
        S3Module: jest.fn(),
        IamModule: jest.fn(() => ({
            instanceProfileName: 'mock-iam-profile-name',
        })),
        Ec2Module: jest.fn(() => ({
            instanceIdOutput: 'mock-instance-id',
            targetGroupArnOutput: 'mock-target-group-arn',
        })),
        AlbModule: jest.fn(() => ({
            albDnsNameOutput: 'mock-alb-dns-name',
            albZoneIdOutput: 'mock-alb-zone-id',
            albSecurityGroupIdOutput: 'mock-alb-security-group-id',
        })),
        RdsModule: jest.fn(() => ({
            dbInstanceIdOutput: 'mock-db-instance-id',
            dbEndpointOutput: 'mock-db-endpoint',
        })),
        Route53Module: jest.fn(),
        CloudwatchModule: jest.fn(),
    };
});

// Mocking AWS resources to prevent real API calls
jest.mock('@cdktf/provider-aws/lib/security-group', () => {
    return {
        SecurityGroup: jest.fn(() => ({
            id: 'mock-security-group-id',
        })),
    };
});
jest.mock('@cdktf/provider-aws/lib/security-group-rule', () => {
    return {
        SecurityGroupRule: jest.fn(),
    };
});
jest.mock('@cdktf/provider-aws/lib/data-aws-ami', () => {
    return {
        DataAwsAmi: jest.fn(() => ({
            id: 'mock-ami-id',
        })),
    };
});

describe('Stack Structure', () => {
    let app: App;
    let stack: TapStack;
    let synthesized: string;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('TapStack instantiates successfully via props', () => {
        app = new App();
        stack = new TapStack(app, 'TestTapStackWithProps', {
            environmentSuffix: 'prod',
            stateBucket: 'custom-state-bucket',
            stateBucketRegion: 'us-west-2',
            awsRegion: 'us-west-2',
            defaultTags: { tags: { Project: 'MyApp' } },
        });
        synthesized = Testing.synth(stack);
        expect(stack).toBeDefined();
        expect(synthesized).toBeDefined();
    });

    test('TapStack uses default values when no props provided', () => {
        app = new App();
        stack = new TapStack(app, 'TestTapStackDefault');
        synthesized = Testing.synth(stack);
        expect(stack).toBeDefined();
        expect(synthesized).toBeDefined();
    });
});

describe('AWS Provider and Backend Configuration', () => {
    let app: App;
    let stack: TapStack;
    let synthesized: string;

    beforeEach(() => {
        app = new App();
        stack = new TapStack(app, 'TestConfig', {
            defaultTags: { tags: { Project: 'TAP', Environment: 'dev', ManagedBy: 'CDKTF' } },
        });
        synthesized = Testing.synth(stack);
    });

    test('should configure the AWS provider with the correct region', () => {
        const parsed = JSON.parse(synthesized);
        expect(parsed.provider.aws[0].region).toBe('us-east-1');
    });

    test('should configure the S3 backend with default values', () => {
        const parsed = JSON.parse(synthesized);
        expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
        expect(parsed.terraform.backend.s3.key).toBe('dev/TestConfig.tfstate');
        expect(parsed.terraform.backend.s3.region).toBe('us-east-1');
        expect(parsed.terraform.backend.s3.encrypt).toBe(true);
        expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });

    test('should use custom state bucket and region when provided', () => {
        app = new App();
        stack = new TapStack(app, 'TestCustomBackend', {
            stateBucket: 'my-custom-bucket',
            stateBucketRegion: 'eu-west-1',
            environmentSuffix: 'staging',
        });
        synthesized = Testing.synth(stack);
        const parsed = JSON.parse(synthesized);
        expect(parsed.terraform.backend.s3.bucket).toBe('my-custom-bucket');
        expect(parsed.terraform.backend.s3.key).toBe('staging/TestCustomBackend.tfstate');
        expect(parsed.terraform.backend.s3.region).toBe('eu-west-1');
    });

    test('should set default tags on the provider', () => {
        const parsed = JSON.parse(synthesized);
        expect(parsed.provider.aws[0].default_tags).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    tags: {
                        Project: 'TAP',
                        Environment: 'dev',
                        ManagedBy: 'CDKTF',
                    },
                }),
            ]),
        );
    });
});

describe('Module Instantiation and Wiring', () => {
    let app: App;
    let stack: TapStack;
    beforeEach(() => {
        jest.clearAllMocks();
        app = new App();
        stack = new TapStack(app, 'TestModule');
        Testing.synth(stack);
    });

    test('should instantiate VpcModule once', () => {
        expect(VpcModule).toHaveBeenCalledTimes(1);
        expect(VpcModule).toHaveBeenCalledWith(
            expect.anything(),
            'main-vpc',
            expect.objectContaining({ name: 'fullstack-app-dev' }),
        );
    });

    

    
});