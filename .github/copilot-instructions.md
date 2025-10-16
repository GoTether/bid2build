# Repository Instructions for GitHub Copilot

## Project Overview
This is a React + TypeScript + Vite project called bid2build that uses Firebase for backend services and Tailwind CSS for styling. The application is deployed to GitHub Pages and includes routing with React Router.

## Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4 with custom color palette (neutral and sky)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Routing**: React Router v6
- **Linting**: ESLint with TypeScript ESLint plugin
- **Deployment**: GitHub Pages (base path: `/bid2build/`)

## Coding Standards

### TypeScript
- Use TypeScript for all new files (`.ts`, `.tsx` extensions)
- Prefer type annotations over implicit types
- Use proper typing for Firebase objects (e.g., `type User` from `firebase/auth`)
- Follow the TypeScript configuration in `tsconfig.app.json` and `tsconfig.node.json`

### React Components
- Use functional components with hooks
- Export components as default exports (e.g., `export default function ComponentName()`)
- Keep components focused and single-purpose
- Use custom hooks for shared logic (place in `src/hooks/`)
- Document component props with TypeScript interfaces when complex

### File Organization
- **Components**: Place reusable UI components in `src/components/`
- **Pages**: Place route-level components in `src/pages/`
- **Hooks**: Place custom hooks in `src/hooks/`
- **Lib**: Place utility functions and third-party integrations in `src/lib/`
- **Assets**: Place static assets in `src/assets/`

### Styling with Tailwind
- Use Tailwind utility classes for styling
- Follow the custom color palette defined in `tailwind.config.ts`:
  - Use `neutral` colors (50-950) for grayscale elements
  - Use `sky` colors (50-950) for primary/accent elements
- Prefer Tailwind utilities over custom CSS
- For active states in navigation, use: `text-sky-600` and `border-sky-500`
- For hover states, use: `hover:text-neutral-700` and `hover:border-neutral-300`

### Firebase Integration
- Import Firebase services from `src/lib/firebase.ts`
- Available exports: `app`, `auth`, `googleProvider`, `db`, `storage`
- Use the `useAuth` hook for authentication state
- Never commit Firebase API keys or credentials (they're already configured)

### Routing
- Use React Router's `<Routes>` and `<Route>` components
- Use `<NavLink>` for navigation with active state styling
- The root path `/` redirects to `/projects`
- Use `<Navigate>` for redirects
- Handle 404s with a catch-all route (`path="*"`)

### Build and Deployment
- Build command: `npm run build`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Preview production build: `npm run preview`
- The app is deployed to GitHub Pages with base path `/bid2build/`

## Best Practices

### Code Quality
- Run `npm run lint` before committing to catch issues
- Fix all ESLint warnings and errors
- Keep functions small and focused
- Use meaningful variable and function names

### Performance
- Use code splitting for large dependencies when appropriate
- Optimize images and assets before adding them
- Be mindful of bundle size (currently ~717KB)

### Testing
- Currently, there is no test infrastructure in this project
- When adding tests in the future, follow Jest/React Testing Library conventions

### Git and Version Control
- Use semantic commit messages
- Don't commit `node_modules/` or `dist/` directories (already in `.gitignore`)
- Keep changes focused and minimal

## Common Patterns

### Custom Hooks
```typescript
import { useEffect, useState } from 'react'

export function useCustomHook() {
  const [state, setState] = useState<Type>(initialValue)
  
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    }
  }, [dependencies])
  
  return { state }
}
```

### Navigation Items
```typescript
const items = [
  { name: 'Display Name', path: '/route-path' },
]
```

### NavLink Styling
```tsx
<NavLink
  to="/path"
  className={({ isActive }) =>
    `py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
      isActive
        ? 'border-sky-500 text-sky-600'
        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
    }`
  }
>
  Link Text
</NavLink>
```

## Additional Notes
- This is a work-in-progress project for bid and construction management
- Main sections include: Projects, People, Products, and Perspective
- The app uses Firebase Authentication with Google OAuth
- Follow the existing code style and patterns when adding new features
