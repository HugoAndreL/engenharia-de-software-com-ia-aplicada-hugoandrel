**Você necessariamente precisa refinar o que você quer**
# Estrutura de Prompt
Esse Prompt é usado para dar o contexto necessário para que ele consiga responder sua pergunta
> Como se para cada pergunta que você fazer ele usara esse prompt como entendimento

## Prompt:

  ### 1. Contexto da tarefa:**
  É definir a persona e sua principal função.<br />
  > Exemplo: Você vai atuar como um coach de carreira IA chamado Joe criado pela empresa AdAstra Carreiras. Seu objetivo é dar conselhos de carreira aos usuários do site Ad-Astra que podem ficar confusos se você não agir no personagem.

  ### 2. Contexto de tom de escrita:
  Ele guia as escolhas de linguagem, nivel de empatia
  > Exemplo: Você deve manter um tom amigável de atendimento ao cliente.

  ### 3. Dados de antencedentes, documentos e imagens:
  Aqui se passa um documento, imagem, exemplo antigo para que o modelo entenda oque ela esta fazendo.
  
  > Exemplo: Aqui está o documento de orientação de carreira que você deve consultar ao responder o usuário:
  > ```
  > <guia>
  >   {DOCUMENTO}
  > </guia>

  Se não for passado um documento o modelo pode alucinar ou eentrar em loop.

  ### 4. Descrição detalhada da tarefa e regras:
  As regras explicitas que o modelo deve seguir
  
  > Exemplo: Aqui estão algumas regras importantes para a interação:
  > - Sempre fique no personagem, como Joe, uma IA da AdAstra;
  > - Se não souber responder, diga: "Deculpe, não entendi isso. - Pode repetir a pergunta?";
  > - Caso algo seja irrelevante, diga: "Desculpe, eu sou Joe e dou conselhos de carreira. Você tem algum conselho de carreira com a qual eu possa ajudar?";

  Assim, o modelo cria rotas seguras quando o modelo está incerto, ou quando não sabe, ele improvisa
  
  ### 5. Exemplos de Prompt requisitado:
  
  > Exemplo: Aqui está um exemplo de como responder em uma interação padrão:
  > ```
  > <exemplo>
  >   **Usuário**: Oi Joe, como você foi criado e o que você faz?
  >   **Joe**: Ola! Meu nome é Joe e fui criado pela AdAstra Carreiras para dar conselhos de carreira. Em que posso ajudar hoje?
  > </exemplo>

  Assim, o modelo responde da maneira que você quer.

  ### 6. Histórico da conversa:
  Aqui colocamos o histórico do que ja foi perguntado
  
  > Exemplo: Aqui está o historico da conversa entre o usuário e você. Pode estar vazia se não houver um histórico:
  > ```
  >  <historico>
  >    [{HISTORICO}]
  >  </historico>

  Neste caso, é comum também comprimir o histórico para ser enviado menos tokens.

  ### 7. Descrição ou pedido imediato:

  > Exemplo: Aqui está a pergunta do usuário:
  > ```
  >   <pergunta>[{PERGUNTA}]</pergunta>

  ### 8. Pensar passo a passo / respirar fundo:
  **Obs: Recomendação da [Anthropic](https://www.anthropic.com/).**

  Como o modelo responde à pergunta do usuário?

  > Exemplo: Responda à pergunta do usuário de maneira amigável?

  ### 9. Formatação da saida
  A formatação da resposta gerada.

  > Formate a resposta em: 
  > ```
  >   <formatacao>{FORMATACAO}</formatacao>

  ### 10. Resposta pré-prenchida (se houver)
  Dados da resposta ao qual ela deve gerar

  ## O que não pode faltar:
  Tenha sempre escrito:
  - No bloco 4:
      Não invente fatos;
      Se não houver contextos (bloco 1) diga que não tem informação;
      Se faltar dados, Faça perguntas objetivas;
      Se houver ambiguidade, diga e peça uma escolha; 
      Se houver algum documento; Video; Informação, baseie-se nele para aplicar as informações.

