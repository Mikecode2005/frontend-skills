import { Form, Link, useFetcher, useLoaderData } from "react-router";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right.js";
import Bot from "lucide-react/dist/esm/icons/bot.js";
import Check from "lucide-react/dist/esm/icons/check.js";
import Layers3 from "lucide-react/dist/esm/icons/layers-3.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Search from "lucide-react/dist/esm/icons/search.js";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";
import Zap from "lucide-react/dist/esm/icons/zap.js";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { filterSkills, skillCategories, skills, type FrontendSkill } from "~/lib/skills";
import type { Agent } from "../../workers/agent-store";
import type { Route } from "./+types/home";

function store(context: Route.LoaderArgs["context"]) {
  return context.cloudflare.env.AGENTS.get(context.cloudflare.env.AGENTS.idFromName("workspace"));
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category") ?? "All";
  const requestedAgent = Number(url.searchParams.get("agent"));
  const agents = await store(context).list();
  const activeAgentId = agents.some((agent) => agent.id === requestedAgent) ? requestedAgent : agents[0]?.id ?? null;
  return { skills: filterSkills(query, category), query, category, agents, activeAgentId, catalogSize: skills.length };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const agents = store(context);
  if (intent === "create-agent") {
    const name = String(form.get("name") ?? "").trim().slice(0, 80);
    const description = String(form.get("description") ?? "").trim().slice(0, 240);
    if (!name) return { ok: false, message: "Agent name is required." };
    await agents.create(name, description);
  } else if (intent === "install") {
    const agentId = Number(form.get("agentId"));
    const skillId = String(form.get("skillId") ?? "");
    if (Number.isInteger(agentId) && skills.some((skill) => skill.id === skillId)) await agents.install(agentId, skillId);
  } else if (intent === "remove") {
    const agentId = Number(form.get("agentId"));
    const skillId = String(form.get("skillId") ?? "");
    if (Number.isInteger(agentId) && skills.some((skill) => skill.id === skillId)) await agents.remove(agentId, skillId);
  }
  return { ok: true };
}

export function meta() {
  return [{ title: "Frontend Skills · Agent-ready frontend craft" }, { name: "description", content: "Discover, inspect, and add focused frontend skills to your agents." }];
}

