// src/ai/flows/suggest-specialist.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant specialist departments based on patient symptoms and medical history.
 *
 * - suggestSpecialist - A function that takes patient information and returns suggested specialist departments with priority.
 * - SuggestSpecialistInput - The input type for the suggestSpecialist function.
 * - SuggestSpecialistOutput - The return type for the suggestSpecialist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSpecialistInputSchema = z.object({
  symptoms: z.string().describe('A detailed description of the patient\'s symptoms.'),
  medicalHistory: z.string().describe('The patient\'s relevant medical history, including previous diagnoses and treatments.'),
  examHistory: z.string().optional().describe('The patient\'s previous examination history.'),
});
export type SuggestSpecialistInput = z.infer<typeof SuggestSpecialistInputSchema>;

const SuggestSpecialistOutputSchema = z.object({
  suggestedSpecialists: z.array(
    z.object({
      department: z.string().describe('The name of the specialist department.'),
      priority: z.number().describe('A numerical priority score, with lower numbers indicating higher priority.'),
      rationale: z.string().describe('The rationale for suggesting this specialist department.'),
    })
  ).describe('A list of suggested specialist departments, ordered by priority.'),
});
export type SuggestSpecialistOutput = z.infer<typeof SuggestSpecialistOutputSchema>;

export async function suggestSpecialist(input: SuggestSpecialistInput): Promise<SuggestSpecialistOutput> {
  return suggestSpecialistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSpecialistPrompt',
  input: {schema: SuggestSpecialistInputSchema},
  output: {schema: SuggestSpecialistOutputSchema},
  prompt: `You are an AI assistant that suggests specialist departments for a patient based on their symptoms, medical history and exam history (if available).

  Given the following patient information, suggest relevant specialist departments and prioritize them based on the likelihood that they can provide the necessary care. Provide a rationale for each suggestion.

  Symptoms: {{{symptoms}}}
  Medical History: {{{medicalHistory}}}
  Exam History: {{{examHistory}}}

  Format your response as a JSON array of specialist departments, ordered by priority (lower numbers indicate higher priority). Each object in the array should include the department name, a priority score, and a rationale for the suggestion.
  `,
});

const suggestSpecialistFlow = ai.defineFlow(
  {
    name: 'suggestSpecialistFlow',
    inputSchema: SuggestSpecialistInputSchema,
    outputSchema: SuggestSpecialistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
