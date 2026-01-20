# Help Desk Frontend Documentation

Welcome to the technical documentation for the Help Desk Frontend application. This project is built with React, TypeScript, and Vite, following a modular architecture inspired by Angular patterns.

## Architecture Overview

The project is structured to separate concerns effectively:
- **`src/services/`**: logic for external API communication.
- **`src/interfaces/`**: TypeScript definitions for data models.
- **`src/context/`**: React Context for global state management (Auth, Theme).
- **`src/guards/`**: Route protection logic.
- **`src/routes/`**: Centralized routing configuration.
- **`src/components/`**: Reusable UI components.
- **`src/pages/`**: Top-level page components.

## Key Modules

### Authentication & RBAC
- **AuthService**: Handles login, logout, and profile fetching.
- **RBACService**: Manages Role-Based Access Control (Roles and Permissions).
- **AuthContext**: Provides user state and authentication methods to the component tree.
- **AuthGuard**: Protects routes requiring authentication.

### Routing
Routing is configured in `src/routes/app.routes.tsx` using a configuration-based approach with lazy loading for performance.

## Design System
We use **Tailwind CSS** for styling, adhering to a predefined color palette (Brand Blue, Brand Teal) and component structure.

---
*This documentation is intended for developers contributing to the project.*
