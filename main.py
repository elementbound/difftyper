import flask
import json
from pathlib import Path
from git import Git

app = flask.Flask('difftyper')

@app.route('/')
def index():
    return page('index')

@app.route('/<what>')
def page(what):
    mapping = {
        'index': 'index.html',

        'type': 'type.html',
        'tree': 'tree.html',
        'commit': 'commit.html'
    }

    page = 'index.html'
    try:
        page = mapping[what]
    except KeyError:
        pass

    return flask.render_template(page, pages=mapping.keys())

@app.route('/api/git/commits/<path:path>')
def git_commits(path):
    try:
        git = Git(path)
        return json.dumps({'commits': git.commits()}, indent=4)
    except:
        return json.dumps({'error': True})

@app.route('/api/git/show/<commit>/<path:path>')
def git_show(commit, path):
    try:
        git = Git(path)
        return json.dumps({'commit': git.show(commit)}, indent=4)
    except:
        return json.dumps({'error': True})

@app.route('/js/<path:path>')
def serve_js(path):
    return flask.send_from_directory('js', path)

@app.route('/css/<path:path>')
def serve_css(path):
    return flask.send_from_directory('css', path)

@app.route('/fonts/<path:path>')
def serve_font(path):
    return flask.send_from_directory('fonts', path)

# Simplified run
if __name__ == '__main__':
    import sys
    import os
    import subprocess

    if 'run' in sys.argv:
        env = os.environ.copy()
        env['FLASK_APP'] = 'main.py'
        if 'debug' in sys.argv:
            env['FLASK_DEBUG'] = 'True'

        subprocess.run(['flask', 'run'], env=env)
