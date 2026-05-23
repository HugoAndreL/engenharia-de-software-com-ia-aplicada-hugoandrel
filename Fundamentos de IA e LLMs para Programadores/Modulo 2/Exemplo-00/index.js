import tf from '@tensorflow/tfjs-node';

async function trainModel(inputXs, outputYs) {
    const model = tf.sequential();

    /*
        Primeira camada de rede:
        entrada de 7 posições (idade normalizada, 3 cores + 3 localizações)
    */

    /* 
        80 neuronios = aqui coloquei tudo isso, porque tem pouca base de treino (3 pessoas).
        Se fosse mais gente (1000 pessoas) eu colocaria 500, 600 neuronios. 
        Quanto mais neuronios, mais complexidade, a rede pode aprender.
        E consequentemente, mais processamento ela vai usar.
    */

    /*
        A ReLU age como um filtro:
        É como se ela fosse um inspecionador de bagagem de um aeroporto.
        Se for positiva, ela permite seguir viagem.
        Se a "bagagem" (o valor) for negativa (Zero ou Negativa), ela descarta.
    */
    model.add(tf.layers.dense({ inputShape: [7], units: 80, activation: 'relu' }));

    // Saída: 3 posições (premium, medium, basic)

    /* 
        ativantion: 'softmax' = normaliza a saida para que os valores fiquem em probabilidades.
        Ou seja (50% = 0.5, 25% = 0.25, 10% = 0.10, 5% = 0.05 e assim por diante).
    */
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

    /*
        Compilando o modelo.
        optimizer: 'adam' (Adaptive Moment Estimation).
        É um algoritmo que ajuda o modelo a aprender mais rápido e com mais precisão.
        Ajustando os pesos da rede para minimizar o erro.
        Apredendo com o histórico de acertos e erros do modelo.
        Como se fosse um maestro de uma orquestra regendo os músico para obter o melhor som.
    */

    /*
        loss: 'categoricalCrossentropy' = Compara o que o modelo acha que é (Os scores de cada categoria) com a resposta correta.
        É como se fosse um árbitro de futebol apitando a partida.
        Ele mede o quão longe o modelo está de acertar.
        E diz ao modelo se ele precisa melhorar ou não.
    */

    /* 
        metrics: ['accuracy'] = Mostra o quão certo o modelo está em porcentagem.
        É como se fosse um termômetro da confiança do modelo.
        Se estiver em 100% (1,0), o modelo acertou todas.
        Se estiver em 50% (0,5), o modelo acertou metade.
    */
    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    // Treinando o modelo

    /* 
        Verbose são os avisos de logs que o software gera durante o treino.
        Se estiver em 1 (true), ele mostra tudo.
        Se estiver em 0 (false), ele só mostra o callback (se for chamado)
    */

    /*
        Epochs: 1000 
        É o número de vezes que o modelo vai ser treinado com os dados.
    */

    // Shuffle: true = embaralha os dados para cada treino de dados (epochs).

    // Callbacks: Saida personalizada dos logs de cada epoch.
    await model.fit(
        inputXs,
        outputYs,
        {
            verbose: 0,
            epochs: 100,
            shuffle: true /*,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
                }
            } */
        }
    );

    return model;
}

async function predict(model, input) {
    // Transforma o array js para o tensor (tfjs)
    const tfInput = tf.tensor2d(input);

    // Efetua a predição (output = um vetor de 3 probabilidades: [premium, medium, basic])
    const pred = model.predict(tfInput);
    const predArray = await pred.array();
    return predArray[0].map((prob, index) => ({ prob, index }));
}
// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const pessoas = [
//     { nome: "Erick", idade: 30, cor: "Azul", localizacao: "São Paulo" },
//     { nome: "Ana", idade: 25, cor: "Vermelho", localizacao: "Rio" },
//     { nome: "Carlos", idade: 40, cor: "Verde", localizacao: "Curitiba" }
// ];

// Vetores de entrada com valores já normalizados e one-hot encoded
// Ordem: [idade_normalizada, azul, vermelho, verde, São Paulo, Rio, Curitiba]
// const tensorPessoas = [
//     [0.33, 1, 0, 0, 1, 0, 0], // Erick
//     [0, 0, 1, 0, 0, 1, 0],    // Ana
//     [1, 0, 0, 1, 0, 0, 1]     // Carlos
// ]

// Usamos apenas os dados numéricos, como a rede neural só entende números.
// tensorPessoasNormalizado corresponde ao dataset de entrada do modelo.
const tensorPessoasNormalizado = [
    [0.33, 1, 0, 0, 1, 0, 0], // Erick
    [0, 0, 1, 0, 0, 1, 0],    // Ana
    [1, 0, 0, 1, 0, 0, 1]     // Carlos
]

// Labels das categorias a serem previstas (one-hot encoded)
// [Premium, Medium, Basic]
const namesLabels = ["Premium", "Medium", "Basic"]; // Ordem dos labels
const tensorLabels = [
    [1, 0, 0], // Premium - Erick
    [0, 1, 0], // Medium - Ana
    [0, 0, 1]  // Basic - Carlos
];

// Criamos tensores de entrada (xs) e saída (ys) para treinar o modelo
const inputXs = tf.tensor2d(tensorPessoasNormalizado)
const outputYs = tf.tensor2d(tensorLabels)

/*
    Quanto mais dado melhor.
    Pois assim, o modelo consegue aprender mais padrões.
    E consequentemente, ter uma precisão maior.
    Isso é chamado de Machine Learning (Aprendizado de Máquina).
*/
const model = await trainModel(inputXs, outputYs);

// Testando o modelo treinado
const person = {
    name: "Hugo",
    age: 23,
    color: "Azul",
    localization: "São Paulo"
}

/*
    Normalizando a idade da nova usando o mesmo padrão de treino.
    Exemplo: idade_min = 25, idade_max = 40
    Então a idade normalizada será: (28 - 25) / (40 - 25) = 0.2
*/
const ageNormalized = (person.age - 25) / (40 - 25);
const tensor = [
    [
        ageNormalized,
        1, // Azul
        0, // Vermelho
        0, // Verde
        1, // São Paulo
        0, // Rio
        0 // Curitiba
    ]
]

const predictions = await predict(model, tensor);
const results = predictions
    .sort((a, b) => b.prob - a.prob)
    .map(edition => `${namesLabels[edition.index]}: ${(edition.prob * 100).toFixed(2)}%`)
    .join('\n');
console.log(results);