import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, model, messages, max_tokens, temperature, response_format } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages,
          max_tokens: max_tokens || 4000,
          temperature: temperature ?? 0.1,
          response_format,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `OpenAI Error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (choice?.finish_reason === "content_filter") {
        return NextResponse.json({
          error: "OpenAI API blocked the response due to content safety filters. This typically occurs when a prompt or document matches automated PII/safety checks."
        }, { status: 422 });
      }
      return NextResponse.json(data);
    } else if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-3-5-sonnet-20241022",
          messages: messages.map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
          max_tokens: max_tokens || 4000,
          temperature: temperature ?? 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Anthropic Error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      const contentText = data.content?.[0]?.text || "";
      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: contentText,
            },
          },
        ],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      });
    } else if (provider === "gemini") {
      const geminiModel = model || "gemini-1.5-flash";
      const systemMessage = messages.find((m: any) => m.role === "system");
      const userMessages = messages.filter((m: any) => m.role !== "system");

      const requestBody: any = {
        contents: userMessages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          maxOutputTokens: max_tokens || 4000,
          temperature: temperature ?? 0.1,
          ...(response_format?.type === "json_object" ? { responseMimeType: "application/json" } : {})
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      };

      if (systemMessage) {
        requestBody.systemInstruction = {
          parts: [{ text: systemMessage.content }]
        };
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Gemini Error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      
      const candidate = data.candidates?.[0];
      const finishReason = candidate?.finishReason;
      if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
        return NextResponse.json({
          error: `Gemini API blocked the response. Finish reason: ${finishReason}. This is typically triggered by Gemini's strict default safety/PII filters when analyzing full documents containing personal names, addresses, or signatures.`
        }, { status: 422 });
      }

      if (!data.candidates || data.candidates.length === 0) {
        const blockReason = data.promptFeedback?.blockReason;
        if (blockReason) {
          return NextResponse.json({
            error: `Gemini API blocked the prompt. Reason: ${blockReason}.`
          }, { status: 422 });
        }
        return NextResponse.json({
          error: "Gemini API returned an empty response with no candidates."
        }, { status: 400 });
      }

      const contentText = candidate?.content?.parts?.map((p: any) => p.text || "").join("") || "";
      
      // Calculate completion tokens including reasoning/thoughts tokens
      const promptTokens = data.usageMetadata?.promptTokenCount || 0;
      const totalTokens = data.usageMetadata?.totalTokenCount || 0;
      const completionTokens = totalTokens > promptTokens 
        ? (totalTokens - promptTokens) 
        : (data.usageMetadata?.candidatesTokenCount || 0);

      return NextResponse.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: contentText,
            },
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      });
    } else {
      return NextResponse.json({ error: `Provider ${provider} is not supported` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Direct LLM Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to contact LLM provider" }, { status: 500 });
  }
}
