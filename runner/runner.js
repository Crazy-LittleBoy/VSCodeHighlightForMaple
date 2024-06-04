'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const exec = require('child_process').execFile;
const vscode = require('vscode');

function getSelectedCodeAndRun() {
    var outputChannel = vscode.window.createOutputChannel('Maple');
    var tmpFilePath = os.tmpdir();
    // check editor is openning
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No code found or selected.');
        return;
    }
    // get path of current file 
    var fname = editor.document.fileName;
    var fpath = path.resolve(fname, "..").replace(/\\/g, "/");
    // get configs
    var config = vscode.workspace.getConfiguration('maple');
    var cmaplePath = config.get("cmaplePath");
    // check cmaple.exe is exists
    if (!fs.existsSync(cmaplePath)) {
        vscode.window.showInformationMessage('cmaplePath "' + cmaplePath + '" not exists');
        return;
    }
    // run maple codes
    var selection = editor.selection;
    var text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
    var printOption = config.get("isPrettyPrint") ? "interface(prettyprint=1):\n" : "interface(prettyprint=0):\n";
    var dirOption = "currentdir(`" + fpath + "`):\n";
    var tmpFile = path.join(tmpFilePath, 'tmp0.mpl'.replace(/\d+/g, Math.random().toString()));
    fs.writeFileSync(tmpFile, printOption + dirOption + text, { encoding: "utf8" });
    outputChannel.show();
    outputChannel.appendLine('[Maple Running : ' + fname + ']');
    var isQuiet = !config.get("echo");
    var runOption = isQuiet ? ["-q", tmpFile] : [tmpFile];
    var p = exec(cmaplePath, runOption, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行失败: ${error}`);
            return;
        }
        stdout.on('data', (data) => {
            var lines = data.split(/[\r\n]+/g);
            for (var i = 0; i < lines.length; i++) {
                outputChannel.appendLine(lines[i]);
            }
        });
        stderr.on('data', (data) => {
            console.error(`错误输出: ${data}`);
        });
    });
    p.on('close', function() {
        fs.unlinkSync(tmpFile);
    });
}

exports.getSelectedCodeAndRun = getSelectedCodeAndRun;
