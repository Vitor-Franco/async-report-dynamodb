import type { APIGatewayProxyResultV2 } from 'aws-lambda';

// APIGatewayProxyResultV2 -> V2 representa a APIGW com HTTPApi
export function response(
  statusCode: number,
  body: Record<string, any>,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    body: body && JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}
