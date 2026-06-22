# Analytics And Recommendation Implementation

This repo now includes a first implementation slice for the analytics and teacher-capability recommendation plan.

## Implemented modules

- `src/shared/analytics.js`
  - Local event store for page views, scene events, portrait events, and recommendation exposure/click events
  - Shared helpers: `trackEvent`, `trackPageView`, `trackRecommendationEvent`
- `src/shared/recommendationEngine.js`
  - Explainable rule-based recommendation engine for teacher portrait
  - Generates:
    - action recommendations
    - scene recommendations
    - concrete resource-library course recommendations
- `src/scene/store.js`
  - Emits analytics when scene/template records are created, updated, or deleted
- `src/App.jsx`
  - Tracks page views
  - Tracks scene opens from the space catalog
  - Supports navigation from teacher portrait recommendations into spaces
- `src/messages/luckyPushStore.js`
  - Builds periodic `Lucky` intelligent push messages from teacher portrait and space data
  - Stores the Lucky conversation locally and emits push delivery analytics
- `src/messages/MessagesModule.jsx`
  - Merges the Lucky intelligent agent conversation into the message center
  - Tracks Lucky conversation opens and recommendation exposure/click behavior
- `src/teacherPortrait/TeacherPortraitModule.jsx`
  - Loads scenes together with portrait data
  - Loads resource-library course materials together with portrait data
  - Builds teacher-capability recommendations
  - Tracks portrait views, refreshes, recommendation exposures, and recommendation clicks
- `src/resourceLib/resourceLibStore.js`
  - Provides seeded AI general-course resources used by the recommendation engine

## Event names in this slice

- `page_view`
- `space_scene_open`
- `space_scene_create_success`
- `space_scene_update_success`
- `space_scene_delete_success`
- `space_template_create_success`
- `space_template_update_success`
- `space_template_delete_success`
- `teacher_portrait_view`
- `teacher_portrait_refresh`
- `teacher_growth_action_recommend`
- `recommend_expose`
- `recommend_click`
- `recommend_push_delivered`
- `message_lucky_open`
- `space_join_apply`

## Recommendation strategy

Current strategy id: `teacher_capability_rule_v1`

The engine uses:

- teacher role and target level
- portrait risk level
- portrait focus items
- evidence gap count
- review progression state
- scene type and template recommendation metadata
- resource-library courseware, teaching plans, teaching aids, rubric files, videos, and other course assets

Reason codes currently emitted:

- `ABILITY_GAP_MATCH`
- `EVIDENCE_SHORTAGE`
- `CURRENT_REVIEW_STAGE`
- `ROLE_LEVEL_MATCH`
- `ROLE_GROWTH_MATCH`
- `SPACE_RECOMMENDATION_ENABLED`
- `HIGH_QUALITY_SPACE`
- `RECENT_BEHAVIOR_MATCH`
- `REVIEW_READY`

## Current storage model

Analytics events are stored locally in browser storage for this prototype:

- `gr.analytics.events.v1`
- `gr.analytics.session.v1`
- `gr.analytics.context.v1`
- `gr.messages.lucky.v1`

The Lucky message store now includes a schema refresh path so older cached pushes are upgraded automatically when recommendation content changes, including new resource-library recommendations.

This is intentionally lightweight and should be replaced or mirrored by a backend/event pipeline in a production rollout.
