const fs = require('fs-extra')
const path = require('path')

function copy() {
    const from = path.resolve(__dirname, '../src/svg');
    const to = path.resolve(__dirname, '../dist/icons-svg/svg');
    fs.copySync(from, to);
}

function generatePackage() {
    const angularPkg = path.resolve(__dirname, '../dist/icons-angular/package.json');
    const version = fs.readJsonSync(angularPkg).version

    const pkg = path.resolve(__dirname, '../dist/icons-svg/package.json');
    const pkgContent = {
        name: "@ui-vts/icons-svg",
        version,
        description: "All SVG icons of UI Library",
        author: "Viettel Solutions",
        license: "Viettel Solutions",
        dependencies: {},
        main: ""
    }
    fs.writeFileSync(pkg, JSON.stringify(pkgContent, null, 4))
}


function updateAngularPackage() {
    const pkg = path.resolve(__dirname, '../dist/icons-angular/package.json');
    const pkgContent = fs.readJsonSync(pkg)
    const svgPkg = path.resolve(__dirname, '../dist/icons-svg/package.json');
    const {version: v, name: n } = fs.readJsonSync(svgPkg)
    pkgContent.dependencies[n] = `^${v}`
    fs.writeFileSync(pkg, JSON.stringify(pkgContent, null, 4))
}

function buildAssets() {
    const outDir = path.resolve(__dirname, '../dist/icons-svg');
    fs.rmdirSync(outDir, {recursive: true});
    fs.mkdirSync(outDir);
    copy()
    generatePackage()
    updateAngularPackage()
}

buildAssets();
