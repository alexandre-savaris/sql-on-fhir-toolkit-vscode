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
// For parsing newline-delimited JSON content.
const parseNDJSON = require( '@stdlib/utils-parse-ndjson' );

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
						columnsListAsString += snakeCase(column) + ' CHARACTER VARYING';
						index++;
					});
					// Format the SQL output.
					const ddl = `CREATE TABLE ${resourceName} ( ${columnsListAsString} );\n`;
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
	const disposable3 = vscode.commands.registerCommand('sql-on-fhir-toolkit-vscode.generateDmlForDataset', function () {
		// The code you place here will be executed every time your command is executed

		try {

			if (vscode.window.tabGroups.all.length === 0) {
				vscode.window.showErrorMessage('No editor groups open.');
				return;
			}
			const firstGroup = vscode.window.tabGroups.all[0];
			if (firstGroup.tabs.length !== 2) {
				vscode.window.showErrorMessage('There must be two tabs in the first group.');
				return;
			}

			let activeTextEditor = null;

			// Asynchronous block to allow calling the "showTextDocument" method synchronously.
			(async () => {

				// First tab: the dataset.
				const firstEditorTab = firstGroup.tabs[0];
				await vscode.window.showTextDocument(firstEditorTab.input);
				activeTextEditor = vscode.window.activeTextEditor;
				// Retrieve content from the active text editor.
				const datasetContent = activeTextEditor.document.getText();

				// Second tab: the view definition.
				const secondEditorTab = firstGroup.tabs[1];
				await vscode.window.showTextDocument(secondEditorTab.input);
				activeTextEditor = vscode.window.activeTextEditor;
				// Retrieve content from the active text editor.
				const viewDefinitionInstance = activeTextEditor.document.getText();
				// Parse the retrieved content as JSON.
				const jsonViewDefinitionInstance = JSON.parse(viewDefinitionInstance);
				// Retrieve the resource name from the View Definition instance.
				const resourceName = snakeCase(path.fhirpath_evaluate(jsonViewDefinitionInstance, 'resource')[0]);

				// Validate the View Definition instance.
				const validateViewDefinitionInstanceReturn = validateViewDefinitionInstance(jsonViewDefinitionInstance);
				if (validateViewDefinitionInstanceReturn) {
					vscode.window.showErrorMessage(validateViewDefinitionInstanceReturn);
					return;
				}

				// Parse the newline-delimited JSON content.
				const parseNDJSONReturn = parseNDJSON(datasetContent);
				if (parseNDJSONReturn.message) {
					vscode.window.showErrorMessage(`The input dataset must be a newline-delimited JSON: [ ${parseNDJSONReturn.message} ]`);
					return;
				}
				if (!Array.isArray(parseNDJSONReturn)) {
					vscode.window.showErrorMessage('The input dataset must be a newline-delimited JSON.');
					return;
				}

				// Loop through the parsed dataset.
				let dml = null;
				let fullDml = '';
				parseNDJSONReturn.forEach((ndJsonResourceInstance) => {

					// Evaluate the resource instance using the View Definition instance.
					const evaluateReturn = sof_js.evaluate(jsonViewDefinitionInstance, ndJsonResourceInstance);

					// Loop through the evaluated dataset, generating the SQL insert statements.
					evaluateReturn.forEach((resourceInstance) => {
						let index = 0;
						let columnsAsString = '';
						let valuesAsString = '';
						for (const [key, value] of Object.entries(resourceInstance)) {
							if (index !== 0) {
								columnsAsString += ', ';
								valuesAsString += ', ';
							}
							columnsAsString += snakeCase(key);
							valuesAsString += `'${value}'`;
							index++;
						}
						// Format the SQL output.
						dml = `INSERT INTO ${resourceName} ( ${columnsAsString} ) values ( ${valuesAsString} );\n`;
					});

					fullDml += dml;
				});

				// Create a new document with the SQL output.
				vscode.workspace.openTextDocument({
					content: fullDml,
					language: 'sql'
					}).then(newDocument => {
						vscode.window.showTextDocument(newDocument, vscode.ViewColumn.Beside);
					});

			})();

		} catch(e) {
			vscode.window.showErrorMessage(e.message);
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
