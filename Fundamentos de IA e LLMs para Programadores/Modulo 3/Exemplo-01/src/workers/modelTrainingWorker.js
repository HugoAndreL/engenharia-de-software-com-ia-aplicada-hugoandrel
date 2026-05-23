import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

console.log('Model training worker initialized');
let _globalCtx = {};
let _model = null;
/*
    Definindo o peso de cada categoria.
    Cada categoria possui um peso que define sua importancia no calculo de similaridade.
    Por exemplo, a categoria "category" tem peso 0.4, o que significa que ela tem 40% de importancia na similaridade.
    A categoria "color" tem peso 0.3, o que significa que ela tem 30% de importancia na similaridade.
    A categoria "price" tem peso 0.2, o que significa que ela tem 20% de importancia na similaridade.
    A categoria "age" tem peso 0.1, o que significa que ela tem 10% de importancia na similaridade.
    É como se fosse um ORDER BY, só que ao invés de passar os resultados,
    ele da pega os dados e usa esses pesos para ordenar.
*/
const WEIGTHS = {
    category: 0.4,
    color: 0.3,
    price: 0.2,
    age: 0.1
}

/*
    Normaliza valores continuos (preço, idade) para numeros inteiros (0–1).
    Por que? Mantem todas as features com a mesma importancia.
    Formula: (val - min) / (max - min)
    Exemplo: price: 129.99, minPrice: 39.99, maxPrice: 199.99 = 0.56
*/
const normalize = (val, min, max) => (val - min) / ((max - min) || 1);

function makeContext(products, users) {
    const ages = users.map(user => user.age);
    const prices = products.map(product => product.price);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const colors = [...new Set(products.map(product => product.color))];
    const categories = [...new Set(products.map(product => product.category))];

    const colorsIndex = Object.fromEntries(
        colors.map((color, index) => {
            return [color, index]
        }));
    const categoriesIndex = Object.fromEntries(
        categories.map((category, index) => {
            return [category, index]
        }));

    /* 
       Calculando a média de idade das pessoas que compraram os produtos. 
       (Ajuda a personalizar).
    */
    const midAge = (minAge + maxAge) / 2;
    /* 
      Acumulando a soma das idades e a quantidade de pessoas por categoria de idade.
      Ex: { "20-30": { sum: 250, count: 10 }, ... } 
      Isso ajuda o modelo a entender a preferência média de cada faixa etária.
    */
    const ageSums = {};
    const ageCounts = {};

    users.forEach(user => {
        user.purchases.forEach(userPuchase => {
            ageSums[userPuchase.name] = (ageSums[userPuchase.name] || 0) + user.age;
            ageCounts[userPuchase.name] = (ageCounts[userPuchase.name] || 0) + 1;
        });
    });

    const resultsAvg = Object.fromEntries(
        products.map(product => {
            const avg = ageCounts[product.name] ?
                ageSums[product.name] / ageCounts[product.name] :
                midAge;

            return [product.name, normalize(avg, minAge, maxAge)];
        })
    );

    return {
        products,
        users,
        colorsIndex,
        categoriesIndex,
        resultsAvg,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        numCategories: categories.length,
        numColors: colors.length,
        // (Price + Age) + Colors + Categories
        dimentions: 2 + colors.length + categories.length
    }
}

const oneHotWeighted = (index, length, weigth) =>
    tf.oneHot(index, length).cast('float32').mul(weigth);

function encodingProduct(product, context) {
    // Normalizando os dados com o mínimo e máximo. E multiplicando pelo peso da categoria.
    const price = tf.tensor1d([
        normalize(
            product.price,
            context.minPrice,
            context.maxPrice
        ) * WEIGTHS.price
    ]);

    const age = tf.tensor1d([
        (
            context.resultsAvg[product.name] ?? 0.5
        ) * WEIGTHS.age
    ]);

    const category = oneHotWeighted(
        context.categoriesIndex[product.category],
        context.numCategories,
        WEIGTHS.category
    );

    const color = oneHotWeighted(
        context.colorsIndex[product.color],
        context.numColors,
        WEIGTHS.color
    );

    return tf.concat1d(
        [price, age, category, color]
    );
}

