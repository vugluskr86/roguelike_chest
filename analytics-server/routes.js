/** API route matchers shared by the HTTP server and integration tests. */
const eventsPath = /^\/api\/v1\/runs\/([\w-]+)\/events$/;
const replayPath = /^\/api\/v1\/runs\/([\w-]+)\/replay$/;

export const routeRunEvents = (pathname) => pathname.match(eventsPath)?.[1] || null;
export const routeRunReplay = (pathname) => pathname.match(replayPath)?.[1] || null;
