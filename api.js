const express = require('express');
const cors    = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectId;
const uuid    = require('uuid');
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');

const MongoUrl = process.env.MONGO_URL;
const client = new MongoClient(MongoUrl);

const app = express();

// Constants imported from .env
const port = Number(process.env.PORT) || 3000;
const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

app.use(express.json());
app.use(cors());

//TODO
//app.use(checkApiKeys());

/******
 * async function checkApiKeys(req,res,next){
 *
 * ...
 *
 * }
 ******/

app.post('/register', async (req,res) => {
	const emailRegex = /^[\w\-\.]+(\+[\w\-\.]+)?@([\w-]+\.)+[\w-]{2,}$/;
	let missingFields = 0;
	// Ogni check fallito imposta un bit su 1, poi il client puo' controllare i bit flippati per capire cosa manca
	// Each failed check flips a bit to 1, then the client can check what bits are flipped to see what's missing
	if(req.body.email == null){ console.log('Missing field: email'); missingFields += 1 }       // 000000000001
	else if(!emailRegex.test(req.body.email)){
		console.log('Invalid field: email'); missingFields += 1
	}
	if(req.body.password == null){ console.log('Missing field: password'); missingFields += 2 } // 000000000010
	if(req.body.restaurateur == null){ console.log('Missing check: restaurateur'); missingFields += 4 }         // 000000000100
	else{
		if(req.body.restaurateur == true){
			if(req.body.iva == null){ console.log('Missing field: iva'); missingFields += 8 }   // 000000001000
			if(req.body.bankAccount == null){ console.log('Missing fields: bankAccount.*') ; missingFields += 48 } // 000000110000
			else{
				if(req.body.bankAccount.iban == null){ console.log('Missing field: bankAccount.iban'); missingFields += 16 } // 000000010000
				if(req.body.bankAccount.bankName == null){ console.log('Missing field: bankAccont.bankName'); missingFields += 32 } // 000000100000
			}
		}
	}
	if(req.body.address == null){ console.log('Missing fields: address.*') ; missingFields += 448 }              // 000111000000
	else {
		if(req.body.address.street == null){ console.log('Missing field: address.street'); missingFields += 64 } // 000001000000
		if(req.body.address.city == null){ console.log('Missing field: address.city'); missingFields += 128 }    // 000010000000
		if(req.body.address.zip == null){ console.log('Missing field: address.zip'); missingFields += 256 }      // 000100000000
	}
	if(req.body.paymentCard == null){ console.log('Missing fields: paymentCard.*'); missingFields += 3584 }      // 111000000000
	else{
		if(req.body.paymentCard.number == null){ console.log('Missing field: paymentCard.number'); missingFields += 512 }    // 001000000000
		if(req.body.paymentCard.expDate == null){ console.log('Missing field: paymentCard.expDate'); missingFields += 1024 } // 010000000000
		if(req.body.paymentCard.cvv == null){ console.log('Missing field: paymentCard.cvv'); missingFields += 2048 }         // 100000000000
	}
	if(missingFields !== 0){ return res.status(400).send(missingFields); }

	try {
		// Connecting to db
		await client.connect();
		const db = client.db("foodel");
		const users = db.collection("users");
		console.log('db connected');

		// Dupes check
		const existingUser = await users.findOne({email: req.body.email});
		if (existingUser){
			console.log(`existingUser: ${existingUser.email}`)
			return res.status(409).send('Email already in use');
		}

		// Password hashing and user creation
		let newUser = {};

		const salt = await bcrypt.genSalt(saltRounds);
		const hashedPassword = await bcrypt.hash(req.body.password, salt);
		// console.log(`hashed pw: ${hashedPassword}`)

		// User creation
		if(req.body.restaurateur === true){
			console.log('New restaureateur')
			newUser = {

				email: req.body.email,
				password: hashedPassword,
				restaurateur: req.body.restaurateur,
				iva: req.body.iva,
				bankAccount: req.body.bankAccount,
				address: req.body.address,
				paymentCard: req.body.paymentCard
			};
		} else {
			console.log('New commoner')
			newUser = {
				email: req.body.email,
				password: hashedPassword,
				restaurateur: req.body.restaurateur,
				address: req.body.address,
				paymentCard: req.body.paymentCard
			};
		}

		// console.log(`newUser.password: ${newUser.password}`);

		// Insert into db
		await users.insertOne(newUser);

		await client.close();
		res.status(201).send("User registered");
	} catch (err) {
		console.error("Error in /register:", err);
		res.status(500).send("Server error");
	}
});

app.post('/login', (req,res) => {
	console.log(req.body);
	if(req.body.email === 'mariorossi@gmail.de' && req.body.password === 'pene1234'){ console.log('user logged in'); res.status(200).send(`User logged in`) }
	else{ console.log('wrong creds'); res.status(401).send(`Wrong credentials`) }
});

app.get('/users/me', (req,res) => {
	res.json({
		"id": 1234,
		"email": "mariorossi@gmail.de",
		"restaurateur": true,
		"address": {
			"street":"via Pascoli 4",
			"city":"Ceriano Laghetto",
			"zip":"20816"
		}
	}).status(200);
});

app.delete('/users/me', (req,res) => {
	res.status(423).send("Under development");
});

app.get('/teapot', async (req,res) => {
	console.log('/teapot test');
	res.status(418).send('This is not a coffee machine');
});

app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
