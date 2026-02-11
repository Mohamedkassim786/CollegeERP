const express = require('express');
const app = require('../index'); // This might start the server if index.js calls app.listen directly

function printRoutes(stack, prefix = '') {
    stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
            const newPrefix = prefix + (layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^\\', '').replace('\\/', '/').replace('(?=/|$)', ''));
            printRoutes(layer.handle.stack, newPrefix);
        }
    });
}

// Since index.js might already be running and app.listen is at the bottom, 
// we can try to inspect the app object if it's exported.
// However, index.js in this project DOES NOT export the app.

// Let's create a more targeted script that just requires the routes.
const externalRoutes = require('../routes/externalRoutes');
const mockApp = express();
mockApp.use('/api/external', externalRoutes);

console.log('--- Registered External Routes ---');
printRoutes(mockApp._router.stack);
