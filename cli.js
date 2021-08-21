#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const util = require('util');
const { spawn } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const mergeUtil = require('merge-util');
const chalk = require('chalk');
const inquirer = require('inquirer');

const dependency = {
    plain: [ 'clipcc-extension' ]
};

const devDependency = {
    plain: [ 'mkdirp', 'rimraf' ],
    webpack: [ 'webpack', 'webpack-cli', 'copy-webpack-plugin', 'zip-webpack-plugin' ]
};

const cmdline = {
    npm: [ 'npm install --save %s', 'npm install --save-dev %s' ],
    yarn: [ 'yarn add %s', 'yarn add -D %s' ]
};

const scripts = {
    plain: {
        "build": "rimraf ./build && mkdirp build && rimraf ./dist && mkdirp dist && node build.js",
        "build:dist": "NODE_ENV=production npm run build"
    },
    yarn: {
        "build:dist": "NODE_ENV=production yarn run build"
    },
    webpack: {
        "build": "rimraf ./build && mkdirp build && rimraf ./dist && mkdirp dist && webpack --bail"
    }
};

const copyFormatFiles = {
    plain: [ '.gitignore_', 'locales', 'index.js' ],
    webpack: [ 'webpack.config.js' ]
};

const copyFiles = {
    plain: [ 'assets' ]  
};

function clone(obj) {
    let res = Array.isArray(obj) ? [] : {};
    if (typeof obj !== 'object') return obj;
    for (const key in obj) res[key] = typeof obj[key] === 'object' ? clone(obj[key]) : obj[key];
    return res;
}

function runCmd(str) {
    process.stdout.write(chalk.cyan(`\$ ${str}\n`));
    const [ cmd, ...arg ] = str.split(' ').filter(v => v.length);
    const sp = spawn(cmd, arg, { encoding: 'utf-8', stdio: 'inherit' });
    return new Promise((resolve, _) => {
        sp.on('close', code => resolve(code));
    });
}

function initGit() {
    return runCmd('git init');
}

function convertAuthor(author) {
    return author.includes(',') ? author.split(',').map(v => v.trim()) : author;
}

function createPackage(types, meta, root) {
    let script = scripts.plain;
    for (const type of types) script = mergeUtil(script, scripts[type]);
    const pkgInfo = {
        name: 'clipcc-extension-' + meta.id.replace('.', '-'),
        version: meta.version,
        author: convertAuthor(meta.author),
        scripts: script,
    };
    const info = {
        id: meta.id,
        author: pkgInfo.author,
        version: meta.version,
        icon: 'assets/icon.jpg',
        inset_icon: 'assets/inset_icon.svg',
        api: 1
    };
    return Promise.all([
        fs.promises.writeFile(path.join(root, 'package.json'), JSON.stringify(pkgInfo, null, 4)),
        fs.promises.writeFile(path.join(root, 'info.json'), JSON.stringify(info, null, 4))
    ]);
}

async function installDependency(pkg, types) {
    const dep = [];
    const dev = [];
    for (const type of types) {
        if (dependency.hasOwnProperty(type)) dep.push(...dependency[type]);
        if (devDependency.hasOwnProperty(type)) dev.push(...devDependency[type]);
    }
    return runCmd(util.format(cmdline[pkg][0], dep.join(' ')))
        .then(_ => runCmd(util.format(cmdline[pkg][1], dev.join(' '))));
}

function formatString(data, fmt) {
    for (const key in fmt) data = data.replace(RegExp(`(?<!%)%\\[${key}\\]`, 'g'), fmt[key]);
    return data;
}

function copyFileWithFormat(from, to, fmt) {
    if (fs.statSync(from).isDirectory()) {
        const files = fs.readdirSync(from);
        if (!fs.existsSync(to)) fs.mkdirSync(to);
        return Promise.all(files.map(file => copyFileWithFormat(path.join(from, file), path.join(to, file), fmt)));
    }
    to = to.replace(/_$/, '');
    return new Promise((resolve, reject) => {
        fs.promises.readFile(from, { encoding: 'utf-8' })
            .then(data => fs.promises.writeFile(to, formatString(data, fmt), { encoding: 'utf-8' }))
            .then(_ => {
                process.stdout.write(`Copied ${from} -> ${to}.\n`);
                resolve();
            });
    });
}

function copyFile(from, to) {
    if (fs.statSync(from).isDirectory()) {
        const files = fs.readdirSync(from);
        if (!fs.existsSync(to)) fs.mkdirSync(to);
        return Promise.all(files.map(file => copyFile(path.join(from, file), path.join(to, file))));
    }
    to = to.replace(/_$/, '');
    return new Promise((resolve, reject) => {
        fs.promises.copyFile(from, to).then(_ => {
            process.stdout.write(`Copied ${from} -> ${to}.\n`);
            resolve();
        });
    });
}

function copyFilesToDir(types, root, fmt) {
    const pr = [];
    for (const type of types) {
        if (copyFiles.hasOwnProperty(type)) {
            pr.push(copyFiles[type].map(file => copyFile(
                path.join(path.dirname(__filename), 'template', file),
                path.join(root, file)
            )));
        }
        if (copyFormatFiles.hasOwnProperty(type)) {
            pr.push(copyFormatFiles[type].map(file => copyFileWithFormat(
                path.join(path.dirname(__filename), 'template', file),
                path.join(root, file), fmt
            )));
        }
    }
    return Promise.all(pr);
}

async function interactive() {
    process.stdout.write('Welcome to use clipcc-extension-cli!\n');
    const packageMeta = await inquirer.prompt([{
        type: 'input',
        name: 'id',
        message: 'Extension ID:',
        validate: v => /^([a-z0-9_]+\.)+[a-z0-9_]+$/.test(v) ? true : 'Unvalid ID.'
    }, {
        type: 'input',
        name: 'name',
        message: 'Name:'
    }, {
        type: 'input',
        name: 'description',
        message: 'Description:'
    }, {
        type: 'input',
        name: 'version',
        message: 'Version:'
    }, {
        type: 'input',
        name: 'author',
        message: 'Author:'
    }]);
    const { lang, pkg, bundler, git } = await inquirer.prompt([{
        type: 'list',
        name: 'lang',
        message: 'Choose your development language:',
        choices: [ 'JavaScript' /*, 'TypeScript'*/ ]
    }, {
        type: 'list',
        name: 'pkg',
        message: 'Choose your package manager:',
        choices: [ 'npm', 'yarn' /*, 'berry'*/ ]
    }, {
        type: 'list',
        name: 'bundler',
        message: 'Choose your bundler:',
        choices: [ 'webpack' /*, 'snowpack'*/ ]
    }, {
        type: 'confirm',
        name: 'git',
        message: 'Use git?'
    }]);
    await createPackage([ 'plain', pkg, bundler ], packageMeta, '.');
    await copyFilesToDir([ 'plain', pkg, bundler ], '.', { ...packageMeta });
    if (git) await initGit();
    await installDependency(pkg, [ 'plain', pkg, bundler ]);
}

const argv = yargs(hideBin(process.argv))
    .usage('Generate ClipCC extension project.')
    .options({
        version: {
            alias: 'v',
            description: 'Show version.'
        }
    })
    .argv;

if (argv.generate) {
    process.stdout.write(chalk.red('Unsupported --generate.\n'));
}
else {
    interactive();
}


