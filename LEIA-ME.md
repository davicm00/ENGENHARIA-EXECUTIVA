# Prova Multidisciplinar — Guia de Instalação (10 minutos, sem programar)

> **Atualização importante:** se você já tinha publicado uma versão anterior
> desta prova, é só substituir os arquivos `app.js` e `ui.js` (e `index.html`,
> por segurança) no seu repositório do GitHub pelos desta pasta. Eles corrigem
> um bug em que o app avisava "sem internet" mesmo com o tablet conectado —
> na verdade era uma chamada mal formatada ao serviço de e-mail, não falta de
> wifi. Depois de trocar os arquivos, qualquer prova que ficou "presa"
> esperando envio é reenviada automaticamente sozinha.

Este pacote é um site pronto. Ele resolve o problema do tablet (o e-mail
anexado abre em modo "só leitura", sem rodar o app) porque agora a prova
vira uma **página online de verdade**, hospedada gratuitamente, que dá
para instalar na tela inicial do tablet como um aplicativo — e que continua
funcionando **offline** depois do primeiro acesso.

## Parte 1 — Colocar a prova online (GitHub Pages, grátis)

1. Crie uma conta gratuita em https://github.com (se ainda não tiver).
2. Clique em **New repository** (Novo repositório). Dê um nome, ex.:
   `prova-da-filha`. Marque como **Public**. Clique em **Create repository**.
3. Na página do repositório, clique em **Add file → Upload files**.
4. Arraste TODOS os arquivos desta pasta (`index.html`, `app.js`, `ui.js`,
   `questions.json`, `manifest.json`, `service-worker.js` e a pasta `icons`
   inteira) e clique em **Commit changes**.
5. Vá em **Settings → Pages** (barra lateral esquerda).
6. Em "Branch", escolha `main` e a pasta `/root`, clique em **Save**.
7. Aguarde 1–2 minutos. O GitHub vai mostrar o link, algo como:
   `https://SEU-USUARIO.github.io/prova-da-filha/`
8. Abra esse link no navegador do tablet dela (Chrome ou Safari).

## Parte 2 — Instalar como app na tela inicial do tablet

- **Android/Chrome:** abra o link → menu (⋮) → "Adicionar à tela inicial".
- **iPad/Safari:** abra o link → ícone de compartilhar → "Adicionar à Tela
  de Início".

Depois disso, ela abre pelo ícone como se fosse um app normal — e depois
do primeiro acesso (com internet), a prova continua funcionando mesmo
sem internet.

## Parte 3 — Configurar o e-mail automático (EmailJS, grátis)

Sem esse passo, a prova funciona 100%, mas o e-mail de notificação não é
enviado (fica guardado esperando a configuração).

1. Crie uma conta gratuita em https://www.emailjs.com
2. Vá em **Email Services → Add New Service** e conecte seu Gmail (ou
   outro provedor).
3. Vá em **Email Templates → Create New Template**. No corpo do e-mail,
   use algo como:

   ```
   Assunto: Resultado da prova de {{student_name}}

   {{student_name}} fez a prova em {{date}} às {{time}}
   e acertou {{score}} de {{total}} questões.
   ```

4. Vá em **Account → General** e copie sua **Public Key**.
5. Volte para o repositório no GitHub, abra o arquivo `app.js`, clique no
   ícone de lápis (editar) e substitua, logo no topo do arquivo:

   ```js
   const EMAILJS_CONFIG = {
     PUBLIC_KEY: 'COLE_AQUI_SUA_PUBLIC_KEY',
     SERVICE_ID: 'COLE_AQUI_SEU_SERVICE_ID',
     TEMPLATE_ID: 'COLE_AQUI_SEU_TEMPLATE_ID',
     PARENT_EMAIL: 'coloque.o.seu@email.com'
   };
   ```

   pelos valores reais copiados do EmailJS, e coloque seu e-mail em
   `PARENT_EMAIL`. Clique em **Commit changes**.
6. Em 1–2 minutos o GitHub Pages atualiza sozinho. Pronto — a partir da
   próxima prova, você recebe um e-mail automático com nome, pontuação,
   data e hora.

### Se ela fizer a prova sem internet
O resultado fica guardado no tablet e é enviado sozinho na próxima vez
que o app for aberto (ou reconectar) com internet disponível — não
precisa refazer a prova.

## O que cada arquivo faz

- `index.html` — a página da prova.
- `app.js` — busca as questões, sorteia a prova e envia o e-mail. As
  perguntas ficam separadas em `questions.json`, ou seja, dá para editar,
  adicionar ou remover questões sem mexer no código do app.
- `questions.json` — o banco de questões (80 objetivas + 8 discursivas).
- `manifest.json` e `icons/` — permitem instalar como app no tablet.
- `service-worker.js` — guarda uma cópia local dos arquivos para o app
  continuar funcionando sem internet depois do primeiro acesso.

## Atualizando as questões depois

Para adicionar/editar perguntas, edite apenas o `questions.json` pelo
próprio site do GitHub (ícone de lápis) — não precisa mexer em mais nada.
