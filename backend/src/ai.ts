import Anthropic from '@anthropic-ai/sdk';
import {Resource} from "sst";
import * as fs from "node:fs";

interface TextBlock {
    type: 'text';
    text: string;
}

async function analyzePDF(pdfPath: string): Promise<string> {
    try {
        // Validate PDF file exists
        if (!fs.existsSync(pdfPath)) {
            throw new Error('PDF file not found');
        }

        // Read the PDF file and convert to base64
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');

        // Initialize Anthropic client
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        // Make API request
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [
                {
                    role: "assistant",
                    content: "Determine if the attached legal document contains evidence of fraud. I strictly want you to only return one number on a scale of 0-1 depending on how much fraud you detect, with '0' meaning extreme fraud detected and '1' meaning absolutely no signs of fraud found."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "document",
                            source: {
                                type: "base64",
                                media_type: "application/pdf",
                                data: pdfBase64
                            }
                        }
                    ]
                }
            ]
        });

        return response.content
            .filter(block => block.type === 'text')
            .map(block => (block as TextBlock).text)
            .join('\n');

    } catch (error) {
        throw new Error(`Failed to analyze PDF`);
    }
}

async function analyzeText(inputText: string): Promise<string> {
    try {
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1024,
            messages: [
                {
                    role: "assistant",
                    content: "The attached text is transcribed from a video interview. Determine if you believe the interviewee is potentially making false claims. I strictly want you to only return one number on a scale of 0-1 depending on how much fraud you detect, with '0' meaning extreme fraud detected and '1' meaning absolutely no signs of fraud found."
                },
                {
                    role: "user",
                    content: inputText
                }
            ]
        });

        return response.content
            .filter(block => block.type === 'text')
            .map(block => (block as TextBlock).text)
            .join('\n');

    } catch (error) {
        console.error('Error analyzing text:', error);
        throw error;
    }
}