function SkillCard({ skill, activeAgentId, installed }: { skill: FrontendSkill; activeAgentId: number | null; installed: boolean }) {
  const fetcher = useFetcher();
  return <Card className="group flex h-full flex-col border-slate-200 bg-white transition-shadow hover:shadow-lg hover:shadow-slate-200/60">
    <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><Badge variant="outline" className="text-xs">{skill.category}</Badge><span className="text-xs font-medium text-slate-400">{skill.level}</span></div><CardTitle className="pt-2 text-lg tracking-tight"><Link to={`/skills/${skill.slug}`} className="hover:text-violet-700">{skill.title}</Link></CardTitle><CardDescription className="leading-6">{skill.summary}</CardDescription></CardHeader>
    <CardContent className="mt-auto space-y-4"><div className="flex flex-wrap gap-1.5">{skill.tags.map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500">#{tag}</span>)}</div><div className="flex items-center justify-between gap-3"><Link to={`/skills/${skill.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-violet-700">Inspect skill <ArrowUpRight className="size-3" /></Link>{activeAgentId ? <fetcher.Form method="post"><input type="hidden" name="intent" value={installed ? "remove" : "install"} /><input type="hidden" name="agentId" value={activeAgentId} /><input type="hidden" name="skillId" value={skill.id} /><Button type="submit" size="sm" variant={installed ? "secondary" : "default"}>{installed ? <><Check className="size-3" /> Added</> : <><Plus className="size-3" /> Add to agent</>}</Button></fetcher.Form> : <span className="text-[11px] text-slate-400">Create an agent first</span>}</div></CardContent>
  </Card>;
}

function AgentStack({ agent, allSkills }: { agent: Agent | undefined; allSkills: FrontendSkill[] }) {
  const fetcher = useFetcher();
  if (!agent) return <Card className="border-dashed border-slate-300 bg-slate-50"><CardContent className="flex min-h-48 flex-col items-center justify-center p-6 text-center"><Bot className="mb-3 size-8 text-violet-400" /><p className="font-semibold text-slate-800">No agent stack yet</p><p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">Create an agent, then add focused skills from the catalog.</p></CardContent></Card>;
  const installed = allSkills.filter((skill) => agent.skillIds.includes(skill.id));
  return <Card className="border-violet-200 bg-violet-50/40"><CardHeader><div className="flex items-start justify-between gap-3"><div><Badge className="mb-3 gap-1 bg-violet-700"><Bot className="size-3" /> Active agent</Badge><CardTitle>{agent.name}</CardTitle><CardDescription className="mt-1">{agent.description || "No description yet."}</CardDescription></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-violet-700">{installed.length} skills</span></div></CardHeader><CardContent>{installed.length ? <div className="space-y-2">{installed.map((skill) => <div key={skill.id} className="flex items-center justify-between gap-3 rounded-lg border border-violet-100 bg-white p-3"><div><p className="text-sm font-semibold text-slate-800">{skill.title}</p><p className="mt-0.5 text-xs text-slate-500">{skill.category} · {skill.level}</p></div><fetcher.Form method="post"><input type="hidden" name="intent" value="remove" /><input type="hidden" name="agentId" value={agent.id} /><input type="hidden" name="skillId" value={skill.id} /><Button type="submit" variant="ghost" size="sm" className="text-slate-400 hover:text-red-600">Remove</Button></fetcher.Form></div>)}</div> : <p className="rounded-lg border border-dashed border-violet-200 bg-white/70 p-5 text-center text-sm text-slate-500">Your stack is empty. Add a skill from the catalog.</p>}</CardContent></Card>;
}

export default function Home() {
  const { skills: visibleSkills, query, category, agents, activeAgentId, catalogSize } = useLoaderData<typeof loader>();
  const activeAgent = agents.find((agent) => agent.id === activeAgentId);
  return <main className="min-h-svh bg-[#f7f8fc] text-slate-950"><header className="border-b border-slate-200 bg-white/90"><div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-4 lg:px-8"><Link to="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-violet-200"><Sparkles className="size-4 text-violet-300" /></span><span><span className="block text-sm font-bold tracking-tight">Frontend Skills</span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Agent-ready craft</span></span></Link><nav className="hidden items-center gap-6 text-sm font-semibold text-slate-500 md:flex"><Link to="/" className="text-slate-950">Catalog</Link><Link to="/agents" className="hover:text-slate-950">Agents</Link><a href="#how-it-works" className="hover:text-slate-950">How it works</a></nav><Badge variant="outline" className="hidden gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex"><span className="size-1.5 rounded-full bg-emerald-500" /> Local workspace</Badge></div></header>
    <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-8 lg:px-8 lg:py-12"><section className="grid items-end gap-7 rounded-3xl bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300/40 lg:grid-cols-[1.5fr_1fr] lg:p-12"><div><p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-violet-300"><span className="size-2 rounded-full bg-violet-300" /> A curated frontend skill layer</p><h1 className="max-w-3xl text-4xl font-bold tracking-[-.06em] sm:text-6xl">Give your agent <span className="text-violet-300">better instincts.</span></h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">Focused frontend playbooks for accessibility, UI architecture, performance, testing, and interaction design. Add the right skill to the right agent instead of pasting a giant prompt.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Registry pulse</span><Zap className="size-4 text-amber-300" /></div><div className="mt-6 grid grid-cols-2 gap-4"><div><p className="text-3xl font-bold">{catalogSize}</p><p className="mt-1 text-xs text-slate-400">skill packs</p></div><div><p className="text-3xl font-bold">{agents.length}</p><p className="mt-1 text-xs text-slate-400">your agents</p></div></div><p className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">Each pack ships with a focused prompt, tags, and a review checklist.</p></div></section>
      <section id="how-it-works" className="grid gap-4 md:grid-cols-3"><div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-sm font-bold text-violet-700">01</span><div><h2 className="font-semibold">Create an agent</h2><p className="mt-1 text-sm leading-6 text-slate-500">Give the stack a name and a purpose.</p></div></div><div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-sm font-bold text-amber-700">02</span><div><h2 className="font-semibold">Inspect a skill</h2><p className="mt-1 text-sm leading-6 text-slate-500">See the prompt and checks before adding it.</p></div></div><div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">03</span><div><h2 className="font-semibold">Build a stack</h2><p className="mt-1 text-sm leading-6 text-slate-500">Keep each agent's frontend behavior intentional.</p></div></div></section>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="min-w-0"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-700">Skill catalog</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Choose an instinct</h2></div><span className="text-sm text-slate-400">{visibleSkills.length} shown</span></div><Form method="get" className="mb-5 grid gap-2 sm:grid-cols-[1fr_180px_190px]"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-slate-400" /><Input name="q" defaultValue={query} placeholder="Search skills, tags, or topics" className="h-10 bg-white pl-9" aria-label="Search skills" /></div><Select name="category" defaultValue={category}><SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger><SelectContent>{skillCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select name="agent" defaultValue={activeAgentId ? String(activeAgentId) : "none"}><SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Choose an agent" /></SelectTrigger><SelectContent><SelectItem value="none">No active agent</SelectItem>{agents.map((agent) => <SelectItem key={agent.id} value={String(agent.id)}>{agent.name}</SelectItem>)}</SelectContent></Select></Form>{visibleSkills.length ? <div className="grid gap-4 md:grid-cols-2">{visibleSkills.map((skill) => <SkillCard key={skill.id} skill={skill} activeAgentId={activeAgentId} installed={Boolean(activeAgent?.skillIds.includes(skill.id))} />)}</div> : <Card className="border-dashed"><CardContent className="p-10 text-center text-sm text-slate-500">No skills match those filters.</CardContent></Card>}</div><aside className="space-y-4"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-700">Agent stack</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Your agents</h2></div><Link to="/agents" className="text-xs font-bold text-violet-700 hover:underline">Manage all</Link></div><Card className="border-slate-200 bg-white"><CardContent className="p-5"><Form method="post" className="space-y-3"><input type="hidden" name="intent" value="create-agent" /><div><Label htmlFor="agent-name">New agent</Label><Input id="agent-name" name="name" required placeholder="e.g. UI reviewer" className="mt-2" /></div><div><Label htmlFor="agent-description">Purpose <span className="font-normal text-slate-400">(optional)</span></Label><Input id="agent-description" name="description" placeholder="What should it be great at?" className="mt-2" /></div><Button type="submit" className="w-full"><Plus className="size-4" /> Create agent</Button></Form></CardContent></Card><AgentStack agent={activeAgent} allSkills={skills} /></aside></section><Separator /><footer className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row"><span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-emerald-500" /> Workspace data stays in a Durable Object.</span><span>Frontend Skills · v0.1 registry</span></footer></div></main>;
}
