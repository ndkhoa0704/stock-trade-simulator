# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**stock-trade-simulator** is a stock trading simulator.

**Tech Stack:**
- Backend: Node.js (cluster mode), Express.js
- Frontend: Vue.js 3 + Vite + Bootstrap 5
- Databases: Mongodb (mongoose)
- Caching: Redis

## Code style
- Files are structure as module, which is a function and that function is exported
- Inside the function, there is a variable named SELF, and that function return an object
    - The return object will return the functions that are exposed to be used externally
    - SELF variable contains all the helper functions and variables that is shared within with every other functions