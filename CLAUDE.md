# artcheck

공연·전시 캘린더 웹사이트. 미술 전시부터 시작해 뮤지컬 등 다른 장르로 넓힌다. 개인 포트폴리오 프로젝트. 백엔드는 Java/Spring.

## Stack (versions verified 2026-09-24 for chaekcheck; re-check in cycle 00)

- Backend: Java 25 (LTS), Spring Boot 4.1.1 (Spring Framework 7, Hibernate 7.1, Jackson 3), Gradle 9.7.1 via Gradle Wrapper
- DB: PostgreSQL 18, schema migrations with Liquibase
- Not used: Supabase or any other backend-as-a-service. Login, authorization and APIs are implemented in the Spring backend.
- Web: React 19.3.0 + Vite 8.3.1 + TypeScript, Node.js 24 LTS
- Infra: AWS. What runs where is decided per cycle; the reference design in the plan project is a draft, not a decision.

## Directory Layout

- `backend/` — single Spring Boot application (Gradle)
- `web/` — React + Vite (desktop-first, then responsive for tablet/mobile)

## Architecture

- Modular monolith with Spring Modulith. MSA is the future direction (later: Kafka, Kubernetes), so keep module boundaries clean from day one.
- Organize `backend/` by domain module, not by technical layer at the top level.
- Modules talk to each other only through each module's public API or application events. Never access another module's internal packages, entities, or repositories.
- Verify boundaries with a Spring Modulith `ApplicationModules.of(...).verify()` test that runs with `./gradlew test`.
- Keep it simple: do not add Kafka, service discovery, API gateway, or Kubernetes until explicitly asked.

## Backend Rules

- Build and dependencies: Gradle Wrapper only (`./gradlew`). Never use Maven or create `pom.xml`.
- Gradle DSL: Groovy (`build.gradle`, `settings.gradle`). Never create `.gradle.kts` files.
- Group ID and base package: not decided yet. Ask the user when it is first needed (for example, when creating the Gradle project). Never invent one.
- Spring Boot 4 / Jackson 3: use `tools.jackson.*` packages (only `com.fasterxml.jackson.annotation` keeps the old package). Do not write Spring Boot 3 / Jackson 2 style code.
- Commands (run in `backend/`): build `./gradlew build`, test `./gradlew test`, run `./gradlew bootRun`. Build output is `build/`.

## Database Migrations (Liquibase)

- Dependency: `spring-boot-starter-liquibase`. Master changelog: `backend/src/main/resources/db/changelog/db.changelog-master.yaml` (Spring Boot default). The master file only includes other changelog files; it holds no changesets itself.
- Default format is YAML: tables, columns, indexes, constraints, and data changes.
- Objects whose body is SQL anyway — functions, triggers, views — use Liquibase formatted SQL files (`.sql`):
  - First line exactly `--liquibase formatted sql`, then `--changeset <author>:<id>` per changeset.
  - Functions and triggers: add `splitStatements:false` so the body is not split at inner semicolons.
  - Write them as `CREATE OR REPLACE ...` with `runOnChange:true`, so the same file can be edited and re-applied.
- Never edit a changeset that may already have been applied (Liquibase stops with a checksum error). Add a new changeset instead. The only exception is a `runOnChange:true` formatted SQL file.
- Do not let Hibernate create or update the schema; every schema change goes through Liquibase.

## Web Rules

- Desktop layout first, then add responsive breakpoints for tablet and mobile.
- Commands (run in `web/`): `npm install`, dev `npm run dev`, build `npm run build`.

## Tools

- Use the Context7 MCP server to check current docs before writing code for Spring Boot 4, Jackson 3, React 19, Vite 8, or Liquibase; do not rely on older examples.
- Use the Playwright MCP server to check web layouts at desktop, tablet, and mobile widths.

## Working Rules

- Do not hardcode config values or constants as if confirmed; mark unknowns as TODO and ask.
- Run the relevant tests/build before saying a task is done.

## Git Commits

- Before committing, set the repository identity: `git config user.name yujeong` and `git config user.email yujeong9104@gmail.com`.

## Cloud Sessions

- Start a cloud session with this repository only. Adding the plan repository at session start turns off this repository's hooks.
- `.claude/hooks/handoff.sh` runs at session start in the cloud: it puts a read-only copy of the plan repository's default branch at `../artcheck-plan` and prints the current handoff. If it prints "Handoff not loaded", tell the user before implementing anything.
- The cloud VM ships OpenJDK 21 and Node.js 20/21/22. The cloud environment's setup script adds Java 25 at `/usr/lib/jvm/java-25-openjdk-amd64` and Node.js 24 at `/opt/node24`. Before building, prepend `/opt/node24/bin` to `PATH` for web commands, and check `java -version` and `node -v`; if either is not the expected version, tell the user.
- PostgreSQL 18 runs in Docker (`docker compose`); the VM's preinstalled PostgreSQL 16 is not used.

## Current Handoff

Planning and design happen in the separate plan project (`../artcheck-plan`); this project implements them. The current handoff (what to build now) is imported below for local sessions. Do not edit it from here. When the implementation has to differ from the handoff, tell the user; the next cycle in artcheck-plan records it.

@../artcheck-plan/docs/current/handoff.md
