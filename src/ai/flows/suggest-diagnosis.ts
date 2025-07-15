'use server';

/**
 * @fileOverview An AI agent that suggests possible diagnoses based on patient information.
 *
 * - suggestDiagnosis - A function that takes patient symptoms, medical history, and previous examination records to suggest possible diagnoses.
 * - SuggestDiagnosisInput - The input type for the suggestDiagnosis function.
 * - SuggestDiagnosisOutput - The return type for the suggestDiagnosis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDiagnosisInputSchema = z.object({
  symptoms: z.string().describe('The symptoms reported by the patient.'),
  medicalHistory: z.string().describe('The patient medical history.'),
  examinationRecords: z.string().optional().describe('Previous examination records of the patient, if available.'),
});
export type SuggestDiagnosisInput = z.infer<typeof SuggestDiagnosisInputSchema>;

const SuggestDiagnosisOutputSchema = z.object({
  possibleDiagnoses: z.array(z.string()).describe('An array of possible diagnoses based on the provided information.'),
  suggestedSpecialties: z.array(z.string()).describe('An array of suggested medical specialties to consult.'),
  priority: z.string().describe('The priority of the diagnoses, e.g., high, medium, low.'),
});
export type SuggestDiagnosisOutput = z.infer<typeof SuggestDiagnosisOutputSchema>;

export async function suggestDiagnosis(input: SuggestDiagnosisInput): Promise<SuggestDiagnosisOutput> {
  return suggestDiagnosisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDiagnosisPrompt',
  input: {schema: SuggestDiagnosisInputSchema},
  output: {schema: SuggestDiagnosisOutputSchema},
  prompt: `You are an AI assistant that helps doctors by suggesting possible diagnoses based on the patient's symptoms, medical history, and previous examination records.

  Based on the following information, suggest a list of possible diagnoses, a list of suggested medical specialties to consult, and a priority for the diagnoses.

  Symptoms: {{{symptoms}}}
  Medical History: {{{medicalHistory}}}
  Examination Records: {{{examinationRecords}}}

  Format your response as a JSON object with the following keys:
  - possibleDiagnoses: An array of possible diagnoses.
  - suggestedSpecialties: An array of suggested medical specialties to consult.
  - priority: The priority of the diagnoses (high, medium, or low).`,
});

const suggestDiagnosisFlow = ai.defineFlow(
  {
    name: 'suggestDiagnosisFlow',
    inputSchema: SuggestDiagnosisInputSchema,
    outputSchema: SuggestDiagnosisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
