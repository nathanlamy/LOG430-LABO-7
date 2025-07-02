import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const produitCount = await prisma.produit.count();
  if (produitCount === 0) {
    await prisma.produit.createMany({
      data: [
        { nom: 'Pommes', categorie: 'Fruits', prix: 0.99, description: 'Pomme rouge juteuse' },
        { nom: 'Savon', categorie: 'Hygiène', prix: 2.50, description: 'Savon doux pour les mains' },
        { nom: 'Lait', categorie: 'Épicerie', prix: 1.99, description: 'Lait 2% 1L' },
      ],
    });
  }

  const magasinCount = await prisma.magasin.count();
  if (magasinCount === 0) {
    await prisma.magasin.createMany({
      data: [
        { nom: 'Magasin Centre', quartier: 'Downtown' },
        { nom: 'Magasin Nord', quartier: 'Nord' },
        { nom: 'Magasin Sud', quartier: 'Sud' },
        { nom: 'Magasin Est', quartier: 'Est' },
        { nom: 'Magasin Ouest', quartier: 'Ouest' },
      ],
    });

    const produits = await prisma.produit.findMany();
    const magasins = await prisma.magasin.findMany();

    const stockData = magasins.flatMap(magasin =>
      produits.map(produit => ({
        magasinId: magasin.id,
        produitId: produit.id,
        quantite: 50,
        seuilCritique: 10,
      }))
    );

    await prisma.stock.createMany({ data: stockData });
  }

  const stockCentralCount = await prisma.stockCentral.count();
  if (stockCentralCount === 0) {
    const produits = await prisma.produit.findMany();
    await prisma.stockCentral.createMany({
      data: produits.map(p => ({
        produitId: p.id,
        quantite: 200,
        seuilCritique: 30,
      })),
    });
  }

  console.log('✅ Données initialisées.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
