"""Generate the original festival sculptures. Run with Blender --background --factory-startup."""
import bpy, math, random
from mathutils import Vector
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'preflight'/'art'/'raw'
out.mkdir(parents=True,exist_ok=True)
random.seed(41)
def mat(name,color,metal=0,rough=.4,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 b=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 b.inputs['Base Color'].default_value=(*color,1);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough
 if emit:b.inputs['Emission'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=emit
 return m
iron=mat('Blue iron',(.065,.091,.11),.75);gold=mat('Hammered electrum',(.86,.47,.095),.8,.26);rim=mat('Burnished edges',(.43,.23,.07),.7)
wood=mat('Smoked oak',(.16,.074,.03));glass=mat('Volcanic glass',(.032,.045,.062),.71,.22);scale=mat('Basalt scales',(.073,.104,.107),.38);horn=mat('Ivory horn',(.51,.40,.25),.24);eye=mat('Ember iris',(1,.21,.014),0,.25,4);mouth=mat('Mouth cavity',(.13,.018,.013))
def reset():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def finish(o,m):
 o.data.materials.append(m);return o
def box(loc,size,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,m)
def mesh(name,verts,faces,m):
 d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);return finish(o,m)
def tube(points,radii,m,n=9):
 vs=[];fs=[]
 for i,(pt,r) in enumerate(zip(points,radii)):
  axis=(Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])).normalized();u=axis.cross(Vector((0,1,0)))
  if u.length<.01:u=axis.cross(Vector((1,0,0)))
  u.normalize();v=axis.cross(u).normalized()
  for j in range(n):
   a=j*math.tau/n;vs.append(Vector(pt)+r*(math.cos(a)*u+math.sin(a)*v))
   if i:fs.append(((i-1)*n+j,(i-1)*n+(j+1)%n,i*n+(j+1)%n,i*n+j))
 fs.extend([tuple(reversed(range(n))),tuple(range(len(vs)-n,len(vs)))]);return mesh('Cast detail',vs,fs,m)
def orb(p,s,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=p);o=bpy.context.object;o.scale=s;bpy.ops.object.shade_smooth();return finish(o,m)
def join(name,parts=None):
 objs=parts or list(bpy.context.scene.objects);bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;return o
def save(name):
 bpy.ops.export_scene.gltf(filepath=str(out/(name+'.glb')),export_format='GLB',export_animations=False)
reset()
for i in range(9):
 x=(i+.5)*.32;h=4.7+1.3*math.sqrt(max(0,1-(1-x/2.88)**2));box((x,0,h/2),(.307,.31,h),wood)
for z in [.45,2.3,4.2]:
 box((1.44,-.19,z),(2.88,.12,.17),iron)
 for j in range(8):orb((.18+j*.36,-.27,z),(.047,.027,.047),rim)
for x in [.13,2.75]:box((x,-.205,2.3),(.1,.13,4.55),iron)
for base in [.72,2.58]:
 for sign in [-1,1]:
  tube([(1.43,-.232,base+.22),(1.43+sign*.48,-.24,base+.72),(1.43+sign*1.18,-.232,base+1.21)],[.065,.054,.033],iron,6)
for j in range(19):
 angle=j*math.tau/18
 if j<18:
  b=(j+1)*math.tau/18
  tube([(2.43+.115*math.cos(angle),-.31,2.03+.17*math.sin(angle)),(2.43+.115*math.cos(b),-.31,2.03+.17*math.sin(b))],[.027,.027],rim,6)
orb((2.43,-.30,2.23),(.07,.063,.075),rim)
join('GateLeaf');save('gate')
reset();box((0,0,.55),(2.25,1.75,.85),glass);tube([(0,.54,.65),(0,.58,1.35),(0,.66,2.15),(0,.8,3.2)],[1.0,.94,.8,.29],glass,7)
for i in range(19):
 x=(i-9)/8;h=3.5+1.7*(1-abs(x))+.5*random.random()
 tube([(x,.48,.65),(x*1.09,.65,2.45),(x*1.33,.94,h-.7),(x*1.45,.88,h)],[.23,.18,.105,.003],glass,5)
for side in [-1,1]:
 tube([(side*.77,.38,.93),(side*.9,-.1,1.36),(side*.97,-.66,1.29)],[.29,.22,.17],glass,6)
 tube([(side*.98,-.67,.6),(side*1.02,-.8,1.4),(side*1.12,-.55,1.85)],[.25,.16,.01],glass,6)
