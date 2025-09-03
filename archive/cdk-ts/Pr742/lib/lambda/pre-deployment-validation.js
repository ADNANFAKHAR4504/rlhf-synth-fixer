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
exports.handler = void 0;
const AWS = __importStar(require("aws-sdk"));
const codepipeline = new AWS.CodePipeline();
const handler = async (event) => {
    const jobId = event['CodePipeline.job'].id;
    try {
        // Extract job data
        const jobData = event['CodePipeline.job'].data;
        // Perform custom validation logic here
        // Example: Check if deployment should proceed based on business rules
        const validationPassed = await performValidationChecks(jobData);
        if (validationPassed) {
            console.log('Validation passed successfully');
            await codepipeline.putJobSuccessResult({ jobId }).promise();
        }
        else {
            console.error('Validation failed');
            await codepipeline
                .putJobFailureResult({
                jobId,
                failureDetails: {
                    message: 'Custom validation failed',
                    type: 'JobFailed',
                },
            })
                .promise();
        }
    }
    catch (error) {
        console.error(`Error during validation: ${error}`);
        await codepipeline
            .putJobFailureResult({
            jobId,
            failureDetails: {
                message: error instanceof Error ? error.message : String(error),
                type: 'JobFailed',
            },
        })
            .promise();
    }
};
exports.handler = handler;
async function performValidationChecks(_jobData) {
    /**
     * Implement your custom validation logic here
     */
    // Example validation checks:
    // - Verify artifact integrity
    // - Check deployment window
    // - Validate configuration parameters
    // - Run security scans
    console.log('Performing custom validation checks...');
    // For demo purposes, always return true
    // In real implementation, add your validation logic
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlLWRlcGxveW1lbnQtdmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByZS1kZXBsb3ltZW50LXZhbGlkYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkNBQStCO0FBRS9CLE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO0FBdUJyQyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBaUIsRUFBRTtJQUMxRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFM0MsSUFBSSxDQUFDO1FBQ0gsbUJBQW1CO1FBQ25CLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUUvQyx1Q0FBdUM7UUFDdkMsc0VBQXNFO1FBQ3RFLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVoRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7WUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sWUFBWSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM5RCxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNuQyxNQUFNLFlBQVk7aUJBQ2YsbUJBQW1CLENBQUM7Z0JBQ25CLEtBQUs7Z0JBQ0wsY0FBYyxFQUFFO29CQUNkLE9BQU8sRUFBRSwwQkFBMEI7b0JBQ25DLElBQUksRUFBRSxXQUFXO2lCQUNsQjthQUNGLENBQUM7aUJBQ0QsT0FBTyxFQUFFLENBQUM7UUFDZixDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDRCQUE0QixLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sWUFBWTthQUNmLG1CQUFtQixDQUFDO1lBQ25CLEtBQUs7WUFDTCxjQUFjLEVBQUU7Z0JBQ2QsT0FBTyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQy9ELElBQUksRUFBRSxXQUFXO2FBQ2xCO1NBQ0YsQ0FBQzthQUNELE9BQU8sRUFBRSxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUMsQ0FBQztBQXRDVyxRQUFBLE9BQU8sV0FzQ2xCO0FBRUYsS0FBSyxVQUFVLHVCQUF1QixDQUFDLFFBQWlCO0lBQ3REOztPQUVHO0lBQ0gsNkJBQTZCO0lBQzdCLDhCQUE4QjtJQUM5Qiw0QkFBNEI7SUFDNUIsc0NBQXNDO0lBQ3RDLHVCQUF1QjtJQUV2QixPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7SUFFdEQsd0NBQXdDO0lBQ3hDLG9EQUFvRDtJQUNwRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBBV1MgZnJvbSAnYXdzLXNkayc7XG5cbmNvbnN0IGNvZGVwaXBlbGluZSA9IG5ldyBBV1MuQ29kZVBpcGVsaW5lKCk7XG5cbmludGVyZmFjZSBDb2RlUGlwZWxpbmVKb2JFdmVudCB7XG4gICdDb2RlUGlwZWxpbmUuam9iJzoge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgZGF0YToge1xuICAgICAgYWN0aW9uQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBjb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgVXNlclBhcmFtZXRlcnM6IHN0cmluZztcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgICBpbnB1dEFydGlmYWN0czogQXJyYXk8e1xuICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgIHMzTG9jYXRpb246IHtcbiAgICAgICAgICAgIGJ1Y2tldE5hbWU6IHN0cmluZztcbiAgICAgICAgICAgIG9iamVjdEtleTogc3RyaW5nO1xuICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICB9PjtcbiAgICB9O1xuICB9O1xufVxuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQ29kZVBpcGVsaW5lSm9iRXZlbnQpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgY29uc3Qgam9iSWQgPSBldmVudFsnQ29kZVBpcGVsaW5lLmpvYiddLmlkO1xuXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCBqb2IgZGF0YVxuICAgIGNvbnN0IGpvYkRhdGEgPSBldmVudFsnQ29kZVBpcGVsaW5lLmpvYiddLmRhdGE7XG5cbiAgICAvLyBQZXJmb3JtIGN1c3RvbSB2YWxpZGF0aW9uIGxvZ2ljIGhlcmVcbiAgICAvLyBFeGFtcGxlOiBDaGVjayBpZiBkZXBsb3ltZW50IHNob3VsZCBwcm9jZWVkIGJhc2VkIG9uIGJ1c2luZXNzIHJ1bGVzXG4gICAgY29uc3QgdmFsaWRhdGlvblBhc3NlZCA9IGF3YWl0IHBlcmZvcm1WYWxpZGF0aW9uQ2hlY2tzKGpvYkRhdGEpO1xuXG4gICAgaWYgKHZhbGlkYXRpb25QYXNzZWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdWYWxpZGF0aW9uIHBhc3NlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgIGF3YWl0IGNvZGVwaXBlbGluZS5wdXRKb2JTdWNjZXNzUmVzdWx0KHsgam9iSWQgfSkucHJvbWlzZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdWYWxpZGF0aW9uIGZhaWxlZCcpO1xuICAgICAgYXdhaXQgY29kZXBpcGVsaW5lXG4gICAgICAgIC5wdXRKb2JGYWlsdXJlUmVzdWx0KHtcbiAgICAgICAgICBqb2JJZCxcbiAgICAgICAgICBmYWlsdXJlRGV0YWlsczoge1xuICAgICAgICAgICAgbWVzc2FnZTogJ0N1c3RvbSB2YWxpZGF0aW9uIGZhaWxlZCcsXG4gICAgICAgICAgICB0eXBlOiAnSm9iRmFpbGVkJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgICAucHJvbWlzZSgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBkdXJpbmcgdmFsaWRhdGlvbjogJHtlcnJvcn1gKTtcbiAgICBhd2FpdCBjb2RlcGlwZWxpbmVcbiAgICAgIC5wdXRKb2JGYWlsdXJlUmVzdWx0KHtcbiAgICAgICAgam9iSWQsXG4gICAgICAgIGZhaWx1cmVEZXRhaWxzOiB7XG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgIHR5cGU6ICdKb2JGYWlsZWQnLFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICAgIC5wcm9taXNlKCk7XG4gIH1cbn07XG5cbmFzeW5jIGZ1bmN0aW9uIHBlcmZvcm1WYWxpZGF0aW9uQ2hlY2tzKF9qb2JEYXRhOiB1bmtub3duKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgeW91ciBjdXN0b20gdmFsaWRhdGlvbiBsb2dpYyBoZXJlXG4gICAqL1xuICAvLyBFeGFtcGxlIHZhbGlkYXRpb24gY2hlY2tzOlxuICAvLyAtIFZlcmlmeSBhcnRpZmFjdCBpbnRlZ3JpdHlcbiAgLy8gLSBDaGVjayBkZXBsb3ltZW50IHdpbmRvd1xuICAvLyAtIFZhbGlkYXRlIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVyc1xuICAvLyAtIFJ1biBzZWN1cml0eSBzY2Fuc1xuXG4gIGNvbnNvbGUubG9nKCdQZXJmb3JtaW5nIGN1c3RvbSB2YWxpZGF0aW9uIGNoZWNrcy4uLicpO1xuXG4gIC8vIEZvciBkZW1vIHB1cnBvc2VzLCBhbHdheXMgcmV0dXJuIHRydWVcbiAgLy8gSW4gcmVhbCBpbXBsZW1lbnRhdGlvbiwgYWRkIHlvdXIgdmFsaWRhdGlvbiBsb2dpY1xuICByZXR1cm4gdHJ1ZTtcbn1cbiJdfQ==