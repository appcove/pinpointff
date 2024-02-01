import * as vscode from 'vscode';
import { PinsTreeDataProvider } from './PinsTreeDataProvider';

export type Pin = {
	path: string;
	relativePath?: string;
};

export function activate(context: vscode.ExtensionContext) {
	const pinsTreeDataProvider = new PinsTreeDataProvider(context);

	context.subscriptions.push(
		...["pinpointff.pinFile", "pinpointff.pinFolder"].map(command=>vscode.commands.registerCommand(command, async (args) => {
			const path = args?.path || args?.resourceUri?.path;

			// relative path is useful to show parent folders name in tree view
			let relativePath: string | undefined = vscode.workspace.asRelativePath(path, true);
			if(relativePath === path){
				// if it's a root folder in the workspace, then ignore relative path
				relativePath = undefined;
			} else {
				relativePath = relativePath.replace(/\\/g, "/");
			}
			if(path) {
				const pins: Pin[] = [...context.globalState.get('pins', [])];
				if(!pins.some(pin=>pin.path === path)) {
					pins.push({path, relativePath});
					await context.globalState.update('pins', pins);
					pinsTreeDataProvider.refresh();
				}
			}
		}))
	);

	context.subscriptions.push(
		...["pinpointff.unpinFile", "pinpointff.unpinFolder"].map(command=>vscode.commands.registerCommand(command, async (args) => {
			const path = args?.resourceUri.path;
			if(path) {
				const pins: Pin[] = [...context.globalState.get('pins', [])];
				await context.globalState.update('pins', pins.filter(pin=>pin.path !== path));
				pinsTreeDataProvider.refresh();
			}
		}))
	);

	context.subscriptions.push(vscode.commands.registerCommand('pinpointff.unpinAll', async () => {
		await context.globalState.update('pins', []);
		pinsTreeDataProvider.refresh();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('pinpointff.openFile', (args) => {
		const uri = args?.resourceUri;
		if(uri) {
			vscode.window.showTextDocument(uri);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('pinpointff.refresh', () => {
		pinsTreeDataProvider.refresh();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('pinpointff.copyRelativePath', (args) => {
		const uri = args?.resourceUri;
		if(uri) {
			vscode.env.clipboard.writeText(vscode.workspace.asRelativePath(uri, false));
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('pinpointff.deleteFile', async (args) => {
		const uri = args?.resourceUri;
		if(uri) {
			await vscode.workspace.fs.delete(uri);
			pinsTreeDataProvider.refresh();
		}
	}));

	context.subscriptions.push(vscode.window.registerTreeDataProvider('pinpointff', pinsTreeDataProvider));
}

export function deactivate() {}
