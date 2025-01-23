import { type AttributeValue, ScanCommand } from '@aws-sdk/client-dynamodb';
import { env } from '../../config/env';
import { dynamoClient } from '../../clients/dynamoClient';

export async function* scanLeadsTable() {
  let prevEvaluatedKey: Record<string, AttributeValue> | undefined;

  do {
    const command = new ScanCommand({
      TableName: env.DYNAMO_LEADS_TABLE,
      ExclusiveStartKey: prevEvaluatedKey,
    });

    const { Items = [], LastEvaluatedKey } = await dynamoClient.send(command);

    prevEvaluatedKey = LastEvaluatedKey;
    yield Items;
  } while (prevEvaluatedKey);
}
