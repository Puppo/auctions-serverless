import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export async function closeAuction(auction) {
  return await dynamoDb
    .update({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id: auction.id },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeValues: {
        ":status": "CLOSED",
      },
      ExpressionAttributeNames: {
        "#status": "status",
      },
    })
    .promise();
}
