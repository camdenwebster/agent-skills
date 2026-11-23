#!/bin/sh
set -eu
fixture_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cache_root="$fixture_dir/.build/eval-runtime"
mkdir -p "$cache_root/clang" "$cache_root/modules" "$cache_root/swiftpm"
# Only SwiftPM's nested subprocess sandbox is disabled; the outer agent sandbox remains.
CLANG_MODULE_CACHE_PATH="$cache_root/clang" \
SWIFTPM_MODULECACHE_OVERRIDE="$cache_root/modules" \
exec swift test --disable-sandbox --package-path "$fixture_dir" \
  --scratch-path "$cache_root/build" --cache-path "$cache_root/swiftpm" "$@"
