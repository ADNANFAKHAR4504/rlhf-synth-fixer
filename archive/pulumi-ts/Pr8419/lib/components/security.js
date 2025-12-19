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
exports.SecurityInfrastructure = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class SecurityInfrastructure extends pulumi.ComponentResource {
    webServerSg;
    webServerSgId;
    constructor(name, args, opts) {
        super('tap:components:SecurityInfrastructure', name, args, opts);
        // Create a security group for web servers
        const webServerSgTags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-web-server-sg` }));
        this.webServerSg = new aws.ec2.SecurityGroup(`${name}-web-server-sg`, {
            vpcId: args.vpcId,
            description: 'Allow inbound traffic on port 80 and 443',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTP from anywhere',
                },
                {
                    protocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS from anywhere',
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'Allow all outbound traffic',
                },
            ],
            tags: webServerSgTags,
        }, { parent: this });
        // Export key outputs
        this.webServerSgId = this.webServerSg.id;
        this.registerOutputs({
            webServerSgId: this.webServerSgId,
        });
    }
}
exports.SecurityInfrastructure = SecurityInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBeUM7QUFDekMsaURBQW1DO0FBU25DLE1BQWEsc0JBQXVCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNsRCxXQUFXLENBQXdCO0lBQ25DLGFBQWEsQ0FBd0I7SUFFckQsWUFDRSxJQUFZLEVBQ1osSUFBZ0MsRUFDaEMsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFakUsMENBQTBDO1FBQzFDLE1BQU0sZUFBZSxHQUFHLE1BQU07YUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDakIsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUMxQyxHQUFHLElBQUksZ0JBQWdCLEVBQ3ZCO1lBQ0UsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLFdBQVcsRUFBRSwwQ0FBMEM7WUFDdkQsT0FBTyxFQUFFO2dCQUNQO29CQUNFLFFBQVEsRUFBRSxLQUFLO29CQUNmLFFBQVEsRUFBRSxFQUFFO29CQUNaLE1BQU0sRUFBRSxFQUFFO29CQUNWLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsV0FBVyxFQUFFLG9CQUFvQjtpQkFDbEM7Z0JBQ0Q7b0JBQ0UsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsTUFBTSxFQUFFLEdBQUc7b0JBQ1gsVUFBVSxFQUFFLENBQUMsV0FBVyxDQUFDO29CQUN6QixXQUFXLEVBQUUscUJBQXFCO2lCQUNuQzthQUNGO1lBQ0QsTUFBTSxFQUFFO2dCQUNOO29CQUNFLFFBQVEsRUFBRSxJQUFJO29CQUNkLFFBQVEsRUFBRSxDQUFDO29CQUNYLE1BQU0sRUFBRSxDQUFDO29CQUNULFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsV0FBVyxFQUFFLDRCQUE0QjtpQkFDMUM7YUFDRjtZQUNELElBQUksRUFBRSxlQUFlO1NBQ3RCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixxQkFBcUI7UUFDckIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtTQUNsQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF4REQsd0RBd0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5cbi8vIERlZmluZSB0aGUgYXJndW1lbnRzIGZvciB0aGUgU2VjdXJpdHlJbmZyYXN0cnVjdHVyZSBjb21wb25lbnRcbmludGVyZmFjZSBTZWN1cml0eUluZnJhc3RydWN0dXJlQXJncyB7XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgZW52aXJvbm1lbnQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgU2VjdXJpdHlJbmZyYXN0cnVjdHVyZSBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJTZXJ2ZXJTZzogYXdzLmVjMi5TZWN1cml0eUdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViU2VydmVyU2dJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBTZWN1cml0eUluZnJhc3RydWN0dXJlQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcigndGFwOmNvbXBvbmVudHM6U2VjdXJpdHlJbmZyYXN0cnVjdHVyZScsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIGEgc2VjdXJpdHkgZ3JvdXAgZm9yIHdlYiBzZXJ2ZXJzXG4gICAgY29uc3Qgd2ViU2VydmVyU2dUYWdzID0gcHVsdW1pXG4gICAgICAub3V0cHV0KGFyZ3MudGFncylcbiAgICAgIC5hcHBseSh0ID0+ICh7IC4uLnQsIE5hbWU6IGAke25hbWV9LXdlYi1zZXJ2ZXItc2dgIH0pKTtcbiAgICB0aGlzLndlYlNlcnZlclNnID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIGAke25hbWV9LXdlYi1zZXJ2ZXItc2dgLFxuICAgICAge1xuICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbGxvdyBpbmJvdW5kIHRyYWZmaWMgb24gcG9ydCA4MCBhbmQgNDQzJyxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQIGZyb20gYW55d2hlcmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcbiAgICAgICAgICAgIHRvUG9ydDogNDQzLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUFMgZnJvbSBhbnl3aGVyZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZWdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbG93IGFsbCBvdXRib3VuZCB0cmFmZmljJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB3ZWJTZXJ2ZXJTZ1RhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFeHBvcnQga2V5IG91dHB1dHNcbiAgICB0aGlzLndlYlNlcnZlclNnSWQgPSB0aGlzLndlYlNlcnZlclNnLmlkO1xuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHdlYlNlcnZlclNnSWQ6IHRoaXMud2ViU2VydmVyU2dJZCxcbiAgICB9KTtcbiAgfVxufVxuIl19