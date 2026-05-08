import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const backendUrl = "https://contract-scanner-backend.onrender.com/api/govtech-swarm";
    
    const backendFormData = new FormData();
    backendFormData.append('file', new Blob([buffer], { type: file.type }), file.name);

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      body: backendFormData,
    });

    if (!backendResponse.ok) {
        const errText = await backendResponse.text();
        console.error("Backend Swarm Error:", errText);
        return NextResponse.json({ error: "Membrane Swarm Extraction Failed" }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Extraction routing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
