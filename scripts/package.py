"""Package the reproducible source and review evidence without video or tools."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
folders = ("src", "public", "docs", "review", "scripts", "blender", "reference", "dist")
files = {
    "index.html", "vite.config.ts", "package.json", "package-lock.json", "tsconfig.json",
    "README.md", "FINAL_REPORT.md", "NOT_READY.md", ".npmrc", ".gitignore",
}
for folder in folders:
    for item in (root / folder).rglob("*"):
        if item.is_file() and not {".asset-browser","node_modules","__pycache__"}.intersection(item.relative_to(root).parts) and item.suffix.lower() not in {".mp4", ".pyc"}:
            files.add(item.relative_to(root).as_posix())
for item in (root / "preflight").iterdir():
    if item.is_file() and item.suffix in {".json", ".md", ".png", ".jpg", ".mjs"}:
        files.add(item.relative_to(root).as_posix())
archive = root / "build.zip"
with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=6) as bundle:
    for name in sorted(files):
        bundle.write(root / name, name)
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    names = bundle.namelist()
    assert all(not n.lower().endswith(".mp4") and not {".asset-browser","node_modules","preflight/art","snapshots"}.intersection(Path(n).parts) for n in names)
    assert all(n in names for n in (
        "review/MORNING_BRIEF.md", "review/FOR_CLAUDE.md",
        "review/sheet-desktop.png", "review/sheet-mobile.png",
        "review/sheet-moments.png", "src/config.ts", "FINAL_REPORT.md", "blender/heroes.py", "dist/credits/index.html", "docs/ASSET_MANIFEST.json", "public/realm/dragon.glb", "reference/66.jpg"
    ))
print(f"{archive.name}: {len(files)} files, {archive.stat().st_size:,} bytes; CRC and exclusions verified.")


