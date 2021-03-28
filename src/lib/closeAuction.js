import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuction(auction) {
  await dynamoDb
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

  const { seller, title, highestBid } = auction;
  const { amount, bidder } = highestBid;

  if (amount === 0) {
    return await sendMessage(
      seller,
      "No bids on your auction item :(",
      `Oh no! Your item "${title}" didn't get any bids. Better luck next time!`
    );
  }

  const notifySeller = sendMessage(
    seller,
    "Your item has been sold!",
    `Woohoo! Your itme "${title}" has been sold for $${amount}.`
  );

  const notifyBidder = sendMessage(
    bidder,
    "You won an auction!",
    `What a great deal! You got yourself a "${title}" for $${amount}.`
  );

  return await Promise.all([notifySeller, notifyBidder]);
}

function sendMessage(recipient, subject, body) {
  return sqs
    .sendMessage({
      QueueUrl: process.env.AUCTIONS_MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        recipient,
        subject,
        body,
      }),
    })
    .promise();
}
