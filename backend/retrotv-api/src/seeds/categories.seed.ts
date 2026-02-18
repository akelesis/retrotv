import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Program } from '../programs/entities/program.entity';
import 'dotenv/config';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'retrotv',
  password: process.env.DATABASE_PASSWORD || 'change_me',
  database: process.env.DATABASE_NAME || 'retrotv_db',
  entities: [Category, Program],
});

const categories = [
  { name: 'Ação', description: 'Filmes e séries de ação', icon: 'sword', color: '#E53935' },
  { name: 'Aventura', description: 'Aventuras épicas e exploração', icon: 'compass', color: '#FF8F00' },
  { name: 'Comédia', description: 'Humor e diversão', icon: 'laugh', color: '#FDD835' },
  { name: 'Drama', description: 'Histórias dramáticas e emocionantes', icon: 'theater', color: '#8E24AA' },
  { name: 'Fantasia', description: 'Mundos mágicos e fantásticos', icon: 'wand', color: '#5C6BC0' },
  { name: 'Ficção Científica', description: 'Ciência e tecnologia futurista', icon: 'rocket', color: '#00ACC1' },
  { name: 'Terror', description: 'Suspense e horror', icon: 'ghost', color: '#212121' },
  { name: 'Romance', description: 'Histórias de amor', icon: 'heart', color: '#EC407A' },
  { name: 'Documentário', description: 'Conteúdo educativo e documental', icon: 'film', color: '#78909C' },
  { name: 'Animação', description: 'Desenhos animados e animações', icon: 'palette', color: '#66BB6A' },
  { name: 'Musical', description: 'Música e performances', icon: 'music', color: '#AB47BC' },
  { name: 'Esporte', description: 'Conteúdo esportivo', icon: 'trophy', color: '#29B6F6' },
  { name: 'Notícias', description: 'Jornalismo e informação', icon: 'newspaper', color: '#546E7A' },
  { name: 'Infantil', description: 'Conteúdo para crianças', icon: 'star', color: '#FFCA28' },
  { name: 'Variedades', description: 'Programas de variedades e entretenimento', icon: 'tv', color: '#26A69A' },
];

async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Category);

  for (const cat of categories) {
    const exists = await repo.findOne({ where: { name: cat.name } });
    if (!exists) {
      await repo.save(repo.create(cat));
      console.log(`+ ${cat.name}`);
    } else {
      console.log(`= ${cat.name} (já existe)`);
    }
  }

  console.log('\nSeed concluído!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
