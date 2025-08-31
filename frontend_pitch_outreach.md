# Frontend Plan: Implementing Pitch & Follow-up Chains (v2)

## 1. High-Level Flow

This document outlines the updated frontend plan for creating and managing pitch sequences with scheduled follow-ups. The process is now a two-step flow:

1.  **Step 1: Create the Pitch Sequence:** The user composes an initial pitch and any number of follow-ups, specifying a delay in days for each follow-up. Submitting this saves the entire sequence as a series of drafts but **does not** send or schedule them.
2.  **Step 2: Send the Initial Pitch:** After creation, the user must explicitly send the initial pitch. This action is the trigger that starts the automated scheduling process on the backend for all subsequent follow-ups.

This separation gives the user full control to review the sequence before it becomes active.

---

## 2. UI and State Management (React)

The component for creating the sequence needs to be updated.

### State Structure

Each draft object in the state array must now include the `delay_days`.

```javascript
const [pitchDrafts, setPitchDrafts] = useState([
  {
    // Initial Pitch (no delay)
    subject: '',
    body: '',
    pitch_type: 'initial',
    delay_days: 0 
  }
]);

const matchId = /* Get this from props or URL */;
```

### UI Components

-   A container that maps over the `pitchDrafts` array to render a form for each pitch.
-   **For each follow-up pitch (index > 0), an additional input field for `delay_days` is required.** (e.g., a number input labeled "Send after [X] days").
-   A "+" button to add a new follow-up draft to the state. The new object should have a default `delay_days` value (e.g., 3).
-   A main "Save Pitch Sequence" button.

---

## 3. Step 1: Creating the Pitch Sequence

When the user clicks "Save Pitch Sequence", the frontend makes a series of sequential API calls to create the drafts and their rules.

The endpoints to use are:
*   `POST /pitches/create-manual`
*   `POST /pitches/generate`

### Submission Flow

The `handleSubmit` function must be updated to include the `follow_up_delay_days`.

```javascript
const handleCreateSequence = async () => {
  let parentPitchGenId = null; // Start with no parent
  const createdPitchGenIds = []; // Store created IDs

  for (const [index, draft] of pitchDrafts.entries()) {
    try {
      const requestBody = {
        match_id: matchId,
        subject_line: draft.subject, // For manual creation
        body_text: draft.body,       // For manual creation
        // pitch_template_id: draft.template_id, // For AI generation
        pitch_type: index === 0 ? 'initial' : `follow_up_${index}`,
        parent_pitch_gen_id: parentPitchGenId,
        follow_up_delay_days: draft.delay_days // Pass the delay
      };

      // Use /create-manual or /generate endpoint
      const response = await api.post('/pitches/create-manual', requestBody);
      
      // Capture the new pitch_gen_id for the next iteration
      parentPitchGenId = response.data.pitch_gen_id; 
      createdPitchGenIds.push(parentPitchGenId);

    } catch (error) {
      console.error(`Failed to create pitch ${index + 1}`, error);
      alert(`Error: Could not create pitch #${index + 1}. Please try again.`);
      return; // Stop the loop
    }
  }

  alert('Pitch sequence created successfully! You can now send the initial pitch.');
  // Store createdPitchGenIds[0] as the ID for the initial pitch to be sent.
};
```

---

## 4. Step 2: Sending the Initial Pitch & Triggering the Sequence

After the sequence is successfully created, the UI should update to show a "Send Initial Pitch" button. This action is what starts the automation.

### Sending Endpoints

The frontend will call one of the sending endpoints with the `pitch_gen_id` of the **initial pitch** (i.e., `createdPitchGenIds[0]` from the previous step).

| Method | Endpoint                        | Description                                      |
| :----- | :------------------------------ | :----------------------------------------------- |
| `POST` | `/send-nylas/{pitch_gen_id}`    | Sends the specified pitch using Nylas.           |
| `POST` | `/send-instantly/{pitch_gen_id}`| Sends the specified pitch using Instantly.ai.    |

### Frontend Responsibility

1.  After creating the sequence, get the `pitch_gen_id` of the initial pitch.
2.  Provide a UI element (e.g., a button) that allows the user to send it.
3.  When the user clicks the button, call the appropriate `send` endpoint.
4.  **That's it.** The frontend's job is done for this sequence. The backend will handle the sending of the initial pitch and the subsequent scheduling of all follow-ups based on the rules defined during creation.

---

## 5. API Endpoint Summary (Updated)

### For Pitch Creation

| Method | Endpoint                        | Description                                                                                             |
| :----- | :------------------------------ | :------------------------------------------------------------------------------------------------------ |
| `POST` | `/pitches/create-manual`        | Creates a single manual pitch draft and saves its follow-up delay.                                      |
| `POST` | `/pitches/generate`             | Creates a single AI-generated pitch draft and saves its follow-up delay.                                |

### For Sending & Triggering the Sequence

| Method | Endpoint                        | Description                                                                                             |
| :----- | :------------------------------ | :------------------------------------------------------------------------------------------------------ |
| `POST` | `/send-nylas/{pitch_gen_id}`    | Sends the pitch with the given ID and triggers the follow-up automation on the backend.                 |
| `POST` | `/send-instantly/{pitch_gen_id}`| Sends the pitch with the given ID and triggers the follow-up automation on the backend.                 |

### For Viewing

| Method | Endpoint                        | Description                                                                                             |
| :----- | :------------------------------ | :------------------------------------------------------------------------------------------------------ |
| `GET`  | `/pitches/match/{match_id}/pitches` | Retrieves the full, ordered sequence of pitches for a match, showing their status (pending, scheduled, sent). |