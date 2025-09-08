 ### Frontend Instructions for Stripe Integration (Final)

The backend is ready and handles all the core logic for Stripe billing. Your task is to build the user interface that interacts with the following API endpoints.

**Base URL:** `http://localhost:8000` (or the configured `BACKEND_URL`)

---

#### 1. Feature: Dynamic Plan Selection & Checkout Page

**Goal:** Display the available subscription plans dynamically and allow users to proceed to checkout.

**Instructions:**

1.  Create a pricing page (e.g., `/pricing`).
2.  When the page loads, make a `GET` request to the new **`/billing/plans`** endpoint to fetch a list of all available, active subscription plans.
3.  Dynamically render the plans based on the response. Use the `plan_type`, `amount`, `currency`, and `billing_period` fields to display the plan information. The `amount` is in cents, so you will need to divide by 100 to display it correctly (e.g., 19999 becomes $199.99).
4.  For each plan, add a "Subscribe" or "Upgrade" button.
5.  When a user clicks a subscribe button, make a `POST` request to **`/billing/checkout-session`**.

**Endpoint:** `POST /billing/checkout-session`
**Request Body:**
```json
{
  "plan_type": "paid_basic", // The plan_type from the selected plan
  "billing_period": "monthly", // The billing_period from the selected plan
  "success_url": "http://your-frontend-app.com/billing/success",
  "cancel_url": "http://your-frontend-app.com/pricing"
}
```
**Action:**
The API will respond with a `checkout_url`. You must **redirect the user's browser** to this URL. This will take them to the secure Stripe checkout page.

---

#### 2. Feature: Customer Billing Portal (Managing Subscription)

**Goal:** Allow a logged-in user to view their current subscription and manage it.

**Instructions:**

1.  Create a "Billing" or "Subscription" page within the user's account section.
2.  On this page, first make a `GET` request to **`/billing/subscription`** to fetch the user's current plan details.
3.  Display the `plan_type`, `status`, and payment method details from the response.
4.  Add a "Manage Billing" button. This button should link directly to the backend's portal session endpoint.

**Endpoint:** `GET /billing/portal-session`
**Action:**
This endpoint handles the redirect for you. The simplest way to implement this is with a standard HTML link, not a JavaScript `fetch` call.
```html
<a href="http://localhost:8000/billing/portal-session" target="_blank" rel="noopener noreferrer">
  Manage Billing
</a>
```
Clicking this link will take the user directly to their secure Stripe customer portal.

---

#### 3. Feature: Handling Post-Checkout Redirects

**Goal:** Create pages to handle when a user returns from the Stripe checkout page.

**Instructions:**

1.  Create a **Success Page** at the `success_url` you defined (e.g., `/billing/success`). On this page, you can display a "Thank you" message. It's good practice to call `/billing/subscription` again here to refresh the user's subscription status in your UI.
2.  Ensure the **Cancel Page** (e.g., `/pricing`) works as expected, allowing the user to select a plan again if they choose.

---

#### 4. Feature: Feature Gating

**Goal:** Control access to features based on the user's subscription status.

**Instructions:**

1.  Use the data from the `GET /billing/subscription` endpoint as the "source of truth" for the user's current plan.
2.  Store the user's `plan_type` (e.g., 'free', 'paid_basic') and `status` (e.g., 'active', 'past_due') in your frontend's state management.
3.  In your UI components, wrap premium features in conditional logic.

**Example (React-style pseudo-code):**
```javascript
const { subscription } = useUser(); // Fetches from /billing/subscription

if (subscription.plan_type === 'paid_premium' && subscription.status === 'active') {
  return <PremiumFeature />;
} else {
  return <UpgradeToPremiumPrompt />;
}
```

This completes the backend work and provides a full guide for the frontend implementation.