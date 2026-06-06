# Modelo de Prompt em Json
Para melhorar os resultados na hora de integra serviços e reduzir as alucinações, surgiu o **JSON Prompt**.

Com o **JSON Prompt**, nós separamos as intenções em campos claro, isso ajuda em 3 frentes:

1. Menos Ambiguidade (menos alucinação): Ao gerar o resultado de prompt, o modelo pode "esquecer" o padrão da resposta solicitada, em json a pessoa coloca a respota que quer em um dado json, como `[output: {}]` ou `[schema: {}]`.
2. Mais previsível para integrar ao código: Em vez de fazer *REGEX* em cima da resposta, a pessoa força o modelo a voltar algo em que o código dela valida, como `zod`, `ajv`, `yup` ou o que preferir.
3. Escalabilidade: Prompt viram *"config"*: a pessoa começa a tratar o prompt como uma configuração versionável.

O modelo de prompt em json "puro" pode gerar mais tokens, mas quando o prompt cresce sua resposta, o JSON costuma economizar a respota, diminuindo o uso de tokens.

## Estrutura do Prompt em Json
> Exemplo: separamos em 6 blocos do prompt "puro".
1. **Meta**: Nome/versão do prompt, idioma, objetivo.
2. **Role**: "Papel" do modelo ("especialista", "revisor", "tutor", etc).
3. **Contexto**: Contexto, documentos, informações, etc.
4. **Task**: Instruções do passo a passo.
5. **Constraits**: Regras de entrada/saída (Para não inventar ou não extrapolar, etc).
6. **Output**: Formato esperado da saída e validação da mesma.
> Exemplo:
> ```json
> {
>   "meta": {
>     "name": "resumo-tecnico",
>     "version": "1.0",
>     "language": "pt-BR",
>   },
>   "role": "Você é um especialista em resumo de textos técnicos. Seu objetivo é criar resumos claros, concisos e precisos para documentação de software.",
>   "context": {
>     "audience": "programadores experientes em JavaScript",
>     "source": {texto do usuário},
>     "domain": {documentação técnica}
>   },
>   "task": {
>     "type": "summarize",
>     "goal": "Gerar um resumo claro e útil",
>     "steps": [
>       "Extraia os pontos principais",
>       "Liste riscos e pegadinhas",
>       "Dê um exemplo em JavaScript se fizer sentido"
>     ]
>   },
>   "constraints": {
>     "do_not_invent": true,
>     "be_consise": true,
>     "max_bullets": 7
>   },
>   "output": {
>     "format": "json",
>     "schema": { 
>       "title": "string",
>       "summary": "string",
>       "example_js": "string"
>     }
>   }
> }
> ```

### Onde isso reduz a alucinação de verdade?
A aluçinação costuma acontecer quando:
- O modelo não tem os dados suficientes;
- O modelo tem liberdade demais;
- O modelo está tentando "agradar" o usuário e preenchendo lacunas;

Com JSON, conseguimos colocar as travas.
> Exemplo:
> ```json
> "constraints": {
>     "do_not_invent": true, // Não invente dados ou informações que não estejam no contexto.
>     "if_missing_data": true, // Se faltar dados, diga que faltam.
>     "cite_source_fields": ["context.source"], // Cite os campos que você usou.
>     "allowed_assumptions": [], // Liste as suposições que você pode fazer.
>     "uncertainty_policy": "Não tenho dados suficientes, pode me passar os dados que necessito" // Se não tiver certeza, diga isso e peça os dados que faltam.
> }
> ```

### JSON Prompt é melhor que o texto simples?
**Não**, mas o JSON Prompt possui algums beneficios, mas para uma conversa casual ou uma resposta simples e objetiva, texto simples pode ser melhor.
