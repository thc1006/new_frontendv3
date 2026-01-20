class MinIOName:
    # for evaluation
    @staticmethod
    def evaluation_rsrp_heatmap(evaluation_id: int, ue_start_or_end = 0):
        return f"evaluation_{evaluation_id}_rsrp_heatmap_{ue_start_or_end}.json"

    @staticmethod
    def evaluation_throughput_heatmap(evaluation_id: int, ue_start_or_end = 0):
        return f"evaluation_{evaluation_id}_throughput_heatmap_{ue_start_or_end}.json"

    @staticmethod
    def evaluation_rsrp_dt_heatmap(evaluation_id: int):
        return f"evaluation_{evaluation_id}_rsrp_dt_heatmap.json"

    @staticmethod
    def evaluation_throughput_dt_heatmap(evaluation_id: int):
        return f"evaluation_{evaluation_id}_throughput_dt_heatmap.json"

    # for project
    @staticmethod
    def project_rsrp_heatmap(project_id: int):
        return f"project_{project_id}_rsrp_heatmap.json"

    @staticmethod
    def project_throughput_heatmap(project_id: int):
        return f"project_{project_id}_throughput_heatmap.json"

    @staticmethod
    def project_rsrp_dt_heatmap(project_id: int):
        return f"project_{project_id}_rsrp_dt_heatmap.json"

    @staticmethod
    def project_throughput_dt_heatmap(project_id: int):
        return f"project_{project_id}_throughput_dt_heatmap.json"
    
    @staticmethod
    def frontend_map(project_id: int):
        return f"map_frontend_{project_id}.gltf"
    
    @staticmethod
    def aodt_map(project_id: int):
        return f"map_aodt_{project_id}.usd"