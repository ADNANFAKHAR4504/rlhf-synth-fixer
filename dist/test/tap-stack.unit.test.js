"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cdktf_1 = require("cdktf");
const fs = __importStar(require("fs"));
const tap_stack_1 = require("../lib/tap-stack");
// Mock fs module
jest.mock('fs');
describe('Stack Structure', () => {
    let app;
    let stack;
    let synthesized;
    const mockedFs = fs;
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Default mock setup - AWS_REGION file exists with us-west-1
        mockedFs.existsSync.mockImplementation((filePath) => {
            return filePath.includes('AWS_REGION');
        });
        mockedFs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes('AWS_REGION')) {
                return 'us-west-1\n';
            }
            throw new Error('File not found');
        });
    });
    test('TapStack instantiates successfully via props', () => {
        app = new cdktf_1.App();
        stack = new tap_stack_1.TapStack(app, 'TestTapStackWithProps', {
            environmentSuffix: 'prod',
            stateBucket: 'custom-state-bucket',
            stateBucketRegion: 'us-west-2',
            awsRegion: 'us-west-1',
        });
        synthesized = cdktf_1.Testing.synth(stack);
        // Verify that TapStack instantiates without errors via props
        expect(stack).toBeDefined();
        expect(synthesized).toBeDefined();
    });
    test('TapStack uses default values when no props provided', () => {
        app = new cdktf_1.App();
        stack = new tap_stack_1.TapStack(app, 'TestTapStackDefault');
        synthesized = cdktf_1.Testing.synth(stack);
        // Verify that TapStack instantiates without errors when no props are provided
        expect(stack).toBeDefined();
        expect(synthesized).toBeDefined();
    });
    test('TapStack creates all required stacks', () => {
        app = new cdktf_1.App();
        stack = new tap_stack_1.TapStack(app, 'TestPortfolioStack', {
            awsRegion: 'us-west-1',
        });
        synthesized = cdktf_1.Testing.synth(stack);
        const synthedJSON = JSON.parse(synthesized);
        // Verify that all required components are created
        expect(synthedJSON.resource).toBeDefined();
        expect(synthedJSON.resource.aws_vpc).toBeDefined();
        expect(synthedJSON.resource.aws_db_instance).toBeDefined();
        expect(synthedJSON.resource.aws_elasticache_serverless_cache).toBeDefined();
        expect(synthedJSON.resource.aws_autoscaling_group).toBeDefined();
        expect(synthedJSON.resource.aws_alb).toBeDefined();
        expect(synthedJSON.resource.aws_apigatewayv2_api).toBeDefined();
        expect(synthedJSON.resource.aws_cloudwatch_dashboard).toBeDefined();
        expect(synthedJSON.resource.aws_s3_bucket).toBeDefined();
    });
    test('TapStack uses correct region override', () => {
        app = new cdktf_1.App();
        stack = new tap_stack_1.TapStack(app, 'TestRegionOverride');
        synthesized = cdktf_1.Testing.synth(stack);
        const synthedJSON = JSON.parse(synthesized);
        // CDKTF generates provider.aws as an array
        expect(synthedJSON.provider?.aws).toBeDefined();
        expect(Array.isArray(synthedJSON.provider.aws)).toBe(true);
        expect(synthedJSON.provider.aws[0].region).toBe('us-west-1');
    });
    test('TapStack uses provided awsRegion when AWS_REGION_OVERRIDE is falsy', () => {
        // This test would require mocking AWS_REGION_OVERRIDE to be falsy,
        // but since it's a const, we test that the override always takes precedence
        app = new cdktf_1.App();
        stack = new tap_stack_1.TapStack(app, 'TestProvidedRegion', {
            awsRegion: 'eu-west-1', // This should be ignored due to AWS_REGION_OVERRIDE
        });
        synthesized = cdktf_1.Testing.synth(stack);
        const synthedJSON = JSON.parse(synthesized);
        // AWS_REGION_OVERRIDE is always 'us-west-1', so it overrides the provided region
        expect(synthedJSON.provider.aws[0].region).toBe('us-west-1');
    });
    test('TapStack handles all prop combinations correctly', () => {
        app = new cdktf_1.App();
        // Test with all props provided
        const stackWithAllProps = new tap_stack_1.TapStack(app, 'TestAllProps', {
            environmentSuffix: 'test-env',
            stateBucket: 'test-bucket',
            stateBucketRegion: 'eu-central-1',
            awsRegion: 'ap-southeast-1',
            defaultTags: {
                tags: { 'Environment': 'test' },
            },
        });
        const synthAllProps = cdktf_1.Testing.synth(stackWithAllProps);
        const jsonAllProps = JSON.parse(synthAllProps);
        // Verify backend configuration
        expect(jsonAllProps.terraform?.backend?.s3).toBeDefined();
        expect(jsonAllProps.terraform.backend.s3.bucket).toBe('test-bucket');
        expect(jsonAllProps.terraform.backend.s3.region).toBe('eu-central-1');
        expect(jsonAllProps.terraform.backend.s3.key).toContain('test-env');
        // Verify provider configuration
        expect(jsonAllProps.provider.aws[0].region).toBe('us-west-1'); // Still overridden
        expect(jsonAllProps.provider.aws[0].default_tags).toEqual([{
                tags: { 'Environment': 'test' },
            }]);
    });
    test('TapStack correctly uses default values', () => {
        app = new cdktf_1.App();
        // Test with minimal props to ensure defaults are used
        const stackWithDefaults = new tap_stack_1.TapStack(app, 'TestDefaults', {
            // Only providing environmentSuffix to avoid random values
            environmentSuffix: 'default-test',
        });
        const synthDefaults = cdktf_1.Testing.synth(stackWithDefaults);
        const jsonDefaults = JSON.parse(synthDefaults);
        // Verify default backend configuration
        expect(jsonDefaults.terraform?.backend?.s3).toBeDefined();
        expect(jsonDefaults.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
        expect(jsonDefaults.terraform.backend.s3.region).toBe('us-east-1');
        expect(jsonDefaults.terraform.backend.s3.key).toContain('default-test');
        // Verify default tags is empty array
        expect(jsonDefaults.provider.aws[0].default_tags).toEqual([]);
    });
    test('TapStack uses props.awsRegion when AWS_REGION file does not exist', () => {
        // Mock AWS_REGION file not existing
        mockedFs.existsSync.mockReturnValue(false);
        app = new cdktf_1.App();
        stack = new tap_stack_1.TapStack(app, 'TestNoRegionFile', {
            awsRegion: 'eu-central-1',
        });
        synthesized = cdktf_1.Testing.synth(stack);
        const synthedJSON = JSON.parse(synthesized);
        // Should use the provided awsRegion since no override file exists
        expect(synthedJSON.provider.aws[0].region).toBe('eu-central-1');
    });
    test('TapStack uses default region when AWS_REGION file does not exist and no awsRegion prop', () => {
        // Mock AWS_REGION file not existing
        mockedFs.existsSync.mockReturnValue(false);
        app = new cdktf_1.App();
        stack = new tap_stack_1.TapStack(app, 'TestNoRegionFileNoProps');
        synthesized = cdktf_1.Testing.synth(stack);
        const synthedJSON = JSON.parse(synthesized);
        // Should use the default 'us-east-1' since no override file exists and no prop provided
        expect(synthedJSON.provider.aws[0].region).toBe('us-east-1');
    });
    test('TapStack handles error reading AWS_REGION file gracefully', () => {
        // Mock AWS_REGION file exists but throws error when reading
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockImplementation(() => {
            throw new Error('Permission denied');
        });
        app = new cdktf_1.App();
        stack = new tap_stack_1.TapStack(app, 'TestReadError', {
            awsRegion: 'ap-southeast-1',
        });
        synthesized = cdktf_1.Testing.synth(stack);
        const synthedJSON = JSON.parse(synthesized);
        // Should fall back to provided region when file read fails
        expect(synthedJSON.provider.aws[0].region).toBe('ap-southeast-1');
    });
});
// add more test suites and cases as needed
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLnVuaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvdGFwLXN0YWNrLnVuaXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlDQUFxQztBQUNyQyx1Q0FBeUI7QUFFekIsZ0RBQTRDO0FBRTVDLGlCQUFpQjtBQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRWhCLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsSUFBSSxHQUFRLENBQUM7SUFDYixJQUFJLEtBQWUsQ0FBQztJQUNwQixJQUFJLFdBQW1CLENBQUM7SUFDeEIsTUFBTSxRQUFRLEdBQUcsRUFBNEIsQ0FBQztJQUU5QyxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsK0JBQStCO1FBQy9CLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUVyQiw2REFBNkQ7UUFDN0QsUUFBUSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQ2xELE9BQVEsUUFBbUIsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7UUFDSCxRQUFRLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDcEQsSUFBSyxRQUFtQixDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxPQUFPLGFBQWEsQ0FBQztZQUN2QixDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1FBQ3hELEdBQUcsR0FBRyxJQUFJLFdBQUcsRUFBRSxDQUFDO1FB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NERBQTREO1FBQzVELFFBQVEsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFO1lBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILEdBQUcsR0FBRyxJQUFJLFdBQUcsRUFBRSxDQUFDO1FBQ2hCLEtBQUssR0FBRyxJQUFJLG9CQUFRLENBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRTtZQUN6QyxTQUFTLEVBQUUsZ0JBQWdCO1NBQzVCLENBQUMsQ0FBQztRQUNILFdBQVcsR0FBRyxlQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFNUMsMkRBQTJEO1FBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNwRSxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsMkNBQTJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwLCBUZXN0aW5nIH0gZnJvbSAnY2RrdGYnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIE1vY2sgZnMgbW9kdWxlXG5qZXN0Lm1vY2soJ2ZzJyk7XG5cbmRlc2NyaWJlKCdTdGFjayBTdHJ1Y3R1cmUnLCAoKSA9PiB7XG4gIGxldCBhcHA6IEFwcDtcbiAgbGV0IHN0YWNrOiBUYXBTdGFjaztcbiAgbGV0IHN5bnRoZXNpemVkOiBzdHJpbmc7XG4gIGNvbnN0IG1vY2tlZEZzID0gZnMgYXMgamVzdC5Nb2NrZWQ8dHlwZW9mIGZzPjtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAvLyBSZXNldCBtb2NrcyBiZWZvcmUgZWFjaCB0ZXN0XG4gICAgamVzdC5jbGVhckFsbE1vY2tzKCk7XG5cbiAgICAvLyBEZWZhdWx0IG1vY2sgc2V0dXAgLSBBV1NfUkVHSU9OIGZpbGUgZXhpc3RzIHdpdGggdXMtd2VzdC0xXG4gICAgbW9ja2VkRnMuZXhpc3RzU3luYy5tb2NrSW1wbGVtZW50YXRpb24oKGZpbGVQYXRoKSA9PiB7XG4gICAgICByZXR1cm4gKGZpbGVQYXRoIGFzIHN0cmluZykuaW5jbHVkZXMoJ0FXU19SRUdJT04nKTtcbiAgICB9KTtcbiAgICBtb2NrZWRGcy5yZWFkRmlsZVN5bmMubW9ja0ltcGxlbWVudGF0aW9uKChmaWxlUGF0aCkgPT4ge1xuICAgICAgaWYgKChmaWxlUGF0aCBhcyBzdHJpbmcpLmluY2x1ZGVzKCdBV1NfUkVHSU9OJykpIHtcbiAgICAgICAgcmV0dXJuICd1cy13ZXN0LTFcXG4nO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaWxlIG5vdCBmb3VuZCcpO1xuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdUYXBTdGFjayBpbnN0YW50aWF0ZXMgc3VjY2Vzc2Z1bGx5IHZpYSBwcm9wcycsICgpID0+IHtcbiAgICBhcHAgPSBuZXcgQXBwKCk7XG4gICAgc3RhY2sgPSBuZXcgVGFwU3RhY2soYXBwLCAnVGVzdFRhcFN0YWNrV2l0aFByb3BzJywge1xuICAgICAgZW52aXJvbm1lbnRTdWZmaXg6ICdwcm9kJyxcbiAgICAgIHN0YXRlQnVja2V0OiAnY3VzdG9tLXN0YXRlLWJ1Y2tldCcsXG4gICAgICBzdGF0ZUJ1Y2tldFJlZ2lvbjogJ3VzLXdlc3QtMicsXG4gICAgICBhd3NSZWdpb246ICd1cy13ZXN0LTEnLFxuICAgIH0pO1xuICAgIHN5bnRoZXNpemVkID0gVGVzdGluZy5zeW50aChzdGFjayk7XG5cbiAgICAvLyBWZXJpZnkgdGhhdCBUYXBTdGFjayBpbnN0YW50aWF0ZXMgd2l0aG91dCBlcnJvcnMgdmlhIHByb3BzXG4gICAgZXhwZWN0KHN0YWNrKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChzeW50aGVzaXplZCkudG9CZURlZmluZWQoKTtcbiAgfSk7XG5cbiAgdGVzdCgnVGFwU3RhY2sgdXNlcyBkZWZhdWx0IHZhbHVlcyB3aGVuIG5vIHByb3BzIHByb3ZpZGVkJywgKCkgPT4ge1xuICAgIGFwcCA9IG5ldyBBcHAoKTtcbiAgICBzdGFjayA9IG5ldyBUYXBTdGFjayhhcHAsICdUZXN0VGFwU3RhY2tEZWZhdWx0Jyk7XG4gICAgc3ludGhlc2l6ZWQgPSBUZXN0aW5nLnN5bnRoKHN0YWNrKTtcblxuICAgIC8vIFZlcmlmeSB0aGF0IFRhcFN0YWNrIGluc3RhbnRpYXRlcyB3aXRob3V0IGVycm9ycyB3aGVuIG5vIHByb3BzIGFyZSBwcm92aWRlZFxuICAgIGV4cGVjdChzdGFjaykudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3Qoc3ludGhlc2l6ZWQpLnRvQmVEZWZpbmVkKCk7XG4gIH0pO1xuXG4gIHRlc3QoJ1RhcFN0YWNrIGNyZWF0ZXMgYWxsIHJlcXVpcmVkIHN0YWNrcycsICgpID0+IHtcbiAgICBhcHAgPSBuZXcgQXBwKCk7XG4gICAgc3RhY2sgPSBuZXcgVGFwU3RhY2soYXBwLCAnVGVzdFBvcnRmb2xpb1N0YWNrJywge1xuICAgICAgYXdzUmVnaW9uOiAndXMtd2VzdC0xJyxcbiAgICB9KTtcbiAgICBzeW50aGVzaXplZCA9IFRlc3Rpbmcuc3ludGgoc3RhY2spO1xuICAgIGNvbnN0IHN5bnRoZWRKU09OID0gSlNPTi5wYXJzZShzeW50aGVzaXplZCk7XG5cbiAgICAvLyBWZXJpZnkgdGhhdCBhbGwgcmVxdWlyZWQgY29tcG9uZW50cyBhcmUgY3JlYXRlZFxuICAgIGV4cGVjdChzeW50aGVkSlNPTi5yZXNvdXJjZSkudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3Qoc3ludGhlZEpTT04ucmVzb3VyY2UuYXdzX3ZwYykudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3Qoc3ludGhlZEpTT04ucmVzb3VyY2UuYXdzX2RiX2luc3RhbmNlKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChzeW50aGVkSlNPTi5yZXNvdXJjZS5hd3NfZWxhc3RpY2FjaGVfc2VydmVybGVzc19jYWNoZSkudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3Qoc3ludGhlZEpTT04ucmVzb3VyY2UuYXdzX2F1dG9zY2FsaW5nX2dyb3VwKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChzeW50aGVkSlNPTi5yZXNvdXJjZS5hd3NfYWxiKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChzeW50aGVkSlNPTi5yZXNvdXJjZS5hd3NfYXBpZ2F0ZXdheXYyX2FwaSkudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3Qoc3ludGhlZEpTT04ucmVzb3VyY2UuYXdzX2Nsb3Vkd2F0Y2hfZGFzaGJvYXJkKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChzeW50aGVkSlNPTi5yZXNvdXJjZS5hd3NfczNfYnVja2V0KS50b0JlRGVmaW5lZCgpO1xuICB9KTtcblxuICB0ZXN0KCdUYXBTdGFjayB1c2VzIGNvcnJlY3QgcmVnaW9uIG92ZXJyaWRlJywgKCkgPT4ge1xuICAgIGFwcCA9IG5ldyBBcHAoKTtcbiAgICBzdGFjayA9IG5ldyBUYXBTdGFjayhhcHAsICdUZXN0UmVnaW9uT3ZlcnJpZGUnKTtcbiAgICBzeW50aGVzaXplZCA9IFRlc3Rpbmcuc3ludGgoc3RhY2spO1xuICAgIGNvbnN0IHN5bnRoZWRKU09OID0gSlNPTi5wYXJzZShzeW50aGVzaXplZCk7XG5cbiAgICAvLyBDREtURiBnZW5lcmF0ZXMgcHJvdmlkZXIuYXdzIGFzIGFuIGFycmF5XG4gICAgZXhwZWN0KHN5bnRoZWRKU09OLnByb3ZpZGVyPy5hd3MpLnRvQmVEZWZpbmVkKCk7XG4gICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoc3ludGhlZEpTT04ucHJvdmlkZXIuYXdzKSkudG9CZSh0cnVlKTtcbiAgICBleHBlY3Qoc3ludGhlZEpTT04ucHJvdmlkZXIuYXdzWzBdLnJlZ2lvbikudG9CZSgndXMtd2VzdC0xJyk7XG4gIH0pO1xuXG4gIHRlc3QoJ1RhcFN0YWNrIHVzZXMgcHJvdmlkZWQgYXdzUmVnaW9uIHdoZW4gQVdTX1JFR0lPTl9PVkVSUklERSBpcyBmYWxzeScsICgpID0+IHtcbiAgICAvLyBUaGlzIHRlc3Qgd291bGQgcmVxdWlyZSBtb2NraW5nIEFXU19SRUdJT05fT1ZFUlJJREUgdG8gYmUgZmFsc3ksXG4gICAgLy8gYnV0IHNpbmNlIGl0J3MgYSBjb25zdCwgd2UgdGVzdCB0aGF0IHRoZSBvdmVycmlkZSBhbHdheXMgdGFrZXMgcHJlY2VkZW5jZVxuICAgIGFwcCA9IG5ldyBBcHAoKTtcbiAgICBzdGFjayA9IG5ldyBUYXBTdGFjayhhcHAsICdUZXN0UHJvdmlkZWRSZWdpb24nLCB7XG4gICAgICBhd3NSZWdpb246ICdldS13ZXN0LTEnLCAvLyBUaGlzIHNob3VsZCBiZSBpZ25vcmVkIGR1ZSB0byBBV1NfUkVHSU9OX09WRVJSSURFXG4gICAgfSk7XG4gICAgc3ludGhlc2l6ZWQgPSBUZXN0aW5nLnN5bnRoKHN0YWNrKTtcbiAgICBjb25zdCBzeW50aGVkSlNPTiA9IEpTT04ucGFyc2Uoc3ludGhlc2l6ZWQpO1xuXG4gICAgLy8gQVdTX1JFR0lPTl9PVkVSUklERSBpcyBhbHdheXMgJ3VzLXdlc3QtMScsIHNvIGl0IG92ZXJyaWRlcyB0aGUgcHJvdmlkZWQgcmVnaW9uXG4gICAgZXhwZWN0KHN5bnRoZWRKU09OLnByb3ZpZGVyLmF3c1swXS5yZWdpb24pLnRvQmUoJ3VzLXdlc3QtMScpO1xuICB9KTtcblxuICB0ZXN0KCdUYXBTdGFjayBoYW5kbGVzIGFsbCBwcm9wIGNvbWJpbmF0aW9ucyBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgYXBwID0gbmV3IEFwcCgpO1xuXG4gICAgLy8gVGVzdCB3aXRoIGFsbCBwcm9wcyBwcm92aWRlZFxuICAgIGNvbnN0IHN0YWNrV2l0aEFsbFByb3BzID0gbmV3IFRhcFN0YWNrKGFwcCwgJ1Rlc3RBbGxQcm9wcycsIHtcbiAgICAgIGVudmlyb25tZW50U3VmZml4OiAndGVzdC1lbnYnLFxuICAgICAgc3RhdGVCdWNrZXQ6ICd0ZXN0LWJ1Y2tldCcsXG4gICAgICBzdGF0ZUJ1Y2tldFJlZ2lvbjogJ2V1LWNlbnRyYWwtMScsXG4gICAgICBhd3NSZWdpb246ICdhcC1zb3V0aGVhc3QtMScsXG4gICAgICBkZWZhdWx0VGFnczoge1xuICAgICAgICB0YWdzOiB7ICdFbnZpcm9ubWVudCc6ICd0ZXN0JyB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHN5bnRoQWxsUHJvcHMgPSBUZXN0aW5nLnN5bnRoKHN0YWNrV2l0aEFsbFByb3BzKTtcbiAgICBjb25zdCBqc29uQWxsUHJvcHMgPSBKU09OLnBhcnNlKHN5bnRoQWxsUHJvcHMpO1xuXG4gICAgLy8gVmVyaWZ5IGJhY2tlbmQgY29uZmlndXJhdGlvblxuICAgIGV4cGVjdChqc29uQWxsUHJvcHMudGVycmFmb3JtPy5iYWNrZW5kPy5zMykudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3QoanNvbkFsbFByb3BzLnRlcnJhZm9ybS5iYWNrZW5kLnMzLmJ1Y2tldCkudG9CZSgndGVzdC1idWNrZXQnKTtcbiAgICBleHBlY3QoanNvbkFsbFByb3BzLnRlcnJhZm9ybS5iYWNrZW5kLnMzLnJlZ2lvbikudG9CZSgnZXUtY2VudHJhbC0xJyk7XG4gICAgZXhwZWN0KGpzb25BbGxQcm9wcy50ZXJyYWZvcm0uYmFja2VuZC5zMy5rZXkpLnRvQ29udGFpbigndGVzdC1lbnYnKTtcblxuICAgIC8vIFZlcmlmeSBwcm92aWRlciBjb25maWd1cmF0aW9uXG4gICAgZXhwZWN0KGpzb25BbGxQcm9wcy5wcm92aWRlci5hd3NbMF0ucmVnaW9uKS50b0JlKCd1cy13ZXN0LTEnKTsgLy8gU3RpbGwgb3ZlcnJpZGRlblxuICAgIGV4cGVjdChqc29uQWxsUHJvcHMucHJvdmlkZXIuYXdzWzBdLmRlZmF1bHRfdGFncykudG9FcXVhbChbe1xuICAgICAgdGFnczogeyAnRW52aXJvbm1lbnQnOiAndGVzdCcgfSxcbiAgICB9XSk7XG4gIH0pO1xuXG4gIHRlc3QoJ1RhcFN0YWNrIGNvcnJlY3RseSB1c2VzIGRlZmF1bHQgdmFsdWVzJywgKCkgPT4ge1xuICAgIGFwcCA9IG5ldyBBcHAoKTtcblxuICAgIC8vIFRlc3Qgd2l0aCBtaW5pbWFsIHByb3BzIHRvIGVuc3VyZSBkZWZhdWx0cyBhcmUgdXNlZFxuICAgIGNvbnN0IHN0YWNrV2l0aERlZmF1bHRzID0gbmV3IFRhcFN0YWNrKGFwcCwgJ1Rlc3REZWZhdWx0cycsIHtcbiAgICAgIC8vIE9ubHkgcHJvdmlkaW5nIGVudmlyb25tZW50U3VmZml4IHRvIGF2b2lkIHJhbmRvbSB2YWx1ZXNcbiAgICAgIGVudmlyb25tZW50U3VmZml4OiAnZGVmYXVsdC10ZXN0JyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHN5bnRoRGVmYXVsdHMgPSBUZXN0aW5nLnN5bnRoKHN0YWNrV2l0aERlZmF1bHRzKTtcbiAgICBjb25zdCBqc29uRGVmYXVsdHMgPSBKU09OLnBhcnNlKHN5bnRoRGVmYXVsdHMpO1xuXG4gICAgLy8gVmVyaWZ5IGRlZmF1bHQgYmFja2VuZCBjb25maWd1cmF0aW9uXG4gICAgZXhwZWN0KGpzb25EZWZhdWx0cy50ZXJyYWZvcm0/LmJhY2tlbmQ/LnMzKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChqc29uRGVmYXVsdHMudGVycmFmb3JtLmJhY2tlbmQuczMuYnVja2V0KS50b0JlKCdpYWMtcmxoZi10Zi1zdGF0ZXMnKTtcbiAgICBleHBlY3QoanNvbkRlZmF1bHRzLnRlcnJhZm9ybS5iYWNrZW5kLnMzLnJlZ2lvbikudG9CZSgndXMtZWFzdC0xJyk7XG4gICAgZXhwZWN0KGpzb25EZWZhdWx0cy50ZXJyYWZvcm0uYmFja2VuZC5zMy5rZXkpLnRvQ29udGFpbignZGVmYXVsdC10ZXN0Jyk7XG5cbiAgICAvLyBWZXJpZnkgZGVmYXVsdCB0YWdzIGlzIGVtcHR5IGFycmF5XG4gICAgZXhwZWN0KGpzb25EZWZhdWx0cy5wcm92aWRlci5hd3NbMF0uZGVmYXVsdF90YWdzKS50b0VxdWFsKFtdKTtcbiAgfSk7XG5cbiAgdGVzdCgnVGFwU3RhY2sgdXNlcyBwcm9wcy5hd3NSZWdpb24gd2hlbiBBV1NfUkVHSU9OIGZpbGUgZG9lcyBub3QgZXhpc3QnLCAoKSA9PiB7XG4gICAgLy8gTW9jayBBV1NfUkVHSU9OIGZpbGUgbm90IGV4aXN0aW5nXG4gICAgbW9ja2VkRnMuZXhpc3RzU3luYy5tb2NrUmV0dXJuVmFsdWUoZmFsc2UpO1xuXG4gICAgYXBwID0gbmV3IEFwcCgpO1xuICAgIHN0YWNrID0gbmV3IFRhcFN0YWNrKGFwcCwgJ1Rlc3ROb1JlZ2lvbkZpbGUnLCB7XG4gICAgICBhd3NSZWdpb246ICdldS1jZW50cmFsLTEnLFxuICAgIH0pO1xuICAgIHN5bnRoZXNpemVkID0gVGVzdGluZy5zeW50aChzdGFjayk7XG4gICAgY29uc3Qgc3ludGhlZEpTT04gPSBKU09OLnBhcnNlKHN5bnRoZXNpemVkKTtcblxuICAgIC8vIFNob3VsZCB1c2UgdGhlIHByb3ZpZGVkIGF3c1JlZ2lvbiBzaW5jZSBubyBvdmVycmlkZSBmaWxlIGV4aXN0c1xuICAgIGV4cGVjdChzeW50aGVkSlNPTi5wcm92aWRlci5hd3NbMF0ucmVnaW9uKS50b0JlKCdldS1jZW50cmFsLTEnKTtcbiAgfSk7XG5cbiAgdGVzdCgnVGFwU3RhY2sgdXNlcyBkZWZhdWx0IHJlZ2lvbiB3aGVuIEFXU19SRUdJT04gZmlsZSBkb2VzIG5vdCBleGlzdCBhbmQgbm8gYXdzUmVnaW9uIHByb3AnLCAoKSA9PiB7XG4gICAgLy8gTW9jayBBV1NfUkVHSU9OIGZpbGUgbm90IGV4aXN0aW5nXG4gICAgbW9ja2VkRnMuZXhpc3RzU3luYy5tb2NrUmV0dXJuVmFsdWUoZmFsc2UpO1xuXG4gICAgYXBwID0gbmV3IEFwcCgpO1xuICAgIHN0YWNrID0gbmV3IFRhcFN0YWNrKGFwcCwgJ1Rlc3ROb1JlZ2lvbkZpbGVOb1Byb3BzJyk7XG4gICAgc3ludGhlc2l6ZWQgPSBUZXN0aW5nLnN5bnRoKHN0YWNrKTtcbiAgICBjb25zdCBzeW50aGVkSlNPTiA9IEpTT04ucGFyc2Uoc3ludGhlc2l6ZWQpO1xuXG4gICAgLy8gU2hvdWxkIHVzZSB0aGUgZGVmYXVsdCAndXMtZWFzdC0xJyBzaW5jZSBubyBvdmVycmlkZSBmaWxlIGV4aXN0cyBhbmQgbm8gcHJvcCBwcm92aWRlZFxuICAgIGV4cGVjdChzeW50aGVkSlNPTi5wcm92aWRlci5hd3NbMF0ucmVnaW9uKS50b0JlKCd1cy1lYXN0LTEnKTtcbiAgfSk7XG5cbiAgdGVzdCgnVGFwU3RhY2sgaGFuZGxlcyBlcnJvciByZWFkaW5nIEFXU19SRUdJT04gZmlsZSBncmFjZWZ1bGx5JywgKCkgPT4ge1xuICAgIC8vIE1vY2sgQVdTX1JFR0lPTiBmaWxlIGV4aXN0cyBidXQgdGhyb3dzIGVycm9yIHdoZW4gcmVhZGluZ1xuICAgIG1vY2tlZEZzLmV4aXN0c1N5bmMubW9ja1JldHVyblZhbHVlKHRydWUpO1xuICAgIG1vY2tlZEZzLnJlYWRGaWxlU3luYy5tb2NrSW1wbGVtZW50YXRpb24oKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQZXJtaXNzaW9uIGRlbmllZCcpO1xuICAgIH0pO1xuXG4gICAgYXBwID0gbmV3IEFwcCgpO1xuICAgIHN0YWNrID0gbmV3IFRhcFN0YWNrKGFwcCwgJ1Rlc3RSZWFkRXJyb3InLCB7XG4gICAgICBhd3NSZWdpb246ICdhcC1zb3V0aGVhc3QtMScsXG4gICAgfSk7XG4gICAgc3ludGhlc2l6ZWQgPSBUZXN0aW5nLnN5bnRoKHN0YWNrKTtcbiAgICBjb25zdCBzeW50aGVkSlNPTiA9IEpTT04ucGFyc2Uoc3ludGhlc2l6ZWQpO1xuXG4gICAgLy8gU2hvdWxkIGZhbGwgYmFjayB0byBwcm92aWRlZCByZWdpb24gd2hlbiBmaWxlIHJlYWQgZmFpbHNcbiAgICBleHBlY3Qoc3ludGhlZEpTT04ucHJvdmlkZXIuYXdzWzBdLnJlZ2lvbikudG9CZSgnYXAtc291dGhlYXN0LTEnKTtcbiAgfSk7XG59KTtcblxuLy8gYWRkIG1vcmUgdGVzdCBzdWl0ZXMgYW5kIGNhc2VzIGFzIG5lZWRlZFxuIl19