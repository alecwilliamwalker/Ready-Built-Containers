# Engineering Notebook

## Overview
The Engineering Notebook is a web-based calculation and documentation tool designed for engineers. It provides unit-aware calculations, spreadsheet functionality, and visual report creation capabilities.

## Project Architecture
- **Framework**: React 19.1.1 + TypeScript + Vite 7.1.5
- **Development Server**: Runs on port 5000 (0.0.0.0:5000)
- **Storage**: Uses browser localStorage for persistence

## Core Features

### 1. Spreadsheet (Sheet Tab)
- Traditional spreadsheet with A1-style cell referencing
- Formula evaluation supporting +, -, *, / operations
- Cell reference support (e.g., =A1+B2)
- Cycle detection to prevent infinite loops
- Copy/paste functionality
- Keyboard navigation (arrows, tab, enter)
- Undo/redo support

### 2. Unit-Aware Report Canvas (Report Tab)
- Visual canvas for creating calculation boxes
- Drag-and-drop, resize, and positioning of elements
- Unit-aware calculations (length, force, pressure, time)
- Automatic unit conversions (imperial/metric)
- Mathematical expression rendering
- Layout persistence

### 3. History Management
- Comprehensive undo/redo across all features
- Transaction-based operations
- Command pattern implementation

### 4. Notebook Feature
- Text and math block creation
- Mathematical notation support
- Persistent storage

## Project Structure
```
src/
├── components/          # UI components (TopBar, Tabs, etc.)
├── engine/             # Core calculation engine
│   ├── eval.ts         # Formula evaluation
│   ├── formatUnits.ts  # Unit conversion system
│   └── unitPrefs.ts    # Unit preferences
├── frames/             # Main application views
│   ├── ReportCanvas/   # Visual report creation
│   └── ReportPad/      # Report calculation logic
├── history/            # Undo/redo system
│   ├── commands/       # Command implementations
│   └── History.ts      # Core history manager
├── parser/             # Expression parsing
├── referencing/        # A1-style cell references
└── App.tsx             # Main application component
```

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Recent Changes (September 14, 2025)
- Reorganized file structure from nested `engineering-notebook/` directory to root
- Configured Vite to serve on 0.0.0.0:5000 for proper Replit hosting
- Set up development workflow with automatic restart
- Resolved all TypeScript LSP diagnostics

## Current State
✅ Application is fully functional and running
✅ Development server configured correctly
✅ All dependencies installed and working
✅ TypeScript compilation clean
✅ Ready for development and testing

## User Preferences
- Prefers organized, structured code
- Focus on engineering calculation accuracy
- Unit-aware calculations are critical
- Visual documentation capability important