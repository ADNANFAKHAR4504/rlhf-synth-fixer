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
// Get environment from context (set by CI/CD pipeline) or use 'development' as default
const environment = app.node.tryGetContext('environment') || 'development';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || '';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
aws_cdk_lib_1.Tags.of(app).add('Repository', repositoryName);
aws_cdk_lib_1.Tags.of(app).add('Author', commitAuthor);
new tap_stack_1.TapStack(app, stackName, {
    stackName: stackName,
    description: `TAP Infrastructure Stack for ${environment} environment`,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGlEQUFtQztBQUNuQyw2Q0FBbUM7QUFDbkMsZ0RBQTRDO0FBRTVDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLHVGQUF1RjtBQUN2RixNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFhLENBQUM7QUFDM0UsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsQ0FBQztBQUMvRCxNQUFNLFNBQVMsR0FBRyxXQUFXLGlCQUFpQixFQUFFLENBQUM7QUFDakQsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDO0FBQzNELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLFNBQVMsQ0FBQztBQUU1RCwyRkFBMkY7QUFDM0Ysa0JBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMvQyxrQkFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBRXpDLElBQUksb0JBQVEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFO0lBQzNCLFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFdBQVcsRUFBRSxnQ0FBZ0MsV0FBVyxjQUFjO0lBQ3RFLEdBQUcsRUFBRTtRQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtRQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7S0FDdkM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGFncyB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIEdldCBlbnZpcm9ubWVudCBmcm9tIGNvbnRleHQgKHNldCBieSBDSS9DRCBwaXBlbGluZSkgb3IgdXNlICdkZXZlbG9wbWVudCcgYXMgZGVmYXVsdFxuY29uc3QgZW52aXJvbm1lbnQgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbnZpcm9ubWVudCcpIHx8ICdkZXZlbG9wbWVudCc7XG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnJztcbmNvbnN0IHN0YWNrTmFtZSA9IGBUYXBTdGFjayR7ZW52aXJvbm1lbnRTdWZmaXh9YDtcbmNvbnN0IHJlcG9zaXRvcnlOYW1lID0gcHJvY2Vzcy5lbnYuUkVQT1NJVE9SWSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPSBwcm9jZXNzLmVudi5DT01NSVRfQVVUSE9SIHx8ICd1bmtub3duJztcblxuLy8gQXBwbHkgdGFncyB0byBhbGwgc3RhY2tzIGluIHRoaXMgYXBwIChvcHRpb25hbCAtIHlvdSBjYW4gZG8gdGhpcyBhdCBzdGFjayBsZXZlbCBpbnN0ZWFkKVxuVGFncy5vZihhcHApLmFkZCgnUmVwb3NpdG9yeScsIHJlcG9zaXRvcnlOYW1lKTtcblRhZ3Mub2YoYXBwKS5hZGQoJ0F1dGhvcicsIGNvbW1pdEF1dGhvcik7XG5cbm5ldyBUYXBTdGFjayhhcHAsIHN0YWNrTmFtZSwge1xuICBzdGFja05hbWU6IHN0YWNrTmFtZSxcbiAgZGVzY3JpcHRpb246IGBUQVAgSW5mcmFzdHJ1Y3R1cmUgU3RhY2sgZm9yICR7ZW52aXJvbm1lbnR9IGVudmlyb25tZW50YCxcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTixcbiAgfSxcbn0pO1xuIl19