join('Throne');save('throne')
for i in range(5):
 reset()
 tube([(0,0,z) for z in [0,.07,.13,.21,.28,.48,.54]],[.33,.35,.3,.27,.12,.08,.15],gold,16)
 if i==0:
  tube([(0,0,z) for z in [.5,.57,.75,.96,1.0,1.015,.97,.76]],[.08,.18,.32,.35,.37,.33,.31,.06],gold,24)
  for sign in [-1,1]:tube([(sign*.29,0,.93),(sign*.48,0,1.01),(sign*.48,0,.83),(sign*.25,0,.66)],[.032]*4,gold)
 elif i==1:
  for j in range(5):
   a=j*math.tau/5;tube([(0,0,.5),(.24*math.cos(a),.24*math.sin(a),.86),(.30*math.cos(a),.30*math.sin(a),1.2)],[.13,.10,.008],gold,5)
 elif i==2:
  tube([(0,0,z) for z in [.51,.83,1.25]],[.03,.34,.018],gold,6)
 elif i==3:
  for j in range(3):
   pts=[(.31*math.cos(k*math.tau/24),.31*math.sin(k*math.tau/24)*math.cos(j),.85+.31*math.sin(k*math.tau/24)*math.sin(j)) for k in range(25)]
   tube(pts,[.029]*25,gold,5)
  orb((0,0,.85),(.13,)*3,gold)
 else:
  for j in range(3):
   pts=[(.15*math.sin(t*.7+j*2),.15*math.cos(t*.7+j*2),.48+t*.11) for t in range(8)]
   tube(pts,[.115,.13,.14,.13,.11,.09,.055,.003],gold,7)
 join('Trophy'+str(i));save('trophy'+str(i))
reset()
groups={}
def capture(name):groups[name]=[o for o in bpy.context.scene.objects if o not in [x for group in groups.values() for x in group]]
tube([(0,3,.1),(0,2.3,.7),(0,1.5,1.5),(0,.45,1.85)],[1.1,.98,.68,.6],scale,16);capture('Neck')
orb((0,.05,2),(.87,1.02,.64),scale);orb((0,-.92,1.85),(.66,.86,.34),scale)
for s in [-1,1]:
 orb((s*.63,-.53,2.14),(.18,.17,.098),eye);orb((s*.755,-.607,2.14),(.034,.089,.077),glass)
 tube([(s*.29,-.9,2.25),(s*.73,-.44,2.43),(s*.95,.12,2.52)],[.12,.18,.025],scale)
 tube([(s*.58,.3,2.39),(s*.91,.7,2.66),(s*1.13,1.05,3.16),(s*1.09,1.32,3.42)],[.23,.17,.08,.006],horn)
 for k in range(5):
  y=-1.38+k*.23;tube([(s*.51,y,1.67),(s*.49,y-.035,1.45)],[.051,.005],horn)
 for k in range(4):
  tube([(s*.68,k*.25,1.98),(s*(.96+k*.07),.55+k*.25,2.19)],[.15,.004],scale,5)
 orb((s*.31,-1.62,1.99),(.13,.09,.085),glass)
for s in [-1,1]:
 for k in range(7):
  y=.38+k*.34;z=1.6-k*.195;w=.64+k*.045
  tube([(s*w,y,z+.19),(s*(w+.14),y+.2,z+.11),(s*(w+.12),y+.48,z-.2)],[.21,.22,.012],scale,6)
 for k in range(4):
  x=s*(.24+k*.14);orb((x,-.88+k*.18,2.14+k*.045),(.17,.31,.14),scale)
for k in range(7):
 tube([(0,.1+k*.32,2.47-k*.20),(0,.38+k*.32,2.91-k*.18)],[.16,.006],horn,5)
capture('Skull')
orb((0,-.66,1.42),(.59,1.04,.16),scale);orb((0,-.78,1.55),(.48,.79,.05),mouth);capture('Jaw')
parts={n:join(n,obs) for n,obs in groups.items()}
arm=bpy.data.armatures.new('Wyrm skeleton');rig=bpy.data.objects.new('Wyrm rig',arm);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for n,head,tail,parent in [('Neck',(0,2.6,.3),(0,.42,1.7),None),('Skull',(0,.42,1.7),(0,-1.3,2),'Neck'),('Jaw',(0,.15,1.53),(0,-1.4,1.53),'Skull')]:
 b=arm.edit_bones.new(n);b.head=head;b.tail=tail
 if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
for n,o in parts.items():
 o.name=n+' mesh';o.parent=rig;g=o.vertex_groups.new(name=n);g.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Rigid skin','ARMATURE');mod.object=rig
save('dragon')
