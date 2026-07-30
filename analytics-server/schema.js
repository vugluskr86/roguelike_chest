export const RUN_ID = /^[a-zA-Z0-9_-]{8,100}$/;

export function validRun(data) {
  return !!data && RUN_ID.test(data.runId || '') && Number.isInteger(data.schema);
}
export function validEvents(data) {
  return !!data && Array.isArray(data.events) && data.events.length <= 3000 && data.events.every(validEvent);
}
export function validReplay(id, data) {
  return RUN_ID.test(id || '') && data?.runId === id && validEvents(data);
}

function validEvent(event) {
  return !!event && Number.isInteger(event.n) && event.n > 0 && typeof event.type === 'string' && event.type.length <= 100;
}
