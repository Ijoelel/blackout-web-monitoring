# Blackout Web Monitoring

This project is a web application for monitoring blackouts.

## How to Run

### Server

1.  Create a virtual environment:
    ```bash
    python -m venv .venv
    ```
2.  Activate the virtual environment.
    - On Windows:
      ```bash
      .venv\Scripts\activate
      ```
    - On macOS/Linux:
      ```bash
      source .venv/bin/activate
      ```
3.  Install the dependencies:
    ```bash
    pip install -r server/requirements.txt
    ```
4.  Run the server:
    ```bash
    python server/server.py
    ```

### Client

1.  Make sure you have [Node.js](https://nodejs.org/) installed.
2.  Install `nodemon` globally:
    ```bash
    npm install -g nodemon
    ```
3.  Run the client:
    ```bash
    nodemon client/client.js
    ```
