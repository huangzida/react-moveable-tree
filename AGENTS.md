<!-- skill-ninja-START -->
## Agent Skills

> **IMPORTANT**: Prefer skill-led reasoning over pre-training-led reasoning.
> Read the relevant SKILL.md before working on tasks covered by these skills.

### Skills

| Skill | Description |
|-------|-------------|
| [brainstorming](.github/skills/brainstorming/SKILL.md) | You MUST use this before any creative work - creating features, building components, adding functionali... \| Help turn ideas into fully formed designs and specs through natural collaborative dialogue. |
| [dispatching-parallel-agents](.github/skills/dispatching-parallel-agents/SKILL.md) | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dep... \| ```dot; 3+ test files failing with different root causes; Multiple subsystems broken independentl... |
| [executing-plans](.github/skills/executing-plans/SKILL.md) | Use when you have a written implementation plan to execute in a separate session with review checkpoints |
| [finishing-a-development-branch](.github/skills/finishing-a-development-branch/SKILL.md) | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup |
| [frontend-design](.github/skills/frontend-design/SKILL.md) | Create distinctive, production-grade frontend interfaces with high design quality. |
| [receiving-code-review](.github/skills/receiving-code-review/SKILL.md) | Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performat... |
| [requesting-code-review](.github/skills/requesting-code-review/SKILL.md) | Use when completing tasks, implementing major features, or before merging to verify work meets re... \| Dispatch superpowers:code-reviewer subagent to catch issues before they cascade. The reviewer get... |
| [subagent-driven-development](.github/skills/subagent-driven-development/SKILL.md) | Use when executing implementation plans with independent tasks in the current session \| ```dot; Same session (no context switch); Fresh subagent per task (no context pollution); Two-stage review af... |
| [systematic-debugging](.github/skills/systematic-debugging/SKILL.md) | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes \| Use for ANY technical issue:; Test failures; Bugs in production; Unexpected behavior; Performance probl... |
| [test-driven-development](.github/skills/test-driven-development/SKILL.md) | Use when implementing any feature or bugfix, before writing implementation code \| **Always:**; New features; Bug fixes; Refactoring; Behavior changes; Throwaway prototypes; Generated code; Configur... |
| [using-git-worktrees](.github/skills/using-git-worktrees/SKILL.md) | Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verifi... |
| [using-superpowers](.github/skills/using-superpowers/SKILL.md) | Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions |
| [verification-before-completion](.github/skills/verification-before-completion/SKILL.md) | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evide... |
| [writing-plans](.github/skills/writing-plans/SKILL.md) | Use when you have a spec or requirements for a multi-step task, before touching code |
| [writing-skills](.github/skills/writing-skills/SKILL.md) | Use when creating new skills, editing existing skills, or verifying skills work before deployment \| [Small inline flowchart IF decision non-obvious] |

<!-- skill-ninja-END -->
