# ADR 0001 – No full fork of Firefox

Status: accepted

## Decision
Klin does not carry the Firefox source tree. The repo holds config, branding, minimal patches and built-in extensions, applied on top of upstream by build scripts.

## Why
Security updates must track Firefox closely; a full fork is too costly to maintain.

## Consequences
- Anything needing privileged access must be a small, documented patch.
- Per-release rebase of patches is part of the release process.
