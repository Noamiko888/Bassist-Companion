import { GoogleGenAI, Type } from "@google/genai";
import { Lick, Difficulty, TimeSignature, Note } from '../types';

// Helper to sanitize and parse the response from Gemini
const parseAndValidateLick = (jsonString: string, difficulty: Difficulty, targetKey: string): Lick | null => {
  try {
    const data = JSON.parse(jsonString);

    if (!data.name || !data.artist || !data.category || !data.description || !data.timeSignature || !data.sequence) {
      console.error("Generated lick from Gemini is missing required fields:", data);
      return null;
    }

    const lick: Lick = {
      name: String(data.name),
      artist: String(data.artist),
      category: data.category as Lick['category'],
      description: String(data.description),
      difficulty: difficulty,
      timeSignature: data.timeSignature as TimeSignature,
      originalKey: targetKey,
      transposable: ['Scale', 'Arpeggio'].includes(data.category), // Only scales/arpeggios are transposable by default
      sequence: (data.sequence as any[]).map(item => {
        if (item === null || item === 0) return null;
        if (typeof item === 'object' && 'midi' in item && 'string' in item && 'fret' in item) {
          return {
            midi: Number(item.midi),
            string: Number(item.string),
            fret: Number(item.fret),
          } as Note;
        }
        return null;
      }).filter(n => n !== null), // Filter out any malformed entries
    };

    if (!['Warm-up', 'Scale', 'Arpeggio', 'Walking Bass', 'Funk'].includes(lick.category)) lick.category = 'Funk';
    if (!['4/4', '3/4', '7/4'].includes(lick.timeSignature)) lick.timeSignature = '4/4';
    if (!Array.isArray(lick.sequence)) return null;

    return lick;
  } catch (error) {
    console.error("Error parsing generated lick JSON from Gemini:", error);
    console.error("Raw string received from Gemini:", jsonString);
    return null;
  }
};

export const generateLick = async (difficulty: Difficulty, existingLickNames: string[], targetKey: string): Promise<Lick | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const noteSchema = {
        type: Type.OBJECT,
        properties: {
            midi: { type: Type.INTEGER, description: "The MIDI note number." },
            string: { type: Type.INTEGER, description: "The string number (0=G, 1=D, 2=A, 3=E)." },
            fret: { type: Type.INTEGER, description: "The fret number on that string." },
        },
        required: ["midi", "string", "fret"]
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: `A creative, short name for the bass lick. Do not use any of the following names: ${existingLickNames.join(', ')}` },
            artist: { type: Type.STRING, description: "The style or artist the lick is inspired by. E.g., 'Jaco Pastorius Style' or 'Classic Motown'." },
            category: { type: Type.STRING, description: "The category of the lick. Must be one of: 'Warm-up', 'Scale', 'Arpeggio', 'Walking Bass', 'Funk'." },
            description: { type: Type.STRING, description: "A brief, one or two sentence description of the lick and how to play it." },
            timeSignature: { type: Type.STRING, description: "The time signature. Must be one of: '4/4', '3/4', '7/4'." },
            sequence: { 
                type: Type.ARRAY, 
                items: {
                    oneOf: [noteSchema, { type: Type.NULL }],
                    description: "An array of Note objects or nulls for rests. Use null for a musical rest."
                },
                description: "An array of Note objects or nulls representing the lick. The array length implies the rhythm (e.g., 8 items for 8th notes in 4/4)." 
            },
        },
        required: ["name", "artist", "category", "description", "timeSignature", "sequence"]
    };

    const prompt = `
      You are an expert bassist and music theory teacher. Generate a new, original bass lick with the following specifications:
      - Difficulty: ${difficulty}
      - Key Signature: ${targetKey}
      - The lick should be musically interesting and useful for a bassist practicing at this level.
      - Do not generate a lick with a name that is already in this list: ${existingLickNames.join(', ')}.
      - Provide the output in a valid JSON format that adheres to the provided schema.

      MIDI Note and Fretboard Reference for a standard 4-string bass (EADG tuning):
      - G string (string: 0): open=43, 1st fret=44, ...
      - D string (string: 1): open=38, 1st fret=39, ...
      - A string (string: 2): open=33, 1st fret=34, ...
      - E string (string: 3): open=28, 1st fret=29, ...
      
      For the sequence array, use a JSON null for a musical rest. For each note, provide the MIDI value, the string it's played on, and the fret number.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    const jsonString = response.text;
    if (!jsonString) {
      console.error("Gemini response was empty.");
      return null;
    }

    return parseAndValidateLick(jsonString, difficulty, targetKey);

  } catch (error) {
    console.error("Error generating lick with Gemini:", error);
    return null;
  }
};
