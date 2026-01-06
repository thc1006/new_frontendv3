
# 5G-ORAN

This repository contains the source code for the 5G-ORAN interface project developed during the 2024 summer.

## Documentation

https://github.com/5G-ORAN/docs

## Dependencies
- Python 3.10.14

## Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/5G-ORAN/5G-ORAN.git
    cd 5G-ORAN
    ```

2. Install dependencies:

    ```bash
    pip install -r requirement.txt
    ```

3. Start the Flask server:

    ```bash
    python app.py
    ```

4. Access the application in your browser at `http://localhost:2880`.

## Project Structure

- `app.py`: Main Flask application file containing route handlers.
- `templates/`: Directory containing HTML templates.
- `static/`: Directory containing static assets like CSS and JavaScript files.

## Usage

- Register a new account at `/register`.
- Log in with your account credentials at `/`.
- View and manage projects at `/projects`.
- Explore specific project details such as maps, configurations, performance, and editing.
