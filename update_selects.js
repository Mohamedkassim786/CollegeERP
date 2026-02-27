const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'client', 'src', 'pages');

const twClasses = "appearance-none bg-white border-2 border-gray-200 text-gray-800 rounded-xl px-4 py-3 font-medium cursor-pointer transition-all duration-200 outline-none hover:border-gray-300 hover:shadow-sm focus:ring-2 focus:ring-[#003B73]/50 focus:border-[#003B73] focus:shadow-md bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23003B73%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.25em] pr-10";

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to find <select className="..."> and replace "input-field" with the new long string of utility classes
    const regex = /<select([^>]*?)className=["']([^"']*)["']([^>]*?)>/g;

    let modified = false;
    let newContent = content.replace(regex, (match, prefix, classNames, suffix) => {
        // If it already has our massive string, skip it
        if (classNames.includes('appearance-none')) return match;

        // Remove input-field if it exists, as we are expanding it
        let cleanedClasses = classNames.replace('input-field', '').trim();

        // Combine existing (like w-full, font-semibold) with our new styling
        let newClasses = `${cleanedClasses} ${twClasses}`.trim();

        modified = true;
        return `<select${prefix}className="${newClasses}"${suffix}>`;
    });

    if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function traverseDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            processFile(fullPath);
        }
    });
}

// Also check components
const componentsPath = path.join(__dirname, 'client', 'src', 'components');
if (fs.existsSync(componentsPath)) {
    traverseDirectory(componentsPath);
}

traverseDirectory(directoryPath);
console.log('Script completed.');
