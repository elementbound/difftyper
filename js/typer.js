// Some array utils
if(!Array.prototype.empty)
    Array.prototype.empty = function() {
        return this.length == 0;
    }

// Convert words per minute into timeout between key presses
function wpm(w) {
    return 1000 / (w * 5 / 60);
}

class Typer {
    constructor() {
        // Set defaults for most
        this.clear();
    }

    clear() {
        this.lines = [];
        this.ops = [];

        this._at = 0;
        this._op = undefined;
        this._state = 'stop';
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
        let ops = [];

        // Preprocess diff
        // 1. Begin add mode - newline, go up
        // 2. Add - just type everything
        // 3. End add mode - go down

        for(let i = 0; i < diffs.length; i++) {
            let op = diffs[i];

            if(i == 0) {
                ops.push(op)
                continue;
            }

            let prevop = diffs[i-1];
            let nextop = diffs[i+1] || ['', ''];

            if(op[0] == 'add' && prevop[0] != 'add')
                ops.push(['add-begin']);

            ops.push(op);

            if(op[0] == 'add' && nextop[0] != 'add')
                ops.push(['add-end']);
        }

        this.ops.push(...ops);
    }

    run(rest = wpm(400)) {
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

        if(highlight == 'debug') {
            let lines = this.lines.slice();
            lines[this._at] = '[' + lines[this._at] + ']';
            $(this).trigger('present', [lines]);
        }
        else if(highlight == 'pipe') {
            let lines = this.lines.slice(); // Duplicate
            lines[this._at] += '|';

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
            this.rmline();
            this._op_consume();
        }
        else if(op[0] == 'add-begin') {
            this.newline();
            this._at--;
            this._op_consume();
        }
        else if(op[0] == 'add') {
            while(true) {
                let c = op[1].charAt(0);
                op[1] = op[1].slice(1);

                this.lines[this._at] += c;

                // Encountered something that is not a whitespace;
                // stop typing for this frame
                if(!/\s+/.test(c))
                    break;
            }

            if(!op[1])
                this._op_consume();
        }
        else if(op[0] == 'add-end') {
            this.rmline();
            this.skipline();
            this._op_consume();
        }
        else if(op[0] == 'skip') {
            this.skipline();
            this._op_consume();
        }
        else if(op[0] == 'break') {
            this.pause();
            $(this).trigger('break', [op[1]]);
            this._op_consume();
        }
    }

    _op_finish(op) {
        if(op[0] == 'add') {
            this.newline();
        }
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
                ret.push(['del']);
            else if (line.startsWith('@@')) {
                let p = /@@\s*-(\d+),(\d+)\s*\+(\d+),(\d+)\s*@@/i;
                console.log('Hunk matches:', p.exec(line));

                let at = p.exec(line)[1];
                at = parseInt(at) - 1;
                at = Math.max(0, at); // clamp just in case

                ret.push(['jumpto', at]);
            } else if (line.startsWith(' '))
                ret.push(['skip']);
            else if (line.startsWith('!b')) {
                let val = /b(.*)/.exec(line)[1];
                ret.push(['break', val]);
            }
            else
                ret.push(['skip']); // Skip unknown lines
        }

        return ret;
    }
}
