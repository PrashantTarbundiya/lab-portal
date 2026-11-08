import subprocess
import os

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
DIAGRAMS_DIR = r"D:\IsocodeLabs\lab-portal\diagrams"
DOCS_DIR = r"D:\IsocodeLabs\lab-portal\docs"
DOCS_DIAG_DIR = r"D:\IsocodeLabs\lab-portal\docs\diagrams"

diagrams = [
    ("architecture-diagram.svg", "architecture-diagram.png", 1100, 780),
    ("erd-diagram.svg", "erd-diagram.png", 1100, 820),
    ("workflow-diagram.svg", "workflow-diagram.png", 1100, 800),
    ("ai-pipeline-diagram.svg", "ai-pipeline-diagram.png", 1100, 780),
]

for svg_name, png_name, w, h in diagrams:
    svg_path = os.path.join(DIAGRAMS_DIR, svg_name)
    png_path = os.path.join(DIAGRAMS_DIR, png_name)
    file_url = f"file:///{svg_path.replace(os.sep, '/')}"
    cmd = [
        EDGE,
        "--headless=new",
        f"--screenshot={png_path}",
        f"--window-size={w},{h}",
        file_url
    ]
    print(f"Rendering {png_name}...")
    try:
        subprocess.run(cmd, timeout=10, check=True)
        # copy to docs and docs/diagrams
        import shutil
        shutil.copy(png_path, os.path.join(DOCS_DIR, png_name))
        shutil.copy(png_path, os.path.join(DOCS_DIAG_DIR, png_name))
        print(f"Rendered {png_name} successfully ({os.path.getsize(png_path)} bytes)")
    except Exception as e:
        print(f"Error rendering {png_name}: {e}")

print("All PNGs rendered.")
