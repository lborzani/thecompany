import { get, set, del, keys } from 'idb-keyval';
import { CampaignMetadata, SavedGameState } from '@thecompany/shared-types';

// Re-export for convenience
export type { CampaignMetadata, SavedGameState } from '@thecompany/shared-types';

const CAMPAIGN_PREFIX = 'campaign-';

export const storageService = {
  // Gera um ID novo
  generateId: () => crypto.randomUUID(),

  // Salva o estado completo de uma campanha
  saveCampaign: async (state: SavedGameState) => {
    if (!state.campaignId) return;
    await set(`${CAMPAIGN_PREFIX}${state.campaignId}`, {
      ...state,
      lastPlayed: Date.now()
    });
  },

  // Carrega uma campanha específica
  loadCampaign: async (id: string): Promise<SavedGameState | null> => {
    return (await get(`${CAMPAIGN_PREFIX}${id}`)) || null;
  },

  // Lista todas as campanhas salvas (apenas metadados para o menu)
  listCampaigns: async (): Promise<CampaignMetadata[]> => {
    const allKeys = await keys();
    const campaignKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(CAMPAIGN_PREFIX));
    
    const campaigns: CampaignMetadata[] = [];
    for (const key of campaignKeys) {
        const data = await get(key);
        if (data) {
            campaigns.push({
                id: data.campaignId,
                name: data.campaignName,
                lastPlayed: data.lastPlayed || Date.now(),
                createdAt: data.createdAt || Date.now(),
            });
        }
    }
    return campaigns.sort((a, b) => b.lastPlayed - a.lastPlayed);
  },

  // Deleta uma campanha
  deleteCampaign: async (id: string) => {
    await del(`${CAMPAIGN_PREFIX}${id}`);
  }
};