from flask import Flask, jsonify, request, send_from_directory, abort
import os
import json
import pandas as pd

PORT = 80

app = Flask(__name__)

# Serve the index.html file
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/ticketuploader')
def ticketuploader():
    return send_from_directory('.', 'ticketuploader.html')

# API endpoint to handle ticket validation and update
@app.route('/api/validate_ticket/<string:ticket_id>', methods=['POST'])
def validate_ticket(ticket_id):
    with open('tickets.json', 'r+') as f:
        data = json.load(f)
        ticket_found = False
        for ticket in data['codes']:
            if ticket['id'] == ticket_id:
                ticket_found = True
                if ticket['allowed_scans'] > ticket['times_scanned']:
                    ticket['times_scanned'] += 1  # Increment the scan count
                    feedback = {
                        'status': 'valid',
                        'message': 'Geldig ticket - ' + ticket_id,
                        'times_scanned': ticket['times_scanned'],
                        'allowed_scans': ticket['allowed_scans']
                    }
                    f.seek(0)  # Reset file position to the beginning
                    json.dump(data, f, indent=4)
                    f.truncate()  # Remove remaining part of old data
                else:
                    feedback = {
                        'status': 'invalid',
                        'message': 'TE VAAK GESCAND!',
                        'times_scanned': ticket['times_scanned'],
                        'allowed_scans': ticket['allowed_scans']
                    }
                break
        if not ticket_found:
            feedback = {'status': 'error', 'message': 'Onbekend ticket'}
    return jsonify(feedback), 200

@app.route('/uploadbestand', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return 'Geen bestand geselecteerd!'
    file = request.files['file']
    if file.filename == '':
        return 'Geen bestand geselecteerd!'
    if file:
        df = pd.read_excel(file, engine='openpyxl')
        df.columns = ['id', 'allowed_scans', 'times_scanned']
        df['id'] = df['id'].astype(str)
        df['allowed_scans'].fillna(1, inplace=True)
        df['times_scanned'].fillna(0, inplace=True)
        df['allowed_scans'] = df['allowed_scans'].astype(int)
        df['times_scanned'] = df['times_scanned'].astype(int)

        data = {'codes': df.to_dict(orient='records')}
        with open('tickets.json', 'w') as json_file:
            json.dump(data, json_file, indent=4)
        return send_from_directory('.', 'succes.html')

# Serving files directly, e.g., JavaScript, CSS, images
@app.route('/<path:path>')
def static_file(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=80, host='0.0.0.0')
