// test/lambda.unit.test.ts
// Unit tests for Lambda function payment processor

import * as path from "path";

// Mock the Lambda handler
const lambdaPath = path.join(process.cwd(), "lib", "lambda", "index.js");
let handler: any;

describe("Lambda Function - Payment Processor", () => {
  beforeAll(() => {
    // Load the Lambda handler
    handler = require(lambdaPath).handler;
  });

  beforeEach(() => {
    // Set up environment variables
    process.env.REGION = "us-east-1";
    process.env.S3_BUCKET = "test-bucket";
    process.env.DB_ENDPOINT = "test-db.rds.amazonaws.com";
    process.env.ENVIRONMENT_SUFFIX = "test";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.REGION;
    delete process.env.S3_BUCKET;
    delete process.env.DB_ENDPOINT;
    delete process.env.ENVIRONMENT_SUFFIX;
  });

  test("handler is defined", () => {
    expect(handler).toBeDefined();
    expect(typeof handler).toBe("function");
  });

  test("handler returns successful response", async () => {
    const event = {
      body: JSON.stringify({ amount: 100, currency: "USD" })
    };

    const response = await handler(event);

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
  });

  test("handler response contains required fields", async () => {
    const event = {
      body: JSON.stringify({ amount: 100, currency: "USD" })
    };

    const response = await handler(event);
    const body = JSON.parse(response.body);

    expect(body.message).toBeDefined();
    expect(body.region).toBe("us-east-1");
    expect(body.timestamp).toBeDefined();
    expect(body.environmentSuffix).toBe("test");
  });

  test("handler uses environment variables correctly", async () => {
    process.env.REGION = "us-west-2";
    process.env.ENVIRONMENT_SUFFIX = "prod";

    const event = {
      body: JSON.stringify({ amount: 200, currency: "EUR" })
    };

    const response = await handler(event);
    const body = JSON.parse(response.body);

    expect(body.region).toBe("us-west-2");
    expect(body.environmentSuffix).toBe("prod");
  });

  test("handler includes timestamp in ISO format", async () => {
    const event = {
      body: JSON.stringify({ amount: 50, currency: "GBP" })
    };

    const response = await handler(event);
    const body = JSON.parse(response.body);

    expect(body.timestamp).toBeDefined();
    const timestamp = new Date(body.timestamp);
    expect(timestamp.toISOString()).toBe(body.timestamp);
  });

  test("handler processes empty event", async () => {
    const event = {};

    const response = await handler(event);

    expect(response).toBeDefined();
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
  });

  test("handler returns correct message", async () => {
    const event = {
      body: JSON.stringify({ amount: 100, currency: "USD" })
    };

    const response = await handler(event);
    const body = JSON.parse(response.body);

    expect(body.message).toBe("Payment processed successfully");
  });

  test("handler returns 200 status for all requests", async () => {
    const events = [
      { body: JSON.stringify({ amount: 100 }) },
      { body: JSON.stringify({ amount: 200, currency: "USD" }) },
      {},
      { body: "invalid json" }
    ];

    for (const event of events) {
      const response = await handler(event);
      expect(response.statusCode).toBe(200);
    }
  });
});
