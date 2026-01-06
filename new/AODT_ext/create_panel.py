import omni.ext
import omni.ui as ui
import omni.usd
import omni.kit.app
import carb
import omni.kit.commands
from aodt.common import constants
from pxr import Gf, Sdf, UsdGeom
from typing import Optional
from pydantic import BaseModel, Field

# API imports
from omni.services.core import main, routers

# Import from extension.py
from aodt.ctx_menu.extension import CTX_Extension

# Enable required services
app = omni.kit.app.get_app()
manager = app.get_extension_manager()
manager.set_extension_enabled("omni.services.core", True)
manager.set_extension_enabled("omni.services.transport.server.http", True)

carb.log_info(f"Panel API specifications can be accessed at: http://localhost:8011/docs")
myRouter = routers.ServiceAPIRouter()

class CreatePanelRequest(BaseModel):
    pass  # 不需要任何輸入參數

# Functions and vars are available to other extension as usual in python: `example.python_ext.some_public_function(x)`
def some_public_function(x: int):
    print("[createPannel] some_public_function was called with x: ", x)
    return x ** x


# Any class derived from `omni.ext.IExt` in top level module (defined in `python.modules` of `extension.toml`) will be
# instantiated when extension gets enabled and `on_startup(ext_id)` will be called. Later when extension gets disabled
# on_shutdown() is called.
class CreatepannelExtension(omni.ext.IExt):
    # ext_id is current extension id. It can be used with extension manager to query additional information, like where
    # this extension is located on filesystem.
    def on_startup(self, ext_id):
        print("[createPannel] createPannel startup")

        self._count = 0
        self._usd_context = omni.usd.get_context()
        self._settings = carb.settings.get_settings()
        
        # Create CTX_Extension instance to use its methods
        self._ctx_extension = CTX_Extension()
        # Initialize CTX_Extension properly
        self._ctx_extension._settings = self._settings

        # API: create_panel
        @myRouter.post(
            path="/create_panel",
            summary="Create Panel",
            description="Create a new panel at origin with auto-generated name.",
            tags=["Panel"],
            responses={
                200: {"description": "Panel created successfully", "content": {"application/json": {"example": {"success": True, "panel_path": "/Panels/panel_01"}}}},
                500: {"description": "Internal Server Error"}
            }
        )
        async def create_panel_handler(request: CreatePanelRequest):
            try:
                stage = self._usd_context.get_stage()
                if not stage:
                    return {"success": False, "error": "Stage not found"}
                
                # 固定在原點創建
                self._ctx_extension.coord = [0, 0, 0]
                
                # Set offset for panels (no offset needed)
                self._ctx_extension._offset = 0
                
                # Get panel asset path
                panel_asset_path = self._ctx_extension._settings.get(constants.PANEL_ASSET_SETTING_PATH)
                if not panel_asset_path:
                    return {"success": False, "error": "Panel asset path not configured"}
                
                # Generate panel name using same logic as extension.py
                panels = sorted([
                    int(x.GetName().split("_")[1])
                    for x in stage.Traverse()
                    if x.GetName().split("_")[0] == "panel" and x.GetPath().pathString.startswith("/Panels/")
                ])
                panel_labels = list(set(list(range(1, len(panels) + 1))) - set(panels))

                if len(panel_labels) == 0:
                    panel_label = len(panels) + 1
                else:
                    panel_label = min(panel_labels)

                prim_path = "/Panels/panel_" + str(panel_label).zfill(2)
                
                # Use CTX_Extension create_prim method directly
                created_prim = self._ctx_extension.create_prim(panel_asset_path, prim_path)
                
                if created_prim:
                    prim_path = created_prim.GetPath().pathString
                    panel_name = created_prim.GetName()
                    return {
                        "success": True, 
                        "panel_path": prim_path,
                        "panel_name": panel_name
                    }
                else:
                    return {"success": False, "error": "Failed to create panel"}
                
            except Exception as e:
                return {"success": False, "error": str(e)}

        # API: check_panel_config
        @myRouter.get(
            path="/check_panel_config",
            summary="Check Panel Configuration",
            description="Check if panel asset path is configured.",
            tags=["Panel"],
        )
        async def check_panel_config():
            try:
                panel_asset_path = self._ctx_extension._settings.get(constants.PANEL_ASSET_SETTING_PATH)
                return {
                    "panel_asset_path_configured": bool(panel_asset_path),
                    "panel_asset_path": panel_asset_path or "Not configured"
                }
            except Exception as e:
                return {"success": False, "error": str(e)}

        # API: get_panel_count
        @myRouter.get(
            path="/get_panel_count",
            summary="Get Panel Count",
            description="Get the current number of panels in the stage.",
            tags=["Panel"],
            responses={
                200: {"description": "Panel count retrieved successfully", "content": {"application/json": {"example": {"success": True, "panel_count": 5}}}},
                500: {"description": "Internal Server Error"}
            }
        )
        async def get_panel_count_handler():
            try:
                count = self.get_panel_count()
                return {
                    "success": True,
                    "panel_count": count
                }
            except Exception as e:
                return {"success": False, "error": str(e)}

        main.register_router(router=myRouter)

        self._window = ui.Window("Panel Creator", width=400, height=400)
        with self._window.frame:
            with ui.VStack():
                ui.Label("Panel API Control", height=20)
                ui.Separator()
                
                # Panel creation UI
                with ui.VStack(height=100):
                    ui.Label("Create Panel:")
                    
                    # 簡單的創建按鈕，不需要任何輸入
                    ui.Button("Create Panel", clicked_fn=self.on_create_panel_api)
                
                ui.Separator()
                
                # Status display
                self._status_label = ui.Label("Ready")
                
                ui.Separator()
                
                # Original counter functionality
                label = ui.Label("")

                def on_click():
                    self._count += 1
                    label.text = f"count: {self._count}"

                def on_reset():
                    self._count = 0
                    label.text = "empty"

                on_reset()

                with ui.HStack():
                    ui.Button("Add", clicked_fn=on_click)
                    ui.Button("Reset", clicked_fn=on_reset)

    def on_create_panel_api(self):
        """Handle panel creation from UI using CTX_Extension - 簡化版，不需要輸入"""
        try:
            stage = self._usd_context.get_stage()
            if not stage:
                self._status_label.text = "Error: Stage not found"
                return
            
            # 固定在原點創建
            self._ctx_extension.coord = [0, 0, 0]
            self._ctx_extension._offset = 0
            
            # Get panel asset path
            panel_asset_path = self._ctx_extension._settings.get(constants.PANEL_ASSET_SETTING_PATH)
            if not panel_asset_path:
                self._status_label.text = "Error: Panel asset path not configured"
                return
            
            # Generate panel name using same logic as extension.py
            panels = sorted([
                int(x.GetName().split("_")[1])
                for x in stage.Traverse()
                if x.GetName().split("_")[0] == "panel" and x.GetPath().pathString.startswith("/Panels/")
            ])
            panel_labels = list(set(list(range(1, len(panels) + 1))) - set(panels))

            if len(panel_labels) == 0:
                panel_label = len(panels) + 1
            else:
                panel_label = min(panel_labels)

            prim_path = "/Panels/panel_" + str(panel_label).zfill(2)
            
            # Use CTX_Extension create_prim method directly
            created_prim = self._ctx_extension.create_prim(panel_asset_path, prim_path)
            
            if created_prim:
                prim_path = created_prim.GetPath().pathString
                panel_name = created_prim.GetName()
                self._status_label.text = f"Created: {panel_name}"
            else:
                self._status_label.text = "Error: Failed to create panel"
                
        except Exception as e:
            self._status_label.text = f"Error: {str(e)}"

    def get_panel_count(self):
        """Get the current number of panels in the stage."""
        stage = omni.usd.get_context().get_stage()
        panels = [
            x for x in stage.Traverse()
            if x.GetName().split("_")[0] == "panel" and x.GetPath().pathString.startswith("/Panels/")
        ]
        return len(panels)

    def on_shutdown(self):
        print("[createPannel] createPannel shutdown")
        # Deregister API router
        main.deregister_router(router=myRouter)
