from pygltflib import GLTF2, BufferFormat
import argparse
from pathlib import Path



def glb_to_gltf(glb_filename):

    gltf_file = str(Path(glb_filename).with_suffix('.gltf'))
    gltf = GLTF2().load(glb_filename)
    gltf.convert_buffers(BufferFormat.DATAURI)   # convert buffers to files
    gltf.save(gltf_file)
    return True


def main():
    parser = argparse.ArgumentParser(description='glb to gltf')
    parser.add_argument('--input', '-i', required=True, help='Input GLB file path')
    
    args = parser.parse_args()
    glb_file = args.input
    glb_to_gltf(glb_file)



if __name__ == "__main__":
    main() 


