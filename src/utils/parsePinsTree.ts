// @ts-nocheck
import path = require("path");
import { Pin } from "../extension";

export type PinsTreeType = {
    name: string;
    path: string;
    children: PinsTreeType[];
};

export default function parsePinsTree(pins: Pin[]) {
    const result: PinsTreeType[] = [];
    const level = { result };

    pins.forEach(pin => {
        if (!pin.relativePath) {
            result.push({ name: path.basename(pin.path), path: pin.path, children: [] });
            return;
        }

        const absPath = pin.path.replace(`/${pin.relativePath}`, '');
        pin.relativePath?.split('/').reduce((r, name, i, a) => {
            if (!r[name]) {
                r[name] = { result: [] };
                r.result.push({ name, path: path.posix.join(absPath, ...a.slice(0, i + 1)), children: r[name].result });
            }
            return r[name];
        }, level);
    });

    return result;
}