import { faker } from '@faker-js/faker';
import { response } from '../../utils/response';
import { randomUUID } from 'node:crypto';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { env } from '../../config/env';
import { dynamoClient } from '../../clients/dynamoClient';

export async function handler() {
  const total = 10;

  const responses = await Promise.allSettled(
    Array.from({ length: total }, async () => {
      const command = new PutItemCommand({
        TableName: env.DYNAMO_LEADS_TABLE,
        Item: {
          id: { S: randomUUID() },
          name: { S: faker.person.fullName() },
          email: { S: faker.internet.email().toLowerCase() },
          jobTitle: { S: faker.person.jobTitle() },
        },
      });

      await dynamoClient.send(command);
    }),
  );

  const totalLeadsCreated = responses.filter(
    ({ status }) => status === 'fulfilled',
  ).length;

  return response(201, {
    totalLeadsCreated,
  });
}
