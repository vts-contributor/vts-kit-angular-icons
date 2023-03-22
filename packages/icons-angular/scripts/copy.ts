const fs = require('fs-extra');
const path = require('path');

function copyAssets() {
    const from = path.resolve(__dirname, '../src/svg');
    const to = path.resolve(__dirname, '../dist/icons/svg');
    fs.copySync(from, to);
    const iconsFrom = path.resolve(__dirname, '../src/icons');
    const iconsTo = path.resolve(__dirname, '../dist/icons/');
    fs.copySync(iconsFrom, iconsTo);
}

copyAssets();
