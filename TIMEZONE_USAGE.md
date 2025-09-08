# Timezone Conversion Usage Guide

## Overview
All dates/times are stored in UTC in the backend. The frontend automatically converts between UTC and the user's local timezone.

## Available Functions

### Import the utilities:
```typescript
import { 
  utcToLocal, 
  localToUTC, 
  formatUTCToLocal, 
  formatUTCDateOnly,
  formatUTCTimeOnly,
  getRelativeTime,
  datetimeLocalToUTC,
  utcToDatetimeLocal 
} from '@/lib/timezone';
```

## Common Use Cases

### 1. Displaying Dates from Backend
```typescript
// Backend returns: "2024-01-15T14:30:00Z"
const meetingDate = data.meeting_date;

// Display in user's timezone with full date/time
<span>{formatUTCToLocal(meetingDate)}</span>
// Output: "January 15, 2024, 9:30 AM EST"

// Display date only
<span>{formatUTCDateOnly(meetingDate)}</span>
// Output: "January 15, 2024"

// Display relative time
<span>{getRelativeTime(meetingDate)}</span>
// Output: "2 hours ago" or "in 3 days"
```

### 2. Handling Date Inputs
```typescript
// For date input (type="date")
const [dateValue, setDateValue] = useState('');

// When loading from backend:
useEffect(() => {
  if (data.scheduled_date) {
    const localDate = utcToLocal(data.scheduled_date);
    setDateValue(localDate?.toISOString().split('T')[0] || '');
  }
}, [data]);

// When sending to backend:
const handleSubmit = () => {
  const utcDate = dateValue ? localToUTC(new Date(dateValue + 'T00:00:00')) : null;
  
  await apiRequest('POST', '/endpoint', {
    scheduled_date: utcDate
  });
};
```

### 3. Handling DateTime Inputs
```typescript
// For datetime-local input
const [dateTimeValue, setDateTimeValue] = useState('');

// When loading from backend:
useEffect(() => {
  if (data.appointment_time) {
    setDateTimeValue(utcToDatetimeLocal(data.appointment_time));
  }
}, [data]);

// When sending to backend:
const handleSubmit = () => {
  const utcDateTime = datetimeLocalToUTC(dateTimeValue);
  
  await apiRequest('POST', '/endpoint', {
    appointment_time: utcDateTime
  });
};
```

### 4. Custom Date Formatting
```typescript
// Custom format options
const customFormat = formatUTCToLocal(data.created_at, {
  weekday: 'long',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
// Output: "Monday, Jan 15, 2024, 09:30 AM"
```

## Components Already Updated

1. **Billing.tsx** - Uses `formatUTCDateOnly` for subscription dates
2. **PlacementEditDialog.tsx** - Converts dates when loading and saving

## Migration Checklist

When updating a component to use timezone conversion:

- [ ] Import necessary timezone utilities
- [ ] Replace `new Date(dateString).toLocaleDateString()` with `formatUTCDateOnly(dateString)`
- [ ] Replace `new Date(dateString).toLocaleString()` with `formatUTCToLocal(dateString)`
- [ ] For date inputs, convert UTC to local when loading
- [ ] For date inputs, convert local to UTC when saving
- [ ] Test with different timezones using browser dev tools

## Testing Tips

1. **Change browser timezone:**
   - Chrome DevTools → Sensors → Location → Override timezone
   - Test with different timezones (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")

2. **Verify conversions:**
   - Check that displayed times match user's local timezone
   - Verify that saved dates in database are in UTC
   - Test edge cases like daylight saving time transitions