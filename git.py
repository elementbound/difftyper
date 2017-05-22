import subprocess

class Git:
    def __init__(self, at):
        """
        Init a git instance in the given directory. All functions will use this directory.
        """
        self.directory = str(at) # Accept pathlike objects
        self.command = 'git'

        # Check if we're in a git repo's directory
        r = self.call('rev-parse', '--git-dir')

        if r.returncode != 0:
            raise ValueError('{0} is not a git repository!'.format(at))

    def call(self, *args):
        """
        Call git with the given command line arguments.
        """
        r = subprocess.run([self.command] + list(args),
                            stdout = subprocess.PIPE,
                            stderr = subprocess.PIPE,
                            cwd = self.directory)

        # Passing encoding throws an unexpected kwarg error, so here's a workaround
        r.stdout = r.stdout.decode('utf-8')
        r.stderr = r.stderr.decode('utf-8')

        return r

    def commits(self):
        """
        List all commits on the current branch of the repository
        """

        r = self.call('rev-list', 'HEAD')
        return r.stdout.split()[::-1]

    def show(self, commit, format='medium'):
        """
        Get diff for a given commit.
        ( git show <commit> )
        """
        r = self.call('show', commit, '--format='+format)
        return r.stdout
