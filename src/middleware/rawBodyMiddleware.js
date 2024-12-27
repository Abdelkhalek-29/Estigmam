import bodyParser from "body-parser";
import express from "express";
//export const rawBodyMiddleware = bodyParser.raw({ type: "application/json" });

export const webhookMiddleware = express.raw({
  type: "application/json",
  verify: (req, res, buf) => {
    // Store raw body for signature verification
    req.rawBody = buf.toString();
  },
});
