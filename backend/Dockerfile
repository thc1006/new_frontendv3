# FROM python:3.10
# WORKDIR /app
# ADD . /app
# COPY flask_requirement.txt .
# RUN pip install -r flask_requirement.txt
# RUN test -d ./img || mkdir ./img && chmod -R 777 ./img
# COPY . .

# ENV FLASK_RUN_HOST=0.0.0.0
# ENV FLASK_APP=app.py
# ENV DEBIAN_FRONTEND noninteractive
# EXPOSE 8000
# CMD ["flask", "run", "--host=0.0.0.0", "--port=8000"]
# CMD ["python", "app.py"]
# CMD ["gunicorn", "-w", "12", "--threads", "2", "-b", "0.0.0.0:8000", "config:app"]

FROM python:3.10
WORKDIR /app

COPY requirement.txt /app/
RUN pip install -r requirement.txt
COPY . /app/

# Create required directories
RUN mkdir -p ./img && chmod -R 777 ./img
RUN mkdir -p /tmp/prometheus && chmod -R 777 /tmp/prometheus

ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_APP=app.py
ENV DEBIAN_FRONTEND=noninteractive
ENV PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus
EXPOSE 8000

CMD ["gunicorn", "-w", "4", "--threads", "4", "-b", "0.0.0.0:8000", "config:app", "--worker-class=gthread", "--timeout", "120"]