const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'client', 'src', 'pages');

const oldInjectedTailwindClass = "appearance-none bg-white border-2 border-gray-200 text-gray-800 rounded-xl px-4 py-3 font-medium cursor-pointer transition-all duration-200 outline-none hover:border-gray-300 hover:shadow-sm focus:ring-2 focus:ring-[#003B73]/50 focus:border-[#003B73] focus:shadow-md bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23003B73%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.25em] pr-10";

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Only process if <select> exists or the old class exists
    if (!content.includes('<select') && !content.includes(oldInjectedTailwindClass)) {
        return;
    }

    let modified = false;

    // Clean up my previous inline tailwind injection
    if (content.includes(oldInjectedTailwindClass)) {
        // Use standard literal replacement since regex regex is dangerous with that massive string
        content = content.split(oldInjectedTailwindClass).join('');
        modified = true;
    }

    // Clean up any stray input-field classes directly on select (or now just CustomSelect)
    if (content.match(/<select[^>]*?className=["'][^"']*?input-field[^"']*?["']/)) {
        content = content.replace(/(<select[^>]*?className=["'][^"']*?)input-field([^"']*?["'])/g, '$1$2');
        modified = true;
    }

    // Now convert native select to CustomSelect
    if (content.includes('<select')) {
        content = content.replace(/<select/g, '<CustomSelect');
        // Handle closing tags securely
        content = content.replace(/<\/select>/g, '</CustomSelect>');
        modified = true;
    }

    // Handle imports
    if (modified && !content.includes('import CustomSelect')) {
        const dir = path.dirname(filePath);
        const componentsDir = path.join(__dirname, 'client', 'src', 'components');

        let relativePath = path.relative(dir, componentsDir).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

        const importStmt = `import CustomSelect from '${relativePath}/CustomSelect';\n`;

        // Find the block of imports and insert comfortably after the last relative import or react import
        const importIndex = content.indexOf('import ');
        if (importIndex !== -1) {
            content = content.slice(0, importIndex) + importStmt + content.slice(importIndex);
        } else {
            content = importStmt + content;
        }
    }

    if (modified) {
        // Clean up double spaces or empty classNames caused by removing 'input-field' and massive strings
        content = content.replace(/className="\s+"/g, '');
        content = content.replace(/className=''/g, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Component Call: ${filePath}`);
    }
}

function traverseDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            processFile(fullPath);
        }
    });
}

traverseDirectory(directoryPath);

// Also process components folder if they have selects inside them
const componentsPath = path.join(__dirname, 'client', 'src', 'components');
if (fs.existsSync(componentsPath)) {
    fs.readdirSync(componentsPath).forEach(file => {
        let fullPath = path.join(componentsPath, file);
        if (fullPath.endsWith('.jsx') && !fullPath.includes('CustomSelect.jsx')) {
            processFile(fullPath);
        }
    });
}

console.log('Swap CustomSelect script completed.');
