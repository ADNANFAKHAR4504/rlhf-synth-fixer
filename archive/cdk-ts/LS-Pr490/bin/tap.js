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
// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
aws_cdk_lib_1.Tags.of(app).add('Environment', environmentSuffix);
aws_cdk_lib_1.Tags.of(app).add('Repository', repositoryName);
aws_cdk_lib_1.Tags.of(app).add('Author', commitAuthor);
new tap_stack_1.TapStack(app, stackName, {
    stackName: stackName, // This ensures CloudFormation stack name includes the suffix
    environmentSuffix: environmentSuffix, // Pass the suffix to the stack
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGlEQUFtQztBQUNuQyw2Q0FBbUM7QUFDbkMsZ0RBQTRDO0FBRTVDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLHNGQUFzRjtBQUN0RixNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLElBQUksS0FBSyxDQUFDO0FBQy9FLE1BQU0sU0FBUyxHQUFHLFdBQVcsaUJBQWlCLEVBQUUsQ0FBQztBQUVqRCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxTQUFTLENBQUM7QUFDM0QsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksU0FBUyxDQUFDO0FBRTVELDJGQUEyRjtBQUMzRixrQkFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDbkQsa0JBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMvQyxrQkFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBRXpDLElBQUksb0JBQVEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFO0lBQzNCLFNBQVMsRUFBRSxTQUFTLEVBQUUsNkRBQTZEO0lBQ25GLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLCtCQUErQjtJQUNyRSxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7UUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksV0FBVztLQUN0RDtDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUYWdzIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8gR2V0IGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIGNvbnRleHQgKHNldCBieSBDSS9DRCBwaXBlbGluZSkgb3IgdXNlICdkZXYnIGFzIGRlZmF1bHRcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnRTdWZmaXgnKSB8fCAnZGV2JztcbmNvbnN0IHN0YWNrTmFtZSA9IGBUYXBTdGFjayR7ZW52aXJvbm1lbnRTdWZmaXh9YDtcblxuY29uc3QgcmVwb3NpdG9yeU5hbWUgPSBwcm9jZXNzLmVudi5SRVBPU0lUT1JZIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9IHByb2Nlc3MuZW52LkNPTU1JVF9BVVRIT1IgfHwgJ3Vua25vd24nO1xuXG4vLyBBcHBseSB0YWdzIHRvIGFsbCBzdGFja3MgaW4gdGhpcyBhcHAgKG9wdGlvbmFsIC0geW91IGNhbiBkbyB0aGlzIGF0IHN0YWNrIGxldmVsIGluc3RlYWQpXG5UYWdzLm9mKGFwcCkuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50U3VmZml4KTtcblRhZ3Mub2YoYXBwKS5hZGQoJ1JlcG9zaXRvcnknLCByZXBvc2l0b3J5TmFtZSk7XG5UYWdzLm9mKGFwcCkuYWRkKCdBdXRob3InLCBjb21taXRBdXRob3IpO1xuXG5uZXcgVGFwU3RhY2soYXBwLCBzdGFja05hbWUsIHtcbiAgc3RhY2tOYW1lOiBzdGFja05hbWUsIC8vIFRoaXMgZW5zdXJlcyBDbG91ZEZvcm1hdGlvbiBzdGFjayBuYW1lIGluY2x1ZGVzIHRoZSBzdWZmaXhcbiAgZW52aXJvbm1lbnRTdWZmaXg6IGVudmlyb25tZW50U3VmZml4LCAvLyBQYXNzIHRoZSBzdWZmaXggdG8gdGhlIHN0YWNrXG4gIGVudjoge1xuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXG4gICAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgJ3VzLXdlc3QtMicsXG4gIH0sXG59KTtcbiJdfQ==