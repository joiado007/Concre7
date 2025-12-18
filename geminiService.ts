
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getConstructionTip = async (area: number, totalPavers: number, modelName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `O usuário está calculando o paver modelo "${modelName}" para uma área de ${area}m² (total de ${totalPavers} peças). Dê uma dica curta e profissional de obra ou instalação especificamente para esse tipo de paver em português. Máximo de 15 palavras.`,
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao buscar dica do Gemini:", error);
    return "Mantenha as juntas preenchidas com areia fina para garantir o travamento.";
  }
};
