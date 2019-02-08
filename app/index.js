var request = require('request');
var extend = require('extend');

var output = {};

var main = function processGET(req, res) {

	var persons, salaries;

	getServiceData(req, res, function(peopleData){
		persons = peopleData;

		getServiceData(req, res, function(salaryData){
			salaries = salaryData;

			var output = generateOutput(merge(true, persons, salaries));

			res.status(200);
    		res.send(output);


		}, 1, 'salaries');

	}, 1, 'persons');
}

function merge(deep, mainObj, otherObj){

    return extend(deep, mainObj, otherObj);    
}

function getServiceData(req, res, f, attempts, dataType){
	request.get(
        {url: 'https://dev-api.hixme.com/code-exercise/' + dataType}, 
        function(error, response, responseBody) {
        	if(response.statusCode !== 200){
        		if(attempts > 1){
        			res.status(response.statusCode);
	                res.send('ERROR WITH SERVICE');
	                return;
        		} else {
        			getServiceData(req, res, f, 2, dataType);
        		}
        		
        	} else {
        		var thisObj = JSON.parse(responseBody);
        		f(thisObj);
        	}
        });
}

function generateOutput(merged){	
	output.Persons = [];
	output.Groups = [];
	output.Totals = {};

	for (var i = 0; i < merged.length; i++){
		
		var person = {};


		if(merged[i].Status !== 'Retired' && typeof merged[i].Group !== 'undefined'){
			person.PersonId = merged[i].PersonId;
			person.FirstName = merged[i].FirstName;
			person.LastName = merged[i].LastName;
			person.Group = merged[i].Group;
			person.Status = merged[i].Status;
			person.PercentIncrease = (getPercentIncrease(merged[i].Status) * 100) + '%';
			person.Salary = merged[i].Salary;
			person.NewSalary = (getNewSalary(person.Salary, getPercentIncrease(merged[i].Status)));

			output.Persons.push(person);

			addOrUpdateGroup(person);
			createOrUpdateTotals(person);

		}
	}

    return output;
}

function createOrUpdateTotals(person){
	if(typeof output.Totals.PersonCount !== 'undefined'){

		output.Totals.PersonCount = output.Totals.PersonCount + 1;
		output.Totals.Salary = parseFloat(output.Totals.Salary) + parseFloat(person.Salary);
		output.Totals.NewSalary = parseFloat(output.Totals.NewSalary) + parseFloat(person.NewSalary);
		output.Totals.PercentIncrease = ((parseFloat(output.Totals.NewSalary)/parseFloat(output.Totals.Salary) * 100) - 100).toFixed(2) + '%';

	} else {

		output.Totals.PersonCount = 1;
		output.Totals.Salary = parseFloat(person.Salary);
		output.Totals.NewSalary = parseFloat(person.NewSalary);
		output.Totals.PercentIncrease = ((parseFloat(output.Totals.NewSalary)/parseFloat(output.Totals.Salary) * 100) - 100).toFixed(2) + '%';
	}

}

function addOrUpdateGroup(person){

	if(typeof output.Groups !== 'undefined' && groupExistsInGroups(person.Group)){

		updateGroup(person)

	} else {
		var group = {};

		group.Group = person.Group;
		group.PersonCount = 1;
		group.Salary = person.Salary;
		group.NewSalary = person.NewSalary;
		group.PercentIncrease = person.PercentIncrease;

		output.Groups.push(group);
	}
}

function updateGroup(person){

	for(var i = 0; i < output.Groups.length; i++) {
	    if (output.Groups[i].Group == person.Group) {
	        //group = output.Groups[i].Group;
	        output.Groups[i].PersonCount = output.Groups[i].PersonCount + 1;
	        output.Groups[i].Salary = parseFloat(output.Groups[i].Salary) + parseFloat(person.Salary);
	        output.Groups[i].NewSalary = parseFloat(output.Groups[i].NewSalary) + parseFloat(person.NewSalary);
	        output.Groups[i].PercentIncrease = ((parseFloat(output.Groups[i].NewSalary)/parseFloat(output.Groups[i].Salary) * 100) - 100).toFixed(2) + '%';
	        break;
	    }
	}

}

function groupExistsInGroups(group){
	var found = false;
	for(var i = 0; i < output.Groups.length; i++) {
	    if (output.Groups[i].Group == group) {
	        found = true;
	        break;
	    }
	}

	return found;	
}

function getPercentIncrease(status){
	var raise = 0;

	if(status === 'Full-Time'){
		raise = 0.20;
	} else if (status === 'Part-Time'){
		raise = 0.10;
	} else if (status === 'On-Leave'){
		raise = 0.01;
	}

	return raise;
}

function getNewSalary(salary, percent){
	return (parseFloat(salary) * (percent + 1)).toFixed(2);
}

module.exports = main;

