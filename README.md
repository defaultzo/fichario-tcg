# Fichário TCG

Gerenciador de coleção de cartas Pokémon TCG em React. Os estados de conservação seguem o padrão da LigaPokemon (M, NM, SP, MP, HP, D).

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173 (também abre na rede local, para testar no celular)
npm run build    # gera dist/, um site estático (HashRouter, funciona em qualquer hospedagem)
```

## Funcionalidades

- **Buscar**: por nome, tipo e raridade, com dados em português ou inglês (TCGdex).
- **Ficha da carta**: imagem com efeito holográfico, guia de preços (TCGplayer/Cardmarket convertidos para R$) e atributos.
- **Fichário**: cada cópia tem quantidade, estado, idioma, acabamento (Normal/Foil/Reverse), extras (1ª Edição, Promo, Pré-Release, Staff, Shadowless, Assinada, Alterada, Graduada…), preço pago, observações e a marcação "para troca".
- **Valor estimado**: preço NM de referência × fator do estado (M 115%, NM 100%, SP 85%, MP 70%, HP 50%, D 30%).
- **Coleções**: todas as expansões por série, com o progresso de cada uma e o filtro Tenho/Faltam.
- **Listas**: desejos (estado mínimo, idioma, preço máximo, prioridade) e trocas, que podem ser compartilhadas como texto.
- **Ajustes**: tema, idioma da base, cotação automática ou manual, backup/restauração em JSON.

Os dados ficam no `localStorage` do navegador. Use o backup para mudar de aparelho.

## Stack

React 18 · Vite · React Router · Motion · Zustand · Sonner · lucide-react
