#!/usr/bin/env node

// On définie les constantes necessaires
const cmd = require('commander')
const inquirer = require ('inquirer')
const db = require('sqlite')
const nb = 5


// Creation/Gestion de la commande
cmd
	.version('1.0.0')
	.option('-m, --manga','questionnaire manga')
	.option('-g, --got','questionnaire game of throne')
	

cmd.parse(process.argv)

if (cmd.manga) {
	launcher(1) // le questionnaire manga commence à l'Id 1
} else if (cmd.got) {
	launcher(6) // le questionnaire got commence à l'Id 6
} else {
	cmd.help()
}


// bloc qui gère le questionnaire

function launcher(id){
	db.open('./bdd.db')
	.then(() => {
		return ask(id)
	}).then((score) => {
		console.log('Vous avez un score de : ',score)
	})
}


// fonction qui pose une question

function ask(id,score) {
	if (score === undefined){
		score = 0
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
			console.log('reponse : '+answer.q)
			let juste = false
			if (answer.q == question['reponse']){
				juste = true
				score += 1
				console.log('bravo, vous avez trouvé la bonne reponse !')
			}else{
				console.log('dommage la bonne reponse était : '+question['reponse']+'.')
			}
			if (id < 5){
				return ask(id + 1,score)
			}
			return score
		})
    })
	
}