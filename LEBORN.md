# About this fork

`LeNg` is a [Leborn](https://github.com/leborn-dev) fork of [AngularJS 1.x](https://github.com/angular/angular.js).

## Why this fork exists

AngularJS reached end-of-life in December 2021 and was archived by Google. With over 1.2 million live websites still running it, AngularJS users need migration assistance, not just LTS (which is well covered by HeroDevs and OpenLogic).

## What we are doing

This fork goes through 5 phases:

- **Phase A: Setup and Analysis** - Docker dev environment, codebase overview, dependency status, compatibility issues
- **Phase B: Modern Node.js LTS build compatibility** - Make the codebase run on Modern Node.js LTS
- **Phase C: Build toolchain modernization** - Update EOL dependencies to current versions
- **Phase D: Tests and CI** - Test coverage and matrix CI on GitHub Actions
- **Phase E: AI-native rebirth and v0.1.0 release** - Conversational AI migration tool: AngularJS -> Angular 2+ / React / Vue. Component-by-component AI rewriting suggestions.

## Status

This is an **early-stage** fork. The repository was initialized on 2026-05-02 with a full mirror of the upstream codebase. Modernization and Leborn-specific features are tracked in [Issues](../../issues).

Estimated duration to v0.1.0: **3 to 4 weeks** (with Claude Code-augmented development).

## Original project

- Name: AngularJS 1.x
- Repository: https://github.com/angular/angular.js
- License: MIT

This fork retains all upstream commit history (see `git log`). Original maintainers and contributors are credited in commit metadata. See `NOTICE` for the formal attribution.

## About Leborn

[Leborn](https://github.com/leborn-dev) is an initiative to revive popular but stalled open-source projects with AI-native enhancements designed for the 2026 era of software. Leborn is sponsored and operated by [LLL Sdn Bhd](https://lll.dev) (Malaysia).

The name "Leborn" is from "Reborn" with the R replaced by L (for LLL).

## License

This fork retains the original MIT license. See `LICENSE`.
