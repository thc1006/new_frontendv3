from flask import Blueprint, jsonify
from models import db
from models.BrandMetrics import BrandMetrics

brand_metrics_bp = Blueprint('brand_metrics', __name__)

@brand_metrics_bp.route('/brand_metrics/unique-names', methods=['GET'])
def get_unique_names():
    unique_names = db.session.query(BrandMetrics.name).distinct().all()
    names_list = [name[0] for name in unique_names]
    return jsonify({'unique_names': names_list})