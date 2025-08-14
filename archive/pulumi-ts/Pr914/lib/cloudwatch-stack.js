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
exports.CloudWatchStack = void 0;
/**
 * cloudwatch-stack.ts
 *
 * This module defines CloudWatch Log Groups for Lambda function and API Gateway logging
 * with appropriate retention policies and least privilege access patterns.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class CloudWatchStack extends pulumi.ComponentResource {
    lambdaLogGroup;
    apiGatewayLogGroup;
    constructor(name, args, opts) {
        super('tap:cloudwatch:CloudWatchStack', name, args, opts);
        const { environmentSuffix, tags } = args;
        this.lambdaLogGroup = new aws.cloudwatch.LogGroup(`lambda-log-group-${environmentSuffix}`, {
            name: `/aws/lambda/doc-processor-${environmentSuffix}`,
            retentionInDays: 90,
            tags: {
                Name: `lambda-log-group-${environmentSuffix}`,
                Purpose: 'Lambda function logging',
                Component: 'CloudWatch',
                ...tags,
            },
        }, { parent: this });
        this.apiGatewayLogGroup = new aws.cloudwatch.LogGroup(`api-gateway-log-group-${environmentSuffix}`, {
            name: `/aws/apigateway/secure-doc-api-${environmentSuffix}`,
            retentionInDays: 90,
            tags: {
                Name: `api-gateway-log-group-${environmentSuffix}`,
                Purpose: 'API Gateway access logging',
                Component: 'CloudWatch',
                ...tags,
            },
        }, { parent: this });
        this.registerOutputs({
            lambdaLogGroupName: this.lambdaLogGroup.name,
            lambdaLogGroupArn: this.lambdaLogGroup.arn,
            apiGatewayLogGroupName: this.apiGatewayLogGroup.name,
            apiGatewayLogGroupArn: this.apiGatewayLogGroup.arn,
        });
    }
}
exports.CloudWatchStack = CloudWatchStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWR3YXRjaC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsb3Vkd2F0Y2gtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7O0dBS0c7QUFDSCxpREFBbUM7QUFDbkMsdURBQXlDO0FBUXpDLE1BQWEsZUFBZ0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzNDLGNBQWMsQ0FBMEI7SUFDeEMsa0JBQWtCLENBQTBCO0lBRTVELFlBQVksSUFBWSxFQUFFLElBQXlCLEVBQUUsSUFBc0I7UUFDekUsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFMUQsTUFBTSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQztRQUV6QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQy9DLG9CQUFvQixpQkFBaUIsRUFBRSxFQUN2QztZQUNFLElBQUksRUFBRSw2QkFBNkIsaUJBQWlCLEVBQUU7WUFDdEQsZUFBZSxFQUFFLEVBQUU7WUFDbkIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxvQkFBb0IsaUJBQWlCLEVBQUU7Z0JBQzdDLE9BQU8sRUFBRSx5QkFBeUI7Z0JBQ2xDLFNBQVMsRUFBRSxZQUFZO2dCQUN2QixHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FDbkQseUJBQXlCLGlCQUFpQixFQUFFLEVBQzVDO1lBQ0UsSUFBSSxFQUFFLGtDQUFrQyxpQkFBaUIsRUFBRTtZQUMzRCxlQUFlLEVBQUUsRUFBRTtZQUNuQixJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLHlCQUF5QixpQkFBaUIsRUFBRTtnQkFDbEQsT0FBTyxFQUFFLDRCQUE0QjtnQkFDckMsU0FBUyxFQUFFLFlBQVk7Z0JBQ3ZCLEdBQUcsSUFBSTthQUNSO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJO1lBQzVDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRztZQUMxQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSTtZQUNwRCxxQkFBcUIsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRztTQUNuRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE5Q0QsMENBOENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBjbG91ZHdhdGNoLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyBDbG91ZFdhdGNoIExvZyBHcm91cHMgZm9yIExhbWJkYSBmdW5jdGlvbiBhbmQgQVBJIEdhdGV3YXkgbG9nZ2luZ1xuICogd2l0aCBhcHByb3ByaWF0ZSByZXRlbnRpb24gcG9saWNpZXMgYW5kIGxlYXN0IHByaXZpbGVnZSBhY2Nlc3MgcGF0dGVybnMuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIENsb3VkV2F0Y2hTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgQ2xvdWRXYXRjaFN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGxhbWJkYUxvZ0dyb3VwOiBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGFwaUdhdGV3YXlMb2dHcm91cDogYXdzLmNsb3Vkd2F0Y2guTG9nR3JvdXA7XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBDbG91ZFdhdGNoU3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDpjbG91ZHdhdGNoOkNsb3VkV2F0Y2hTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudFN1ZmZpeCwgdGFncyB9ID0gYXJncztcblxuICAgIHRoaXMubGFtYmRhTG9nR3JvdXAgPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTG9nR3JvdXAoXG4gICAgICBgbGFtYmRhLWxvZy1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAvYXdzL2xhbWJkYS9kb2MtcHJvY2Vzc29yLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiA5MCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGBsYW1iZGEtbG9nLWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnTGFtYmRhIGZ1bmN0aW9uIGxvZ2dpbmcnLFxuICAgICAgICAgIENvbXBvbmVudDogJ0Nsb3VkV2F0Y2gnLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLmFwaUdhdGV3YXlMb2dHcm91cCA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cChcbiAgICAgIGBhcGktZ2F0ZXdheS1sb2ctZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgL2F3cy9hcGlnYXRld2F5L3NlY3VyZS1kb2MtYXBpLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiA5MCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGBhcGktZ2F0ZXdheS1sb2ctZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdBUEkgR2F0ZXdheSBhY2Nlc3MgbG9nZ2luZycsXG4gICAgICAgICAgQ29tcG9uZW50OiAnQ2xvdWRXYXRjaCcsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGxhbWJkYUxvZ0dyb3VwTmFtZTogdGhpcy5sYW1iZGFMb2dHcm91cC5uYW1lLFxuICAgICAgbGFtYmRhTG9nR3JvdXBBcm46IHRoaXMubGFtYmRhTG9nR3JvdXAuYXJuLFxuICAgICAgYXBpR2F0ZXdheUxvZ0dyb3VwTmFtZTogdGhpcy5hcGlHYXRld2F5TG9nR3JvdXAubmFtZSxcbiAgICAgIGFwaUdhdGV3YXlMb2dHcm91cEFybjogdGhpcy5hcGlHYXRld2F5TG9nR3JvdXAuYXJuLFxuICAgIH0pO1xuICB9XG59XG4iXX0=