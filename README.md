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

## Privacidade (LGPD)

- Sem servidor, contas, cookies de rastreamento ou analytics: tudo fica no aparelho.
- Aviso de privacidade na primeira visita, com "Só o essencial" e "Permitir" com o mesmo peso. A cotação automática (open.er-api.com) só roda com consentimento, registrado com data e versão da política.
- Página `/privacidade`: política, inventário dos dados guardados, exportação (portabilidade), revogação do consentimento e exclusão total (fichário, ajustes, consentimento e cache).
- Antes de publicar, preencha o contato em `PRIVACY_CONTACT` (`src/lib/privacy.js`). Ao mudar a política, atualize `POLICY_VERSION` (`src/lib/constants.js`) para pedir o consentimento de novo.

## Stack

React 18 · Vite · React Router · Motion · Zustand · Sonner · lucide-react
