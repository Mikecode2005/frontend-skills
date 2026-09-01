import { Form, Link, useLoaderData } from "react-router";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.js";
import Bot from "lucide-react/dist/esm/icons/bot.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { skills } from "~/lib/skills";
import type { Route } from "./+types/agents";

function store(context: Route.LoaderArgs["context"]) {
  return context.cloudflare.env.AGENTS.get(context.cloudflare.env.AGENTS.idFromName("workspace"));
}

export async function loader({ context }: Route.LoaderArgs) {
  return { agents: await store(context).list() };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const description = String(form.get("description") ?? "").trim().slice(0, 240);
  if (name) await store(context).create(name, description);
  return { ok: true };
}

export function meta() {
  return [{ title: "Agents · Frontend Skills" }];
}

export default function Agents() {
  const { agents } = useLoaderData<typeof loader>();
  return <main className="min-h-svh bg-[#f7f8fc] text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link to="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white"><Sparkles className="size-4 text-violet-300" /></span><span className="text-sm font-bold">Frontend Skills</span></Link><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft className="size-4" /> Back to catalog</Link></div></header><div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[320px_1fr]"><section><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-700">Workspace</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Your agents</h1><p className="mt-3 text-sm leading-6 text-slate-500">Create focused stacks for different kinds of frontend work. Skill assignments are saved to this workspace.</p><Card className="mt-7"><CardHeader><CardTitle className="text-base">Create an agent</CardTitle><CardDescription>Start with a job to be done.</CardDescription></CardHeader><CardContent><Form method="post" className="space-y-3"><div><Label htmlFor="name">Name</Label><Input id="name" name="name" required placeholder="Accessibility reviewer" className="mt-2" /></div><div><Label htmlFor="description">Purpose</Label><Input id="description" name="description" placeholder="Checks every new flow" className="mt-2" /></div><Button className="w-full" type="submit"><Plus className="size-4" /> Create agent</Button></Form></CardContent></Card></section><section className="space-y-4">{agents.length ? agents.map((agent) => { const installed = skills.filter((skill) => agent.skillIds.includes(skill.id)); return <Card key={agent.id} className="border-slate-200 bg-white"><CardHeader><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Bot className="size-5" /></span><div><CardTitle>{agent.name}</CardTitle><CardDescription className="mt-1">{agent.description || "No purpose described yet."}</CardDescription></div></div><Badge variant="outline">{installed.length} skills</Badge></div></CardHeader><CardContent><div className="flex flex-wrap gap-2">{installed.length ? installed.map((skill) => <Link key={skill.id} to={`/skills/${skill.slug}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700">{skill.title}</Link>) : <p className="text-sm text-slate-400">No skills yet. Browse the catalog to build this stack.</p>}</div></CardContent></Card>; }) : <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><Bot className="mb-4 size-10 text-violet-300" /><h2 className="font-semibold">Create your first agent</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">A stack is a small, intentional set of frontend instincts. Keep it focused so your agent stays useful.</p></CardContent></Card>}</section></div></main>;
}
