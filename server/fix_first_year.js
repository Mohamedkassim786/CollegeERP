const fs = require('fs');
const path = require('path');

const clientPagesAdmin = path.join(__dirname, '../client/src/pages/admin');
const filesToUpdate = [
    'TimetableManager.jsx',
    'StudentPromotion.jsx',
    'StudentManager.jsx',
    'SubjectManager.jsx',
    'DepartmentManager.jsx',
    'CourseManager.jsx'
];

for (const file of filesToUpdate) {
    const filePath = path.join(clientPagesAdmin, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file} - Not Found`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Regex replacement to handle:
    // selectedDept === "First Year (General)"
    // departmentData.name === "First Year (General)"
    // departmentData?.name === "First Year (General)"
    // d.name === "First Year (General)"
    // d && d.name !== "First Year (General)"

    content = content.replace(/([a-zA-Z0-9_.\?]+)\s*===\s*"First Year \(General\)"/g, (match, p1) => {
        // We add ?.toLowerCase() to the variable
        // If it already has ?, we just append .toLowerCase()
        let safeVar = p1.includes('?') ? p1 : `${p1}?`;
        return `${safeVar}.toLowerCase() === "first year"`;
    });

    content = content.replace(/([a-zA-Z0-9_.\?]+)\s*!==\s*"First Year \(General\)"/g, (match, p1) => {
        let safeVar = p1.includes('?') ? p1 : `${p1}?`;
        return `${safeVar}.toLowerCase() !== "first year"`;
    });

    // Any other standalone assignment like string "First Year (General)" or "First Year"
    content = content.replace(/"First Year \(General\)"/g, '"First Year"');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
}
