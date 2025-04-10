// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
// The entry point to the 'path' module.
const path = require('./src/lib/sof-js/path.js');
// The entry point to the 'validate' module.
const validate = require('./src/lib/sof-js/validate.js');
// The entry point to the 'sof-js' module.
const sof_js = require('./src/lib/sof-js/sof-js.js');
// For changing cases of table and column names.
const { snakeCase } = require('change-case-all');
// For formatting SQL instructions.
const { format } = require('sql-formatter');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sql-on-fhir-toolkit-vscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('sql-on-fhir-toolkit-vscode.validateViewDefinitionInstance', function () {
		// The code you place here will be executed every time your command is executed

		// If there is an active text editor, use it.
		const activeTextEditor = vscode.window.activeTextEditor;
		if (activeTextEditor) {

			// Retrieve content from the active text editor.
			const documentText = activeTextEditor.document.getText();

			try {

				// Parse the retrieved content as JSON.
				const jsonContent = JSON.parse(documentText);

				// Validate the View Definition instance.
				const validateViewDefinitionInstanceReturn = validateViewDefinitionInstance(jsonContent);
				if (validateViewDefinitionInstanceReturn) {
					vscode.window.showErrorMessage(validateViewDefinitionInstanceReturn);
				} else {
					vscode.window.showInformationMessage('The View Definition is valid.');
				}

			} catch(e) {
				vscode.window.showErrorMessage(e.message);
			}
		}
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable2 = vscode.commands.registerCommand('sql-on-fhir-toolkit-vscode.generateDdlForViewDefinitionInstance', function () {
		// The code you place here will be executed every time your command is executed

		// If there is an active text editor, use it.
		const activeTextEditor = vscode.window.activeTextEditor;
		if (activeTextEditor) {

			// Retrieve content from the active text editor.
			const documentText = activeTextEditor.document.getText();

			try {

				// Parse the retrieved content as JSON.
				const jsonContent = JSON.parse(documentText);

				// Validate the View Definition instance.
				const validateViewDefinitionInstanceReturn = validateViewDefinitionInstance(jsonContent);
				if (validateViewDefinitionInstanceReturn) {
					vscode.window.showErrorMessage(validateViewDefinitionInstanceReturn);
				} else {
					// Retrieve the resource name from the View Definition instance.
					const resourceName = snakeCase(path.fhirpath_evaluate(jsonContent, 'resource')[0]);
					// Retrieve the columns list from the View Definition instance.
					const columnsList = sof_js.get_columns(jsonContent);
					let index = 0;
					let columnsListAsString = '';
					columnsList.forEach((column) => {
						if (index !== 0) {
							columnsListAsString += ', ';
						}
						columnsListAsString += snakeCase(column) + ': text';
						index++;
					});
					// Format the SQL output.
					const ddl = format('create table ? ( ? );', {
						tabWidth: 4,
						keywordCase: 'upper',
						params: [resourceName, columnsListAsString],
					});
					// Create a new document with the SQL output.
					vscode.workspace.openTextDocument({
						content: ddl,
						language: 'sql'
					}).then(newDocument => {
						vscode.window.showTextDocument(newDocument)
					});
				}

			} catch(e) {
				vscode.window.showErrorMessage(e.message);
			}
		}
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable3 = vscode.commands.registerCommand('sql-on-fhir-toolkit-vscode.getColumns', function () {
		// The code you place here will be executed every time your command is executed

		// If there is an active text editor, use it.
		const activeTextEditor = vscode.window.activeTextEditor;
		if (activeTextEditor) {

			// Retrieve content from the active text editor.
			const documentText = activeTextEditor.document.getText();

			try {

				// Parse the retrieved content as JSON.
				const jsonContent = JSON.parse(documentText);

				// ???
				const getColumnsReturn = sof_js.get_columns(jsonContent);
				console.log(getColumnsReturn);

				// ???
				const patientInstance = '{"resourceType": "Patient","id": "pt1","name": [{"family": "F1"}],"active": true}';
				const getEvaluateReturn = sof_js.evaluate(jsonContent, JSON.parse(patientInstance));
				console.log(getEvaluateReturn);

				// // Validate the View Definition instance.
				// const errorsReturn = validate.errors(jsonContent);
				// if (errorsReturn) {
				// 	let messages = '';
				// 	errorsReturn.forEach((error) => {
				// 		messages += `Error: [${error.message}]\n`;
				// 	});
				// 	vscode.window.showErrorMessage(messages);
				// } else {
				// 	vscode.window.showInformationMessage('The View Definition is valid.');
				// }

			} catch(e) {
				vscode.window.showErrorMessage(e.message);
			}
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
}

// This method is called when your extension is deactivated
function deactivate() {}

// Validate the View Definition instance.
const validateViewDefinitionInstance = function (jsonContent) {
	const errorsReturn = validate.errors(jsonContent);
	let messages = '';
	if (errorsReturn) {
		errorsReturn.forEach((error) => {
			messages += `Error: [${error.message}]\n`;
		});
	}
	return messages;
}

module.exports = {
	activate,
	deactivate
}
