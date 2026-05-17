import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, metadata, project } = body;

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: "No webhook URL configured" }, { status: 500 });
    }

    let color = 3447003; // default blue
    if (event === "Waitlist_Email_Submitted") color = 5763719; // green
    else if (event.includes("Clicked")) color = 15548997; // red
    else if (event.includes("Opened")) color = 16776960; // yellow

    let description = `**Event:** \`${event}\``;
    if (metadata) {
      description += `\n**Metadata:**\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``;
    }

    const payload = {
      embeds: [
        {
          title: `Pulse Telemetry | ${project}`,
          color: color,
          description: description,
          timestamp: new Date().toISOString()
        }
      ]
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
