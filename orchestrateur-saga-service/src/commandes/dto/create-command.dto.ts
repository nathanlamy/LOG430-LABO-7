// dto/create-commande.dto.ts
export class CreateCommandeDto {
  magasinId: number;
  items: { produitId: number; quantite: number }[];
  simulate?: {
    stockInsufficient?: boolean;
    venteFail?: boolean;
    failAfterVenteCreated?: boolean;
  };
}
