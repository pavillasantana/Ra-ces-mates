# Plano de Implantação: RAÍCES — ARTESANAL HERITAGE MVP

## 1. Visão Geral
Este documento descreve o plano passo a passo para desenvolver o e-commerce RAÍCES, uma plataforma de alta performance, focada na venda de mates artesanais premium para o mercado argentino, com arquitetura preparada para expansão futura ao Brasil.

## 2. Stack Tecnológica (Jamstack)
- **Framework Frontend**: Vite + React ou Next.js (SSG/SSR) para SEO máximo.
- **Estilização**: Vanilla CSS, garantindo máxima flexibilidade e controle no visual ("tactile modernism").
- **Hospedagem/Deploy**: Vercel ou Netlify, ideal para Jamstack e altíssima velocidade.
- **E-commerce/Carrinho**: Solução de estado customizada (Zustand/Context API) conectada aos gateways de pagamento.

## 3. Fases de Desenvolvimento

### Fase 1: Fundação e Setup do Projeto
1. **Inicialização do Repositório**:
   - Criação da estrutura com React/Next.js.
   - Configuração do TypeScript para maior estabilidade e escalabilidade.
2. **Implementação do Design System (Vanilla CSS)**:
   - Configuração no `index.css` de tipografias (serifadas clássicas e lineares geométricas).
   - Variáveis CSS de cores: 
     - `--color-bg-primary`: `#FCF9F3` (Marfim/Creme Acetinado)
     - `--color-text-primary`: `#1C1C18` (Grafite Escuro)
     - `--color-accent-green`: `#18281A` (Verde Floresta Profundo)
     - `--color-highlight-terracotta`: `#934B19` (Terracota e Madeira)
     - `--color-highlight-orange`: `#FFA26A` (Laranja Suave)
3. **Estrutura de Internacionalização (i18n)**:
   - Setup inicial para dicionário de idiomas, com chaveador ES/PT funcional, preparando o terreno para a expansão, embora inicialmente abastecido apenas em espanhol.

### Fase 2: Componentes Base e Layout
1. **Header & Footer**:
   - Header minimalista com navegação, ícone de carrinho e seletor de idioma.
   - Footer contendo links úteis, redes sociais (Instagram/Facebook) e resumos de políticas (Trocas/Devoluções regidas pelo Direito de Arrependimento de 10 dias).
2. **UI Components Premium**:
   - Criação de Botões com micro-animações (hover states suaves e responsivos).
   - Cards de Produto com foco absoluto na imagem e suporte a badges visuais ("Coleção Essencial", "Nova Coleção").
   - Modais e sidebars estilizados.
3. **Botão Flutuante de Atendimento**:
   - Integração do ícone de contato no WhatsApp, posicionado estrategicamente (inferior direito), para consultas pré-venda.

### Fase 3: Desenvolvimento de Páginas (Views)
1. **Página Inicial (Home)**:
   - *Hero Section*: Design de altíssimo impacto, focando em imagens grandes ou vídeo do processo manual do artesanato.
   - Exibição de "Coleções em Destaque" guiando o usuário à conversão.
   - Prova social e seção descritiva "Artesanal Heritage".
2. **Página de Produtos (Catálogo)**:
   - Listagem dos itens (Cuias, kits completos, erva-mate).
3. **Página de Detalhe do Produto (PDP)**:
   - Imagens de alta resolução e controle de variações.
   - Avisos sobre curadoria manual, perdas de garantia por uso inadequado ou cura malfeita.
   - Ações diretas de compra ("Añadir al carrito").

### Fase 4: Carrinho, Checkout e Lógica Financeira
1. **Gestão do Carrinho (Sidebar ou Página)**:
   - Adição e remoção fluida de itens.
2. **Opções de Envio / Logística**:
   - Módulo de cálculo de frete suportando múltiplas estratégias:
     - *Motomensajería* para CABA/GBA.
     - *Correo Argentino / Andreani* para o Interior.
   - Integração futura ou imediata (via API) com Treggo ou Shipnow para cálculo dinâmico e emissão de etiquetas.
3. **Checkout e Pagamentos**:
   - **Mercado Pago**: Integração primária sem desconto e sem financiamento próprio (juros a cargo do cliente).
   - **Transferência Bancária**: Lógica para deduzir 10% no total do carrinho, exibindo CBU/CVU após a finalização.
4. **Fluxos de Email Transacional**:
   - Confirmação de pedido imediata.
   - Notificação com link de rastreamento assim que despachado.

### Fase 5: SEO, Tracking e Legal
1. **SEO On-Page e Acessibilidade**:
   - Tags de metadados focadas em intenção de compra ("mates premium", "set de mate para regalo").
   - Hierarquia semântica de HTML5 (H1 único, atributos alt e descrições).
2. **Marketing Analytics**:
   - Implementação de tags do Meta Ads para rastreio de eventos (ViewContent, AddToCart, Purchase).
   - Preparação para campanhas de Google Shopping.
3. **Requisitos Legais**:
   - Suporte lógico para posterior emissão da Factura C eletrônica.

### Fase 6: Quality Assurance (QA) e Deploy
1. **Revisão Visual e UX**:
   - Assegurar que o "tactile modernism" esteja sendo aplicado com excelência.
   - Teste de contraste, legibilidade e harmonia estética.
2. **Testes do Fluxo de Compra**:
   - Validação da aplicação do desconto bancário vs preços do Mercado Pago.
3. **Lançamento / Entrega**:
   - Publicação na hospedagem definitiva e configuração de domínio de produção.
