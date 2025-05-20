import { Stripe } from "stripe";

const stripe = new Stripe(process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_method_id, payment_intent_id, customer_id, client_secret } =
      body;
     
      console.log('Received request to pay:', payment_method_id, payment_intent_id, customer_id, client_secret);
    if (!payment_method_id || !payment_intent_id || !customer_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const paymentMethod = await stripe.paymentMethods.attach(
      payment_method_id,
      { customer: customer_id },
    );
    console.log('Method:', paymentMethod)

    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: paymentMethod.id,
    });
    console.log("Payment successful:", JSON.stringify(result));
    

    return new Response(JSON.stringify({
        status: "success",
        result: result
    }));
  } catch (error) {
    console.error("Error paying:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}