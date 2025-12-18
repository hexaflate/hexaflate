# UI Component Library

This directory contains reusable UI components with consistent styling based on design tokens.

## Available Components

### Core Components

| Component | Import | Description |
|-----------|--------|-------------|
| `Button` | `import { Button } from '../styles'` | Buttons with multiple variants and sizes |
| `Badge` | `import { Badge } from '../styles'` | Status badges and labels |
| `Modal` | `import { Modal } from '../styles'` | Modal dialogs with animations |
| `Table` | `import { Table } from '../styles'` | Data tables with loading/selection |
| `Tabs` | `import { Tabs } from '../styles'` | Tab navigation |
| `Spinner` | `import { Spinner } from '../styles'` | Loading spinners |

### Form Components

| Component | Import | Description |
|-----------|--------|-------------|
| `Input` | `import { Input } from '../styles'` | Text inputs with icons and validation |
| `Select` | `import { Select } from '../styles'` | Dropdown selects |
| `FormGroup` | `import { FormGroup } from '../styles'` | Form field wrapper |

### Layout Components

| Component | Import | Description |
|-----------|--------|-------------|
| `Card` | `import { Card } from '../styles'` | Card container with Header/Body/Footer |

### Feedback Components

| Component | Import | Description |
|-----------|--------|-------------|
| `Alert` | `import { Alert } from '../styles'` | Alert messages |
| `StatusBadge` | `import { StatusBadge } from '../styles'` | Predefined status indicators |

---

## Usage Examples

### Button

```tsx
import { Button } from '../styles';

// Variants: primary, secondary, success, danger, warning, ghost, outline, link
<Button variant="primary" size="md">Save</Button>
<Button variant="danger" size="sm" loading>Deleting...</Button>
<Button variant="outline" icon={<Plus />}>Add Item</Button>
<Button variant="ghost" fullWidth>Cancel</Button>
```

### Badge

```tsx
import { Badge } from '../styles';

// Variants: primary, success, danger, warning, info, neutral
<Badge variant="success">Active</Badge>
<Badge variant="danger" dot>Error</Badge>
<Badge variant="warning" size="lg">Pending</Badge>
```

### StatusBadge

```tsx
import { StatusBadge } from '../styles';

// Predefined statuses with Indonesian labels
<StatusBadge status="active" />        // Shows "Aktif"
<StatusBadge status="pending" />       // Shows "Menunggu"
<StatusBadge status="verified" />      // Shows "Terverifikasi"
<StatusBadge status="failed" />        // Shows "Gagal"
<StatusBadge status="processing" />    // Shows "Diproses"
```

### Input

```tsx
import { Input } from '../styles';
import { Search } from 'lucide-react';

<Input 
  label="Email"
  placeholder="Enter email..."
  leftIcon={<Search size={16} />}
/>

<Input 
  label="Password"
  type="password"
  error="Password is required"
/>
```

### Select

```tsx
import { Select } from '../styles';

<Select
  label="Status"
  placeholder="Select status..."
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]}
/>
```

### Card

```tsx
import { Card } from '../styles';

<Card>
  <Card.Header action={<Button size="sm">Edit</Button>}>
    Card Title
  </Card.Header>
  <Card.Body>
    Card content goes here
  </Card.Body>
  <Card.Footer>
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

### Alert

```tsx
import { Alert } from '../styles';

// Variants: info, success, warning, danger
<Alert variant="success" title="Success!">
  Data saved successfully.
</Alert>

<Alert variant="danger" dismissible onDismiss={() => {}}>
  An error occurred.
</Alert>
```

### Modal

```tsx
import { Modal } from '../styles';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
  variant="danger" // For destructive actions
>
  Modal content here
</Modal>
```

### Table

```tsx
import { Table } from '../styles';

<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (val) => <Badge>{val}</Badge> },
  ]}
  data={items}
  loading={isLoading}
  onRowClick={(row) => console.log(row)}
  emptyMessage="No data found"
/>
```

---

## Color Tokens

Use semantic color classes instead of raw colors:

| Purpose | Use This | Not This |
|---------|----------|----------|
| Primary actions | `primary-*` | `indigo-*`, `blue-*` |
| Success states | `success-*` | `green-*` |
| Danger states | `danger-*` | `red-*` |
| Warning states | `warning-*` | `yellow-*` |
| Info states | `info-*` | `blue-*` |
| Neutral/Gray | `neutral-*` | `gray-*` |

### Examples

```tsx
// Background colors
className="bg-primary-100"  // Light primary background
className="bg-success-50"   // Success alert background
className="bg-danger-600"   // Danger button background

// Text colors
className="text-primary-600"  // Primary text
className="text-neutral-500"  // Muted text
className="text-danger-800"   // Error text

// Border colors
className="border-primary-300"  // Primary border
className="border-neutral-200"  // Default border

// Focus states
className="focus:ring-primary-500"  // Primary focus ring
className="focus:ring-danger-500"   // Error focus ring
```

---

## CSS Utility Classes

Available in `index.css`:

### Buttons
- `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`, `.btn-warning`, `.btn-ghost`, `.btn-outline`
- `.btn-xs`, `.btn-sm`, `.btn-md`, `.btn-lg`

### Forms
- `.form-input`, `.form-select`, `.form-checkbox`, `.form-radio`
- `.form-label`, `.form-error`, `.form-hint`
- `.input-field`, `.input-field-error`, `.input-field-success`

### Cards
- `.card`, `.card-header`, `.card-body`, `.card-footer`

### Alerts
- `.alert-info`, `.alert-success`, `.alert-warning`, `.alert-danger`

### Badges
- `.badge-primary`, `.badge-success`, `.badge-danger`, `.badge-warning`, `.badge-info`, `.badge-neutral`

### Tables
- `.table`, `.table-header`, `.table-body`, `.table-row`, `.table-cell`

### Status Dots
- `.status-dot-success`, `.status-dot-danger`, `.status-dot-warning`, `.status-dot-info`
