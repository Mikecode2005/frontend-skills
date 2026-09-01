import { Form, Link, useLoaderData } from "react-router";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.js";
import CheckCircle2 from "lucide-react/dist/esm/icons/circle-check.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { getSkill, skills } from "~/lib/skills";
import type { Route } from "./+types/skills.$slug";

function store(context: Route.LoaderArgs["context"]) {
  return context.cloudflare.env.AGENTS.get(context.cloudflare.env.AGENTS.idFromName("workspace"));
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const skill = getSkill(params.slug ?? "");
  if (!skill) throw new Response("Skill not found", { status: 404 });
  return { skill, agents: await store(context).list(), catalogSize: skills.length };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const agentId = Number(form.get("agentId"));
  const skillId = String(form.get("skillId") ?? "");
  if (Number.isInteger(agentId) && skills.some((skill) => skill.id === skillId)) await context.cloudflare.env.AGENTS.get(context.cloudflare.env.AGENTS.idFromName("workspace")).install(agentId, skillId);
  return { ok: true };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.skill ? `${data.skill.title} · Frontend Skills` : "Skill · Frontend Skills" }];
}

export default function SkillDetail() {
  const { skill, agents } = useLoaderData<typeof loader>();
  return <main className="min-h-svh bg-[#f7f8fc] text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link to="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white"><Sparkles className="size-4 text-violet-300" /></span><span className="text-sm font-bold">Frontend Skills</span></Link><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft className="size-4" /> Back to catalog</Link></div></header><div className="mx-auto max-w-5xl px-5 py-10"><div className="flex flex-wrap items-center gap-2"><Badge>{skill.category}</Badge><Badge variant="outline">{skill.level}</Badge>{skill.tags.map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500">#{tag}</span>)}</div><h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-.05em] sm:text-6xl">{skill.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-500">{skill.summary}</p><div className="mt-9 grid gap-6 lg:grid-cols-[1.35fr_.85fr]"><Card className="border-slate-200 bg-white"><CardHeader><CardTitle>Agent instruction</CardTitle><CardDescription>Copy-ready behavior for an agent stack.</CardDescription></CardHeader><CardContent><pre className="whitespace-pre-wrap rounded-xl bg-slate-950 p-5 text-sm leading-7 text-slate-200">{skill.prompt}</pre></CardContent></Card><Card className="border-violet-200 bg-violet-50/60"><CardHeader><CardTitle>Add to an agent</CardTitle><CardDescription>Choose where this skill should live.</CardDescription></CardHeader><CardContent>{agents.length ? <Form method="post" className="space-y-4"><input type="hidden" name="skillId" value={skill.id} /><Select name="agentId" defaultValue={String(agents[0].id)}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{agents.map((agent) => <SelectItem key={agent.id} value={String(agent.id)}>{agent.name}</SelectItem>)}</SelectContent></Select><Button type="submit" className="w-full"><Plus className="size-4" /> Add skill</Button></Form> : <div className="text-sm leading-6 text-slate-600">Create an agent in the <Link to="/agents" className="font-semibold text-violet-700 underline">Agents workspace</Link> first.</div>}</CardContent></Card></div><Card className="mt-6 border-slate-200 bg-white"><CardHeader><CardTitle>Review checklist</CardTitle><CardDescription>Use these checks before calling the skill complete.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{skill.checks.map((check) => <div key={check} className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900"><CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />{check}</div>)}</CardContent></Card></div></main>;
}
