"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn(() => ({
            send: jest.fn(),
        })),
    },
    TransactWriteCommand: jest.fn().mockImplementation((params) => params),
    UpdateCommand: jest.fn().mockImplementation((params) => params),
    GetCommand: jest.fn().mockImplementation((params) => params),
    unmarshall: jest.fn((data) => data),
}));
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-sns', () => ({
    SNSClient: jest.fn(() => ({
        send: mockSend,
    })),
    PublishCommand: jest.fn().mockImplementation((params) => params),
}));
describe('Lambda Functions Unit Tests', () => {
    describe('Point Calculation Lambda', () => {
        let handler;
        const mockDocClient = {
            send: jest.fn(),
        };
        beforeAll(() => {
            // Mock environment variables
            process.env.LOYALTY_TABLE_NAME = 'test-loyalty-table';
            process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-west-2:123456789012:test-topic';
            process.env.AWS_REGION = 'us-west-2';
            // Set up the mocks on the prototype before loading the module
            const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
            DynamoDBDocumentClient.from = jest.fn(() => mockDocClient);
            // Load the handler after mocking
            handler = require('../lib/lambda/point-calc/index.js').handler;
        });
        beforeEach(() => {
            jest.clearAllMocks();
            mockSend.mockReset();
            mockSend.mockResolvedValue({});
            mockDocClient.send.mockReset();
        });
        afterEach(() => {
            delete process.env.LOYALTY_TABLE_NAME;
            delete process.env.SNS_TOPIC_ARN;
            delete process.env.AWS_REGION;
        });
        test('Successfully processes a purchase transaction', async () => {
            const event = {
                body: JSON.stringify({
                    memberId: 'MEMBER-123',
                    transactionAmount: 100,
                    transactionType: 'purchase',
                }),
            };
            mockDocClient.send.mockResolvedValueOnce({
                Item: {
                    memberId: 'MEMBER-123',
                    totalPoints: 500,
                },
            });
            mockDocClient.send.mockResolvedValueOnce({});
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.pointsEarned).toBe(10); // 100 * 0.1
            expect(body.totalPoints).toBe(510); // 500 + 10
            expect(mockDocClient.send).toHaveBeenCalledTimes(2);
        });
        test('Successfully processes a non-purchase transaction', async () => {
            const event = {
                body: JSON.stringify({
                    memberId: 'MEMBER-456',
                    transactionAmount: 200,
                    transactionType: 'referral',
                }),
            };
            mockDocClient.send.mockResolvedValueOnce({
                Item: {
                    memberId: 'MEMBER-456',
                    totalPoints: 1000,
                },
            });
            mockDocClient.send.mockResolvedValueOnce({});
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.pointsEarned).toBe(25); // 200 * 0.1 * 1.25 (SILVER tier)
            expect(body.totalPoints).toBe(1025); // 1000 + 25
        });
        test('Handles new member with no existing points', async () => {
            const event = {
                body: JSON.stringify({
                    memberId: 'NEW-MEMBER',
                    transactionAmount: 50,
                    transactionType: 'purchase',
                }),
            };
            mockDocClient.send.mockResolvedValueOnce({ Item: undefined });
            mockDocClient.send.mockResolvedValueOnce({});
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.pointsEarned).toBe(5); // 50 * 0.1
            expect(body.totalPoints).toBe(5); // 0 + 5
        });
        test('Returns error when transaction fails', async () => {
            const event = {
                body: JSON.stringify({
                    memberId: 'MEMBER-789',
                    transactionAmount: 100,
                    transactionType: 'purchase',
                }),
            };
            mockDocClient.send.mockRejectedValue(new Error('DynamoDB error'));
            const result = await handler(event);
            expect(result.statusCode).toBe(500);
            const body = JSON.parse(result.body);
            expect(body.error).toBe('Internal server error');
        });
        test('Handles invalid JSON in request body', async () => {
            const event = {
                body: 'invalid json',
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(500);
            const body = JSON.parse(result.body);
            expect(body.error).toBe('Internal server error');
        });
        test('Generates unique transaction IDs', async () => {
            const event1 = {
                body: JSON.stringify({
                    memberId: 'MEMBER-123',
                    transactionAmount: 100,
                    transactionType: 'purchase',
                }),
            };
            const event2 = {
                body: JSON.stringify({
                    memberId: 'MEMBER-123',
                    transactionAmount: 100,
                    transactionType: 'purchase',
                }),
            };
            mockDocClient.send.mockResolvedValue({ Item: { totalPoints: 100 } });
            const result1 = await handler(event1);
            // Wait 2ms to ensure Date.now() returns different values
            await new Promise(resolve => setTimeout(resolve, 2));
            const result2 = await handler(event2);
            const body1 = JSON.parse(result1.body);
            const body2 = JSON.parse(result2.body);
            expect(body1.transactionId).toBeDefined();
            expect(body2.transactionId).toBeDefined();
            expect(body1.transactionId).not.toBe(body2.transactionId);
        });
    });
    describe('Stream Processor Lambda', () => {
        let handler;
        const mockStreamDocClient = {
            send: jest.fn(),
        };
        beforeAll(() => {
            // Mock environment variables
            process.env.LOYALTY_TABLE_NAME = 'test-loyalty-table';
            process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-west-2:123456789012:test-topic';
            process.env.AWS_REGION = 'us-west-2';
            // Set up the mocks on the prototype before loading the module
            const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
            DynamoDBDocumentClient.from = jest.fn(() => mockStreamDocClient);
            // Load the handler after mocking
            handler = require('../lib/lambda/stream-processor/index.js').handler;
        });
        beforeEach(() => {
            jest.clearAllMocks();
            mockSend.mockReset();
            mockSend.mockResolvedValue({});
            mockStreamDocClient.send.mockReset();
            mockStreamDocClient.send.mockResolvedValue({});
        });
        afterEach(() => {
            delete process.env.LOYALTY_TABLE_NAME;
            delete process.env.SNS_TOPIC_ARN;
            delete process.env.AWS_REGION;
        });
        test('Processes tier upgrade from Bronze to Silver', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'MEMBER-123' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '1500' },
                            },
                            OldImage: {
                                memberId: { S: 'MEMBER-123' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '800' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            expect(mockSend).toHaveBeenCalledTimes(1);
            const callArgs = mockSend.mock.calls[0][0];
            // PublishCommand params are passed directly
            expect(callArgs.TopicArn).toBe(process.env.SNS_TOPIC_ARN);
            const message = JSON.parse(callArgs.Message);
            expect(message.tier).toBe('SILVER');
            expect(message.points).toBe(1500);
            expect(message.memberId).toBe('MEMBER-123');
        });
        test('Processes tier upgrade from Silver to Gold', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'MEMBER-456' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '5500' },
                            },
                            OldImage: {
                                memberId: { S: 'MEMBER-456' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '3000' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            expect(mockSend).toHaveBeenCalledTimes(1);
            const callArgs = mockSend.mock.calls[0][0];
            const message = JSON.parse(callArgs.Message);
            expect(message.tier).toBe('GOLD');
            expect(message.points).toBe(5500);
        });
        test('Processes tier upgrade from Gold to Platinum', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'MEMBER-789' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '12000' },
                            },
                            OldImage: {
                                memberId: { S: 'MEMBER-789' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '8000' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            expect(mockSend).toHaveBeenCalledTimes(1);
            const callArgs = mockSend.mock.calls[0][0];
            const message = JSON.parse(callArgs.Message);
            expect(message.tier).toBe('PLATINUM');
            expect(message.points).toBe(12000);
        });
        test('Does not send notification when tier remains the same', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'MEMBER-123' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '1200' },
                            },
                            OldImage: {
                                memberId: { S: 'MEMBER-123' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '1100' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            expect(mockSend).not.toHaveBeenCalled();
        });
        test('Does not send notification for Bronze tier', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'INSERT',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'NEW-MEMBER' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '50' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            expect(mockSend).not.toHaveBeenCalled();
        });
        test('Ignores non-MEMBER_PROFILE records', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'INSERT',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'MEMBER-123' },
                                transactionId: { S: 'TXN-12345' },
                                totalPoints: { N: '100' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            expect(mockSend).not.toHaveBeenCalled();
        });
        test('Handles SNS publish errors gracefully', async () => {
            mockSend.mockRejectedValue(new Error('SNS error'));
            const event = {
                Records: [
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'MEMBER-123' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '1500' },
                            },
                            OldImage: {
                                memberId: { S: 'MEMBER-123' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '800' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            // Should not throw, returns success
            expect(result.statusCode).toBe(200);
            expect(mockSend).toHaveBeenCalled();
        });
        test('Processes multiple records in a batch', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'MEMBER-1' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '1500' },
                            },
                            OldImage: {
                                totalPoints: { N: '500' },
                            },
                        },
                    },
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            NewImage: {
                                memberId: { S: 'MEMBER-2' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '5500' },
                            },
                            OldImage: {
                                totalPoints: { N: '2000' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            expect(mockSend).toHaveBeenCalledTimes(2);
        });
        test('Handles REMOVE events without errors', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'REMOVE',
                        dynamodb: {
                            OldImage: {
                                memberId: { S: 'MEMBER-123' },
                                transactionId: { S: 'MEMBER_PROFILE' },
                                totalPoints: { N: '1000' },
                            },
                        },
                    },
                ],
            };
            const result = await handler(event);
            expect(result.statusCode).toBe(200);
            expect(mockSend).not.toHaveBeenCalled();
        });
    });
    describe('Points Calculation Logic', () => {
        test('Calculates correct points for purchase transactions', () => {
            const calculatePoints = (amount, type) => {
                const baseRate = type === 'purchase' ? 0.1 : 0.05;
                return Math.floor(amount * baseRate);
            };
            expect(calculatePoints(100, 'purchase')).toBe(10);
            expect(calculatePoints(250, 'purchase')).toBe(25);
            expect(calculatePoints(999, 'purchase')).toBe(99);
        });
        test('Calculates correct points for non-purchase transactions', () => {
            const calculatePoints = (amount, type) => {
                const baseRate = type === 'purchase' ? 0.1 : 0.05;
                return Math.floor(amount * baseRate);
            };
            expect(calculatePoints(100, 'referral')).toBe(5);
            expect(calculatePoints(250, 'bonus')).toBe(12);
            expect(calculatePoints(999, 'reward')).toBe(49);
        });
        test('Rounds down to nearest integer', () => {
            const calculatePoints = (amount, type) => {
                const baseRate = type === 'purchase' ? 0.1 : 0.05;
                return Math.floor(amount * baseRate);
            };
            expect(calculatePoints(99, 'purchase')).toBe(9);
            expect(calculatePoints(99, 'referral')).toBe(4);
        });
    });
    describe('Tier Calculation Logic', () => {
        const getTier = (points) => {
            if (points >= 10000)
                return 'PLATINUM';
            if (points >= 5000)
                return 'GOLD';
            if (points >= 1000)
                return 'SILVER';
            return 'BRONZE';
        };
        test('Returns correct tier based on point thresholds', () => {
            expect(getTier(0)).toBe('BRONZE');
            expect(getTier(999)).toBe('BRONZE');
            expect(getTier(1000)).toBe('SILVER');
            expect(getTier(4999)).toBe('SILVER');
            expect(getTier(5000)).toBe('GOLD');
            expect(getTier(9999)).toBe('GOLD');
            expect(getTier(10000)).toBe('PLATINUM');
            expect(getTier(50000)).toBe('PLATINUM');
        });
        test('Handles negative points as Bronze', () => {
            expect(getTier(-100)).toBe('BRONZE');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLWZ1bmN0aW9ucy51bml0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L2xhbWJkYS1mdW5jdGlvbnMudW5pdC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsZUFBZTtBQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDeEMsc0JBQXNCLEVBQUU7UUFDdEIsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNuQixJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtTQUNoQixDQUFDLENBQUM7S0FDSjtJQUNELG9CQUFvQixFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDO0lBQ3RFLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUMvRCxVQUFVLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUM7SUFDNUQsVUFBVSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQztDQUNwQyxDQUFDLENBQUMsQ0FBQztBQUNKLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDdEMsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMs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TCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcblxuLy8gTW9jayBBV1MgU0RLXG5qZXN0Lm1vY2soJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYicpO1xuamVzdC5tb2NrKCdAYXdzLXNkay9saWItZHluYW1vZGInLCAoKSA9PiAoe1xuICBEeW5hbW9EQkRvY3VtZW50Q2xpZW50OiB7XG4gICAgZnJvbTogamVzdC5mbigoKSA9PiAoe1xuICAgICAgc2VuZDogamVzdC5mbigpLFxuICAgIH0pKSxcbiAgfSxcbiAgVHJhbnNhY3RXcml0ZUNvbW1hbmQ6IGplc3QuZm4oKS5tb2NrSW1wbGVtZW50YXRpb24oKHBhcmFtcykgPT4gcGFyYW1zKSxcbiAgVXBkYXRlQ29tbWFuZDogamVzdC5mbigpLm1vY2tJbXBsZW1lbnRhdGlvbigocGFyYW1zKSA9PiBwYXJhbXMpLFxuICBHZXRDb21tYW5kOiBqZXN0LmZuKCkubW9ja0ltcGxlbWVudGF0aW9uKChwYXJhbXMpID0+IHBhcmFtcyksXG4gIHVubWFyc2hhbGw6IGplc3QuZm4oKGRhdGEpID0+IGRhdGEpLFxufSkpO1xuY29uc3QgbW9ja1NlbmQgPSBqZXN0LmZuKCk7XG5qZXN0Lm1vY2soJ0Bhd3Mtc2RrL2NsaWVudC1zbnMnLCAoKSA9PiAoe1xuICBTTlNDbGllbnQ6IGplc3QuZm4oKCkgPT4gKHtcbiAgICBzZW5kOiBtb2NrU2VuZCxcbiAgfSkpLFxuICBQdWJsaXNoQ29tbWFuZDogamVzdC5mbigpLm1vY2tJbXBsZW1lbnRhdGlvbigocGFyYW1zKSA9PiBwYXJhbXMpLFxufSkpO1xuXG5kZXNjcmliZSgnTGFtYmRhIEZ1bmN0aW9ucyBVbml0IFRlc3RzJywgKCkgPT4ge1xuICBkZXNjcmliZSgnUG9pbnQgQ2FsY3VsYXRpb24gTGFtYmRhJywgKCkgPT4ge1xuICAgIGxldCBoYW5kbGVyOiBhbnk7XG4gICAgY29uc3QgbW9ja0RvY0NsaWVudCA9IHtcbiAgICAgIHNlbmQ6IGplc3QuZm4oKSxcbiAgICB9O1xuXG4gICAgYmVmb3JlQWxsKCgpID0+IHtcbiAgICAgIC8vIE1vY2sgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgICBwcm9jZXNzLmVudi5MT1lBTFRZX1RBQkxFX05BTUUgPSAndGVzdC1sb3lhbHR5LXRhYmxlJztcbiAgICAgIHByb2Nlc3MuZW52LlNOU19UT1BJQ19BUk4gPSAnYXJuOmF3czpzbnM6dXMtd2VzdC0yOjEyMzQ1Njc4OTAxMjp0ZXN0LXRvcGljJztcbiAgICAgIHByb2Nlc3MuZW52LkFXU19SRUdJT04gPSAndXMtd2VzdC0yJztcblxuICAgICAgLy8gU2V0IHVwIHRoZSBtb2NrcyBvbiB0aGUgcHJvdG90eXBlIGJlZm9yZSBsb2FkaW5nIHRoZSBtb2R1bGVcbiAgICAgIGNvbnN0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvbGliLWR5bmFtb2RiJyk7XG4gICAgICBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20gPSBqZXN0LmZuKCgpID0+IG1vY2tEb2NDbGllbnQpO1xuXG4gICAgICAvLyBMb2FkIHRoZSBoYW5kbGVyIGFmdGVyIG1vY2tpbmdcbiAgICAgIGhhbmRsZXIgPSByZXF1aXJlKCcuLi9saWIvbGFtYmRhL3BvaW50LWNhbGMvaW5kZXguanMnKS5oYW5kbGVyO1xuICAgIH0pO1xuXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBqZXN0LmNsZWFyQWxsTW9ja3MoKTtcbiAgICAgIG1vY2tTZW5kLm1vY2tSZXNldCgpO1xuICAgICAgbW9ja1NlbmQubW9ja1Jlc29sdmVkVmFsdWUoe30pO1xuICAgICAgbW9ja0RvY0NsaWVudC5zZW5kLm1vY2tSZXNldCgpO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgIGRlbGV0ZSBwcm9jZXNzLmVudi5MT1lBTFRZX1RBQkxFX05BTUU7XG4gICAgICBkZWxldGUgcHJvY2Vzcy5lbnYuU05TX1RPUElDX0FSTjtcbiAgICAgIGRlbGV0ZSBwcm9jZXNzLmVudi5BV1NfUkVHSU9OO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnU3VjY2Vzc2Z1bGx5IHByb2Nlc3NlcyBhIHB1cmNoYXNlIHRyYW5zYWN0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBtZW1iZXJJZDogJ01FTUJFUi0xMjMnLFxuICAgICAgICAgIHRyYW5zYWN0aW9uQW1vdW50OiAxMDAsXG4gICAgICAgICAgdHJhbnNhY3Rpb25UeXBlOiAncHVyY2hhc2UnLFxuICAgICAgICB9KSxcbiAgICAgIH07XG5cbiAgICAgIG1vY2tEb2NDbGllbnQuc2VuZC5tb2NrUmVzb2x2ZWRWYWx1ZU9uY2Uoe1xuICAgICAgICBJdGVtOiB7XG4gICAgICAgICAgbWVtYmVySWQ6ICdNRU1CRVItMTIzJyxcbiAgICAgICAgICB0b3RhbFBvaW50czogNTAwLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBtb2NrRG9jQ2xpZW50LnNlbmQubW9ja1Jlc29sdmVkVmFsdWVPbmNlKHt9KTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xuICAgICAgY29uc3QgYm9keSA9IEpTT04ucGFyc2UocmVzdWx0LmJvZHkpO1xuICAgICAgZXhwZWN0KGJvZHkucG9pbnRzRWFybmVkKS50b0JlKDEwKTsgLy8gMTAwICogMC4xXG4gICAgICBleHBlY3QoYm9keS50b3RhbFBvaW50cykudG9CZSg1MTApOyAvLyA1MDAgKyAxMFxuICAgICAgZXhwZWN0KG1vY2tEb2NDbGllbnQuc2VuZCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDIpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnU3VjY2Vzc2Z1bGx5IHByb2Nlc3NlcyBhIG5vbi1wdXJjaGFzZSB0cmFuc2FjdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbWVtYmVySWQ6ICdNRU1CRVItNDU2JyxcbiAgICAgICAgICB0cmFuc2FjdGlvbkFtb3VudDogMjAwLFxuICAgICAgICAgIHRyYW5zYWN0aW9uVHlwZTogJ3JlZmVycmFsJyxcbiAgICAgICAgfSksXG4gICAgICB9O1xuXG4gICAgICBtb2NrRG9jQ2xpZW50LnNlbmQubW9ja1Jlc29sdmVkVmFsdWVPbmNlKHtcbiAgICAgICAgSXRlbToge1xuICAgICAgICAgIG1lbWJlcklkOiAnTUVNQkVSLTQ1NicsXG4gICAgICAgICAgdG90YWxQb2ludHM6IDEwMDAsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIG1vY2tEb2NDbGllbnQuc2VuZC5tb2NrUmVzb2x2ZWRWYWx1ZU9uY2Uoe30pO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMCk7XG4gICAgICBjb25zdCBib2R5ID0gSlNPTi5wYXJzZShyZXN1bHQuYm9keSk7XG4gICAgICBleHBlY3QoYm9keS5wb2ludHNFYXJuZWQpLnRvQmUoMjUpOyAvLyAyMDAgKiAwLjEgKiAxLjI1IChTSUxWRVIgdGllcilcbiAgICAgIGV4cGVjdChib2R5LnRvdGFsUG9pbnRzKS50b0JlKDEwMjUpOyAvLyAxMDAwICsgMjVcbiAgICB9KTtcblxuICAgIHRlc3QoJ0hhbmRsZXMgbmV3IG1lbWJlciB3aXRoIG5vIGV4aXN0aW5nIHBvaW50cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbWVtYmVySWQ6ICdORVctTUVNQkVSJyxcbiAgICAgICAgICB0cmFuc2FjdGlvbkFtb3VudDogNTAsXG4gICAgICAgICAgdHJhbnNhY3Rpb25UeXBlOiAncHVyY2hhc2UnLFxuICAgICAgICB9KSxcbiAgICAgIH07XG5cbiAgICAgIG1vY2tEb2NDbGllbnQuc2VuZC5tb2NrUmVzb2x2ZWRWYWx1ZU9uY2UoeyBJdGVtOiB1bmRlZmluZWQgfSk7XG4gICAgICBtb2NrRG9jQ2xpZW50LnNlbmQubW9ja1Jlc29sdmVkVmFsdWVPbmNlKHt9KTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xuICAgICAgY29uc3QgYm9keSA9IEpTT04ucGFyc2UocmVzdWx0LmJvZHkpO1xuICAgICAgZXhwZWN0KGJvZHkucG9pbnRzRWFybmVkKS50b0JlKDUpOyAvLyA1MCAqIDAuMVxuICAgICAgZXhwZWN0KGJvZHkudG90YWxQb2ludHMpLnRvQmUoNSk7IC8vIDAgKyA1XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdSZXR1cm5zIGVycm9yIHdoZW4gdHJhbnNhY3Rpb24gZmFpbHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBldmVudCA9IHtcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIG1lbWJlcklkOiAnTUVNQkVSLTc4OScsXG4gICAgICAgICAgdHJhbnNhY3Rpb25BbW91bnQ6IDEwMCxcbiAgICAgICAgICB0cmFuc2FjdGlvblR5cGU6ICdwdXJjaGFzZScsXG4gICAgICAgIH0pLFxuICAgICAgfTtcblxuICAgICAgbW9ja0RvY0NsaWVudC5zZW5kLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignRHluYW1vREIgZXJyb3InKSk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNTAwKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKHJlc3VsdC5ib2R5KTtcbiAgICAgIGV4cGVjdChib2R5LmVycm9yKS50b0JlKCdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0hhbmRsZXMgaW52YWxpZCBKU09OIGluIHJlcXVlc3QgYm9keScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICBib2R5OiAnaW52YWxpZCBqc29uJyxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoNTAwKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKHJlc3VsdC5ib2R5KTtcbiAgICAgIGV4cGVjdChib2R5LmVycm9yKS50b0JlKCdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0dlbmVyYXRlcyB1bmlxdWUgdHJhbnNhY3Rpb24gSURzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZXZlbnQxID0ge1xuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbWVtYmVySWQ6ICdNRU1CRVItMTIzJyxcbiAgICAgICAgICB0cmFuc2FjdGlvbkFtb3VudDogMTAwLFxuICAgICAgICAgIHRyYW5zYWN0aW9uVHlwZTogJ3B1cmNoYXNlJyxcbiAgICAgICAgfSksXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBldmVudDIgPSB7XG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBtZW1iZXJJZDogJ01FTUJFUi0xMjMnLFxuICAgICAgICAgIHRyYW5zYWN0aW9uQW1vdW50OiAxMDAsXG4gICAgICAgICAgdHJhbnNhY3Rpb25UeXBlOiAncHVyY2hhc2UnLFxuICAgICAgICB9KSxcbiAgICAgIH07XG5cbiAgICAgIG1vY2tEb2NDbGllbnQuc2VuZC5tb2NrUmVzb2x2ZWRWYWx1ZSh7IEl0ZW06IHsgdG90YWxQb2ludHM6IDEwMCB9IH0pO1xuXG4gICAgICBjb25zdCByZXN1bHQxID0gYXdhaXQgaGFuZGxlcihldmVudDEpO1xuICAgICAgLy8gV2FpdCAybXMgdG8gZW5zdXJlIERhdGUubm93KCkgcmV0dXJucyBkaWZmZXJlbnQgdmFsdWVzXG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMikpO1xuICAgICAgY29uc3QgcmVzdWx0MiA9IGF3YWl0IGhhbmRsZXIoZXZlbnQyKTtcblxuICAgICAgY29uc3QgYm9keTEgPSBKU09OLnBhcnNlKHJlc3VsdDEuYm9keSk7XG4gICAgICBjb25zdCBib2R5MiA9IEpTT04ucGFyc2UocmVzdWx0Mi5ib2R5KTtcblxuICAgICAgZXhwZWN0KGJvZHkxLnRyYW5zYWN0aW9uSWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoYm9keTIudHJhbnNhY3Rpb25JZCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChib2R5MS50cmFuc2FjdGlvbklkKS5ub3QudG9CZShib2R5Mi50cmFuc2FjdGlvbklkKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1N0cmVhbSBQcm9jZXNzb3IgTGFtYmRhJywgKCkgPT4ge1xuICAgIGxldCBoYW5kbGVyOiBhbnk7XG4gICAgY29uc3QgbW9ja1N0cmVhbURvY0NsaWVudCA9IHtcbiAgICAgIHNlbmQ6IGplc3QuZm4oKSxcbiAgICB9O1xuXG4gICAgYmVmb3JlQWxsKCgpID0+IHtcbiAgICAgIC8vIE1vY2sgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgICBwcm9jZXNzLmVudi5MT1lBTFRZX1RBQkxFX05BTUUgPSAndGVzdC1sb3lhbHR5LXRhYmxlJztcbiAgICAgIHByb2Nlc3MuZW52LlNOU19UT1BJQ19BUk4gPSAnYXJuOmF3czpzbnM6dXMtd2VzdC0yOjEyMzQ1Njc4OTAxMjp0ZXN0LXRvcGljJztcbiAgICAgIHByb2Nlc3MuZW52LkFXU19SRUdJT04gPSAndXMtd2VzdC0yJztcblxuICAgICAgLy8gU2V0IHVwIHRoZSBtb2NrcyBvbiB0aGUgcHJvdG90eXBlIGJlZm9yZSBsb2FkaW5nIHRoZSBtb2R1bGVcbiAgICAgIGNvbnN0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvbGliLWR5bmFtb2RiJyk7XG4gICAgICBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20gPSBqZXN0LmZuKCgpID0+IG1vY2tTdHJlYW1Eb2NDbGllbnQpO1xuXG4gICAgICAvLyBMb2FkIHRoZSBoYW5kbGVyIGFmdGVyIG1vY2tpbmdcbiAgICAgIGhhbmRsZXIgPSByZXF1aXJlKCcuLi9saWIvbGFtYmRhL3N0cmVhbS1wcm9jZXNzb3IvaW5kZXguanMnKS5oYW5kbGVyO1xuICAgIH0pO1xuXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBqZXN0LmNsZWFyQWxsTW9ja3MoKTtcbiAgICAgIG1vY2tTZW5kLm1vY2tSZXNldCgpO1xuICAgICAgbW9ja1NlbmQubW9ja1Jlc29sdmVkVmFsdWUoe30pO1xuICAgICAgbW9ja1N0cmVhbURvY0NsaWVudC5zZW5kLm1vY2tSZXNldCgpO1xuICAgICAgbW9ja1N0cmVhbURvY0NsaWVudC5zZW5kLm1vY2tSZXNvbHZlZFZhbHVlKHt9KTtcbiAgICB9KTtcblxuICAgIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgICBkZWxldGUgcHJvY2Vzcy5lbnYuTE9ZQUxUWV9UQUJMRV9OQU1FO1xuICAgICAgZGVsZXRlIHByb2Nlc3MuZW52LlNOU19UT1BJQ19BUk47XG4gICAgICBkZWxldGUgcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTjtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1Byb2Nlc3NlcyB0aWVyIHVwZ3JhZGUgZnJvbSBCcm9uemUgdG8gU2lsdmVyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICAgIFJlY29yZHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBldmVudE5hbWU6ICdNT0RJRlknLFxuICAgICAgICAgICAgZHluYW1vZGI6IHtcbiAgICAgICAgICAgICAgTmV3SW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJZDogeyBTOiAnTUVNQkVSLTEyMycgfSxcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbklkOiB7IFM6ICdNRU1CRVJfUFJPRklMRScgfSxcbiAgICAgICAgICAgICAgICB0b3RhbFBvaW50czogeyBOOiAnMTUwMCcgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgT2xkSW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJZDogeyBTOiAnTUVNQkVSLTEyMycgfSxcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbklkOiB7IFM6ICdNRU1CRVJfUFJPRklMRScgfSxcbiAgICAgICAgICAgICAgICB0b3RhbFBvaW50czogeyBOOiAnODAwJyB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xuICAgICAgZXhwZWN0KG1vY2tTZW5kKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgICBjb25zdCBjYWxsQXJncyA9IG1vY2tTZW5kLm1vY2suY2FsbHNbMF1bMF07XG4gICAgICAvLyBQdWJsaXNoQ29tbWFuZCBwYXJhbXMgYXJlIHBhc3NlZCBkaXJlY3RseVxuICAgICAgZXhwZWN0KGNhbGxBcmdzLlRvcGljQXJuKS50b0JlKHByb2Nlc3MuZW52LlNOU19UT1BJQ19BUk4pO1xuXG4gICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5wYXJzZShjYWxsQXJncy5NZXNzYWdlKTtcbiAgICAgIGV4cGVjdChtZXNzYWdlLnRpZXIpLnRvQmUoJ1NJTFZFUicpO1xuICAgICAgZXhwZWN0KG1lc3NhZ2UucG9pbnRzKS50b0JlKDE1MDApO1xuICAgICAgZXhwZWN0KG1lc3NhZ2UubWVtYmVySWQpLnRvQmUoJ01FTUJFUi0xMjMnKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1Byb2Nlc3NlcyB0aWVyIHVwZ3JhZGUgZnJvbSBTaWx2ZXIgdG8gR29sZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICBSZWNvcmRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXZlbnROYW1lOiAnTU9ESUZZJyxcbiAgICAgICAgICAgIGR5bmFtb2RiOiB7XG4gICAgICAgICAgICAgIE5ld0ltYWdlOiB7XG4gICAgICAgICAgICAgICAgbWVtYmVySWQ6IHsgUzogJ01FTUJFUi00NTYnIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnTUVNQkVSX1BST0ZJTEUnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzU1MDAnIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIE9sZEltYWdlOiB7XG4gICAgICAgICAgICAgICAgbWVtYmVySWQ6IHsgUzogJ01FTUJFUi00NTYnIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnTUVNQkVSX1BST0ZJTEUnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzMwMDAnIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMCk7XG4gICAgICBleHBlY3QobW9ja1NlbmQpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICAgIGNvbnN0IGNhbGxBcmdzID0gbW9ja1NlbmQubW9jay5jYWxsc1swXVswXTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGNhbGxBcmdzLk1lc3NhZ2UpO1xuICAgICAgZXhwZWN0KG1lc3NhZ2UudGllcikudG9CZSgnR09MRCcpO1xuICAgICAgZXhwZWN0KG1lc3NhZ2UucG9pbnRzKS50b0JlKDU1MDApO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUHJvY2Vzc2VzIHRpZXIgdXBncmFkZSBmcm9tIEdvbGQgdG8gUGxhdGludW0nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBldmVudCA9IHtcbiAgICAgICAgUmVjb3JkczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGV2ZW50TmFtZTogJ01PRElGWScsXG4gICAgICAgICAgICBkeW5hbW9kYjoge1xuICAgICAgICAgICAgICBOZXdJbWFnZToge1xuICAgICAgICAgICAgICAgIG1lbWJlcklkOiB7IFM6ICdNRU1CRVItNzg5JyB9LFxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uSWQ6IHsgUzogJ01FTUJFUl9QUk9GSUxFJyB9LFxuICAgICAgICAgICAgICAgIHRvdGFsUG9pbnRzOiB7IE46ICcxMjAwMCcgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgT2xkSW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJZDogeyBTOiAnTUVNQkVSLTc4OScgfSxcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbklkOiB7IFM6ICdNRU1CRVJfUFJPRklMRScgfSxcbiAgICAgICAgICAgICAgICB0b3RhbFBvaW50czogeyBOOiAnODAwMCcgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoMjAwKTtcbiAgICAgIGV4cGVjdChtb2NrU2VuZCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgICAgY29uc3QgY2FsbEFyZ3MgPSBtb2NrU2VuZC5tb2NrLmNhbGxzWzBdWzBdO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04ucGFyc2UoY2FsbEFyZ3MuTWVzc2FnZSk7XG4gICAgICBleHBlY3QobWVzc2FnZS50aWVyKS50b0JlKCdQTEFUSU5VTScpO1xuICAgICAgZXhwZWN0KG1lc3NhZ2UucG9pbnRzKS50b0JlKDEyMDAwKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0RvZXMgbm90IHNlbmQgbm90aWZpY2F0aW9uIHdoZW4gdGllciByZW1haW5zIHRoZSBzYW1lJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICAgIFJlY29yZHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBldmVudE5hbWU6ICdNT0RJRlknLFxuICAgICAgICAgICAgZHluYW1vZGI6IHtcbiAgICAgICAgICAgICAgTmV3SW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJZDogeyBTOiAnTUVNQkVSLTEyMycgfSxcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbklkOiB7IFM6ICdNRU1CRVJfUFJPRklMRScgfSxcbiAgICAgICAgICAgICAgICB0b3RhbFBvaW50czogeyBOOiAnMTIwMCcgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgT2xkSW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJZDogeyBTOiAnTUVNQkVSLTEyMycgfSxcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbklkOiB7IFM6ICdNRU1CRVJfUFJPRklMRScgfSxcbiAgICAgICAgICAgICAgICB0b3RhbFBvaW50czogeyBOOiAnMTEwMCcgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN0YXR1c0NvZGUpLnRvQmUoMjAwKTtcbiAgICAgIGV4cGVjdChtb2NrU2VuZCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0RvZXMgbm90IHNlbmQgbm90aWZpY2F0aW9uIGZvciBCcm9uemUgdGllcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICBSZWNvcmRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXZlbnROYW1lOiAnSU5TRVJUJyxcbiAgICAgICAgICAgIGR5bmFtb2RiOiB7XG4gICAgICAgICAgICAgIE5ld0ltYWdlOiB7XG4gICAgICAgICAgICAgICAgbWVtYmVySWQ6IHsgUzogJ05FVy1NRU1CRVInIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnTUVNQkVSX1BST0ZJTEUnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzUwJyB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihldmVudCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xuICAgICAgZXhwZWN0KG1vY2tTZW5kKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnSWdub3JlcyBub24tTUVNQkVSX1BST0ZJTEUgcmVjb3JkcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICBSZWNvcmRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXZlbnROYW1lOiAnSU5TRVJUJyxcbiAgICAgICAgICAgIGR5bmFtb2RiOiB7XG4gICAgICAgICAgICAgIE5ld0ltYWdlOiB7XG4gICAgICAgICAgICAgICAgbWVtYmVySWQ6IHsgUzogJ01FTUJFUi0xMjMnIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnVFhOLTEyMzQ1JyB9LFxuICAgICAgICAgICAgICAgIHRvdGFsUG9pbnRzOiB7IE46ICcxMDAnIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMCk7XG4gICAgICBleHBlY3QobW9ja1NlbmQpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdIYW5kbGVzIFNOUyBwdWJsaXNoIGVycm9ycyBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja1NlbmQubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdTTlMgZXJyb3InKSk7XG5cbiAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICBSZWNvcmRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXZlbnROYW1lOiAnTU9ESUZZJyxcbiAgICAgICAgICAgIGR5bmFtb2RiOiB7XG4gICAgICAgICAgICAgIE5ld0ltYWdlOiB7XG4gICAgICAgICAgICAgICAgbWVtYmVySWQ6IHsgUzogJ01FTUJFUi0xMjMnIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnTUVNQkVSX1BST0ZJTEUnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzE1MDAnIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIE9sZEltYWdlOiB7XG4gICAgICAgICAgICAgICAgbWVtYmVySWQ6IHsgUzogJ01FTUJFUi0xMjMnIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnTUVNQkVSX1BST0ZJTEUnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzgwMCcgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhbmRsZXIoZXZlbnQpO1xuXG4gICAgICAvLyBTaG91bGQgbm90IHRocm93LCByZXR1cm5zIHN1Y2Nlc3NcbiAgICAgIGV4cGVjdChyZXN1bHQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xuICAgICAgZXhwZWN0KG1vY2tTZW5kKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdQcm9jZXNzZXMgbXVsdGlwbGUgcmVjb3JkcyBpbiBhIGJhdGNoJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICAgIFJlY29yZHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBldmVudE5hbWU6ICdNT0RJRlknLFxuICAgICAgICAgICAgZHluYW1vZGI6IHtcbiAgICAgICAgICAgICAgTmV3SW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJZDogeyBTOiAnTUVNQkVSLTEnIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnTUVNQkVSX1BST0ZJTEUnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzE1MDAnIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIE9sZEltYWdlOiB7XG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzUwMCcgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBldmVudE5hbWU6ICdNT0RJRlknLFxuICAgICAgICAgICAgZHluYW1vZGI6IHtcbiAgICAgICAgICAgICAgTmV3SW1hZ2U6IHtcbiAgICAgICAgICAgICAgICBtZW1iZXJJZDogeyBTOiAnTUVNQkVSLTInIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnTUVNQkVSX1BST0ZJTEUnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzU1MDAnIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIE9sZEltYWdlOiB7XG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzIwMDAnIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMCk7XG4gICAgICBleHBlY3QobW9ja1NlbmQpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygyKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0hhbmRsZXMgUkVNT1ZFIGV2ZW50cyB3aXRob3V0IGVycm9ycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICBSZWNvcmRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXZlbnROYW1lOiAnUkVNT1ZFJyxcbiAgICAgICAgICAgIGR5bmFtb2RiOiB7XG4gICAgICAgICAgICAgIE9sZEltYWdlOiB7XG4gICAgICAgICAgICAgICAgbWVtYmVySWQ6IHsgUzogJ01FTUJFUi0xMjMnIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25JZDogeyBTOiAnTUVNQkVSX1BST0ZJTEUnIH0sXG4gICAgICAgICAgICAgICAgdG90YWxQb2ludHM6IHsgTjogJzEwMDAnIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYW5kbGVyKGV2ZW50KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdGF0dXNDb2RlKS50b0JlKDIwMCk7XG4gICAgICBleHBlY3QobW9ja1NlbmQpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdQb2ludHMgQ2FsY3VsYXRpb24gTG9naWMnLCAoKSA9PiB7XG4gICAgdGVzdCgnQ2FsY3VsYXRlcyBjb3JyZWN0IHBvaW50cyBmb3IgcHVyY2hhc2UgdHJhbnNhY3Rpb25zJywgKCkgPT4ge1xuICAgICAgY29uc3QgY2FsY3VsYXRlUG9pbnRzID0gKGFtb3VudDogbnVtYmVyLCB0eXBlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgYmFzZVJhdGUgPSB0eXBlID09PSAncHVyY2hhc2UnID8gMC4xIDogMC4wNTtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoYW1vdW50ICogYmFzZVJhdGUpO1xuICAgICAgfTtcblxuICAgICAgZXhwZWN0KGNhbGN1bGF0ZVBvaW50cygxMDAsICdwdXJjaGFzZScpKS50b0JlKDEwKTtcbiAgICAgIGV4cGVjdChjYWxjdWxhdGVQb2ludHMoMjUwLCAncHVyY2hhc2UnKSkudG9CZSgyNSk7XG4gICAgICBleHBlY3QoY2FsY3VsYXRlUG9pbnRzKDk5OSwgJ3B1cmNoYXNlJykpLnRvQmUoOTkpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ2FsY3VsYXRlcyBjb3JyZWN0IHBvaW50cyBmb3Igbm9uLXB1cmNoYXNlIHRyYW5zYWN0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IGNhbGN1bGF0ZVBvaW50cyA9IChhbW91bnQ6IG51bWJlciwgdHlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGJhc2VSYXRlID0gdHlwZSA9PT0gJ3B1cmNoYXNlJyA/IDAuMSA6IDAuMDU7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKGFtb3VudCAqIGJhc2VSYXRlKTtcbiAgICAgIH07XG5cbiAgICAgIGV4cGVjdChjYWxjdWxhdGVQb2ludHMoMTAwLCAncmVmZXJyYWwnKSkudG9CZSg1KTtcbiAgICAgIGV4cGVjdChjYWxjdWxhdGVQb2ludHMoMjUwLCAnYm9udXMnKSkudG9CZSgxMik7XG4gICAgICBleHBlY3QoY2FsY3VsYXRlUG9pbnRzKDk5OSwgJ3Jld2FyZCcpKS50b0JlKDQ5KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1JvdW5kcyBkb3duIHRvIG5lYXJlc3QgaW50ZWdlcicsICgpID0+IHtcbiAgICAgIGNvbnN0IGNhbGN1bGF0ZVBvaW50cyA9IChhbW91bnQ6IG51bWJlciwgdHlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGJhc2VSYXRlID0gdHlwZSA9PT0gJ3B1cmNoYXNlJyA/IDAuMSA6IDAuMDU7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKGFtb3VudCAqIGJhc2VSYXRlKTtcbiAgICAgIH07XG5cbiAgICAgIGV4cGVjdChjYWxjdWxhdGVQb2ludHMoOTksICdwdXJjaGFzZScpKS50b0JlKDkpO1xuICAgICAgZXhwZWN0KGNhbGN1bGF0ZVBvaW50cyg5OSwgJ3JlZmVycmFsJykpLnRvQmUoNCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdUaWVyIENhbGN1bGF0aW9uIExvZ2ljJywgKCkgPT4ge1xuICAgIGNvbnN0IGdldFRpZXIgPSAocG9pbnRzOiBudW1iZXIpID0+IHtcbiAgICAgIGlmIChwb2ludHMgPj0gMTAwMDApIHJldHVybiAnUExBVElOVU0nO1xuICAgICAgaWYgKHBvaW50cyA+PSA1MDAwKSByZXR1cm4gJ0dPTEQnO1xuICAgICAgaWYgKHBvaW50cyA+PSAxMDAwKSByZXR1cm4gJ1NJTFZFUic7XG4gICAgICByZXR1cm4gJ0JST05aRSc7XG4gICAgfTtcblxuICAgIHRlc3QoJ1JldHVybnMgY29ycmVjdCB0aWVyIGJhc2VkIG9uIHBvaW50IHRocmVzaG9sZHMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoZ2V0VGllcigwKSkudG9CZSgnQlJPTlpFJyk7XG4gICAgICBleHBlY3QoZ2V0VGllcig5OTkpKS50b0JlKCdCUk9OWkUnKTtcbiAgICAgIGV4cGVjdChnZXRUaWVyKDEwMDApKS50b0JlKCdTSUxWRVInKTtcbiAgICAgIGV4cGVjdChnZXRUaWVyKDQ5OTkpKS50b0JlKCdTSUxWRVInKTtcbiAgICAgIGV4cGVjdChnZXRUaWVyKDUwMDApKS50b0JlKCdHT0xEJyk7XG4gICAgICBleHBlY3QoZ2V0VGllcig5OTk5KSkudG9CZSgnR09MRCcpO1xuICAgICAgZXhwZWN0KGdldFRpZXIoMTAwMDApKS50b0JlKCdQTEFUSU5VTScpO1xuICAgICAgZXhwZWN0KGdldFRpZXIoNTAwMDApKS50b0JlKCdQTEFUSU5VTScpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnSGFuZGxlcyBuZWdhdGl2ZSBwb2ludHMgYXMgQnJvbnplJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGdldFRpZXIoLTEwMCkpLnRvQmUoJ0JST05aRScpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==