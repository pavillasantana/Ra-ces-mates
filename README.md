# RAÍCES — Artesanal Heritage (MVP)

Este é o repositório frontend para o e-commerce RAÍCES, desenhado focado no mercado da Argentina, com o conceito visual de *Tactile Modernism* e arquitetura Jamstack.

## Stack Tecnológica
- **Frontend**: React + Vite
- **Estilização**: Vanilla CSS (CSS Variables para cores e temas consistentes)
- **Gerenciamento de Estado**: Zustand (`cartStore.js`)
- **Deploy Recomendado**: Vercel ou Netlify

## Estrutura do Projeto
- `src/App.jsx`: Componente principal que coordena a Home e a Sidebar do Carrinho.
- `src/App.css`: Estilização global da loja e da sidebar do carrinho.
- `src/components/CheckoutTransfer.jsx`: Modal/Página especializada de Finalização de Compra com 10% de desconto por transferência.
- `src/store/cartStore.js`: Loja Zustand que lida com as regras de negócio de adição/remoção/limpeza de itens.

## Lógica de Negócios MVP Incluídas
1. **Vitrine**: Exibição dos itens "Cuias Artesanais", "Ervas", e "Kits" com design imersivo.
2. **Carrinho (Sidebar)**: Adição e somatório dinâmico com cálculo secundário exibindo preço promocional para *Transferência*.
3. **Checkout Nativo de WhatsApp**: Integração que agrupa os itens e informações de frete, validando e mandando tudo diretamente via URL do WhatsApp do lojista para o fechamento manual sem comissões.

## Comandos de Inicialização

1. **Rodar em Desenvolvimento (Local)**:
   ```bash
   npm run dev
   ```

2. **Gerar Versão de Produção**:
   ```bash
   npm run build
   ```

3. **Deploy (Vercel)**:
   O projeto já contém o arquivo `vercel.json`. Basta subir o código para o GitHub e conectar ao [Vercel](https://vercel.com/) que ele reconhecerá o Vite automaticamente.
