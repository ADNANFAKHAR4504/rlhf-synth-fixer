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
        region: process.env.CDK_DEFAULT_REGION,
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3ViY2F0ZWdvcnktcmVmZXJlbmNlcy9lbnZpcm9ubWVudC1taWdyYXRpb24vUHIzMTEzL2Jpbi90YXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsaURBQW1DO0FBQ25DLDZDQUFtQztBQUNuQyxnREFBNEM7QUFFNUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsc0ZBQXNGO0FBQ3RGLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsSUFBSSxLQUFLLENBQUM7QUFDL0UsTUFBTSxTQUFTLEdBQUcsV0FBVyxpQkFBaUIsRUFBRSxDQUFDO0FBQ2pELE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQztBQUMzRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxTQUFTLENBQUM7QUFFNUQsMkZBQTJGO0FBQzNGLGtCQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUNuRCxrQkFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQy9DLGtCQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFFekMsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUU7SUFDM0IsU0FBUyxFQUFFLFNBQVMsRUFBRSw2REFBNkQ7SUFDbkYsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsK0JBQStCO0lBQ3JFLEdBQUcsRUFBRTtRQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtRQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7S0FDdkM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGFncyB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIEdldCBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSBjb250ZXh0IChzZXQgYnkgQ0kvQ0QgcGlwZWxpbmUpIG9yIHVzZSAnZGV2JyBhcyBkZWZhdWx0XG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2Vudmlyb25tZW50U3VmZml4JykgfHwgJ2Rldic7XG5jb25zdCBzdGFja05hbWUgPSBgVGFwU3RhY2ske2Vudmlyb25tZW50U3VmZml4fWA7XG5jb25zdCByZXBvc2l0b3J5TmFtZSA9IHByb2Nlc3MuZW52LlJFUE9TSVRPUlkgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gcHJvY2Vzcy5lbnYuQ09NTUlUX0FVVEhPUiB8fCAndW5rbm93bic7XG5cbi8vIEFwcGx5IHRhZ3MgdG8gYWxsIHN0YWNrcyBpbiB0aGlzIGFwcCAob3B0aW9uYWwgLSB5b3UgY2FuIGRvIHRoaXMgYXQgc3RhY2sgbGV2ZWwgaW5zdGVhZClcblRhZ3Mub2YoYXBwKS5hZGQoJ0Vudmlyb25tZW50JywgZW52aXJvbm1lbnRTdWZmaXgpO1xuVGFncy5vZihhcHApLmFkZCgnUmVwb3NpdG9yeScsIHJlcG9zaXRvcnlOYW1lKTtcblRhZ3Mub2YoYXBwKS5hZGQoJ0F1dGhvcicsIGNvbW1pdEF1dGhvcik7XG5cbm5ldyBUYXBTdGFjayhhcHAsIHN0YWNrTmFtZSwge1xuICBzdGFja05hbWU6IHN0YWNrTmFtZSwgLy8gVGhpcyBlbnN1cmVzIENsb3VkRm9ybWF0aW9uIHN0YWNrIG5hbWUgaW5jbHVkZXMgdGhlIHN1ZmZpeFxuICBlbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsIC8vIFBhc3MgdGhlIHN1ZmZpeCB0byB0aGUgc3RhY2tcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTixcbiAgfSxcbn0pO1xuIl19