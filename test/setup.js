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
exports.resetPulumiMocks = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
// Simple mock setup that handles all the required methods
pulumi.runtime.setMocks({
    newResource: (args) => {
        return {
            id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
            state: {
                ...args.inputs,
                arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.inputs.name || 'mock'}`,
                id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
            },
        };
    },
    call: (args) => {
        if (args.token === 'aws:getCallerIdentity/getCallerIdentity') {
            return {
                accountId: '123456789012',
                arn: 'arn:aws:iam::123456789012:user/test',
                userId: 'AIDACKCEVSQ6C2EXAMPLE',
            };
        }
        if (args.token === 'aws:getRegion/getRegion') {
            return { name: 'us-east-1' };
        }
        if (args.token === 'aws:ec2/getAmi:getAmi') {
            return {
                id: 'ami-12345678',
                name: 'amzn2-ami-hvm-2.0.20220606.1-x86_64-gp2',
                architecture: 'x86_64',
            };
        }
        return {};
    },
}, 'project', 'stack', true); // Set preview mode to true
const resetPulumiMocks = () => {
    pulumi.runtime.setMocks({
        newResource: (args) => {
            return {
                id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
                state: {
                    ...args.inputs,
                    arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.inputs.name || 'mock'}`,
                    id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
                },
            };
        },
        call: (args) => {
            if (args.token === 'aws:getCallerIdentity/getCallerIdentity') {
                return {
                    accountId: '123456789012',
                    arn: 'arn:aws:iam::123456789012:user/test',
                    userId: 'AIDACKCEVSQ6C2EXAMPLE',
                };
            }
            if (args.token === 'aws:getRegion/getRegion') {
                return { name: 'us-east-1' };
            }
            if (args.token === 'aws:ec2/getAmi:getAmi') {
                return {
                    id: 'ami-12345678',
                    name: 'amzn2-ami-hvm-2.0.20220606.1-x86_64-gp2',
                    architecture: 'x86_64',
                };
            }
            return {};
        },
    }, 'project', 'stack', true); // Set preview mode to true
};
exports.resetPulumiMocks = resetPulumiMocks;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBeUM7QUFFekMsMERBQTBEO0FBQzFELE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQ3RCLFdBQVcsRUFBRSxDQUFDLElBQXFDLEVBQTRCLEVBQUU7UUFDL0UsT0FBTztZQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQzNELEtBQUssRUFBRTtnQkFDTCxHQUFHLElBQUksQ0FBQyxNQUFNO2dCQUNkLEdBQUcsRUFBRSxXQUFXLElBQUksQ0FBQyxJQUFJLDJCQUEyQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxNQUFNLEVBQUU7Z0JBQ2hGLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQzVEO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFDRCxJQUFJLEVBQUUsQ0FBQyxJQUFpQyxFQUFFLEVBQUU7UUFDMUMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLHlDQUF5QyxFQUFFLENBQUM7WUFDN0QsT0FBTztnQkFDTCxTQUFTLEVBQUUsY0FBYztnQkFDekIsR0FBRyxFQUFFLHFDQUFxQztnQkFDMUMsTUFBTSxFQUFFLHVCQUF1QjthQUNoQyxDQUFDO1FBQ0osQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyx5QkFBeUIsRUFBRSxDQUFDO1lBQzdDLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyx1QkFBdUIsRUFBRSxDQUFDO1lBQzNDLE9BQU87Z0JBQ0wsRUFBRSxFQUFFLGNBQWM7Z0JBQ2xCLElBQUksRUFBRSx5Q0FBeUM7Z0JBQy9DLFlBQVksRUFBRSxRQUFRO2FBQ3ZCLENBQUM7UUFDSixDQUFDO1FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0NBQ0ssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsMkJBQTJCO0FBRXpELE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxFQUFFO0lBQ25DLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ3RCLFdBQVcsRUFBRSxDQUFDLElBQXFDLEVBQTRCLEVBQUU7WUFDL0UsT0FBTztnQkFDTCxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDM0QsS0FBSyxFQUFFO29CQUNMLEdBQUcsSUFBSSxDQUFDLE1BQU07b0JBQ2QsR0FBRyxFQUFFLFdBQVcsSUFBSSxDQUFDLElBQUksMkJBQTJCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sRUFBRTtvQkFDaEYsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVM7aUJBQzVEO2FBQ0YsQ0FBQztRQUNKLENBQUM7UUFDRCxJQUFJLEVBQUUsQ0FBQyxJQUFpQyxFQUFFLEVBQUU7WUFDMUMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLHlDQUF5QyxFQUFFLENBQUM7Z0JBQzdELE9BQU87b0JBQ0wsU0FBUyxFQUFFLGNBQWM7b0JBQ3pCLEdBQUcsRUFBRSxxQ0FBcUM7b0JBQzFDLE1BQU0sRUFBRSx1QkFBdUI7aUJBQ2hDLENBQUM7WUFDSixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLHlCQUF5QixFQUFFLENBQUM7Z0JBQzdDLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDL0IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyx1QkFBdUIsRUFBRSxDQUFDO2dCQUMzQyxPQUFPO29CQUNMLEVBQUUsRUFBRSxjQUFjO29CQUNsQixJQUFJLEVBQUUseUNBQXlDO29CQUMvQyxZQUFZLEVBQUUsUUFBUTtpQkFDdkIsQ0FBQztZQUNKLENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7S0FDSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQywyQkFBMkI7QUFDbEUsQ0FBQyxDQUFDO0FBakNXLFFBQUEsZ0JBQWdCLG9CQWlDM0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG4vLyBTaW1wbGUgbW9jayBzZXR1cCB0aGF0IGhhbmRsZXMgYWxsIHRoZSByZXF1aXJlZCBtZXRob2RzXG5wdWx1bWkucnVudGltZS5zZXRNb2Nrcyh7XG4gIG5ld1Jlc291cmNlOiAoYXJnczogcHVsdW1pLnJ1bnRpbWUuTW9ja1Jlc291cmNlQXJncyk6IHtpZDogc3RyaW5nOyBzdGF0ZTogYW55fSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBhcmdzLmlucHV0cy5uYW1lID8gYCR7YXJncy5pbnB1dHMubmFtZX1faWRgIDogJ21vY2tfaWQnLFxuICAgICAgc3RhdGU6IHtcbiAgICAgICAgLi4uYXJncy5pbnB1dHMsXG4gICAgICAgIGFybjogYGFybjphd3M6JHthcmdzLnR5cGV9OnVzLWVhc3QtMToxMjM0NTY3ODkwMTI6JHthcmdzLmlucHV0cy5uYW1lIHx8ICdtb2NrJ31gLFxuICAgICAgICBpZDogYXJncy5pbnB1dHMubmFtZSA/IGAke2FyZ3MuaW5wdXRzLm5hbWV9X2lkYCA6ICdtb2NrX2lkJyxcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbiAgY2FsbDogKGFyZ3M6IHB1bHVtaS5ydW50aW1lLk1vY2tDYWxsQXJncykgPT4ge1xuICAgIGlmIChhcmdzLnRva2VuID09PSAnYXdzOmdldENhbGxlcklkZW50aXR5L2dldENhbGxlcklkZW50aXR5Jykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYWNjb3VudElkOiAnMTIzNDU2Nzg5MDEyJyxcbiAgICAgICAgYXJuOiAnYXJuOmF3czppYW06OjEyMzQ1Njc4OTAxMjp1c2VyL3Rlc3QnLFxuICAgICAgICB1c2VySWQ6ICdBSURBQ0tDRVZTUTZDMkVYQU1QTEUnLFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGFyZ3MudG9rZW4gPT09ICdhd3M6Z2V0UmVnaW9uL2dldFJlZ2lvbicpIHtcbiAgICAgIHJldHVybiB7IG5hbWU6ICd1cy1lYXN0LTEnIH07XG4gICAgfVxuICAgIGlmIChhcmdzLnRva2VuID09PSAnYXdzOmVjMi9nZXRBbWk6Z2V0QW1pJykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6ICdhbWktMTIzNDU2NzgnLFxuICAgICAgICBuYW1lOiAnYW16bjItYW1pLWh2bS0yLjAuMjAyMjA2MDYuMS14ODZfNjQtZ3AyJyxcbiAgICAgICAgYXJjaGl0ZWN0dXJlOiAneDg2XzY0JyxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfSxcbn0gYXMgYW55LCAncHJvamVjdCcsICdzdGFjaycsIHRydWUpOyAvLyBTZXQgcHJldmlldyBtb2RlIHRvIHRydWVcblxuZXhwb3J0IGNvbnN0IHJlc2V0UHVsdW1pTW9ja3MgPSAoKSA9PiB7XG4gIHB1bHVtaS5ydW50aW1lLnNldE1vY2tzKHtcbiAgICBuZXdSZXNvdXJjZTogKGFyZ3M6IHB1bHVtaS5ydW50aW1lLk1vY2tSZXNvdXJjZUFyZ3MpOiB7aWQ6IHN0cmluZzsgc3RhdGU6IGFueX0gPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IGFyZ3MuaW5wdXRzLm5hbWUgPyBgJHthcmdzLmlucHV0cy5uYW1lfV9pZGAgOiAnbW9ja19pZCcsXG4gICAgICAgIHN0YXRlOiB7XG4gICAgICAgICAgLi4uYXJncy5pbnB1dHMsXG4gICAgICAgICAgYXJuOiBgYXJuOmF3czoke2FyZ3MudHlwZX06dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjoke2FyZ3MuaW5wdXRzLm5hbWUgfHwgJ21vY2snfWAsXG4gICAgICAgICAgaWQ6IGFyZ3MuaW5wdXRzLm5hbWUgPyBgJHthcmdzLmlucHV0cy5uYW1lfV9pZGAgOiAnbW9ja19pZCcsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0sXG4gICAgY2FsbDogKGFyZ3M6IHB1bHVtaS5ydW50aW1lLk1vY2tDYWxsQXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MudG9rZW4gPT09ICdhd3M6Z2V0Q2FsbGVySWRlbnRpdHkvZ2V0Q2FsbGVySWRlbnRpdHknKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgYWNjb3VudElkOiAnMTIzNDU2Nzg5MDEyJyxcbiAgICAgICAgICBhcm46ICdhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnVzZXIvdGVzdCcsXG4gICAgICAgICAgdXNlcklkOiAnQUlEQUNLQ0VWU1E2QzJFWEFNUExFJyxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChhcmdzLnRva2VuID09PSAnYXdzOmdldFJlZ2lvbi9nZXRSZWdpb24nKSB7XG4gICAgICAgIHJldHVybiB7IG5hbWU6ICd1cy1lYXN0LTEnIH07XG4gICAgICB9XG4gICAgICBpZiAoYXJncy50b2tlbiA9PT0gJ2F3czplYzIvZ2V0QW1pOmdldEFtaScpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZDogJ2FtaS0xMjM0NTY3OCcsXG4gICAgICAgICAgbmFtZTogJ2Ftem4yLWFtaS1odm0tMi4wLjIwMjIwNjA2LjEteDg2XzY0LWdwMicsXG4gICAgICAgICAgYXJjaGl0ZWN0dXJlOiAneDg2XzY0JyxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7fTtcbiAgICB9LFxuICB9IGFzIGFueSwgJ3Byb2plY3QnLCAnc3RhY2snLCB0cnVlKTsgLy8gU2V0IHByZXZpZXcgbW9kZSB0byB0cnVlXG59OyJdfQ==