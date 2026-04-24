 
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { envVars } from "../../config/env";
import status from "http-status";
import Stripe from "stripe";
import { PaymentService } from "./payment.service";
import { sendResponse } from "../../shared/SendResponse";

const handleStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error("Missing Stripe signature or webhook secret");
      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Missing Stripe signature or webhook secret" });
    }

    let event;
    try {
      event = Stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Error processing Stripe webhook" });
    }

    try {
      const result = await PaymentService.handleStripeWebhookEvent(event);
      sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: "Stripe webhook event processed successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error handling Stripe webhook event:", error);
      sendResponse(res, {
        success: false,
        httpStatusCode: status.INTERNAL_SERVER_ERROR,
        message: "Error handling stripe webhook event",
      });
    }
  }
);

export const PaymentController = {
  handleStripeWebhookEvent,
};
