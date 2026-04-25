To install dependencies:
```sh
bun install
```

This service expects Bun 1.3.13 in local development, CI, and Docker.

Create a local environment file:
```sh
cp .env.example .env
```

To run:
```sh
bun run dev
```

open http://localhost:3000

To run unit tests:
```sh
bun test tests/unit/*.test.ts
```

or:
```sh
bun run test:unit
```

To run all tests:
```sh
bun test tests/**/*.test.ts
```

To typecheck the service:
```sh
bun run typecheck
```

To run lint:
```sh
bun run lint
```

To auto-fix lint and formatting issues locally:
```sh
bun run lint:fix
```

To verify the production build output:
```sh
bun run build
```

To generate a coverage report:
```sh
bun run test:coverage
```

To generate unit-only coverage with mock-based tests:
```sh
bun run test:coverage:unit
```

To fail when line coverage drops below the CI threshold:
```sh
bun run coverage:check
```

To generate browser-viewable HTML coverage:
```sh
bun run test:coverage:html
```

To generate browser-viewable HTML coverage for unit tests only:
```sh
bun run test:coverage:unit:html
```

To generate and open HTML coverage in the browser on macOS:
```sh
bun run test:coverage:open
```

GitHub Actions also runs mock-based unit coverage and uploads these artifacts on push and pull request changes under `user-service/` or the workflow file itself:
```text
user-service-unit-coverage-html
user-service-unit-coverage-lcov
```

CI also runs `bun run typecheck` and `bun run build` before coverage. Typecheck catches TypeScript contract drift, and build catches packaging or entrypoint regressions that tests may not exercise.

After coverage is generated, CI runs a threshold check against `coverage/lcov.info`. The current gate requires 90% line coverage for the mock-based unit test suite.

On GitHub Actions, the same coverage check also writes a Coverage Summary into the workflow summary so you can see the percentage directly from the run without downloading the artifact first.

Use the HTML artifact when you want to inspect uncovered files and lines in a browser without regenerating coverage locally. This CI workflow is mock-based and does not start PostgreSQL.

If `user-service` is managed as its own Git repository, the same CI workflow also exists at `.github/workflows/ci.yml` inside `user-service` so GitHub Actions can run from that repository root as well.

If `genhtml` is not installed:
```sh
brew install lcov
```

User API endpoints:
```sh
GET    /users
GET    /users/:id
POST   /users
PUT    /users/:id
DELETE /users/:id
```
