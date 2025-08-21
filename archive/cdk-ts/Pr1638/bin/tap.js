#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const tap_stack_1 = require("../lib/tap-stack");
const app = new cdk.App();
// Get environmentSuffix from context or environment variable, default to 'dev'
const environmentSuffix = app.node.tryGetContext('environmentSuffix') ||
    process.env.ENVIRONMENT_SUFFIX ||
    'dev';
// Get environment from context or default to 'staging'
const environment = app.node.tryGetContext('environment') || 'staging';
const owner = app.node.tryGetContext('owner') || 'cloud-team';
// Create the stack with proper naming convention
new tap_stack_1.TapStack(app, `TapStack${environmentSuffix}`, {
    environment,
    owner,
    environmentSuffix,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
    },
    stackName: `TapStack${environmentSuffix}`,
    description: `Cloud Environment Setup for ${environment} (${environmentSuffix})`,
});
// Add tags to the entire app
cdk.Tags.of(app).add('Project', 'CloudEnvironmentSetup');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('EnvironmentSuffix', environmentSuffix);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsZ0RBQTRDO0FBRTVDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLCtFQUErRTtBQUMvRSxNQUFNLGlCQUFpQixHQUNyQixHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQztJQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQjtJQUM5QixLQUFLLENBQUM7QUFFUix1REFBdUQ7QUFDdkQsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3ZFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFlBQVksQ0FBQztBQUU5RCxpREFBaUQ7QUFDakQsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxXQUFXLGlCQUFpQixFQUFFLEVBQUU7SUFDaEQsV0FBVztJQUNYLEtBQUs7SUFDTCxpQkFBaUI7SUFDakIsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxXQUFXO0tBQ3BCO0lBQ0QsU0FBUyxFQUFFLFdBQVcsaUJBQWlCLEVBQUU7SUFDekMsV0FBVyxFQUFFLCtCQUErQixXQUFXLEtBQUssaUJBQWlCLEdBQUc7Q0FDakYsQ0FBQyxDQUFDO0FBRUgsNkJBQTZCO0FBQzdCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztBQUN6RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIEdldCBlbnZpcm9ubWVudFN1ZmZpeCBmcm9tIGNvbnRleHQgb3IgZW52aXJvbm1lbnQgdmFyaWFibGUsIGRlZmF1bHQgdG8gJ2RldidcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID1cbiAgYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnRTdWZmaXgnKSB8fFxuICBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVggfHxcbiAgJ2Rldic7XG5cbi8vIEdldCBlbnZpcm9ubWVudCBmcm9tIGNvbnRleHQgb3IgZGVmYXVsdCB0byAnc3RhZ2luZydcbmNvbnN0IGVudmlyb25tZW50ID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnQnKSB8fCAnc3RhZ2luZyc7XG5jb25zdCBvd25lciA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ293bmVyJykgfHwgJ2Nsb3VkLXRlYW0nO1xuXG4vLyBDcmVhdGUgdGhlIHN0YWNrIHdpdGggcHJvcGVyIG5hbWluZyBjb252ZW50aW9uXG5uZXcgVGFwU3RhY2soYXBwLCBgVGFwU3RhY2ske2Vudmlyb25tZW50U3VmZml4fWAsIHtcbiAgZW52aXJvbm1lbnQsXG4gIG93bmVyLFxuICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246ICd1cy13ZXN0LTInLFxuICB9LFxuICBzdGFja05hbWU6IGBUYXBTdGFjayR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgZGVzY3JpcHRpb246IGBDbG91ZCBFbnZpcm9ubWVudCBTZXR1cCBmb3IgJHtlbnZpcm9ubWVudH0gKCR7ZW52aXJvbm1lbnRTdWZmaXh9KWAsXG59KTtcblxuLy8gQWRkIHRhZ3MgdG8gdGhlIGVudGlyZSBhcHBcbmNkay5UYWdzLm9mKGFwcCkuYWRkKCdQcm9qZWN0JywgJ0Nsb3VkRW52aXJvbm1lbnRTZXR1cCcpO1xuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcbmNkay5UYWdzLm9mKGFwcCkuYWRkKCdFbnZpcm9ubWVudFN1ZmZpeCcsIGVudmlyb25tZW50U3VmZml4KTtcbiJdfQ==