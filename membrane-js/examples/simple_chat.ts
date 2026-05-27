import { Membrane } from '../src/client';

async function run() {
  const membrane = new Membrane();

  console.log("Sending standard chat completions query through Membrane Proxy...");
  const completion = await membrane.client.chat.completions.create({
    model: "membrane-engagement-layer",
    messages: [{ role: "user", content: "Extract liabilities from this contract..." }]
  });

  console.log("\nResponse:");
  console.log(completion.choices[0].message.content);
}

run().catch(console.error);
