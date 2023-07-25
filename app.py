from flask import Flask, request, jsonify, session
from flask import send_from_directory
from werkzeug.utils import secure_filename
import os
from flask_cors import CORS
from search import Search
from clipper import Clipper
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json
from datetime import datetime
import tempfile
import traceback

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your secret key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
CORS(app)

db = SQLAlchemy(app)

search = Search(Clipper())

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True)
    password = db.Column(db.String(80))
    profile = db.relationship('UserProfile', backref='user', uselist=False)

class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    contributions = db.Column(db.String(500))
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    
class Discussion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    text = db.Column(db.String(500), nullable=False)

class SavedSearch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    case_id = db.Column(db.Integer, nullable=False)
    query = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.errorhandler(Exception)
def handle_error(e):
    print(traceback.format_exc())  # Print traceback temporarily on
    return jsonify(error=str(e)), 500

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'], method='sha256')
    new_user = User(username=data['username'], password=hashed_password)
    new_profile = UserProfile(user=new_user)
    db.session.add(new_user)
    db.session.add(new_profile)
    db.session.commit()
    return jsonify(message="User registered."), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        session['username'] = user.username
        return jsonify(message="Login succeeded."), 200
    else:
        return jsonify(message="Wrong username or password."), 400

@app.route('/user/<username>', methods=['GET'])
def get_user(username):
    user = User.query.filter_by(username=username).first()
    if user:
        return jsonify(
            username=user.username, 
            contributions=user.profile.contributions,
            name=user.profile.name,
            email=user.profile.email
        )
    else:
        return jsonify(message="User not found."), 404

@app.route('/user/<username>', methods=['PUT'])
def update_user(username):
    if 'username' in session and session['username'] == username:
        data = request.get_json()
        user = User.query.filter_by(username=username).first()
        if user:
            user.profile.contributions = data.get('contributions', user.profile.contributions)
            user.profile.name = data.get('name', user.profile.name)
            user.profile.email = data.get('email', user.profile.email)
            db.session.commit()
            return jsonify(message="User updated."), 200
        else:
            return jsonify(message="User not found."), 404
    else:
        return jsonify(message="Not authorized."), 403

@app.route('/api/saved_searches', methods=['POST'])
def save_search():
    data = request.get_json()
    new_search = SavedSearch(
        user_id=User.query.filter_by(username=data['username']).first().id,  # assuming the username is sent in the request
        case_id=data['case_id'],
        query=data['query']
    )
    db.session.add(new_search)
    db.session.commit()
    return jsonify(message="Search saved successfully."), 201

@app.route('/api/cases/<int:case_id>/saved_searches', methods=['GET'])
def get_saved_searches(case_id):
    searches = SavedSearch.query.filter(SavedSearch.case_id == case_id).all()
    return jsonify(saved_searches=[{
        'query': search.query,
        'timestamp': search.timestamp
    } for search in searches]), 200

def get_person_name(case_id):
    try:
        with open(f'json_cases/{case_id}.json', 'r') as f:
            case_json = json.load(f)
            return {'firstName': case_json['subjectIdentification']['firstName'], 'lastName': case_json['subjectIdentification']['lastName']}
    except FileNotFoundError:
        return {'firstName': 'Unknown', 'lastName': 'Unknown'}

@app.route('/search', methods=['POST'])
def search_route():
    data = request.json
    if 'query' not in data:
        return jsonify(error='No query provided in the request body.'), 400

    results = search.search_with_text_clip(data['query'])

    # Transforming results into list of dictionaries
    results = [{'case_id': case_id, 'image_id': image_id, 'first_name': get_person_name(case_id)['firstName'], 'last_name': get_person_name(case_id)['lastName']} for case_id, image_id in results['case_ids']]

    # save the search if it's related to a case
    if 'case_id' in data and 'username' in data:
        new_search = SavedSearch(
            user_id=User.query.filter_by(username=data['username']).first().id,  # assuming the username is sent in the request
            case_id=data['case_id'],
            query=data['query']
        )
        db.session.add(new_search)
        db.session.commit()

    return jsonify(results)  # Wrap results in jsonify

@app.route('/search_by_image', methods=['POST'])
def search_by_image():
    if 'file' not in request.files:
        return jsonify(error='No file part in the request.'), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(error='No selected file in the request.'), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(tempfile.gettempdir(), filename)
        file.save(filepath)
        results = search.search_with_image_clip(filepath)
        os.remove(filepath)

        # Transforming results into list of dictionaries
        results = [{'case_id': result['case_id'], 'case_json': result['case_json'], 'first_name': get_person_name(result['case_id'])['firstName'], 'last_name': get_person_name(result['case_id'])['lastName']} for result in results]

        return jsonify(results)  # Wrap results in jsonify

@app.route('/case/<int:case_id>', methods=['GET'])
def get_case(case_id):
    try:
        with open(f'json_cases/{case_id}.json', 'r') as f:
            case_json = json.load(f)
            return jsonify(case_json), 200
    except FileNotFoundError:
        return jsonify(message="Case not found."), 404

@app.route('/cases', methods=['GET'])
def get_cases():
    cases = search.load_all_cases()  # Connect with back end search.py
    return jsonify(cases), 200

@app.route('/case/<int:case_id>/comments', methods=['GET', 'POST'])
def case_comments(case_id):
    if request.method == 'GET':
        comments = Discussion.query.filter_by(case_id=case_id).all()
        return jsonify(comments=[comment.text for comment in comments])
    elif request.method == 'POST':
        data = request.get_json()
        user_id = User.query.filter_by(username=data['username']).first().id  # assuming the username is sent in the request
        new_comment = Discussion(case_id=case_id, user_id=user_id, text=data['comment'])
        db.session.add(new_comment)
        db.session.commit()
        return jsonify(comment=new_comment.text), 201

@app.route('/api/CaseSets/NamUs/MissingPersons/Cases/<int:case_id>/Images/<int:image_id>/Original', methods=['GET'])
def serve_image(case_id, image_id):
    # find a way to determine the filename based on the case_id and image_id.
    filename = f"{case_id}_{image_id}.jpg"
    return send_from_directory('case_images', filename)

if __name__ == '__main__':
    # search = Search(Clipper()) For running the application locally
    app.run(host='0.0.0.0', port=5000)
