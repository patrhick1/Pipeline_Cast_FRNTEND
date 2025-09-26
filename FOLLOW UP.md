# Follow-Up Pitch Generation API Documentation

## Overview
The follow-up generation system automatically selects appropriate templates based on user role (admin/staff vs client) and generates follow-up pitches in sequence. Admin/staff users get 3rd person templates signed as "Aidrian", while clients get 1st person templates.

---

## Endpoints

### 1. Single Follow-Up Generation
**Endpoint:** `POST /api/pitches/match/{match_id}/generate-followup`

Generates the next follow-up in sequence for a specific match. Automatically determines if it should be follow_up_1, follow_up_2, etc., based on existing pitches.

#### Request
```json
{
  "template_id": "optional_custom_template_id"  // Optional - if not provided, auto-selects based on user role
}
```

#### Response
```json
{
  "pitch_gen_id": 12345,
  "status": "success",
  "message": "Follow-up pitch generated successfully",
  "pitch_type": "follow_up_1",
  "campaign_id": "uuid-here",
  "media_id": 123,
  "generated_at": "2025-09-25T10:30:00Z",
  "pitch_text_preview": "Hi Sarah, I wanted to follow up...",
  "subject_line_preview": "Re: Your recent episode on...",
  "review_task_id": 456
}
```

