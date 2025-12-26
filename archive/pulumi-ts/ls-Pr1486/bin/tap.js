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
exports.instanceProfileArn = exports.kmsKeyId = exports.applicationRoleArn = exports.s3BucketName = exports.rdsEndpoint = exports.privateSubnetIds = exports.publicSubnetIds = exports.vpcId = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const tap_stack_1 = require("../lib/tap-stack");
// Get environment suffix from config or environment variable
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
};
// Create the main stack
const tapStack = new tap_stack_1.TapStack('pulumi-infra', {
    environmentSuffix,
    tags: defaultTags,
});
// Export stack outputs
exports.vpcId = tapStack.vpcId;
exports.publicSubnetIds = tapStack.publicSubnetIds;
exports.privateSubnetIds = tapStack.privateSubnetIds;
exports.rdsEndpoint = tapStack.rdsEndpoint;
exports.s3BucketName = tapStack.s3BucketName;
exports.applicationRoleArn = tapStack.applicationRoleArn;
exports.kmsKeyId = tapStack.kmsKeyId;
exports.instanceProfileArn = tapStack.instanceProfileArn;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1REFBeUM7QUFDekMsZ0RBQTRDO0FBRTVDLDZEQUE2RDtBQUM3RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNuQyxNQUFNLGlCQUFpQixHQUNyQixNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxLQUFLLENBQUM7QUFFN0UsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUM7QUFDekQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxTQUFTLENBQUM7QUFFN0QsTUFBTSxXQUFXLEdBQUc7SUFDbEIsV0FBVyxFQUFFLGlCQUFpQjtJQUM5QixVQUFVLEVBQUUsVUFBVTtJQUN0QixNQUFNLEVBQUUsWUFBWTtDQUNyQixDQUFDO0FBRUYsd0JBQXdCO0FBQ3hCLE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDNUMsaUJBQWlCO0lBQ2pCLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILHVCQUF1QjtBQUNWLFFBQUEsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDdkIsUUFBQSxlQUFlLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQztBQUMzQyxRQUFBLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztBQUM3QyxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDO0FBQ25DLFFBQUEsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7QUFDckMsUUFBQSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUM7QUFDakQsUUFBQSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztBQUM3QixRQUFBLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBHZXQgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gY29uZmlnIG9yIGVudmlyb25tZW50IHZhcmlhYmxlXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPVxuICBjb25maWcuZ2V0KCdlbnZpcm9ubWVudFN1ZmZpeCcpIHx8IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuY29uc3QgcmVwb3NpdG9yeSA9IGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPSBjb25maWcuZ2V0KCdjb21taXRBdXRob3InKSB8fCAndW5rbm93bic7XG5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxufTtcblxuLy8gQ3JlYXRlIHRoZSBtYWluIHN0YWNrXG5jb25zdCB0YXBTdGFjayA9IG5ldyBUYXBTdGFjaygncHVsdW1pLWluZnJhJywge1xuICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IHN0YWNrIG91dHB1dHNcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHRhcFN0YWNrLnZwY0lkO1xuZXhwb3J0IGNvbnN0IHB1YmxpY1N1Ym5ldElkcyA9IHRhcFN0YWNrLnB1YmxpY1N1Ym5ldElkcztcbmV4cG9ydCBjb25zdCBwcml2YXRlU3VibmV0SWRzID0gdGFwU3RhY2sucHJpdmF0ZVN1Ym5ldElkcztcbmV4cG9ydCBjb25zdCByZHNFbmRwb2ludCA9IHRhcFN0YWNrLnJkc0VuZHBvaW50O1xuZXhwb3J0IGNvbnN0IHMzQnVja2V0TmFtZSA9IHRhcFN0YWNrLnMzQnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCBhcHBsaWNhdGlvblJvbGVBcm4gPSB0YXBTdGFjay5hcHBsaWNhdGlvblJvbGVBcm47XG5leHBvcnQgY29uc3Qga21zS2V5SWQgPSB0YXBTdGFjay5rbXNLZXlJZDtcbmV4cG9ydCBjb25zdCBpbnN0YW5jZVByb2ZpbGVBcm4gPSB0YXBTdGFjay5pbnN0YW5jZVByb2ZpbGVBcm47XG4iXX0=
