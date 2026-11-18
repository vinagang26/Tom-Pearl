import { z } from 'zod';
export function validatedProvider(raw, onRequest = () => { }) { return { async generateJson({ system, user, schema, images, check = () => { } }) { let cause; for (let attempt = 0; attempt < 2; attempt++) {
        try {
            onRequest();
            const response = await raw({ system, user: user + (attempt ? '\nYour previous answer failed validation. Correct it and return valid JSON.' : ''), schema: z.toJSONSchema(schema), images });
            const json = typeof response === 'string' ? JSON.parse(response.replace(/^```(?:json)?\s*|\s*```$/g, '')) : response;
            const data = schema.parse(json);
            check(data);
            return data;
        }
        catch (error) {
            cause = error;
        }
    } throw Error('AI response could not be validated after one retry. Try again or use the manual fallback. ' + (cause?.message?.includes('request failed') ? cause.message : '')); } }; }
