// importiamo il client
const mongoose = require("mongoose");

//crea una connessione al DB
const connect = async (user, passwd, dbname) => {
    let db;
    try {
        db = await mongoose.connect(
            `mongodb://${user}:${passwd}@mongolo:27017/${dbname}?authSource=admin`
        );
    } catch (e) {
        console.log(e);
        process.exit(0);
    }

    return db;
}

const create_collection = async () => {
    //definiamo lo schema della nostra collezione
    const schema = new mongoose.Schema({
        nome: "string",
        cognome: "string",
        classe: "number"
    });

    //creiamo un modello a partire dallo schema
    const studente = mongoose.model("studente", schema);

    // creiamo la collezione
    let collection = await studente.createCollection();

    return studente;
}

const add_document = async (model, doc) => {
    await model.create(doc);
};

const search_document = async (model, params) => {
    let docs = await model.find(params);
    return docs;
};

const update_document = async (model, doc, new_doc) => {
    await model.updateOne(doc, new_doc);  
}

const delete_document = async (model, params) => {
    let doc = await search_document(model, params);
    if(doc.length == 1)
        await doc[0].deleteOne();
};

//main 
(async () => {
    // connettiamoci al DB usando le credenziali corrette
    let db = await connect('mongoadmin', 'qwe123', 'studenti');

    if (db.connection.readyState == 1)
        console.log("CONNESSIONE AL DB: OK!!!");

    // creo una collezione 
    let collection = await create_collection();
    console.log("Collezione Creata: OK");

    // aggiungiamo un documento singolo
    /* await add_document(collection, {
        nome: "Mario",
        cognome: "Rossi",
        classe: 4
    });
    console.log("Documento aggiunto"); */

    // cerco gli studenti della 5
    // find restituisce un array di documenti
    let studenti = await search_document(collection, {classe: 5});
    console.log("STUDENTI TROVATI:", studenti);

    let studenti2 = await search_document(collection, {classe: 5, nome: "Carlo"});
    console.log("STUDENTI TROVATI:", studenti2);

    // update a document
    await update_document(collection, {
        nome: "Carlo",
        cognome: "bianchi"
    }, {
        classe: 3
    });

    await delete_document(collection, {
        nome: "Giusepper",
        cognome: "Verdi"
    });
    console.log("DOCUMENTO RIMOSSO: OK!!!");

    // disconnettiamoci dal DB
    await db.disconnect();
    console.log("DISCONNESSO DAL DB!!!");
    process.exit(0);
})();
