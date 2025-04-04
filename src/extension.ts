// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// The entry point to the 'validate' module.
import { errors } from './lib/sof-js/validate';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sql-on-fhir-toolkit-vscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('sql-on-fhir-toolkit-vscode.validateViewDefinition', () => {
		// The code you place here will be executed every time your command is executed

		// If there is an active text editor, use it.
		const activeTextEditor = vscode.window.activeTextEditor;
		if (activeTextEditor) {

			// Retrieve content from the active text editor.
			const documentText = activeTextEditor.document.getText();

			try {

				// Parse the retrieved content as JSON.
				const jsonContent = JSON.parse(documentText);

				// Validate the View Definition.
				const errorsReturn = errors(jsonContent);
				if (errorsReturn) {
					let messages = '';
					errorsReturn.forEach((error: any) => {
						messages += `Error: [${error.message}]\n`;
					});
					vscode.window.showErrorMessage(messages);
				} else {
					vscode.window.showInformationMessage('The View Definition is valid.');
				}

			} catch(e: any) {
				vscode.window.showErrorMessage(e.message);
			}
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
