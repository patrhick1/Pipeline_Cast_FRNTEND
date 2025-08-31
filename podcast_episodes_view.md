  Frontend Implementation Plan: Comprehensive Podcast & Episode Views

  This plan outlines the steps and components required to build a user interface for viewing comprehensive details about podcasts and their episodes,
  using the /media/{media_id}/comprehensive and /episodes/{episode_id}/comprehensive endpoints.

  1. Project Goals

   * Provide users with a detailed, read-only view of a specific podcast's information.
   * Allow users to drill down into a specific episode to see its detailed analysis.
   * Create a clean, intuitive, and scannable interface to help users make informed decisions before writing a pitch.
   * Ensure the new views are well-integrated into the existing application flow.

  2. Core Technologies & Dependencies

   * Framework: React
   * Routing: react-router-dom for handling navigation between pages.
   * Data Fetching: axios or the native fetch API for making requests to the backend.
   * UI Components: A component library like Material-UI, Ant Design, or Chakra UI is recommended for consistency and rapid development. If not already
     in use, we can build with standard CSS/CSS-in-JS.
   * State Management: React Hooks (useState, useEffect, useParams). A global state manager (like Redux or Zustand) can be considered if the application
     complexity warrants it.

  3. API Service Layer

  To keep the code organized, all API interactions should be centralized in a dedicated service module (e.g., src/services/api.js).

   * `getComprehensiveMedia(mediaId)`:
       * Makes a GET request to /api/v1/media/{media_id}/comprehensive.
       * Handles API errors gracefully.
       * Returns the JSON data for the podcast.
   * `getComprehensiveEpisode(episodeId)`:
       * Makes a GET request to /api/v1/episodes/{episode_id}/comprehensive.
       * Handles errors.
       * Returns the JSON data for the episode.

  4. Routing Setup

  The main application router (e.g., in App.js) will be updated to include the new views.

    1 import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
    2 import PodcastDetailView from './views/PodcastDetailView';
    3 import EpisodeDetailView from './views/EpisodeDetailView';
    4
    5 // ... other routes
    6 <Switch>
    7   {/* Existing Routes */}
    8   <Route exact path="/podcasts/:mediaId" component={PodcastDetailView} />
    9   <Route exact path="/podcasts/:mediaId/episodes/:episodeId" component={EpisodeDetailView} />
   10   {/* Other Routes */}
   11 </Switch>

  5. Component Breakdown

  ##### View 1: Comprehensive Podcast View (`PodcastDetailView.js`)

  This component will display the data from the /media/{media_id}/comprehensive endpoint.

   * State:
       * podcastData: Stores the fetched API response.
       * isLoading: Boolean to show a loading indicator.
       * error: Stores any API error messages.
   * Logic:
       * Uses the useParams hook from react-router-dom to get the mediaId.
       * Uses the useEffect hook to call getComprehensiveMedia(mediaId) when the component mounts.
   * Sub-components:
       * `PodcastHeader.js`:
           * Props: name, imageUrl, website, hostNames
           * Displays: Podcast cover image, name, a link to the website, and a list of hosts.
       * `PodcastStats.js`:
           * Props: stats (an object containing total_episodes, audience_size, total_reach, publishing_schedule, etc.)
           * Displays: A grid or series of "Stat Cards" for key metrics.
       * `SocialPresence.js`:
           * Props: socialData (the social_presence object from the API)
           * Displays: A list of social media platforms with links and follower/subscriber counts.
       * `ContentAnalysis.js`:
           * Props: themes, topics
           * Displays: Lists or tag clouds of recent themes and topics to give a user a quick sense of the podcast's content.
       * `RecentEpisodesList.js`:
           * Props: episodes (the recent_episodes array)
           * Displays: A list of recent episodes. Each item should show the episode title, publish date, and duration.
           * Interaction: Each episode in the list should be a Link from react-router-dom that navigates to its EpisodeDetailView (e.g.,
             /podcasts/{mediaId}/episodes/{episodeId}).

  ##### View 2: Comprehensive Episode View (`EpisodeDetailView.js`)

  This component will display data from the /episodes/{episode_id}/comprehensive endpoint.

   * State: episodeData, isLoading, error.
   * Logic: Uses useParams to get episodeId and useEffect to fetch the data.
   * Sub-components:
       * `EpisodeHeader.js`:
           * Props: title, publishDate, durationFormatted
           * Displays: The episode's main information.
       * `EpisodePlayer.js`:
           * Props: audioUrl
           * Displays: An HTML5 <audio> player to allow the user to listen to the episode.
       * `EpisodeSummary.js`:
           * Props: summary
           * Displays: The AI-generated summary of the episode.
       * `EpisodeTopics.js`:
           * Props: keywords, themes
           * Displays: Lists or tag clouds of the episode's specific keywords and themes.

  ##### Shared Components

   * `LoadingSpinner.js`: A reusable spinner to indicate data is being fetched.
   * `ErrorMessage.js`: A component to display a user-friendly error message.
   * `StatCard.js`: A card to display a single metric with a label (e.g., "Total Episodes", "150").
   * `Breadcrumbs.js`: Navigation aid, e.g., Home > Podcasts > {Podcast Name} > {Episode Name}.

  6. Implementation Steps

   1. API Layer: Implement the getComprehensiveMedia and getComprehensiveEpisode functions in the API service module.
   2. Routing: Add the new routes for /podcasts/:mediaId and /podcasts/:mediaId/episodes/:episodeId to the main router.
   3. Podcast View:
       * Create the PodcastDetailView.js container component.
       * Implement the data fetching logic inside useEffect.
       * Build the static versions of the sub-components (PodcastHeader, PodcastStats, etc.).
       * Pass the fetched data down to the sub-components as props.
       * Implement the RecentEpisodesList with links to the (yet to be created) episode detail page.
   4. Episode View:
       * Create the EpisodeDetailView.js container component.
       * Implement its data fetching logic.
       * Build its sub-components (EpisodeHeader, EpisodePlayer, etc.).
   5. UX Polish:
       * Add loading states to both views to show while data is being fetched.
       * Add error states to handle cases where the API calls fail.
       * Implement breadcrumbs or "Back" buttons for easy navigation between the podcast list, podcast detail, and episode detail views.
   6. Styling: Apply CSS styling to all new components to match the application's design system.
   7. Review & Refactor: Review the code for clarity, performance, and reusability.