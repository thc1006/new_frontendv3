from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


from .AbstractMetrics import AbstractMetrics  # noqa: F401,E402
from .AIMetrics import AIMetrics  # noqa: F401,E402
from .Brand import Brand  # noqa: F401,E402
from .BrandMetrics import BrandMetrics  # noqa: F401,E402
from .PrimitiveAIModel import PrimitiveAIModel  # noqa: F401,E402