import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const { title } = JSON.parse(event.body);

  const newAuction = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };

  await dynamoDb
    .put({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: newAuction,
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify(newAuction),
  };
}

export const handler = createAuction;
