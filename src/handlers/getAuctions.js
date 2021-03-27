import AWS from "aws-sdk";
import validator from "@middy/validator";
import createError from "http-errors";
import getAuctionsSchema from "../lib/schemas/getAuctionsSchema";

import commonMiddleware from "../lib/commonMiddleware";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  const { status } = event.queryStringParameters;
  let auctions;
  try {
    const results = await dynamoDb
      .query({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        IndexName: "statusAndEndDate",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeValues: {
          ":status": status,
        },
        ExpressionAttributeNames: {
          "#status": "status",
        },
      })
      .promise();

    auctions = results.Items;
  } catch (ex) {
    console.error(ex);
    throw new createError.InternalServerError(ex);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(getAuctions).use(
  validator({
    inputSchema: getAuctionsSchema,
    ajvOptions: { useDefaults: true },
  })
);