function encodingUser(user, context) {
    if (user.purchases.length) {
        return tf.stack(
            user.purchases.map(
                product => encodingProduct(product, context)
            )
        ).mean(0).reshape([1, context.dimentions]);
    }

    return tf.concat1d(
        [
            tf.zeros([1]), // Preço ignorado
            tf.tensor1d([
                normalize(user.age, context.minAge, context.maxAge) * WEIGTHS.age
            ]),
            tf.zeros([context.numCategories]), // Categoria ignorada
            tf.zeros([context.numColors]), // Cor ignorada            
        ]
    ).reshape([1, context.dimentions]);
}

function createTrainingData(context) {
    const inputs = [];
    const labels = [];
    context.users
        .filter(user => user.purchases.length)
        .forEach(user => {
            const userVector = encodingUser(user, context).dataSync();
            context.products.forEach(product => {
                const productVector = encodingProduct(product, context).dataSync();
                const label = user.purchases.some(
                    purchase => purchase.name === product.name ? 1 : 0
                );
                inputs.push([...userVector, ...productVector]);
                labels.push(label);
            });
        });

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [inputs.length, 1]),
        inputDimention: context.dimentions * 2,
        // O tamanho total das colunas: (userVector + productVector)
    }
}

// ====================================================================
// 📌 Exemplo de como um usuário é ANTES da codificação
// ====================================================================
/*
const exampleUser = {
    id: 201,
    name: 'Rafael Souza',
    age: 27,
    purchases: [
        { id: 8, name: 'Boné Estiloso', category: 'acessórios', price: 39.99, color: 'preto' },
        { id: 9, name: 'Mochila Executiva', category: 'acessórios', price: 159.99, color: 'cinza' }
    ]
};
*/

/*
    ====================================================================
    📌 Após a codificação, o modelo NÃO vê nomes ou palavras.
    Ele vê um VETOR NUMÉRICO (todos normalizados entre 0–1).
    Exemplo: [preço_normalizado, idade_normalizada, cat_one_hot..., cor_one_hot...]

    Suponha categorias = ['acessórios', 'eletrônicos', 'vestuário']
    Suponha cores      = ['preto', 'cinza', 'azul']

    Para Rafael (idade 27, categoria: acessórios, cores: preto/cinza),
    o vetor poderia ficar assim:

    [
    0.45,            // peso do preço normalizado
    0.60,            // idade normalizada
    1, 0, 0,         // one-hot de categoria (acessórios = ativo)
    1, 0, 0          // one-hot de cores (preto e cinza ativos, azul inativo)
    ]

    São esses números que vão para a rede neural.
    ====================================================================



    ====================================================================
    🧠 Configuração e treinamento da rede neural
    ====================================================================
*/
async function configureNeuralNetAndTrain(trainedData) {
    const model = tf.sequential();

    model.add(
        tf.layers.dense({

            /*
                - InputShape: Número de features.
                Exemplo: Dados de treino.
                Entrada de 20 posições 
                Por Exemplo: (Produtos + Usuários ≃ 20 Números)
            */
            inputShape: [trainedData.inputDimention],

            /* 
                128 neuronios = pouca base de treino.
                Se fosse mais gente (1000 pessoas) eu colocaria 500, 600 neuronios. 
                Quanto mais neuronios, mais complexidade, a rede pode aprender.
                E consequentemente, mais processamento ela vai usar.
            */
            units: 128,

            /*
                A ReLU age como um filtro:
                É como se ela fosse um inspecionador de bagagem de um aeroporto.
                Se for positiva, ela permite seguir viagem.
                Se a "bagagem" (o valor) for negativa (Zero ou Negativa), ela descarta.
            */
            activation: 'relu',
        })
    );

    /*
        2º Camada: Com menos unidades.
        Para o modelo ir comprimindo os dados relevantes e ignorando mais aindas os valores negativos.
    */
    model.add(
        tf.layers.dense({
            units: 64,
            activation: 'relu',
        })
    );

    /*
        3º Camada: Com menos unidades.
        Para o modelo ir comprimindo os dados relevantes e ignorando mais aindas os valores negativos.
    */
    model.add(
        tf.layers.dense({
            units: 32,
            activation: 'relu',
        })
    );

    model.add(
        tf.layers.dense({
            // 1 Neuronio = 1 Pontuação de recomendação.
            units: 1,

            /*
                Sigmoid: Converte os dados para 0-1.
                Neste caso: 0 para produtos em que ele ira comprar,
                e 1 para produtos que ele comprara.
            */
            activation: 'sigmoid'
        })
    );

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    await model.fit(trainedData.xs, trainedData.ys, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                postMessage({
                    type: workerEvents.trainingLog,
                    epoch: epoch,
                    loss: logs.loss,
                    accuracy: logs.acc
                });
            }
        }
    });

    return model;
}

