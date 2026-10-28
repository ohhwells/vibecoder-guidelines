import { join } from 'node:path'

export const rule = 25
export const title = 'Page CRUD plumbing: sitePagesMiddleware and the renderCatchAllPage catch-all route'

export function check(ctx, report) {
  // Without these the editor's duplicate/rename/delete page actions save fine and then 404 on the
  // live site: nothing serves a page that has no folder under src/app.
  const middleware = join(ctx.base, 'src', 'middleware.ts')
  if (!ctx.exists(middleware)) {
    report('error', 'no src/middleware.ts re-exporting `sitePagesMiddleware` from `@ohhwells/bridge/pages`', null, null)
  } else if (!ctx.read(middleware).includes('sitePagesMiddleware')) {
    report('error', 'src/middleware.ts does not run `sitePagesMiddleware`: deleted/renamed pages keep serving', ctx.rel(middleware), null)
  }

  const catchAll = join(ctx.base, 'src', 'app', '[...page]', 'page.tsx')
  if (!ctx.exists(catchAll)) {
    report('error', 'no src/app/[...page]/page.tsx: duplicated and blank pages 404', null, null)
    return
  }
  const src = ctx.read(catchAll)
  if (!src.includes('renderCatchAllPage')) {
    report('error', 'src/app/[...page]/page.tsx does not call `renderCatchAllPage`', ctx.rel(catchAll), null)
  }
  // webpack only builds the context module for a relative prefix; an alias import fails at runtime.
  if (/import\(\s*`@\//.test(src)) {
    report('error', '`renderDuplicate` imports through the `@/` alias; use a relative `../${segment}/page` import', ctx.rel(catchAll), null)
  }
}
