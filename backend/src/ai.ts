import Anthropic from "@anthropic-ai/sdk";
import { Resource } from "sst";
import * as fs from "node:fs";

interface TextBlock {
  type: "text";
  text: string;
}

export async function analyzePDF(pdfPath: string) {
  try {
    // Validate PDF file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF file not found");
    }

    // Read the PDF file and convert to base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString("base64");
    console.log(Resource.Anthropic.value);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: Resource.Anthropic.value,
    });

    // Make API request
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "assistant",
          content:
            "Determine if the attached legal document contains evidence of fraud. I strictly want you to only return one number on a scale of 0-10 depending on how much fraud you detect, with '0' meaning extreme fraud detected and '10' meaning absolutely no signs of fraud found. Remember, the ONLY thing you should be returning is the number; please, there should be no other text in your response, do not return a paragraph after the number",
        },
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
          ],
        },
      ],
    });

    return parseInt(
      response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as TextBlock).text)
        .join("\n")
        .match(/\d+/)?.[0] || "0",
    );
  } catch (error) {
    console.error("Error analyzing PDF:", error);
    throw new Error(`Failed to analyze PDF`);
  }
}

async function analyzeText(inputText: string): Promise<string> {
  try {
    const anthropic = new Anthropic({
      apiKey: Resource.Anthropic.value,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [
        {
          role: "assistant",
          content:
            "The attached text is transcribed from a video interview. Determine if you believe the interviewee is potentially making false claims. I strictly want you to only return one number on a scale of 0 to 10 depending on how much fraud you detect, with '0' meaning extreme fraud detected and '10' meaning absolutely no signs of fraud found. Remember, only return the number, absolutely nothing else.",
        },
        {
          role: "user",
          content: inputText,
        },
      ],
    });

    return response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as TextBlock).text)
      .join("\n");
  } catch (error) {
    console.error("Error analyzing text:", error);
    throw error;
  }
}

export async function analyzeImage(imgPath: string) {
  try {
    // Validate PDF file exists
    if (!fs.existsSync(imgPath)) {
      throw new Error("PDF file not found");
    }

    // Read the PDF file and convert to base64
    const imgBuffer = fs.readFileSync(imgPath);
    const imgBase64 = imgBuffer.toString("base64");
    console.log(Resource.Anthropic.value);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: Resource.Anthropic.value,
    });

    // Make API request
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "assistant",
          content:
            "Analyze this image of home damage. Please estimate the total cost in USD to repair all visible damage. Base your estimate on typical US contractor rates and material costs. Return ONLY a number representing the total estimated cost - no dollar sign, no commas, no additional text. For example: 25000. I will give you a tip if you do a good job",
        },
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: imgBase64,
              },
            },
          ],
        },
      ],
    });
    console.log(
      response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as TextBlock).text),
    );

    return parseInt(
      response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as TextBlock).text)
        .join("\n")
        .match(/\d+/)?.[0] || "0",
    );
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error(`Failed to analyze image`);
  }
}
