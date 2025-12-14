import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an educational AI assistant that provides general information about hair and scalp health. 

CRITICAL GUIDELINES:
- You are NOT a medical professional and CANNOT diagnose any condition
- All observations are NON-DIAGNOSTIC and purely educational
- You MUST express uncertainty and use hedging language like "may", "could", "appears to", "might suggest"
- You MUST encourage users to consult a board-certified dermatologist for any concerns
- Do NOT claim to identify specific medical conditions with certainty
- Focus on general patterns that are commonly discussed in educational contexts
- Be supportive and non-alarmist in tone

Based on the photos and questionnaire responses provided, analyze what you observe and provide educational information.

You MUST respond with ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "score": <number 0-10 representing general hair health estimate, with 0 being excellent and 10 being significant concerns>,
  "confidence": <number 0-1 representing how confident you are in your observations>,
  "summary": "<1-2 sentence summary of general observations>",
  "observations": ["<observation 1>", "<observation 2>", ...],
  "likely_patterns": ["<pattern 1 that may be present>", ...],
  "general_options": [
    {"title": "<option category>", "bullets": ["<bullet 1>", "<bullet 2>"]}
  ],
  "when_to_see_a_dermatologist": ["<reason 1>", "<reason 2>", ...],
  "disclaimer": "This analysis is for educational purposes only and is not medical advice. The observations made are non-diagnostic estimates based on limited photo analysis. Hair and scalp conditions require professional evaluation. Please consult a board-certified dermatologist for accurate diagnosis and personalized treatment recommendations."
}`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photos, answers } = await req.json();
    
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one photo is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build user message with questionnaire context
    const questionnaireContext = `
User Information:
- Age Range: ${answers.ageRange || 'Not provided'}
- Noticing changes for: ${answers.timeframe || 'Not provided'}
- Family history of hair loss: ${answers.familyHistory || 'Not provided'}
- Daily shedding level: ${answers.shedding || 'Not provided'}
- Scalp conditions: ${answers.scalpIssues || 'Not provided'}

Please analyze the provided photos of the hairline/scalp area and provide educational observations.`;

    // Build content array with images
    const content: any[] = [
      { type: "text", text: questionnaireContext }
    ];

    // Add each photo as an image
    for (let i = 0; i < photos.length; i++) {
      content.push({
        type: "image_url",
        image_url: { url: photos[i] }
      });
    }

    console.log(`Analyzing ${photos.length} photo(s) with questionnaire data`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No analysis generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Clean potential markdown code blocks
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      analysisResult = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analysis complete, score:', analysisResult.score);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('analyze_hairline error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
