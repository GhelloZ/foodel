const express = require('express');
const cors    = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectId;
const uuid    = require('uuid');
const dotenv = require('dotenv').config();

const MongoUrl = process.env.MONGO_URL;
const client = new MongoClient(MongoUrl);

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());
//app.use(checkApiKeys());

/******
 * async function checkApiKeys(req,res,next){
 *
 * ...
 *
 * }
 ******/

app.post(`/auth/register`, (req,res) => {
	let missingFields = 0;
	console.log(req.body);
	// Ogni check fallito imposta un bit su 1, poi il client controllera' i bit flippati per capire cosa manca
	if(req.body.email == null){ console.log('Missing field: email'); missingFields += 1 }       // 0000000000001
	if(req.body.password == null){ console.log('Missing field: password'); missingFields += 2 } // 0000000000010
	if(req.body.type == null){ console.log('Missing field: type'); missingFields += 4 }         // 0000000000100
	else{
		if(req.body.type == "ristoratore"){
			if(req.body.iva == null){ console.log('Missing field: iva'); missingFields += 8 }   // 0000000001000
			if(req.body.bankAccount == null){ console.log('Missing fields: bankAccount.*') ; missingFields += 48 } // 0000000110000
			else{
				if(req.body.bankAccount.iban == null){ console.log('Missing field: bankAccount.iban'); missingFields += 16 } // 0000000010000
				if(req.body.bankAccount.bankName == null){ console.log('Missing field: bankAccont.bankName'); missingFields += 32 } // 0000000100000
			}
		}
	}
	if(req.body.address == null){ console.log('Missing fields: address.*') ; missingFields += 64 }            // 0000001000000
	if(req.body.address.street == null){ console.log('Missing field: address.street'); missingFields += 128 } // 0000010000000
	if(req.body.address.city == null){ console.log('Missing field: address.city'); missingFields += 256 }     // 0000100000000
	if(req.body.address.zip == null){ console.log('Missing field: address.zip'); missingFields += 512 }       // 0001000000000
	if(req.body.paymentCard == null){ console.log('Missing fields: paymentCard.*'); missingFields += 7168 }   // 1110000000000
	else{
		if(req.body.paymentCard.number == null){ console.log('Missing field: paymentCard.number'); missingFields += 1024 }   // 0010000000000
		if(req.body.paymentCard.expDate == null){ console.log('Missing field: paymentCard.expDate'); missingFields += 2048 } // 0100000000000
		if(req.body.paymentCard.cvv == null){ console.log('Missing field: paymentCard.cvv'); missingFields += 4096 }         // 1000000000000
	}
	if(missingFields == 0){ res.status(200).send('OK') }
	else{ console.log(`Missing fields: ${missingFields.toString(2)}`); res.status(400).send(missingFields) }
})

app.get('/teapot', async (req,res) => {
	console.log('/teapot test');
	res.status(418).send('This is not a coffee machine');
})

app.listen(port, () => {
	console.log(`App listening on port ${port}`);
})
