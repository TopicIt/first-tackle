export const buildInfo = {
  branch: import.meta.env.VITE_GIT_BRANCH ?? 'codex/first-tackle-mobile',
  commit: (import.meta.env.VITE_GIT_SHA ?? 'local').slice(0, 7),
  time: import.meta.env.VITE_BUILD_TIME ?? 'local',
};