#### Frontend Implementation Example
```javascript
// Generate next follow-up for a match
async function generateFollowUp(matchId, customTemplateId = null) {
  const payload = {};

  // Only include template_id if user wants to override auto-selection
  if (customTemplateId) {
    payload.template_id = customTemplateId;
  }

  const response = await fetch(`/api/pitches/match/${matchId}/generate-followup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (data.status === 'success') {
    // Navigate to review or display success
    console.log(`Generated ${data.pitch_type} follow-up`);
    return data;
  }
}
```

---

### 2. Bulk Follow-Up Generation
**Endpoint:** `POST /api/pitches/campaign/{campaign_id}/generate-followups-bulk`

Generates follow-ups for multiple matches in a campaign at once. Perfect for generating all follow_up_1 pitches after initial pitches are approved.

#### Query Parameters
- `template_id` (optional): Override template selection for all follow-ups
- `pitch_type_filter` (optional, default: "initial"): Which pitch type to generate follow-ups for
- `limit` (optional, default: 50, max: 100): Maximum number to generate

#### Request
No request body needed - all parameters in query string

#### Response
```json
{
  "status": "completed",
  "message": "Bulk follow-up generation completed. Generated: 25, Failed: 2, Skipped: 10",
  "campaign_id": "uuid-here",
  "pitch_type_processed": "initial",
  "next_pitch_type_generated": "follow_up_1",
  "results": {
    "successful": [
      {
        "match_id": 123,
        "pitch_gen_id": 456,
        "pitch_type": "follow_up_1",
        "parent_pitch_id": 789
      }
    ],
    "failed": [
      {
        "match_id": 124,
        "error": "Failed to generate pitch"
      }
    ],
    "skipped": [
      {
        "match_id": 125,
        "reason": "follow_up_1 already exists"
      }
    ]
  }
}
```

#### Frontend Implementation Examples

##### Generate First Follow-Ups for All Initial Pitches
```javascript
async function generateAllFirstFollowUps(campaignId) {
  const response = await fetch(
    `/api/pitches/campaign/${campaignId}/generate-followups-bulk?pitch_type_filter=initial&limit=50`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );

  const data = await response.json();

  // Show summary to user
  alert(`Generated ${data.results.successful.length} follow-ups successfully`);

  return data;
}
```

##### Generate Second Follow-Ups for All First Follow-Ups
```javascript
async function generateAllSecondFollowUps(campaignId) {
  const response = await fetch(
    `/api/pitches/campaign/${campaignId}/generate-followups-bulk?pitch_type_filter=follow_up_1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );

  const data = await response.json();
  return data;
}
```

---

## Template Selection Logic

### Automatic Template Selection
The system automatically selects the appropriate template based on:

1. **User Role:**
   - Admin/Staff → Admin templates (3rd person, signed "Aidrian")
   - Clients → Regular templates (1st person)

2. **Pitch Type:**
   - `initial` → Best performing initial template
   - `follow_up_1` → Gentle follow-up template
   - `follow_up_2` → Value-add follow-up template
   - `follow_up_3` → Urgent/timely follow-up template
   - `follow_up_4` → Breakup/final follow-up template

### Template Mappings

| Pitch Type | Admin/Staff Template | Client Template |
|------------|---------------------|-----------------|
| initial | admin_pitch_authority_v2 | ai_pitch_authority_v2 |
| follow_up_1 | admin_follow_up_gentle | follow_up_gentle |
| follow_up_2 | admin_follow_up_value | follow_up_value |
| follow_up_3 | admin_follow_up_urgent | follow_up_urgent |
| follow_up_4 | admin_follow_up_breakup | follow_up_breakup |

---

## Frontend Workflow Examples

### Complete Pitch Sequence Generation
Generate initial pitch and all follow-ups before sending:

```javascript
async function generateCompletePitchSequence(matchId) {
  const pitches = [];

  try {
    // 1. Generate initial pitch (if not exists)
    const initial = await generateInitialPitch(matchId);
    pitches.push(initial);

    // 2. Generate follow-up 1
    const followUp1 = await generateFollowUp(matchId);
    pitches.push(followUp1);

    // 3. Generate follow-up 2
    const followUp2 = await generateFollowUp(matchId);
    pitches.push(followUp2);

    // 4. Generate follow-up 3
    const followUp3 = await generateFollowUp(matchId);
    pitches.push(followUp3);

    // 5. Generate breakup (follow-up 4)
    const breakup = await generateFollowUp(matchId);
    pitches.push(breakup);

    return {
      success: true,
      pitches: pitches,
      message: 'Complete pitch sequence generated'
    };

  } catch (error) {
    console.error('Failed to generate complete sequence:', error);
    return {
      success: false,
      pitches: pitches,
      error: error.message
    };
  }
}
```

### Bulk Generation for Campaign Review
Generate follow-ups for all approved pitches in a campaign:

```javascript
async function prepareFollowUpsForReview(campaignId, currentStage = 'initial') {
  const stages = [
    { current: 'initial', next: 'follow_up_1', label: 'First Follow-Ups' },
    { current: 'follow_up_1', next: 'follow_up_2', label: 'Second Follow-Ups' },
    { current: 'follow_up_2', next: 'follow_up_3', label: 'Third Follow-Ups' },
    { current: 'follow_up_3', next: 'follow_up_4', label: 'Final Follow-Ups' }
  ];

  const stage = stages.find(s => s.current === currentStage);

  if (!stage) {
    throw new Error('Invalid stage');
  }

  // Show loading state
  showLoader(`Generating ${stage.label}...`);

  const result = await fetch(
    `/api/pitches/campaign/${campaignId}/generate-followups-bulk?pitch_type_filter=${stage.current}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );

  const data = await result.json();

  // Update UI with results
  updateDashboard({
    generated: data.results.successful.length,
    failed: data.results.failed.length,
    skipped: data.results.skipped.length,
    nextType: stage.next
  });

  return data;
}
```

---

## Error Handling

### Common Error Responses

#### 403 Forbidden - No Access
```json
{
  "detail": "AI pitch generation is available for Premium users. Upgrade to access this feature."
}
```
**Action:** Show upgrade prompt to user

#### 400 Bad Request - No Initial Pitch
```json
{
  "detail": "No initial pitch found for this match. Please generate an initial pitch first."
}
```
**Action:** Redirect to initial pitch generation

#### 400 Bad Request - Follow-Up Already Exists
```json
{
  "detail": "A follow_up_1 pitch already exists for match 123"
}
```
**Action:** Show existing pitch or skip

#### 500 Internal Server Error
```json
{
  "detail": "Failed to generate follow-up: [error details]"
}
```
**Action:** Retry or contact support

---

## Best Practices

### 1. Pre-Generation Strategy
Generate all follow-ups BEFORE sending the initial pitch:
- Allows review of entire sequence
- Ensures consistency in messaging
- Enables bulk approval workflow

### 2. Template Override
Only provide `template_id` when:
- User explicitly selects a different template
- Testing specific templates
- Special campaign requirements

### 3. Batch Processing
For campaigns with many matches:
- Use bulk endpoint with appropriate limits
- Process in batches of 50 or less
- Show progress to user

### 4. Status Tracking
Track generation status in UI:
```javascript
const pitchStatuses = {
  initial: 'generated',
  follow_up_1: 'generated',
  follow_up_2: 'pending',
  follow_up_3: 'pending',
  follow_up_4: 'pending'
};
```

### 5. Review Workflow
Implement review before sending:
1. Generate all pitches
2. Display for review/editing
3. Bulk approve
4. Send initial and schedule follow-ups

---

## Testing

### Test User Roles
```javascript
// Test that admin gets admin templates
const adminUser = { role: 'admin', token: 'admin-token' };
const result = await generateFollowUp(matchId, null, adminUser);
// Check that pitch uses 3rd person and signs as "Aidrian"

// Test that client gets regular templates
const clientUser = { role: 'client', token: 'client-token' };
const result = await generateFollowUp(matchId, null, clientUser);
// Check that pitch uses 1st person
```

### Test Sequence Generation
```javascript
// Ensure follow-ups generate in correct order
const match = { id: 123, hasInitial: true };

// Should generate follow_up_1
const followUp1 = await generateFollowUp(match.id);
assert(followUp1.pitch_type === 'follow_up_1');

// Should generate follow_up_2
const followUp2 = await generateFollowUp(match.id);
assert(followUp2.pitch_type === 'follow_up_2');
```

---

## Notes

- **Rate Limiting:** Bulk generation may be rate-limited. Implement retry logic with exponential backoff.
- **Webhook Support:** Consider implementing webhooks for async generation completion notifications.
- **Caching:** Template selections are deterministic - can be cached client-side for UI preview.
- **Permissions:** Admin/staff can generate for any campaign, clients only for their own.