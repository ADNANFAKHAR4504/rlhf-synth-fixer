"use strict";
// lib/components/monitoring.ts
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
exports.MonitoringInfrastructure = void 0;
/**
 * Monitoring Infrastructure Component
 * Creates Amazon SNS Topic and configures CloudWatch Alarms for various services.
 */
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class MonitoringInfrastructure extends pulumi.ComponentResource {
    snsTopic;
    snsTopicSubscription;
    __name; // Add the missing __name property
    constructor(name, args, opts) {
        super('custom:monitoring:Infrastructure', name, {}, opts);
        // Store the name for use in alarm creation
        this.__name = name;
        // SNS Topic for alerts
        this.snsTopic = new aws.sns.Topic(`${name}-alerts-topic`, {
            name: `${name}-alerts`,
            tags: args.tags,
        }, { parent: this });
        // SNS Topic Subscription (email)
        this.snsTopicSubscription = new aws.sns.TopicSubscription(`${name}-email-subscription`, {
            topic: this.snsTopic.arn,
            protocol: 'email',
            endpoint: args.emailEndpoint || 'your-alert-email@example.com',
        }, {
            parent: this,
            dependsOn: [this.snsTopic],
        });
        this.registerOutputs({
            snsTopicArn: this.snsTopic.arn,
            snsTopicName: this.snsTopic.name,
        });
    }
    /**
     * Configures CloudWatch Alarms for various deployed services.
     */
    setupAlarms(lambdaFunctionNames, kinesisStreamName, cloudfrontDistributionId, opts) {
        const defaultOpts = opts || { parent: this };
        // Lambda Error Alarms
        lambdaFunctionNames.forEach(lambdaNameOutput => {
            lambdaNameOutput.apply(name => {
                const sanitizedName = name.replace(/-/g, '');
                new aws.cloudwatch.MetricAlarm(`${this.__name}-${sanitizedName}-errors-alarm`, {
                    name: `${this.__name}-${name}-errors`,
                    comparisonOperator: 'GreaterThanOrEqualToThreshold',
                    evaluationPeriods: 1,
                    metricName: 'Errors',
                    namespace: 'AWS/Lambda',
                    period: 60,
                    statistic: 'Sum',
                    threshold: 1,
                    dimensions: {
                        FunctionName: name,
                    },
                    alarmDescription: `Alarm when Lambda function ${name} reports errors`,
                    alarmActions: [this.snsTopic.arn],
                    okActions: [this.snsTopic.arn],
                }, defaultOpts);
                return name; // Return the name for the apply chain
            });
        });
        // Kinesis PutRecord.Errors Alarm
        new aws.cloudwatch.MetricAlarm(`${this.__name}-kinesis-put-errors-alarm`, {
            name: pulumi.interpolate `${this.__name}-kinesis-put-record-errors`,
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            evaluationPeriods: 1,
            metricName: 'PutRecord.Errors',
            namespace: 'AWS/Kinesis',
            period: 60,
            statistic: 'Sum',
            threshold: 1,
            dimensions: {
                StreamName: kinesisStreamName,
            },
            alarmDescription: 'Alarm when Kinesis PutRecord operations experience errors',
            alarmActions: [this.snsTopic.arn],
            okActions: [this.snsTopic.arn],
        }, defaultOpts);
        // CloudFront Error Rate Alarm
        new aws.cloudwatch.MetricAlarm(`${this.__name}-cloudfront-error-rate-alarm`, {
            name: pulumi.interpolate `${this.__name}-cloudfront-error-rate`,
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            evaluationPeriods: 1,
            metricName: '4xxErrorRate',
            namespace: 'AWS/CloudFront',
            period: 300,
            statistic: 'Average',
            threshold: 1.0,
            dimensions: {
                DistributionId: cloudfrontDistributionId,
                Region: 'Global',
            },
            alarmDescription: 'Alarm when CloudFront error rate is high',
            alarmActions: [this.snsTopic.arn],
            okActions: [this.snsTopic.arn],
        }, defaultOpts);
    }
    /**
     * Setup additional custom alarms for specific metrics
     */
    setupCustomAlarms(customAlarms, opts) {
        const defaultOpts = opts || { parent: this };
        customAlarms.forEach((config, index) => {
            new aws.cloudwatch.MetricAlarm(`${this.__name}-custom-alarm-${index}`, {
                name: config.name,
                comparisonOperator: config.comparisonOperator,
                evaluationPeriods: config.evaluationPeriods,
                metricName: config.metricName,
                namespace: config.namespace,
                period: config.period,
                statistic: config.statistic,
                threshold: config.threshold,
                dimensions: config.dimensions,
                alarmDescription: config.description,
                alarmActions: [this.snsTopic.arn],
                okActions: [this.snsTopic.arn],
            }, defaultOpts);
        });
    }
}
exports.MonitoringInfrastructure = MonitoringInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3JpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtCQUErQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRS9COzs7R0FHRztBQUVILHVEQUF5QztBQUN6QyxpREFBbUM7QUFPbkMsTUFBYSx3QkFBeUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BELFFBQVEsQ0FBZ0I7SUFDeEIsb0JBQW9CLENBQTRCO0lBQy9DLE1BQU0sQ0FBUyxDQUFDLGtDQUFrQztJQUVuRSxZQUNFLElBQVksRUFDWixJQUFrQyxFQUNsQyxJQUFzQztRQUV0QyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUxRCwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFFbkIsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FDL0IsR0FBRyxJQUFJLGVBQWUsRUFDdEI7WUFDRSxJQUFJLEVBQUUsR0FBRyxJQUFJLFNBQVM7WUFDdEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ2hCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixpQ0FBaUM7UUFDakMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FDdkQsR0FBRyxJQUFJLHFCQUFxQixFQUM1QjtZQUNFLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUc7WUFDeEIsUUFBUSxFQUFFLE9BQU87WUFDakIsUUFBUSxFQUFFLElBQUksQ0FBQyxhQUFhLElBQUksOEJBQThCO1NBQy9ELEVBQ0Q7WUFDRSxNQUFNLEVBQUUsSUFBSTtZQUNaLFNBQVMsRUFBRSxD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QUFDLEdBQUcsQ0FBQztnQkFDakMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7YUFDL0IsRUFDRCxXQUFXLENBQ1osQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbktELDREQW1LQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGxpYi9jb21wb25lbnRzL21vbml0b3JpbmcudHNcblxuLyoqXG4gKiBNb25pdG9yaW5nIEluZnJhc3RydWN0dXJlIENvbXBvbmVudFxuICogQ3JlYXRlcyBBbWF6b24gU05TIFRvcGljIGFuZCBjb25maWd1cmVzIENsb3VkV2F0Y2ggQWxhcm1zIGZvciB2YXJpb3VzIHNlcnZpY2VzLlxuICovXG5cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1vbml0b3JpbmdJbmZyYXN0cnVjdHVyZUFyZ3Mge1xuICB0YWdzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuICBlbWFpbEVuZHBvaW50Pzogc3RyaW5nOyAvLyBPcHRpb25hbCBlbWFpbCBmb3IgU05TIHN1YnNjcmlwdGlvblxufVxuXG5leHBvcnQgY2xhc3MgTW9uaXRvcmluZ0luZnJhc3RydWN0dXJlIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHNuc1RvcGljOiBhd3Muc25zLlRvcGljO1xuICBwdWJsaWMgcmVhZG9ubHkgc25zVG9waWNTdWJzY3JpcHRpb246IGF3cy5zbnMuVG9waWNTdWJzY3JpcHRpb247XG4gIHByaXZhdGUgcmVhZG9ubHkgX19uYW1lOiBzdHJpbmc7IC8vIEFkZCB0aGUgbWlzc2luZyBfX25hbWUgcHJvcGVydHlcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogTW9uaXRvcmluZ0luZnJhc3RydWN0dXJlQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOm1vbml0b3Jpbmc6SW5mcmFzdHJ1Y3R1cmUnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBTdG9yZSB0aGUgbmFtZSBmb3IgdXNlIGluIGFsYXJtIGNyZWF0aW9uXG4gICAgdGhpcy5fX25hbWUgPSBuYW1lO1xuXG4gICAgLy8gU05TIFRvcGljIGZvciBhbGVydHNcbiAgICB0aGlzLnNuc1RvcGljID0gbmV3IGF3cy5zbnMuVG9waWMoXG4gICAgICBgJHtuYW1lfS1hbGVydHMtdG9waWNgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHtuYW1lfS1hbGVydHNgLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBTTlMgVG9waWMgU3Vic2NyaXB0aW9uIChlbWFpbClcbiAgICB0aGlzLnNuc1RvcGljU3Vic2NyaXB0aW9uID0gbmV3IGF3cy5zbnMuVG9waWNTdWJzY3JpcHRpb24oXG4gICAgICBgJHtuYW1lfS1lbWFpbC1zdWJzY3JpcHRpb25gLFxuICAgICAge1xuICAgICAgICB0b3BpYzogdGhpcy5zbnNUb3BpYy5hcm4sXG4gICAgICAgIHByb3RvY29sOiAnZW1haWwnLFxuICAgICAgICBlbmRwb2ludDogYXJncy5lbWFpbEVuZHBvaW50IHx8ICd5b3VyLWFsZXJ0LWVtYWlsQGV4YW1wbGUuY29tJyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgZGVwZW5kc09uOiBbdGhpcy5zbnNUb3BpY10sXG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHNuc1RvcGljQXJuOiB0aGlzLnNuc1RvcGljLmFybixcbiAgICAgIHNuc1RvcGljTmFtZTogdGhpcy5zbnNUb3BpYy5uYW1lLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgQ2xvdWRXYXRjaCBBbGFybXMgZm9yIHZhcmlvdXMgZGVwbG95ZWQgc2VydmljZXMuXG4gICAqL1xuICBwdWJsaWMgc2V0dXBBbGFybXMoXG4gICAgbGFtYmRhRnVuY3Rpb25OYW1lczogcHVsdW1pLk91dHB1dDxzdHJpbmc+W10sXG4gICAga2luZXNpc1N0cmVhbU5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPixcbiAgICBjbG91ZGZyb250RGlzdHJpYnV0aW9uSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPixcbiAgICBvcHRzPzogcHVsdW1pLlJlc291cmNlT3B0aW9uc1xuICApOiB2b2lkIHtcbiAgICBjb25zdCBkZWZhdWx0T3B0cyA9IG9wdHMgfHwgeyBwYXJlbnQ6IHRoaXMgfTtcblxuICAgIC8vIExhbWJkYSBFcnJvciBBbGFybXNcbiAgICBsYW1iZGFGdW5jdGlvbk5hbWVzLmZvckVhY2gobGFtYmRhTmFtZU91dHB1dCA9PiB7XG4gICAgICBsYW1iZGFOYW1lT3V0cHV0LmFwcGx5KG5hbWUgPT4ge1xuICAgICAgICBjb25zdCBzYW5pdGl6ZWROYW1lID0gbmFtZS5yZXBsYWNlKC8tL2csICcnKTtcblxuICAgICAgICBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICAgICAgYCR7dGhpcy5fX25hbWV9LSR7c2FuaXRpemVkTmFtZX0tZXJyb3JzLWFsYXJtYCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiBgJHt0aGlzLl9fbmFtZX0tJHtuYW1lfS1lcnJvcnNgLFxuICAgICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5PckVxdWFsVG9UaHJlc2hvbGQnLFxuICAgICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnRXJyb3JzJyxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9MYW1iZGEnLFxuICAgICAgICAgICAgcGVyaW9kOiA2MCxcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgICAgIEZ1bmN0aW9uTmFtZTogbmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhbGFybURlc2NyaXB0aW9uOiBgQWxhcm0gd2hlbiBMYW1iZGEgZnVuY3Rpb24gJHtuYW1lfSByZXBvcnRzIGVycm9yc2AsXG4gICAgICAgICAgICBhbGFybUFjdGlvbnM6IFt0aGlzLnNuc1RvcGljLmFybl0sXG4gICAgICAgICAgICBva0FjdGlvbnM6IFt0aGlzLnNuc1RvcGljLmFybl0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBkZWZhdWx0T3B0c1xuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBuYW1lOyAvLyBSZXR1cm4gdGhlIG5hbWUgZm9yIHRoZSBhcHBseSBjaGFpblxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBLaW5lc2lzIFB1dFJlY29yZC5FcnJvcnMgQWxhcm1cbiAgICBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgJHt0aGlzLl9fbmFtZX0ta2luZXNpcy1wdXQtZXJyb3JzLWFsYXJtYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogcHVsdW1pLmludGVycG9sYXRlYCR7dGhpcy5fX25hbWV9LWtpbmVzaXMtcHV0LXJlY29yZC1lcnJvcnNgLFxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhbk9yRXF1YWxUb1RocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICBtZXRyaWNOYW1lOiAnUHV0UmVjb3JkLkVycm9ycycsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9LaW5lc2lzJyxcbiAgICAgICAgcGVyaW9kOiA2MCxcbiAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgU3RyZWFtTmFtZToga2luZXNpc1N0cmVhbU5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246XG4gICAgICAgICAgJ0FsYXJtIHdoZW4gS2luZXNpcyBQdXRSZWNvcmQgb3BlcmF0aW9ucyBleHBlcmllbmNlIGVycm9ycycsXG4gICAgICAgIGFsYXJtQWN0aW9uczogW3RoaXMuc25zVG9waWMuYXJuXSxcbiAgICAgICAgb2tBY3Rpb25zOiBbdGhpcy5zbnNUb3BpYy5hcm5dLFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRPcHRzXG4gICAgKTtcblxuICAgIC8vIENsb3VkRnJvbnQgRXJyb3IgUmF0ZSBBbGFybVxuICAgIG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGAke3RoaXMuX19uYW1lfS1jbG91ZGZyb250LWVycm9yLXJhdGUtYWxhcm1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBwdWx1bWkuaW50ZXJwb2xhdGVgJHt0aGlzLl9fbmFtZX0tY2xvdWRmcm9udC1lcnJvci1yYXRlYCxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5PckVxdWFsVG9UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgbWV0cmljTmFtZTogJzR4eEVycm9yUmF0ZScsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9DbG91ZEZyb250JyxcbiAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICB0aHJlc2hvbGQ6IDEuMCxcbiAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgIERpc3RyaWJ1dGlvbklkOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uSWQsXG4gICAgICAgICAgUmVnaW9uOiAnR2xvYmFsJyxcbiAgICAgICAgfSxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FsYXJtIHdoZW4gQ2xvdWRGcm9udCBlcnJvciByYXRlIGlzIGhpZ2gnLFxuICAgICAgICBhbGFybUFjdGlvbnM6IFt0aGlzLnNuc1RvcGljLmFybl0sXG4gICAgICAgIG9rQWN0aW9uczogW3RoaXMuc25zVG9waWMuYXJuXSxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0T3B0c1xuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU2V0dXAgYWRkaXRpb25hbCBjdXN0b20gYWxhcm1zIGZvciBzcGVjaWZpYyBtZXRyaWNzXG4gICAqL1xuICBwdWJsaWMgc2V0dXBDdXN0b21BbGFybXMoXG4gICAgY3VzdG9tQWxhcm1zOiBDdXN0b21BbGFybUNvbmZpZ1tdLFxuICAgIG9wdHM/OiBwdWx1bWkuUmVzb3VyY2VPcHRpb25zXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGRlZmF1bHRPcHRzID0gb3B0cyB8fCB7IHBhcmVudDogdGhpcyB9O1xuXG4gICAgY3VzdG9tQWxhcm1zLmZvckVhY2goKGNvbmZpZywgaW5kZXgpID0+IHtcbiAgICAgIG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgICAgYCR7dGhpcy5fX25hbWV9LWN1c3RvbS1hbGFybS0ke2luZGV4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBjb25maWcubmFtZSxcbiAgICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6IGNvbmZpZy5jb21wYXJpc29uT3BlcmF0b3IsXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IGNvbmZpZy5ldmFsdWF0aW9uUGVyaW9kcyxcbiAgICAgICAgICBtZXRyaWNOYW1lOiBjb25maWcubWV0cmljTmFtZSxcbiAgICAgICAgICBuYW1lc3BhY2U6IGNvbmZpZy5uYW1lc3BhY2UsXG4gICAgICAgICAgcGVyaW9kOiBjb25maWcucGVyaW9kLFxuICAgICAgICAgIHN0YXRpc3RpYzogY29uZmlnLnN0YXRpc3RpYyxcbiAgICAgICAgICB0aHJlc2hvbGQ6IGNvbmZpZy50aHJlc2hvbGQsXG4gICAgICAgICAgZGltZW5zaW9uczogY29uZmlnLmRpbWVuc2lvbnMsXG4gICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogY29uZmlnLmRlc2NyaXB0aW9uLFxuICAgICAgICAgIGFsYXJtQWN0aW9uczogW3RoaXMuc25zVG9waWMuYXJuXSxcbiAgICAgICAgICBva0FjdGlvbnM6IFt0aGlzLnNuc1RvcGljLmFybl0sXG4gICAgICAgIH0sXG4gICAgICAgIGRlZmF1bHRPcHRzXG4gICAgICApO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciBjdXN0b20gYWxhcm0gY29uZmlndXJhdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUFsYXJtQ29uZmlnIHtcbiAgbmFtZTogc3RyaW5nO1xuICBjb21wYXJpc29uT3BlcmF0b3I6IHN0cmluZztcbiAgZXZhbHVhdGlvblBlcmlvZHM6IG51bWJlcjtcbiAgbWV0cmljTmFtZTogc3RyaW5nO1xuICBuYW1lc3BhY2U6IHN0cmluZztcbiAgcGVyaW9kOiBudW1iZXI7XG4gIHN0YXRpc3RpYzogc3RyaW5nO1xuICB0aHJlc2hvbGQ6IG51bWJlcjtcbiAgZGltZW5zaW9uczogeyBba2V5OiBzdHJpbmddOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPiB9O1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xufVxuIl19