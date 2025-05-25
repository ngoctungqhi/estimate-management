# filepath: app.py
import os
import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit
from config import Config
from database import db, migrate
from routes import api_bp
from models import Estimate, db

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
CORS(app)
db.init_app(app)
migrate.init_app(app, db)
socketio = SocketIO(app, cors_allowed_origins=Config.CORS_ORIGIN)

# Register API routes
app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to the Estimate Management API",
        "version": "1.0.0",
        "status": "running"
    })

# Socket.IO handlers for real-time collaboration
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    from flask import request
    client_id = request.sid
    print(f'Client disconnected: {client_id}')
    
    # Find all estimates this client was editing and remove them
    with app.app_context():
        estimates = Estimate.query.all()
        for estimate in estimates:
            if estimate.remove_active_editor(client_id):
                # Notify others that this editor has left
                room = f"estimate_{estimate.id}"
                emit('editor_left', {
                    'client_id': client_id,
                    'timestamp': datetime.datetime.now().isoformat()
                }, room=room)
                db.session.commit()

@socketio.on('join_estimate')
def handle_join_estimate(data):
    """Handler for client joining an estimate session"""
    from flask import request
    estimate_id = data.get('estimate_id')
    client_id = request.sid
    
    if not estimate_id:
        return
    
    room = f"estimate_{estimate_id}"
    join_room(room)
    
    # Track the editor
    with app.app_context():
        estimate = Estimate.query.get(estimate_id)
        if estimate and estimate.add_active_editor(client_id):
            db.session.commit()
            # Notify others that a new editor has joined
            emit('editor_joined', {
                'client_id': client_id,
                'timestamp': datetime.datetime.now().isoformat()
            }, room=room, include_self=False)

@socketio.on('leave_estimate')
def handle_leave_estimate(data):
    """Handler for client leaving an estimate session"""
    from flask import request
    estimate_id = data.get('estimate_id')
    client_id = request.sid
    
    if not estimate_id:
        return
    
    room = f"estimate_{estimate_id}"
    leave_room(room)
    
    # Remove the editor
    with app.app_context():
        estimate = Estimate.query.get(estimate_id)
        if estimate and estimate.remove_active_editor(client_id):
            db.session.commit()
            # Notify others that the editor has left
            emit('editor_left', {
                'client_id': client_id,
                'timestamp': datetime.datetime.now().isoformat()
            }, room=room)

@socketio.on('update_estimate')
def handle_update(data):
    """Handler for real-time estimate updates"""
    from flask import request
    estimate_id = data.get('estimate_id')
    update_type = data.get('type')  # epic, story, task, subtask, personnel
    update_action = data.get('action')  # add, update, delete
    update_data = data.get('data')
    client_id = request.sid
    
    if not estimate_id or not update_type or not update_action or not update_data:
        return
    
    room = f"estimate_{estimate_id}"
    
    # Broadcast the update to other clients
    emit('estimate_updated', {
        'type': update_type,
        'action': update_action,
        'data': update_data,
        'client_id': client_id,
        'timestamp': datetime.datetime.now().isoformat()
    }, room=room, include_self=False)

if __name__ == '__main__':
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
    
    # Run the app with Socket.IO
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)