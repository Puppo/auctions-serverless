import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";
import validator from "@middy/validator";
import createError from "http-errors";

import commonMiddleware from "../lib/commonMiddleware";
import createAuctionsSchema from "../lib/schemas/createAuctionsSchema";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const { title } = event.body;
  const { email } = event.requestContext.authorizer;
  const start = new Date();
  const end = new Date();
  end.setHours(end.getHours() + 1);

  const newAuction = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: start.toISOString(),
    endingAt: end.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email,
  };

  try {
    await dynamoDb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: newAuction,
      })
      .promise();
  } catch (ex) {
    console.error(ex);
    throw new createError.InternalServerError(ex);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(newAuction),
  };
}

export const handler = commonMiddleware(createAuction).use(
  validator({
    inputSchema: createAuctionsSchema,
  })
);
