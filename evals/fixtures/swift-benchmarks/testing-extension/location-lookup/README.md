# Swift Testing task fixture

Review dependency isolation and parameterized coverage. Report only defects supported by the supplied source; preserve valid test coverage.

Use `./run-tests.sh` from this directory. The `swiftpm-isolated-v1` wrapper uses writable caches and build output below this fixture's `.build` and disables only SwiftPM's nested subprocess sandbox; it does not disable the outer agent sandbox or alter home configuration. No dependencies or network are required. Keep the public product API and behavior unchanged. Do not skip/disable tests, reduce parameterized inputs, add sleeps or locks to mask failures, or disable test parallelization globally. Use Swift Testing, with Swift tools/language version 6.0.

Write `RESULT.md` with the conclusion, actual edits (or why none are justified), exact verification command and observed completion/failure evidence. Distinguish test-function counts from parameterized argument invocations; the `PARAMETER_TITLE` lines, where present, identify three argument invocations rather than three extra test functions. Do not claim a pass from an exit code or the XCTest zero-test preamble alone. Ground API-semantic claims in authoritative documentation when available; explicitly state source/verification limits when it is not available. A single observed event ordering does not establish an API guarantee.
