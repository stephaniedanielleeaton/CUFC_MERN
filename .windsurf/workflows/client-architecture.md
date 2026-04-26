---
description: Client architecture guide - folder structure, patterns, and conventions
---

# Client Architecture Guide

This document describes the architecture, patterns, and conventions used in the CUFC client application.

## Folder Structure

```
client/src/
├── components/     # Reusable UI components organized by feature
├── constants/      # Application constants (API endpoints, config)
├── context/        # React Context providers for global state
├── hooks/          # Custom React hooks for data fetching and logic
├── pages/          # Route-level page components
├── services/       # API service functions (data layer)
├── types/          # TypeScript type definitions (client-specific)
└── utils/          # Utility functions (validation, formatting)
```

---

## Layer Responsibilities

### Pages (`pages/`)
- **Purpose:** Route-level components that compose the UI
- **Responsibilities:**
  - Orchestrate data fetching via hooks/services
  - Manage page-level state (forms, modals, steps)
  - Compose components into a complete view
- **Naming:** `[Feature]Page.tsx` (e.g., `DashboardPage.tsx`)

### Components (`components/`)
- **Purpose:** Reusable UI building blocks
- **Organization:** Grouped by feature/domain
  - `components/common/` - Shared UI primitives (TextInput, Button, Toast)
  - `components/dashboard/` - Dashboard-specific components
  - `components/checkout/` - Checkout flow components
  - `components/admin/` - Admin panel components
- **Naming:** PascalCase, descriptive (e.g., `DashboardHeaderCard.tsx`)
- **Exports:** Each folder should have an `index.ts` barrel export

### Services (`services/`)
- **Purpose:** API communication layer
- **Responsibilities:**
  - Make HTTP requests to backend
  - Handle request/response transformation
  - Throw errors for non-OK responses
- **Naming:** `[domain]Service.ts` (e.g., `checkoutService.ts`)
- **Pattern:**
  ```typescript
  export async function createIntroCheckout(
    token: string,
    payload: IntroClassCheckoutRequest
  ): Promise<CheckoutResponse> {
    const response = await fetch(API_ENDPOINTS.CHECKOUT.INTRO, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to create checkout')
    }
    return response.json()
  }
  ```

### Hooks (`hooks/`)
- **Purpose:** Encapsulate data fetching and stateful logic
- **Responsibilities:**
  - Call services to fetch data
  - Manage loading/error states
  - Return data and state to components
- **Naming:** `use[Feature].ts` (e.g., `useIntroEnrollment.ts`)
- **Pattern:**
  ```typescript
  export function useIntroEnrollment(profileId: string | undefined) {
    const [enrollment, setEnrollment] = useState<IntroEnrollment | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      if (!profileId) return
      const load = async () => {
        setLoading(true)
        try {
          const data = await fetchIntroEnrollment(token)
          setEnrollment(data)
        } finally {
          setLoading(false)
        }
      }
      load()
    }, [profileId])

    return { enrollment, loading }
  }
  ```

### Context (`context/`)
- **Purpose:** Global state management
- **Current Contexts:**
  - `ProfileContext` - Authenticated user's member profile
- **Pattern:**
  - Provider wraps app in `App.tsx`
  - Custom hook (`useMemberProfile`) for consuming
  - Memoize context value to prevent unnecessary re-renders

### Constants (`constants/`)
- **Purpose:** Centralized configuration values
- **Key File:** `api.ts` - All API endpoint paths
- **Usage:** Always import from constants, never hardcode URLs

### Types (`types/`)
- **Purpose:** Client-specific TypeScript types
- **Note:** Shared types (DTOs) come from `@cufc/shared` package
- **Client Types:** Form data, UI state, local interfaces

---

## Typing Conventions

### Shared Types (from `@cufc/shared`)
- DTOs for API responses: `MemberProfileDTO`, `IntroClassDTO`, etc.
- Request payloads: `IntroClassCheckoutRequest`, `CheckoutResponse`
- Enums: `MemberStatus`

