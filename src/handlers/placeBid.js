import AWS from "aws-sdk";
import createError from "http-errors";
import validator from "@middy/validator";

import commonMiddleware from "../lib/commonMiddleware";
import placeBidSchema from "../lib/schemas/placeBidSchema";
import { getAuctionsById } from "./getAuction";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const { amount } = event.body;

  const auction = await getAuctionsById(id);

  if (email === auction.seller) {
    throw new createError.Forbidden(`You cannot bid on your own auction`);
  }

  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden(`You are already the highest bidder`);
  }

  if (auction.status !== "OPEN") {
    throw new createError.Forbidden(`You cannot bid on close auction`);
  }

  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(
      `Your bid must be higher than ${auction.highestBid.amount}`
    );
  }

  let updatedAuction;
  try {
    const params = {
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression:
        "set highestBid.amount = :amount, highestBid.bidder = :bidder",
      ExpressionAttributeValues: {
        ":amount": amount,
        ":bidder": email,
      },
      ReturnValues: "ALL_NEW",
    };
    const result = await dynamoDb.update(params).promise();

    updatedAuction = result.Attributes;
  } catch (ex) {
    console.error(ex);
    throw new createError.InternalServerError(ex);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid).use(
  validator({
    inputSchema: placeBidSchema,
  })
);
