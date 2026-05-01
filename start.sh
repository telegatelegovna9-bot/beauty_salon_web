#!/bin/bash
set -e

# Install all dependencies from the root workspace
npm install

# Start the backend
cd backend
npm start