```typescript
import type { MemberProfileDTO, MemberStatus } from '@cufc/shared'
```

### Client-Specific Types
- Form data interfaces
- Component props interfaces
- UI state types

```typescript
// In component file or types/ folder
interface ProfileFormData {
  displayFirstName: string
  displayLastName: string
  // ...
}

type EnrollmentStep = 'dashboard' | 'profile' | 'class-selection'
```

### Props Interfaces
- Define inline for simple components
- Use `Readonly<>` wrapper for immutability
- Extend HTML attributes when wrapping native elements

```typescript
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

function MyComponent({ prop1, prop2 }: Readonly<MyComponentProps>) { }
```

---

## Component Patterns

### Functional Components
- Always use function declarations or arrow functions
- Use `React.FC` sparingly (prefer explicit return types)

```typescript
// Preferred
export function MyComponent({ prop }: Readonly<Props>) {
  return <div>{prop}</div>
}

// Also acceptable
export const MyComponent: React.FC<Props> = ({ prop }) => {
  return <div>{prop}</div>
}
```

### State Management
- Use `useState` for local component state
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Use Context for truly global state (auth, profile)

### Conditional Rendering
- Early returns for loading/error states
- Ternary for simple conditions
- Logical AND (`&&`) for optional rendering

```typescript
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />

return (
  <div>
    {isAuthenticated ? <Dashboard /> : <LoginPrompt />}
    {showModal && <Modal />}
  </div>
)
```

---

## API Communication

### Always Use API_ENDPOINTS
```typescript
import { API_ENDPOINTS } from '../constants/api'

// Good
fetch(API_ENDPOINTS.MEMBERS.ME)

// Bad - hardcoded
fetch('/api/members/me')
```

### Authentication Pattern
```typescript
const { getAccessTokenSilently } = useAuth0()

const token = await getAccessTokenSilently()
const response = await fetch(endpoint, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
})
```

### Error Handling
- Services throw errors for non-OK responses
- Components catch and display errors
- Use try/catch in async handlers

```typescript
try {
  const data = await myService(token, payload)
  // success handling
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error')
}
```

---

## Styling Conventions

### Tailwind CSS
- Use Tailwind utility classes for all styling
- Custom colors defined in `tailwind.config.js`:
  - `navy` - Primary brand color
  - `medium-pink`, `dark-red` - Accent colors
  - `light-navy` - Light background variant

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`
- Common pattern: `className="text-sm md:text-base"`

### Component Styling
- Cards: `bg-white rounded-xl shadow-md p-6`
- Buttons: `bg-navy text-white font-semibold py-2 px-4 rounded-lg`
- Inputs: `border border-gray-300 rounded-lg px-3 py-2`

---

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Pages | `[Feature]Page.tsx` | `DashboardPage.tsx` |
| Components | `PascalCase.tsx` | `DashboardHeaderCard.tsx` |
| Hooks | `use[Feature].ts` | `useIntroEnrollment.ts` |
| Services | `[domain]Service.ts` | `checkoutService.ts` |
| Types | `[domain].ts` or `[Feature]Types.ts` | `ScheduleTypes.ts` |
| Constants | `lowercase.ts` | `api.ts` |

---

## Import Order

1. React and third-party libraries
2. Internal absolute imports (if configured)
3. Relative imports - contexts/hooks
4. Relative imports - components
5. Relative imports - services/utils
6. Types (use `import type` when possible)

```typescript
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

import { useMemberProfile } from '../context/ProfileContext'
import { useIntroEnrollment } from '../hooks/useIntroEnrollment'

import { DashboardHeaderCard } from '../components/dashboard/DashboardHeaderCard'
import { UnifiedProfileForm } from '../components/profile/UnifiedProfileForm'

import { createDropInCheckout } from '../services/dashboardService'
import { API_ENDPOINTS } from '../constants/api'

import type { MemberProfileDTO } from '@cufc/shared'
```
