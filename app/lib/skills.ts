export type SkillCategory = "Accessibility" | "UI Architecture" | "Performance" | "Testing" | "Interaction";
export type SkillLevel = "Foundational" | "Practical" | "Advanced";

export type FrontendSkill = {
  id: string;
  slug: string;
  title: string;
  category: SkillCategory;
  level: SkillLevel;
  summary: string;
  prompt: string;
  tags: string[];
  checks: string[];
};

export const skills: FrontendSkill[] = [
  { id: "skill_accessible_components", slug: "accessible-components", title: "Accessible components", category: "Accessibility", level: "Foundational", summary: "Build interface primitives that work with keyboards, screen readers, and touch.", prompt: "You are an accessibility-minded frontend engineer. Build semantic components with labels, focus states, keyboard behavior, and clear status announcements. Explain the decisions and identify any remaining WCAG risks.", tags: ["wcag", "semantics", "focus"], checks: ["Interactive elements are keyboard reachable", "Names and roles are exposed", "Focus is visible and not trapped accidentally"] },
  { id: "skill_semantic_html", slug: "semantic-html", title: "Semantic HTML", category: "Accessibility", level: "Foundational", summary: "Choose HTML elements that communicate structure before adding ARIA.", prompt: "Review the requested interface and use the most meaningful native HTML elements first. Add ARIA only where native semantics do not express the behavior. Call out heading, landmark, and form-structure decisions.", tags: ["html", "landmarks", "aria"], checks: ["One clear page heading exists", "Landmarks describe page regions", "Buttons and links are not substituted for each other"] },
  { id: "skill_keyboard_navigation", slug: "keyboard-navigation", title: "Keyboard navigation", category: "Accessibility", level: "Practical", summary: "Design predictable tab order, shortcuts, escape paths, and focus restoration.", prompt: "Implement and test keyboard navigation for this flow. Define tab order, activation keys, escape behavior, focus restoration, and any shortcut conflicts. Keep shortcuts discoverable and optional.", tags: ["keyboard", "focus", "shortcuts"], checks: ["Tab order follows visual order", "Escape closes temporary UI", "Focus returns to the invoking control"] },
  { id: "skill_responsive_layouts", slug: "responsive-layouts", title: "Responsive layouts", category: "UI Architecture", level: "Foundational", summary: "Turn a desktop composition into a resilient small-screen experience.", prompt: "Design this layout from the smallest useful viewport upward. Define the layout constraints, breakpoints, content priorities, and touch targets. Avoid hiding essential functionality on mobile.", tags: ["responsive", "mobile", "css"], checks: ["No horizontal overflow at narrow widths", "Touch targets are comfortable", "Content order remains logical"] },
  { id: "skill_design_tokens", slug: "design-tokens", title: "Design tokens", category: "UI Architecture", level: "Practical", summary: "Create a compact, reusable visual language instead of one-off styling.", prompt: "Extract color, type, spacing, radius, elevation, and motion decisions into named tokens. Explain how the tokens support consistency and theming without over-abstracting the component API.", tags: ["tokens", "theming", "css"], checks: ["Repeated values have a clear token", "Contrast is checked for text", "Tokens have semantic names"] },
  { id: "skill_component_boundaries", slug: "component-boundaries", title: "Component boundaries", category: "UI Architecture", level: "Advanced", summary: "Split a growing UI around behavior and ownership, not arbitrary file size.", prompt: "Propose component boundaries for this feature. For each boundary, state its responsibility, owned state, public props, and test seam. Prefer composition over a large prop matrix.", tags: ["architecture", "react", "composition"], checks: ["State has one clear owner", "Public props express intent", "Repeated patterns are composed"] },
  { id: "skill_performance_budget", slug: "performance-budget", title: "Performance budget", category: "Performance", level: "Practical", summary: "Keep interaction, JavaScript, image, and layout costs visible from the start.", prompt: "Set a practical performance budget for this page. Identify the largest likely costs, loading strategy, rendering risks, and a measurement plan. Do not claim an optimization without a metric.", tags: ["web-vitals", "bundle", "loading"], checks: ["Critical content has a loading plan", "Heavy work is deferred when possible", "A measurable budget is written down"] },
  { id: "skill_optimized_images", slug: "optimized-images", title: "Optimized images", category: "Performance", level: "Foundational", summary: "Use responsive formats, dimensions, and loading behavior that respect the page budget.", prompt: "Plan image usage for this interface. Specify dimensions, responsive sources, format choices, alt text, loading priority, and a fallback for slow connections.", tags: ["images", "lcp", "alt-text"], checks: ["Images reserve their layout space", "Decorative images have empty alt", "Below-fold images do not block the first view"] },
  { id: "skill_visual_regression", slug: "visual-regression", title: "Visual regression checks", category: "Testing", level: "Advanced", summary: "Turn important visual contracts into repeatable review points.", prompt: "Define visual regression coverage for this feature. Pick stable viewports and states, identify intentional dynamic regions, and describe what should fail loudly when the visual contract changes.", tags: ["screenshots", "testing", "ui"], checks: ["Critical states have fixtures", "Dynamic content is controlled", "Review failures include a semantic explanation"] },
  { id: "skill_interaction_tests", slug: "interaction-tests", title: "Interaction tests", category: "Testing", level: "Practical", summary: "Test the user journey and the meaningful result instead of implementation details.", prompt: "Write a focused interaction test plan for this flow. Cover the happy path, keyboard path, loading state, failure state, and one boundary case. Assert user-visible outcomes.", tags: ["e2e", "testing", "flows"], checks: ["Tests start from user intent", "Async states are awaited", "Failure behavior is asserted"] },
  { id: "skill_error_states", slug: "error-states", title: "Error states", category: "Interaction", level: "Practical", summary: "Make failed requests, invalid input, and unavailable actions understandable.", prompt: "Design the error model for this feature. Distinguish validation, permission, network, and unexpected failures. Provide recovery actions and preserve user-entered work where safe.", tags: ["errors", "forms", "recovery"], checks: ["Errors name the failed action", "Recovery is possible", "Unexpected failures are observable"] },
  { id: "skill_reduced_motion", slug: "reduced-motion", title: "Reduced motion", category: "Interaction", level: "Foundational", summary: "Make motion expressive without making the interface uncomfortable or unusable.", prompt: "Add motion only where it communicates state or hierarchy. Define a reduced-motion alternative, avoid layout-jumping transitions, and keep essential feedback available without animation.", tags: ["motion", "css", "preferences"], checks: ["prefers-reduced-motion is respected", "Motion is not required to understand state", "Focus and feedback remain visible"] },
];

export const skillCategories = ["All", ...Array.from(new Set(skills.map((skill) => skill.category)))];

export function getSkill(slug: string) {
  return skills.find((skill) => skill.slug === slug);
}

export function filterSkills(query: string, category: string) {
  const normalized = query.trim().toLowerCase();
  return skills.filter((skill) => {
    const matchesCategory = category === "All" || skill.category === category;
    const haystack = [skill.title, skill.summary, skill.category, skill.level, ...skill.tags].join(" ").toLowerCase();
    return matchesCategory && (!normalized || haystack.includes(normalized));
  });
}
