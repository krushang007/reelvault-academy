---
name: claude-prompt-architect
description: Anthropic 5-part master prompt architecture and XML boundary encapsulation. Use when writing complex prompts for LLMs, agent tools, structured extraction, code generation, system prompts, or when fixing AI hallucination, truncation, and formatting drift.
---

# Anthropic 5-Part Master Prompt Architecture

This skill provides the structure, XML boundary patterns, and negative guardrail techniques needed to craft resilient prompts that eliminate hallucination, output drift, and lazy truncation across Claude, GPT-4, and Gemini.

---

## 1. Why Unstructured Prompts Fail

Unstructured conversational prompts (e.g. *"Act as an expert and build X with good styles and no bugs"*) cause models to:
1. **Hallucinate APIs:** Guess non-existent package methods and flags.
2. **Lose Context Boundaries:** Confuse instructions with user input data (prompt injection vulnerability).
3. **Lazy Truncation:** Output `// ...rest of code here` instead of complete implementations.
4. **Deviate from Schemas:** Mix chat markdown prose into JSON responses.

---

## 2. The 5-Part Master Prompt Structure

Every high-reliability prompt must be deconstructed into 5 XML-tagged sections:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. <role>         Exact persona, seniority & objective       │
├─────────────────────────────────────────────────────────────┤
│ 2. <context>      File lineage, schemas, tokens, background │
├─────────────────────────────────────────────────────────────┤
│ 3. <instructions> Step-by-step sequential execution tasks   │
├─────────────────────────────────────────────────────────────┤
│ 4. <constraints>  Explicit negative rules (what NOT to do)  │
├─────────────────────────────────────────────────────────────┤
│ 5. <output_format>Thinking scratchpad + exact JSON/code schema│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Template & Section Breakdown

```markdown
<role>
You are a Principal Staff Software Engineer specializing in [Domain, Framework, Language].
Your objective is to [Concrete, verifiable deliverable].
</role>

<context>
[Monorepo structure, package versions, design tokens, database schemas, or upstream API contracts]
- Tech Stack: Next.js 15, TypeScript 5.4, TailwindCSS v4
- Relevant Design Tokens: Primary #0B0C10, Accent #6366F1
</context>

<instructions>
Execute the following tasks sequentially:
1. Inspect the existing interface definitions in <context>.
2. Implement the state management logic handling both success and failure transitions.
3. Construct the component markup adhering strictly to the design tokens.
4. Provide comprehensive unit tests covering edge cases (empty states, errors, extreme values).
</instructions>

<constraints>
Strictly adhere to these negative constraints:
- Do NOT use the `any` type under any circumstance; use explicit generics or `unknown`.
- Do NOT omit code or truncate output with comments like "// ...rest of code".
- Do NOT introduce external icon dependencies; strictly use `lucide-react` or inline SVGs.
- Do NOT alter unrelated utility functions or existing file exports.
- Do NOT wrap JSON outputs in conversational chatter (e.g., "Here is your JSON:").
</constraints>

<output_format>
Before providing your final answer, use the `<scratchpad>` to reason through:
1. Potential edge cases and boundary conditions.
2. Type safety and null-check requirements.

Provide your final response enclosed in `<result>`:
```typescript
// Complete, unabridged implementation
```
</output_format>
```

---

## 4. Why XML Boundary Tags are Critical

1. **Prompt Injection Immunity:** User-supplied variables placed inside `<user_query>` or `<document_content>` cannot break out of system instructions.
2. **Attention Anchoring:** Transformers attend to XML tag pairs with high fidelity, preventing section bleed.
3. **Structured Parsing:** Applications can reliably parse out `<result>` or `<scratchpad>` blocks programmatically using simple regex or XML parsers.

---

## 5. Practical Agent Checklist

When authoring or modifying any AI prompt:
- [ ] Is the persona specific (not just "expert", but "Senior Distributed Systems Engineer")?
- [ ] Are all external schemas, interfaces, and sample payloads placed in `<context>`?
- [ ] Are the tasks enumerated in order (1, 2, 3) inside `<instructions>`?
- [ ] Are negative constraints ("Do NOT...") explicitly enumerated inside `<constraints>`?
- [ ] Is an explicit `<scratchpad>` or chain-of-thought section requested prior to the final output?
- [ ] Is the exact output schema or code fencing defined in `<output_format>`?
