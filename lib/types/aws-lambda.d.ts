declare module 'aws-lambda' {
    export interface APIGatewayProxyEvent {
      body: string | null;
      headers: { [name: string]: string };
      httpMethod: string;
      isBase64Encoded: boolean;
      path: string;
      queryStringParameters: { [name: string]: string } | null;
      [key: string]: any;
    }
  
    export interface APIGatewayProxyResult {
      statusCode: number;
      headers?: { [header: string]: string };
      body: string;
    }
  
    export type APIGatewayProxyHandler = (
      event: APIGatewayProxyEvent
    ) => Promise<APIGatewayProxyResult>;
  }
  