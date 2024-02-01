import * as vscode from "vscode";
import { Pin } from "../extension";
import { PinsTreeType } from "./parsePinsTree";
import { FolderAndFile } from "../PinsTreeDataProvider";

export default async function parseTreeItems(items: PinsTreeType[], pins: Pin[]) {
    const stats = await Promise.all(items.map(pin => vscode.workspace.fs.stat(vscode.Uri.parse(pin.path))));

    return items.map((pin, i) => {
        const isPinned = pins.some(item => item.path === pin.path);

        const isDirectory = stats[i].type === vscode.FileType.Directory
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;

        return new FolderAndFile(
            pin.name,
            isDirectory,
            vscode.Uri.parse(pin.path),
            pin.children.length
                ? pin.children
                : undefined
        ).setContextValue(`${!pin.children.length ? `${isPinned ? "pinnedF" : "f"}${isDirectory ? "older" : "ile"}` : undefined}`);
    });
};