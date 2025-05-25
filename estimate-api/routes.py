# filepath: routes.py
from flask import Blueprint, request, jsonify
from models import db, Estimate, Epic, Story, Task, Subtask, Personnel, Draft
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import uuid

api_bp = Blueprint('api', __name__)

@api_bp.route('/estimates', methods=['GET'])
def get_estimates():
    """Get all estimates"""
    estimates = Estimate.query.all()
    return jsonify([estimate.to_dict() for estimate in estimates]), 200

@api_bp.route('/estimates/<estimate_id>', methods=['GET'])
def get_estimate(estimate_id):
    """Get a specific estimate"""
    estimate = Estimate.query.get_or_404(estimate_id)
    return jsonify(estimate.to_dict()), 200

@api_bp.route('/estimates', methods=['POST'])
def create_estimate():
    """Create a new estimate"""
    data = request.json
    try:
        # Create the estimate
        new_estimate = Estimate(
            project_name=data.get('project_name', 'New Project'),
            start_date=datetime.fromisoformat(data.get('start_date', datetime.now().isoformat()[:10])),
            is_draft=data.get('is_draft', True),
            id=data.get('id', str(uuid.uuid4()))
        )
        db.session.add(new_estimate)
        
        # Add epics if provided
        if 'epics' in data:
            for epic_data in data['epics']:
                create_epic(new_estimate.id, epic_data)
                
        db.session.commit()
        return jsonify(new_estimate.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/estimates/<estimate_id>', methods=['PUT'])
def update_estimate(estimate_id):
    """Update an estimate"""
    estimate = Estimate.query.get_or_404(estimate_id)
    data = request.json
    
    try:
        with db.session.no_autoflush:
            # Update basic fields
            if 'project_name' in data:
                estimate.project_name = data['project_name']
            if 'start_date' in data:
                estimate.start_date = datetime.fromisoformat(data['start_date'])
            if 'is_draft' in data:
                estimate.is_draft = data['is_draft']
            
            # Handle epics update if provided
            if 'epics' in data:
                # Get current epic IDs
                current_epic_ids = {epic.id for epic in estimate.epics}
                new_epic_ids = {epic['id'] for epic in data['epics'] if 'id' in epic}
                
                # Remove epics not in the new data
                for epic_id in current_epic_ids - new_epic_ids:
                    # First delete personnel associated with stories in this epic
                    epic = Epic.query.get(epic_id)
                    if epic:
                        for story in epic.stories:
                            # Delete personnel from tasks
                            for task in story.tasks:
                                # Delete personnel from subtasks
                                for subtask in task.subTasks:
                                    personnel_to_delete = Personnel.query.filter_by(entity_type='subtask', entity_id=subtask.id).all()
                                    for p in personnel_to_delete:
                                        db.session.delete(p)
                                personnel_to_delete = Personnel.query.filter_by(entity_type='task', entity_id=task.id).all()
                                for p in personnel_to_delete:
                                    db.session.delete(p)
                            personnel_to_delete = Personnel.query.filter_by(entity_type='story', entity_id=story.id).all()
                            for p in personnel_to_delete:
                                db.session.delete(p)
                        # Now delete personnel for the epic itself
                        personnel_to_delete = Personnel.query.filter_by(entity_type='epic', entity_id=epic_id).all()
                        for p in personnel_to_delete:
                            db.session.delete(p)
                        db.session.flush()
                        db.session.delete(epic)
                
                # Update or create epics
                for epic_data in data['epics']:
                    epic_id = epic_data.get('id')
                    if epic_id and Epic.query.get(epic_id):
                        update_epic(epic_id, epic_data)
                    else:
                        create_epic(estimate_id, epic_data)
        
        db.session.commit()
        return jsonify(estimate.to_dict()), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/estimates/<estimate_id>/drafts', methods=['GET'])
def get_drafts(estimate_id):
    """Get all drafts for an estimate"""
    drafts = Draft.query.filter_by(estimate_id=estimate_id).all()
    return jsonify([draft.to_dict() for draft in drafts]), 200

@api_bp.route('/estimates/<estimate_id>/drafts', methods=['POST'])
def save_draft(estimate_id):
    """Save a draft for an estimate"""
    data = request.json
    
    # Ensure estimate exists
    Estimate.query.get_or_404(estimate_id)
    
    try:
        new_draft = Draft(
            name=data.get('name', f'Draft {datetime.now().isoformat()}'),
            estimate_id=estimate_id,
            estimate_data=data['estimate_data']
        )
        db.session.add(new_draft)
        db.session.commit()
        return jsonify(new_draft.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@api_bp.route('/estimates/<estimate_id>/drafts/<draft_id>', methods=['GET'])
def get_draft(estimate_id, draft_id):
    """Get a specific draft"""
    draft = Draft.query.filter_by(id=draft_id, estimate_id=estimate_id).first_or_404()
    return jsonify(draft.to_dict()), 200

@api_bp.route('/estimates/<estimate_id>/drafts/<draft_id>', methods=['DELETE'])
def delete_draft(estimate_id, draft_id):
    """Delete a specific draft"""
    draft = Draft.query.filter_by(id=draft_id, estimate_id=estimate_id).first_or_404()
    
    try:
        db.session.delete(draft)
        db.session.commit()
        return jsonify({"message": f"Draft {draft_id} deleted successfully"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Helper functions to handle nested data
def create_epic(estimate_id, epic_data):
    """Helper to create an epic with its relations"""
    epic = Epic(
        name=epic_data.get('name', ''),
        estimate_id=estimate_id,
        id=epic_data.get('id')
    )
    db.session.add(epic)
    
    # Add personnel
    if 'personnel' in epic_data:
        for personnel_data in epic_data['personnel']:
            personnel = Personnel(
                type=personnel_data['type'],
                value=personnel_data.get('value', 0),
                entity_type='epic',
                entity_id=epic.id
            )
            db.session.add(personnel)
    
    # Add stories
    if 'stories' in epic_data:
        for story_data in epic_data['stories']:
            create_story(epic.id, story_data)
    
    return epic

def update_epic(epic_id, epic_data):
    """Helper to update an epic with its relations"""
    epic = Epic.query.get(epic_id)
    if not epic:
        return None
    
    if 'name' in epic_data:
        epic.name = epic_data['name']
      # Update personnel
    if 'personnel' in epic_data:
        # First query and then delete to avoid SQLAlchemy's autoflush issues
        personnel_to_delete = Personnel.query.filter_by(entity_type='epic', entity_id=epic_id).all()
        for p in personnel_to_delete:
            db.session.delete(p)
        db.session.flush()  # Flush changes to ensure delete completes before adding new records
        
        # Add new personnel
        for personnel_data in epic_data['personnel']:
            personnel = Personnel(
                type=personnel_data['type'],
                value=personnel_data.get('value', 0),
                entity_type='epic',
                entity_id=epic_id
            )
            db.session.add(personnel)
      # Handle stories update if provided
    if 'stories' in epic_data:
        # Get current story IDs
        current_story_ids = {story.id for story in epic.stories}
        new_story_ids = {story.get('id') for story in epic_data['stories'] if 'id' in story}
          # Remove stories not in the new data
        for story_id in current_story_ids - new_story_ids:
            story = Story.query.get(story_id)
            if story:
                # Delete associated personnel records first to avoid integrity issues
                personnel_to_delete = Personnel.query.filter_by(entity_type='story', entity_id=story_id).all()
                for p in personnel_to_delete:
                    db.session.delete(p)
                db.session.flush()
                db.session.delete(story)
        
        # Update or create stories
        for story_data in epic_data['stories']:
            story_id = story_data.get('id')
            if story_id and Story.query.get(story_id):
                update_story(story_id, story_data)
            else:
                create_story(epic_id, story_data)
    
    return epic

def create_story(epic_id, story_data):
    """Helper to create a story with its relations"""
    story = Story(
        name=story_data.get('name', ''),
        epic_id=epic_id,
        id=story_data.get('id')
    )
    db.session.add(story)
    
    # Add personnel
    if 'personnel' in story_data:
        for personnel_data in story_data['personnel']:
            personnel = Personnel(
                type=personnel_data['type'],
                value=personnel_data.get('value', 0),
                entity_type='story',
                entity_id=story.id
            )
            db.session.add(personnel)
    
    # Add tasks
    if 'tasks' in story_data:
        for task_data in story_data['tasks']:
            create_task(story.id, task_data)
    
    return story

def update_story(story_id, story_data):
    """Helper to update a story with its relations"""
    story = Story.query.get(story_id)
    if not story:
        return None
    
    if 'name' in story_data:
        story.name = story_data['name']    # Update personnel
    if 'personnel' in story_data:
        # First query and then delete to avoid SQLAlchemy's autoflush issues
        personnel_to_delete = Personnel.query.filter_by(entity_type='story', entity_id=story_id).all()
        for p in personnel_to_delete:
            db.session.delete(p)
        db.session.flush()  # Flush changes to ensure delete completes before adding new records
        
        # Add new personnel
        for personnel_data in story_data['personnel']:
            personnel = Personnel(
                type=personnel_data['type'],
                value=personnel_data.get('value', 0),
                entity_type='story',
                entity_id=story_id
            )
            db.session.add(personnel)
      # Handle tasks update if provided
    if 'tasks' in story_data:
        # Get current task IDs
        current_task_ids = {task.id for task in story.tasks}
        new_task_ids = {task.get('id') for task in story_data['tasks'] if 'id' in task}
          # Remove tasks not in the new data
        for task_id in current_task_ids - new_task_ids:
            task = Task.query.get(task_id)
            if task:
                # Delete associated personnel records first to avoid integrity issues
                personnel_to_delete = Personnel.query.filter_by(entity_type='task', entity_id=task_id).all()
                for p in personnel_to_delete:
                    db.session.delete(p)
                db.session.flush()
                db.session.delete(task)
        
        # Update or create tasks
        for task_data in story_data['tasks']:
            task_id = task_data.get('id')
            if task_id and Task.query.get(task_id):
                update_task(task_id, task_data)
            else:
                create_task(story_id, task_data)
    
    return story

def create_task(story_id, task_data):
    """Helper to create a task with its relations"""
    task = Task(
        name=task_data.get('name', ''),
        story_id=story_id,
        id=task_data.get('id')
    )
    db.session.add(task)
    
    # Add personnel
    if 'personnel' in task_data:
        for personnel_data in task_data['personnel']:
            personnel = Personnel(
                type=personnel_data['type'],
                value=personnel_data.get('value', 0),
                entity_type='task',
                entity_id=task.id
            )
            db.session.add(personnel)
      # Add subTasks
    if 'subTasks' in task_data:
        for subtask_data in task_data['subTasks']:
            create_subtask(task.id, subtask_data)
    
    return task

def update_task(task_id, task_data):
    """Helper to update a task with its relations"""
    task = Task.query.get(task_id)
    if not task:
        return None
    
    if 'name' in task_data:
        task.name = task_data['name']      # Update personnel
    if 'personnel' in task_data:
        # First query and then delete to avoid SQLAlchemy's autoflush issues
        personnel_to_delete = Personnel.query.filter_by(entity_type='task', entity_id=task_id).all()
        for p in personnel_to_delete:
            db.session.delete(p)
        db.session.flush()  # Flush changes to ensure delete completes before adding new records
        
        # Add new personnel
        for personnel_data in task_data['personnel']:
            personnel = Personnel(
                type=personnel_data['type'],
                value=personnel_data.get('value', 0),
                entity_type='task',
                entity_id=task_id
            )
            db.session.add(personnel)
      # Handle subTasks update if provided
    if 'subTasks' in task_data:
        # Get current subtask IDs
        current_subtask_ids = {subtask.id for subtask in task.subTasks}
        new_subtask_ids = {subtask.get('id') for subtask in task_data['subTasks'] if 'id' in subtask}          # Remove subTasks not in the new data
        for subtask_id in current_subtask_ids - new_subtask_ids:
            subtask = Subtask.query.get(subtask_id)
            if subtask:
                # Delete associated personnel records first to avoid integrity issues
                personnel_to_delete = Personnel.query.filter_by(entity_type='subtask', entity_id=subtask_id).all()
                for p in personnel_to_delete:
                    db.session.delete(p)
                db.session.flush()
                db.session.delete(subtask)
          # Update or create subTasks
        for subtask_data in task_data['subTasks']:
            subtask_id = subtask_data.get('id')
            if subtask_id and Subtask.query.get(subtask_id):
                update_subtask(subtask_id, subtask_data)
            else:
                create_subtask(task_id, subtask_data)
    
    return task

def create_subtask(task_id, subtask_data):
    """Helper to create a subtask with its relations"""
    subtask = Subtask(
        name=subtask_data.get('name', ''),
        task_id=task_id,
        id=subtask_data.get('id')
    )
    db.session.add(subtask)
    
    # Add personnel
    if 'personnel' in subtask_data:
        for personnel_data in subtask_data['personnel']:
            personnel = Personnel(
                type=personnel_data['type'],
                value=personnel_data.get('value', 0),
                entity_type='subtask',
                entity_id=subtask.id
            )
            db.session.add(personnel)
    
    return subtask

def update_subtask(subtask_id, subtask_data):
    """Helper to update a subtask with its relations"""
    subtask = Subtask.query.get(subtask_id)
    if not subtask:
        return None
    
    if 'name' in subtask_data:
        subtask.name = subtask_data['name']      # Update personnel
    if 'personnel' in subtask_data:
        # First query and then delete to avoid SQLAlchemy's autoflush issues
        personnel_to_delete = Personnel.query.filter_by(entity_type='subtask', entity_id=subtask_id).all()
        for p in personnel_to_delete:
            db.session.delete(p)
        db.session.flush()  # Flush changes to ensure delete completes before adding new records
        
        # Add new personnel
        for personnel_data in subtask_data['personnel']:
            personnel = Personnel(
                type=personnel_data['type'],
                value=personnel_data.get('value', 0),
                entity_type='subtask',
                entity_id=subtask_id
            )
            db.session.add(personnel)
    
    return subtask