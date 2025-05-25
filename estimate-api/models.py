# filepath: models.py
from database import db
import datetime
import json
import uuid
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, foreign, remote

class Estimate(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    project_name = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_draft = db.Column(db.Boolean, default=True)
    
    # Relationships
    epics = db.relationship('Epic', backref='estimate', lazy=True, cascade='all, delete-orphan')
    
    # Active editors tracking
    active_editors = db.Column(db.Text, default='[]')  # JSON array of client IDs
    
    def __init__(self, project_name, start_date, is_draft=True, id=None):
        self.id = id or str(uuid.uuid4())
        self.project_name = project_name
        self.start_date = start_date
        self.is_draft = is_draft
        self.active_editors = '[]'
    
    def add_active_editor(self, client_id):
        editors = json.loads(self.active_editors)
        if client_id not in editors:
            editors.append(client_id)
            self.active_editors = json.dumps(editors)
            return True
        return False
    
    def remove_active_editor(self, client_id):
        editors = json.loads(self.active_editors)
        if client_id in editors:
            editors.remove(client_id)
            self.active_editors = json.dumps(editors)
            return True
        return False
    
    def get_active_editors(self):
        return json.loads(self.active_editors)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_name': self.project_name,
            'start_date': self.start_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'is_draft': self.is_draft,
            'epics': [epic.to_dict() for epic in self.epics],
            'active_editors': self.get_active_editors()
        }

# Modify the Epic model to correctly define the relationship with Personnel
class Epic(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    estimate_id = db.Column(db.String(36), db.ForeignKey('estimate.id'), nullable=False)
    
    # Relationships
    stories = db.relationship('Story', backref='epic', lazy=True, cascade='all, delete-orphan')
    personnel = db.relationship(
        "Personnel",
        primaryjoin="and_(Personnel.entity_type=='epic', foreign(Personnel.entity_id)==Epic.id)",
        backref="epic",
        lazy="dynamic"
    )

    def __init__(self, name, estimate_id, id=None):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.estimate_id = estimate_id
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'stories': [story.to_dict() for story in self.stories],
            'personnel': [p.to_dict() for p in self.personnel]
        }

class Story(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    epic_id = db.Column(db.String(36), db.ForeignKey('epic.id'), nullable=False)
    
    # Relationships
    tasks = db.relationship('Task', backref='story', lazy=True, cascade='all, delete-orphan')
    personnel = db.relationship(
        "Personnel",
        primaryjoin="and_(Personnel.entity_type=='story', foreign(Personnel.entity_id)==Story.id)",
        backref="story",
        lazy="dynamic"
    )

    def __init__(self, name, epic_id, id=None):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.epic_id = epic_id
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'tasks': [task.to_dict() for task in self.tasks],
            'personnel': [p.to_dict() for p in self.personnel]
        }

class Task(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    story_id = db.Column(db.String(36), db.ForeignKey('story.id'), nullable=False)
    
    # Relationships
    subTasks = db.relationship('Subtask', backref='task', lazy=True, cascade='all, delete-orphan')
    personnel = db.relationship(
        "Personnel",
        primaryjoin="and_(Personnel.entity_type=='task', foreign(Personnel.entity_id)==Task.id)",
        backref="task",
        lazy="dynamic"
    )
    
    def __init__(self, name, story_id, id=None):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.story_id = story_id
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'subTasks': [subtask.to_dict() for subtask in self.subTasks],
            'personnel': [p.to_dict() for p in self.personnel]
        }

class Subtask(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    task_id = db.Column(db.String(36), db.ForeignKey('task.id'), nullable=False)
    
    # Relationships
    personnel = db.relationship(
        "Personnel",
        primaryjoin="and_(Personnel.entity_type=='subtask', foreign(Personnel.entity_id)==Subtask.id)",
        backref="subtask",
        lazy="dynamic"
    )

    def __init__(self, name, task_id, id=None):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.task_id = task_id
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'personnel': [p.to_dict() for p in self.personnel]
        }

class Personnel(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # DEV, BA, TESTER
    value = db.Column(db.Float, default=0)
    entity_id = db.Column(db.String(36), nullable=False)
    entity_type = db.Column(db.String(20), nullable=False)  # 'epic', 'story', 'task', 'subtask'
    
    # Foreign Keys for different entity types
    epic_id = db.Column(db.String(36), db.ForeignKey('epic.id'), nullable=True)
    story_id = db.Column(db.String(36), db.ForeignKey('story.id'), nullable=True)
    task_id = db.Column(db.String(36), db.ForeignKey('task.id'), nullable=True)
    subtask_id = db.Column(db.String(36), db.ForeignKey('subtask.id'), nullable=True)

    def __init__(self, type, entity_type, entity_id, value=0, id=None):
        self.id = id or str(uuid.uuid4())
        self.type = type
        self.value = value
        self.entity_type = entity_type
        self.entity_id = entity_id
        
        # Set the appropriate foreign key based on entity_type
        if entity_type == 'epic':
            self.epic_id = entity_id
        elif entity_type == 'story':
            self.story_id = entity_id
        elif entity_type == 'task':
            self.task_id = entity_id
        elif entity_type == 'subtask':
            self.subtask_id = entity_id
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'value': self.value
        }

class Draft(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    estimate_id = db.Column(db.String(36), db.ForeignKey('estimate.id'), nullable=False)
    estimate_data = db.Column(db.Text, nullable=False)  # JSON data of the estimate
    
    def __init__(self, name, estimate_id, estimate_data, id=None):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.estimate_id = estimate_id
        self.estimate_data = json.dumps(estimate_data)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'timestamp': self.timestamp.isoformat(),
            'estimate_id': self.estimate_id,
            'estimate': json.loads(self.estimate_data)
        }