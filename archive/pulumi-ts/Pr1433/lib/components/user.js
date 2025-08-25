"use strict";
// lib/components/frontend.ts
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
exports.FrontendInfrastructure = void 0;
/**
 * Frontend Infrastructure Component
 * Creates S3 bucket, CloudFront distribution, and related resources
 */
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class FrontendInfrastructure extends pulumi.ComponentResource {
    bucket;
    oac;
    cloudfrontDistribution;
    constructor(name, args, opts) {
        super('custom:frontend:Infrastructure', name, {}, opts);
        // S3 bucket for static website content
        this.bucket = new aws.s3.Bucket(`${name}-website`, {
            website: {
                indexDocument: 'index.html',
                errorDocument: 'error.html',
            },
            acl: 'private',
            tags: { ...args.tags, Name: `${name}-website` },
        }, { parent: this });
        // Block public access to the S3 bucket
        new aws.s3.BucketPublicAccessBlock(`${name}-website-pab`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Origin Access Control for CloudFront to access S3
        this.oac = new aws.cloudfront.OriginAccessControl(`${name}-oac`, {
            name: `${name}-oac`,
            description: 'OAC for S3 bucket access',
            originAccessControlOriginType: 's3',
            signingBehavior: 'always',
            signingProtocol: 'sigv4',
        }, { parent: this });
        // CloudFront distribution with S3 origin
        this.cloudfrontDistribution = new aws.cloudfront.Distribution(`${name}-distribution`, {
            origins: [
                {
                    domainName: this.bucket.bucketDomainName,
                    originId: `${name}-s3-origin`,
                    originAccessControlId: this.oac.id,
                },
            ],
            enabled: true,
            isIpv6Enabled: true,
            defaultRootObject: 'index.html',
            defaultCacheBehavior: {
                allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                cachedMethods: ['GET', 'HEAD'],
                targetOriginId: `${name}-s3-origin`,
                compress: true,
                viewerProtocolPolicy: 'redirect-to-https',
                forwardedValues: {
                    queryString: false,
                    cookies: {
                        forward: 'none',
                    },
                },
                minTtl: 0,
                defaultTtl: 3600,
                maxTtl: 86400,
            },
            customErrorResponses: [
                {
                    errorCode: 404,
                    responseCode: 200,
                    responsePagePath: '/index.html',
                    errorCachingMinTtl: 300,
                },
                {
                    errorCode: 403,
                    responseCode: 200,
                    responsePagePath: '/index.html',
                    errorCachingMinTtl: 300,
                },
            ],
            restrictions: {
                geoRestriction: {
                    restrictionType: 'none',
                },
            },
            viewerCertificate: {
                cloudfrontDefaultCertificate: true,
            },
            priceClass: 'PriceClass_100',
            tags: { ...args.tags, Name: `${name}-distribution` },
        }, { parent: this });
        // S3 bucket policy to allow CloudFront access
        const bucketPolicy = pulumi
            .all([this.bucket.arn, this.cloudfrontDistribution.arn])
            .apply(([bucketArn, distributionArn]) => JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'AllowCloudFrontServicePrincipal',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'cloudfront.amazonaws.com',
                    },
                    Action: 's3:GetObject',
                    Resource: `${bucketArn}/*`,
                    Condition: {
                        StringEquals: {
                            'AWS:SourceArn': distributionArn,
                        },
                    },
                },
            ],
        }));
        new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
            bucket: this.bucket.id,
            policy: bucketPolicy,
        }, { parent: this });
        // Upload sample files
        this.uploadSampleFiles(name);
        this.registerOutputs({
            bucketName: this.bucket.id,
            cloudfrontDomain: this.cloudfrontDistribution.domainName,
            cloudfrontDistributionId: this.cloudfrontDistribution.id,
        });
    }
    /**
     * Upload sample HTML, CSS, and JS files
     */
    uploadSampleFiles(name) {
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Tier Web Application</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Multi-Tier Web Application</h1>
    <p>This is a sample frontend for the multi-tier web application.</p>
    <div id="api-test">
      <button onclick="testAPI()">Test Backend API</button>
      <div id="api-result"></div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`;
        new aws.s3.BucketObject(`${name}-index-html`, {
            bucket: this.bucket.id,
            key: 'index.html',
            content: indexHtml,
            contentType: 'text/html',
        }, { parent: this });
        const cssContent = `
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  text-align: center;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0056b3;
}

#api-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 50px;
}
`;
        new aws.s3.BucketObject(`${name}-css`, {
            bucket: this.bucket.id,
            key: 'styles.css',
            content: cssContent,
            contentType: 'text/css',
        }, { parent: this });
        const jsContent = `
