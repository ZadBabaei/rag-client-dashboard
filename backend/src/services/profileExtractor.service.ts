import OpenAI from "openai";

import { config } from "../config";

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

type ExtractedFamilyMember = {
  name: string;
  relationship: string;
  age?: number;
};

type ExtractedProfile = {
  aum?: number;
  riskTolerance?: string;
  goals?: string[];
  familyMembers?: ExtractedFamilyMember[];
};

export async function extractProfile(text: string): Promise<ExtractedProfile> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Extract the following fields from the document if present. Return valid JSON only, no markdown. Fields: { aum: number|null, riskTolerance: string|null, goals: string[]|null, familyMembers: [{name: string, relationship: string, age?: number}]|null }",
        },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {};
    }

    // Strip markdown code fences if present
    const cleanContent = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const parsed = JSON.parse(cleanContent) as {
      aum?: number | null;
      riskTolerance?: string | null;
      goals?: string[] | null;
      familyMembers?: ExtractedFamilyMember[] | null;
    };

    const extracted: ExtractedProfile = {};

    if (parsed.aum !== null && parsed.aum !== undefined) {
      extracted.aum = parsed.aum;
    }

    if (parsed.riskTolerance !== null && parsed.riskTolerance !== undefined) {
      extracted.riskTolerance = parsed.riskTolerance;
    }

    if (parsed.goals !== null && parsed.goals !== undefined) {
      extracted.goals = parsed.goals;
    }

    if (parsed.familyMembers !== null && parsed.familyMembers !== undefined) {
      extracted.familyMembers = parsed.familyMembers;
    }

    return extracted;
  } catch (error) {
    console.warn("Profile extraction failed:", error);
    return {};
  }
}
