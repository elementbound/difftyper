// Convert words per minute into timeout between key presses
function wpm(w) {
    return 1000 / (w * 5 / 60);
}

class Typer {
    constructor() {
        // Set defaults for most
        this.clear();

        this.breaks_enabled = false;
    }

    clear() {
        this.lines = [];
        this.ops = [];

        this._at = 0;
        this._op = undefined;
        this._state = 'stop';
    }

    setlines(content) {
        this.lines = content.split(/\n|\r\n/);
    }

    newline() {
        if(this.lines.empty()) {
            this.lines.push('');
            this._at = 0;
        }
        else {
            this._at++;
            this.lines.splice(this._at, 0, '');
        }
    }

    skipline() {
        this._at++;
        if(this.lines[this._at] == undefined)
            this.lines[this._at] = '';
    }

    rmline() {
        this.lines.splice(this._at, 1);
        this._at = Math.min(this._at, this.lines.length-1);
    }

    add_diff(diffstr) {
        let diffs = Typer.parse_diff(diffstr);
        this.ops.push(...diffs);
    }

    run(rest = 1000/2) {
        this._state = 'run';

        var f = function() {
            if(this._state == 'run')
                if(!this.type())
                    this._state = 'stop';

            if(this._state == 'run' || this._state == 'pause')
                setTimeout(f, rest);
            else
                $(this).trigger('finish');
        }

        f = f.bind(this);
        f();
    }

    pause() {
        if(this._state == 'run') {
            this._state = 'pause';
            $(this).trigger('pause');
        }
    }

    continue() {
        if(this._state == 'pause') {
            this._state = 'run';
            $(this).trigger('continue');
        }
    }

    stop() {
        this._state = 'stop';
    }

    is_running() {
        return this._state == 'run';
    }

    is_stopped() {
        return this._state == 'stop';
    }

    is_paused() {
        return this._state == 'pause';
    }

    type() {
        if(this._op == undefined) {
            if(this.ops.empty())
                return false;
            else {
                this._op = this.ops.shift();
                this._op_begin(this._op);
            }
        }

        this._op_do(this._op);

        let highlight = 'pipe';

        if(highlight == 'bracket') {
            let lines = this.lines.slice();
            lines[this._at] = '[' + lines[this._at] + ']';
            $(this).trigger('present', [lines]);
        }
        else if(highlight == 'pipe') {
            let lines = this.lines.slice(); // Duplicate
            lines[this._at] = lines[this._at] ? lines[this._at] + '|' : '|';

            $(this).trigger('present', [lines]);
        }
        else
            $(this).trigger('present', [this.lines]);

        return true;
    }

    _op_begin(op) {
        console.log(op);
    }

    _op_do(op) {
        if(op[0] == 'jumpto') {
            this._at = op[1];
            this._op_consume();
        }
        else if(op[0] == 'del') {
            if(this.lines[this._at] != op[1]) {
                console.error('[del]', this.lines[this._at], '!=', op[1]);
                this.ops = [];
                this._op_consume();
                return false;
            }

            this.rmline();
            this._op_consume();
        }
        else if(op[0] == 'add') {
            if(this._at >= this.lines.length) {
                this._at++;
                this.lines.splice(this._at, 0, op[1]);
            } else {
                this.lines.splice(this._at, 0, op[1]);
                this._at++;
            }
            this._op_consume();
        }
        else if(op[0] == 'skip') {
            if(this.lines[this._at] != op[1]) {
                // Find closest match
                let range = 3;
                let closest_dst = range + 1;
                let closest_idx = this._at;
                let closest_found = false;

                for(let i = this._at - range; i < this._at + range; ++i) {
                    if(this.lines[i] == op[1])
                        if(Math.abs(i - this._at) < closest_dst) {
                            closest_dst = Math.abs(i - this._at);
                            closest_idx = i;
                            closest_found = true;
                        }
                }

                this._at = closest_idx;

                if(!closest_found) {
                    console.error("Couldn't find matching context line");
                    console.error("Current line:", this._at);
                    console.error("Context line:", op[1]);

                    this._op_consume();
                    this.ops = [];
                    return false;
                }
                else {
                    console.log("Found context line, distance is", closest_dst);
                }
            }

            this.skipline();
            this._op_consume();
        }
        else if(op[0] == 'break') {
            if(this.breaks_enabled) {
                this.pause();
                $(this).trigger('break', [op[1]]);
            }

            this._op_consume();
        }
    }

    _op_finish(op) {
        // pass
    }

    _op_consume() {
        this._op_finish(this._op);
        this._op = undefined;
    }

    static parse_diff(diffstr) {
        let ret = [];
        let difflines = diffstr.split(/\n|\r\n/);

        console.log('Diff string is:\n', difflines);

        for (let i = 0; i < difflines.length; i++) {
            let line = difflines[i];

            if (line.startsWith('+'))
                ret.push(['add', line.slice(1)]);
            else if (line.startsWith('-'))
                ret.push(['del', line.slice(1)]);
            else if (line.startsWith('@@')) {
                let p = /@@\s*-(\d+),(\d+)\s*\+(\d+),(\d+)\s*@@/i;
                console.log('Hunk matches:', p.exec(line));

                let at = p.exec(line)[3];
                at = parseInt(at) - 1;
                at = Math.max(0, at); // clamp just in case

                ret.push(['jumpto', at]);
            } else if (line.startsWith(' '))
                ret.push(['skip', line.slice(1)]);
            else if (line.startsWith('!b')) {
                let val = /b(.*)/.exec(line)[1];
                ret.push(['break', val]);
            }
            else {
                ret.push(['skip', line]); // Skip unknown lines
                console.log('Weird line, assuming skip:', line);
            }
        }

        return ret;
    }
}
