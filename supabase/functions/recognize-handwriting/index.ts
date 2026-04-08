import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, expectedWord, checkMode } = await req.json();

    if (!imageBase64 || !expectedWord) {
      return new Response(JSON.stringify({ error: "Missing imageBase64 or expectedWord" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const modeHint = checkMode === "word"
      ? "a single Arabic word"
      : checkMode === "2words"
      ? "two Arabic words written together"
      : checkMode === "half"
      ? "multiple Arabic words (half a verse)"
      : checkMode === "full"
      ? "a full Arabic verse (multiple words)"
      : "Arabic text";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an Arabic handwriting recognition expert. The user will draw ${modeHint} on a canvas. You must determine if the drawn text matches the expected Arabic text. Be VERY lenient and forgiving with handwriting quality - the user is practicing and learning. Accept the drawing if you can recognize even a rough resemblance to the expected text's letter shapes. Focus on whether the general shape and flow matches, not perfection. For multi-word checks, the words may be written across the canvas in any arrangement - they don't have to be in a single line. Even if messy or incomplete, if it roughly looks like the text, mark it as a match. Respond with ONLY a JSON object: {"match": true/false, "recognized": "the text you think was drawn"}. No other text.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `The expected Arabic text is: "${expectedWord}". Does the handwritten image match this text?`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${imageBase64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    let result = { match: false, recognized: "" };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse AI response:", content);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
