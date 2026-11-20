/**
 * Verification Script: Modern UI Revamp with White Glass Card Styling
 * Exercises and verifies all 10 Acceptance Criteria across components and styles.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

function runVerification() {
  console.log("=== Verifying Modern UI Glass Revamp (Spec 0003) ===\n");
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✘ [FAIL] ${name}: ${err.message}`);
    }
  }

  const root = path.resolve(__dirname, "..");

  // AC-1: Glass card utilities in globals.css
  test("AC-1: globals.css defines .glass-card, .glass-pill, and .bg-card with frosted glass styling", () => {
    const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf-8");
    assert(css.includes(".glass-card"), "Missing .glass-card utility");
    assert(css.includes("backdrop-filter: blur(20px)"), "Missing backdrop-filter blur");
    assert(css.includes("-webkit-backdrop-filter: blur(20px)"), "Missing webkit backdrop blur");
    assert(css.includes(".dark .glass-card"), "Missing dark mode glass-card rule");
    assert(css.includes(".glass-pill"), "Missing .glass-pill utility");
    assert(css.includes(".bg-card"), "Missing .bg-card frosted glass override");
    // Ensure .glass-card does not override transform property so modals and popouts center properly
    assert(!css.includes("transform: translateZ(0)"), "Must not override transform so dialog centering is preserved");
    assert(!css.includes("contain: paint"), "Must not set contain: paint so dialogs and popovers are not clipped");
  });

  // AC-2: Adaptive ambient background in layout.tsx
  test("AC-2: layout.tsx provides adaptive ambient gradient mesh and viewport bottom padding", () => {
    const layout = fs.readFileSync(path.join(root, "src/app/(main)/layout.tsx"), "utf-8");
    assert(layout.includes("bg-slate-50 dark:bg-slate-950"), "Missing adaptive slate background");
    assert(layout.includes("blur-3xl"), "Missing ambient mesh blur orbs");
    assert(layout.includes("pb-28 sm:pb-5"), "Missing feed container padding for floating navigation");
    assert(layout.includes("<FloatingBottomNav />"), "Missing FloatingBottomNav rendering");
  });

  // AC-3: Floating brand header in Navbar.tsx
  test("AC-3: Navbar.tsx renders floating frosted glass header with Glimo logo, search, and notification badge", () => {
    const navbar = fs.readFileSync(path.join(root, "src/app/(main)/Navbar.tsx"), "utf-8");
    assert(navbar.includes("glass-card"), "Navbar must use glass-card");
    assert(navbar.includes("Glimo"), "Navbar must render Glimo stylized brand logo");
    assert(navbar.includes("NotificationsButton"), "Navbar must render NotificationsButton");
    assert(navbar.includes("SearchField"), "Navbar must render SearchField");
    assert(navbar.includes("UserButton"), "Navbar must render UserButton");
  });

  // AC-4: Stories tray and /api/stories route
  test("AC-4: StoriesTray and route.ts provide stories with gradient rings and user story trigger", () => {
    const route = fs.readFileSync(path.join(root, "src/app/api/stories/route.ts"), "utf-8");
    assert(route.includes("validateRequest"), "Stories route must validate session");
    assert(route.includes("oneDayAgo"), "Stories route must check recent 24h posts");
    assert(route.includes("allStoryUsers"), "Stories route must map story items");

    const tray = fs.readFileSync(path.join(root, "src/components/stories/StoriesTray.tsx"), "utf-8");
    assert(tray.includes("Your story"), "StoriesTray must render Your story");
    assert(tray.includes("bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"), "StoriesTray must render gradient rings");
    assert(tray.includes("setCreatePostOpen(true)"), "Tapping your story must open CreatePostModal");
  });

  // AC-5: StoryViewerModal functionality
  test("AC-5: StoryViewerModal displays media, author info, progress bar, and original post link", () => {
    const modal = fs.readFileSync(path.join(root, "src/components/stories/StoryViewerModal.tsx"), "utf-8");
    assert(modal.includes("Dialog"), "StoryViewerModal must use Dialog");
    assert(modal.includes("currentStory.mediaUrl"), "StoryViewerModal must display media");
    assert(modal.includes("View original post"), "StoryViewerModal must link to original post");
    assert(modal.includes("handleNext"), "StoryViewerModal must support next story navigation");
  });

  // AC-6: Feed category pill tabs in page.tsx
  test("AC-6: page.tsx renders rounded category pill tabs for For you and Following with active styling", () => {
    const page = fs.readFileSync(path.join(root, "src/app/(main)/page.tsx"), "utf-8");
    assert(page.includes("<StoriesTray />"), "page.tsx must render StoriesTray");
    assert(page.includes("glass-pill rounded-full"), "page.tsx must use glass-pill on TabsList");
    assert(page.includes("data-[state=active]:bg-[#FF3B69]"), "TabsTrigger must highlight active pill in coral pink");
    assert(page.includes('value="for-you"'), "Missing For you tab trigger");
    assert(page.includes('value="following"'), "Missing Following tab trigger");
  });

  // AC-7: Post card anatomy with follow pill, sky blue hashtags, rounded media collage, and engagement badges
  test("AC-7: Post.tsx implements follow pill, sky blue hashtags, responsive media collage, and badge counters", () => {
    const post = fs.readFileSync(path.join(root, "src/components/posts/Post.tsx"), "utf-8");
    assert(post.includes("FollowButton"), "Post must include FollowButton pill");
    assert(post.includes("post.user.id !== user.id"), "FollowButton only shown for non-author");
    assert(post.includes("PostMoreButton"), "PostMoreButton shown for author");
    assert(post.includes("ImagesCollage"), "Post must implement ImagesCollage");
    assert(post.includes("aspect-[16/9]"), "Single image must use aspect-[16/9]");
    assert(post.includes("grid-cols-2 gap-2 aspect-[4/3]"), "2 images must use 2 cols aspect-[4/3]");
    assert(post.includes("grid-cols-2 grid-rows-2 gap-2 aspect-square"), "4 images must use 2x2 aspect-square");
    assert(post.includes("ShareButton"), "Post must include ShareButton");

    const linkify = fs.readFileSync(path.join(root, "src/components/Linkify.tsx"), "utf-8");
    assert(linkify.includes("text-sky-500 hover:text-sky-600"), "Linkify must use sky blue hashtags");
  });

  // AC-8: Floating mobile bottom navigation with 5 fixed slots
  test("AC-8: FloatingBottomNav.tsx renders 5 fixed slots with active indicators and center pink button", () => {
    const nav = fs.readFileSync(path.join(root, "src/app/(main)/FloatingBottomNav.tsx"), "utf-8");
    assert(nav.includes("fixed bottom-4 left-1/2 -translate-x-1/2"), "Must float above bottom edge");
    assert(nav.includes("glass-pill"), "Must use glass-pill styling");
    assert(nav.includes("href: \"/\""), "Slot 1: Home");
    assert(nav.includes("href: \"/search\""), "Slot 2: Search");
    assert(nav.includes("isAction: true"), "Slot 3: Create post action");
    assert(nav.includes("href: \"/bookmarks\""), "Slot 4: Bookmarks");
    assert(nav.includes("href: \"/messages\""), "Slot 5: Messages");
    assert(nav.includes("bg-[#FF3B69]"), "Center create button must be coral pink");
  });

  // AC-9: CreatePostModal dialog and dialog centering
  test("AC-9: CreatePostModal.tsx renders frosted glass dialog with user info, privacy, and media upload", () => {
    const modal = fs.readFileSync(path.join(root, "src/components/posts/editor/CreatePostModal.tsx"), "utf-8");
    assert(modal.includes("glass-card"), "CreatePostModal must use glass-card");
    assert(modal.includes("DialogTitle"), "CreatePostModal must have accessible title");
    assert(modal.includes("Public"), "CreatePostModal must render privacy selector");
    assert(modal.includes("useMediaUpload"), "CreatePostModal must use media upload");
    assert(modal.includes("useSubmitPostMutation"), "CreatePostModal must submit post");
    assert(modal.includes("bg-[#FF3B69]"), "Post submit button must be coral pink");

    const dialog = fs.readFileSync(path.join(root, "src/components/ui/dialog.tsx"), "utf-8");
    assert(dialog.includes("-translate-x-1/2 -translate-y-1/2"), "DialogContent must use -translate-x-1/2 -translate-y-1/2 for centering");
    assert(dialog.includes("left-1/2 top-1/2"), "DialogContent must use left-1/2 top-1/2");

    const tooltip = fs.readFileSync(path.join(root, "src/components/ui/tooltip.tsx"), "utf-8");
    assert(tooltip.includes("TooltipPrimitive.Portal"), "TooltipContent must use TooltipPrimitive.Portal");
  });

  // AC-10: Frosted glass loading skeleton
  test("AC-10: PostsLoadingSkeleton.tsx renders shimmering glass skeleton cards with pill placeholders", () => {
    const skeleton = fs.readFileSync(path.join(root, "src/components/posts/PostsLoadingSkeleton.tsx"), "utf-8");
    assert(skeleton.includes("glass-card"), "Skeleton must use glass-card");
    assert(skeleton.includes("animate-pulse"), "Skeleton must pulse");
    assert(skeleton.includes("rounded-3xl"), "Skeleton must match 24px/3xl card geometry");
    assert(skeleton.includes("aspect-[16/9]"), "Skeleton must have media placeholder to prevent layout shift");
  });

  console.log(`\n=== Verification Complete: ${passed}/${total} criteria passed ===`);
  if (passed !== total) {
    process.exit(1);
  }
}

runVerification();