async function trainModel({ users }) {
    console.log('Training model with users:', users)

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 50 } });
    // Baixando os dados dos produtos.
    const products = await (await fetch('/data/products.json')).json();

    const context = makeContext(products, users);

    context.productVectors = products.map(product => {
        return {
            name: product.name,
            // Adicionando os metadados para ja termos os dados dos produtos caso seja chamado na recomendação.
            meta: { ...product },
            vector: encodingProduct(product, context).dataSync()
        }
    });

    _globalCtx = context;

    const trainedData = createTrainingData(context);

    _model = await configureNeuralNetAndTrain(trainedData);

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });
}
function recommend({ user }) {
    if (!_model) return;
    const context = _globalCtx;

    /* 
        1️⃣ Converte o usuário fornecido no vetor de features codificadas
        (preço ignorado, idade normalizada, categorias ignoradas)
        Isso transforma as informações do usuário no mesmo formato numérico
        que foi usado para treinar o modelo.
    */
    const userVector = encodingUser(user, context).dataSync();
    /*
        Em aplicações reais:
        Armazene todos os vetores de produtos em um banco de dados vetorial (como Postgres, Neo4j ou Pinecone)
        Consulta: Encontre os 200 produtos mais próximos do vetor do usuário
        Execute _model.predict() apenas nesses produtos
    */

    /*
        2️⃣ Cria pares de entrada: para cada produto disponível, 
        concatena o vetor do usuário com o vetor do produto.
    */
    const input = context.productVectors.map(({ vector }) => {
        return [...userVector, ...vector];
    });

    /*
        3️⃣ Converte todos esses pares (usuário, produto) em um único Tensor.
        Formato: [numProdutos, inputDim].
    */
    const inputTensor = tf.tensor2d(input);

    /*
        4️⃣ Roda a rede neural treinada em todos os pares (usuário, produto) de uma vez.
        O resultado é uma pontuação para cada produto entre 0 e 1.
        Quanto maior, maior é a probabilidade do usuário querer aquele produto.
    */
    const predictions = _model.predict(inputTensor);

    // 5️⃣ Extraia as pontuações para um array JS normal.
    const scores = predictions.dataSync();
    const recommendations = context.productVectors
        .map((item, index) => ({
            ...item.meta,
            name: item.name,
            score: scores[index] // Previsão do modelo para este produto
        }));

    const sortedItems = recommendations.sort((a, b) => b.score - a.score);

    /*
        8️⃣ Envia a lista ordenada de produtos recomendados
        para a thread principal (a tela pode exibi-los agora).
    */
    postMessage({
        type: workerEvents.recommend,
        user,
        recommendations: sortedItems
    });

    console.log('will recommend for user:', user)
}

const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: recommend,
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};

// Parei no Modulo 03 VideoAula 3 - COMO FUNCIONAM SISTEMAS DE RECOMENDAÇÃO PT03
