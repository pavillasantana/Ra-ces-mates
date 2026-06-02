import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const products = [
  {
    name: "Mate Torpedo Premium",
    price: 45000,
    category: "mates-y-cuias",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3uBpTCWR4cn5bwTKdmWu648doP03WYxKq6AkuvIvAL_97XCZIqD-PAuCbkabTzz4YlIK5cTXQD1PIyPY0XxxxtiJNNfSklFe-iW_CEii5TC1ZbSPAPCPknZGwXYqryz5SM6DoVYkDJko3ed95jWTUB-Kb_RF8zRAWPGsJfcEVEJIBD2FwiZKXWm0r5UxAFwkCHnBt9OS76cSWYsXG7i35Kwpfpwpw33Hl17ZLuXVsYdVatwhUvpguYbmBOaBEcO1dt577IaMGpf-W",
    stock: 99
  },
  {
    name: "Mate Imperial Prata",
    price: 85000,
    category: "mates-y-cuias",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuac5uBWn9u61-r939Y6SoM7xWzdFF8g2mpqzZe_r4PFgO438j4YRbnDvMLGy7SPcW63fGiv-3n_RArPBmCLEHzA0U1TCq1U0XZzQC4IUY64VbJ8hB6PJ3sxELBzq5D6Ky-l-hAEG6iNw-FNLcV3eyDWRFCTiplmxEwnva9gHGh4Br-yDJjbYv_XYRYBUT0LNl-g8g9lCNj9DWgIw8qQNno819U97Em162UOkAJ1LeZV-4igp2W61Fsu4LF2KFdcdbIZu-2mCYCkNC7",
    stock: 99
  },
  {
    name: "Cuia de Madeira Rústica",
    price: 29000,
    category: "mates-y-cuias",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkYmjnw3c-CB58V2cCUTemiCHy5HI4dxkLCyjIDcaHNHUieu1Bq3sl9MpewX8Pg3sJdLOkii2izeOs4kX1MDq7YYxlRZ1rupeH1BTEKGxNc3YDJZUlkFF0GWZCNtfDB9aZlNamr7yDTD5PNKkqW-_FWRgHuYEjwthNOFzVbcJugWRBbqQpeaAJp12q_Ad03fvfW46zGzQJtBbZH0dexO9MsJq5FbWDRLFz9JZ8f8i0vqt-J_TPbf-2yMdXtEMHM8ZmCtnIVStyZojA",
    stock: 99
  },
  {
    name: "Bombilha Alpaca",
    price: 32000,
    category: "mates-y-cuias",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBmlBhBigvVPWmjRnXVtxHCq90fBCnSQ3UF1n0_l0DsMdLqYa_vrv1kPIvL6vUh2FwQWVXBCaikseTcL9ilZUN9CN_XoTh2QnZa7z6R7myvjU8nqXBjt-gB0fx6W5jreTUlEyqWSyySZ4dyARMHfHGlvP1WUqv6_o2oOFz1B8rGdGNj8U5I2ga7Os2w84dPcqdSzhzH_DrN4hZDZVIOEf5IKuBpAeyr8DAQ2dMV4iFQjtynS8QbjD-kUYZhXgNl6W87yboBsG0rP5m",
    stock: 99
  },
  {
    name: "Yerba Mate Orgânica Premium 500g",
    price: 12000,
    category: "yerba-mate",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCD9syTpd148fvkt4a2DOHOoP7orD_sALeHGOOKjIcaPI27D2THhDwxkJte2xPDtlsxWZW0phIYrQP8fnkrIP0Zq6ktQv4TF5WNYZukr_lFlslAzX3egsgERWrU89P5JZkn7rOR-fv23n6n9WkBscwypGaUFb5rxN6k2WZ9Gm0iugvMhBhS7_r2Jap-FClCo_nH1lR7OYXxOdjZ6fC9icb5VxNBvRaJ-RgBOi2NoeuSvzWVtLTllfNS05z1U4VZTE05zDSKo5TmD0",
    stock: 99
  },
  {
    name: "Yerba Mate Barbacuá Especial 500g",
    price: 15000,
    category: "yerba-mate",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGCD9syTpd148fvkt4a2DOHOoP7orD_sALeHGOOKjIcaPI27D2THhDwxkJte2xPDtlsxWZW0phIYrQP8fnkrIP0Zq6ktQv4TF5WNYZukr_lFlslAzX3egsgERWrU89P5JZkn7rOR-fv23n6n9WkBscwypGaUFb5rxN6k2WZ9Gm0iugvMhBhS7_r2Jap-FClCo_nH1lR7OYXxOdjZ6fC9icb5VxNBvRaJ-RgBOi2NoeuSvzWVtLTllfNS05z1U4VZTE05zDSKo5TmD0",
    stock: 99
  },
  {
    name: "Vela Aromatizante Sândalo e Mel",
    price: 14000,
    category: "velas-y-inciensos",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=400&auto=format&fit=crop",
    stock: 99
  },
  {
    name: "Incensos Naturais de Copal e Lavanda",
    price: 8500,
    category: "velas-y-inciensos",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=400&auto=format&fit=crop",
    stock: 99
  },
  {
    name: "Mateira de Couro Rústica",
    price: 25000,
    category: "artesanias",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=400&auto=format&fit=crop",
    stock: 99
  },
  {
    name: "teste v1",
    price: 155,
    category: "artesanias",
    image: "https://dcdn-us.mitiendanube.com/assets/stores/img/no-photo-1024-1024.webp",
    stock: 99
  }
];

async function seedDatabase() {
  if (!MONGO_URI || MONGO_URI.includes('<usuario>')) {
    console.error('⚠️ MONGO_URI não está devidamente configurada no arquivo .env.');
    console.error('Configure uma URI válida do MongoDB Atlas antes de executar o seeding.');
    process.exit(1);
  }

  try {
    console.log('🔄 Conectando ao MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexão estabelecida com sucesso!');

    console.log('🧹 Limpando coleção de produtos existente...');
    await Product.deleteMany({});
    console.log('✅ Coleção limpa.');

    console.log('🌱 Populando o banco com os produtos do catálogo Raíces...');
    const createdProducts = await Product.insertMany(products);
    console.log(`🎉 Sucesso! Inseridos ${createdProducts.length} produtos.`);

    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB. Processo encerrado com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
