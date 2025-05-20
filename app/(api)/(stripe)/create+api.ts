import { Stripe } from "stripe";

const stripe = new Stripe(process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  console.log('Received request to create payment intent');
  const body = await request.json();
  console.log('Request body:', body);
  const { name, email, amount } = body;

  if (!name || !email || !amount) {
    console.error('Missing required fields:', { name, email, amount });
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  let customer;
  const doesCustomerExist = await stripe.customers.list({
    email,
  });

  if (doesCustomerExist.data.length > 0) {
    customer = doesCustomerExist.data[0];
  } else {
    const newCustomer = await stripe.customers.create({
      name,
      email,
    });

    customer = newCustomer;
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2024-06-20" },
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: parseInt(amount) * 100,
    currency: "usd",
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });
  console.log('Created payment intent:', paymentIntent.id);

  const responseData = {
    paymentIntent: paymentIntent,
    ephemeralKey: ephemeralKey,
    customer: customer.id,
  };
  console.log('Returning response:', responseData);
  return new Response(
    JSON.stringify(responseData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}