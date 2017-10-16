'use strict';

import { HoverProvider, Hover, SymbolInformation, SymbolKind, MarkdownString, MarkedString, TextDocument, CancellationToken, Range, Position, commands, workspace } from 'vscode';
import hlslGlobals = require('./hlslGlobals');

const linktext: string = "[HLSL documentation][1]\n\n[1]: ";

export function textToMarkedString(text: string): MarkedString {
	return text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
}

export default class HLSLHoverProvider implements HoverProvider {

    private getSymbols(document: TextDocument): Thenable<SymbolInformation[]> {
        return commands.executeCommand<SymbolInformation[]>('vscode.executeDocumentSymbolProvider', document.uri);
    }

    public async provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover> {
        
        let enable = workspace.getConfiguration('hlsl').get<boolean>('suggest.basic', true);
        if (!enable) {
            return null;
        }

        let wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        let name = document.getText(wordRange);
        let backchar = '';
        if(wordRange.start.character > 0) {
            let backidx = wordRange.start.translate({characterDelta: -1});
            backchar = backidx.character < 0 ? '' : document.getText(new Range(backidx, wordRange.start));
        }

        if (backchar === '#') {
            const key = name.substr(1);
            var entry = hlslGlobals.preprocessors[name.toUpperCase()];
            if (entry && entry.description) {
                let signature = '(*preprocessor*) ';
                signature += '**#' + name + '**';
                let contents: MarkedString[] = [];
                contents.push(new MarkdownString(signature));
                contents.push(textToMarkedString(entry.description));

                if (entry.link && entry.link != '') {
                    let link = new MarkdownString(linktext);
                    link.appendText(entry.link);
                    link.isTrusted = true;
                    contents.push(link);
                }
                return new Hover(contents, wordRange);
            }
        }

        var entry = hlslGlobals.intrinsicfunctions[name]
        if (entry && entry.description) {
            let signature = '(*function*) ';
            signature += '**' + name + '**';
            signature += '(';
            if (entry.parameters && entry.parameters.length != 0) {
                let params = '';
                entry.parameters.forEach(p => params += p.label + ',');
                signature += params.slice(0, -1);
            }
            signature += ')';
            let contents: MarkedString[] = [];
            contents.push(new MarkdownString(signature));
            contents.push(textToMarkedString(entry.description));

            if (entry.link && entry.link != '') {
                let link = new MarkdownString(linktext);
                link.appendText(entry.link);
                link.isTrusted = true;
                contents.push(link);
            }
            return new Hover(contents, wordRange);
        }

        entry = hlslGlobals.datatypes[name];
        if (entry && entry.description) {
            let signature = '(*datatype*) ';
            signature += '**' + name + '**';
            let contents: MarkedString[] = [];
            contents.push(new MarkdownString(signature));
            contents.push(textToMarkedString(entry.description));

            if (entry.link && entry.link != '') {
                let link = new MarkdownString(linktext);
                link.appendText(entry.link);
                link.isTrusted = true;
                contents.push(link);
            }
            return new Hover(contents, wordRange);
        }

        entry = hlslGlobals.semantics[name.toUpperCase()];
        if (entry && entry.description) {
            let signature = '(*semantic*) ';
            signature += '**' + name + '**';
            let contents: MarkedString[] = [];
            contents.push(new MarkdownString(signature));
            contents.push(textToMarkedString(entry.description));

            if (entry.link && entry.link != '') {
                let link = new MarkdownString(linktext);
                link.appendText(entry.link);
                link.isTrusted = true;
                contents.push(link);
            }
            return new Hover(contents, wordRange);
        }

        let key = name.replace(/\d+$/, '') //strip tailing number
        entry = hlslGlobals.semanticsNum[key.toUpperCase()];
        if (entry && entry.description) {
            let signature = '(*semantic*) ';
            signature += '**' + name + '**';
            let contents: MarkedString[] = [];
            contents.push(new MarkdownString(signature));
            contents.push(textToMarkedString(entry.description));

            if (entry.link && entry.link != '') {
                let link = new MarkdownString(linktext);
                link.appendText(entry.link);
                link.isTrusted = true;
                contents.push(link);
            }
            return new Hover(contents, wordRange);
        }

        entry = hlslGlobals.keywords[name];
        if (entry) {
            let signature = '(*keyword*) ';
            signature += '**' + name + '**';
            let contents: MarkedString[] = [];
            contents.push(new MarkdownString(signature));
            contents.push(textToMarkedString(entry.description));

            if (entry.link && entry.link != '') {
                let link = new MarkdownString(linktext);
                link.appendText(entry.link);
                link.isTrusted = true;
                contents.push(link);
            }
            return new Hover(contents, wordRange);
        }

        let symbols = await this.getSymbols(document);

        for (let s of symbols) {
            if (s.name === name) {
                let contents: MarkedString[] = [];
                let signature = '(*' + SymbolKind[s.kind].toLowerCase() + '*) ';
                signature += s.containerName ? s.containerName + '.' : '';
                signature += '**' + name + '**';

                contents.push(new MarkdownString(signature));

                if (s.location.uri.toString() === document.uri.toString()) {
                    //contents = [];
                    contents.push( {language: 'hlsl', value: document.getText(s.location.range)} );
                }
                
                return new Hover(contents, wordRange);
            }
        }
    } 
}