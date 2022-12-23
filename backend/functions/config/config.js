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
    "localhost",
    "http://mail.google.com",
    "https://mail.google.com",
    "http://inbox.google.com",
    "https://inbox.google.com",
];

module.exports = {
    apiAccessClientAddresses,
};
