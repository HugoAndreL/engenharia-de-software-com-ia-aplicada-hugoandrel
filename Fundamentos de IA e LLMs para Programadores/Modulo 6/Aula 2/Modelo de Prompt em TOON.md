Para diminuir o uso do tokens em prompts, surgiu o modelo **TOON** que significa **T**oken **O**riented **O**bject **N**otation. Ele é um formato de serialização pensado para ser como o "JSON"
Só que com menos pontuação ({; [; ]; } e ,) mas, existem casos que **Json Estruturado** é mais indicado, e TOON ainda é muito complicado, então é mais indicado usar json do que toon.
> Exemplo: Dado tabular: Uma tabela de 3 colunas e 2 linhas
```json
{"cols":["id","name","role"],"rows":[[1,"Alice","admin"],[2,"Bob","user"]]}
```

![Conversão de JSON em TOON](./img/Conversão%20de%20JSON%20e%20TOON.png)

[Conversão de prompts](https://www.toontools.app/)