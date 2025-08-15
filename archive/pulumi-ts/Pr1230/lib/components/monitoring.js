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
exports.MonitoringInfrastructure = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class MonitoringInfrastructure extends pulumi.ComponentResource {
    dashboard;
    dashboardName;
    constructor(name, args, opts) {
        super('tap:components:MonitoringInfrastructure', name, args, opts);
        // A simple CloudWatch Dashboard for the EC2 instances
        const dashboardNameStr = `${name}-dashboard`;
        const dashboardBody = pulumi.output(args.instanceIds).apply(ids => {
            if (ids && ids.length > 0) {
                return JSON.stringify({
                    widgets: [
                        {
                            type: 'metric',
                            x: 0,
                            y: 0,
                            width: 12,
                            height: 6,
                            properties: {
                                metrics: [['AWS/EC2', 'CPUUtilization', 'InstanceId', ids[0]]],
                                period: 300,
                                stat: 'Average',
                                region: args.region,
                                title: 'EC2 CPU Utilization',
                            },
                        },
                    ],
                });
            }
            else {
                return JSON.stringify({
                    widgets: [
                        {
                            type: 'text',
                            x: 0,
                            y: 0,
                            width: 12,
                            height: 2,
                            properties: {
                                markdown: '### No instances found to monitor.',
                            },
                        },
                    ],
                });
            }
        });
        this.dashboard = new aws.cloudwatch.Dashboard(`${name}-dashboard`, {
            dashboardName: dashboardNameStr,
            dashboardBody: dashboardBody,
        }, { parent: this });
        // Export key outputs
        this.dashboardName = this.dashboard.dashboardName;
        this.registerOutputs({
            dashboardName: this.dashboardName,
        });
    }
}
exports.MonitoringInfrastructure = MonitoringInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3JpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQXlDO0FBQ3pDLGlEQUFtQztBQVVuQyxNQUFhLHdCQUF5QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEQsU0FBUyxDQUEyQjtJQUNwQyxhQUFhLENBQXdCO0lBRXJELFlBQ0UsSUFBWSxFQUNaLElBQWtDLEVBQ2xDLElBQXNDO1FBRXRDLEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRW5FLHNEQUFzRDtRQUN0RCxNQUFNLGdCQUFnQixHQUFHLEdBQUcsSUFBSSxZQUFZLENBQUM7UUFFN0MsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2hFLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztvQkFDcEIsT0FBTyxFQUFFO3dCQUNQOzRCQUNFLElBQUksRUFBRSxRQUFROzRCQUNkLENBQUMsRUFBRSxDQUFDOzRCQUNKLENBQUMsRUFBRSxDQUFDOzRCQUNKLEtBQUssRUFBRSxFQUFFOzRCQUNULE1BQU0sRUFBRSxDQUFDOzRCQUNULFVBQVUsRUFBRTtnQ0FDVixPQUFPLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQzlELE1BQU0sRUFBRSxHQUFHO2dDQUNYLElBQUksRUFBRSxTQUFTO2dDQUNmLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtnQ0FDbkIsS0FBSyxFQUFFLHFCQUFxQjs2QkFDN0I7eUJBQ0Y7cUJBQ0Y7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztvQkFDcEIsT0FBTyxFQUFFO3dCQUNQOzRCQUNFLElBQUksRUFBRSxNQUFNOzRCQUNaLENBQUMsRUFBRSxDQUFDOzRCQUNKLENBQUMsRUFBRSxDQUFDOzRCQUNKLEtBQUssRUFBRSxFQUFFOzRCQUNULE1BQU0sRUFBRSxDQUFDOzRCQUNULFVBQVUsRUFBRTtnQ0FDVixRQUFRLEVBQUUsb0NBQW9DOzZCQUMvQzt5QkFDRjtxQkFDRjtpQkFDRixDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQzNDLEdBQUcsSUFBSSxZQUFZLEVBQ25CO1lBQ0UsYUFBYSxFQUFFLGdCQUFnQjtZQUMvQixhQUFhLEVBQUUsYUFBYTtTQUM3QixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYscUJBQXFCO1FBQ3JCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7UUFDbEQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7U0FDbEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbkVELDREQW1FQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuXG4vLyBEZWZpbmUgdGhlIGFyZ3VtZW50cyBmb3IgdGhlIE1vbml0b3JpbmdJbmZyYXN0cnVjdHVyZSBjb21wb25lbnRcbmludGVyZmFjZSBNb25pdG9yaW5nSW5mcmFzdHJ1Y3R1cmVBcmdzIHtcbiAgaW5zdGFuY2VJZHM6IHB1bHVtaS5JbnB1dDxwdWx1bWkuSW5wdXQ8c3RyaW5nPltdPjtcbiAgZW52aXJvbm1lbnQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICByZWdpb246IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgTW9uaXRvcmluZ0luZnJhc3RydWN0dXJlIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGRhc2hib2FyZDogYXdzLmNsb3Vkd2F0Y2guRGFzaGJvYXJkO1xuICBwdWJsaWMgcmVhZG9ubHkgZGFzaGJvYXJkTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBNb25pdG9yaW5nSW5mcmFzdHJ1Y3R1cmVBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCd0YXA6Y29tcG9uZW50czpNb25pdG9yaW5nSW5mcmFzdHJ1Y3R1cmUnLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIC8vIEEgc2ltcGxlIENsb3VkV2F0Y2ggRGFzaGJvYXJkIGZvciB0aGUgRUMyIGluc3RhbmNlc1xuICAgIGNvbnN0IGRhc2hib2FyZE5hbWVTdHIgPSBgJHtuYW1lfS1kYXNoYm9hcmRgO1xuXG4gICAgY29uc3QgZGFzaGJvYXJkQm9keSA9IHB1bHVtaS5vdXRwdXQoYXJncy5pbnN0YW5jZUlkcykuYXBwbHkoaWRzID0+IHtcbiAgICAgIGlmIChpZHMgJiYgaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB3aWRnZXRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgICAgICAgIGhlaWdodDogNixcbiAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgIG1ldHJpY3M6IFtbJ0FXUy9FQzInLCAnQ1BVVXRpbGl6YXRpb24nLCAnSW5zdGFuY2VJZCcsIGlkc1swXV1dLFxuICAgICAgICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgICAgICAgIHN0YXQ6ICdBdmVyYWdlJyxcbiAgICAgICAgICAgICAgICByZWdpb246IGFyZ3MucmVnaW9uLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnRUMyIENQVSBVdGlsaXphdGlvbicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB3aWRnZXRzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICAgICAgICBoZWlnaHQ6IDIsXG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICBtYXJrZG93bjogJyMjIyBObyBpbnN0YW5jZXMgZm91bmQgdG8gbW9uaXRvci4nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuZGFzaGJvYXJkID0gbmV3IGF3cy5jbG91ZHdhdGNoLkRhc2hib2FyZChcbiAgICAgIGAke25hbWV9LWRhc2hib2FyZGAsXG4gICAgICB7XG4gICAgICAgIGRhc2hib2FyZE5hbWU6IGRhc2hib2FyZE5hbWVTdHIsXG4gICAgICAgIGRhc2hib2FyZEJvZHk6IGRhc2hib2FyZEJvZHksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFeHBvcnQga2V5IG91dHB1dHNcbiAgICB0aGlzLmRhc2hib2FyZE5hbWUgPSB0aGlzLmRhc2hib2FyZC5kYXNoYm9hcmROYW1lO1xuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGRhc2hib2FyZE5hbWU6IHRoaXMuZGFzaGJvYXJkTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuIl19