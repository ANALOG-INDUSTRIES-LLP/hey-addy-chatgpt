/**
 * This file contains config data for different environments and
 * stacks. For instance configuration for dev vs prod
 * The dev branch will contain dev config and main branch will
 * contain prod config
 */


const apiAccessClientAddresses = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5000",
    "http://localhost:5001",
    // "http://localhost:5001",
    // TODO: Add production api route one
    "https://hey-addy.web.app",
    process.env.API_FUNCTIONS_URL,
    "localhost",
];

module.exports = {
    apiAccessClientAddresses,
};
