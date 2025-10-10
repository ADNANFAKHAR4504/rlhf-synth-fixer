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
const cdk = __importStar(require("aws-cdk-lib"));
const assertions_1 = require("aws-cdk-lib/assertions");
const tap_stack_1 = require("../lib/tap-stack");
const migration_stack_1 = require("../lib/migration-stack");
// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/migration-stack');
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
describe('TapStack', () => {
    let app;
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        app = new cdk.App();
    });
    test('should create the MigrationStack', () => {
        const stack = new tap_stack_1.TapStack(app, 'TestTapStack', { environmentSuffix });
        expect(migration_stack_1.MigrationStack).toHaveBeenCalledTimes(1);
    });
    test('should pass the correct props to the MigrationStack', () => {
        const stack = new tap_stack_1.TapStack(app, 'TestTapStack', { environmentSuffix });
        expect(migration_stack_1.MigrationStack).toHaveBeenCalledWith(stack, 'MigrationStack', {
            bastionSourceIp: '0.0.0.0/0',
        });
    });
    describe('environmentSuffix', () => {
        test('should use the environmentSuffix from props', () => {
            const stack = new tap_stack_1.TapStack(app, 'TestTapStackWithProps', {
                environmentSuffix: 'test',
            });
            expect(migration_stack_1.MigrationStack).toHaveBeenCalledTimes(1);
        });
        test('should use the environmentSuffix from context', () => {
            const appWithContext = new cdk.App({
                context: {
                    environmentSuffix: 'context',
                },
            });
            const stack = new tap_stack_1.TapStack(appWithContext, 'TestTapStackWithContext', {});
            expect(migration_stack_1.MigrationStack).toHaveBeenCalledTimes(1);
        });
        test('should use the default environmentSuffix', () => {
            const stack = new tap_stack_1.TapStack(app, 'TestTapStackWithoutSuffix', {});
            expect(migration_stack_1.MigrationStack).toHaveBeenCalledTimes(1);
        });
    });
    test('should synthesize correctly', () => {
        const stack = new tap_stack_1.TapStack(app, 'TestTapStack', { environmentSuffix });
        const template = assertions_1.Template.fromStack(stack);
        expect(template).toBeTruthy();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLnVuaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3N1YmNhdGVnb3J5LXJlZmVyZW5jZXMvZW52aXJvbm1lbnQtbWlncmF0aW9uL1ByMzExMy90ZXN0L3RhcC1zdGFjay51bml0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQWtEO0FBQ2xELGdEQUE0QztBQUM1Qyw0REFBd0Q7QUFFeEQsNkRBQTZEO0FBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUVwQyxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksS0FBSyxDQUFDO0FBRWxFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO0lBQ3hCLElBQUksR0FBWSxDQUFDO0lBRWpCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3JCLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7UUFDNUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxjQUFjLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7UUFDdkUsTUFBTSxDQUFDLGdDQUFjLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxxREFBcUQsRUFBRSxHQUFHLEVBQUU7UUFDL0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxjQUFjLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7UUFDdkUsTUFBTSxDQUFDLGdDQUFjLENBQUMsQ0FBQyxvQkFBb0IsQ0FDekMsS0FBSyxFQUNMLGdCQUFnQixFQUNoQjtZQUNFLGVBQWUsRUFBRSxXQUFXO1NBQzdCLENBQ0YsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUNqQyxJQUFJLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1lBQ3ZELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxHQUFHLEVBQUUsdUJBQXVCLEVBQUU7Z0JBQ3ZELGlCQUFpQixFQUFFLE1BQU07YUFDMUIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLGdDQUFjLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7WUFDekQsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDO2dCQUNqQyxPQUFPLEVBQUU7b0JBQ1AsaUJBQWlCLEVBQUUsU0FBUztpQkFDN0I7YUFDRixDQUFDLENBQUM7WUFDSCxNQUFNLEtBQUssR0FBRyxJQUFJLG9CQUFRLENBQUMsY0FBYyxFQUFFLHlCQUF5QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sQ0FBQyxnQ0FBYyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxHQUFHLEVBQUUsMkJBQTJCLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLGdDQUFjLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUN2QyxNQUFNLEtBQUssR0FBRyxJQUFJLG9CQUFRLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUN2RSxNQUFNLFFBQVEsR0FBRyxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDaEMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcbmltcG9ydCB7IE1pZ3JhdGlvblN0YWNrIH0gZnJvbSAnLi4vbGliL21pZ3JhdGlvbi1zdGFjayc7XG5cbi8vIE1vY2sgdGhlIG5lc3RlZCBzdGFja3MgdG8gdmVyaWZ5IHRoZXkgYXJlIGNhbGxlZCBjb3JyZWN0bHlcbmplc3QubW9jaygnLi4vbGliL21pZ3JhdGlvbi1zdGFjaycpO1xuXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuZGVzY3JpYmUoJ1RhcFN0YWNrJywgKCkgPT4ge1xuICBsZXQgYXBwOiBjZGsuQXBwO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIC8vIFJlc2V0IG1vY2tzIGJlZm9yZSBlYWNoIHRlc3RcbiAgICBqZXN0LmNsZWFyQWxsTW9ja3MoKTtcbiAgICBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIHRoZSBNaWdyYXRpb25TdGFjaycsICgpID0+IHtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBUYXBTdGFjayhhcHAsICdUZXN0VGFwU3RhY2snLCB7IGVudmlyb25tZW50U3VmZml4IH0pO1xuICAgIGV4cGVjdChNaWdyYXRpb25TdGFjaykudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgcGFzcyB0aGUgY29ycmVjdCBwcm9wcyB0byB0aGUgTWlncmF0aW9uU3RhY2snLCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soYXBwLCAnVGVzdFRhcFN0YWNrJywgeyBlbnZpcm9ubWVudFN1ZmZpeCB9KTtcbiAgICBleHBlY3QoTWlncmF0aW9uU3RhY2spLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgc3RhY2ssXG4gICAgICAnTWlncmF0aW9uU3RhY2snLFxuICAgICAge1xuICAgICAgICBiYXN0aW9uU291cmNlSXA6ICcwLjAuMC4wLzAnLFxuICAgICAgfVxuICAgICk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdlbnZpcm9ubWVudFN1ZmZpeCcsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgdXNlIHRoZSBlbnZpcm9ubWVudFN1ZmZpeCBmcm9tIHByb3BzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soYXBwLCAnVGVzdFRhcFN0YWNrV2l0aFByb3BzJywge1xuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeDogJ3Rlc3QnLFxuICAgICAgfSk7XG4gICAgICBleHBlY3QoTWlncmF0aW9uU3RhY2spLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCB1c2UgdGhlIGVudmlyb25tZW50U3VmZml4IGZyb20gY29udGV4dCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGFwcFdpdGhDb250ZXh0ID0gbmV3IGNkay5BcHAoe1xuICAgICAgICBjb250ZXh0OiB7XG4gICAgICAgICAgZW52aXJvbm1lbnRTdWZmaXg6ICdjb250ZXh0JyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soYXBwV2l0aENvbnRleHQsICdUZXN0VGFwU3RhY2tXaXRoQ29udGV4dCcsIHt9KTtcbiAgICAgIGV4cGVjdChNaWdyYXRpb25TdGFjaykudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIHVzZSB0aGUgZGVmYXVsdCBlbnZpcm9ubWVudFN1ZmZpeCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKGFwcCwgJ1Rlc3RUYXBTdGFja1dpdGhvdXRTdWZmaXgnLCB7fSk7XG4gICAgICBleHBlY3QoTWlncmF0aW9uU3RhY2spLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnc2hvdWxkIHN5bnRoZXNpemUgY29ycmVjdGx5JywgKCkgPT4ge1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKGFwcCwgJ1Rlc3RUYXBTdGFjaycsIHsgZW52aXJvbm1lbnRTdWZmaXggfSk7XG4gICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuICAgIGV4cGVjdCh0ZW1wbGF0ZSkudG9CZVRydXRoeSgpO1xuICB9KTtcbn0pO1xuIl19