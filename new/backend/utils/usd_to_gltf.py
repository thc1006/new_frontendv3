from usd2gltf import converter
from .glb_to_gltf import glb_to_gltf
from pxr import Usd

def remove_floor(stage,remove_paths):

    # 取得並移除地板
    for prim_path_to_remove in remove_paths:
        prim = stage.GetPrimAtPath(prim_path_to_remove)
        if prim and prim.IsValid():
            stage.RemovePrim(prim_path_to_remove)
            stage.GetRootLayer().Save()
    return stage



def usd_to_gltf(input, output=None):
    if not output:
        output = input.split('.usd')[0] + ".glb"
    factory = converter.Converter()
    factory.interpolation = "LINEAR"
    factory.flatten_xform_animation = False
    #remove floor
    stage = Usd.Stage.Open(input)
    remove_paths = ["/World/mobility_domain","/World/ground_plane"]
    remove_floor(stage,remove_paths)
    
    #convert to glb
    factory.process(stage, output)
    
    #convert to gltf
    glb_to_gltf(output)
    return True

