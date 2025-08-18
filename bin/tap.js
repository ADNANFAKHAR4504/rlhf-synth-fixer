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
const cdk = __importStar(require("aws-cdk-lib"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const tap_stack_1 = require("../lib/tap-stack");
const app = new cdk.App();
// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
// Get required properties from environment variables or use defaults
const projectName = process.env.PROJECT_NAME || 'tap-financial-services';
const officeCidr = process.env.OFFICE_CIDR || '10.0.0.0/8';
const devOpsEmail = process.env.DEVOPS_EMAIL || 'devops@example.com';
const dbUsername = process.env.DB_USERNAME || 'admin';
// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
aws_cdk_lib_1.Tags.of(app).add('Environment', environmentSuffix);
aws_cdk_lib_1.Tags.of(app).add('Repository', repositoryName);
aws_cdk_lib_1.Tags.of(app).add('Author', commitAuthor);
new tap_stack_1.TapStack(app, stackName, {
    stackName: stackName, // This ensures CloudFormation stack name includes the suffix
    projectName: projectName,
    environmentSuffix: environmentSuffix, // Pass the suffix to the stack
    officeCidr: officeCidr,
    devOpsEmail: devOpsEmail,
    dbUsername: dbUsername,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGlEQUFtQztBQUNuQyw2Q0FBbUM7QUFDbkMsZ0RBQTRDO0FBRTVDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLHNGQUFzRjtBQUN0RixNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLElBQUksS0FBSyxDQUFDO0FBQy9FLE1BQU0sU0FBUyxHQUFHLFdBQVcsaUJBQWlCLEVBQUUsQ0FBQztBQUNqRCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxTQUFTLENBQUM7QUFDM0QsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksU0FBUyxDQUFDO0FBRTVELHFFQUFxRTtBQUNyRSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSx3QkFBd0IsQ0FBQztBQUN6RSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxZQUFZLENBQUM7QUFDM0QsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksb0JBQW9CLENBQUM7QUFDckUsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDO0FBRXRELDJGQUEyRjtBQUMzRixrQkFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDbkQsa0JBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMvQyxrQkFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBRXpDLElBQUksb0JBQVEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFO0lBQzNCLFNBQVMsRUFBRSxTQUFTLEVBQUUsNkRBQTZEO0lBQ25GLFdBQVcsRUFBRSxXQUFXO0lBQ3hCLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLCtCQUErQjtJQUNyRSxVQUFVLEVBQUUsVUFBVTtJQUN0QixXQUFXLEVBQUUsV0FBVztJQUN4QixVQUFVLEVBQUUsVUFBVTtJQUN0QixHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7UUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCO0tBQ3ZDO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRhZ3MgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG4vLyBHZXQgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gY29udGV4dCAoc2V0IGJ5IENJL0NEIHBpcGVsaW5lKSBvciB1c2UgJ2RldicgYXMgZGVmYXVsdFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbnZpcm9ubWVudFN1ZmZpeCcpIHx8ICdkZXYnO1xuY29uc3Qgc3RhY2tOYW1lID0gYFRhcFN0YWNrJHtlbnZpcm9ubWVudFN1ZmZpeH1gO1xuY29uc3QgcmVwb3NpdG9yeU5hbWUgPSBwcm9jZXNzLmVudi5SRVBPU0lUT1JZIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9IHByb2Nlc3MuZW52LkNPTU1JVF9BVVRIT1IgfHwgJ3Vua25vd24nO1xuXG4vLyBHZXQgcmVxdWlyZWQgcHJvcGVydGllcyBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBvciB1c2UgZGVmYXVsdHNcbmNvbnN0IHByb2plY3ROYW1lID0gcHJvY2Vzcy5lbnYuUFJPSkVDVF9OQU1FIHx8ICd0YXAtZmluYW5jaWFsLXNlcnZpY2VzJztcbmNvbnN0IG9mZmljZUNpZHIgPSBwcm9jZXNzLmVudi5PRkZJQ0VfQ0lEUiB8fCAnMTAuMC4wLjAvOCc7XG5jb25zdCBkZXZPcHNFbWFpbCA9IHByb2Nlc3MuZW52LkRFVk9QU19FTUFJTCB8fCAnZGV2b3BzQGV4YW1wbGUuY29tJztcbmNvbnN0IGRiVXNlcm5hbWUgPSBwcm9jZXNzLmVudi5EQl9VU0VSTkFNRSB8fCAnYWRtaW4nO1xuXG4vLyBBcHBseSB0YWdzIHRvIGFsbCBzdGFja3MgaW4gdGhpcyBhcHAgKG9wdGlvbmFsIC0geW91IGNhbiBkbyB0aGlzIGF0IHN0YWNrIGxldmVsIGluc3RlYWQpXG5UYWdzLm9mKGFwcCkuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50U3VmZml4KTtcblRhZ3Mub2YoYXBwKS5hZGQoJ1JlcG9zaXRvcnknLCByZXBvc2l0b3J5TmFtZSk7XG5UYWdzLm9mKGFwcCkuYWRkKCdBdXRob3InLCBjb21taXRBdXRob3IpO1xuXG5uZXcgVGFwU3RhY2soYXBwLCBzdGFja05hbWUsIHtcbiAgc3RhY2tOYW1lOiBzdGFja05hbWUsIC8vIFRoaXMgZW5zdXJlcyBDbG91ZEZvcm1hdGlvbiBzdGFjayBuYW1lIGluY2x1ZGVzIHRoZSBzdWZmaXhcbiAgcHJvamVjdE5hbWU6IHByb2plY3ROYW1lLFxuICBlbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsIC8vIFBhc3MgdGhlIHN1ZmZpeCB0byB0aGUgc3RhY2tcbiAgb2ZmaWNlQ2lkcjogb2ZmaWNlQ2lkcixcbiAgZGV2T3BzRW1haWw6IGRldk9wc0VtYWlsLFxuICBkYlVzZXJuYW1lOiBkYlVzZXJuYW1lLFxuICBlbnY6IHtcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OLFxuICB9LFxufSk7XG4iXX0=