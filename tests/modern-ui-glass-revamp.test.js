const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 1. Frosted Glass Card & Pill Utilities (AC-1)
// ---------------------------------------------------------------------------
test("AC-1: globals.css defines .glass-card with backdrop blur, borders, and safe transform inheritance", () => {
  const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf-8");

  assert.match(
    css,
    /\.glass-card\s*\{[^}]*backdrop-filter:\s*blur\(20px\)/,
    ".glass-card must define backdrop-filter: blur(20px)"
  );
  assert.match(
    css,
    /\.glass-card\s*\{[^}]*-webkit-backdrop-filter:\s*blur\(20px\)/,
    ".glass-card must define webkit backdrop filter"
  );
  assert(
    !css.includes("contain: paint"),
    ".glass-card must not contain: paint to prevent clipping popups and tooltips"
  );
  assert(
    !css.includes("transform: translateZ(0)"),
    ".glass-card must not override transform property so dialog centering is preserved"
  );
  assert.match(
    css,
    /\.dark\s+\.glass-card\s*\{[^}]*backdrop-filter:\s*blur\(20px\)/,
    "dark mode glass-card must be defined"
  );
  assert.match(
    css,
    /\.glass-pill\s*\{[^}]*backdrop-filter:\s*blur\(16px\)/,
    ".glass-pill must define backdrop blur"
  );
  assert.match(
    css,
    /\.bg-card\s*\{[^}]*backdrop-filter:\s*blur\(20px\)/,
    ".bg-card override must supply frosted glass to all cards"
  );
});

test("AC-1 Regression: DialogContent retains center positioning with -translate-x-1/2 -translate-y-1/2", () => {
  const dialogFile = fs.readFileSync(path.join(root, "src/components/ui/dialog.tsx"), "utf-8");
  assert.match(
    dialogFile,
    /-translate-x-1\/2\s+-translate-y-1\/2/,
    "DialogContent must define -50% translation centering using valid Tailwind utility classes"
  );
  assert.match(
    dialogFile,
    /left-1\/2\s+top-1\/2/,
    "DialogContent must position top and left at 50% using left-1/2 top-1/2"
  );
});

test("AC-1 Regression: TooltipContent uses TooltipPrimitive.Portal to avoid stacking context clipping", () => {
  const tooltipFile = fs.readFileSync(path.join(root, "src/components/ui/tooltip.tsx"), "utf-8");
  assert.match(
    tooltipFile,
    /<TooltipPrimitive\.Portal>[\s\S]*<TooltipPrimitive\.Content/,
    "TooltipContent must be wrapped in TooltipPrimitive.Portal so cards do not clip hovering popovers"
  );
});

// ---------------------------------------------------------------------------
// 2. Adaptive Ambient Mesh Backdrop & Layout (AC-2)
// ---------------------------------------------------------------------------
test("AC-2: layout.tsx provides adaptive background, ambient orbs, and bottom spacing", () => {
  const layout = fs.readFileSync(path.join(root, "src/app/(main)/layout.tsx"), "utf-8");

  assert.match(
    layout,
    /bg-slate-50\s+dark:bg-slate-950/,
    "layout must use adaptive slate background for light and dark modes"
  );
  assert.match(
    layout,
    /bg-purple-200\/50\s+dark:bg-purple-600\/25\s+blur-3xl/,
    "layout must render ambient mesh gradient orbs"
  );
  assert.match(
    layout,
    /pb-28\s+sm:pb-5/,
    "layout must add bottom padding to prevent floating navigation overlap"
  );
  assert.match(
    layout,
    /<FloatingBottomNav\s*\/>/,
    "layout must render FloatingBottomNav component"
  );
});

