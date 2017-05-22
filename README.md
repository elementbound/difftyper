# difftyper #

``difftyper`` is a visualization tool made for the heck of it. The aim is to query a git repo's
history and type it out in a browser, in front of the user's eyes.

Kind of like a timelapse or tool-assisted speedrun for code.

## Currently ##

So far, two features work and they are not integrated at all.

There's ``typer.js`` which takes a diff text ( produced by git ) and types out the lines.
Actually, it just puts there everything line by line, typing will be done later.

Then we have ``tree.js`` which represents the repo's file tree. Files can be added and removed
from it as the project history moves on.

``commit.js`` can parse the whole output of ``git show <COMMIT> --format=medium``. It stores
general commit data ( author, hash, etc. ) and changes for each file. 
