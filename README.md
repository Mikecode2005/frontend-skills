# Frontend Skills

Frontend Skills is an agent-ready skill registry for developers who want focused frontend behavior instead of giant, generic prompts.

Create an agent stack, inspect a skill's instruction and review checklist, then add it to the right agent. Skills cover accessibility, UI architecture, performance, testing, and interaction design.

## Current experience

- Browse and search a curated frontend skill catalog.
- Filter skills by category and select an active agent.
- Create agents with a name and purpose.
- Add or remove skill packs from an agent's Durable Object-backed stack.
- Open a dedicated skill detail route with copy-ready agent instructions.
- Review concrete completion checks for every skill.
- Keep workspace state in SQLite-backed Durable Objects.

## Domain model

- **Skill** — versionable, curated instruction pack with tags and checks.
- **Agent** — a named frontend worker with a purpose.
- **Agent stack** — the ordered set of skills assigned to an agent.

The current catalog is source-controlled product content. Agent assignments are workspace state persisted by the `AgentStore` Durable Object. An extended library of 149 focused review packs lives in [`docs/skill-packs`](docs/skill-packs/README.md), ready for future catalog ingestion and versioning.

## Local development

```bash
bun install
bun run dev
```

Useful checks:

```bash
bun run typecheck
bun run build
```

## Routes

- `/` — skill catalog and active agent stack.
- `/agents` — create and inspect agents.
- `/skills/:slug` — inspect a skill and add it to an agent.

## Roadmap

1. Export an agent stack as a portable manifest.
2. Add skill versioning and changelog diffs.
3. Add team-level sharing and review status.
4. Add compatibility metadata for framework, runtime, and task type.
5. Add a CLI for installing stacks into local agent projects.

## License

MIT. Skill prompts and catalog content are original project content.
