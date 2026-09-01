import { DurableObject } from "cloudflare:workers";

interface AgentStoreEnv {}

export type Agent = { id: number; name: string; description: string; createdAt: string; skillIds: string[] };

export class AgentStore extends DurableObject<AgentStoreEnv> {
  constructor(ctx: DurableObjectState, env: AgentStoreEnv) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS agent_skills (
        agent_id INTEGER NOT NULL,
        skill_id TEXT NOT NULL,
        added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (agent_id, skill_id),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      );
    `);
  }

  list(): Agent[] {
    const agents = this.ctx.storage.sql.exec<{ id: number; name: string; description: string; createdAt: string }>(
      "SELECT id, name, description, created_at AS createdAt FROM agents ORDER BY id DESC",
    ).toArray();
    return agents.map((agent) => ({ ...agent, skillIds: this.skillIds(agent.id) }));
  }

  create(name: string, description: string): Agent {
    const agent = this.ctx.storage.sql.exec<{ id: number; name: string; description: string; createdAt: string }>(
      "INSERT INTO agents (name, description) VALUES (?, ?) RETURNING id, name, description, created_at AS createdAt",
      name,
      description,
    ).one();
    return { ...agent, skillIds: [] };
  }

  delete(agentId: number): void {
    this.ctx.storage.sql.exec("DELETE FROM agent_skills WHERE agent_id = ?", agentId);
    this.ctx.storage.sql.exec("DELETE FROM agents WHERE id = ?", agentId);
  }

  install(agentId: number, skillId: string): void {
    this.ctx.storage.sql.exec("INSERT OR IGNORE INTO agent_skills (agent_id, skill_id) VALUES (?, ?)", agentId, skillId);
  }

  remove(agentId: number, skillId: string): void {
    this.ctx.storage.sql.exec("DELETE FROM agent_skills WHERE agent_id = ? AND skill_id = ?", agentId, skillId);
  }

  private skillIds(agentId: number): string[] {
    return this.ctx.storage.sql.exec<{ skillId: string }>("SELECT skill_id AS skillId FROM agent_skills WHERE agent_id = ? ORDER BY added_at DESC", agentId).toArray().map((row) => row.skillId);
  }
}