// ---------------------------------------------------------------------------
// 3. Floating Brand Header & Logo (AC-3)
// ---------------------------------------------------------------------------
test("AC-3: Navbar.tsx renders floating frosted glass header with Glimo logo and notification bell", () => {
  const navbar = fs.readFileSync(path.join(root, "src/app/(main)/Navbar.tsx"), "utf-8");

  assert.match(
    navbar,
    /sticky\s+top-2\s+z-30[\s\S]*glass-card/,
    "Navbar must be a floating sticky header with glass-card styling"
  );
  assert.match(
    navbar,
    /text-\[\#FF3B69\][\s\S]*Glimo[\s\S]*<\/Link>/,
    "Navbar must display stylized Glimo brand logo in coral pink"
  );
  assert.match(
    navbar,
    /<NotificationsButton[\s\S]*hideLabel/,
    "Navbar must render NotificationsButton with badge"
  );
  assert.match(
    navbar,
    /<SearchField\s*\/>/,
    "Navbar must render SearchField"
  );
  assert.match(
    navbar,
    /<UserButton/,
    "Navbar must render UserButton"
  );
});

// ---------------------------------------------------------------------------
// 4. Stories Tray API Route Logic (AC-4, AC-5)
// ---------------------------------------------------------------------------
test("AC-4: /api/stories route requires authentication and filters visual posts", () => {
  const route = fs.readFileSync(path.join(root, "src/app/api/stories/route.ts"), "utf-8");

  assert.match(
    route,
    /export\s+async\s+function\s+GET/,
    "route.ts must export a GET request handler"
  );
  assert.match(
    route,
    /const\s+\{\s*user\s*\}\s*=\s*await\s+validateRequest\(\)/,
    "route.ts must authenticate user with validateRequest"
  );
  assert.match(
    route,
    /status:\s*401/,
    "route.ts must reject unauthenticated requests with 401"
  );
  assert.match(
    route,
    /createdAt:\s*\{\s*gte:\s*oneDayAgo\s*\}/,
    "route.ts must filter stories to posts within the last 24 hours"
  );
  assert.match(
    route,
    /attachments:\s*\{\s*some:\s*\{\}\s*\}/,
    "route.ts must only include posts with media attachments"
  );
});

test("AC-4: StoriesTray renders your story add trigger and gradient user rings", () => {
  const tray = fs.readFileSync(path.join(root, "src/components/stories/StoriesTray.tsx"), "utf-8");

  assert.match(
    tray,
    /Your\s+story/,
    "StoriesTray must render Your story avatar"
  );
  assert.match(
    tray,
    /bg-\[\#FF3B69\][\s\S]*Plus/,
    "Your story must render plus badge in coral pink"
  );
  assert.match(
    tray,
    /bg-gradient-to-tr\s+from-yellow-400\s+via-pink-500\s+to-purple-600/,
    "Followed story users must be wrapped in colorful gradient border rings"
  );
  assert.match(
    tray,
    /LIVE/,
    "Active live users must display LIVE status badge"
  );
  assert.match(
    tray,
    /<StoryViewerModal/,
    "StoriesTray must integrate StoryViewerModal"
  );
  assert.match(
    tray,
    /<CreatePostModal/,
    "StoriesTray must integrate CreatePostModal"
  );
});

test("AC-5: StoryViewerModal renders progress indicators, media item, and post link", () => {
  const modal = fs.readFileSync(path.join(root, "src/components/stories/StoryViewerModal.tsx"), "utf-8");

  assert.match(
    modal,
    /<Dialog\s+open=\{open\}/,
    "StoryViewerModal must render as a Dialog"
  );
  assert.match(
    modal,
    /user\.stories\.map/,
    "StoryViewerModal must render segmented progress bars for user stories"
  );
  assert.match(
    modal,
    /currentStory\.mediaUrl/,
    "StoryViewerModal must display the current story media URL"
  );
  assert.match(
    modal,
    /View\s+original\s+post/,
    "StoryViewerModal must provide link to view original post"
  );
  assert.match(
    modal,
    /handleNext\(\)/,
    "StoryViewerModal must handle next story navigation"
  );
});

// ---------------------------------------------------------------------------
// 5. Feed Category Pill Tabs (AC-6)
// ---------------------------------------------------------------------------
test("AC-6: page.tsx renders rounded pill tabs with active coral pink indicator", () => {
  const page = fs.readFileSync(path.join(root, "src/app/(main)/page.tsx"), "utf-8");

  assert.match(
    page,
    /<StoriesTray\s*\/>/,
    "Home page must render StoriesTray above feeds"
  );
  assert.match(
    page,
    /<TabsList[^>]*glass-pill\s+rounded-full/,
    "TabsList must use glass-pill rounded-full container"
  );
  assert.match(
    page,
    /data-\[state=active\]:bg-\[\#FF3B69\]/,
    "TabsTrigger must highlight active tab in coral pink #FF3B69"
  );
  assert.match(
    page,
    /<TabsTrigger[\s\S]*value="for-you"[\s\S]*>[\s\S]*For you[\s\S]*<\/TabsTrigger>/,
    "Missing For you tab trigger"
  );
  assert.match(
    page,
    /<TabsTrigger[\s\S]*value="following"[\s\S]*>[\s\S]*Following[\s\S]*<\/TabsTrigger>/,
    "Missing Following tab trigger"
  );
});

// ---------------------------------------------------------------------------
// 6. Post Card Anatomy, Follow Pill, and Media Collage Grid (AC-7)
// ---------------------------------------------------------------------------
test("AC-7: Post.tsx conditionally renders follow pill for non-author vs more options for author", () => {
  const post = fs.readFileSync(path.join(root, "src/components/posts/Post.tsx"), "utf-8");

  assert.match(
    post,
    /post\.user\.id\s*!==\s*user\.id\s*\?\s*\(\s*<FollowButton/,
    "Post must render FollowButton when viewing another user's post"
  );
  assert.match(
    post,
    /<PostMoreButton\s+post=\{post\}/,
    "Post must render PostMoreButton when viewing author's own post"
  );
});

test("AC-7: ImagesCollage layout handles 1, 2, 3, 4 images with required aspect ratios", () => {
  const post = fs.readFileSync(path.join(root, "src/components/posts/Post.tsx"), "utf-8");

  // 1 image aspect ratio
  assert.match(
    post,
    /count\s*===\s*1[^}]*aspect-\[16\/9\]/,
    "Single image must use aspect-[16/9]"
  );

  // 2 images aspect ratio
  assert.match(
    post,
    /count\s*===\s*2[^}]*grid-cols-2\s+gap-2\s+aspect-\[4\/3\]/,
    "Two images must use 2-column grid aspect-[4/3]"
  );

  // 3 images layout
  assert.match(
    post,
    /count\s*===\s*3[^}]*row-span-2/,
    "Three images must use asymmetric left span"
  );

  // 4 images 2x2 square grid
  assert.match(
    post,
    /grid-cols-2\s+grid-rows-2\s+gap-2\s+aspect-square/,
    "Four images must use 2x2 grid aspect-square"
  );

  // Remaining count badge for >4 images
  assert.match(
    post,
    /\+\{remainingCount\}/,
    "Must display +N count overlay for more than 4 images"
  );
});

test("AC-7: Linkify styles hashtags with sky blue colors", () => {
  const linkify = fs.readFileSync(path.join(root, "src/components/Linkify.tsx"), "utf-8");

  assert.match(
    linkify,
    /text-sky-500\s+hover:text-sky-600\s+dark:text-sky-400/,
    "Linkify must highlight hashtags with sky blue palette"
  );
});

test("AC-7: Post card engagement buttons support like badges and web share", () => {
  const post = fs.readFileSync(path.join(root, "src/components/posts/Post.tsx"), "utf-8");

  assert.match(
    post,
    /<LikeButton\s+postId=\{post\.id\}/,
    "Post must render LikeButton"
  );
  assert.match(
    post,
    /<CommentButton\s+post=\{post\}/,
    "Post must render CommentButton"
  );
  assert.match(
    post,
    /<BookmarkButton\s+postId=\{post\.id\}/,
    "Post must render BookmarkButton"
  );
  assert.match(
    post,
    /<ShareButton\s+post=\{post\}/,
    "Post must render ShareButton"
  );

  // ShareButton implementation check
  assert.match(
    post,
    /navigator\.share/,
    "ShareButton must check navigator.share"
  );
  assert.match(
    post,
    /navigator\.clipboard\.writeText/,
    "ShareButton must provide clipboard copy fallback"
  );
});

// ---------------------------------------------------------------------------
// 7. Floating Mobile Bottom Navigation (AC-8)
// ---------------------------------------------------------------------------
test("AC-8: FloatingBottomNav renders 5 fixed slots with active indicator and coral pink button", () => {
  const nav = fs.readFileSync(path.join(root, "src/app/(main)/FloatingBottomNav.tsx"), "utf-8");

  assert.match(
    nav,
    /fixed\s+bottom-4\s+left-1\/2\s+-translate-x-1\/2/,
    "FloatingBottomNav must float horizontally centered above bottom edge"
  );
  assert.match(
    nav,
    /href:\s*"\/"/,
    "Slot 1 must route to Home (/)"
  );
  assert.match(
    nav,
    /href:\s*"\/search"/,
    "Slot 2 must route to Search (/search)"
  );
  assert.match(
    nav,
    /isAction:\s*true/,
    "Slot 3 must be the central action button"
  );
  assert.match(
    nav,
    /href:\s*"\/bookmarks"/,
    "Slot 4 must route to Bookmarks (/bookmarks)"
  );
  assert.match(
    nav,
    /href:\s*"\/messages"/,
    "Slot 5 must route to Messages (/messages)"
  );
  assert.match(
    nav,
    /bg-\[\#FF3B69\]/,
    "Central create action must have coral pink background #FF3B69"
  );
  assert.match(
    nav,
    /setCreatePostOpen\(true\)/,
    "Tapping central create button must open CreatePostModal"
  );
});

// ---------------------------------------------------------------------------
// 8. Frosted Glass Create Post Modal (AC-9)
// ---------------------------------------------------------------------------
test("AC-9: CreatePostModal renders frosted dialog with privacy selector and upload handling", () => {
  const modal = fs.readFileSync(path.join(root, "src/components/posts/editor/CreatePostModal.tsx"), "utf-8");

  assert.match(
    modal,
    /glass-card\s+rounded-3xl/,
    "CreatePostModal must use glass-card rounded-3xl"
  );
  assert.match(
    modal,
    /<DialogTitle[^>]*>[\s\S]*Create Post[\s\S]*<\/DialogTitle>/,
    "CreatePostModal must have Create Post title"
  );
  assert.match(
    modal,
    /setPrivacy/,
    "CreatePostModal must support privacy selection"
  );
  assert.match(
    modal,
    /useMediaUpload\(\)/,
    "CreatePostModal must use useMediaUpload hook"
  );
  assert.match(
    modal,
    /useSubmitPostMutation\(\)/,
    "CreatePostModal must use useSubmitPostMutation hook"
  );
  assert.match(
    modal,
    /bg-\[\#FF3B69\]/,
    "Post submit button must be coral pink #FF3B69"
  );
});

// ---------------------------------------------------------------------------
// 9. Frosted Glass Loading Skeletons (AC-10)
// ---------------------------------------------------------------------------
test("AC-10: PostsLoadingSkeleton renders frosted glass skeleton cards with pill placeholders", () => {
  const skeleton = fs.readFileSync(path.join(root, "src/components/posts/PostsLoadingSkeleton.tsx"), "utf-8");

  assert.match(
    skeleton,
    /glass-card\s+p-4\s+sm:p-5\s+shadow-sm/,
    "PostsLoadingSkeleton must use glass-card styling"
  );
  assert.match(
    skeleton,
    /animate-pulse/,
    "PostsLoadingSkeleton must have pulse animation"
  );
  assert.match(
    skeleton,
    /aspect-\[16\/9\]\s+w-full\s+rounded-2xl/,
    "PostsLoadingSkeleton must include media box placeholder to eliminate layout shift"
  );
});
