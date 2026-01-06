from models import db


def cascade_delete_project(user): #delete orphan project BEFORE user delete
    for project in user.projects:
        if len(project.users) == 1 and project.users[0] == user:
            db.session.delete(project)
    db.session.flush()
    
    
