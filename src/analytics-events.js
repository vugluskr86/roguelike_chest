/** Shared event names; keep analytics producers from inventing incompatible strings. */
export const ANALYTICS_EVENT = Object.freeze({
  RUN_STARTED: 'run_started',
  RUN_FINISHED: 'run_finished',
  FLOOR_STARTED: 'floor_started',
  ROOM_ENTERED: 'room_entered',
  MOVE: 'move',
  MOVE_REJECTED: 'move_rejected',
  MOVE_CONFIRMATION: 'move_confirmation_requested',
  CAPTURE: 'capture',
  PASS: 'pass',
  ROTATE: 'rotate',
  SWITCH_FORM: 'switch_form',
  RELIC_SELECTED: 'relic_selected',
  CURSE_SELECTED: 'curse_selected',
  TUTORIAL_STEP: 'tutorial_step_started',
  TUTORIAL_ACTION: 'tutorial_action',
  CLIENT_ACTION: 'client_action',
  BROWSER_ERROR: 'browser_error',
  BROWSER_REJECTION: 'browser_unhandled_rejection',
  SNAPSHOT: 'snapshot',
});

export const isAnalyticsEvent = (value) => Object.values(ANALYTICS_EVENT).includes(value);