async function testAPI() {
  const resultDiv = document.getElementById('api-result');
  resultDiv.innerHTML = 'Testing API...';

  try {
    // Placeholder for API testing
    const response = await fetch('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      resultDiv.innerHTML = \`<strong>API Response:</strong> \${JSON.stringify(data, null, 2)}\`;
    } else {
      resultDiv.innerHTML = \`<strong>Error:</strong> \${response.status} - \${response.statusText}\`;
    }
  } catch (error) {
    resultDiv.innerHTML = \`<strong>Error:</strong> \${error.message}\`;
  }
}
`;
        new aws.s3.BucketObject(`${name}-js`, {
            bucket: this.bucket.id,
            key: 'app.js',
            content: jsContent,
            contentType: 'application/javascript',
        }, { parent: this });
        const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go back to home</a>
  </div>
</body>
</html>`;
        new aws.s3.BucketObject(`${name}-error-html`, {
            bucket: this.bucket.id,
            key: 'error.html',
            content: errorHtml,
            contentType: 'text/html',
        }, { parent: this });
    }
}
exports.FrontendInfrastructure = FrontendInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRTdCOzs7R0FHRztBQUVILHVEQUF5QztBQUN6QyxpREFBbUM7QUFNbkMsTUFBYSxzQkFBdUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ2xELE1BQU0sQ0FBZ0I7SUFDdEIsR0FBRyxDQUFxQztJQUN4QyxzQkFBc0IsQ0FBOEI7SUFFcEUsWUFDRSxJQUFZLEVBQ1osSUFBZ0MsRUFDaEMsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFeEQsdUNBQXVDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDN0IsR0FBRyxJQUFJLFVBQVUsRUFDakI7WUFDRSxPQUFPLEVBQUU7Z0JBQ1AsYUFBYSxFQUFFLFlBQVk7Z0JBQzNCLGFBQWEsRUFBRSxZQUFZO2FBQzVCO1lBQ0QsR0FBRyxFQUFFLFNBQVM7WUFDZCxJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxVQUFVLEVBQUU7U0FDaEQsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVDQUF1QztRQUN2QyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQ2hDLEdBQUcsSUFBSSxjQUFjLEVBQ3JCO1lBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN0QixlQUFlLEVBQUUsSUFBSTtZQUNyQixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIscUJBQXFCLEVBQUUsSUFBSTtTQUM1QixFQUNELEVBQUUsTUFB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LENBQUM7UUFFRSxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUNyQixHQUFHLElBQUksTUFBTSxFQUNiO1lBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN0QixHQUFHLEVBQUUsWUFBWTtZQUNqQixPQUFPLEVBQUUsVUFBVTtZQUNuQixXQUFXLEVBQUUsVUFBVTtTQUN4QixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsTUFBTSxTQUFTLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXdCckIsQ0FBQztRQUVFLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQ3JCLEdBQUcsSUFBSSxLQUFLLEVBQ1o7WUFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RCLEdBQUcsRUFBRSxRQUFRO1lBQ2IsT0FBTyxFQUFFLFNBQVM7WUFDbEIsV0FBVyxFQUFFLHdCQUF3QjtTQUN0QyxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsTUFBTSxTQUFTLEdBQUc7Ozs7Ozs7Ozs7Ozs7OztRQWVkLENBQUM7UUFFTCxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUNyQixHQUFHLElBQUksYUFBYSxFQUNwQjtZQUNFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdEIsR0FBRyxFQUFFLFlBQVk7WUFDakIsT0FBTyxFQUFFLFNBQVM7WUFDbEIsV0FBVyxFQUFFLFdBQVc7U0FDekIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXZURCx3REF1VEMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBsaWIvY29tcG9uZW50cy9mcm9udGVuZC50c1xuXG4vKipcbiAqIEZyb250ZW5kIEluZnJhc3RydWN0dXJlIENvbXBvbmVudFxuICogQ3JlYXRlcyBTMyBidWNrZXQsIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uLCBhbmQgcmVsYXRlZCByZXNvdXJjZXNcbiAqL1xuXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBGcm9udGVuZEluZnJhc3RydWN0dXJlQXJncyB7XG4gIHRhZ3M6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG59XG5cbmV4cG9ydCBjbGFzcyBGcm9udGVuZEluZnJhc3RydWN0dXJlIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldDogYXdzLnMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IG9hYzogYXdzLmNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzQ29udHJvbDtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkZnJvbnREaXN0cmlidXRpb246IGF3cy5jbG91ZGZyb250LkRpc3RyaWJ1dGlvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRnJvbnRlbmRJbmZyYXN0cnVjdHVyZUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpmcm9udGVuZDpJbmZyYXN0cnVjdHVyZScsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIC8vIFMzIGJ1Y2tldCBmb3Igc3RhdGljIHdlYnNpdGUgY29udGVudFxuICAgIHRoaXMuYnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICBgJHtuYW1lfS13ZWJzaXRlYCxcbiAgICAgIHtcbiAgICAgICAgd2Vic2l0ZToge1xuICAgICAgICAgIGluZGV4RG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgICAgICBlcnJvckRvY3VtZW50OiAnZXJyb3IuaHRtbCcsXG4gICAgICAgIH0sXG4gICAgICAgIGFjbDogJ3ByaXZhdGUnLFxuICAgICAgICB0YWdzOiB7IC4uLmFyZ3MudGFncywgTmFtZTogYCR7bmFtZX0td2Vic2l0ZWAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEJsb2NrIHB1YmxpYyBhY2Nlc3MgdG8gdGhlIFMzIGJ1Y2tldFxuICAgIG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICBgJHtuYW1lfS13ZWJzaXRlLXBhYmAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIE9yaWdpbiBBY2Nlc3MgQ29udHJvbCBmb3IgQ2xvdWRGcm9udCB0byBhY2Nlc3MgUzNcbiAgICB0aGlzLm9hYyA9IG5ldyBhd3MuY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NDb250cm9sKFxuICAgICAgYCR7bmFtZX0tb2FjYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7bmFtZX0tb2FjYCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdPQUMgZm9yIFMzIGJ1Y2tldCBhY2Nlc3MnLFxuICAgICAgICBvcmlnaW5BY2Nlc3NDb250cm9sT3JpZ2luVHlwZTogJ3MzJyxcbiAgICAgICAgc2lnbmluZ0JlaGF2aW9yOiAnYWx3YXlzJyxcbiAgICAgICAgc2lnbmluZ1Byb3RvY29sOiAnc2lndjQnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gd2l0aCBTMyBvcmlnaW5cbiAgICB0aGlzLmNsb3VkZnJvbnREaXN0cmlidXRpb24gPSBuZXcgYXdzLmNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKFxuICAgICAgYCR7bmFtZX0tZGlzdHJpYnV0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgb3JpZ2luczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRvbWFpbk5hbWU6IHRoaXMuYnVja2V0LmJ1Y2tldERvbWFpbk5hbWUsXG4gICAgICAgICAgICBvcmlnaW5JZDogYCR7bmFtZX0tczMtb3JpZ2luYCxcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0NvbnRyb2xJZDogdGhpcy5vYWMuaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgaXNJcHY2RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6ICdpbmRleC5odG1sJyxcbiAgICAgICAgZGVmYXVsdENhY2hlQmVoYXZpb3I6IHtcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogWydHRVQnLCAnSEVBRCcsICdPUFRJT05TJ10sXG4gICAgICAgICAgY2FjaGVkTWV0aG9kczogWydHRVQnLCAnSEVBRCddLFxuICAgICAgICAgIHRhcmdldE9yaWdpbklkOiBgJHtuYW1lfS1zMy1vcmlnaW5gLFxuICAgICAgICAgIGNvbXByZXNzOiB0cnVlLFxuICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiAncmVkaXJlY3QtdG8taHR0cHMnLFxuICAgICAgICAgIGZvcndhcmRlZFZhbHVlczoge1xuICAgICAgICAgICAgcXVlcnlTdHJpbmc6IGZhbHNlLFxuICAgICAgICAgICAgY29va2llczoge1xuICAgICAgICAgICAgICBmb3J3YXJkOiAnbm9uZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgbWluVHRsOiAwLFxuICAgICAgICAgIGRlZmF1bHRUdGw6IDM2MDAsXG4gICAgICAgICAgbWF4VHRsOiA4NjQwMCxcbiAgICAgICAgfSxcbiAgICAgICAgY3VzdG9tRXJyb3JSZXNwb25zZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBlcnJvckNvZGU6IDQwNCxcbiAgICAgICAgICAgIHJlc3BvbnNlQ29kZTogMjAwLFxuICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAgICAgICAgIGVycm9yQ2FjaGluZ01pblR0bDogMzAwLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXJyb3JDb2RlOiA0MDMsXG4gICAgICAgICAgICByZXNwb25zZUNvZGU6IDIwMCxcbiAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgICAgICBlcnJvckNhY2hpbmdNaW5UdGw6IDMwMCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICByZXN0cmljdGlvbnM6IHtcbiAgICAgICAgICBnZW9SZXN0cmljdGlvbjoge1xuICAgICAgICAgICAgcmVzdHJpY3Rpb25UeXBlOiAnbm9uZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdmlld2VyQ2VydGlmaWNhdGU6IHtcbiAgICAgICAgICBjbG91ZGZyb250RGVmYXVsdENlcnRpZmljYXRlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwcmljZUNsYXNzOiAnUHJpY2VDbGFzc18xMDAnLFxuICAgICAgICB0YWdzOiB7IC4uLmFyZ3MudGFncywgTmFtZTogYCR7bmFtZX0tZGlzdHJpYnV0aW9uYCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gUzMgYnVja2V0IHBvbGljeSB0byBhbGxvdyBDbG91ZEZyb250IGFjY2Vzc1xuICAgIGNvbnN0IGJ1Y2tldFBvbGljeSA9IHB1bHVtaVxuICAgICAgLmFsbChbdGhpcy5idWNrZXQuYXJuLCB0aGlzLmNsb3VkZnJvbnREaXN0cmlidXRpb24uYXJuXSlcbiAgICAgIC5hcHBseSgoW2J1Y2tldEFybiwgZGlzdHJpYnV0aW9uQXJuXSkgPT5cbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnQWxsb3dDbG91ZEZyb250U2VydmljZVByaW5jaXBhbCcsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ2Nsb3VkZnJvbnQuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIEFjdGlvbjogJ3MzOkdldE9iamVjdCcsXG4gICAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdBV1M6U291cmNlQXJuJzogZGlzdHJpYnV0aW9uQXJuLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3koXG4gICAgICBgJHtuYW1lfS1idWNrZXQtcG9saWN5YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgcG9saWN5OiBidWNrZXRQb2xpY3ksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBVcGxvYWQgc2FtcGxlIGZpbGVzXG4gICAgdGhpcy51cGxvYWRTYW1wbGVGaWxlcyhuYW1lKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGJ1Y2tldE5hbWU6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgY2xvdWRmcm9udERvbWFpbjogdGhpcy5jbG91ZGZyb250RGlzdHJpYnV0aW9uLmRvbWFpbk5hbWUsXG4gICAgICBjbG91ZGZyb250RGlzdHJpYnV0aW9uSWQ6IHRoaXMuY2xvdWRmcm9udERpc3RyaWJ1dGlvbi5pZCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGxvYWQgc2FtcGxlIEhUTUwsIENTUywgYW5kIEpTIGZpbGVzXG4gICAqL1xuICBwcml2YXRlIHVwbG9hZFNhbXBsZUZpbGVzKG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGluZGV4SHRtbCA9IGA8IURPQ1RZUEUgaHRtbD5cbjxodG1sIGxhbmc9XCJlblwiPlxuPGhlYWQ+XG4gIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFwiPlxuICA8dGl0bGU+TXVsdGktVGllciBXZWIgQXBwbGljYXRpb248L3RpdGxlPlxuICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cInN0eWxlcy5jc3NcIj5cbjwvaGVhZD5cbjxib2R5PlxuICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgPGgxPk11bHRpLVRpZXIgV2ViIEFwcGxpY2F0aW9uPC9oMT5cbiAgICA8cD5UaGlzIGlzIGEgc2FtcGxlIGZyb250ZW5kIGZvciB0aGUgbXVsdGktdGllciB3ZWIgYXBwbGljYXRpb24uPC9wPlxuICAgIDxkaXYgaWQ9XCJhcGktdGVzdFwiPlxuICAgICAgPGJ1dHRvbiBvbmNsaWNrPVwidGVzdEFQSSgpXCI+VGVzdCBCYWNrZW5kIEFQSTwvYnV0dG9uPlxuICAgICAgPGRpdiBpZD1cImFwaS1yZXN1bHRcIj48L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIDxzY3JpcHQgc3JjPVwiYXBwLmpzXCI+PC9zY3JpcHQ+XG48L2JvZHk+XG48L2h0bWw+YDtcblxuICAgIG5ldyBhd3MuczMuQnVja2V0T2JqZWN0KFxuICAgICAgYCR7bmFtZX0taW5kZXgtaHRtbGAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIGtleTogJ2luZGV4Lmh0bWwnLFxuICAgICAgICBjb250ZW50OiBpbmRleEh0bWwsXG4gICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9odG1sJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IGNzc0NvbnRlbnQgPSBgXG5ib2R5IHtcbiAgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmO1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmc6IDIwcHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmNWY1ZjU7XG59XG5cbi5jb250YWluZXIge1xuICBtYXgtd2lkdGg6IDgwMHB4O1xuICBtYXJnaW46IDAgYXV0bztcbiAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XG4gIHBhZGRpbmc6IDMwcHg7XG4gIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgYm94LXNoYWRvdzogMCAycHggMTBweCByZ2JhKDAsMCwwLDAuMSk7XG59XG5cbmgxIHtcbiAgY29sb3I6ICMzMzM7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbn1cblxuYnV0dG9uIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwN2JmZjtcbiAgY29sb3I6IHdoaXRlO1xuICBib3JkZXI6IG5vbmU7XG4gIHBhZGRpbmc6IDEwcHggMjBweDtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGZvbnQtc2l6ZTogMTZweDtcbn1cblxuYnV0dG9uOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwNTZiMztcbn1cblxuI2FwaS1yZXN1bHQge1xuICBtYXJnaW4tdG9wOiAyMHB4O1xuICBwYWRkaW5nOiAxMHB4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjhmOWZhO1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIG1pbi1oZWlnaHQ6IDUwcHg7XG59XG5gO1xuXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRPYmplY3QoXG4gICAgICBgJHtuYW1lfS1jc3NgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBrZXk6ICdzdHlsZXMuY3NzJyxcbiAgICAgICAgY29udGVudDogY3NzQ29udGVudCxcbiAgICAgICAgY29udGVudFR5cGU6ICd0ZXh0L2NzcycsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBjb25zdCBqc0NvbnRlbnQgPSBgXG5hc3luYyBmdW5jdGlvbiB0ZXN0QVBJKCkge1xuICBjb25zdCByZXN1bHREaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBpLXJlc3VsdCcpO1xuICByZXN1bHREaXYuaW5uZXJIVE1MID0gJ1Rlc3RpbmcgQVBJLi4uJztcblxuICB0cnkge1xuICAgIC8vIFBsYWNlaG9sZGVyIGZvciBBUEkgdGVzdGluZ1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJy9hcGkvdGVzdCcsIHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIHJlc3VsdERpdi5pbm5lckhUTUwgPSBcXGA8c3Ryb25nPkFQSSBSZXNwb25zZTo8L3N0cm9uZz4gXFwke0pTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpfVxcYDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0RGl2LmlubmVySFRNTCA9IFxcYDxzdHJvbmc+RXJyb3I6PC9zdHJvbmc+IFxcJHtyZXNwb25zZS5zdGF0dXN9IC0gXFwke3Jlc3BvbnNlLnN0YXR1c1RleHR9XFxgO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXN1bHREaXYuaW5uZXJIVE1MID0gXFxgPHN0cm9uZz5FcnJvcjo8L3N0cm9uZz4gXFwke2Vycm9yLm1lc3NhZ2V9XFxgO1xuICB9XG59XG5gO1xuXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRPYmplY3QoXG4gICAgICBgJHtuYW1lfS1qc2AsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogdGhpcy5idWNrZXQuaWQsXG4gICAgICAgIGtleTogJ2FwcC5qcycsXG4gICAgICAgIGNvbnRlbnQ6IGpzQ29udGVudCxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IGVycm9ySHRtbCA9IGA8IURPQ1RZUEUgaHRtbD5cbjxodG1sIGxhbmc9XCJlblwiPlxuPGhlYWQ+XG4gIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMFwiPlxuICA8dGl0bGU+UGFnZSBOb3QgRm91bmQ8L3RpdGxlPlxuICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cInN0eWxlcy5jc3NcIj5cbjwvaGVhZD5cbjxib2R5PlxuICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgPGgxPlBhZ2UgTm90IEZvdW5kPC9oMT5cbiAgICA8cD5UaGUgcGFnZSB5b3UncmUgbG9va2luZyBmb3IgZG9lc24ndCBleGlzdC48L3A+XG4gICAgPGEgaHJlZj1cIi9cIj5HbyBiYWNrIHRvIGhvbWU8L2E+XG4gIDwvZGl2PlxuPC9ib2R5PlxuPC9odG1sPmA7XG5cbiAgICBuZXcgYXdzLnMzLkJ1Y2tldE9iamVjdChcbiAgICAgIGAke25hbWV9LWVycm9yLWh0bWxgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBrZXk6ICdlcnJvci5odG1sJyxcbiAgICAgICAgY29udGVudDogZXJyb3JIdG1sLFxuICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvaHRtbCcsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cbn1cbiJdfQ==