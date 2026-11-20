"""Downsample the licensed source panorama offline, preserving its equirectangular projection."""
import bpy
from pathlib import Path
root = Path(__file__).resolve().parents[1]
image = bpy.data.images.load(str(root / "preflight/art/dusk.exr"))
image.scale(2048, 1024)
scene = bpy.context.scene
scene.view_settings.view_transform = "Filmic"
scene.view_settings.exposure = -0.65
scene.render.image_settings.file_format = "PNG"
image.save_render(str(root / "preflight/art/dusk.png"), scene=scene)
