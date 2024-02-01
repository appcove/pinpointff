import * as vscode from "vscode";
import { Pin } from "./extension";
import parsePinsTree, { PinsTreeType } from "./utils/parsePinsTree";
import parseTreeItems from "./utils/parseTreeItems";

export class PinsTreeDataProvider
	implements vscode.TreeDataProvider<FolderAndFile> {
	private _onDidChangeTreeData: vscode.EventEmitter<
		FolderAndFile | undefined | void
	> = new vscode.EventEmitter<FolderAndFile | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<
		FolderAndFile | undefined | void
	> = this._onDidChangeTreeData.event;

	private pins: Pin[] = [];

	constructor(
		private extensionContext: vscode.ExtensionContext
	) {
		this.getPins();
	}

	private getPins() {
		this.pins = this.extensionContext.globalState.get("pins", []);
	}

	private async recursiveFolder(uri: vscode.Uri) {
		const folderArray = await vscode.workspace.fs.readDirectory(uri);
		return folderArray
			.sort((a, b) => b[1] - a[1])
			.map((item) => {
				const [name, type] = item;
				const isDirectory =
					type === vscode.FileType.Directory
						? vscode.TreeItemCollapsibleState.Collapsed
						: vscode.TreeItemCollapsibleState.None;

				const isPinned = this.pins.some(pin => pin.path === vscode.Uri.joinPath(uri, "/" + name).path);
				return new FolderAndFile(name, isDirectory, vscode.Uri.joinPath(uri, "/" + name)).setContextValue(`${isPinned ? "pinnedF" : "f"}${isDirectory ? "older" : "ile"}`);
			});
	}

	refresh(): void {
		this.getPins();
		this._onDidChangeTreeData.fire();
	}

	async getTreeItem(element: FolderAndFile): Promise<vscode.TreeItem> {
		return element;
	}

	async getChildren(element?: FolderAndFile): Promise<FolderAndFile[]> {
		if (element) {
			if (element.children) {
				return await parseTreeItems(element.children, this.pins);
			}
			return this.recursiveFolder(element.resourceUri);
		} else {
			const pins = this.pins.filter((pin, index, arr) => !arr.some((item, i) => i !== index && pin.path.includes(item.path)));
			return parseTreeItems(parsePinsTree(pins), this.pins);
		}
	}
}


export class FolderAndFile extends vscode.TreeItem {
	resourceUri: vscode.Uri;
	command?: vscode.Command;
	children: PinsTreeType[] | undefined;

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		uri: vscode.Uri,
		children?: PinsTreeType[] | undefined
	) {
		super(label, collapsibleState);
		this.tooltip = this.label;
		this.resourceUri = uri;
		this.command =
			collapsibleState === vscode.TreeItemCollapsibleState.None
				? {
					arguments: [this],
					command: "pinpointff.openFile",
					title: this.label,
				}
				: undefined;
		this.children = children;
	}
	setContextValue(value: string) {
		this.contextValue = value;
		return this;
	}
}