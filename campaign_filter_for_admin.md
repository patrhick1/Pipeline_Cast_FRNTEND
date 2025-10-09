# Plan: Filter Campaigns for Admins and Staff

This document outlines the plan to modify the frontend to only show campaigns and related data for clients with a "paid_premium" subscription when an admin or staff member is logged in.

## General Approach

The core of this plan is to fetch the list of campaigns with their subscription plans. When the logged-in user is an admin or staff, we will use this list to filter what is displayed on various pages.

## Page-Specific Implementation

### 1. Pitch Outreach Page (`client/src/pages/PitchOutreach.tsx`)

**Goal:** Filter the campaign selection dropdown to only show "paid_premium" campaigns.

**Steps:**

1.  **Fetch Campaigns with Subscriptions:** In `PitchOutreach.tsx`, locate the `useQuery` hook that fetches the list of campaigns. It should be modified to call the new `GET /campaigns/with-subscriptions` endpoint.
2.  **Check User Role:** Use the `useAuth` hook to check if the logged-in user's role is `admin` or `staff`.
3.  **Filter Data:** If the user is an admin or staff, filter the array of campaigns returned from the API to only include campaigns where `subscription_plan` is equal to `'paid_premium'`.
4.  **Update Campaign Selector:** Pass the filtered list of campaigns to the `CampaignSelector` component.

### 2. Match Approvals Page (`client/src/pages/Approvals.tsx`)

**Goal:** Only show match approvals that belong to "paid_premium" campaigns.

**Steps:**

1.  **Fetch Premium Campaigns:** On the `Approvals.tsx` page, make a call to `GET /campaigns/with-subscriptions?subscription_plan=paid_premium` to get the list of all premium campaigns.
2.  **Fetch All Approvals:** Make the existing call to fetch all match approvals.
3.  **Filter Approvals:** Filter the list of approvals to only include items where the `campaign_id` is present in the list of premium campaigns fetched in step 1.
4.  **Display Filtered Data:** Render the filtered list of match approvals.

### 3. Shared Inbox Page (`client/src/pages/AdminInbox.tsx`)

**Goal:** Only show inbox threads that belong to "paid_premium" campaigns.

**Steps:**

1.  **Fetch Premium Campaigns:** Similar to the approvals page, call `GET /campaigns/with-subscriptions?subscription_plan=paid_premium` to get the list of premium campaigns.
2.  **Fetch All Inbox Data:** Make the existing call to fetch all inbox data.
3.  **Filter Inbox Data:** Filter the inbox data to only include items where the `campaign_id` is present in the list of premium campaigns.
4.  **Display Filtered Data:** Render the filtered inbox data.

## Backend Recommendation

For the Match Approvals and Shared Inbox pages, the most efficient solution would be to add a `subscription_plan` query parameter to their respective backend endpoints. This would allow the frontend to fetch only the necessary data. If this is not immediately possible, the frontend filtering approach described above will work as an interim solution.
