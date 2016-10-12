#!/usr/bin/env node

// On définie les constantes necessaires
const cmd = require('commander')
const inquirer = require ('inquirer')
const db = require('sqlite')
const fs = require('fs')


// ------------------- DEBUT Gestion de la commande
cmd
	.version('1.0.0')
	.option('-m, --manga','questionnaire manga')
	.option('-g, --got','questionnaire game of throne')
	.option('-b, --bdd','Insertion des données en base')
	

cmd.parse(process.argv)

if (cmd.manga) {
	launcher(1) // le questionnaire manga commence à l'Id 1
} else if (cmd.got) {
	launcher(6) // le questionnaire got commence à l'Id 6
} else if (cmd.bdd) {
	bddLaunch()
} else {
	cmd.help()
}

// ------------------- FIN gestion de la commande

// ------------------- DEBUT bloc qui gère la base de données

var questions = fs.readFileSync("questions.csv","UTF-8") // on récupère les données de toutes les questions
var array_questions = questions.split("\n") // puis on les sinsert dans un tableau ligne par ligne


// fonction d'initialisation de la bdd

function bddLaunch(){
	db.open('./bdd.db').then(() => {
	    return console.log('base de données ouverte')
	}).then(() => {
	    return db.run('CREATE TABLE IF NOT EXISTS ask (id, theme, question, reponse, first, second, third, fourth)')
	}).catch((err) =>{
	    console.log('BDD_ERR_create failed ====>', err)
	}).then(() => {
		return insert_to(array_questions)
	})
}


// fonction qui insert les données récupérées en amont

function insert_to(array,i){
	if (i === undefined) {
		i = 0
	}
	let prepare_insert = array[i].split(",")
	let pre_id = prepare_insert[0]
	let id = parseInt(pre_id)
	let theme = prepare_insert[1]
	let question = prepare_insert[2]
	let reponse = prepare_insert[3]
	let choix =[prepare_insert[4],prepare_insert[5],prepare_insert[6],prepare_insert[7]]
	return db.run('INSERT INTO ask VALUES (?, ?, ?, ?, ?, ?, ?, ?)', id,theme, question, reponse, choix[0], choix[1], choix[2], choix[3])
	.then(() => {
		return db.get('SELECT * FROM ask WHERE id = (?)', id)
	})
	.then((answer) => {
		if (i < 9){
				return insert_to(array,i + 1)
			}
		return console.log('insert terminé !')
	}).catch((err) => {
		return console.log('ERR_INSERT >',err)
	})
			
}

// ------------------- FIN bloc qui gère la base de données

// ------------------- DEBUT bloc qui gère le questionnaire


// fonction d'initialisation du questionnaire

function launcher(id){
	db.open('./bdd.db')
	.then(() => {
		return ask(id)
	}).then((score) => {
		console.log('Vous avez un score de : '+score+'/5')
	}).catch((err) => {
		return console.log('il y a eu un probleme lors de l\'execution du questionnaire >',err)
	})
}


// fonction qui pose une question

function ask(id,score,max) {
	if (score === undefined){
		score = 0
	}
	if (max === undefined){
		max = id+4
	}
    return db.get('SELECT * FROM ask WHERE id = (?)', id)
    .then((question) => {
    	return inquirer.prompt(
			{
				type:'list',
				message: question['question'],
				name: 'q',
				choices:[
					question['first'],
					question['second'],
					question['third'],
					question['fourth']					
				]
		}).then((answer) => {
			let juste = false
			if (answer.q == question['reponse']){
				juste = true
				score += 1
				console.log('bravo, vous avez trouvé la bonne reponse !')
			}else{
				console.log('dommage la bonne reponse était : '+question['reponse']+'.')
			}
			if (id < max){
				return ask(id + 1,score,max)
			}
			return score
		}).catch((err) =>{
			return console.log('ERR_questionnaire >',err)
		})
    })
	
}

// ------------------- FIN bloc qui gère le questionnaire