const images={
 'cucina-poco-spazio':'assets/guide-cucina.webp',cuffie:'assets/guide-cuffie.webp',
 'regali-smart-working-poco-spazio':'assets/tech.webp',
 'scrivania-pratica':'assets/tech.webp','giochi-creativi-bambini':'assets/building.webp',
 lettura:'assets/reader.webp',benessere:'assets/beauty.webp','sotto-30':'assets/budget.webp',
 tech:'assets/tech.webp',natale:'assets/cover.webp'
};
export function editorialImage(slug){return images[slug]||'assets/cover.webp';}
