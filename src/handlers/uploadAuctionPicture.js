import middy from "@middy/core";
import validator from "@middy/validator";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";

import uploadPictureSchema from "../lib/schemas/uploadPictureSchema";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";
import { setAuctionPicture } from "../lib/setAuctionPicture";
import { getAuctionsById } from "./getAuction";

async function uploadAuctionPicture(event, context) {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const auction = await getAuctionsById(id);

  if (email !== auction.seller) {
    throw new createError.Forbidden("You are not the seller of this auction!");
  }

  const base64 = event.body.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  let updatedAuction;
  try {
    const pictureUrl = await uploadPictureToS3(id + ".jpg", buffer);
    updatedAuction = await setAuctionPicture(id, pictureUrl);
  } catch (ex) {
    console.error(ex);
    throw new createError.InternalServerError(ex);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(
    validator({
      inputSchema: uploadPictureSchema,
    })
  );
