class Commit {
    constructor(text=undefined) {
        this.hash = '';
        this.author = '';
        this.date = '';
        this.message = '';
        this.files = [];
        this.data = '';

        if(text) {
            let p_hash = /commit\s+(.+)/g;
            let p_author = /Author:\s+(.+)/g;
            let p_date = /Date:\s+(.+)/g;

            let lines = text.split(/\n|\r\n/);

            this.hash = p_hash.exec(lines[0])[1];
            this.author = p_author.exec(lines[1])[1];
            this.date = p_date.exec(lines[2])[1];

            let i;
            for(i = 4; true; i++) {
                let line = lines[i];

                if(line.trim())
                    this.message += line + '\n';
                else
                    break;
            }

            // Try to extract all file diffs
            let p = /diff\s*(\-\-git)?\sa\/(.+) b\/(.+)/;
            for(; i < lines.length; i++) {
                let m = p.exec(lines[i]);

                if(!m)
                    continue;

                let filename = m[2];

                let j = i;
                for(; j < lines.length; ++j) {
                    // Specifically ignore
                    // --- a/...
                    // +++ b/...
                    // lines because these could match against the second regex
                    if(/^\+{3}|\-{3}/.test(lines[j]))
                        continue;

                    // Found first line with valid diff
                    if(/^[ \-\+@]/.test(lines[j]))
                        break;
                }

                let filediff = [];
                for(; j < lines.length; ++j)
                    if(/^[ \-\+@]/.test(lines[j]))
                        filediff.push(lines[j]);
                    else
                        break;

                this.files.push({
                    name: filename,
                    diff: filediff.join('\n')
                });

                i = j;
            }
        }
    }
}
