import { paginateScan } from '@aws-sdk/client-dynamodb';
import { dynamoClient } from '../../clients/dynamoClient';
import { env } from '../../config/env';

// scanLeadsTable() -> Implementação interna para buscar items no dynamodb
export function getLeadsGenerator() {
  const paginator = paginateScan(
    { client: dynamoClient },
    { TableName: env.DYNAMO_LEADS_TABLE },
  );

  return paginator;
}
